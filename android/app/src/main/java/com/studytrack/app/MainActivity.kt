package com.studytrack.app

import android.content.Intent
import android.os.Bundle
import com.getcapacitor.BridgeActivity

class MainActivity : BridgeActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        registerPlugin(StudyTrackAlarmPlugin::class.java)
        super.onCreate(savedInstanceState)

        handleDeepLinkIntent(intent)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)

        setIntent(intent)
        handleDeepLinkIntent(intent)
    }

    private fun handleDeepLinkIntent(intent: Intent) {
        val route = intent.getStringExtra("route")

        if (route != "study") {
            return
        }

        val scheduleId =
            intent.getStringExtra("scheduleId") ?: ""

        val disciplineId =
            intent.getStringExtra("disciplineId") ?: ""

        val disciplineName =
            intent.getStringExtra("disciplineName") ?: ""

        val escapedScheduleId =
            escapeJavaScriptValue(scheduleId)

        val escapedDisciplineId =
            escapeJavaScriptValue(disciplineId)

        val escapedDisciplineName =
            escapeJavaScriptValue(disciplineName)

        val script = """
            window.dispatchEvent(
                new CustomEvent(
                    'studytrack_open_study',
                    {
                        detail: {
                            scheduleId: '$escapedScheduleId',
                            disciplineId: '$escapedDisciplineId',
                            disciplineName: '$escapedDisciplineName'
                        }
                    }
                )
            );
        """.trimIndent()

        bridge?.eval(script, null)
    }

    private fun escapeJavaScriptValue(value: String): String {
        return value
            .replace("\\", "\\\\")
            .replace("'", "\\'")
            .replace("\n", "\\n")
            .replace("\r", "\\r")
    }
}
