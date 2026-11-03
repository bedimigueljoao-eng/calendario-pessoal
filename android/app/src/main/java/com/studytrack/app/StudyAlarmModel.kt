package com.studytrack.app

import org.json.JSONObject

data class StudyAlarmModel(
    val id: String,
    val scheduleId: String,
    val disciplineId: String,
    val disciplineName: String,
    val startTime: String,
    val endTime: String,
    val dayOfWeek: Int, // 1 = Segunda, 7 = Domingo
    val targetTimestamp: Long, // Epoch ms when alarm will ring
    val color: String = "#142B4A",
    val isSnoozed: Boolean = false,
    val isAdvanceAlert: Boolean = false,
    val advanceMinutes: Int = 0
) {
    fun toJson(): String {
        val obj = JSONObject()
        obj.put("id", id)
        obj.put("scheduleId", scheduleId)
        obj.put("disciplineId", disciplineId)
        obj.put("disciplineName", disciplineName)
        obj.put("startTime", startTime)
        obj.put("endTime", endTime)
        obj.put("dayOfWeek", dayOfWeek)
        obj.put("targetTimestamp", targetTimestamp)
        obj.put("color", color)
        obj.put("isSnoozed", isSnoozed)
        obj.put("isAdvanceAlert", isAdvanceAlert)
        obj.put("advanceMinutes", advanceMinutes)
        return obj.toString()
    }

    companion object {
        fun fromJson(jsonStr: String): StudyAlarmModel? {
            return try {
                val obj = JSONObject(jsonStr)
                StudyAlarmModel(
                    id = obj.getString("id"),
                    scheduleId = obj.getString("scheduleId"),
                    disciplineId = obj.getString("disciplineId"),
                    disciplineName = obj.getString("disciplineName"),
                    startTime = obj.getString("startTime"),
                    endTime = obj.getString("endTime"),
                    dayOfWeek = obj.getInt("dayOfWeek"),
                    targetTimestamp = obj.getLong("targetTimestamp"),
                    color = obj.optString("color", "#142B4A"),
                    isSnoozed = obj.optBoolean("isSnoozed", false),
                    isAdvanceAlert = obj.optBoolean("isAdvanceAlert", false),
                    advanceMinutes = obj.optInt("advanceMinutes", 0)
                )
            } catch (e: Exception) {
                null
            }
        }
    }
}
