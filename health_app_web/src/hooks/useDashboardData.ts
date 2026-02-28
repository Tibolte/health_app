import { useState, useEffect, useCallback } from "react";
import type {
  Workout,
  FitnessMetric,
  PowerPb,
  SyncGetResponse,
  SyncPostResponse,
} from "@/types";
import { useToast } from "@/components/Toast";

export function useDashboardData() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [nextWeekWorkouts, setNextWeekWorkouts] = useState<Workout[]>([]);
  const [fitnessMetrics, setFitnessMetrics] = useState<FitnessMetric[]>([]);
  const [powerPbs, setPowerPbs] = useState<PowerPb[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast, showToast, hideToast } = useToast();

  const loadData = useCallback(async () => {
    try {
      const res = await fetch("/api/sync");
      if (!res.ok) throw new Error("Failed to load data");
      const data: SyncGetResponse = await res.json();
      setWorkouts(data.workouts || []);
      setNextWeekWorkouts(data.nextWeekWorkouts || []);
      setFitnessMetrics(data.fitnessMetrics || []);
      setPowerPbs(data.powerPbs || []);
    } catch {
      showToast("Failed to load dashboard data", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSync = useCallback(async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/sync", { method: "POST" });
      const data: SyncPostResponse = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Sync failed");
      showToast(
        `Synced ${data.synced!.workouts} workouts, ${data.synced!.fitnessMetrics} fitness metrics`,
        "success"
      );
      await loadData();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Sync failed",
        "error"
      );
    } finally {
      setSyncing(false);
    }
  }, [loadData, showToast]);

  const latestMetric = fitnessMetrics[0] ?? null;

  return {
    workouts,
    nextWeekWorkouts,
    fitnessMetrics,
    latestMetric,
    powerPbs,
    syncing,
    loading,
    toast,
    hideToast,
    handleSync,
  };
}
