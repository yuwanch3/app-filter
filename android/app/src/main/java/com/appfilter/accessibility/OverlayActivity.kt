package com.appfilter.accessibility

import android.app.Activity
import android.content.Intent
import android.graphics.PixelFormat
import android.os.Build
import android.os.Bundle
import android.view.Gravity
import android.view.ViewGroup
import android.view.WindowManager
import android.widget.TextView
import com.appfilter.app.R

class OverlayActivity : Activity() {

    private lateinit var windowManager: WindowManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        windowManager = getSystemService(WINDOW_SERVICE) as WindowManager

        val left = intent.getIntExtra("left", 0)
        val top = intent.getIntExtra("top", 0)
        val width = intent.getIntExtra("width", 200)
        val height = intent.getIntExtra("height", 100)
        val packageName = intent.getStringExtra("packageName") ?: ""

        val params = WindowManager.LayoutParams(
            width,
            height,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            else
                WindowManager.LayoutParams.TYPE_PHONE,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                    WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
                    WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            x = left
            y = top
        }

        val overlay = TextView(this).apply {
            text = "🔒 Difilter"
            setTextColor(0xFFFFFFFF.toInt())
            setBackgroundColor(0xCC1E293B.toInt())
            gravity = Gravity.CENTER
            textSize = 12f
        }

        windowManager.addView(overlay, params)
        overlay.postDelayed({ finish() }, 3000)
    }

    override fun onDestroy() {
        super.onDestroy()
    }
}