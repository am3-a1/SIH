package gov.mosje.sih26095.api

import android.content.Context
import android.util.Log
import gov.mosje.sih26095.api.models.ChecklistForm
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
import java.io.InputStreamReader
import java.util.concurrent.TimeUnit

class DoSJEApiClient(private val context: Context) {
    private val prefs = AppPreferences(context)
    private val client = OkHttpClient.Builder()
        .connectTimeout(6, TimeUnit.SECONDS)
        .readTimeout(10, TimeUnit.SECONDS)
        .build()

    private val jsonMediaType = "application/json; charset=utf-8".toMediaType()

    /**
     * Executes HTTP request against configured server.
     * If 404 or connection refused occurs, automatically tests alternative port (3000 vs 8000)
     * and updates prefs if the alternate responds.
     */
    private fun executeHttp(path: String, bodyJson: JSONObject? = null): Pair<Int, String?> {
        val primaryBase = prefs.serverBaseUrl.trim().removeSuffix("/")
        val alternateBase = when {
            primaryBase.contains(":3000") -> primaryBase.replace(":3000", ":8000")
            primaryBase.contains(":8000") -> primaryBase.replace(":8000", ":3000")
            else -> null
        }

        val candidates = listOfNotNull(primaryBase, alternateBase).distinct()

        var lastCode = 0
        var lastBody: String? = null

        for (base in candidates) {
            try {
                val url = "$base$path"
                val reqBuilder = Request.Builder().url(url)
                if (bodyJson != null) {
                    val body = bodyJson.toString().toRequestBody(jsonMediaType)
                    reqBuilder.post(body)
                    reqBuilder.header("Content-Type", "application/json")
                } else {
                    reqBuilder.get()
                }
                reqBuilder.header("User-Agent", "DoSJE-Native-Android-App/2.0")

                client.newCall(reqBuilder.build()).execute().use { response ->
                    lastCode = response.code
                    lastBody = response.body?.string()
                    if (response.isSuccessful) {
                        // If alternate port worked, update preferences for future calls
                        if (base != primaryBase) {
                            prefs.serverBaseUrl = base
                            Log.i("DoSJEApiClient", "Switched active serverBaseUrl to $base")
                        }
                        return Pair(lastCode, lastBody)
                    }
                }
            } catch (e: Exception) {
                Log.w("DoSJEApiClient", "Connection failed for $base$path: ${e.message}")
            }
        }

        return Pair(lastCode, lastBody)
    }

