# Health App

Monorepo for a personal health and training dashboard.

## Projects

| Directory | Description |
|---|---|
| [`health_app_web/`](./health_app_web) | Next.js web dashboard — syncs workout data from Intervals.icu, receives step counts from iOS |
| [`health_app_ios/`](./health_app_ios) | SwiftUI iOS app — reads HealthKit data and syncs to the web API |

## Getting Started

See each sub-project's README for setup instructions.

## CI

GitHub Actions runs lint, type-check, test, and build for the web project on push/PR to `main`.
