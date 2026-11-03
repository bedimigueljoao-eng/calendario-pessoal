package com.studytrack.app

import android.app.AlarmManager
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import android.util.Log
import androidx.core.app.NotificationManagerCompat
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import java.util.Calendar

@CapacitorPlugin(name = "StudyTrackAlarm")
class StudyTrackAlarmPlugin : Plugin() {

    companion object {
        private const val TAG = "StudyTrackAlarmPlugin"
    }

    @PluginMethod
    fun scheduleAlarm(call: PluginCall) {
        val scheduleId = call.getString("scheduleId") ?: run {
            call.reject("scheduleId is required")
            return
        }
        val disciplineId = call.getString("disciplineId") ?: ""
        val disciplineName = call.getString("disciplineName") ?: "Estudo Programado"
        val startTime = call.getString("startTime") ?: run {
            call.reject("startTime is required (HH:mm)")
            return
        }
        val endTime = call.getString("endTime") ?: ""
        val dayOfWeek = call.getInt("dayOfWeek") ?: 1
        val color = call.getString("color") ?: "#142B4A"
        val advanceMinutes = call.getInt("advanceMinutes") ?: 0
        val alarmId = call.getString("alarmId") ?: "sched_${scheduleId}_day_${dayOfWeek}_${startTime}"

        val ctx = context
        val alarmManager = ctx.getSystemService(Context.ALARM_SERVICE) as AlarmManager

        // Calculate target timestamp
        val parts = startTime.split(":")
        if (parts.size != 2) {
            call.reject("Invalid startTime format, must be HH:mm")
            return
        }

        val hour = parts[0].toIntOrNull() ?: 0
        val minute = parts[1].toIntOrNull() ?: 0
        val now = Calendar.getInstance()

        val cal = Calendar.getInstance().apply {
            val calDay = if (dayOfWeek == 7) Calendar.SUNDAY else dayOfWeek + 1
            set(Calendar.DAY_OF_WEEK, calDay)
            set(Calendar.HOUR_OF_DAY, hour)
            set(Calendar.MINUTE, minute)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)

            if (advanceMinutes > 0) {
                add(Calendar.MINUTE, -advanceMinutes)
            }

            if (timeInMillis <= now.timeInMillis) {
                add(Calendar.WEEK_OF_YEAR, 1)
            }
        }

        val targetMs = cal.timeInMillis

        val alarmModel = StudyAlarmModel(
            id = alarmId,
            scheduleId = scheduleId,
            disciplineId = disciplineId,
            disciplineName = disciplineName,
            startTime = startTime,
            endTime = endTime,
            dayOfWeek = dayOfWeek,
            targetTimestamp = targetMs,
            color = color,
            isSnoozed = false,
            isAdvanceAlert = advanceMinutes > 0,
            advanceMinutes = advanceMinutes
        )

        AlarmStorage.saveAlarm(ctx, alarmModel)

        // Set AlarmManager alarm
        val alarmIntent = Intent(ctx, AlarmReceiver::class.java).apply {
            action = AlarmReceiver.ACTION_ALARM_TRIGGER
            putExtra(AlarmReceiver.EXTRA_ALARM_ID, alarmId)
            putExtra(AlarmReceiver.EXTRA_SCHEDULE_ID, scheduleId)
            putExtra(AlarmReceiver.EXTRA_DISCIPLINE_ID, disciplineId)
            putExtra(AlarmReceiver.EXTRA_DISCIPLINE_NAME, disciplineName)
            putExtra(AlarmReceiver.EXTRA_START_TIME, startTime)
            putExtra(AlarmReceiver.EXTRA_END_TIME, endTime)
            putExtra(AlarmReceiver.EXTRA_COLOR, color)
        }

