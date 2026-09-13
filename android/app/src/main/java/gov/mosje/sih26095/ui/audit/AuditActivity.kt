package gov.mosje.sih26095.ui.audit

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.content.res.ColorStateList
import android.os.Bundle
import android.view.View
import android.widget.Button
import android.widget.CheckBox
import android.widget.EditText
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.SeekBar
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import gov.mosje.sih26095.DoSJEApplication
import gov.mosje.sih26095.R
import gov.mosje.sih26095.api.models.EvidencePhoto
import gov.mosje.sih26095.api.models.Facility
import gov.mosje.sih26095.api.models.InspectionScores
import gov.mosje.sih26095.api.models.InspectionSubmission
import gov.mosje.sih26095.camera.NativeCameraCaptureActivity
import gov.mosje.sih26095.security.HashUtil
import gov.mosje.sih26095.util.GeofenceCalculator
import gov.mosje.sih26095.util.LocationHelper
import kotlinx.coroutines.launch
import org.json.JSONArray
import java.util.Locale
import java.util.UUID

class AuditActivity : AppCompatActivity() {

    // Top Action Bar
    private lateinit var txtHeaderOfficer: TextView
    private lateinit var btnLogout: Button

    // Main Containers
    private lateinit var scrollAuditContainer: ScrollView
    private lateinit var layoutSuccessContainer: LinearLayout

    // GPS Geofence Banner
    private lateinit var layoutGeofenceBanner: LinearLayout
    private lateinit var imgGeofenceIcon: ImageView
    private lateinit var txtGeofenceTitle: TextView
    private lateinit var chkSimulateOnsite: CheckBox
    private lateinit var txtDeviceCoords: TextView
    private lateinit var txtRadarStatus: TextView

    // Locked Facility Card
    private lateinit var txtAuditTypeBadge: TextView
    private lateinit var txtFacilityName: TextView
    private lateinit var txtFacilityLocation: TextView
    private lateinit var txtFacilityCap: TextView
    private lateinit var txtFacilityGrade: TextView

    // Statutory Checklist Items
    private lateinit var editObservation: EditText
    private lateinit var btnCompliant: Button
    private lateinit var btnBreach: Button
    private lateinit var layoutBreachAlert: LinearLayout
    private var isFireSafetyCompliant: Boolean = true

    private lateinit var valRatio: TextView
    private lateinit var seekRatio: SeekBar

    private lateinit var layoutSnapPhotoPrompt: LinearLayout
    private lateinit var recyclerEvidenceGallery: RecyclerView
    private lateinit var photoAdapter: PhotoGalleryAdapter

    // Statutory Rubrics Evaluation
    private lateinit var txtTotalScore: TextView
    private lateinit var txtGradeBadge: TextView
    private lateinit var valInfra: TextView
    private lateinit var valHygiene: TextView
    private lateinit var valFood: TextView
    private lateinit var valMedical: TextView
    private lateinit var valAttendance: TextView
    private lateinit var seekInfra: SeekBar
    private lateinit var seekHygiene: SeekBar
    private lateinit var seekFood: SeekBar
    private lateinit var seekMedical: SeekBar
    private lateinit var seekAttendance: SeekBar

    // Actions
    private lateinit var btnSubmitCloud: Button
    private lateinit var btnSaveOffline: Button

    // Screen 3 Success Elements
    private lateinit var txtSuccessInspectionId: TextView
    private lateinit var txtSuccessFacility: TextView
    private lateinit var txtSuccessAuditor: TextView
    private lateinit var txtSuccessHash: TextView
    private lateinit var btnStartAnother: Button

    // State
    private lateinit var locationHelper: LocationHelper
    private var officerId: String = ""
    private var officerName: String = ""
    private var assignedFacilityIds: List<String> = emptyList()
    private var selectedFacility: Facility? = null
    private var inspectionId: String = ""

