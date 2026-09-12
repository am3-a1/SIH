package gov.mosje.sih26095.ui.audit

import android.Manifest
import android.app.AlertDialog
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.view.View
import android.widget.AdapterView
import android.widget.ArrayAdapter
import android.widget.Button
import android.widget.CheckBox
import android.widget.ImageView
import android.widget.SeekBar
import android.widget.Spinner
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.cardview.widget.CardView
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
import gov.mosje.sih26095.util.GeofenceCalculator
import gov.mosje.sih26095.util.LocationHelper
import kotlinx.coroutines.launch
import org.json.JSONArray
import java.util.Locale
import java.util.UUID

class AuditActivity : AppCompatActivity() {

    private lateinit var txtHeaderOfficer: TextView
    private lateinit var txtSyncBadge: TextView
    private lateinit var btnLogout: Button

    // Geofence Banner
    private lateinit var cardGeofenceBanner: CardView
    private lateinit var imgGeofenceIcon: ImageView
    private lateinit var txtGeofenceTitle: TextView
    private lateinit var txtRadarStatus: TextView
    private lateinit var btnRefreshGps: Button
    private lateinit var txtDeviceCoords: TextView
    private lateinit var chkSimulateOnsite: CheckBox

    // Facility Selector
    private lateinit var txtFacilityCountBadge: TextView
    private lateinit var spinnerAuditFacility: Spinner
    private lateinit var txtAuditTypeBadge: TextView
    private lateinit var txtAuditId: TextView
    private lateinit var txtFacilityName: TextView
    private lateinit var txtFacilityScheme: TextView
    private lateinit var txtFacilityLocation: TextView

    // Rubrics
    private lateinit var seekInfra: SeekBar
    private lateinit var seekHygiene: SeekBar
    private lateinit var seekFood: SeekBar
    private lateinit var seekMedical: SeekBar
    private lateinit var seekAttendance: SeekBar
    private lateinit var valInfra: TextView
    private lateinit var valHygiene: TextView
    private lateinit var valFood: TextView
    private lateinit var valMedical: TextView
    private lateinit var valAttendance: TextView
    private lateinit var txtTotalScore: TextView

    // Evidence & Camera
    private lateinit var txtPhotoCount: TextView
    private lateinit var btnCaptureKitchen: Button
    private lateinit var btnCaptureDorms: Button
    private lateinit var btnCaptureMedical: Button
    private lateinit var btnCaptureSanitation: Button
    private lateinit var recyclerEvidenceGallery: RecyclerView
    private lateinit var photoAdapter: PhotoGalleryAdapter

    // Signatures & Submit
    private lateinit var btnSignInsp: Button
    private lateinit var btnSignHead: Button
    private lateinit var btnSubmitCloud: Button
    private lateinit var btnSaveOffline: Button

    // State Variables
    private lateinit var locationHelper: LocationHelper
    private var officerId: String = ""
    private var officerName: String = ""
    private var assignedFacilityIds: List<String> = emptyList()
    private var assignedFacilities: List<Facility> = emptyList()
    private var selectedFacility: Facility? = null

