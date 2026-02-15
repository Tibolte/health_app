import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const entries = Array.isArray(body) ? body : [body];

    for (const entry of entries) {
      if (!entry.date || entry.steps == null) {
        return NextResponse.json(
          { error: "Each entry requires 'date' and 'steps'" },
          { status: 400, headers: corsHeaders }
        );
      }
    }

    let count = 0;
    for (const entry of entries) {
      const date = new Date(entry.date);
      await prisma.stepCount.upsert({
        where: { date },
        create: {
          date,
          steps: entry.steps,
          source: entry.source ?? "healthkit",
        },
        update: {
          steps: entry.steps,
          source: entry.source ?? "healthkit",
        },
      });
      count++;
    }

    return NextResponse.json(
      { success: true, upserted: count },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Steps POST error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to save steps",
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function GET() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const steps = await prisma.stepCount.findMany({
      where: { date: { gte: thirtyDaysAgo } },
      orderBy: { date: "desc" },
    });

    return NextResponse.json({ steps }, { headers: corsHeaders });
  } catch (error) {
    console.error("Steps GET error:", error);
    return NextResponse.json(
      { error: "Failed to load step data" },
      { status: 500, headers: corsHeaders }
    );
  }
}
