package gov.mosje.sih26095.api.models

import org.json.JSONArray
import org.json.JSONObject

data class InspectionScores(
    val infrastructure: Int,
    val hygiene: Int,
    val food: Int,
    val medical: Int,
    val attendance: Int
) {
    val totalScore: Int
        get() = Math.round((infrastructure + hygiene + food + medical + attendance) / 5.0f)

    val grade: String
        get() = when {
            totalScore >= 80 -> "GRADE A"
            totalScore >= 60 -> "GRADE B"
            totalScore >= 40 -> "GRADE C"
            else -> "GRADE D"
        }

    fun toJson(): JSONObject {
        val json = JSONObject()
        json.put("infrastructure", infrastructure)
        json.put("hygiene", hygiene)
        json.put("food", food)
        json.put("medical", medical)
        json.put("attendance", attendance)
        return json
    }
}

data class InspectionSubmission(
    val inspectionId: String?,
    val facilityId: String,
    val facilityName: String,
    val inspectorId: String,
    val inspectorName: String,
    val inspectorLatitude: Double,
    val inspectorLongitude: Double,
    val scores: InspectionScores,
    val photos: List<EvidencePhoto>,
    val inspectorSigned: Boolean,
    val headSigned: Boolean,
    val clientNonce: String,
    val isSimulatedOnsite: Boolean = false,
    val inspectionType: String = "SURPRISE_AUDIT",
    val clientApp: String = "Native Android App (Kotlin/AndroidX)",
    val responses: Map<String, Any> = emptyMap()
) {
    fun toJson(): JSONObject {
        val json = JSONObject()
        json.put("inspection_id", inspectionId)
        json.put("facility_id", facilityId)
        json.put("facility_name", facilityName)
        json.put("inspector_id", inspectorId)
        json.put("inspector_name", inspectorName)
        json.put("inspector_latitude", inspectorLatitude)
        json.put("inspector_longitude", inspectorLongitude)
        json.put("scores", scores.toJson())
        json.put("inspector_signed", inspectorSigned)
        json.put("facility_head_signed", headSigned)
        json.put("client_nonce", clientNonce)
        json.put("is_simulated_onsite", isSimulatedOnsite)
        json.put("inspection_type", inspectionType)
        json.put("client_app", clientApp)

        val respJson = JSONObject()
        for ((k, v) in responses) {
            respJson.put(k, v)
        }
        json.put("responses", respJson)

        val photoArray = JSONArray()
        for (p in photos) {
            photoArray.put(p.toJson())
        }
        json.put("photos_evidence", photoArray)

        return json
    }
}

data class SubmissionResponse(
    val status: String,
    val inspectionId: String,
    val totalComplianceScore: Int,
    val geofenceVerified: Boolean,
    val aes256PackageHash: String,
    val message: String?
) {
    companion object {
        fun fromJson(json: JSONObject): SubmissionResponse {
            return SubmissionResponse(
                status = json.optString("status", "SUCCESS"),
                inspectionId = json.optString("inspection_id", ""),
                totalComplianceScore = json.optInt("total_compliance_score", 85),
                geofenceVerified = json.optBoolean("geofence_verified", true) || json.optInt("geofence_verified", 0) == 1,
                aes256PackageHash = json.optString("aes256_package_hash", "verified_hash"),
                message = if (json.has("message") && !json.isNull("message")) json.getString("message") else null
            )
        }
    }
}
