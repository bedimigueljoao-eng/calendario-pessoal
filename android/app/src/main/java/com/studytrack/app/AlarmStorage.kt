package com.studytrack.app

import android.content.Context
import android.content.SharedPreferences

object AlarmStorage {
    private const val PREFS_NAME = "studytrack_alarms_prefs"
    private const val KEY_ALARMS_SET = "scheduled_alarm_ids"
    private const val KEY_ALARM_PREFIX = "alarm_item_"

    private fun getPrefs(context: Context): SharedPreferences {
        return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    }

    fun saveAlarm(context: Context, alarm: StudyAlarmModel) {
        val prefs = getPrefs(context)
        val ids = getAlarmIds(context).toMutableSet()
        ids.add(alarm.id)

        prefs.edit()
            .putStringSet(KEY_ALARMS_SET, ids)
            .putString(KEY_ALARM_PREFIX + alarm.id, alarm.toJson())
            .apply()
    }

    fun removeAlarm(context: Context, alarmId: String) {
        val prefs = getPrefs(context)
        val ids = getAlarmIds(context).toMutableSet()
        ids.remove(alarmId)

        prefs.edit()
            .putStringSet(KEY_ALARMS_SET, ids)
            .remove(KEY_ALARM_PREFIX + alarmId)
            .apply()
    }

    fun removeAlarmsForSchedule(context: Context, scheduleId: String) {
        val alarms = getAllAlarms(context)
        alarms.filter { it.scheduleId == scheduleId }.forEach {
            removeAlarm(context, it.id)
        }
    }

    fun getAlarm(context: Context, alarmId: String): StudyAlarmModel? {
        val prefs = getPrefs(context)
        val raw = prefs.getString(KEY_ALARM_PREFIX + alarmId, null) ?: return null
        return StudyAlarmModel.fromJson(raw)
    }

    fun getAllAlarms(context: Context): List<StudyAlarmModel> {
        val prefs = getPrefs(context)
        val ids = getAlarmIds(context)
        val list = mutableListOf<StudyAlarmModel>()

        for (id in ids) {
            val raw = prefs.getString(KEY_ALARM_PREFIX + id, null)
            if (raw != null) {
                StudyAlarmModel.fromJson(raw)?.let { list.add(it) }
            }
        }
        return list
    }

    fun clearAll(context: Context) {
        val prefs = getPrefs(context)
        prefs.edit().clear().apply()
    }

    private fun getAlarmIds(context: Context): Set<String> {
        val prefs = getPrefs(context)
        return prefs.getStringSet(KEY_ALARMS_SET, emptySet()) ?: emptySet()
    }
}
