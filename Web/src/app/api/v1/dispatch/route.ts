import { NextRequest, NextResponse } from "next/server";
import { serverDb } from "@/lib/serverDb";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const type: "RANDOM" | "RISK_WEIGHTED" = body.type === "RISK_WEIGHTED" ? "RISK_WEIGHTED" : "RANDOM";

    const allOfficers = serverDb.getOfficers();
    const allFacilities = serverDb.getFacilities();

    let targetFacilityId = body.facilityId;
    let targetOfficerId = body.officerId;

    if (!targetFacilityId) {
      if (type === "RISK_WEIGHTED") {
        // Sort facilities by risk score descending, pick from top 4 highest risk
        const sorted = [...allFacilities].sort((a, b) => b.risk_score - a.risk_score);
        const topSlice = sorted.slice(0, 4);
        const fac = topSlice[Math.floor(Math.random() * topSlice.length)];
        targetFacilityId = fac.id;
      } else {
        // Pure random facility
        const fac = allFacilities[Math.floor(Math.random() * allFacilities.length)];
        targetFacilityId = fac.id;
      }
    }

    if (!targetOfficerId) {
      // Find candidate officers (prefer standby officers with no current assignment)
      const standby = allOfficers.filter((o) => !o.has_pending_assignment);
      const candidates = standby.length > 0 ? standby : allOfficers;

      // Select a random officer from candidates to ensure diversity across cadre
      const chosen = candidates[Math.floor(Math.random() * candidates.length)];
      targetOfficerId = chosen.id;
    }

    const { officer, facility, inspectionId } = serverDb.dispatchOfficer(
      targetOfficerId,
      targetFacilityId,
      type
    );

    const dispatchEvent = {
      id: inspectionId,
      type,
      officerId: officer.id,
      officerName: officer.full_name,
      facilityId: facility.id,
      facilityName: facility.name,
      schemeName: facility.scheme_name,
      timestamp: new Date().toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      riskScore: facility.risk_score,
    };

    return NextResponse.json(
      {
        status: "SUCCESS",
        message: `Officer ${officer.full_name} successfully dispatched to ${facility.name}.`,
        dispatch: dispatchEvent,
        updated_officer: officer,
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        status: "ERROR",
        message: err?.message || "Failed to execute dispatch.",
      },
      { status: 400 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      status: "SUCCESS",
      message: "Dispatch API is active. Use POST to dispatch an officer.",
    },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
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

