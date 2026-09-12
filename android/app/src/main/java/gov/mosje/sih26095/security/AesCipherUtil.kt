package gov.mosje.sih26095.security

import android.util.Base64
import org.json.JSONObject
import java.security.SecureRandom
import javax.crypto.Cipher
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.SecretKeySpec

object AesCipherUtil {
    // 256-bit Government Cryptographic Key (Derived or Pre-shared)
    private val DEFAULT_KEY = "DoSJE_MoSJE_GovCloud_Key_2026_AES256".toByteArray(Charsets.UTF_8).copyOf(32)

    fun encryptJson(jsonObj: JSONObject, associatedData: String = "MoSJE_SIH26095"): JSONObject {
        val plainBytes = jsonObj.toString().toByteArray(Charsets.UTF_8)
        val iv = ByteArray(12) // 96-bit GCM IV
        SecureRandom().nextBytes(iv)

        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        val keySpec = SecretKeySpec(DEFAULT_KEY, "AES")
        val gcmSpec = GCMParameterSpec(128, iv)
        cipher.init(Cipher.ENCRYPT_MODE, keySpec, gcmSpec)
        cipher.updateAAD(associatedData.toByteArray(Charsets.UTF_8))

        val cipherBytes = cipher.doFinal(plainBytes)
        // Extract tag and ciphertext
        val tagLength = 16
        val ciphertextLength = cipherBytes.size - tagLength
        val ciphertext = ByteArray(ciphertextLength)
        val tag = ByteArray(tagLength)
        System.arraycopy(cipherBytes, 0, ciphertext, 0, ciphertextLength)
        System.arraycopy(cipherBytes, ciphertextLength, tag, 0, tagLength)

        val result = JSONObject()
        result.put("algorithm", "AES-256-GCM")
        result.put("nonce", Base64.encodeToString(iv, Base64.NO_WRAP))
        result.put("ciphertext", Base64.encodeToString(ciphertext, Base64.NO_WRAP))
        result.put("tag", Base64.encodeToString(tag, Base64.NO_WRAP))
        result.put("sha256_package_hash", HashUtil.sha256(cipherBytes))
        return result
    }
}