        val pendingIntent = PendingIntent.getBroadcast(
            ctx,
            alarmId.hashCode(),
            alarmIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val showIntent = Intent(ctx, AlarmActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
            putExtra(AlarmReceiver.EXTRA_ALARM_ID, alarmId)
        }
        val showPendingIntent = PendingIntent.getActivity(
            ctx,
            alarmId.hashCode() + 1,
            showIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val alarmClockInfo = AlarmManager.AlarmClockInfo(targetMs, showPendingIntent)
        alarmManager.setAlarmClock(alarmClockInfo, pendingIntent)

        Log.d(TAG, "Scheduled native alarm: $alarmId at $targetMs (in ${(targetMs - now.timeInMillis)/1000}s)")

        val res = JSObject()
        res.put("success", true)
        res.put("alarmId", alarmId)
        res.put("targetTimestamp", targetMs)
        call.resolve(res)
    }

    @PluginMethod
    fun cancelAlarm(call: PluginCall) {
        val alarmId = call.getString("alarmId") ?: run {
            call.reject("alarmId is required")
            return
        }

        val ctx = context
        val alarmManager = ctx.getSystemService(Context.ALARM_SERVICE) as AlarmManager

        val intent = Intent(ctx, AlarmReceiver::class.java).apply {
            action = AlarmReceiver.ACTION_ALARM_TRIGGER
        }
        val pendingIntent = PendingIntent.getBroadcast(
            ctx,
            alarmId.hashCode(),
            intent,
            PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE
        )

        if (pendingIntent != null) {
            alarmManager.cancel(pendingIntent)
            pendingIntent.cancel()
        }

        AlarmStorage.removeAlarm(ctx, alarmId)
        val res = JSObject()
        res.put("success", true)
        call.resolve(res)
    }

    @PluginMethod
    fun cancelAllAlarms(call: PluginCall) {
        val ctx = context
        val alarms = AlarmStorage.getAllAlarms(ctx)
        val alarmManager = ctx.getSystemService(Context.ALARM_SERVICE) as AlarmManager

        for (alarm in alarms) {
            val intent = Intent(ctx, AlarmReceiver::class.java).apply {
                action = AlarmReceiver.ACTION_ALARM_TRIGGER
            }
            val pendingIntent = PendingIntent.getBroadcast(
                ctx,
                alarm.id.hashCode(),
                intent,
                PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE
            )
            if (pendingIntent != null) {
                alarmManager.cancel(pendingIntent)
                pendingIntent.cancel()
            }
        }

        AlarmStorage.clearAll(ctx)
        val res = JSObject()
        res.put("success", true)
        call.resolve(res)
    }

    @PluginMethod
    fun stopActiveAlarm(call: PluginCall) {
        val ctx = context
        val stopIntent = Intent(ctx, AlarmService::class.java).apply {
            action = AlarmService.ACTION_STOP_ALARM
        }
        ctx.startService(stopIntent)

        val res = JSObject()
        res.put("success", true)
        call.resolve(res)
    }

    @PluginMethod
    fun testTriggerAlarm(call: PluginCall) {
        val ctx = context
        val disciplineName = call.getString("disciplineName") ?: "Excel e Análise de Dados"
        val scheduleId = call.getString("scheduleId") ?: "test_sched"
        val disciplineId = call.getString("disciplineId") ?: "test_disc"
        val testAlarmId = "test_${System.currentTimeMillis()}"

        val triggerIntent = Intent(ctx, AlarmReceiver::class.java).apply {
            action = AlarmReceiver.ACTION_ALARM_TRIGGER
            putExtra(AlarmReceiver.EXTRA_ALARM_ID, testAlarmId)
            putExtra(AlarmReceiver.EXTRA_SCHEDULE_ID, scheduleId)
            putExtra(AlarmReceiver.EXTRA_DISCIPLINE_ID, disciplineId)
            putExtra(AlarmReceiver.EXTRA_DISCIPLINE_NAME, disciplineName)
            putExtra(AlarmReceiver.EXTRA_START_TIME, "19:00")
            putExtra(AlarmReceiver.EXTRA_END_TIME, "20:30")
            putExtra(AlarmReceiver.EXTRA_COLOR, "#0284c7")
        }
        ctx.sendBroadcast(triggerIntent)

        val res = JSObject()
        res.put("success", true)
        call.resolve(res)
    }

    @PluginMethod
    fun checkPermissions(call: PluginCall) {
        val ctx = context
        val res = JSObject()

        // 1. Exact Alarm Permission (Android 12+ API 31+)
        var exactAlarmGranted = true
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val alarmManager = ctx.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            exactAlarmGranted = alarmManager.canScheduleExactAlarms()
        }
        res.put("exactAlarmGranted", exactAlarmGranted)

        // 2. Notification Permission (Android 13+ API 33+)
        val notificationsGranted = NotificationManagerCompat.from(ctx).areNotificationsEnabled()
        res.put("notificationsGranted", notificationsGranted)

        // 3. Battery Optimization Exemption
        val powerManager = ctx.getSystemService(Context.POWER_SERVICE) as PowerManager
        val batteryIgnored = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            powerManager.isIgnoringBatteryOptimizations(ctx.packageName)
        } else {
            true
        }
        res.put("batteryOptimizationIgnored", batteryIgnored)

        res.put("isAndroid", true)
        call.resolve(res)
    }

    @PluginMethod
    fun requestExactAlarmPermission(call: PluginCall) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val ctx = context
            val intent = Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM).apply {
                data = Uri.parse("package:${ctx.packageName}")
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            ctx.startActivity(intent)
        }
        val res = JSObject()
        res.put("success", true)
        call.resolve(res)
    }

    @PluginMethod
    fun requestBatteryOptimizationExemption(call: PluginCall) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val ctx = context
            try {
                val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                    data = Uri.parse("package:${ctx.packageName}")
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                ctx.startActivity(intent)
            } catch (e: Exception) {
                val fallbackIntent = Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                ctx.startActivity(fallbackIntent)
            }
        }
        val res = JSObject()
        res.put("success", true)
        call.resolve(res)
    }

    @PluginMethod
    fun getPendingAlarms(call: PluginCall) {
        val ctx = context
        val list = AlarmStorage.getAllAlarms(ctx)
        val arr = JSArray()
        for (item in list) {
            val obj = JSObject()
            obj.put("id", item.id)
            obj.put("scheduleId", item.scheduleId)
            obj.put("disciplineName", item.disciplineName)
            obj.put("startTime", item.startTime)
            obj.put("endTime", item.endTime)
            obj.put("dayOfWeek", item.dayOfWeek)
            obj.put("targetTimestamp", item.targetTimestamp)
            obj.put("isSnoozed", item.isSnoozed)
            arr.put(obj)
        }
        val res = JSObject()
        res.put("alarms", arr)
        call.resolve(res)
    }
}
