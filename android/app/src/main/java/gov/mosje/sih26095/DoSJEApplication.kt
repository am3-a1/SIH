package gov.mosje.sih26095

import android.app.Application
import gov.mosje.sih26095.api.DoSJEApiClient
import gov.mosje.sih26095.data.AppPreferences
import gov.mosje.sih26095.data.OfflineQueueManager

class DoSJEApplication : Application() {
    lateinit var preferences: AppPreferences
        private set
    lateinit var offlineQueue: OfflineQueueManager
        private set
    lateinit var apiClient: DoSJEApiClient
        private set

    override fun onCreate() {
        super.onCreate()
        instance = this
        preferences = AppPreferences(this)
        offlineQueue = OfflineQueueManager(this)
        apiClient = DoSJEApiClient(this)
    }

    companion object {
        lateinit var instance: DoSJEApplication
            private set
    }
}
