import { NextResponse } from "next/server";
import facilitiesSeed from "@/data/facilities_seed.json";

export async function GET() {
  return NextResponse.json({
    status: "SUCCESS",
    count: facilitiesSeed.facilities.length,
    facilities: facilitiesSeed.facilities
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
