package gov.mosje.sih26095.data

import android.content.Context
import android.content.SharedPreferences

class AppPreferences(context: Context) {
    private val prefs: SharedPreferences = context.getSharedPreferences("dosje_inspector_prefs", Context.MODE_PRIVATE)

    var serverBaseUrl: String
        get() = prefs.getString("server_base_url", "http://10.0.2.2:8088") ?: "http://10.0.2.2:8088"
        set(value) = prefs.edit().putString("server_base_url", value).apply()

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
