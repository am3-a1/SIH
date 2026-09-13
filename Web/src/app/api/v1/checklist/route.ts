import { NextRequest, NextResponse } from "next/server";
import { serverDb } from "@/lib/serverDb";

export async function GET() {
  const checklist = serverDb.getChecklist();
  return NextResponse.json(
    {
      status: "SUCCESS",
      checklist,
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const saved = serverDb.saveChecklist(body);
    return NextResponse.json(
      {
        status: "SUCCESS",
        message: "Checklist schema successfully published and stored on central server.",
        checklist: saved,
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
        message: `Failed to save checklist schema: ${err?.message || "Invalid JSON"}`,
      },
      { status: 400 }
    );
  }
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

