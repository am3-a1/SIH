package gov.mosje.sih26095.ui.audit

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.content.res.ColorStateList
import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.util.Log
import android.util.TypedValue
import android.view.Gravity
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
import gov.mosje.sih26095.api.models.ChecklistForm
import gov.mosje.sih26095.api.models.ChecklistQuestion
import gov.mosje.sih26095.api.models.EvidencePhoto
import gov.mosje.sih26095.api.models.Facility
import gov.mosje.sih26095.api.models.InspectionScores
import gov.mosje.sih26095.api.models.InspectionSubmission
import gov.mosje.sih26095.api.models.RubricItem
import gov.mosje.sih26095.camera.NativeCameraCaptureActivity
import gov.mosje.sih26095.security.HashUtil
import gov.mosje.sih26095.util.GeofenceCalculator
import gov.mosje.sih26095.util.LocationHelper
import kotlinx.coroutines.launch
import org.json.JSONArray
import org.json.JSONObject
import java.io.InputStreamReader
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

    // Dynamic Checklist Section (Synced via /api/v1/checklist)
    private lateinit var txtChecklistTitle: TextView
    private lateinit var txtChecklistCount: TextView
    private lateinit var layoutDynamicQuestions: LinearLayout
    private lateinit var photoAdapter: PhotoGalleryAdapter
    private val attachedGalleryViews = mutableListOf<RecyclerView>()

    private var activeChecklist: ChecklistForm? = null
    private val formResponses = mutableMapOf<String, Any>()
    private var currentInspectionScores = InspectionScores(85, 80, 85, 75, 85)

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
            for (gallery in attachedGalleryViews) {
                gallery.visibility = View.VISIBLE
            }
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
        loadChecklistSchema()
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

        // Dynamic Checklist
        txtChecklistTitle = findViewById(R.id.txtChecklistTitle)
        txtChecklistCount = findViewById(R.id.txtChecklistCount)
        layoutDynamicQuestions = findViewById(R.id.layoutDynamicQuestions)
        photoAdapter = PhotoGalleryAdapter()

        btnSubmitCloud = findViewById(R.id.btnSubmitCloud)
        btnSaveOffline = findViewById(R.id.btnSaveOffline)

        txtSuccessInspectionId = findViewById(R.id.txtSuccessInspectionId)
        txtSuccessFacility = findViewById(R.id.txtSuccessFacility)
        txtSuccessAuditor = findViewById(R.id.txtSuccessAuditor)
        txtSuccessHash = findViewById(R.id.txtSuccessHash)
        btnStartAnother = findViewById(R.id.btnStartAnother)

        txtHeaderOfficer.text = "$officerName (Field Inspector)"
        btnLogout.setOnClickListener { finish() }

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
    }

    private fun dpToPx(dp: Int): Int {
        return (dp * resources.displayMetrics.density).toInt()
    }

    /**
     * Loads the active checklist schema from the server (/api/v1/checklist),
     * falling back gracefully to the offline schema asset.
     */
    private fun loadChecklistSchema() {
        lifecycleScope.launch {
            try {
                val app = DoSJEApplication.instance
                val result = app.apiClient.getChecklist()
                val form = result.getOrNull()
                if (form != null && form.questions.isNotEmpty()) {
                    renderDynamicChecklist(form)
                    return@launch
                }
            } catch (e: Exception) {
                Log.w("AuditActivity", "Failed to fetch remote checklist: ${e.message}")
            }

            // Fallback to offline assets
            try {
                assets.open("checklist_schema.json").use { stream ->
                    val jsonStr = InputStreamReader(stream, Charsets.UTF_8).readText()
                    val assetForm = ChecklistForm.fromJson(JSONObject(jsonStr))
                    renderDynamicChecklist(assetForm)
                }
            } catch (e: Exception) {
                Log.e("AuditActivity", "Failed to load asset checklist: ${e.message}")
            }
        }
    }

    /**
     * Dynamically renders native UI cards for every question in the checklist.
     */
    private fun renderDynamicChecklist(form: ChecklistForm) {
        activeChecklist = form
        txtChecklistTitle.text = "✨ ${form.title}"
        txtChecklistCount.text = "${form.questions.size} Items"
        layoutDynamicQuestions.removeAllViews()
        attachedGalleryViews.clear()

        for ((idx, q) in form.questions.withIndex()) {
            when (q.type) {
                "text" -> buildTextQuestionCard(idx + 1, q)
                "yes_no" -> buildYesNoQuestionCard(idx + 1, q)
                "number_range" -> buildNumberRangeQuestionCard(idx + 1, q)
                "photo_evidence" -> buildPhotoEvidenceQuestionCard(idx + 1, q)
                "rubrics_checklist" -> buildRubricsQuestionCard(idx + 1, q)
                else -> buildTextQuestionCard(idx + 1, q)
            }
        }
    }

    private fun createQuestionCard(): LinearLayout {
        return LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundResource(R.drawable.bg_dark_card)
            val pad = dpToPx(12)
            setPadding(pad, pad, pad, pad)
            val lp = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                bottomMargin = dpToPx(10)
            }
            layoutParams = lp
        }
    }

    private fun addHeaderToCard(card: LinearLayout, index: Int, q: ChecklistQuestion) {
        val titleView = TextView(this).apply {
            text = "$index. ${q.title}${if (q.required) " *" else ""}"
            setTextColor(getColor(R.color.white))
            setTypeface(typeface, android.graphics.Typeface.BOLD)
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 11f)
        }
        card.addView(titleView)

        if (!q.description.isNullOrEmpty()) {
            val descView = TextView(this).apply {
                text = q.description
                setTextColor(getColor(R.color.slate_400))
                setTextSize(TypedValue.COMPLEX_UNIT_SP, 9f)
                val lp = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.WRAP_CONTENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                ).apply {
                    topMargin = dpToPx(2)
                }
                layoutParams = lp
            }
            card.addView(descView)
        }
    }

    // 1. TEXT QUESTION
    private fun buildTextQuestionCard(index: Int, q: ChecklistQuestion) {
        val card = createQuestionCard()
        addHeaderToCard(card, index, q)

        val editText = EditText(this).apply {
            hint = q.placeholder ?: "Enter inspector observation..."
            setHintTextColor(getColor(R.color.slate_500))
            setTextColor(getColor(R.color.white))
            setBackgroundResource(R.drawable.bg_dark_input)
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 10f)
            val hPad = dpToPx(10)
            val vPad = dpToPx(8)
            setPadding(hPad, vPad, hPad, vPad)
            minHeight = dpToPx(42)

            val lp = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                topMargin = dpToPx(8)
            }
            layoutParams = lp

            val defaultVal = formResponses[q.id] as? String ?: ""
            setText(defaultVal)

            addTextChangedListener(object : TextWatcher {
                override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
                override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                    formResponses[q.id] = s?.toString() ?: ""
                }
                override fun afterTextChanged(s: Editable?) {}
            })
        }
        card.addView(editText)
        layoutDynamicQuestions.addView(card)
    }

    // 2. YES/NO QUESTION
    private fun buildYesNoQuestionCard(index: Int, q: ChecklistQuestion) {
        val card = createQuestionCard()
        addHeaderToCard(card, index, q)

        val buttonsRow = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            val lp = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                topMargin = dpToPx(8)
            }
            layoutParams = lp
        }

        val breachAlert = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundResource(R.drawable.bg_radar_breach)
            val pad = dpToPx(8)
            setPadding(pad, pad, pad, pad)
            visibility = View.GONE
            val lp = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                topMargin = dpToPx(6)
            }
            layoutParams = lp

            val alertText = TextView(this@AuditActivity).apply {
                text = "⚠️ Statutory Breach: Dispatches high-priority PMU alert"
                setTextColor(getColor(R.color.rose_300))
                setTextSize(TypedValue.COMPLEX_UNIT_SP, 8f)
            }
            addView(alertText)
        }

        val btnPositive = Button(this).apply {
            text = "✓ " + (if (q.positiveLabel.isNotEmpty()) q.positiveLabel else "Compliant")
            setTextColor(getColor(R.color.white))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 9f)
            setTypeface(typeface, android.graphics.Typeface.BOLD)
            backgroundTintList = ColorStateList.valueOf(getColor(R.color.emerald_dark))
            val lp = LinearLayout.LayoutParams(0, dpToPx(38), 1f).apply {
                marginEnd = dpToPx(4)
            }
            layoutParams = lp
        }

        val btnNegative = Button(this).apply {
            text = "✕ " + (if (q.negativeLabel.isNotEmpty()) q.negativeLabel else "Breach")
            setTextColor(getColor(R.color.slate_300))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 9f)
            backgroundTintList = ColorStateList.valueOf(getColor(R.color.slate_800))
            val lp = LinearLayout.LayoutParams(0, dpToPx(38), 1f).apply {
                marginStart = dpToPx(4)
            }
            layoutParams = lp
        }

        formResponses[q.id] = true

        btnPositive.setOnClickListener {
            formResponses[q.id] = true
            btnPositive.backgroundTintList = ColorStateList.valueOf(getColor(R.color.emerald_dark))
            btnPositive.setTextColor(getColor(R.color.white))
            btnNegative.backgroundTintList = ColorStateList.valueOf(getColor(R.color.slate_800))
            btnNegative.setTextColor(getColor(R.color.slate_300))
            breachAlert.visibility = View.GONE
        }

        btnNegative.setOnClickListener {
            formResponses[q.id] = false
            btnNegative.backgroundTintList = ColorStateList.valueOf(getColor(R.color.rose_error))
            btnNegative.setTextColor(getColor(R.color.white))
            btnPositive.backgroundTintList = ColorStateList.valueOf(getColor(R.color.slate_800))
            btnPositive.setTextColor(getColor(R.color.slate_300))
            if (q.criticalFailure) {
                breachAlert.visibility = View.VISIBLE
            }
        }

        buttonsRow.addView(btnPositive)
        buttonsRow.addView(btnNegative)
        card.addView(buttonsRow)
        card.addView(breachAlert)
        layoutDynamicQuestions.addView(card)
    }

    // 3. NUMBER RANGE QUESTION
    private fun buildNumberRangeQuestionCard(index: Int, q: ChecklistQuestion) {
        val card = createQuestionCard()
        addHeaderToCard(card, index, q)

        val unitStr = if (!q.unit.isNullOrEmpty()) " ${q.unit}" else ""
        val initialVal = q.targetThreshold ?: q.min

        val labelRow = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            val lp = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                topMargin = dpToPx(4)
            }
            layoutParams = lp
        }

        val promptLabel = TextView(this).apply {
            text = "Recorded Value:"
            setTextColor(getColor(R.color.slate_400))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 10f)
            val lp = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
            layoutParams = lp
        }

        val valDisplay = TextView(this).apply {
            text = "$initialVal$unitStr"
            setTextColor(getColor(R.color.amber_300))
            setTypeface(android.graphics.Typeface.MONOSPACE, android.graphics.Typeface.BOLD)
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 10f)
        }

        labelRow.addView(promptLabel)
        labelRow.addView(valDisplay)
        card.addView(labelRow)

        val seekBar = SeekBar(this).apply {
            max = if (q.max > 0) q.max else 100
            progress = initialVal
            thumbTintList = ColorStateList.valueOf(getColor(R.color.amber_400))
            progressTintList = ColorStateList.valueOf(getColor(R.color.amber_400))
            val lp = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                topMargin = dpToPx(4)
            }
            layoutParams = lp

            setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
                override fun onProgressChanged(sb: SeekBar?, prog: Int, fromUser: Boolean) {
                    valDisplay.text = "$prog$unitStr"
                    formResponses[q.id] = prog
                }
                override fun onStartTrackingTouch(sb: SeekBar?) {}
                override fun onStopTrackingTouch(sb: SeekBar?) {}
            })
        }
        card.addView(seekBar)

        formResponses[q.id] = initialVal
        layoutDynamicQuestions.addView(card)
    }

    // 4. PHOTO EVIDENCE QUESTION
    private fun buildPhotoEvidenceQuestionCard(index: Int, q: ChecklistQuestion) {
        val card = createQuestionCard()
        addHeaderToCard(card, index, q)

        val promptButton = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setBackgroundResource(R.drawable.bg_dark_input)
            val vPad = dpToPx(14)
            val hPad = dpToPx(10)
            setPadding(hPad, vPad, hPad, vPad)
            val lp = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                topMargin = dpToPx(8)
            }
            layoutParams = lp

            val cameraIcon = ImageView(this@AuditActivity).apply {
                setImageResource(R.drawable.ic_camera)
                val iconSize = dpToPx(36)
                layoutParams = LinearLayout.LayoutParams(iconSize, iconSize)
            }
            val titleText = TextView(this@AuditActivity).apply {
                text = "Snap Direct On-Site Camera Photo"
                setTextColor(getColor(R.color.white))
                setTypeface(typeface, android.graphics.Typeface.BOLD)
                setTextSize(TypedValue.COMPLEX_UNIT_SP, 11f)
                val lp = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.WRAP_CONTENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                ).apply {
                    topMargin = dpToPx(6)
                }
                layoutParams = lp
            }
            val subtitleText = TextView(this@AuditActivity).apply {
                text = "GPS Geotag HUD & SHA-256 Watermark Stamped Directly"
                setTextColor(getColor(R.color.amber_300))
                setTypeface(android.graphics.Typeface.MONOSPACE)
                setTextSize(TypedValue.COMPLEX_UNIT_SP, 8f)
                val lp = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.WRAP_CONTENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                ).apply {
                    topMargin = dpToPx(1)
                }
                layoutParams = lp
            }
            val noticeText = TextView(this@AuditActivity).apply {
                text = "🔒 Device gallery upload disabled per DoSJE Anti-Spoofing Rule 4.2"
                setTextColor(getColor(R.color.slate_500))
                setTextSize(TypedValue.COMPLEX_UNIT_SP, 8f)
                val lp = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.WRAP_CONTENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                ).apply {
                    topMargin = dpToPx(6)
                }
                layoutParams = lp
            }

            addView(cameraIcon)
            addView(titleText)
            addView(subtitleText)
            addView(noticeText)

            setOnClickListener {
                triggerCameraCapture(q.photoCategory ?: "On-Site Evidence")
            }
        }
        card.addView(promptButton)

        val recyclerGallery = RecyclerView(this).apply {
            layoutManager = LinearLayoutManager(this@AuditActivity, LinearLayoutManager.HORIZONTAL, false)
            adapter = photoAdapter
            val lp = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                dpToPx(140)
            ).apply {
                topMargin = dpToPx(8)
            }
            layoutParams = lp
            visibility = if (photoAdapter.itemCount > 0) View.VISIBLE else View.GONE
        }
        card.addView(recyclerGallery)
        attachedGalleryViews.add(recyclerGallery)

        layoutDynamicQuestions.addView(card)
    }

    // 5. RUBRICS CHECKLIST QUESTION
    private fun buildRubricsQuestionCard(index: Int, q: ChecklistQuestion) {
        val card = createQuestionCard()

        val headerRow = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            val lp = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                bottomMargin = dpToPx(8)
            }
            layoutParams = lp
        }

        val titleView = TextView(this).apply {
            text = "🎖️ ${q.title}"
            setTextColor(getColor(R.color.teal_300))
            setTypeface(typeface, android.graphics.Typeface.BOLD)
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 11f)
            val lp = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
            layoutParams = lp
        }

        val txtTotal = TextView(this).apply {
            text = "85/100"
            setTextColor(getColor(R.color.white))
            setTypeface(android.graphics.Typeface.MONOSPACE, android.graphics.Typeface.BOLD)
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 10f)
            val lp = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                marginEnd = dpToPx(6)
            }
            layoutParams = lp
        }

        val txtGrade = TextView(this).apply {
            text = "Grade A"
            setTextColor(getColor(R.color.emerald_300))
            setBackgroundResource(R.drawable.bg_badge_emerald)
            setTypeface(typeface, android.graphics.Typeface.BOLD)
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 8f)
            val hPad = dpToPx(6)
            val vPad = dpToPx(2)
            setPadding(hPad, vPad, hPad, vPad)
        }

        headerRow.addView(titleView)
        headerRow.addView(txtTotal)
        headerRow.addView(txtGrade)
        card.addView(headerRow)

        val rubricsList = if (q.rubrics.isNotEmpty()) q.rubrics else listOf(
            RubricItem("r_infra", "1. Infrastructure & Fire Safety", 20, 85),
            RubricItem("r_hygiene", "2. Hygiene & Cleanliness", 20, 85),
            RubricItem("r_food", "3. Food & Nutrition Standard", 20, 85),
            RubricItem("r_medical", "4. Medical Ward & Care Log", 20, 80),
            RubricItem("r_attendance", "5. Staff & Beneficiary Roll", 20, 85)
        )

        val rubricScoreMap = mutableMapOf<String, Int>()
        val seekBars = mutableListOf<Pair<RubricItem, SeekBar>>()

        fun updateRubricScores() {
            var totalWeight = 0
            var weightedSum = 0.0
            for ((item, sb) in seekBars) {
                val weight = if (item.weight > 0) item.weight else 20
                totalWeight += weight
                weightedSum += sb.progress * weight
                rubricScoreMap[item.id] = sb.progress
            }

            val finalScore = if (totalWeight > 0) Math.round(weightedSum / totalWeight).toInt() else 85
            txtTotal.text = "$finalScore/100"

            when {
                finalScore >= 80 -> {
                    txtGrade.text = "Grade A"
                    txtGrade.setBackgroundResource(R.drawable.bg_badge_emerald)
                    txtGrade.setTextColor(getColor(R.color.emerald_300))
                }
                finalScore >= 60 -> {
                    txtGrade.text = "Grade B"
                    txtGrade.setBackgroundResource(R.drawable.bg_badge_teal)
                    txtGrade.setTextColor(getColor(R.color.teal_300))
                }
                finalScore >= 40 -> {
                    txtGrade.text = "Grade C"
                    txtGrade.setBackgroundResource(R.drawable.bg_badge_amber)
                    txtGrade.setTextColor(getColor(R.color.amber_300))
                }
                else -> {
                    txtGrade.text = "Grade D"
                    txtGrade.setBackgroundResource(R.drawable.bg_badge_slate)
                    txtGrade.setTextColor(getColor(R.color.rose_error))
                }
            }

            currentInspectionScores = InspectionScores(
                infrastructure = rubricScoreMap["r_infra"] ?: rubricScoreMap.values.firstOrNull() ?: finalScore,
                hygiene = rubricScoreMap["r_hygiene"] ?: finalScore,
                food = rubricScoreMap["r_food"] ?: finalScore,
                medical = rubricScoreMap["r_medical"] ?: finalScore,
                attendance = rubricScoreMap["r_attendance"] ?: finalScore
            )
            formResponses[q.id] = rubricScoreMap
        }

        for (item in rubricsList) {
            val rubricRow = LinearLayout(this).apply {
                orientation = LinearLayout.HORIZONTAL
                val lp = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                )
                layoutParams = lp
            }

            val nameLabel = TextView(this).apply {
                text = item.name
                setTextColor(getColor(R.color.slate_300))
                setTextSize(TypedValue.COMPLEX_UNIT_SP, 9f)
                val lp = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
                layoutParams = lp
            }

            val scoreLabel = TextView(this).apply {
                text = "${item.defaultScore}% (${item.weight}%)"
                setTextColor(getColor(R.color.teal_300))
                setTypeface(android.graphics.Typeface.MONOSPACE)
                setTextSize(TypedValue.COMPLEX_UNIT_SP, 9f)
            }

            rubricRow.addView(nameLabel)
            rubricRow.addView(scoreLabel)
            card.addView(rubricRow)

            val seekBar = SeekBar(this).apply {
                max = 100
                progress = item.defaultScore
                thumbTintList = ColorStateList.valueOf(getColor(R.color.teal_400))
                progressTintList = ColorStateList.valueOf(getColor(R.color.teal_400))
                val lp = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                ).apply {
                    bottomMargin = dpToPx(6)
                }
                layoutParams = lp

                setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
                    override fun onProgressChanged(sb: SeekBar?, prog: Int, fromUser: Boolean) {
                        scoreLabel.text = "$prog% (${item.weight}%)"
                        updateRubricScores()
                    }
                    override fun onStartTrackingTouch(sb: SeekBar?) {}
                    override fun onStopTrackingTouch(sb: SeekBar?) {}
                })
            }
            card.addView(seekBar)
            seekBars.add(Pair(item, seekBar))
        }

        updateRubricScores()
        layoutDynamicQuestions.addView(card)
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

        val submission = InspectionSubmission(
            inspectionId = inspectionId,
            facilityId = target.id,
            facilityName = target.name,
            inspectorId = officerId,
            inspectorName = officerName,
            inspectorLatitude = locationHelper.currentLatitude,
            inspectorLongitude = locationHelper.currentLongitude,
            scores = currentInspectionScores,
            photos = photoAdapter.getPhotos(),
            inspectorSigned = true,
            headSigned = true,
            clientNonce = "android_" + System.currentTimeMillis() + "_" + UUID.randomUUID().toString().take(6),
            isSimulatedOnsite = chkSimulateOnsite.isChecked,
            responses = formResponses
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
        btnSubmitCloud.isEnabled = false
        btnSubmitCloud.text = "Encrypting & Stamping to GovCloud..."

        lifecycleScope.launch {
            val app = DoSJEApplication.instance
            val result = app.apiClient.submitInspection(submission)

            btnSubmitCloud.isEnabled = true
            btnSubmitCloud.text = "Submit Encrypted Audit to DoSJE"

            result.onSuccess { response ->
                showSuccessScreen(
                    inspectionId = response.inspectionId.ifEmpty { inspectionId },
                    facilityName = target.name,
                    auditorName = officerName,
                    hash = response.aes256PackageHash
                )
            }.onFailure { err ->
                AlertDialog.Builder(this@AuditActivity)
                    .setTitle("Submission Failed")
                    .setMessage(err.message ?: "Connection error. You can tap 'Save Offline Package' to store in local enclave.")
                    .setPositiveButton("OK", null)
                    .show()
            }
        }
    }

    private fun showSuccessScreen(
        inspectionId: String,
        facilityName: String,
        auditorName: String,
        hash: String
    ) {
        scrollAuditContainer.visibility = View.GONE
        layoutSuccessContainer.visibility = View.VISIBLE

        txtSuccessInspectionId.text = inspectionId
        txtSuccessFacility.text = facilityName
        txtSuccessAuditor.text = "$auditorName (Field Inspector)"
        txtSuccessHash.text = hash
    }
}
