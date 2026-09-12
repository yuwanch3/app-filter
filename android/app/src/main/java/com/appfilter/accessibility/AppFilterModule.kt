package com.appfilter.accessibility
import android.content.Intent; import android.provider.Settings
import com.facebook.react.bridge.*

class AppFilterModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String = "AppFilterModule"
    @ReactMethod fun initialize(p: Promise) { try { p.resolve(true) } catch (e: Exception) { p.reject("ERROR", e.message) } }
    @ReactMethod
    fun isAccessibilityServiceEnabled(p: Promise) {
        try {
            val s = "${reactApplicationContext.packageName}/.accessibility.AppFilterAccessibilityService"
            p.resolve((Settings.Secure.getString(reactApplicationContext.contentResolver, Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES) ?: "").contains(s))
        } catch (e: Exception) { p.reject("ERROR", e.message) }
    }
    @ReactMethod fun openAccessibilitySettings(p: Promise) {
        try { reactApplicationContext.startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply { addFlags(Intent.FLAG_ACTIVITY_NEW_TASK) }); p.resolve(true) }
        catch (e: Exception) { p.reject("ERROR", e.message) }
    }
    @ReactMethod fun updateKeywords(keywords: ReadableArray, p: Promise) {
        try { com.appfilter.filter.KeywordFilter().updateKeywords((0 until keywords.size()).map { keywords.getString(it) }); p.resolve(true) }
        catch (e: Exception) { p.reject("ERROR", e.message) }
    }
    @ReactMethod
    fun sendOverlayCommand(left: Int, top: Int, width: Int, height: Int, packageName: String, p: Promise) {
        try {
            currentActivity?.let { a ->
                a.startActivity(Intent(a, OverlayActivity::class.java).apply {
                    putExtra("left", left); putExtra("top", top); putExtra("width", width); putExtra("height", height)
                    putExtra("packageName", packageName); addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }); p.resolve(true)
            } ?: p.reject("NO_ACTIVITY", "Activity not available")
        } catch (e: Exception) { p.reject("ERROR", e.message) }
    }
    fun setAccessibilityService(service: AppFilterAccessibilityService) { service.setReactContext(reactApplicationContext) }
}