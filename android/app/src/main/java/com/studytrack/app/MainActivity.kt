package com.studytrack.app

import android.content.Intent
import android.os.Bundle
import com.getcapacitor.BridgeActivity
import com.getcapacitor.JSObject

class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        registerPlugin(StudyTrackAlarmPlugin::class.java)
        super.onCreate(savedInstanceState)
        handleDeepLinkIntent(intent)
    }

    override fun onNewIntent(intent: Intent?) {
        super.onNewIntent(intent)
        intent?.let { handleDeepLinkIntent(it) }
    }

    private fun handleDeepLinkIntent(intent: Intent) {
        val route = intent.getStringExtra("route")
        if (route == "study") {
            val scheduleId = intent.getStringExtra("scheduleId") ?: ""
            val disciplineId = intent.getStringExtra("disciplineId") ?: ""
            val disciplineName = intent.getStringExtra("disciplineName") ?: ""

            bridge?.eval("window.dispatchEvent(new CustomEvent('studytrack_open_study', { detail: { scheduleId: '$scheduleId', disciplineId: '$disciplineId', disciplineName: '$disciplineName' } }));", null)
        }
    }
}
