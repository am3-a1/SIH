package gov.mosje.sih26095.api

import android.content.Context
import gov.mosje.sih26095.api.models.Facility
import gov.mosje.sih26095.api.models.InspectionSubmission
import gov.mosje.sih26095.api.models.Officer
import gov.mosje.sih26095.api.models.SubmissionResponse
import gov.mosje.sih26095.data.AppPreferences
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.util.concurrent.TimeUnit

class DoSJEApiClient(context: Context) {
    private val prefs = AppPreferences(context)
    private val client = OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(15, TimeUnit.SECONDS)
        .build()

    private val jsonMediaType = "application/json; charset=utf-8".toMediaType()

    suspend fun getOfficers(): Result<List<Officer>> = withContext(Dispatchers.IO) {
        try {
            val url = "${prefs.serverBaseUrl}/api/v1/officers"
            val request = Request.Builder().url(url).get().build()
            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    return@withContext Result.failure(Exception("HTTP Error ${response.code}: ${response.message}"))
                }
                val bodyStr = response.body?.string() ?: return@withContext Result.failure(Exception("Empty response"))
                val json = JSONObject(bodyStr)
                val array = json.optJSONArray("officers") ?: return@withContext Result.success(emptyList())
                val list = mutableListOf<Officer>()
                for (i in 0 until array.length()) {
                    list.add(Officer.fromJson(array.getJSONObject(i)))
                }
                Result.success(list)
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getFacilities(): Result<List<Facility>> = withContext(Dispatchers.IO) {
        try {
            val url = "${prefs.serverBaseUrl}/api/v1/facilities"
            val request = Request.Builder().url(url).get().build()
            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    return@withContext Result.failure(Exception("HTTP Error ${response.code}"))
                }
                val bodyStr = response.body?.string() ?: return@withContext Result.failure(Exception("Empty body"))
                val json = JSONObject(bodyStr)
                val array = json.optJSONArray("facilities") ?: return@withContext Result.success(emptyList())
                val list = mutableListOf<Facility>()
                for (i in 0 until array.length()) {
                    list.add(Facility.fromJson(array.getJSONObject(i)))
                }
                Result.success(list)
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getOfficerAssignments(officerId: String): Result<List<Facility>> = withContext(Dispatchers.IO) {
        try {
            val url = "${prefs.serverBaseUrl}/api/v1/officers/$officerId/assignments"
            val request = Request.Builder().url(url).get().build()
            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    return@withContext Result.failure(Exception("HTTP Error ${response.code}"))
                }
                val bodyStr = response.body?.string() ?: return@withContext Result.failure(Exception("Empty body"))
                val json = JSONObject(bodyStr)
                val array = json.optJSONArray("assignments") ?: return@withContext Result.success(emptyList())
                val list = mutableListOf<Facility>()
                for (i in 0 until array.length()) {
                    val obj = array.getJSONObject(i)
                    list.add(Facility(
                        id = obj.optString("facility_id"),
                        name = obj.optString("facility_name"),
                        schemeCode = obj.optString("scheme_code", "DoSJE"),
                        schemeName = obj.optString("scheme_code", "MoSJE Welfare Scheme"),
                        organizationName = "DoSJE Registered Institution",
                        address = "${obj.optString("district")}, ${obj.optString("state")}",
                        district = obj.optString("district"),
                        state = obj.optString("state"),
                        pincode = "110001",
                        latitude = obj.optDouble("latitude", 28.5672),
                        longitude = obj.optDouble("longitude", 77.1734),
                        geofenceRadiusMeters = obj.optDouble("geofence_radius_meters", 500.0),
                        sanctionedCapacity = 100,
                        enrolledBeneficiaries = 80,
                        complianceGrade = "A",
                        riskScore = 15.0,
                        inChargeName = "Facility Head",
                        contactPhone = "+91-9811000000"
                    ))
                }
                Result.success(list)
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun submitInspection(submission: InspectionSubmission): Result<SubmissionResponse> = withContext(Dispatchers.IO) {
        try {
            val url = "${prefs.serverBaseUrl}/api/v1/inspections/submit"
            val body = submission.toJson().toString().toRequestBody(jsonMediaType)
            val request = Request.Builder()
                .url(url)
                .post(body)
                .header("Content-Type", "application/json")
                .header("User-Agent", "DoSJE-Native-Android-App/1.0 (SDK 34)")
                .build()

            client.newCall(request).execute().use { response ->
                val bodyStr = response.body?.string() ?: "{}"
                val json = JSONObject(bodyStr)

                if (!response.isSuccessful || json.optString("status") == "ERROR") {
                    val errMsg = json.optString("message", json.optString("error", "Submission rejected by server (HTTP ${response.code})"))
                    return@withContext Result.failure(Exception(errMsg))
                }

                val result = SubmissionResponse.fromJson(json)
                Result.success(result)
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
