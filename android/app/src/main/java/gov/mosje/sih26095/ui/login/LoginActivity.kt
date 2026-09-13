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
    private lateinit var layoutStandbyNotice: LinearLayout
    private lateinit var txtAssignedFacilityName: TextView
    private lateinit var txtAssignedFacilityScheme: TextView
    private lateinit var editSsoPin: EditText
    private lateinit var btnLogin: Button
    private lateinit var txtServerConfig: TextView
    private lateinit var btnTestConnection: Button
    private lateinit var txtConnectionStatus: TextView

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
        layoutStandbyNotice = findViewById(R.id.layoutStandbyNotice)
        txtAssignedFacilityName = findViewById(R.id.txtAssignedFacilityName)
        txtAssignedFacilityScheme = findViewById(R.id.txtAssignedFacilityScheme)
        editSsoPin = findViewById(R.id.editSsoPin)
        btnLogin = findViewById(R.id.btnLogin)
        txtServerConfig = findViewById(R.id.txtServerConfig)
        btnTestConnection = findViewById(R.id.btnTestConnection)
        txtConnectionStatus = findViewById(R.id.txtConnectionStatus)

        val app = DoSJEApplication.instance

        txtServerConfig.text = "🌐 ${app.preferences.serverBaseUrl}"

        val openServerConfig = View.OnClickListener {
            showServerConfigDialog()
        }
        txtServerConfig.setOnClickListener(openServerConfig)
        btnTestConnection.setOnClickListener(openServerConfig)

        btnLogin.setOnClickListener {
            performLogin()
        }
    }

    private fun showServerConfigDialog() {
        val app = DoSJEApplication.instance
        val input = EditText(this).apply {
            setText(app.preferences.serverBaseUrl)
            setSelection(text.length)
        }

        AlertDialog.Builder(this)
            .setTitle("DoSJE Central Server URL")
            .setMessage("Select connection mode or enter custom URL:\n\n" +
                    "• Same Wi-Fi (Next.js): http://192.168.1.111:3000\n" +
                    "• Same Wi-Fi (Python): http://192.168.1.111:8000\n" +
                    "• Android Emulator: http://10.0.2.2:3000\n" +
                    "• USB Reverse: http://localhost:3000")
            .setView(input)
            .setPositiveButton("Save & Connect") { _, _ ->
                val newUrl = input.text.toString().trim().removeSuffix("/")
                if (newUrl.isNotEmpty()) {
                    app.preferences.serverBaseUrl = newUrl
                    txtServerConfig.text = "🌐 $newUrl"
                    txtConnectionStatus.text = "Connecting..."
                    loadOfficers()
                }
            }
            .setNeutralButton("Wi-Fi (192.168.1.111:3000)") { _, _ ->
                app.preferences.serverBaseUrl = "http://192.168.1.111:3000"
                txtServerConfig.text = "🌐 http://192.168.1.111:3000"
                txtConnectionStatus.text = "Connecting..."
                loadOfficers()
            }
            .setNegativeButton("Emulator (10.0.2.2:3000)") { _, _ ->
                app.preferences.serverBaseUrl = "http://10.0.2.2:3000"
                txtServerConfig.text = "🌐 http://10.0.2.2:3000"
                txtConnectionStatus.text = "Connecting..."
                loadOfficers()
            }
            .show()
    }

    private fun loadOfficers() {
        lifecycleScope.launch {
            val app = DoSJEApplication.instance
            val result = app.apiClient.getOfficers()
            result.onSuccess { officers ->
                officerList = officers
                setupSpinner(officers)
                txtConnectionStatus.text = "🟢 Online"
                txtConnectionStatus.setBackgroundResource(R.drawable.bg_badge_emerald)
                txtConnectionStatus.setTextColor(getColor(R.color.emerald_300))
                txtServerConfig.text = "🌐 ${app.preferences.serverBaseUrl}"
            }.onFailure {
                txtConnectionStatus.text = "🟡 Local Sync"
                txtConnectionStatus.setBackgroundResource(R.drawable.bg_badge_amber)
                txtConnectionStatus.setTextColor(getColor(R.color.amber_300))
            }
        }
    }

    private fun setupSpinner(officers: List<Officer>) {
        val adapter = ArrayAdapter(this, android.R.layout.simple_spinner_item, officers.map { it.toString() })
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        spinnerOfficerSelect.adapter = adapter

        // Pre-select officer with assignment (e.g. Sunita Rao)
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
            txtOfficerStatusBadge.text = "Active Audit Assigned"
            txtOfficerStatusBadge.setBackgroundResource(R.drawable.bg_badge_amber)
            txtOfficerStatusBadge.setTextColor(getColor(R.color.amber_300))
            layoutAssignmentNotice.visibility = View.VISIBLE
            layoutStandbyNotice.visibility = View.GONE

            val insp = officer.assignedInspections.first()
            txtAssignedFacilityName.text = insp.facilityName
            txtAssignedFacilityScheme.text = "${insp.facilityDistrict ?: ""}, ${insp.facilityState ?: ""} • ${insp.schemeName}"
        } else {
            txtOfficerStatusBadge.text = "Standing by (Locked)"
            txtOfficerStatusBadge.setBackgroundResource(R.drawable.bg_badge_slate)
            txtOfficerStatusBadge.setTextColor(getColor(R.color.slate_300))
            layoutAssignmentNotice.visibility = View.GONE
            layoutStandbyNotice.visibility = View.VISIBLE
        }
    }

    private fun performLogin() {
        val officer = selectedOfficer
        if (officer == null) {
            Toast.makeText(this, "Please select an onsite field inspector first", Toast.LENGTH_SHORT).show()
            return
        }

        if (!officer.hasPendingAssignment || officer.assignedInspections.isEmpty()) {
            AlertDialog.Builder(this)
                .setTitle("🔒 Officer on Standby")
                .setMessage("Field auditors are strictly locked to assigned facilities.\n\n" +
                        "Officer ${officer.fullName} currently has 0 assigned audits. " +
                        "Please dispatch an audit from the MoSJE Web Portal Dashboard to unlock this officer.")
                .setPositiveButton("OK", null)
                .show()
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