    suspend fun getOfficers(): Result<List<Officer>> = withContext(Dispatchers.IO) {
        try {
            val (code, body) = executeHttp("/api/v1/officers")
            if (code in 200..299 && !body.isNullOrEmpty()) {
                val json = JSONObject(body)
                val array = json.optJSONArray("officers")
                if (array != null) {
                    val list = mutableListOf<Officer>()
                    for (i in 0 until array.length()) {
                        list.add(Officer.fromJson(array.getJSONObject(i)))
                    }
                    if (list.isNotEmpty()) {
                        return@withContext Result.success(list)
                    }
                }
            }
        } catch (e: Exception) {
            Log.w("DoSJEApiClient", "Network fetch failed for officers, loading asset seed: ${e.message}")
        }

        // Graceful Asset Fallback - ensures app works seamlessly even offline or without server
        try {
            context.assets.open("officers_seed.json").use { stream ->
                val jsonStr = InputStreamReader(stream, Charsets.UTF_8).readText()
                val json = JSONObject(jsonStr)
                val array = json.optJSONArray("officers") ?: return@withContext Result.failure(Exception("No officers in asset seed"))
                val list = mutableListOf<Officer>()
                for (i in 0 until array.length()) {
                    list.add(Officer.fromJson(array.getJSONObject(i)))
                }
                return@withContext Result.success(list)
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getFacilities(): Result<List<Facility>> = withContext(Dispatchers.IO) {
        try {
            val (code, body) = executeHttp("/api/v1/facilities")
            if (code in 200..299 && !body.isNullOrEmpty()) {
                val json = JSONObject(body)
                val array = json.optJSONArray("facilities")
                if (array != null) {
                    val list = mutableListOf<Facility>()
                    for (i in 0 until array.length()) {
                        list.add(Facility.fromJson(array.getJSONObject(i)))
                    }
                    if (list.isNotEmpty()) {
                        return@withContext Result.success(list)
                    }
                }
            }
        } catch (e: Exception) {
            Log.w("DoSJEApiClient", "Network fetch failed for facilities, loading asset seed: ${e.message}")
        }

        // Graceful Asset Fallback
        try {
            context.assets.open("facilities_seed.json").use { stream ->
                val jsonStr = InputStreamReader(stream, Charsets.UTF_8).readText()
                val json = JSONObject(jsonStr)
                val array = json.optJSONArray("facilities") ?: return@withContext Result.failure(Exception("No facilities in asset seed"))
                val list = mutableListOf<Facility>()
                for (i in 0 until array.length()) {
                    list.add(Facility.fromJson(array.getJSONObject(i)))
                }
                return@withContext Result.success(list)
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getOfficerAssignments(officerId: String): Result<List<Facility>> = withContext(Dispatchers.IO) {
        try {
            val (code, body) = executeHttp("/api/v1/officers/$officerId/assignments")
            if (code in 200..299 && !body.isNullOrEmpty()) {
                val json = JSONObject(body)
                val array = json.optJSONArray("assignments")
                if (array != null) {
                    val list = mutableListOf<Facility>()
                    for (i in 0 until array.length()) {
                        val obj = array.getJSONObject(i)
                        list.add(
                            Facility(
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
                            )
                        )
                    }
                    if (list.isNotEmpty()) {
                        return@withContext Result.success(list)
                    }
                }
            }
        } catch (e: Exception) {
            Log.w("DoSJEApiClient", "Network fetch failed for assignments, filtering assets: ${e.message}")
        }

        // Local asset matching for officer assignments
        try {
            val facResult = getFacilities()
            val allFacs = facResult.getOrNull() ?: emptyList()
            val offResult = getOfficers()
            val officer = offResult.getOrNull()?.find { it.id == officerId }

            if (officer != null && officer.hasPendingAssignment) {
                val targetIds = officer.assignedFacilityIds
                val matches = allFacs.filter { targetIds.contains(it.id) }
                return@withContext Result.success(matches)
            }
            Result.success(emptyList())
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun submitInspection(submission: InspectionSubmission): Result<SubmissionResponse> = withContext(Dispatchers.IO) {
        try {
            val (code, body) = executeHttp("/api/v1/inspections/submit", submission.toJson())
            if (code in 200..299 && !body.isNullOrEmpty()) {
                val json = JSONObject(body)
                if (json.optString("status") != "ERROR") {
                    val result = SubmissionResponse.fromJson(json)
                    return@withContext Result.success(result)
                }
                val errMsg = json.optString("message", "Submission rejected by server")
                return@withContext Result.failure(Exception(errMsg))
            }
            Result.failure(Exception("Server returned HTTP $code. Check server or save offline package."))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getChecklist(): Result<ChecklistForm> = withContext(Dispatchers.IO) {
        try {
            val (code, body) = executeHttp("/api/v1/checklist")
            if (code in 200..299 && !body.isNullOrEmpty()) {
                val json = JSONObject(body)
                val checklistObj = json.optJSONObject("checklist")
                if (checklistObj != null) {
                    val form = ChecklistForm.fromJson(checklistObj)
                    if (form.questions.isNotEmpty()) {
                        return@withContext Result.success(form)
                    }
                }
            }
        } catch (e: Exception) {
            Log.w("DoSJEApiClient", "Network fetch failed for checklist, loading asset schema: ${e.message}")
        }

        // Graceful Asset Fallback
        try {
            context.assets.open("checklist_schema.json").use { stream ->
                val jsonStr = InputStreamReader(stream, Charsets.UTF_8).readText()
                val json = JSONObject(jsonStr)
                val form = ChecklistForm.fromJson(json)
                return@withContext Result.success(form)
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
