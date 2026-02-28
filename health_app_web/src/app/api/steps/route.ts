import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/errors";
import { z } from "zod";

function getCorsHeaders(): Record<string, string> {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",").map((o) =>
    o.trim()
  );

  return {
    "Access-Control-Allow-Origin": allowedOrigins?.join(", ") || "",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",").map((o) =>
    o.trim()
  );
  if (!allowedOrigins || allowedOrigins.length === 0) return false;
  return allowedOrigins.includes(origin);
}

function corsHeaders(request?: NextRequest): Record<string, string> {
  const origin = request?.headers.get("origin") ?? null;
  const headers = getCorsHeaders();

  // Only reflect the origin if it's in the allow list
  if (origin && isOriginAllowed(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  } else {
    headers["Access-Control-Allow-Origin"] = "";
  }

  return headers;
}

const StepEntrySchema = z.object({
  date: z.string(),
  steps: z.number(),
  source: z.string().optional(),
});

const StepRequestSchema = z.union([
  StepEntrySchema,
  z.array(StepEntrySchema),
]);

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request) });
}

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const parsed = StepRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Each entry requires 'date' and 'steps'" },
        { status: 400, headers: corsHeaders(request) }
      );
    }

    const entries = Array.isArray(parsed.data) ? parsed.data : [parsed.data];

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
      { headers: corsHeaders(request) }
    );
  } catch (error) {
    console.error("Steps POST error:", error);
    return NextResponse.json(apiError(error, "Failed to save steps"), {
      status: 500,
      headers: corsHeaders(request),
    });
  }
}

export async function GET(request: NextRequest) {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const steps = await prisma.stepCount.findMany({
      where: { date: { gte: thirtyDaysAgo } },
      orderBy: { date: "desc" },
    });

    return NextResponse.json({ steps }, { headers: corsHeaders(request) });
  } catch (error) {
    console.error("Steps GET error:", error);
    return NextResponse.json(apiError(error, "Failed to load step data"), {
      status: 500,
      headers: corsHeaders(request),
    });
  }
}
