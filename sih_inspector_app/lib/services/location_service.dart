import 'dart:math';

class LocationService {
  /// Computes distance in meters between inspector and facility GPS coordinates
  static double calculateDistanceMeters(
    double lat1, double lon1, double lat2, double lon2
  ) {
    const double r = 6371000; // Earth radius in meters
    final double phi1 = lat1 * pi / 180;
    final double phi2 = lat2 * pi / 180;
    final double deltaPhi = (lat2 - lat1) * pi / 180;
    final double deltaLambda = (lon2 - lon1) * pi / 180;

    final double a = sin(deltaPhi / 2) * sin(deltaPhi / 2) +
        cos(phi1) * cos(phi2) * sin(deltaLambda / 2) * sin(deltaLambda / 2);
    final double c = 2 * atan2(sqrt(a), sqrt(1 - a));

    return r * c;
  }

  /// Checks if inspector is physically within allowable geofence radius
  static Map<String, dynamic> checkGeofence({
    required double inspectorLat,
    required double inspectorLon,
    required double facilityLat,
    required double facilityLon,
    required int allowedRadiusMeters,
  }) {
    final double distance = calculateDistanceMeters(
      inspectorLat, inspectorLon, facilityLat, facilityLon
    );
    final bool isWithin = distance <= allowedRadiusMeters;

    return {
      'is_within_geofence': isWithin,
      'distance_meters': distance.roundToDouble(),
      'allowed_radius_meters': allowedRadiusMeters,
      'status_message': isWithin
          ? 'Geofence Verified: Within allowable perimeter (${distance.round()}m)'
          : 'Geofence Violation: Inspector is ${distance.round()}m away (max allowed: ${allowedRadiusMeters}m)',
    };
  }
}
