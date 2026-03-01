import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/errors";
import { getCurrentWeekRange, getNextWeekRange, getDateRange } from "@/lib/date-utils";
import {
  fetchActivities,
  fetchEvents,
  fetchWellness,
  fetchPowerCurve,
  mapActivity,
  mapEvent,
  mapWellness,
  mapPowerPbs,
} from "@/lib/intervals";

function toLocalDate(dateStr: string): string {
  return dateStr.substring(0, 10);
}

function normalizeType(type: string): string {
  const t = type.toLowerCase();
  if (t === "virtualride") return "ride";
  if (t === "virtualrun") return "run";
  return t;
}

export async function POST() {
  try {
    const { start, end } = getCurrentWeekRange();
    const nextWeek = getNextWeekRange();
    const wellnessRange = getDateRange(365);

    const [activitiesResult, eventsResult, nextWeekEventsResult, wellnessResult, powerCurveResult] =
      await Promise.allSettled([
        fetchActivities(start, end),
        fetchEvents(start, end),
        fetchEvents(nextWeek.start, nextWeek.end),
        fetchWellness(wellnessRange.start, wellnessRange.end),
        fetchPowerCurve(),
      ]);

    let workoutCount = 0;
    let fitnessCount = 0;
    let powerPbCount = 0;

    // Build a map of activities by date+type for matching with planned events
    const activityByDateType = new Map<string, string[]>();
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

      const key = `${toLocalDate(activity.start_date_local)}:${normalizeType(activity.type)}`;
      const existing = activityByDateType.get(key) || [];
      existing.push(String(activity.id));
      activityByDateType.set(key, existing);
    }

    // Upsert events (planned workouts) — merge with completed activities when matched by date AND type
    if (eventsResult.status === "fulfilled") {
      const workoutEvents = eventsResult.value.filter(
        (e) => e.category === "WORKOUT"
      );
      for (const event of workoutEvents) {
        const eventDate = toLocalDate(event.start_date_local);
        const eventType = event.type || event.category;
        const key = `${eventDate}:${normalizeType(eventType)}`;
        const matchingActivityIds = activityByDateType.get(key);

        if (matchingActivityIds && matchingActivityIds.length > 0) {
          // A completed activity exists on the same day with the same type — merge planned data into it
          const activityExternalId = matchingActivityIds.shift()!;
          await prisma.workout.update({
            where: { externalId: activityExternalId },
            data: {
              title: event.name || undefined,
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
          // No matching activity for this type — keep as planned workout
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

    // Upsert next week's events (planned workouts only — no activities for the future)
    if (nextWeekEventsResult.status === "fulfilled") {
      const workoutEvents = nextWeekEventsResult.value.filter(
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

    // Upsert power PBs — preserve previous power before overwriting
    if (powerCurveResult.status === "fulfilled") {
      const pbs = mapPowerPbs(powerCurveResult.value);
      for (const pb of pbs) {
        const existing = await prisma.powerPb.findUnique({
          where: { duration: pb.duration },
          select: { power: true, recordedAt: true },
        });
        const changed = existing && existing.power !== pb.power;
        const prevFields = changed
          ? { previousPower: existing.power, previousRecordedAt: existing.recordedAt }
          : {};
        await prisma.powerPb.upsert({
          where: { duration: pb.duration },
          create: { ...pb, previousPower: null, previousRecordedAt: null },
          update: { ...pb, ...prevFields },
        });
        powerPbCount++;
      }
    }

    return NextResponse.json({
      success: true,
      synced: { workouts: workoutCount, fitnessMetrics: fitnessCount, powerPbs: powerPbCount },
    });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json(apiError(error, "Sync failed"), { status: 500 });
  }
}

export async function GET() {
  try {
    const { start, end } = getCurrentWeekRange();
    const nextWeek = getNextWeekRange();

    const startDate = new Date(start);
    const endDate = new Date(end + "T23:59:59");
    const nextWeekStartDate = new Date(nextWeek.start);
    const nextWeekEndDate = new Date(nextWeek.end + "T23:59:59");

    const [workouts, nextWeekWorkouts, fitnessMetrics, powerPbs] = await Promise.all([
      prisma.workout.findMany({
        where: { date: { gte: startDate, lte: endDate } },
        orderBy: { date: "asc" },
      }),
      prisma.workout.findMany({
        where: { date: { gte: nextWeekStartDate, lte: nextWeekEndDate } },
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

    return NextResponse.json({ workouts, nextWeekWorkouts, fitnessMetrics, powerPbs });
  } catch (error) {
    console.error("GET sync error:", error);
    return NextResponse.json(
      apiError(error, "Failed to load dashboard data"),
      { status: 500 }
    );
  }
}
