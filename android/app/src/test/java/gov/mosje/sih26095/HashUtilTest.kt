package gov.mosje.sih26095

import gov.mosje.sih26095.security.HashUtil
import org.junit.Assert.assertEquals
import org.junit.Test

class HashUtilTest {

    @Test
    fun testSha256KnownString() {
        // SHA-256 of empty string is e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
        val emptyHash = HashUtil.sha256("")
        assertEquals("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", emptyHash)

        // SHA-256 of "MoSJE-SIH-2026"
        val testHash = HashUtil.sha256("MoSJE-SIH-2026")
        assertEquals(64, testHash.length)
    }
}
