package com.studytrack.app

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import java.util.Calendar

class BootReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "BootReceiver"
    }

    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action
        Log.d(TAG, "Device boot or package replaced detected: $action")

        val alarms = AlarmStorage.getAllAlarms(context)
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager

        val now = Calendar.getInstance()

        for (alarm in alarms) {
            try {
                var targetMs = alarm.targetTimestamp

                // If this is a regular recurring schedule and its previous trigger has passed, calculate next occurrence
                if (!alarm.isSnoozed && targetMs <= now.timeInMillis && alarm.dayOfWeek in 1..7) {
                    val parts = alarm.startTime.split(":")
                    if (parts.size == 2) {
                        val hour = parts[0].toIntOrNull() ?: 0
                        val minute = parts[1].toIntOrNull() ?: 0

                        val cal = Calendar.getInstance().apply {
                            // Calendar.SUNDAY = 1, MONDAY = 2 ... SATURDAY = 7
                            // Our dayOfWeek: 1 = Seg (Mon), 2 = Ter (Tue), ..., 7 = Dom (Sun)
                            val calDay = if (alarm.dayOfWeek == 7) Calendar.SUNDAY else alarm.dayOfWeek + 1
                            set(Calendar.DAY_OF_WEEK, calDay)
                            set(Calendar.HOUR_OF_DAY, hour)
                            set(Calendar.MINUTE, minute)
                            set(Calendar.SECOND, 0)
                            set(Calendar.MILLISECOND, 0)

                            if (alarm.isAdvanceAlert && alarm.advanceMinutes > 0) {
                                add(Calendar.MINUTE, -alarm.advanceMinutes)
                            }

                            if (timeInMillis <= now.timeInMillis) {
                                add(Calendar.WEEK_OF_YEAR, 1)
                            }
                        }
                        targetMs = cal.timeInMillis
                        AlarmStorage.saveAlarm(context, alarm.copy(targetTimestamp = targetMs))
                    }
                }

                if (targetMs > now.timeInMillis) {
                    val alarmIntent = Intent(context, AlarmReceiver::class.java).apply {
                        this.action = AlarmReceiver.ACTION_ALARM_TRIGGER
                        putExtra(AlarmReceiver.EXTRA_ALARM_ID, alarm.id)
                        putExtra(AlarmReceiver.EXTRA_SCHEDULE_ID, alarm.scheduleId)
                        putExtra(AlarmReceiver.EXTRA_DISCIPLINE_ID, alarm.disciplineId)
                        putExtra(AlarmReceiver.EXTRA_DISCIPLINE_NAME, alarm.disciplineName)
                        putExtra(AlarmReceiver.EXTRA_START_TIME, alarm.startTime)
                        putExtra(AlarmReceiver.EXTRA_END_TIME, alarm.endTime)
                        putExtra(AlarmReceiver.EXTRA_COLOR, alarm.color)
                    }

                    val pendingIntent = PendingIntent.getBroadcast(
                        context,
                        alarm.id.hashCode(),
                        alarmIntent,
                        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                    )

                    val showIntent = Intent(context, AlarmActivity::class.java).apply {
                        flags = Intent.FLAG_ACTIVITY_NEW_TASK
                        putExtra(AlarmReceiver.EXTRA_ALARM_ID, alarm.id)
                    }
                    val showPendingIntent = PendingIntent.getActivity(
                        context,
                        alarm.id.hashCode() + 1,
                        showIntent,
                        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                    )

                    val alarmClockInfo = AlarmManager.AlarmClockInfo(targetMs, showPendingIntent)
                    alarmManager.setAlarmClock(alarmClockInfo, pendingIntent)
                    Log.d(TAG, "Restored alarm for ${alarm.disciplineName} at $targetMs")
                }
            } catch (e: Exception) {
                Log.e(TAG, "Failed restoring alarm ${alarm.id}: ${e.message}", e)
            }
        }
    }
}
