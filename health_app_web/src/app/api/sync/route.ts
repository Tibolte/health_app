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

function toLocalDate(dateStr: string): string {
  return dateStr.substring(0, 10);
}

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

    // Build a map of activities by local date for matching with planned events
    const activityByDate = new Map<string, string[]>();
    const activities = activitiesResult.status === "fulfilled" ? activitiesResult.value : [];

    // Upsert activities (completed workouts)
    for (const activity of activities) {
      const data = mapActivity(activity);
      await prisma.workout.upsert({
        where: { externalId: data.externalId },
        create: data,
        update: data,
      });
      workoutCount++;

      const localDate = toLocalDate(activity.start_date_local);
      const existing = activityByDate.get(localDate) || [];
      existing.push(String(activity.id));
      activityByDate.set(localDate, existing);
    }

    // Upsert events (planned workouts) — merge with completed activities when matched
    if (eventsResult.status === "fulfilled") {
      const workoutEvents = eventsResult.value.filter(
        (e) => e.category === "WORKOUT"
      );
      for (const event of workoutEvents) {
        const eventDate = toLocalDate(event.start_date_local);
        const matchingActivityIds = activityByDate.get(eventDate);

        if (matchingActivityIds && matchingActivityIds.length > 0) {
          // A completed activity exists on the same day — merge planned data into it
          const activityExternalId = matchingActivityIds.shift()!;
          await prisma.workout.update({
            where: { externalId: activityExternalId },
            data: {
              description: event.description ?? undefined,
              coachNotes: event.coach_notes ?? undefined,
              plannedDuration: event.moving_time ? Math.round(event.moving_time / 60) : undefined,
              plannedTss: event.icu_training_load ?? undefined,
            },
          });
          // Remove any previously-synced planned event record
          await prisma.workout.deleteMany({
            where: { externalId: `event-${event.id}` },
          });
          workoutCount++;
        } else {
          // No matching activity — keep as planned workout
          const data = mapEvent(event);
          await prisma.workout.upsert({
            where: { externalId: data.externalId },
            create: data,
            update: data,
          });
          workoutCount++;
        }
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
