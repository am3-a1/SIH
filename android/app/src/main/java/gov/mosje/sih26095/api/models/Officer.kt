package gov.mosje.sih26095.api.models

import org.json.JSONArray
import org.json.JSONObject

data class AssignedInspection(
    val inspectionId: String,
    val facilityId: String,
    val facilityName: String,
    val schemeName: String,
    val scheduledDate: String,
    val inspectionType: String,
    val status: String,
    val facilityDistrict: String?,
    val facilityState: String?
) {
    companion object {
        fun fromJson(json: JSONObject): AssignedInspection {
            return AssignedInspection(
                inspectionId = json.optString("inspection_id", ""),
                facilityId = json.optString("facility_id", ""),
                facilityName = json.optString("facility_name", ""),
                schemeName = json.optString("scheme_name", ""),
                scheduledDate = json.optString("scheduled_date", ""),
                inspectionType = json.optString("inspection_type", "SURPRISE_AUDIT"),
                status = json.optString("status", "ASSIGNED"),
                facilityDistrict = if (json.has("facility_district") && !json.isNull("facility_district")) json.getString("facility_district") else null,
                facilityState = if (json.has("facility_state") && !json.isNull("facility_state")) json.getString("facility_state") else null
            )
        }
    }
}

data class Officer(
    val id: String,
    val username: String,
    val fullName: String,
    val designation: String,
    val role: String,
    val district: String?,
    val state: String?,
    val phone: String?,
    val email: String?,
    val hasPendingAssignment: Boolean,
    val assignedFacilityIds: List<String>,
    val assignedInspections: List<AssignedInspection>
) {
    companion object {
        fun fromJson(json: JSONObject): Officer {
            val assignedIds = mutableListOf<String>()
            val idsArray = json.optJSONArray("assigned_facility_ids")
            if (idsArray != null) {
                for (i in 0 until idsArray.length()) {
                    assignedIds.add(idsArray.getString(i))
                }
            }

            val inspections = mutableListOf<AssignedInspection>()
            val inspArray = json.optJSONArray("assigned_inspections")
            if (inspArray != null) {
                for (i in 0 until inspArray.length()) {
                    val item = inspArray.getJSONObject(i)
                    val insp = AssignedInspection.fromJson(item)
                    inspections.add(insp)
                    if (insp.facilityId.isNotEmpty() && !assignedIds.contains(insp.facilityId)) {
                        assignedIds.add(insp.facilityId)
                    }
                }
            }

            return Officer(
                id = json.optString("id", ""),
                username = json.optString("username", ""),
                fullName = json.optString("full_name", json.optString("name", "Officer")),
                designation = json.optString("designation", "Field Vigilance Inspector"),
                role = json.optString("role", "DISTRICT_INSPECTOR"),
                district = if (json.has("district") && !json.isNull("district")) json.getString("district") else null,
                state = if (json.has("state") && !json.isNull("state")) json.getString("state") else null,
                phone = if (json.has("phone") && !json.isNull("phone")) json.getString("phone") else null,
                email = if (json.has("email") && !json.isNull("email")) json.getString("email") else null,
                hasPendingAssignment = json.optBoolean("has_pending_assignment", inspections.isNotEmpty()),
                assignedFacilityIds = assignedIds,
                assignedInspections = inspections
            )
        }
    }

    override fun toString(): String {
        val prefix = if (hasPendingAssignment) "⚡ [ASSIGNED] " else ""
        val loc = if (!district.isNullOrEmpty()) "$district, $state" else (state ?: "National")
        return "$prefix$fullName - $designation ($loc)"
    }
}
