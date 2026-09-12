package com.appfilter.accessibility

import android.content.Intent
import android.provider.Settings
import com.facebook.react.bridge.*

class AppFilterModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private var accessibilityService: AppFilterAccessibilityService? = null

    init {
        reactContext.addLifecycleEventListener(object : LifecycleEventListener {
            override fun onHostResume() {}
            override fun onHostPause() {}
            override fun onHostDestroy() { accessibilityService = null }
        })
    }

    override fun getName(): String = "AppFilterModule"

    @ReactMethod
    fun initialize(promise: Promise) {
        try {
            if (currentActivity != null) promise.resolve(true)
            else promise.reject("NO_ACTIVITY", "Activity not available")
        } catch (e: Exception) { promise.reject("ERROR", e.message) }
    }

    @ReactMethod
    fun isAccessibilityServiceEnabled(promise: Promise) {
        try {
            val context = reactApplicationContext
            val service = "${context.packageName}/.accessibility.AppFilterAccessibilityService"
            val enabledServices = Settings.Secure.getString(
                context.contentResolver,
                Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
            ) ?: ""
            promise.resolve(enabledServices.contains(service))
        } catch (e: Exception) { promise.reject("ERROR", e.message) }
    }

    @ReactMethod
    fun openAccessibilitySettings(promise: Promise) {
        try {
            val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            reactApplicationContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) { promise.reject("ERROR", e.message) }
    }

    @ReactMethod
    fun updateKeywords(keywords: ReadableArray, promise: Promise) {
        try {
            com.appfilter.filter.KeywordFilter().updateKeywords(
                (0 until keywords.size()).map { keywords.getString(it) }
            )
            promise.resolve(true)
        } catch (e: Exception) { promise.reject("ERROR", e.message) }
    }

    @ReactMethod
    fun sendOverlayCommand(left: Int, top: Int, width: Int, height: Int, packageName: String, promise: Promise) {
        try {
            val activity = currentActivity
            if (activity != null) {
                val intent = Intent(activity, OverlayActivity::class.java).apply {
                    putExtra("left", left); putExtra("top", top)
                    putExtra("width", width); putExtra("height", height)
                    putExtra("packageName", packageName)
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                activity.startActivity(intent)
                promise.resolve(true)
            } else promise.reject("NO_ACTIVITY", "Activity not available")
        } catch (e: Exception) { promise.reject("ERROR", e.message) }
    }

    fun setAccessibilityService(service: AppFilterAccessibilityService) {
        this.accessibilityService = service
        service.setReactContext(reactApplicationContext)
    }
}