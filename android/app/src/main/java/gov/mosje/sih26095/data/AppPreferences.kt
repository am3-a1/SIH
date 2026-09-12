package gov.mosje.sih26095.data

import android.content.Context
import android.content.SharedPreferences

class AppPreferences(context: Context) {
    private val prefs: SharedPreferences = context.getSharedPreferences("dosje_inspector_prefs", Context.MODE_PRIVATE)

    var serverBaseUrl: String
        get() {
            var url = prefs.getString("server_base_url", null)
            if (url.isNullOrEmpty()) {
                // If running on a physical device, 10.0.2.2 does not work. Default to localhost (for adb reverse)
                val isEmulator = android.os.Build.FINGERPRINT.contains("generic") ||
                        android.os.Build.HARDWARE.contains("goldfish") ||
                        android.os.Build.HARDWARE.contains("ranchu")
                url = if (isEmulator) "http://10.0.2.2:8000" else "http://localhost:8000"
                prefs.edit().putString("server_base_url", url).apply()
            }
            // Auto-migrate any cached 8088 port to 8000
            if (url.contains(":8088")) {
                url = url.replace(":8088", ":8000")
                prefs.edit().putString("server_base_url", url).apply()
            }
            return url.trim().removeSuffix("/")
        }
        set(value) {
            val sanitized = value.trim().removeSuffix("/").let {
                if (it.contains(":8088")) it.replace(":8088", ":8000") else it
            }
            prefs.edit().putString("server_base_url", sanitized).apply()
        }

    var activeOfficerId: String?
        get() = prefs.getString("active_officer_id", null)
        set(value) = prefs.edit().putString("active_officer_id", value).apply()

    var activeOfficerName: String?
        get() = prefs.getString("active_officer_name", null)
        set(value) = prefs.edit().putString("active_officer_name", value).apply()

    var oauthToken: String?
        get() = prefs.getString("oauth_token", "mock_oauth2_govcloud_bearer_token")
        set(value) = prefs.edit().putString("oauth_token", value).apply()
}
