import { NextRequest, NextResponse } from "next/server";
import { serverDb } from "@/lib/serverDb";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const officerId = params.id;
  const officer = serverDb.getOfficerById(officerId);

  if (!officer) {
    return NextResponse.json(
      {
        status: "ERROR",
        message: `Officer '${officerId}' not found in database.`,
      },
      { status: 404 }
    );
  }

  // If officer has explicit assigned_inspections, return them
  if (officer.assigned_inspections && officer.assigned_inspections.length > 0) {
    const assignments = officer.assigned_inspections.map((insp) => ({
      inspection_id: insp.inspection_id,
      facility_id: insp.facility_id,
      facility_name: insp.facility_name,
      scheme_code: insp.scheme_name || "DoSJE",
      district: insp.facilityDistrict || insp.district || "Jurisdiction",
      state: insp.facilityState || insp.state || "State",
      latitude: insp.latitude || 28.5672,
      longitude: insp.longitude || 77.1734,
      geofence_radius_meters: 150.0,
      inspection_type: insp.inspection_type || "SURPRISE_AUDIT",
      status: insp.status || "ASSIGNED",
      scheduled_date: insp.scheduled_date || new Date().toISOString().slice(0, 10),
    }));

    return NextResponse.json(
      {
        status: "SUCCESS",
        officer_id: officer.id,
        count: assignments.length,
        assignments: assignments,
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      }
    );
  }

  // Otherwise check assigned_facility_ids
  const assignedIds = officer.assigned_facility_ids?.length
    ? officer.assigned_facility_ids
    : officer.assigned_facility_id
    ? [officer.assigned_facility_id]
    : [];

  const allFacilities = serverDb.getFacilities();
  const assignedFacilities = allFacilities.filter((f) => assignedIds.includes(f.id));

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
    scheduled_date: new Date().toISOString().slice(0, 10),
  }));

  return NextResponse.json(
    {
      status: "SUCCESS",
      officer_id: officer.id,
      count: assignments.length,
      assignments: assignments,
    },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    }
  );
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
