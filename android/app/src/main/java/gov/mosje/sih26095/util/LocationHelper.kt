package gov.mosje.sih26095.util

import android.annotation.SuppressLint
import android.content.Context
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.Bundle

class LocationHelper(private val context: Context) {
    private val locationManager = context.getSystemService(Context.LOCATION_SERVICE) as? LocationManager

    var currentLatitude: Double = 28.5675
        private set
    var currentLongitude: Double = 77.1736
        private set
    var currentAccuracy: Float = 10.0f
        private set
    var isSimulatedOnsite: Boolean = true
        private set

    var isRealGpsFixed: Boolean = false
        private set

    private var onLocationChangedListener: ((Location) -> Unit)? = null

    private val locationListener = object : LocationListener {
        override fun onLocationChanged(location: Location) {
            if (!isSimulatedOnsite) {
                currentLatitude = location.latitude
                currentLongitude = location.longitude
                currentAccuracy = location.accuracy
                isRealGpsFixed = true
                onLocationChangedListener?.invoke(location)
            }
        }
        @Deprecated("Deprecated in Java", ReplaceWith(""))
        @Suppress("DEPRECATION")
        override fun onStatusChanged(provider: String?, status: Int, extras: Bundle?) {}
        override fun onProviderEnabled(provider: String) {}
        override fun onProviderDisabled(provider: String) {}
    }

    fun setLocationListener(listener: (Location) -> Unit) {
        this.onLocationChangedListener = listener
    }

    fun setSimulatedOnsite(simulate: Boolean, facilityLat: Double = 28.5672, facilityLon: Double = 77.1734) {
        this.isSimulatedOnsite = simulate
        if (simulate) {
            isRealGpsFixed = false
            // Place 35 meters within facility perimeter
            currentLatitude = facilityLat + 0.00028
            currentLongitude = facilityLon + 0.00015
            currentAccuracy = 8.0f
            val mockLoc = Location("simulated").apply {
                latitude = currentLatitude
                longitude = currentLongitude
                accuracy = currentAccuracy
            }
            onLocationChangedListener?.invoke(mockLoc)
        }
    }

    @SuppressLint("MissingPermission")
    fun startLocationUpdates() {
        if (locationManager == null) return
        try {
            val providers = listOf(
                LocationManager.GPS_PROVIDER,
                LocationManager.NETWORK_PROVIDER,
                LocationManager.PASSIVE_PROVIDER
            )
            var bestLoc: Location? = null
            for (provider in providers) {
                if (locationManager.isProviderEnabled(provider)) {
                    val lastKnown = locationManager.getLastKnownLocation(provider)
                    if (lastKnown != null) {
                        if (bestLoc == null || lastKnown.accuracy < bestLoc.accuracy) {
                            bestLoc = lastKnown
                        }
                    }
                    locationManager.requestLocationUpdates(provider, 1000L, 1.0f, locationListener)
                }
            }
            if (bestLoc != null && !isSimulatedOnsite) {
                currentLatitude = bestLoc.latitude
                currentLongitude = bestLoc.longitude
                currentAccuracy = bestLoc.accuracy
                isRealGpsFixed = true
                onLocationChangedListener?.invoke(bestLoc)
            }
        } catch (e: SecurityException) {
            // Permission not yet granted, fallback to simulated
            setSimulatedOnsite(true)
        }
    }

    fun stopLocationUpdates() {
        locationManager?.removeUpdates(locationListener)
    }
}
