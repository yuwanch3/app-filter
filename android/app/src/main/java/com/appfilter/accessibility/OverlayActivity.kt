package com.appfilter.accessibility
import android.app.Activity; import android.graphics.PixelFormat; import android.os.Build; import android.os.Bundle; import android.os.Handler; import android.os.Looper; import android.view.Gravity; import android.view.WindowManager; import android.widget.TextView
class OverlayActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val wm = getSystemService(WINDOW_SERVICE) as WindowManager
        val l = intent.getIntExtra("left", 0); val t = intent.getIntExtra("top", 0)
        val w = intent.getIntExtra("width", 200); val h = intent.getIntExtra("height", 100)
        val p = WindowManager.LayoutParams(w, h,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY else WindowManager.LayoutParams.TYPE_PHONE,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL,
            PixelFormat.TRANSLUCENT).apply { gravity = Gravity.TOP or Gravity.START; x = l; y = t }
        wm.addView(TextView(this).apply { text = "🔒 Difilter"; setTextColor(0xFFFFFFFF.toInt()); setBackgroundColor(0xCC1E293B.toInt()); gravity = Gravity.CENTER; textSize = 12f }, p)
        Handler(Looper.getMainLooper()).postDelayed({ finish() }, 3000)
    }
}