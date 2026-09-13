import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "SUCCESS",
    app_name: "DoSJE Inspector Native Handheld",
    package_name: "gov.mosje.sih26095",
    version_name: "1.0.0",
    version_code: 1,
    min_sdk: 26,
    target_sdk: 34,
    camera_subsystem: "AndroidX CameraX 1.3.1 with Cryptographic Watermark HUD",
    geofence_subsystem: "Google Play Services Location / Haversine ST_DWithin",
    encryption: "AES-256-GCM Hardware-Backed Keystore",
    download_url: "/downloads/mosje-inspection.apk"
  }, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    }
  });
}

