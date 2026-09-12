package gov.mosje.sih26095.api.models

import org.json.JSONObject

data class Facility(
    val id: String,
    val name: String,
    val schemeCode: String,
    val schemeName: String,
    val organizationName: String,
    val address: String,
    val district: String,
    val state: String,
    val pincode: String,
    val latitude: Double,
    val longitude: Double,
    val geofenceRadiusMeters: Double,
    val sanctionedCapacity: Int,
    val enrolledBeneficiaries: Int,
    val complianceGrade: String,
    val riskScore: Double,
    val inChargeName: String,
    val contactPhone: String
) {
    companion object {
        fun fromJson(json: JSONObject): Facility {
            return Facility(
                id = json.optString("id", ""),
                name = json.optString("name", "Welfare Institution"),
                schemeCode = json.optString("scheme_code", "GEN"),
                schemeName = json.optString("scheme_name", "National Welfare Scheme"),
                organizationName = json.optString("organization_name", "Registered NGO"),
                address = json.optString("address", ""),
                district = json.optString("district", ""),
                state = json.optString("state", "India"),
                pincode = json.optString("pincode", ""),
                latitude = json.optDouble("latitude", 28.5672),
                longitude = json.optDouble("longitude", 77.1734),
                geofenceRadiusMeters = json.optDouble("geofence_radius_meters", 500.0),
                sanctionedCapacity = json.optInt("sanctioned_capacity", 100),
                enrolledBeneficiaries = json.optInt("enrolled_beneficiaries", 80),
                complianceGrade = json.optString("compliance_grade", "A"),
                riskScore = json.optDouble("risk_score", 15.0),
                inChargeName = json.optString("in_charge_name", "Institution Manager"),
                contactPhone = json.optString("contact_phone", "+91-9876543210")
            )
        }
    }
}
