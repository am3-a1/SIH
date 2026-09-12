package gov.mosje.sih26095.data

import android.content.Context
import gov.mosje.sih26095.api.models.InspectionSubmission
import org.json.JSONArray
import org.json.JSONObject
import java.io.File

class OfflineQueueManager(private val context: Context) {
    private val queueFile = File(context.filesDir, "offline_inspections_queue.json")

    @Synchronized
    fun enqueueAudit(submission: InspectionSubmission) {
        val list = getQueuedAudits().toMutableList()
        list.add(submission.toJson())
        saveQueue(list)
    }

    @Synchronized
    fun getQueuedAudits(): List<JSONObject> {
        if (!queueFile.exists()) return emptyList()
        val jsonStr = queueFile.readText(Charsets.UTF_8)
        if (jsonStr.isEmpty()) return emptyList()
        val array = JSONArray(jsonStr)
        val list = mutableListOf<JSONObject>()
        for (i in 0 until array.length()) {
            list.add(array.getJSONObject(i))
        }
        return list
    }

    @Synchronized
    fun getQueueCount(): Int = getQueuedAudits().size

    @Synchronized
    fun clearQueue() {
        if (queueFile.exists()) queueFile.delete()
    }

    private fun saveQueue(list: List<JSONObject>) {
        val array = JSONArray()
        for (item in list) {
            array.put(item)
        }
        queueFile.writeText(array.toString(), Charsets.UTF_8)
    }
}
