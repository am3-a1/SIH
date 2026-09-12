package gov.mosje.sih26095.camera

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Rect
import android.graphics.RectF
import android.graphics.Typeface
import android.util.Base64
import gov.mosje.sih26095.api.models.EvidencePhoto
import gov.mosje.sih26095.security.HashUtil
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.FileOutputStream
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone
import java.util.UUID

object CameraWatermarkProcessor {

    /**
     * Stamps an official cryptographic anti-tamper watermark directly onto the camera photo bitmap.
     */
    fun processAndStampPhoto(
        context: Context,
        rawBitmap: Bitmap,
        category: String,
        facilityName: String,
        facilityId: String,
        latitude: Double,
        longitude: Double,
        accuracyMeters: Float,
        isGeofenceVerified: Boolean,
        officerName: String
    ): EvidencePhoto {
        val width = rawBitmap.width
        val height = rawBitmap.height

        // Create mutable working copy
        val watermarkedBitmap = rawBitmap.copy(Bitmap.Config.ARGB_8888, true)
        val canvas = Canvas(watermarkedBitmap)

        // 1. Calculate responsive dimensions based on photo resolution
        val bannerHeight = (height * 0.18f).coerceAtLeast(180f)
        val bannerRect = RectF(0f, height - bannerHeight, width.toFloat(), height.toFloat())

        // 2. Draw Semi-transparent Dark HUD Banner
        val bgPaint = Paint().apply {
            color = Color.argb(205, 10, 20, 35) // Deep Slate / Navy translucent
            style = Paint.Style.FILL
        }
        canvas.drawRect(bannerRect, bgPaint)

        // Banner accent divider line
        val linePaint = Paint().apply {
            color = Color.parseColor("#FF9933") // Saffron
            strokeWidth = (width * 0.004f).coerceAtLeast(3f)
        }
        canvas.drawLine(0f, height - bannerHeight, width.toFloat(), height - bannerHeight, linePaint)

        // 3. Top-Left Live Watermark Stamp Badge
        val badgeW = (width * 0.28f).coerceAtLeast(160f)
        val badgeH = (height * 0.045f).coerceAtLeast(36f)
        val badgeRect = RectF(20f, 20f, 20f + badgeW, 20f + badgeH)
        val badgeBgPaint = Paint().apply {
            color = Color.parseColor("#EF4444") // Red
            style = Paint.Style.FILL
        }
        canvas.drawRoundRect(badgeRect, 8f, 8f, badgeBgPaint)

        val badgeTextPaint = Paint().apply {
            color = Color.WHITE
            textSize = (badgeH * 0.50f).coerceAtLeast(16f)
            typeface = Typeface.create(Typeface.MONOSPACE, Typeface.BOLD)
            isAntiAlias = true
        }
        canvas.drawText("LIVE WATERMARK STAMP", 32f, 20f + badgeH * 0.68f, badgeTextPaint)

        // 4. Compute Timestamp & Coordinates Strings
        val sdf = SimpleDateFormat("yyyy-MM-dd HH:mm:ss 'UTC'", Locale.US).apply {
            timeZone = TimeZone.getTimeZone("UTC")
        }
        val timestampStr = sdf.format(Date())
        val latDir = if (latitude >= 0) "N" else "S"
        val lonDir = if (longitude >= 0) "E" else "W"
        val coordsStr = String.format(Locale.US, "%.4f° %s, %.4f° %s", Math.abs(latitude), latDir, Math.abs(longitude), lonDir)

        // 5. Draw Watermark Metadata Lines onto Banner
        val baseTextSize = (bannerHeight * 0.12f).coerceAtLeast(14f)
        val textPaint = Paint().apply {
            isAntiAlias = true
            typeface = Typeface.create(Typeface.MONOSPACE, Typeface.NORMAL)
            textSize = baseTextSize
        }

        val paddingLeft = 24f
        var currentY = height - bannerHeight + (bannerHeight * 0.20f)

        // Line 1: Government Header
        textPaint.color = Color.parseColor("#FF9933") // Saffron Amber
        textPaint.typeface = Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD)
        canvas.drawText("MINISTRY OF SOCIAL JUSTICE AND EMPOWERMENT • DoSJE", paddingLeft, currentY, textPaint)

        // Line 2: Category & Target Facility
        currentY += baseTextSize * 1.5f
        textPaint.color = Color.WHITE
        textPaint.typeface = Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD)
        canvas.drawText("AREA: $category | FACILITY: $facilityName ($facilityId)", paddingLeft, currentY, textPaint)

        // Line 3: GPS & Geofence Verification Status
        currentY += baseTextSize * 1.4f
        textPaint.typeface = Typeface.create(Typeface.MONOSPACE, Typeface.BOLD)
        textPaint.color = if (isGeofenceVerified) Color.parseColor("#34D399") else Color.parseColor("#F87171")
        val statusText = if (isGeofenceVerified) "GEOFENCE VALIDATED ON-SITE" else "PERIMETER WARNING"
        canvas.drawText("GPS: $coordsStr (±${Math.round(accuracyMeters)}m) | $statusText", paddingLeft, currentY, textPaint)

        // Line 4: Timestamp & Inspector
        currentY += baseTextSize * 1.4f
        textPaint.color = Color.parseColor("#E2E8F0") // Slate Light
        textPaint.typeface = Typeface.create(Typeface.MONOSPACE, Typeface.NORMAL)
        canvas.drawText("TIME: $timestampStr | INSPECTOR: $officerName", paddingLeft, currentY, textPaint)

        // 6. Generate SHA-256 Checksum of Image Bytes
        val photoId = "EVID-" + UUID.randomUUID().toString().substring(0, 8).uppercase()
        val tempStream = ByteArrayOutputStream()
        watermarkedBitmap.compress(Bitmap.CompressFormat.JPEG, 90, tempStream)
        val imageBytes = tempStream.toByteArray()
        val sha256Hex = HashUtil.sha256(imageBytes)

        // Line 5: Tamper-Evident SHA-256 Hash
        currentY += baseTextSize * 1.4f
        textPaint.color = Color.parseColor("#10B981") // Emerald Green
        textPaint.typeface = Typeface.create(Typeface.MONOSPACE, Typeface.BOLD)
        canvas.drawText("SHA-256 HASH: ${sha256Hex.substring(0, 32)}...", paddingLeft, currentY, textPaint)

        // 7. Save Watermarked JPEG to Internal Storage
        val photosDir = File(context.filesDir, "inspection_photos").apply { mkdirs() }
        val photoFile = File(photosDir, "$photoId.jpg")
        FileOutputStream(photoFile).use { fos ->
            fos.write(imageBytes)
        }

        // 8. Generate Base64 Thumbnail for UI Card
        val thumbBitmap = Bitmap.createScaledBitmap(watermarkedBitmap, 160, 120, true)
        val thumbStream = ByteArrayOutputStream()
        thumbBitmap.compress(Bitmap.CompressFormat.JPEG, 70, thumbStream)
        val thumbBase64 = Base64.encodeToString(thumbStream.toByteArray(), Base64.NO_WRAP)

        val watermarkSummary = "MoSJE AUDIT | $timestampStr | $coordsStr | $officerName | $sha256Hex"

        return EvidencePhoto(
            id = photoId,
            category = category,
            localFilePath = photoFile.absolutePath,
            base64Thumbnail = thumbBase64,
            latitude = latitude,
            longitude = longitude,
            accuracyMeters = accuracyMeters,
            timestampUtc = timestampStr,
            watermarkText = watermarkSummary,
            sha256Hash = sha256Hex,
            officerName = officerName
        )
    }
}
