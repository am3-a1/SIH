package gov.mosje.sih26095.api.models

import org.json.JSONObject

data class EvidencePhoto(
    val id: String,
    val category: String,
    val localFilePath: String,
    val base64Thumbnail: String?,
    val latitude: Double,
    val longitude: Double,
    val accuracyMeters: Float,
    val timestampUtc: String,
    val watermarkText: String,
    val sha256Hash: String,
    val officerName: String
) {
    fun toJson(): JSONObject {
        val json = JSONObject()
        json.put("id", id)
        json.put("category", category)
        json.put("latitude", latitude)
        json.put("longitude", longitude)
        json.put("accuracy_meters", accuracyMeters)
        json.put("timestamp_utc", timestampUtc)
        json.put("watermark_text", watermarkText)
        json.put("sha256_hash", sha256Hash)
        json.put("officer_name", officerName)
        if (!base64Thumbnail.isNullOrEmpty()) {
            json.put("thumbnail_base64", base64Thumbnail)
        }
        return json
    }
}
