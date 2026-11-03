package com.studytrack.app

import android.app.AlarmManager
import android.app.KeyguardManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class AlarmActivity : AppCompatActivity() {

    private var alarmId: String = ""
    private var scheduleId: String = ""
    private var disciplineId: String = ""
    private var disciplineName: String = ""
    private var startTime: String = ""
    private var endTime: String = ""
    private var colorHex: String = "#142B4A"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        wakeScreenAndUnlock()

        setContentView(R.layout.activity_alarm)

        extractIntentData(intent)
        setupViews()
    }

    override fun onNewIntent(intent: Intent?) {
        super.onNewIntent(intent)
        setIntent(intent)
        wakeScreenAndUnlock()
        intent?.let { extractIntentData(it) }
        setupViews()
    }

    private fun wakeScreenAndUnlock() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true)
            setTurnScreenOn(true)
            val keyguardManager = getSystemService(Context.KEYGUARD_SERVICE) as KeyguardManager
            keyguardManager.requestDismissKeyguard(this, null)
        } else {
            @Suppress("DEPRECATION")
            window.addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD or
                WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
            )
        }
    }

    private fun extractIntentData(intent: Intent) {
        alarmId = intent.getStringExtra(AlarmReceiver.EXTRA_ALARM_ID) ?: ""
        scheduleId = intent.getStringExtra(AlarmReceiver.EXTRA_SCHEDULE_ID) ?: ""
        disciplineId = intent.getStringExtra(AlarmReceiver.EXTRA_DISCIPLINE_ID) ?: ""
        disciplineName = intent.getStringExtra(AlarmReceiver.EXTRA_DISCIPLINE_NAME) ?: "Estudo Programado"
        startTime = intent.getStringExtra(AlarmReceiver.EXTRA_START_TIME) ?: ""
        endTime = intent.getStringExtra(AlarmReceiver.EXTRA_END_TIME) ?: ""
        colorHex = intent.getStringExtra(AlarmReceiver.EXTRA_COLOR) ?: "#142B4A"
    }

    private fun setupViews() {
        val tvClockTime = findViewById<TextView>(R.id.tvClockTime)
        val tvDisciplineName = findViewById<TextView>(R.id.tvDisciplineName)
        val tvScheduleRange = findViewById<TextView>(R.id.tvScheduleRange)
        val btnStudy = findViewById<Button>(R.id.btnStudy)
        val btnSnooze = findViewById<Button>(R.id.btnSnooze)
        val btnSkip = findViewById<Button>(R.id.btnSkip)

        val btnSnooze5 = findViewById<Button>(R.id.btnSnooze5)
        val btnSnooze10 = findViewById<Button>(R.id.btnSnooze10)
        val btnSnooze15 = findViewById<Button>(R.id.btnSnooze15)
        val btnSnooze30 = findViewById<Button>(R.id.btnSnooze30)

        // Set live clock
        val timeFormat = SimpleDateFormat("HH:mm", Locale.getDefault())
        tvClockTime.text = if (startTime.isNotEmpty()) startTime else timeFormat.format(Date())

        tvDisciplineName.text = disciplineName
        tvScheduleRange.text = if (startTime.isNotEmpty() && endTime.isNotEmpty()) {
            "Sessão programada: $startTime - $endTime"
        } else {
            "Sessão de estudo programada"
        }

        // Apply discipline color accent if valid
        try {
            val colorInt = Color.parseColor(colorHex)
            tvDisciplineName.setTextColor(colorInt)
        } catch (e: Exception) {
            // keep default white
        }

        // 1. ESTUDAR
        btnStudy.setOnClickListener {
            stopAlarmService()
            openMainAppToStudy()
            finish()
        }

        // 2. ADIAR (Default 10 min)
        btnSnooze.setOnClickListener {
            snoozeAlarm(10)
        }

        // Quick snooze buttons
        btnSnooze5.setOnClickListener { snoozeAlarm(5) }
        btnSnooze10.setOnClickListener { snoozeAlarm(10) }
        btnSnooze15.setOnClickListener { snoozeAlarm(15) }
        btnSnooze30.setOnClickListener { snoozeAlarm(30) }

        // 3. NÃO ESTUDAR
        btnSkip.setOnClickListener {
            stopAlarmService()
            finish()
        }
    }

    private fun stopAlarmService() {
        val stopIntent = Intent(this, AlarmService::class.java).apply {
            action = AlarmService.ACTION_STOP_ALARM
        }
        startService(stopIntent)
    }

    private fun openMainAppToStudy() {
        val mainIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("route", "study")
            putExtra("scheduleId", scheduleId)
            putExtra("disciplineId", disciplineId)
            putExtra("disciplineName", disciplineName)
        }
        startActivity(mainIntent)
    }

    private fun snoozeAlarm(minutes: Int = 10) {
        val min = minutes
        stopAlarmService()

        val alarmManager = getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val triggerAtMs = System.currentTimeMillis() + (min * 60 * 1000L)
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
            color = colorHex,
            isSnoozed = true
        )
        AlarmStorage.saveAlarm(this, snoozedAlarm)

        val alarmIntent = Intent(this, AlarmReceiver::class.java).apply {
            action = AlarmReceiver.ACTION_ALARM_TRIGGER
            putExtra(AlarmReceiver.EXTRA_ALARM_ID, newAlarmId)
            putExtra(AlarmReceiver.EXTRA_SCHEDULE_ID, scheduleId)
            putExtra(AlarmReceiver.EXTRA_DISCIPLINE_ID, disciplineId)
            putExtra(AlarmReceiver.EXTRA_DISCIPLINE_NAME, disciplineName)
            putExtra(AlarmReceiver.EXTRA_START_TIME, startTime)
            putExtra(AlarmReceiver.EXTRA_END_TIME, endTime)
            putExtra(AlarmReceiver.EXTRA_COLOR, colorHex)
        }

        val pendingIntent = PendingIntent.getBroadcast(
            this,
            newAlarmId.hashCode(),
            alarmIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val showIntent = Intent(this, AlarmActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
            putExtra(AlarmReceiver.EXTRA_ALARM_ID, newAlarmId)
        }
        val showPendingIntent = PendingIntent.getActivity(
            this,
            newAlarmId.hashCode() + 1,
            showIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val alarmClockInfo = AlarmManager.AlarmClockInfo(triggerAtMs, showPendingIntent)
        alarmManager.setAlarmClock(alarmClockInfo, pendingIntent)

        finish()
    }

    override fun onBackPressed() {
        // Prevent accidental hardware back dismissal while ringing; user must choose an explicit action
    }
}
