package gov.mosje.sih26095.camera

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.os.Bundle
import android.provider.MediaStore
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import gov.mosje.sih26095.api.models.EvidencePhoto
import java.io.File

class NativeCameraCaptureActivity : AppCompatActivity() {

    private var currentCategory: String = "Dining & Kitchen Sanitation"
    private var facilityName: String = "Snehalaya Senior Citizens Home"
    private var facilityId: String = "DOSJE-DL-001"
    private var latitude: Double = 28.5675
    private var longitude: Double = 77.1736
    private var accuracyMeters: Float = 10f
    private var isGeofenceVerified: Boolean = true
    private var officerName: String = "Sunita Rao"

    private var photoFile: File? = null
    private var photoUri: Uri? = null

    // Native Camera Launcher
    private val takePictureLauncher = registerForActivityResult(ActivityResultContracts.TakePicture()) { success ->
        if (success && photoFile != null && photoFile!!.exists()) {
            val rawBitmap = BitmapFactory.decodeFile(photoFile!!.absolutePath)
            if (rawBitmap != null) {
                // Apply Cryptographic Watermark
                val evidence = CameraWatermarkProcessor.processAndStampPhoto(
                    context = this,
                    rawBitmap = rawBitmap,
                    category = currentCategory,
                    facilityName = facilityName,
                    facilityId = facilityId,
                    latitude = latitude,
                    longitude = longitude,
                    accuracyMeters = accuracyMeters,
                    isGeofenceVerified = isGeofenceVerified,
                    officerName = officerName
                )

                // Return result to AuditActivity
                val intent = Intent().apply {
                    putExtra("photo_id", evidence.id)
                    putExtra("photo_path", evidence.localFilePath)
                    putExtra("photo_category", evidence.category)
                    putExtra("photo_hash", evidence.sha256Hash)
                    putExtra("photo_timestamp", evidence.timestampUtc)
                    putExtra("photo_watermark", evidence.watermarkText)
                    putExtra("photo_thumb", evidence.base64Thumbnail)
                }
                setResult(RESULT_OK, intent)
                finish()
            } else {
                Toast.makeText(this, "Failed to read camera photo", Toast.LENGTH_SHORT).show()
                finish()
            }
        } else {
            Toast.makeText(this, "Camera capture cancelled", Toast.LENGTH_SHORT).show()
            finish()
        }
    }

    // Camera Permission Launcher
    private val permissionLauncher = registerForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
        if (granted) {
            launchNativeCamera()
        } else {
            Toast.makeText(this, "Camera permission is strictly required for statutory evidence capture", Toast.LENGTH_LONG).show()
            finish()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        currentCategory = intent.getStringExtra("category") ?: "Dining & Kitchen Sanitation"
        facilityName = intent.getStringExtra("facility_name") ?: "Assigned Institution"
        facilityId = intent.getStringExtra("facility_id") ?: "DOSJE-DL-001"
        latitude = intent.getDoubleExtra("latitude", 28.5675)
        longitude = intent.getDoubleExtra("longitude", 77.1736)
        accuracyMeters = intent.getFloatExtra("accuracy", 10f)
        isGeofenceVerified = intent.getBooleanExtra("geofence_verified", true)
        officerName = intent.getStringExtra("officer_name") ?: "Field Vigilance Inspector"

        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) {
            launchNativeCamera()
        } else {
            permissionLauncher.launch(Manifest.permission.CAMERA)
        }
    }

    private fun launchNativeCamera() {
        try {
            val tempDir = File(cacheDir, "camera_temp").apply { mkdirs() }
            photoFile = File.createTempFile("raw_capture_", ".jpg", tempDir)
            photoUri = FileProvider.getUriForFile(
                this,
                "gov.mosje.sih26095.fileprovider",
                photoFile!!
            )
            takePictureLauncher.launch(photoUri)
        } catch (e: Exception) {
            Toast.makeText(this, "Camera Error: ${e.message}", Toast.LENGTH_SHORT).show()
            finish()
        }
    }
}
