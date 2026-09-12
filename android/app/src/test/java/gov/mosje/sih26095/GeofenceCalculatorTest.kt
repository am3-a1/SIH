package gov.mosje.sih26095

import gov.mosje.sih26095.util.GeofenceCalculator
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class GeofenceCalculatorTest {

    @Test
    fun testSameLocationDistanceIsZero() {
        val lat = 28.5672
        val lon = 77.1734
        val dist = GeofenceCalculator.calculateDistanceMeters(lat, lon, lat, lon)
        assertEquals(0.0, dist, 0.001)
    }

    @Test
    fun testWithinGeofenceInsideRadius() {
        // Snehalaya Senior Citizens Home: 28.5672, 77.1734
        // Point approximately 80m away: 28.5678, 77.1734
        val facilityLat = 28.5672
        val facilityLon = 77.1734
        val inspectorLat = 28.5678
        val inspectorLon = 77.1734

        val distance = GeofenceCalculator.calculateDistanceMeters(inspectorLat, inspectorLon, facilityLat, facilityLon)
        assertTrue("Distance should be under 150m, actual: $distance", distance < 150.0)
        assertTrue("Inspector should be within 500m geofence", 
            GeofenceCalculator.isWithinGeofence(inspectorLat, inspectorLon, facilityLat, facilityLon, 500.0))
    }

    @Test
    fun testOutsideGeofenceExceedsRadius() {
        // Snehalaya (Delhi) vs Connaught Place (~12km away: 28.6315, 77.2167)
        val facilityLat = 28.5672
        val facilityLon = 77.1734
        val distantLat = 28.6315
        val distantLon = 77.2167

        val distance = GeofenceCalculator.calculateDistanceMeters(distantLat, distantLon, facilityLat, facilityLon)
        assertTrue("Distance should be > 5000m, actual: $distance", distance > 5000.0)
        assertFalse("Distant point should NOT be within 500m geofence",
            GeofenceCalculator.isWithinGeofence(distantLat, distantLon, facilityLat, facilityLon, 500.0))
    }
}
