package gov.mosje.sih26095.util

object GeofenceCalculator {
    private const val EARTH_RADIUS_METERS = 6371000.0

    /**
     * Calculates geodesic distance in meters using Haversine formula.
     * Complies with PostGIS ST_DWithin calculation.
     */
    fun calculateDistanceMeters(
        lat1: Double, lon1: Double,
        lat2: Double, lon2: Double
    ): Double {
        val dLat = Math.toRadians(lat2 - lat1)
        val dLon = Math.toRadians(lon2 - lon1)
        val rLat1 = Math.toRadians(lat1)
        val rLat2 = Math.toRadians(lat2)

        val a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.sin(dLon / 2) * Math.sin(dLon / 2) *
                Math.cos(rLat1) * Math.cos(rLat2)
        val c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        return EARTH_RADIUS_METERS * c
    }

    /**
     * Verifies if location is inside the facility perimeter.
     */
    fun isWithinGeofence(
        deviceLat: Double, deviceLon: Double,
        facilityLat: Double, facilityLon: Double,
        radiusMeters: Double = 500.0
    ): Boolean {
        val distance = calculateDistanceMeters(deviceLat, deviceLon, facilityLat, facilityLon)
        return distance <= radiusMeters
    }
}
