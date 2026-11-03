package com.studytrack.app

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.PowerManager
import android.util.Log

class AlarmReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "AlarmReceiver"
        const val ACTION_ALARM_TRIGGER = "com.studytrack.app.ALARM_TRIGGER"
        const val ACTION_STUDY = "com.studytrack.app.ACTION_STUDY"
        const val ACTION_SNOOZE = "com.studytrack.app.ACTION_SNOOZE"
        const val ACTION_SKIP = "com.studytrack.app.ACTION_SKIP"

        const val EXTRA_ALARM_ID = "extra_alarm_id"
        const val EXTRA_SCHEDULE_ID = "extra_schedule_id"
        const val EXTRA_DISCIPLINE_ID = "extra_discipline_id"
        const val EXTRA_DISCIPLINE_NAME = "extra_discipline_name"
        const val EXTRA_START_TIME = "extra_start_time"
        const val EXTRA_END_TIME = "extra_end_time"
        const val EXTRA_COLOR = "extra_color"
        const val EXTRA_SNOOZE_MINUTES = "extra_snooze_minutes"
    }

    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action ?: return
        Log.d(TAG, "AlarmReceiver received action: $action")

        val powerManager = context.getSystemService(Context.POWER_SERVICE) as PowerManager
        val wakeLock = powerManager.newWakeLock(
            PowerManager.PARTIAL_WAKE_LOCK or PowerManager.ACQUIRE_CAUSES_WAKEUP,
            "StudyTrack:AlarmWakeLock"
        )
        wakeLock.acquire(10000) // 10s safety wake lock

        try {
            when (action) {
                ACTION_ALARM_TRIGGER -> {
                    handleAlarmTrigger(context, intent)
                }
                ACTION_STUDY -> {
                    handleStudyAction(context, intent)
                }
                ACTION_SNOOZE -> {
                    handleSnoozeAction(context, intent)
                }
                ACTION_SKIP -> {
                    handleSkipAction(context, intent)
                }
            }
        } finally {
            if (wakeLock.isHeld) {
                wakeLock.release()
            }
        }
    }

    private fun handleAlarmTrigger(context: Context, intent: Intent) {
        val alarmId = intent.getStringExtra(EXTRA_ALARM_ID) ?: ""
        val scheduleId = intent.getStringExtra(EXTRA_SCHEDULE_ID) ?: ""
        val disciplineId = intent.getStringExtra(EXTRA_DISCIPLINE_ID) ?: ""
        val disciplineName = intent.getStringExtra(EXTRA_DISCIPLINE_NAME) ?: "Estudo Programado"
        val startTime = intent.getStringExtra(EXTRA_START_TIME) ?: ""
        val endTime = intent.getStringExtra(EXTRA_END_TIME) ?: ""
        val color = intent.getStringExtra(EXTRA_COLOR) ?: "#142B4A"

        // 1. Start continuous ForegroundService for audio playback & vibration
        val serviceIntent = Intent(context, AlarmService::class.java).apply {
            putExtra(EXTRA_ALARM_ID, alarmId)
            putExtra(EXTRA_SCHEDULE_ID, scheduleId)
            putExtra(EXTRA_DISCIPLINE_ID, disciplineId)
            putExtra(EXTRA_DISCIPLINE_NAME, disciplineName)
            putExtra(EXTRA_START_TIME, startTime)
            putExtra(EXTRA_END_TIME, endTime)
            putExtra(EXTRA_COLOR, color)
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(serviceIntent)
        } else {
            context.startService(serviceIntent)
        }

        // 2. Launch AlarmActivity full screen
        val activityIntent = Intent(context, AlarmActivity::class.java).apply {
            putExtra(EXTRA_ALARM_ID, alarmId)
            putExtra(EXTRA_SCHEDULE_ID, scheduleId)
            putExtra(EXTRA_DISCIPLINE_ID, disciplineId)
            putExtra(EXTRA_DISCIPLINE_NAME, disciplineName)
            putExtra(EXTRA_START_TIME, startTime)
            putExtra(EXTRA_END_TIME, endTime)
            putExtra(EXTRA_COLOR, color)
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or
                    Intent.FLAG_ACTIVITY_CLEAR_TOP or
                    Intent.FLAG_ACTIVITY_REORDER_TO_FRONT
        }
        context.startActivity(activityIntent)
    }

    private fun handleStudyAction(context: Context, intent: Intent) {
        val scheduleId = intent.getStringExtra(EXTRA_SCHEDULE_ID) ?: ""
        val disciplineId = intent.getStringExtra(EXTRA_DISCIPLINE_ID) ?: ""
        val disciplineName = intent.getStringExtra(EXTRA_DISCIPLINE_NAME) ?: ""

        // Stop continuous ringing service
        val stopServiceIntent = Intent(context, AlarmService::class.java).apply {
            action = AlarmService.ACTION_STOP_ALARM
        }
        context.startService(stopServiceIntent)

        // Open main app with parameters to start study session
        val mainIntent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("route", "study")
            putExtra("scheduleId", scheduleId)
            putExtra("disciplineId", disciplineId)
            putExtra("disciplineName", disciplineName)
        }
        context.startActivity(mainIntent)
    }

    private fun handleSnoozeAction(context: Context, intent: Intent) {
        val alarmId = intent.getStringExtra(EXTRA_ALARM_ID) ?: ""
        val scheduleId = intent.getStringExtra(EXTRA_SCHEDULE_ID) ?: ""
        val disciplineId = intent.getStringExtra(EXTRA_DISCIPLINE_ID) ?: ""
        val disciplineName = intent.getStringExtra(EXTRA_DISCIPLINE_NAME) ?: ""
        val startTime = intent.getStringExtra(EXTRA_START_TIME) ?: ""
        val endTime = intent.getStringExtra(EXTRA_END_TIME) ?: ""
        val color = intent.getStringExtra(EXTRA_COLOR) ?: "#142B4A"
        val snoozeMinutes = intent.getIntExtra(EXTRA_SNOOZE_MINUTES, 10)

        // Stop active alarm
        val stopServiceIntent = Intent(context, AlarmService::class.java).apply {
            action = AlarmService.ACTION_STOP_ALARM
        }
        context.startService(stopServiceIntent)

        // Schedule new exact alarm after snoozeMinutes
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val triggerAtMs = System.currentTimeMillis() + (snoozeMinutes * 60 * 1000L)
        val newAlarmId = "snooze_${scheduleId}_${System.currentTimeMillis()}"

        val snoozedAlarm = StudyAlarmModel(
            id = newAlarmId,
            scheduleId = scheduleId,
            disciplineId = disciplineId,
            disciplineName = disciplineName,
            startTime = startTime,
            endTime = endTime,
            dayOfWeek = 0,
            targetTimestamp = triggerAtMs,
            color = color,
            isSnoozed = true
        )
        AlarmStorage.saveAlarm(context, snoozedAlarm)

        val alarmIntent = Intent(context, AlarmReceiver::class.java).apply {
            action = ACTION_ALARM_TRIGGER
            putExtra(EXTRA_ALARM_ID, newAlarmId)
            putExtra(EXTRA_SCHEDULE_ID, scheduleId)
            putExtra(EXTRA_DISCIPLINE_ID, disciplineId)
            putExtra(EXTRA_DISCIPLINE_NAME, disciplineName)
            putExtra(EXTRA_START_TIME, startTime)
            putExtra(EXTRA_END_TIME, endTime)
            putExtra(EXTRA_COLOR, color)
        }

        val pendingIntent = PendingIntent.getBroadcast(
            context,
            newAlarmId.hashCode(),
            alarmIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val showIntent = Intent(context, AlarmActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
            putExtra(EXTRA_ALARM_ID, newAlarmId)
        }
        val showPendingIntent = PendingIntent.getActivity(
            context,
            newAlarmId.hashCode() + 1,
            showIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val alarmClockInfo = AlarmManager.AlarmClockInfo(triggerAtMs, showPendingIntent)
        alarmManager.setAlarmClock(alarmClockInfo, pendingIntent)
        Log.d(TAG, "Snoozed alarm scheduled for $snoozeMinutes min: $newAlarmId at $triggerAtMs")
    }

    private fun handleSkipAction(context: Context, intent: Intent) {
        val stopServiceIntent = Intent(context, AlarmService::class.java).apply {
            action = AlarmService.ACTION_STOP_ALARM
        }
        context.startService(stopServiceIntent)
    }
}
