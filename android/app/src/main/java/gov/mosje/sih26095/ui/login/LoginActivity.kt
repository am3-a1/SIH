package gov.mosje.sih26095.ui.login

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.AdapterView
import android.widget.ArrayAdapter
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.Spinner
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import gov.mosje.sih26095.DoSJEApplication
import gov.mosje.sih26095.R
import gov.mosje.sih26095.api.models.Officer
import gov.mosje.sih26095.ui.audit.AuditActivity
import kotlinx.coroutines.launch
import org.json.JSONArray
import org.json.JSONObject

class LoginActivity : AppCompatActivity() {

    private lateinit var spinnerOfficerSelect: Spinner
    private lateinit var txtOfficerName: TextView
    private lateinit var txtOfficerDesignation: TextView
    private lateinit var txtOfficerStatusBadge: TextView
    private lateinit var layoutAssignmentNotice: LinearLayout
    private lateinit var txtAssignedFacilityName: TextView
    private lateinit var txtAssignedFacilityScheme: TextView
    private lateinit var editSsoPin: EditText
    private lateinit var btnLogin: Button

    private var officerList: List<Officer> = emptyList()
    private var selectedOfficer: Officer? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_login)

        initViews()
        loadOfficers()
    }

    private fun initViews() {
        spinnerOfficerSelect = findViewById(R.id.spinnerOfficerSelect)
        txtOfficerName = findViewById(R.id.txtOfficerName)
        txtOfficerDesignation = findViewById(R.id.txtOfficerDesignation)
        txtOfficerStatusBadge = findViewById(R.id.txtOfficerStatusBadge)
        layoutAssignmentNotice = findViewById(R.id.layoutAssignmentNotice)
        txtAssignedFacilityName = findViewById(R.id.txtAssignedFacilityName)
        txtAssignedFacilityScheme = findViewById(R.id.txtAssignedFacilityScheme)
        editSsoPin = findViewById(R.id.editSsoPin)
        btnLogin = findViewById(R.id.btnLogin)

        val txtServerConfig: TextView = findViewById(R.id.txtServerConfig)
        val app = DoSJEApplication.instance
        txtServerConfig.text = "🌐 Server: ${app.preferences.serverBaseUrl} (Tap to change)"
        txtServerConfig.setOnClickListener {
            val input = EditText(this)
            input.setText(app.preferences.serverBaseUrl)
            AlertDialog.Builder(this)
                .setTitle("DoSJE Central Server URL")
                .setMessage("Select or enter server URL:\n\n" +
                        "• Emulator: http://10.0.2.2:8000\n" +
                        "• USB Tether (adb reverse tcp:8000 tcp:8000): http://localhost:8000\n" +
                        "• Physical Wi-Fi LAN: http://<YOUR_PC_IP>:8000")
                .setView(input)
                .setPositiveButton("Save & Connect") { _, _ ->
                    val newUrl = input.text.toString().trim().removeSuffix("/")
                    if (newUrl.isNotEmpty()) {
                        app.preferences.serverBaseUrl = newUrl
                        txtServerConfig.text = "🌐 Server: $newUrl (Tap to change)"
                        loadOfficers()
                    }
                }
                .setNeutralButton("Use Localhost (8000)") { _, _ ->
                    app.preferences.serverBaseUrl = "http://localhost:8000"
                    txtServerConfig.text = "🌐 Server: http://localhost:8000 (Tap to change)"
                    loadOfficers()
                }
                .setNegativeButton("Cancel", null)
                .show()
        }

        btnLogin.setOnClickListener {
            performLogin()
        }
    }

    private fun loadOfficers() {
        lifecycleScope.launch {
            val app = DoSJEApplication.instance
            val result = app.apiClient.getOfficers()
            result.onSuccess { officers ->
                officerList = officers
                setupSpinner(officers)
            }.onFailure { err ->
                Toast.makeText(this@LoginActivity, "Offline mode: Loading cached officers (${err.message})", Toast.LENGTH_SHORT).show()
                setupFallbackOfficers()
            }
        }
    }

    private fun setupSpinner(officers: List<Officer>) {
        val adapter = ArrayAdapter(this, android.R.layout.simple_spinner_item, officers.map { it.toString() })
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        spinnerOfficerSelect.adapter = adapter

        // Pre-select officer with assignment
        val assignedIdx = officers.indexOfFirst { it.hasPendingAssignment }
        if (assignedIdx >= 0) {
            spinnerOfficerSelect.setSelection(assignedIdx)
            updateOfficerDetails(officers[assignedIdx])
        } else if (officers.isNotEmpty()) {
            spinnerOfficerSelect.setSelection(0)
            updateOfficerDetails(officers[0])
        }

        spinnerOfficerSelect.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(parent: AdapterView<*>?, view: View?, position: Int, id: Long) {
                if (position in officers.indices) {
                    updateOfficerDetails(officers[position])
                }
            }
            override fun onNothingSelected(parent: AdapterView<*>?) {}
        }
    }

    private fun updateOfficerDetails(officer: Officer) {
        selectedOfficer = officer
        txtOfficerName.text = officer.fullName
        val loc = if (!officer.district.isNullOrEmpty()) "${officer.district}, ${officer.state}" else (officer.state ?: "National")
        txtOfficerDesignation.text = "${officer.designation} • $loc"

        if (officer.hasPendingAssignment && officer.assignedInspections.isNotEmpty()) {
            txtOfficerStatusBadge.text = "Assigned Audit"
            txtOfficerStatusBadge.setBackgroundColor(getColor(R.color.amber_bg))
            txtOfficerStatusBadge.setTextColor(getColor(R.color.saffron_dark))
            layoutAssignmentNotice.visibility = View.VISIBLE

            val insp = officer.assignedInspections.first()
            txtAssignedFacilityName.text = insp.facilityName
            txtAssignedFacilityScheme.text = "Scheme: ${insp.schemeName} • ${insp.facilityDistrict ?: ""}, ${insp.facilityState ?: ""}"
        } else {
            txtOfficerStatusBadge.text = "Standing by"
            txtOfficerStatusBadge.setBackgroundColor(getColor(R.color.slate_100))
            txtOfficerStatusBadge.setTextColor(getColor(R.color.slate_500))
            layoutAssignmentNotice.visibility = View.GONE
        }
    }

    private fun setupFallbackOfficers() {
        try {
            assets.open("officers_seed.json").use { stream ->
                val reader = java.io.InputStreamReader(stream, Charsets.UTF_8)
                val jsonStr = reader.readText()
                val json = JSONObject(jsonStr)
                val array = json.optJSONArray("officers")
                if (array != null && array.length() > 0) {
                    val list = mutableListOf<Officer>()
                    for (i in 0 until array.length()) {
                        list.add(Officer.fromJson(array.getJSONObject(i)))
                    }
                    officerList = list
                    setupSpinner(list)
                    return
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }

        val defaultOfficers = listOf(
            Officer(
                id = "33333333-3333-3333-3333-333333333333",
                username = "inspector_delhi",
                fullName = "Sunita Rao",
                designation = "Senior Field Inspection Officer",
                role = "DISTRICT_INSPECTOR",
                district = "New Delhi",
                state = "Delhi",
                phone = "+91-9810123456",
                email = "sunita.rao@dosje.gov.in",
                hasPendingAssignment = true,
                assignedFacilityIds = listOf("DOSJE-DL-001"),
                assignedInspections = listOf(
                    gov.mosje.sih26095.api.models.AssignedInspection(
                        inspectionId = "INSP-2026-001",
                        facilityId = "DOSJE-DL-001",
                        facilityName = "Snehalaya Senior Citizens Home",
                        schemeName = "AVYAY (Atal Vayo Abhyuday Yojana)",
                        scheduledDate = "2026-09-12",
                        inspectionType = "SURPRISE_AUDIT",
                        status = "ASSIGNED",
                        facilityDistrict = "New Delhi",
                        facilityState = "Delhi"
                    )
                )
            ),
            Officer(
                id = "OFFICER-002",
                username = "insp_rajesh",
                fullName = "Rajesh Nair",
                designation = "District Welfare Vigilance Officer",
                role = "DISTRICT_INSPECTOR",
                district = "Bangalore",
                state = "Karnataka",
                phone = "+91-9876543210",
                email = "rajesh.nair@dosje.gov.in",
                hasPendingAssignment = false,
                assignedFacilityIds = emptyList(),
                assignedInspections = emptyList()
            )
        )
        officerList = defaultOfficers
        setupSpinner(defaultOfficers)
    }

    private fun performLogin() {
        val officer = selectedOfficer
        if (officer == null) {
            Toast.makeText(this, "Please select an onsite field inspector first", Toast.LENGTH_SHORT).show()
            return
        }

        val pin = editSsoPin.text.toString().trim()
        if (pin.isEmpty()) {
            Toast.makeText(this, "Please enter your GovCloud OAuth2 SSO PIN", Toast.LENGTH_SHORT).show()
            return
        }

        // Save active session in AppPreferences
        val app = DoSJEApplication.instance
        app.preferences.activeOfficerId = officer.id
        app.preferences.activeOfficerName = officer.fullName

        // Serialize assigned facility IDs and inspections to pass to AuditActivity
        val assignedIdsJson = JSONArray(officer.assignedFacilityIds).toString()
        val assignedInspsArray = JSONArray()
        for (i in officer.assignedInspections) {
            val obj = JSONObject().apply {
                put("inspection_id", i.inspectionId)
                put("facility_id", i.facilityId)
                put("facility_name", i.facilityName)
                put("scheme_name", i.schemeName)
                put("scheduled_date", i.scheduledDate)
                put("status", i.status)
            }
            assignedInspsArray.put(obj)
        }

        val intent = Intent(this, AuditActivity::class.java).apply {
            putExtra("officer_id", officer.id)
            putExtra("officer_name", officer.fullName)
            putExtra("officer_designation", officer.designation)
            putExtra("officer_district", officer.district)
            putExtra("officer_state", officer.state)
            putExtra("assigned_facility_ids", assignedIdsJson)
            putExtra("assigned_inspections", assignedInspsArray.toString())
        }
        startActivity(intent)
    }
}
