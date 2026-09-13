import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ONLINE",
    server: "DoSJE Central GovCloud Server (Next.js App Router)",
    protocol: "REST API v1",
    timestamp: new Date().toISOString(),
    geofence_engine: "PostGIS ST_DWithin Active",
    supported_clients: ["Android Native APK", "Web Simulator", "Flutter Client"]
  }, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    }
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    }
  });
}

