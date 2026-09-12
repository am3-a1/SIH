package gov.mosje.sih26095

import gov.mosje.sih26095.api.models.InspectionScores
import org.junit.Assert.assertEquals
import org.junit.Test

class ScoringTest {

    @Test
    fun testScoreCalculationAndGradeA() {
        val scores = InspectionScores(
            infrastructure = 95,
            hygiene = 90,
            food = 85,
            medical = 88,
            attendance = 92
        )
        // Average = (95 + 90 + 85 + 88 + 92) / 5 = 450 / 5 = 90
        assertEquals(90, scores.totalScore)
        assertEquals("GRADE A", scores.grade)
    }

    @Test
    fun testGradeB() {
        val scores = InspectionScores(
            infrastructure = 70,
            hygiene = 65,
            food = 75,
            medical = 60,
            attendance = 80
        )
        // Average = 350 / 5 = 70
        assertEquals(70, scores.totalScore)
        assertEquals("GRADE B", scores.grade)
    }

    @Test
    fun testGradeC() {
        val scores = InspectionScores(
            infrastructure = 50,
            hygiene = 45,
            food = 55,
            medical = 40,
            attendance = 50
        )
        // Average = 240 / 5 = 48
        assertEquals(48, scores.totalScore)
        assertEquals("GRADE C", scores.grade)
    }

    @Test
    fun testGradeDCritical() {
        val scores = InspectionScores(
            infrastructure = 20,
            hygiene = 10,
            food = 30,
            medical = 15,
            attendance = 25
        )
        // Average = 100 / 5 = 20
        assertEquals(20, scores.totalScore)
        assertEquals("GRADE D", scores.grade)
    }

    @Test
    fun testScoreJsonSerialization() {
        val scores = InspectionScores(90, 80, 70, 60, 50)
        val json = scores.toJson()
        assertEquals(90, json.getInt("infrastructure"))
        assertEquals(80, json.getInt("hygiene"))
        assertEquals(70, json.getInt("food"))
        assertEquals(60, json.getInt("medical"))
        assertEquals(50, json.getInt("attendance"))
    }
}
