package com.studytrack.app

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.AudioManager
import android.media.MediaPlayer
import android.media.RingtoneManager
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.util.Log
import androidx.core.app.NotificationCompat

class AlarmService : Service() {

    companion object {
        private const val TAG = "AlarmService"
        const val CHANNEL_ID = "studytrack_alarm_channel_v1"
        const val NOTIFICATION_ID = 9001
        const val ACTION_STOP_ALARM = "com.studytrack.app.ACTION_STOP_ALARM"

        var isServiceRunning = false
            private set
    }

    private var mediaPlayer: MediaPlayer? = null
    private var vibrator: Vibrator? = null
    private var wakeLock: PowerManager.WakeLock? = null

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        Log.d(TAG, "AlarmService created")
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val action = intent?.action
        if (action == ACTION_STOP_ALARM) {
            Log.d(TAG, "Stopping alarm service by request")
            stopAlarm()
            stopForeground(true)
            stopSelf()
            return START_NOT_STICKY
        }

        isServiceRunning = true

        val alarmId = intent?.getStringExtra(AlarmReceiver.EXTRA_ALARM_ID) ?: ""
        val scheduleId = intent?.getStringExtra(AlarmReceiver.EXTRA_SCHEDULE_ID) ?: ""
        val disciplineId = intent?.getStringExtra(AlarmReceiver.EXTRA_DISCIPLINE_ID) ?: ""
        val disciplineName = intent?.getStringExtra(AlarmReceiver.EXTRA_DISCIPLINE_NAME) ?: "Estudo Programado"
        val startTime = intent?.getStringExtra(AlarmReceiver.EXTRA_START_TIME) ?: ""
        val endTime = intent?.getStringExtra(AlarmReceiver.EXTRA_END_TIME) ?: ""
        val color = intent?.getStringExtra(AlarmReceiver.EXTRA_COLOR) ?: "#142B4A"

        acquireWakeLock()
        startForeground(NOTIFICATION_ID, buildAlarmNotification(alarmId, scheduleId, disciplineId, disciplineName, startTime, endTime, color))
        startRingtone()
        startVibration()