    // Camera Result Launcher
    private val cameraResultLauncher = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
        if (result.resultCode == RESULT_OK && result.data != null) {
            val data = result.data!!
            val photo = EvidencePhoto(
                id = data.getStringExtra("photo_id") ?: ("EVID-" + UUID.randomUUID().toString().take(8).uppercase()),
                category = data.getStringExtra("photo_category") ?: "On-Site Photo",
                localFilePath = data.getStringExtra("photo_path") ?: "",
                base64Thumbnail = data.getStringExtra("photo_thumb"),
                latitude = locationHelper.currentLatitude,
                longitude = locationHelper.currentLongitude,
                accuracyMeters = locationHelper.currentAccuracy,
                timestampUtc = data.getStringExtra("photo_timestamp") ?: "2026-09-13 12:00:00 UTC",
                watermarkText = data.getStringExtra("photo_watermark") ?: "MoSJE Watermark",
                sha256Hash = data.getStringExtra("photo_hash") ?: "verified_sha256",
                officerName = officerName
            )
            photoAdapter.addPhoto(photo)
            recyclerEvidenceGallery.visibility = View.VISIBLE
            Toast.makeText(this, "📸 On-Site Photo Stamped with Geotag HUD & Cryptographic Seal", Toast.LENGTH_SHORT).show()
        }
    }

    // Location Permission Launcher
    private val locationPermissionLauncher = registerForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { permissions ->
        val fineGranted = permissions[Manifest.permission.ACCESS_FINE_LOCATION] == true
        val coarseGranted = permissions[Manifest.permission.ACCESS_COARSE_LOCATION] == true
        if (fineGranted || coarseGranted) {
            chkSimulateOnsite.isChecked = false
            locationHelper.setSimulatedOnsite(false)
            locationHelper.startLocationUpdates()
        } else {
            chkSimulateOnsite.isChecked = true
            val fac = selectedFacility
            locationHelper.setSimulatedOnsite(true, fac?.latitude ?: 28.5672, fac?.longitude ?: 77.1734)
            evaluateGeofence()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_audit)

        readIntentExtras()
        initViews()
        initLocation()
        loadAssignedFacility()
        checkLocationPermissions()
    }

    private fun readIntentExtras() {
        officerId = intent.getStringExtra("officer_id") ?: "OFFICER-001"
        officerName = intent.getStringExtra("officer_name") ?: "Sunita Rao"

        val idsStr = intent.getStringExtra("assigned_facility_ids")
        if (!idsStr.isNullOrEmpty()) {
            try {
                val jsonArray = JSONArray(idsStr)
                val list = mutableListOf<String>()
                for (i in 0 until jsonArray.length()) {
                    list.add(jsonArray.getString(i))
                }
                assignedFacilityIds = list
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    private fun initViews() {
        txtHeaderOfficer = findViewById(R.id.txtHeaderOfficer)
        btnLogout = findViewById(R.id.btnLogout)
        scrollAuditContainer = findViewById(R.id.scrollAuditContainer)
        layoutSuccessContainer = findViewById(R.id.layoutSuccessContainer)

        layoutGeofenceBanner = findViewById(R.id.layoutGeofenceBanner)
        imgGeofenceIcon = findViewById(R.id.imgGeofenceIcon)
        txtGeofenceTitle = findViewById(R.id.txtGeofenceTitle)
        chkSimulateOnsite = findViewById(R.id.chkSimulateOnsite)
        txtDeviceCoords = findViewById(R.id.txtDeviceCoords)
        txtRadarStatus = findViewById(R.id.txtRadarStatus)

        txtAuditTypeBadge = findViewById(R.id.txtAuditTypeBadge)
        txtFacilityName = findViewById(R.id.txtFacilityName)
        txtFacilityLocation = findViewById(R.id.txtFacilityLocation)
        txtFacilityCap = findViewById(R.id.txtFacilityCap)
        txtFacilityGrade = findViewById(R.id.txtFacilityGrade)

        editObservation = findViewById(R.id.editObservation)
        btnCompliant = findViewById(R.id.btnCompliant)
        btnBreach = findViewById(R.id.btnBreach)
        layoutBreachAlert = findViewById(R.id.layoutBreachAlert)

        valRatio = findViewById(R.id.valRatio)
        seekRatio = findViewById(R.id.seekRatio)

        layoutSnapPhotoPrompt = findViewById(R.id.layoutSnapPhotoPrompt)
        recyclerEvidenceGallery = findViewById(R.id.recyclerEvidenceGallery)

        txtTotalScore = findViewById(R.id.txtTotalScore)
        txtGradeBadge = findViewById(R.id.txtGradeBadge)
        valInfra = findViewById(R.id.valInfra)
        valHygiene = findViewById(R.id.valHygiene)
        valFood = findViewById(R.id.valFood)
        valMedical = findViewById(R.id.valMedical)
        valAttendance = findViewById(R.id.valAttendance)

        seekInfra = findViewById(R.id.seekInfra)
        seekHygiene = findViewById(R.id.seekHygiene)
        seekFood = findViewById(R.id.seekFood)
        seekMedical = findViewById(R.id.seekMedical)
        seekAttendance = findViewById(R.id.seekAttendance)

        btnSubmitCloud = findViewById(R.id.btnSubmitCloud)
        btnSaveOffline = findViewById(R.id.btnSaveOffline)

        txtSuccessInspectionId = findViewById(R.id.txtSuccessInspectionId)
        txtSuccessFacility = findViewById(R.id.txtSuccessFacility)
        txtSuccessAuditor = findViewById(R.id.txtSuccessAuditor)
        txtSuccessHash = findViewById(R.id.txtSuccessHash)
        btnStartAnother = findViewById(R.id.btnStartAnother)

        txtHeaderOfficer.text = "$officerName (Field Inspector)"
        btnLogout.setOnClickListener { finish() }

        // Fire safety buttons toggle
        btnCompliant.setOnClickListener {
            isFireSafetyCompliant = true
            btnCompliant.backgroundTintList = ColorStateList.valueOf(getColor(R.color.emerald_dark))
            btnCompliant.setTextColor(getColor(R.color.white))
            btnBreach.backgroundTintList = ColorStateList.valueOf(getColor(R.color.slate_800))
            btnBreach.setTextColor(getColor(R.color.slate_300))
            layoutBreachAlert.visibility = View.GONE
        }

        btnBreach.setOnClickListener {
            isFireSafetyCompliant = false
            btnBreach.backgroundTintList = ColorStateList.valueOf(getColor(R.color.rose_error))
            btnBreach.setTextColor(getColor(R.color.white))
            btnCompliant.backgroundTintList = ColorStateList.valueOf(getColor(R.color.slate_800))
            btnCompliant.setTextColor(getColor(R.color.slate_300))
            layoutBreachAlert.visibility = View.VISIBLE
        }

        // Beneficiary Ratio SeekBar
        seekRatio.setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
            override fun onProgressChanged(seekBar: SeekBar?, progress: Int, fromUser: Boolean) {
                valRatio.text = "$progress%"
            }
            override fun onStartTrackingTouch(seekBar: SeekBar?) {}
            override fun onStopTrackingTouch(seekBar: SeekBar?) {}
        })

        // Direct Camera prompt
        layoutSnapPhotoPrompt.setOnClickListener {
            triggerCameraCapture("Dining & Kitchen Sanitation")
        }

        // Photo Gallery RecyclerView
        photoAdapter = PhotoGalleryAdapter()
        recyclerEvidenceGallery.layoutManager = LinearLayoutManager(this, LinearLayoutManager.HORIZONTAL, false)
        recyclerEvidenceGallery.adapter = photoAdapter

        // Rubrics SeekBars
        val rubricListener = object : SeekBar.OnSeekBarChangeListener {
            override fun onProgressChanged(seekBar: SeekBar?, progress: Int, fromUser: Boolean) {
                updateRubricsUI()
            }
            override fun onStartTrackingTouch(seekBar: SeekBar?) {}
            override fun onStopTrackingTouch(seekBar: SeekBar?) {}
        }
        seekInfra.setOnSeekBarChangeListener(rubricListener)
        seekHygiene.setOnSeekBarChangeListener(rubricListener)
        seekFood.setOnSeekBarChangeListener(rubricListener)
        seekMedical.setOnSeekBarChangeListener(rubricListener)
        seekAttendance.setOnSeekBarChangeListener(rubricListener)

        // GPS Simulator CheckBox
        chkSimulateOnsite.setOnCheckedChangeListener { _, isChecked ->
            val fac = selectedFacility
            locationHelper.setSimulatedOnsite(isChecked, fac?.latitude ?: 28.5672, fac?.longitude ?: 77.1734)
            evaluateGeofence()
        }

        // Submission Actions
        btnSubmitCloud.setOnClickListener { submitAudit(isOffline = false) }
        btnSaveOffline.setOnClickListener { submitAudit(isOffline = true) }

        // Start Another Inspection
        btnStartAnother.setOnClickListener { finish() }

        updateRubricsUI()
    }

    private fun initLocation() {
        locationHelper = LocationHelper(this)
        locationHelper.setLocationListener { loc ->
            updateLocationUI(loc.latitude, loc.longitude, loc.accuracy)
            evaluateGeofence()
        }
        locationHelper.setSimulatedOnsite(true)
        updateLocationUI(locationHelper.currentLatitude, locationHelper.currentLongitude, locationHelper.currentAccuracy)
    }

    private fun checkLocationPermissions() {
        val fineGranted = ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
        val coarseGranted = ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED
        if (!fineGranted && !coarseGranted) {
            locationPermissionLauncher.launch(
                arrayOf(
                    Manifest.permission.ACCESS_FINE_LOCATION,
                    Manifest.permission.ACCESS_COARSE_LOCATION
                )
            )
        } else {
            locationHelper.startLocationUpdates()
        }
    }

    private fun updateLocationUI(lat: Double, lon: Double, acc: Float) {
        val latDir = if (lat >= 0) "N" else "S"
        val lonDir = if (lon >= 0) "E" else "W"
        txtDeviceCoords.text = String.format(Locale.US, "%.4f° %s, %.4f° %s (±%dm)", Math.abs(lat), latDir, Math.abs(lon), lonDir, Math.round(acc))
    }

    private fun loadAssignedFacility() {
        lifecycleScope.launch {
            val app = DoSJEApplication.instance
            val result = app.apiClient.getOfficerAssignments(officerId)
            val assigned = result.getOrNull()

            if (!assigned.isNullOrEmpty()) {
                bindFacility(assigned.first())
            } else {
                val facResult = app.apiClient.getFacilities()
                val allFacs = facResult.getOrNull() ?: emptyList()
                val matched = allFacs.find { assignedFacilityIds.contains(it.id) } ?: allFacs.firstOrNull()
                if (matched != null) {
                    bindFacility(matched)
                }
            }
        }
    }

    private fun bindFacility(fac: Facility) {
        selectedFacility = fac
        inspectionId = "INSP-2026-${fac.id.replace("DOSJE-", "").take(6)}"

        txtAuditTypeBadge.text = fac.schemeCode
        txtFacilityName.text = fac.name
        txtFacilityLocation.text = "${fac.district}, ${fac.state} • Code: ${fac.id}"
        txtFacilityCap.text = "Cap: ${fac.enrolledBeneficiaries}/${fac.sanctionedCapacity}"
        txtFacilityGrade.text = "Grade: ${fac.complianceGrade} (Risk: ${fac.riskScore.toInt()})"

        if (chkSimulateOnsite.isChecked) {
            locationHelper.setSimulatedOnsite(true, fac.latitude, fac.longitude)
        }
        evaluateGeofence()
    }

    private fun evaluateGeofence() {
        val target = selectedFacility ?: return
        val distMeters = GeofenceCalculator.calculateDistanceMeters(
            locationHelper.currentLatitude,
            locationHelper.currentLongitude,
            target.latitude,
            target.longitude
        )

        val isVerified = distMeters <= target.geofenceRadiusMeters
        if (isVerified) {
            layoutGeofenceBanner.setBackgroundResource(R.drawable.bg_radar_verified)
            imgGeofenceIcon.setImageResource(R.drawable.ic_check)
            txtGeofenceTitle.text = "GPS GEOFENCE VERIFIED"
            txtGeofenceTitle.setTextColor(getColor(R.color.emerald_300))
            txtRadarStatus.text = "Within ${Math.round(target.geofenceRadiusMeters)}m Perimeter"
            txtRadarStatus.setTextColor(getColor(R.color.emerald_400))
        } else {
            layoutGeofenceBanner.setBackgroundResource(R.drawable.bg_radar_breach)
            imgGeofenceIcon.setImageResource(R.drawable.ic_shield)
            txtGeofenceTitle.text = "GPS GEOFENCE BREACH"
            txtGeofenceTitle.setTextColor(getColor(R.color.rose_300))
            txtRadarStatus.text = "${Math.round(distMeters)}m from boundary • Outside Perimeter"
            txtRadarStatus.setTextColor(getColor(R.color.rose_error))
        }
    }

    private fun updateRubricsUI(): InspectionScores {
        val infra = seekInfra.progress
        val hygiene = seekHygiene.progress
        val food = seekFood.progress
        val medical = seekMedical.progress
        val attendance = seekAttendance.progress

        valInfra.text = "$infra% (20%)"
        valHygiene.text = "$hygiene% (20%)"
        valFood.text = "$food% (20%)"
        valMedical.text = "$medical% (20%)"
        valAttendance.text = "$attendance% (20%)"

        val scores = InspectionScores(infra, hygiene, food, medical, attendance)
        txtTotalScore.text = "${scores.totalScore}/100"

        when {
            scores.totalScore >= 80 -> {
                txtGradeBadge.text = "Grade A"
                txtGradeBadge.setBackgroundResource(R.drawable.bg_badge_emerald)
                txtGradeBadge.setTextColor(getColor(R.color.emerald_300))
            }
            scores.totalScore >= 60 -> {
                txtGradeBadge.text = "Grade B"
                txtGradeBadge.setBackgroundResource(R.drawable.bg_badge_teal)
                txtGradeBadge.setTextColor(getColor(R.color.teal_300))
            }
            scores.totalScore >= 40 -> {
                txtGradeBadge.text = "Grade C"
                txtGradeBadge.setBackgroundResource(R.drawable.bg_badge_amber)
                txtGradeBadge.setTextColor(getColor(R.color.amber_300))
            }
            else -> {
                txtGradeBadge.text = "Grade D"
                txtGradeBadge.setBackgroundResource(R.drawable.bg_badge_slate)
                txtGradeBadge.setTextColor(getColor(R.color.rose_error))
            }
        }

        return scores
    }

    private fun triggerCameraCapture(category: String) {
        val target = selectedFacility ?: return
        val intent = Intent(this, NativeCameraCaptureActivity::class.java).apply {
            putExtra("category", category)
            putExtra("facility_name", target.name)
            putExtra("facility_id", target.id)
            putExtra("latitude", locationHelper.currentLatitude)
            putExtra("longitude", locationHelper.currentLongitude)
            putExtra("accuracy", locationHelper.currentAccuracy)
            putExtra("geofence_verified", GeofenceCalculator.isWithinGeofence(locationHelper.currentLatitude, locationHelper.currentLongitude, target.latitude, target.longitude, target.geofenceRadiusMeters))
            putExtra("officer_name", officerName)
        }
        cameraResultLauncher.launch(intent)
    }

    private fun submitAudit(isOffline: Boolean) {
        val target = selectedFacility
        if (target == null) {
            AlertDialog.Builder(this)
                .setTitle("Access Locked")
                .setMessage("No assigned facility is selected. Only designated institutions can be audited.")
                .setPositiveButton("OK", null)
                .show()
            return
        }

        // Geofence verification
        val distMeters = GeofenceCalculator.calculateDistanceMeters(
            locationHelper.currentLatitude,
            locationHelper.currentLongitude,
            target.latitude,
            target.longitude
        )

        if (distMeters > target.geofenceRadiusMeters && !isOffline && !chkSimulateOnsite.isChecked) {
            AlertDialog.Builder(this)
                .setTitle("❌ GPS GEOFENCE BREACH ERROR")
                .setMessage("Audit Submission Rejected!\n\n" +
                        "• Target Facility: ${target.name}\n" +
                        "• Measured Distance: ${Math.round(distMeters)} meters (Allowed Radius: ${Math.round(target.geofenceRadiusMeters)}m)\n" +
                        "• Policy Violation: On-site physical verification is strictly mandatory for DoSJE field audits.\n\n" +
                        "Please move within the facility boundary or toggle 'Simulate Onsite'.")
                .setPositiveButton("Dismiss", null)
                .show()
            return
        }

        val scores = updateRubricsUI()
        val submission = InspectionSubmission(
            inspectionId = inspectionId,
            facilityId = target.id,
            facilityName = target.name,
            inspectorId = officerId,
            inspectorName = officerName,
            inspectorLatitude = locationHelper.currentLatitude,
            inspectorLongitude = locationHelper.currentLongitude,
            scores = scores,
            photos = photoAdapter.getPhotos(),
            inspectorSigned = true,
            headSigned = true,
            clientNonce = "android_" + System.currentTimeMillis() + "_" + UUID.randomUUID().toString().take(6),
            isSimulatedOnsite = chkSimulateOnsite.isChecked
        )

        if (isOffline) {
            val app = DoSJEApplication.instance
            app.offlineQueue.enqueueAudit(submission)
            val generatedHash = "0x" + HashUtil.sha256(submission.toJson().toString()).take(40)

            showSuccessScreen(
                inspectionId = "ENC-OFFLINE-" + System.currentTimeMillis().toString(36).uppercase(),
                facilityName = target.name,
                auditorName = officerName,
                hash = generatedHash
            )
            Toast.makeText(this, "📦 Encrypted Package Stored in Offline Enclave", Toast.LENGTH_LONG).show()
            return
        }

        // Online Cloud Submission
        lifecycleScope.launch {
            val app = DoSJEApplication.instance
            btnSubmitCloud.isEnabled = false
            btnSubmitCloud.text = "Encrypting & Uploading to DoSJE..."

            val result = app.apiClient.submitInspection(submission)
            btnSubmitCloud.isEnabled = true
            btnSubmitCloud.text = "Submit Encrypted Audit to DoSJE"

            result.onSuccess { resp ->
                showSuccessScreen(
                    inspectionId = resp.inspectionId.ifEmpty { inspectionId },
                    facilityName = target.name,
                    auditorName = officerName,
                    hash = resp.aes256PackageHash
                )
            }.onFailure { err ->
                AlertDialog.Builder(this@AuditActivity)
                    .setTitle("⚠️ Submission Notice")
                    .setMessage("${err.message}\n\nWould you like to save this audit locally in the encrypted offline package queue?")
                    .setPositiveButton("Save Offline Package") { _, _ ->
                        submitAudit(isOffline = true)
                    }
                    .setNegativeButton("Retry", null)
                    .show()
            }
        }
    }

    private fun showSuccessScreen(inspectionId: String, facilityName: String, auditorName: String, hash: String) {
        scrollAuditContainer.visibility = View.GONE
        layoutSuccessContainer.visibility = View.VISIBLE

        txtSuccessInspectionId.text = inspectionId
        txtSuccessFacility.text = facilityName
        txtSuccessAuditor.text = auditorName
        txtSuccessHash.text = "SHA-256 SEAL: $hash"
    }

    override fun onDestroy() {
        super.onDestroy()
        locationHelper.stopLocationUpdates()
    }
}
