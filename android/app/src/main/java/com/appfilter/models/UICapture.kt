package com.appfilter.models

import android.view.accessibility.AccessibilityNodeInfo

data class UICapture(
    val packageName: String,
    val text: String?,
    val contentDescription: String?,
    val viewId: String?,
    val boundsLeft: Int, val boundsTop: Int, val boundsRight: Int, val boundsBottom: Int,
    val isClickable: Boolean, val isEnabled: Boolean, val childCount: Int
) {
    companion object {
        fun fromNode(node: AccessibilityNodeInfo, packageName: String): UICapture {
            val bounds = android.graphics.Rect()
            node.getBoundsInScreen(bounds)
            return UICapture(
                packageName = packageName,
                text = node.text?.toString(),
                contentDescription = node.contentDescription?.toString(),
                viewId = node.viewIdResourceName,
                boundsLeft = bounds.left, boundsTop = bounds.top,
                boundsRight = bounds.right, boundsBottom = bounds.bottom,
                isClickable = node.isClickable, isEnabled = node.isEnabled,
                childCount = node.childCount
            )
        }
    }
}