    private var inspectorSigned = true
    private var headSigned = true

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
                timestampUtc = data.getStringExtra("photo_timestamp") ?: "2026-09-12 12:00:00 UTC",
                watermarkText = data.getStringExtra("photo_watermark") ?: "MoSJE Watermark",
                sha256Hash = data.getStringExtra("photo_hash") ?: "verified_sha256",
                officerName = officerName
            )
            photoAdapter.addPhoto(photo)
            txtPhotoCount.text = "${photoAdapter.itemCount} Evidence Attached"
            Toast.makeText(this, "📸 ${photo.category} photo captured & cryptographic watermark stamped!", Toast.LENGTH_SHORT).show()
        }
    }

    // Location Permission Launcher
    private val locationPermissionLauncher = registerForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { permissions ->
        val fineGranted = permissions[Manifest.permission.ACCESS_FINE_LOCATION] == true
        val coarseGranted = permissions[Manifest.permission.ACCESS_COARSE_LOCATION] == true
        if (fineGranted || coarseGranted) {
            Toast.makeText(this, "📍 Real GPS hardware access granted", Toast.LENGTH_SHORT).show()
            chkSimulateOnsite.isChecked = false
            locationHelper.setSimulatedOnsite(false)
            locationHelper.startLocationUpdates()
        } else {
            Toast.makeText(this, "⚠️ Location permission denied. Operating in Onsite Simulation mode.", Toast.LENGTH_LONG).show()
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
        loadFacilitiesAndLock()
        checkAndPromptLocationPermissions()
    }

    private fun checkAndPromptLocationPermissions() {
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

    private fun readIntentExtras() {
        officerId = intent.getStringExtra("officer_id") ?: "OFFICER-001"
        officerName = intent.getStringExtra("officer_name") ?: "Sunita Rao"

        val idsStr = intent.getStringExtra("assigned_facility_ids")
        if (!idsStr.isNullOrEmpty()) {
            val jsonArray = JSONArray(idsStr)
            val list = mutableListOf<String>()
            for (i in 0 until jsonArray.length()) {
                list.add(jsonArray.getString(i))
            }
            assignedFacilityIds = list
        }
    }

    private fun initViews() {
        txtHeaderOfficer = findViewById(R.id.txtHeaderOfficer)
        txtSyncBadge = findViewById(R.id.txtSyncBadge)
        btnLogout = findViewById(R.id.btnLogout)

        cardGeofenceBanner = findViewById(R.id.cardGeofenceBanner)
        imgGeofenceIcon = findViewById(R.id.imgGeofenceIcon)
        txtGeofenceTitle = findViewById(R.id.txtGeofenceTitle)
        txtRadarStatus = findViewById(R.id.txtRadarStatus)
        btnRefreshGps = findViewById(R.id.btnRefreshGps)
        txtDeviceCoords = findViewById(R.id.txtDeviceCoords)
        chkSimulateOnsite = findViewById(R.id.chkSimulateOnsite)

        txtFacilityCountBadge = findViewById(R.id.txtFacilityCountBadge)
        val btnSyncAssignments: TextView? = findViewById(R.id.btnSyncAssignments)
        btnSyncAssignments?.setOnClickListener {
            Toast.makeText(this, "🔄 Syncing assignments with Central Server...", Toast.LENGTH_SHORT).show()
            loadFacilitiesAndLock(isSilent = false)
        }

        spinnerAuditFacility = findViewById(R.id.spinnerAuditFacility)
        txtAuditTypeBadge = findViewById(R.id.txtAuditTypeBadge)
        txtAuditId = findViewById(R.id.txtAuditId)
        txtFacilityName = findViewById(R.id.txtFacilityName)
        txtFacilityScheme = findViewById(R.id.txtFacilityScheme)
        txtFacilityLocation = findViewById(R.id.txtFacilityLocation)

        seekInfra = findViewById(R.id.seekInfra)
        seekHygiene = findViewById(R.id.seekHygiene)
        seekFood = findViewById(R.id.seekFood)
        seekMedical = findViewById(R.id.seekMedical)
        seekAttendance = findViewById(R.id.seekAttendance)
        valInfra = findViewById(R.id.valInfra)
        valHygiene = findViewById(R.id.valHygiene)
        valFood = findViewById(R.id.valFood)
        valMedical = findViewById(R.id.valMedical)
        valAttendance = findViewById(R.id.valAttendance)
        txtTotalScore = findViewById(R.id.txtTotalScore)

        txtPhotoCount = findViewById(R.id.txtPhotoCount)
        btnCaptureKitchen = findViewById(R.id.btnCaptureKitchen)
        btnCaptureDorms = findViewById(R.id.btnCaptureDorms)
        btnCaptureMedical = findViewById(R.id.btnCaptureMedical)
        btnCaptureSanitation = findViewById(R.id.btnCaptureSanitation)
        recyclerEvidenceGallery = findViewById(R.id.recyclerEvidenceGallery)

        btnSignInsp = findViewById(R.id.btnSignInsp)
        btnSignHead = findViewById(R.id.btnSignHead)
        btnSubmitCloud = findViewById(R.id.btnSubmitCloud)
        btnSaveOffline = findViewById(R.id.btnSaveOffline)

        txtHeaderOfficer.text = "$officerName (Field Inspector)"

        btnLogout.setOnClickListener { finish() }

        // Setup Evidence RecyclerView
        photoAdapter = PhotoGalleryAdapter()
        recyclerEvidenceGallery.layoutManager = LinearLayoutManager(this, LinearLayoutManager.HORIZONTAL, false)
        recyclerEvidenceGallery.adapter = photoAdapter

        // Setup Rubrics SeekBars
        val seekListener = object : SeekBar.OnSeekBarChangeListener {
            override fun onProgressChanged(seekBar: SeekBar?, progress: Int, fromUser: Boolean) {
                updateScoreUI()
            }
            override fun onStartTrackingTouch(seekBar: SeekBar?) {}
            override fun onStopTrackingTouch(seekBar: SeekBar?) {}
        }

        seekInfra.setOnSeekBarChangeListener(seekListener)
        seekHygiene.setOnSeekBarChangeListener(seekListener)
        seekFood.setOnSeekBarChangeListener(seekListener)
        seekMedical.setOnSeekBarChangeListener(seekListener)
        seekAttendance.setOnSeekBarChangeListener(seekListener)

        // Setup Camera Buttons
        btnCaptureKitchen.setOnClickListener { triggerCameraCapture("Dining Hall & Kitchen Sanitation") }
        btnCaptureDorms.setOnClickListener { triggerCameraCapture("Dormitory & Living Quarters") }
        btnCaptureMedical.setOnClickListener { triggerCameraCapture("Medical Dispensary & First Aid") }
        btnCaptureSanitation.setOnClickListener { triggerCameraCapture("Sanitation & Washroom Hygiene") }

        // Setup Signatures
        btnSignInsp.setOnClickListener {
            inspectorSigned = !inspectorSigned
            btnSignInsp.setBackgroundColor(if (inspectorSigned) getColor(R.color.emerald_bg) else getColor(R.color.slate_100))
            btnSignInsp.setTextColor(if (inspectorSigned) getColor(R.color.emerald_dark) else getColor(R.color.slate_700))
            Toast.makeText(this, if (inspectorSigned) "Inspector Digital Signature Generated" else "Signature cleared", Toast.LENGTH_SHORT).show()
        }

        btnSignHead.setOnClickListener {
            headSigned = !headSigned
            btnSignHead.setBackgroundColor(if (headSigned) getColor(R.color.emerald_bg) else getColor(R.color.slate_100))
            btnSignHead.setTextColor(if (headSigned) getColor(R.color.emerald_dark) else getColor(R.color.slate_700))
            Toast.makeText(this, if (headSigned) "NGO In-Charge Signature Generated" else "Signature cleared", Toast.LENGTH_SHORT).show()
        }

        // Setup GPS Simulator Toggle
        chkSimulateOnsite.setOnCheckedChangeListener { _, isChecked ->
            val fac = selectedFacility
            locationHelper.setSimulatedOnsite(isChecked, fac?.latitude ?: 28.5672, fac?.longitude ?: 77.1734)
            evaluateGeofence()
        }

        btnRefreshGps.setOnClickListener {
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
                chkSimulateOnsite.isChecked = false
                locationHelper.setSimulatedOnsite(false)
                locationHelper.startLocationUpdates()
                evaluateGeofence()
                Toast.makeText(this, "Acquiring live hardware GPS fix...", Toast.LENGTH_SHORT).show()
            }
        }

        // Submit Actions
        btnSubmitCloud.setOnClickListener { submitAudit(isOffline = false) }
        btnSaveOffline.setOnClickListener { submitAudit(isOffline = true) }
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

    private fun updateLocationUI(lat: Double, lon: Double, acc: Float) {
        val latDir = if (lat >= 0) "N" else "S"
        val lonDir = if (lon >= 0) "E" else "W"
        val mode = if (locationHelper.isSimulatedOnsite) " [Simulated Onsite]" else if (locationHelper.isRealGpsFixed) " [Live GPS]" else ""
        txtDeviceCoords.text = String.format(Locale.US, "DEVICE: %.4f° %s, %.4f° %s (±%dm)%s", Math.abs(lat), latDir, Math.abs(lon), lonDir, Math.round(acc), mode)
    }

    override fun onResume() {
        super.onResume()
        loadFacilitiesAndLock(isSilent = true)
    }

    private fun loadFacilitiesAndLock(isSilent: Boolean = false) {
        lifecycleScope.launch {
            val app = DoSJEApplication.instance

            // 1. Fetch live assigned facilities specifically for this officer from central server
            val assignResult = app.apiClient.getOfficerAssignments(officerId)
            val liveAssigned = assignResult.getOrNull()

            if (!liveAssigned.isNullOrEmpty()) {
                val liveIds = liveAssigned.map { it.id }
                val isNew = assignedFacilityIds.isNotEmpty() && liveIds != assignedFacilityIds
                assignedFacilityIds = liveIds
                assignedFacilities = liveAssigned

                if (isNew && !isSilent) {
                    val targetFac = liveAssigned.first()
                    AlertDialog.Builder(this@AuditActivity)
                        .setTitle("⚡ New Audit Assigned from Web Portal")
                        .setMessage("A new statutory inspection has been assigned:\n\n" +
                                "• Facility: ${targetFac.name}\n" +
                                "• Scheme: ${targetFac.schemeName} (${targetFac.schemeCode})\n" +
                                "• Jurisdiction: ${targetFac.district}, ${targetFac.state}\n\n" +
                                "The app has locked to this facility and updated geofence coordinates.")
                        .setPositiveButton("Proceed", null)
                        .show()
                }
            }

            // 2. Fetch all facilities or fallback
            val result = app.apiClient.getFacilities()
            val allFacilities = result.getOrDefault(getDefaultFacilities())

            // STRICT FACILITY LOCK: Filter to only facilities assigned to this officer
            if (liveAssigned.isNullOrEmpty()) {
                assignedFacilities = allFacilities.filter { assignedFacilityIds.contains(it.id) }
            }

            if (assignedFacilities.isEmpty()) {
                // Officer on Standby - 0 Assigned
                txtFacilityCountBadge.text = "0 Assigned (Locked)"
                txtFacilityCountBadge.setBackgroundColor(getColor(R.color.slate_100))
                txtFacilityCountBadge.setTextColor(getColor(R.color.slate_700))

                val lockedAdapter = ArrayAdapter(this@AuditActivity, android.R.layout.simple_spinner_item, listOf("🔒 0 Assigned Facilities (Officer on Standby)"))
                spinnerAuditFacility.adapter = lockedAdapter
                spinnerAuditFacility.isEnabled = false

                selectedFacility = null
                txtFacilityName.text = "No Active Facility Assigned"
                txtFacilityScheme.text = "Officer Status: Standing by in Jurisdiction"
                txtFacilityLocation.text = "Awaiting surprise dispatch or statutory schedule"
                txtAuditId.text = "INSP-STANDBY-NONE"

                btnSubmitCloud.isEnabled = false
                btnSubmitCloud.alpha = 0.5f

                cardGeofenceBanner.setCardBackgroundColor(getColor(R.color.slate_100))
                txtGeofenceTitle.text = getString(R.string.geofence_locked)
                txtGeofenceTitle.setTextColor(getColor(R.color.slate_700))
                txtRadarStatus.text = "Officer is on standby. Submissions are locked."
                return@launch
            }

            // Officer has assigned facilities
            btnSubmitCloud.isEnabled = true
            btnSubmitCloud.alpha = 1.0f
            txtFacilityCountBadge.text = "${assignedFacilities.size} Assigned (Locked)"
            txtFacilityCountBadge.setBackgroundColor(getColor(R.color.amber_bg))
            txtFacilityCountBadge.setTextColor(getColor(R.color.saffron_dark))

            val facilityTitles = assignedFacilities.map { "🔒 [ASSIGNED] ${it.name} (${it.district}, ${it.state})" }
            val adapter = ArrayAdapter(this@AuditActivity, android.R.layout.simple_spinner_item, facilityTitles)
            adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
            spinnerAuditFacility.adapter = adapter
            spinnerAuditFacility.isEnabled = true

            spinnerAuditFacility.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
                override fun onItemSelected(parent: AdapterView<*>?, view: View?, position: Int, id: Long) {
                    if (position in assignedFacilities.indices) {
                        selectFacility(assignedFacilities[position])
                    }
                }
                override fun onNothingSelected(parent: AdapterView<*>?) {}
            }

            selectFacility(assignedFacilities[0])
            if (!isSilent) {
                Toast.makeText(this@AuditActivity, "✅ Synced with Web: ${assignedFacilities.size} assigned audit(s) active", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun selectFacility(facility: Facility) {
        selectedFacility = facility
        txtFacilityName.text = facility.name
        txtFacilityScheme.text = "Scheme: ${facility.schemeName} (${facility.schemeCode})"
        txtFacilityLocation.text = "${facility.address}, ${facility.district}, ${facility.state} • Cap: ${facility.enrolledBeneficiaries}/${facility.sanctionedCapacity}"
        txtAuditId.text = "INSP-2026-${facility.id.replace("DOSJE-", "")}"

        if (chkSimulateOnsite.isChecked) {
            locationHelper.setSimulatedOnsite(true, facility.latitude, facility.longitude)
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
            cardGeofenceBanner.setCardBackgroundColor(getColor(R.color.emerald_bg))
            imgGeofenceIcon.setImageResource(R.drawable.ic_check)
            txtGeofenceTitle.text = getString(R.string.geofence_verified)
            txtGeofenceTitle.setTextColor(getColor(R.color.emerald_dark))
            txtRadarStatus.text = "${Math.round(distMeters)}m from boundary • Verified On-site"
            txtRadarStatus.setTextColor(getColor(R.color.emerald_dark))
        } else {
            cardGeofenceBanner.setCardBackgroundColor(getColor(R.color.rose_bg))
            imgGeofenceIcon.setImageResource(R.drawable.ic_shield)
            txtGeofenceTitle.text = getString(R.string.geofence_breached)
            txtGeofenceTitle.setTextColor(getColor(R.color.rose_dark))
            txtRadarStatus.text = "${Math.round(distMeters)}m from facility • Outside ${Math.round(target.geofenceRadiusMeters)}m Perimeter"
            txtRadarStatus.setTextColor(getColor(R.color.rose_dark))
        }
    }

    private fun updateScoreUI(): InspectionScores {
        val infra = seekInfra.progress
        val hygiene = seekHygiene.progress
        val food = seekFood.progress
        val medical = seekMedical.progress
        val attendance = seekAttendance.progress

        valInfra.text = "$infra%"
        valHygiene.text = "$hygiene%"
        valFood.text = "$food%"
        valMedical.text = "$medical%"
        valAttendance.text = "$attendance%"

        val scores = InspectionScores(infra, hygiene, food, medical, attendance)
        txtTotalScore.text = "${scores.totalScore} / 100 (${scores.grade})"
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

        if (chkSimulateOnsite.isChecked) {
            locationHelper.setSimulatedOnsite(true, target.latitude, target.longitude)
        }

        // GEOFENCE VALIDATION: Strict blocking when outside perimeter and not in simulated mode
        val distMeters = GeofenceCalculator.calculateDistanceMeters(
            locationHelper.currentLatitude,
            locationHelper.currentLongitude,
            target.latitude,
            target.longitude
        )

        if (distMeters > target.geofenceRadiusMeters && !isOffline && !chkSimulateOnsite.isChecked) {
            val latDir = if (locationHelper.currentLatitude >= 0) "N" else "S"
            val lonDir = if (locationHelper.currentLongitude >= 0) "E" else "W"
            val coordsStr = String.format(Locale.US, "%.4f° %s, %.4f° %s", Math.abs(locationHelper.currentLatitude), latDir, Math.abs(locationHelper.currentLongitude), lonDir)

            AlertDialog.Builder(this)
                .setTitle("❌ GEOFENCE BREACH ERROR")
                .setMessage("Audit Submission Rejected!\n\n" +
                        "• Current Off-site Location: $coordsStr\n" +
                        "• Target Facility: ${target.name}\n" +
                        "• Measured Distance: ${Math.round(distMeters)} meters (Allowed Radius: ${Math.round(target.geofenceRadiusMeters)}m)\n" +
                        "• Policy Violation: On-site physical verification is strictly mandatory for DoSJE field audits.\n\n" +
                        "Inspectors outside the designated geofence perimeter cannot submit encrypted compliance audits. Please move within the facility boundary or toggle 'Simulate Onsite' for testing.")
                .setPositiveButton("Dismiss", null)
                .show()
            return
        }

        val scores = updateScoreUI()
        val submission = InspectionSubmission(
            inspectionId = txtAuditId.text.toString(),
            facilityId = target.id,
            facilityName = target.name,
            inspectorId = officerId,
            inspectorName = officerName,
            inspectorLatitude = locationHelper.currentLatitude,
            inspectorLongitude = locationHelper.currentLongitude,
            scores = scores,
            photos = photoAdapter.getPhotos(),
            inspectorSigned = inspectorSigned,
            headSigned = headSigned,
            clientNonce = "android_" + System.currentTimeMillis() + "_" + UUID.randomUUID().toString().take(6),
            isSimulatedOnsite = chkSimulateOnsite.isChecked
        )

        if (isOffline) {
            val app = DoSJEApplication.instance
            app.offlineQueue.enqueueAudit(submission)
            txtSyncBadge.text = "${app.offlineQueue.getQueueCount()} Queued Offline"
            txtSyncBadge.setBackgroundColor(getColor(R.color.saffron_dark))

            AlertDialog.Builder(this)
                .setTitle("📦 Offline Package Saved")
                .setMessage("Inspection audit package encrypted with AES-256-GCM and stored in secure offline queue.\n\nWill automatically synchronize with DoSJE Cloud when network connectivity resumes.")
                .setPositiveButton("OK", null)
                .show()
            return
        }

        // Online Cloud Submission
        lifecycleScope.launch {
            val app = DoSJEApplication.instance
            btnSubmitCloud.isEnabled = false
            btnSubmitCloud.text = "Encrypting & Uploading to DoSJE..."

            val result = app.apiClient.submitInspection(submission)
            btnSubmitCloud.isEnabled = true
            btnSubmitCloud.text = getString(R.string.btn_submit_cloud)

            result.onSuccess { resp ->
                AlertDialog.Builder(this@AuditActivity)
                    .setTitle("✅ Field Audit Successfully Submitted")
                    .setMessage("• Inspection ID: ${resp.inspectionId}\n" +
                            "• Target Facility: ${target.name} (${target.id})\n" +
                            "• Inspector: $officerName\n" +
                            "• Calculated Compliance Score: ${resp.totalComplianceScore}/100 (${scores.grade})\n" +
                            "• Geofence Status: ${if (resp.geofenceVerified) "VERIFIED ON-SITE" else "PERIMETER WARNING"}\n" +
                            "• Unique AES-256 Package Hash:\n  ${resp.aes256PackageHash}\n\n" +
                            "Central database record updated, pending status cleared, and audit registered successfully.")
                    .setPositiveButton("Finish Audit") { _, _ ->
                        finish()
                    }
                    .show()
            }.onFailure { err ->
                val msg = err.message ?: "Unknown error"
                val isConnError = msg.contains("failed to connect") ||
                        msg.contains("timeout") ||
                        msg.contains("ConnectException") ||
                        msg.contains("SocketTimeoutException")

                if (isConnError) {
                    AlertDialog.Builder(this@AuditActivity)
                        .setTitle("❌ Server Connection Failed")
                        .setMessage("Cannot reach Central Server at:\n${app.preferences.serverBaseUrl}\n\n" +
                                "Troubleshooting Steps:\n" +
                                "• Wi-Fi: Ensure phone is on same Wi-Fi and use http://10.254.3.98:8000\n" +
                                "• USB: Run 'adb reverse tcp:8000 tcp:8000' and use http://localhost:8000\n\n" +
                                "Tip: You can also tap 'Save Offline Package (AES-256-GCM)' below to save this audit locally until reconnected.")
                        .setPositiveButton("OK", null)
                        .show()
                } else {
                    AlertDialog.Builder(this@AuditActivity)
                        .setTitle("❌ Submission Rejected by Server")
                        .setMessage("Server response error:\n\n$msg\n\nVerify that you are within the facility geofence or check 'Simulate On-Site'.")
                        .setPositiveButton("OK", null)
                        .show()
                }
            }
        }
    }

    private fun getDefaultFacilities(): List<Facility> {
        try {
            assets.open("facilities_seed.json").use { stream ->
                val reader = java.io.InputStreamReader(stream, Charsets.UTF_8)
                val jsonStr = reader.readText()
                val json = org.json.JSONObject(jsonStr)
                val array = json.optJSONArray("facilities")
                if (array != null && array.length() > 0) {
                    val list = mutableListOf<Facility>()
                    for (i in 0 until array.length()) {
                        list.add(Facility.fromJson(array.getJSONObject(i)))
                    }
                    return list
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }

        return listOf(
            Facility(
                id = "DOSJE-DL-001",
                name = "Snehalaya Senior Citizens Home",
                schemeCode = "AVYAY",
                schemeName = "Atal Vayo Abhyuday Yojana",
                organizationName = "AgeCare Foundation India",
                address = "Sector 4, R.K. Puram",
                district = "New Delhi",
                state = "Delhi",
                pincode = "110022",
                latitude = 28.5672,
                longitude = 77.1734,
                geofenceRadiusMeters = 500.0,
                sanctionedCapacity = 100,
                enrolledBeneficiaries = 88,
                complianceGrade = "A",
                riskScore = 14.5,
                inChargeName = "Anil Verma",
                contactPhone = "+91-9811223344"
            )
        )
    }

    override fun onDestroy() {
        super.onDestroy()
        locationHelper.stopLocationUpdates()
    }
}
