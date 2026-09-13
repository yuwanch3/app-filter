package com.appfilter.accessibility

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.content.Intent
import android.os.Build
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import com.appfilter.filter.KeywordFilter
import com.appfilter.service.FilterForegroundService
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.modules.core.DeviceEventManagerModule
import android.graphics.Rect

class AppFilterAccessibilityService : AccessibilityService() {
    private var reactContext: ReactContext? = null
    private var isRunning = AtomicBoolean(false)
    private val keywordFilter = KeywordFilter()
    private var lastEventTime = 0L
    private var processedNodes = mutableSetOf<String>()

    companion object {
        private const val DEBOUNCE_MS = 200L
        private val TARGET_PACKAGES = setOf(
            "com.google.android.youtube", "com.instagram.android",
            "com.zhiliaoapp.musically", "com.twitter.android"
        )
    }

    fun setReactContext(context: ReactContext) { this.reactContext = context }

    override fun onServiceConnected() {
        super.onServiceConnected()
        serviceInfo = AccessibilityServiceInfo().apply {
            eventTypes = AccessibilityEvent.TYPES_ALL_MASK
            feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC
            flags = AccessibilityServiceInfo.FLAG_REPORT_VIEW_IDS or
                    AccessibilityServiceInfo.FLAG_REQUEST_ENHANCED_WEB_ACCESSIBILITY or
                    AccessibilityServiceInfo.FLAG_RETRIEVE_INTERACTIVE_WINDOWS or
                    AccessibilityServiceInfo.FLAG_INCLUDE_NOT_IMPORTANT_VIEWS
            notificationTimeout = 100
        }
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
                event.source?.let { s ->
                    s.text?.toString()?.takeIf { it.isNotEmpty() }?.let { checkAndFilterText(it, packageName, "search_input", null) }
                    s.recycle()
                }
            }
            AccessibilityEvent.TYPE_VIEW_CLICKED -> {
                event.source?.let { s ->
                    s.text?.toString()?.takeIf { it.isNotEmpty() }?.let { checkAndFilterText(it, packageName, "clicked", null) }
                    s.contentDescription?.toString()?.takeIf { it.isNotEmpty() }?.let { checkAndFilterText(it, packageName, "clicked_desc", null) }
                    s.recycle()
                }
            }
        }
    }

    private fun captureUIContent(node: AccessibilityNodeInfo, packageName: String) {
        if (processedNodes.contains(node.viewIdResourceName)) return
        processedNodes.add(node.viewIdResourceName ?: "")
        if (processedNodes.size > 1000) processedNodes.clear()
        val text = node.text?.toString() ?: node.contentDescription?.toString() ?: ""
        if (text.isNotEmpty()) checkAndFilterText(text, packageName, "ui_element", node)
        for (i in 0 until node.childCount) {
            node.getChild(i)?.let { child ->
                captureUIContent(child, packageName); child.recycle()
            }
        }
    }

    private fun checkAndFilterText(text: String, packageName: String, source: String, node: AccessibilityNodeInfo?) {
        if (keywordFilter.matches(text)) {
            sendToJS("keyword_match", mapOf(
                "text" to text, "packageName" to packageName, "source" to source,
                "matchedKeyword" to keywordFilter.getMatchedKeyword(text) ?: "",
                "bounds" to node?.let {
                    val bounds = Rect()
                    node.getBoundsInScreen(bounds)
                    mapOf("x" to bounds.left, "y" to bounds.top,
                        "width" to bounds.right - bounds.left,
                        "height" to bounds.bottom - bounds.top)
                }
            ))
            node?.let { performHideAction(it) }
        }
    }

    private fun performHideAction(node: AccessibilityNodeInfo) {
        try {
            val bounds = Rect()
            node.getBoundsInScreen(bounds)
            val b = bounds
            startActivity(Intent(this, OverlayActivity::class.java).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                putExtra("left", b.left); putExtra("top", b.top)
                putExtra("width", b.right - b.left); putExtra("height", b.bottom - b.top)
                putExtra("packageName", node.packageName?.toString() ?: "")
            })
        } catch (e: Exception) { sendToJS("error", mapOf("message" to "Overlay failed: ${e.message}")) }
    }

    override fun onInterrupt() { isRunning.set(false) }
    override fun onDestroy() { isRunning.set(false); reactContext = null; super.onDestroy() }
    override fun onUnbind(intent: Intent?): Boolean { isRunning.set(false); return super.onUnbind(intent) }

    private fun startForegroundService() {
        val intent = Intent(this, FilterForegroundService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) startForegroundService(intent)
        else startService(intent)
    }

    private fun sendToJS(eventName: String, data: Map<String, Any?>) {
        reactContext?.let { ctx ->
            val params = Arguments.createMap()
            data.forEach { (k, v) ->
                when (v) {
                    is String -> params.putString(k, v)
                    is Int -> params.putInt(k, v)
                    is Boolean -> params.putBoolean(k, v)
                    is Double -> params.putDouble(k, v)
                    is Map<*, *> -> {
                        val m = Arguments.createMap()
                        @Suppress("UNCHECKED_CAST") (v as Map<String, Any>).forEach { (k2, v2) ->
                            when (v2) { is String -> m.putString(k2, v2); is Int -> m.putInt(k2, v2); is Double -> m.putDouble(k2, v2); is Boolean -> m.putBoolean(k2, v2) }
                        }; params.putMap(k, m)
                    }
                }
            }
            ctx.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java).emit("AccessibilityEvent", params)
        }
    }
}