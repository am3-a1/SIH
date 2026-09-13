import { NextResponse } from "next/server";
import { serverDb } from "@/lib/serverDb";

export async function GET() {
  const audits = serverDb.getAudits();
  return NextResponse.json(
    {
      status: "SUCCESS",
      count: audits.length,
      audits,
    },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    }
  );
}

export async function DELETE() {
  const audits = serverDb.resetAudits();
  return NextResponse.json(
    {
      status: "SUCCESS",
      message: "Inspection audit database successfully reset to baseline statutory records.",
      count: audits.length,
      audits,
    },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, DELETE, OPTIONS",
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
      "Access-Control-Allow-Methods": "GET, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

