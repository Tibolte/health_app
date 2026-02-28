const SPORT_ICONS: Record<string, string> = {
  Ride: "\u{1F6B4}",
  VirtualRide: "\u{1F6B4}",
  Run: "\u{1F3C3}",
  VirtualRun: "\u{1F3C3}",
  Swim: "\u{1F3CA}",
  WeightTraining: "\u{1F3CB}\uFE0F",
  Yoga: "\u{1F9D8}",
  Hike: "\u{1F6B6}",
  Walk: "\u{1F6B6}",
  Rowing: "\u{1F6A3}",
  Ski: "\u26F7\uFE0F",
  CrossCountrySkiing: "\u26F7\uFE0F",
  NordicSki: "\u26F7\uFE0F",
  TrailRun: "\u{1F3C3}",
};

export function getSportIcon(sport: string): string {
  return SPORT_ICONS[sport] ?? "\u{1F3C5}";
}
