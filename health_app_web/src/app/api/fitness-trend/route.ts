import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ALLOWED_DAYS = [7, 30, 42, 90, 180, 365] as const;

export async function GET(request: NextRequest) {
  try {
    const daysParam = request.nextUrl.searchParams.get("days");
    const days = daysParam ? Number(daysParam) : 90;

    if (!ALLOWED_DAYS.includes(days as (typeof ALLOWED_DAYS)[number])) {
      return NextResponse.json(
        { error: `Invalid days parameter. Allowed values: ${ALLOWED_DAYS.join(", ")}` },
        { status: 400 }
      );
    }

    const since = new Date();
    since.setDate(since.getDate() - days);

    const metrics = await prisma.fitnessMetric.findMany({
      where: { date: { gte: since } },
      orderBy: { date: "asc" },
      select: { date: true, ctl: true, atl: true, tsb: true },
    });

    return NextResponse.json({ metrics });
  } catch (error) {
    console.error("Fitness trend error:", error);
    return NextResponse.json(
      { error: "Failed to load fitness trend data" },
      { status: 500 }
    );
  }
}
