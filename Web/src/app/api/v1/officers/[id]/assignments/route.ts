import { NextRequest, NextResponse } from "next/server";
import officersSeed from "@/data/officers_seed.json";
import facilitiesSeed from "@/data/facilities_seed.json";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const officerId = params.id;
  const officer = officersSeed.officers.find(
    (o) => o.id === officerId || o.username === officerId
  );

  if (!officer) {
    return NextResponse.json({
      status: "ERROR",
      message: `Officer '${officerId}' not found in database.`
    }, { status: 404 });
  }

  // Get assigned facility IDs
  const assignedIds = officer.assigned_facility_ids?.length
    ? officer.assigned_facility_ids
    : officer.assigned_facility_id
    ? [officer.assigned_facility_id]
    : [];

  const assignedFacilities = facilitiesSeed.facilities.filter((f) =>
    assignedIds.includes(f.id)
  );

  // Map to assignments response
  const assignments = assignedFacilities.map((f, idx) => ({
    inspection_id: officer.assigned_inspection_id || `INSP-2026-${String(idx + 1).padStart(3, "0")}`,
    facility_id: f.id,
    facility_name: f.name,
    scheme_code: f.scheme_code,
    district: f.district,
    state: f.state,
    latitude: f.latitude,
    longitude: f.longitude,
    geofence_radius_meters: f.geofence_radius_meters || 150.0,
    inspection_type: "SURPRISE_AUDIT",
    status: "ASSIGNED",
    scheduled_date: new Date().toISOString().slice(0, 10)
  }));

  return NextResponse.json({
    status: "SUCCESS",
    officer_id: officer.id,
    count: assignments.length,
    assignments: assignments
  }, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    }
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    }
  });
}