        return START_STICKY
    }

    private fun acquireWakeLock() {
        if (wakeLock == null) {
            val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
            wakeLock = powerManager.newWakeLock(
                PowerManager.PARTIAL_WAKE_LOCK,
                "StudyTrack:AlarmServiceWakeLock"
            ).apply {
                acquire(30 * 60 * 1000L) // Safety timeout 30 minutes max
            }
        }
    }

    private fun releaseWakeLock() {
        try {
            if (wakeLock?.isHeld == true) {
                wakeLock?.release()
            }
        } catch (e: Exception) {
            Log.w(TAG, "Error releasing wake lock: ${e.message}")
        }
        wakeLock = null
    }

    private fun startRingtone() {
        if (mediaPlayer != null) return

        try {
            var alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
            if (alarmUri == null) {
                alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
            }
            if (alarmUri == null) {
                alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)
            }

            mediaPlayer = MediaPlayer().apply {
                setDataSource(applicationContext, alarmUri)
                setAudioAttributes(
                    AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_ALARM)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .setLegacyStreamType(AudioManager.STREAM_ALARM)
                        .build()
                )
                isLooping = true
                prepare()
                start()
            }
            Log.d(TAG, "Alarm sound started playing continuously (loop=true)")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to play alarm ringtone: ${e.message}", e)
        }
    }

    private fun startVibration() {
        try {
            val pattern = longArrayOf(0, 800, 300, 800, 300, 1000)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val vibratorManager = getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
                vibrator = vibratorManager?.defaultVibrator
            } else {
                @Suppress("DEPRECATION")
                vibrator = getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val effect = VibrationEffect.createWaveform(pattern, 0) // 0 means repeat from index 0
                vibrator?.vibrate(effect)
            } else {
                @Suppress("DEPRECATION")
                vibrator?.vibrate(pattern, 0)
            }
            Log.d(TAG, "Alarm vibration started continuously")
        } catch (e: Exception) {
            Log.w(TAG, "Error starting vibration: ${e.message}")
        }
    }

    private fun stopAlarm() {
        isServiceRunning = false

        try {
            mediaPlayer?.let {
                if (it.isPlaying) {
                    it.stop()
                }
                it.reset()
                it.release()
            }
        } catch (e: Exception) {
            Log.w(TAG, "Error stopping media player: ${e.message}")
        }
        mediaPlayer = null

        try {
            vibrator?.cancel()
        } catch (e: Exception) {
            Log.w(TAG, "Error cancelling vibration: ${e.message}")
        }
        vibrator = null

        releaseWakeLock()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val name = "Alarmes de Estudo StudyTrack"
            val descriptionText = "Notificações de alta prioridade para despertar e alarmes de estudo"
            val importance = NotificationManager.IMPORTANCE_HIGH
            val channel = NotificationChannel(CHANNEL_ID, name, importance).apply {
                description = descriptionText
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 800, 300, 800, 300, 1000)
                setSound(null, null) // Sound is managed by our MediaPlayer loop
                lockscreenVisibility = Notification.VISIBILITY_PUBLIC
                setBypassDnd(true)
            }
            val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }
    }

    private fun buildAlarmNotification(
        alarmId: String,
        scheduleId: String,
        disciplineId: String,
        disciplineName: String,
        startTime: String,
        endTime: String,
        color: String
    ): Notification {
        // Full screen intent opens AlarmActivity
        val fullScreenIntent = Intent(this, AlarmActivity::class.java).apply {
            putExtra(AlarmReceiver.EXTRA_ALARM_ID, alarmId)
            putExtra(AlarmReceiver.EXTRA_SCHEDULE_ID, scheduleId)
            putExtra(AlarmReceiver.EXTRA_DISCIPLINE_ID, disciplineId)
            putExtra(AlarmReceiver.EXTRA_DISCIPLINE_NAME, disciplineName)
            putExtra(AlarmReceiver.EXTRA_START_TIME, startTime)
            putExtra(AlarmReceiver.EXTRA_END_TIME, endTime)
            putExtra(AlarmReceiver.EXTRA_COLOR, color)
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val fullScreenPendingIntent = PendingIntent.getActivity(
            this,
            alarmId.hashCode() + 10,
            fullScreenIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Action: Estudar
        val studyIntent = Intent(this, AlarmReceiver::class.java).apply {
            action = AlarmReceiver.ACTION_STUDY
            putExtra(AlarmReceiver.EXTRA_SCHEDULE_ID, scheduleId)
            putExtra(AlarmReceiver.EXTRA_DISCIPLINE_ID, disciplineId)
            putExtra(AlarmReceiver.EXTRA_DISCIPLINE_NAME, disciplineName)
        }
        val studyPendingIntent = PendingIntent.getBroadcast(
            this,
            alarmId.hashCode() + 20,
            studyIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Action: Adiar (10 min)
        val snoozeIntent = Intent(this, AlarmReceiver::class.java).apply {
            action = AlarmReceiver.ACTION_SNOOZE
            putExtra(AlarmReceiver.EXTRA_ALARM_ID, alarmId)
            putExtra(AlarmReceiver.EXTRA_SCHEDULE_ID, scheduleId)
            putExtra(AlarmReceiver.EXTRA_DISCIPLINE_ID, disciplineId)
            putExtra(AlarmReceiver.EXTRA_DISCIPLINE_NAME, disciplineName)
            putExtra(AlarmReceiver.EXTRA_START_TIME, startTime)
            putExtra(AlarmReceiver.EXTRA_END_TIME, endTime)
            putExtra(AlarmReceiver.EXTRA_COLOR, color)
            putExtra(AlarmReceiver.EXTRA_SNOOZE_MINUTES, 10)
        }
        val snoozePendingIntent = PendingIntent.getBroadcast(
            this,
            alarmId.hashCode() + 30,
            snoozeIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Action: Não estudar
        val skipIntent = Intent(this, AlarmReceiver::class.java).apply {
            action = AlarmReceiver.ACTION_SKIP
            putExtra(AlarmReceiver.EXTRA_SCHEDULE_ID, scheduleId)
        }
        val skipPendingIntent = PendingIntent.getBroadcast(
            this,
            alarmId.hashCode() + 40,
            skipIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val timeRange = if (startTime.isNotEmpty() && endTime.isNotEmpty()) "$startTime - $endTime" else startTime

        val builder = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle("⏰ Alarme de Estudo: $disciplineName")
            .setContentText("Horário programado ($timeRange). Toque para abrir.")
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setOngoing(true)
            .setAutoCancel(false)
            .setFullScreenIntent(fullScreenPendingIntent, true)
            .setContentIntent(fullScreenPendingIntent)
            .addAction(0, "▶ Estudar", studyPendingIntent)
            .addAction(0, "⏱ Adiar (10m)", snoozePendingIntent)
            .addAction(0, "✕ Não estudar", skipPendingIntent)

        return builder.build()
    }

    override fun onDestroy() {
        super.onDestroy()
        stopAlarm()
        Log.d(TAG, "AlarmService destroyed")
    }
}
