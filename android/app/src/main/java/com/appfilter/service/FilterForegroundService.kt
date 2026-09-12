package com.appfilter.service
import android.app.PendingIntent; import android.app.Service; import android.content.Intent; import android.os.Build; import android.os.IBNBR
import androidx.core.app.NotificationCompat
class FilterForegroundService : Service() {
    companion object { const val CHANNEL_ID = "appfilter_filter_channel"; const val NOTIFICATION_ID = 1001 }
    override fun onCreate() {
        super.onCreate()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            (getSystemService(NOTIFICATION_SERVICE) as android.app.NotificationManager).createNotificationChannel(
                android.app.NotificationChannel(CHANNEL_ID, "AppFilter Aktif", android.app.NotificationManager.IMPORTANCE_LOW).apply {
                    description = "Notifikasi layar filter konten aktif"; setShowBadge(false)
                }
            )
        }
    }
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        startForeground(NOTIFICATION_ID, NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("AppFilter Aktif").setContentText("Melindungi dari konten sensitif")
            .setSmallIcon(android.R.drawable.ic_lock_idle_lock)
            .setContentIntent(PendingIntent.getActivity(this, 0, Intent(this, com.appfilter.app.MainActivity::class.java), PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE))
            .setOngoing(true).setPriority(NotificationCompat.PRIORITY_LOW).build())
        return START_STICKY
    }
    override fun onBind(intent: Intent?): IBinder? = null
}