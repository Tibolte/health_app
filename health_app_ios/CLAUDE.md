# CLAUDE.md — iOS

This file provides guidance to Claude Code when working on the iOS app.

## Project Overview

SwiftUI app targeting iOS 17+. Reads health data from HealthKit and displays training dashboard data from the web API.

## Requirements

- Xcode 15+
- iOS 17+ deployment target
- Swift 5.9+

## Commands

```bash
# Build
xcodebuild -project HealthApp.xcodeproj -scheme HealthApp -sdk iphonesimulator build

# Test
xcodebuild -project HealthApp.xcodeproj -scheme HealthApp -sdk iphonesimulator test
```

## Architecture

### Pattern: MVVM with `@Observable`

Use iOS 17+ `@Observable` macro (not the older `ObservableObject` / `@Published` pattern).

**ViewModel:**

```swift
@Observable
class MyViewModel {
    var items: [Item] = []
    var isLoading = false
    var error: String?

    func load() async {
        isLoading = true
        defer { isLoading = false }
        do {
            items = try await apiClient.fetchItems()
        } catch {
            self.error = error.localizedDescription
        }
    }
}
```

**View:**

```swift
struct MyView: View {
    @State private var viewModel = MyViewModel()

    var body: some View {
        List(viewModel.items) { item in
            ItemRow(item: item)
        }
        .task { await viewModel.load() }
    }
}
```

### Concurrency

Use Swift `async/await` for all asynchronous work. No Combine, no completion handlers.

### Networking

Use `URLSession` directly — no third-party HTTP libraries. Define an `APIClient` protocol for testability:

```swift
protocol APIClient {
    func fetchDashboard() async throws -> DashboardResponse
    func syncData() async throws -> SyncResponse
    func submitSteps(_ steps: [StepEntry]) async throws
}
```

All requests must include `Authorization: Bearer <API_SECRET_KEY>` header.

### API key storage

Store the API key in iOS Keychain. Never hardcode it or store in UserDefaults.

### Dependency injection

Use protocols + initializer injection. No DI frameworks.

```swift
@Observable
class DashboardViewModel {
    private let apiClient: APIClient

    init(apiClient: APIClient = RealAPIClient()) {
        self.apiClient = apiClient
    }
}
```

### HealthKit

Use `HKHealthStore` for step count data. Request authorization only for the data types needed. HealthKit queries should be wrapped behind a protocol for testing.

## Project structure

Follow this layout as the project grows:

```
HealthApp/
├── App/
│   └── HealthAppApp.swift          App entry point
├── Models/                         Data models (matching web API responses)
├── Services/
│   ├── APIClient.swift             Protocol + real implementation
│   ├── KeychainService.swift       API key storage
│   └── HealthKitService.swift      HealthKit queries
├── ViewModels/                     @Observable view models
├── Views/
│   ├── Dashboard/                  Dashboard screen + subviews
│   ├── Settings/                   Settings screen
│   └── Components/                 Reusable UI components
└── Tests/
    ├── ViewModels/                 ViewModel unit tests
    └── Services/                   Service unit tests (with mocks)
```

## Testing

- Test ViewModels by injecting mock services via protocols
- No UI tests needed initially — focus on ViewModel logic
- Mock `APIClient` and `HealthKitService` protocols in tests
- Tests should not require network or device access

## Design

Follow Apple's SwiftUI conventions and Human Interface Guidelines. Use native components (NavigationStack, List, etc.). No custom design system — let the platform guide the look and feel.

## API endpoints

All requests go to the deployed web API with `Authorization: Bearer <key>`:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/sync` | GET | Fetch dashboard data (workouts, fitness, power PBs) |
| `/api/sync` | POST | Trigger Intervals.icu sync |
| `/api/fitness-trend?days=90` | GET | Historical CTL/ATL/TSB data |
| `/api/steps` | GET | Step history |
| `/api/steps` | POST | Submit steps from HealthKit |
| `/api/health` | GET | Health check (no auth needed) |
