import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentWeekRange } from "@/lib/date-utils";
import {
  fetchActivities,
  fetchEvents,
  fetchWellness,
  mapActivity,
  mapEvent,
  mapWellness,
} from "@/lib/intervals";

export async function POST() {
  try {
    const { start, end } = getCurrentWeekRange();

    const [activitiesResult, eventsResult, wellnessResult] =
      await Promise.allSettled([
        fetchActivities(start, end),
        fetchEvents(start, end),
        fetchWellness(start, end),
      ]);

    let workoutCount = 0;
    let fitnessCount = 0;

    // Upsert activities (completed workouts)
    if (activitiesResult.status === "fulfilled") {
      for (const activity of activitiesResult.value) {
        const data = mapActivity(activity);
        await prisma.workout.upsert({
          where: { externalId: data.externalId },
          create: data,
          update: data,
        });
        workoutCount++;
      }
    }

    // Upsert events (planned workouts)
    if (eventsResult.status === "fulfilled") {
      // Only include workout-type events, skip notes etc.
      const workoutEvents = eventsResult.value.filter(
        (e) => e.category === "WORKOUT"
      );
      for (const event of workoutEvents) {
        const data = mapEvent(event);
        await prisma.workout.upsert({
          where: { externalId: data.externalId },
          create: data,
          update: data,
        });
        workoutCount++;
      }
    }

    // Upsert wellness (fitness metrics)
    if (wellnessResult.status === "fulfilled") {
      for (const w of wellnessResult.value) {
        const data = mapWellness(w);
        await prisma.fitnessMetric.upsert({
          where: { date: data.date },
          create: data,
          update: data,
        });
        fitnessCount++;
      }
    }

    return NextResponse.json({
      success: true,
      synced: { workouts: workoutCount, fitnessMetrics: fitnessCount },
    });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Sync failed",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { start, end } = getCurrentWeekRange();

    const startDate = new Date(start);
    const endDate = new Date(end + "T23:59:59");

    const [workouts, fitnessMetrics, powerPbs] = await Promise.all([
      prisma.workout.findMany({
        where: { date: { gte: startDate, lte: endDate } },
        orderBy: { date: "asc" },
      }),
      prisma.fitnessMetric.findMany({
        where: { date: { gte: startDate, lte: endDate } },
        orderBy: { date: "desc" },
      }),
      prisma.powerPb.findMany({
        orderBy: { duration: "asc" },
      }),
    ]);

    return NextResponse.json({ workouts, fitnessMetrics, powerPbs });
  } catch (error) {
    console.error("GET sync error:", error);
    return NextResponse.json(
      { error: "Failed to load dashboard data" },
      { status: 500 }
    );
  }
}
