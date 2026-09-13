import { NextResponse } from "next/server";
import { serverDb } from "@/lib/serverDb";

export async function POST() {
  const audits = serverDb.resetAudits();
  return NextResponse.json(
    {
      status: "SUCCESS",
      message: "Inspection audit database successfully reset to statutory baseline.",
      count: audits.length,
      audits,
    },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
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
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

