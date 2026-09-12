package com.appfilter.accessibility

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.content.Intent
import android.os.Build
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import android.view.accessibility.AccessibilityWindowInfo
import com.appfilter.filter.KeywordFilter
import com.appfilter.models.UICapture
import com.appfilter.service.FilterForegroundService
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.util.concurrent.atomic.AtomicBoolean

class AppFilterAccessibilityService : AccessibilityService() {

    private var reactContext: ReactContext? = null
    private var isRunning = AtomicBoolean(false)
    private val keywordFilter = KeywordFilter()
    private var lastEventTime = 0L
    private var processedNodes = mutableSetOf<String>()

    companion object {
        private const val DEBOUNCE_MS = 200L
        private val TARGET_PACKAGES = setOf(
            "com.google.android.youtube",
            "com.instagram.android",
            "com.zhiliaoapp.musically",
            "com.twitter.android"
        )
    }

    fun setReactContext(context: ReactContext) {
        this.reactContext = context
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        val info = AccessibilityServiceInfo().apply {
            eventTypes = AccessibilityEvent.TYPES_ALL_MASK
            feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC
            flags = AccessibilityServiceInfo.FLAG_REPORT_VIEW_IDS or
                    AccessibilityServiceInfo.FLAG_REQUEST_ENHANCED_WEB_ACCESSIBILITY or
                    AccessibilityServiceInfo.FLAG_RETRIEVE_INTERACTIVE_WINDOWS or
                    AccessibilityServiceInfo.FLAG_INCLUDE_NOT_IMPORTANT_VIEWS
            notificationTimeout = 100
        }
        serviceInfo = info
        isRunning.set(true)

        startForegroundService()
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent) {
        if (!isRunning.get()) return

        val packageName = event.packageName?.toString() ?: return
        if (packageName !in TARGET_PACKAGES) return

        val now = System.currentTimeMillis()
        if (now - lastEventTime < DEBOUNCE_MS) return
        lastEventTime = now

        processEvent(event, packageName)
    }

    private fun processEvent(event: AccessibilityEvent, packageName: String) {
        when (event.eventType) {
            AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED,
            AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED,
            AccessibilityEvent.TYPE_VIEW_SCROLLED -> {
                val root = rootInActiveWindow ?: return
                captureUIContent(root, packageName)
                root.recycle()
            }
            AccessibilityEvent.TYPE_VIEW_TEXT_CHANGED -> {
                event.source?.let { source ->
                    val text = source.text?.toString() ?: ""
                    if (text.isNotEmpty()) {
                        checkAndFilterText(text, packageName, "search_input", null)
                    }
                    source.recycle()
                }
            }
            AccessibilityEvent.TYPE_VIEW_CLICKED -> {
                event.source?.let { source ->
                    val text = source.text?.toString() ?: ""
                    val contentDesc = source.contentDescription?.toString() ?: ""
                    if (text.isNotEmpty()) {
                        checkAndFilterText(text, packageName, "clicked", null)
                    }
                    if (contentDesc.isNotEmpty()) {
                        checkAndFilterText(contentDesc, packageName, "clicked_desc", null)
                    }
                    source.recycle()
                }
            }
        }
    }

    private fun captureUIContent(node: AccessibilityNodeInfo, packageName: String) {
        if (processedNodes.contains(node.viewIdResourceName)) return
        processedNodes.add(node.viewIdResourceName ?: "")

        if (processedNodes.size > 1000) {
            processedNodes.clear()
        }

        val text = node.text?.toString()
        val contentDesc = node.contentDescription?.toString()
        val displayText = text ?: contentDesc ?: ""

        if (displayText.isNotEmpty()) {
            checkAndFilterText(displayText, packageName, "ui_element", node)
        }

        for (i in 0 until node.childCount) {
            node.getChild(i)?.let { child ->
                captureUIContent(child, packageName)
                child.recycle()
            }
        }
    }

    private fun checkAndFilterText(
        text: String,
        packageName: String,
        source: String,
        node: AccessibilityNodeInfo?
    ) {
        if (keywordFilter.matches(text)) {
            val match = keywordFilter.getMatchedKeyword(text) ?: ""
            sendToJS("keyword_match", mapOf(
                "text" to text,
                "packageName" to packageName,
                "source" to source,
                "matchedKeyword" to match,
                "bounds" to if (node != null) mapOf(
                    "x" to node.boundsInScreen.left,
                    "y" to node.boundsInScreen.top,
                    "width" to (node.boundsInScreen.right - node.boundsInScreen.left),
                    "height" to (node.boundsInScreen.bottom - node.boundsInScreen.top)
                ) else null
            ))

            node?.let { performHideAction(it) }
        }
    }

    private fun performHideAction(node: AccessibilityNodeInfo) {
        try {
            val bounds = node.boundsInScreen
            val overlayIntent = Intent(this, OverlayActivity::class.java).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                putExtra("left", bounds.left)
                putExtra("top", bounds.top)
                putExtra("width", bounds.right - bounds.left)
                putExtra("height", bounds.bottom - bounds.top)
                putExtra("packageName", node.packageName?.toString() ?: "")
            }
            startActivity(overlayIntent)
        } catch (e: Exception) {
            sendToJS("error", mapOf("message" to "Overlay failed: ${e.message}"))
        }
    }

    override fun onInterrupt() {
        isRunning.set(false)
    }

    override fun onDestroy() {
        isRunning.set(false)
        reactContext = null
        super.onDestroy()
    }

    override fun onUnbind(intent: Intent?): Boolean {
        isRunning.set(false)
        return super.onUnbind(intent)
    }

    private fun startForegroundService() {
        val intent = Intent(this, FilterForegroundService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(intent)
        } else {
            startService(intent)
        }
    }

    private fun sendToJS(eventName: String, data: Map<String, Any?>) {
        reactContext?.let { ctx ->
            val params = Arguments.createMap()
            data.forEach { (key, value) ->
                when (value) {
                    is String -> params.putString(key, value)
                    is Int -> params.putInt(key, value)
                    is Boolean -> params.putBoolean(key, value)
                    is Double -> params.putDouble(key, value)
                    is Map<*, *> -> {
                        val map = Arguments.createMap()
                        @Suppress("UNCHECKED_CAST")
                        (value as Map<String, Any>).forEach { (k, v) ->
                            when (v) {
                                is String -> map.putString(k, v)
                                is Int -> map.putInt(k, v)
                                is Double -> map.putDouble(k, v)
                                is Boolean -> map.putBoolean(k, v)
                            }
                        }
                        params.putMap(key, map)
                    }
                }
            }
            ctx.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit("AccessibilityEvent", params)
        }
    }
}