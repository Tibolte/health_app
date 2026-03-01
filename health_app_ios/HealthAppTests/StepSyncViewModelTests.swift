import XCTest
@testable import HealthApp

@MainActor
final class StepSyncViewModelTests: XCTestCase {

    private func makeViewModel(
        healthKit: FakeHealthKitService = FakeHealthKitService(),
        apiClient: FakeAPIClient = FakeAPIClient(),
        stepStore: FakeStepStore = FakeStepStore(),
        connectivity: FakeConnectivityMonitor = FakeConnectivityMonitor()
    ) -> (StepSyncViewModel, FakeHealthKitService, FakeAPIClient, FakeStepStore, FakeConnectivityMonitor) {
        let vm = StepSyncViewModel(
            healthKit: healthKit,
            apiClient: apiClient,
            stepStore: stepStore,
            connectivityMonitor: connectivity
        )
        return (vm, healthKit, apiClient, stepStore, connectivity)
    }

    // MARK: - loadSteps

    func testLoadSteps_success() async {
        let (vm, healthKit, _, _, _) = makeViewModel()
        healthKit.steps = [
            StepEntry(date: "2024-01-01", steps: 5000),
            StepEntry(date: "2024-01-02", steps: 8000),
        ]

        await vm.loadSteps()

        XCTAssertEqual(vm.steps.count, 2)
        XCTAssertEqual(vm.steps[0].steps, 5000)
        XCTAssertEqual(vm.steps[1].steps, 8000)
        XCTAssertNil(vm.error)
        XCTAssertFalse(vm.isLoading)
        XCTAssertTrue(healthKit.authorizationRequested)
    }

    func testLoadSteps_authorizationError() async {
        let (vm, healthKit, _, _, _) = makeViewModel()
        healthKit.shouldThrowOnAuthorization = true

        await vm.loadSteps()

        XCTAssertTrue(vm.steps.isEmpty)
        XCTAssertNotNil(vm.error)
        XCTAssertEqual(vm.error, "Authorization failed")
        XCTAssertFalse(vm.isLoading)
    }

    func testLoadSteps_fetchError() async {
        let (vm, healthKit, _, _, _) = makeViewModel()
        healthKit.shouldThrowOnFetch = true

        await vm.loadSteps()

        XCTAssertTrue(vm.steps.isEmpty)
        XCTAssertNotNil(vm.error)
        XCTAssertEqual(vm.error, "Fetch failed")
        XCTAssertFalse(vm.isLoading)
    }

    // MARK: - syncSteps

    func testSyncSteps_success() async {
        let connectivity = FakeConnectivityMonitor()
        connectivity.isConnected = false
        let (vm, healthKit, apiClient, _, _) = makeViewModel(connectivity: connectivity)
        healthKit.steps = [
            StepEntry(date: "2024-01-01", steps: 5000),
            StepEntry(date: "2024-01-02", steps: 8000),
        ]
        vm.start()

        await vm.loadSteps()

        // Go online and manually sync
        connectivity.isConnected = true
        vm.isConnected = true
        await vm.syncSteps()

        XCTAssertEqual(vm.lastSyncResult, "Synced 2 days")
        XCTAssertNil(vm.error)
        XCTAssertFalse(vm.isSyncing)
        XCTAssertEqual(apiClient.submittedSteps.count, 1)
        XCTAssertEqual(apiClient.submittedSteps[0].count, 2)
    }

    func testSyncSteps_emptySteps() async {
        let (vm, _, apiClient, _, _) = makeViewModel()

        await vm.syncSteps()

        XCTAssertEqual(vm.error, "No steps to sync")
        XCTAssertNil(vm.lastSyncResult)
        XCTAssertTrue(apiClient.submittedSteps.isEmpty)
    }

    func testSyncSteps_apiError() async {
        let (vm, healthKit, apiClient, _, _) = makeViewModel()
        apiClient.shouldThrow = true
        healthKit.steps = [
            StepEntry(date: "2024-01-01", steps: 5000),
        ]

        await vm.loadSteps()

        // Reset error from the auto-sync failure during loadSteps
        vm.error = nil
        await vm.syncSteps()

        XCTAssertNotNil(vm.error)
        XCTAssertEqual(vm.error, "API request failed")
        XCTAssertNil(vm.lastSyncResult)
        XCTAssertFalse(vm.isSyncing)
    }

    // MARK: - Offline support

    func testLoadSteps_showsCachedDataImmediately() async {
        let stepStore = FakeStepStore()
        stepStore.storedSteps = [
            PersistedStepEntry(date: "2024-01-01", steps: 3000, syncStatus: .synced),
        ]
        let healthKit = FakeHealthKitService()
        healthKit.steps = [
            StepEntry(date: "2024-01-01", steps: 5000),
            StepEntry(date: "2024-01-02", steps: 8000),
        ]
        let (vm, _, _, _, _) = makeViewModel(healthKit: healthKit, stepStore: stepStore)

        await vm.loadSteps()

        // After load completes, should have fresh data from HealthKit upserted into store
        XCTAssertEqual(vm.steps.count, 2)
        XCTAssertFalse(vm.isLoading)
    }

    func testSyncSteps_offlineQueuesEntries() async {
        let connectivity = FakeConnectivityMonitor()
        connectivity.isConnected = false
        let (vm, healthKit, apiClient, stepStore, _) = makeViewModel(connectivity: connectivity)
        healthKit.steps = [
            StepEntry(date: "2024-01-01", steps: 5000),
        ]
        vm.start()

        await vm.loadSteps()
        await vm.syncSteps()

        XCTAssertEqual(vm.lastSyncResult, "Offline — steps queued for sync")
        XCTAssertTrue(apiClient.submittedSteps.isEmpty)
        let pending = await stepStore.pendingSteps()
        XCTAssertEqual(pending.count, 1)
    }

    func testSyncSteps_retriesOnReconnect() async {
        let connectivity = FakeConnectivityMonitor()
        connectivity.isConnected = false
        let (vm, healthKit, apiClient, _, _) = makeViewModel(connectivity: connectivity)
        healthKit.steps = [
            StepEntry(date: "2024-01-01", steps: 5000),
        ]
        vm.start()

        await vm.loadSteps()

        // Simulate reconnection
        connectivity.simulateConnectivityChange(connected: true)

        // Give the auto-retry task time to execute
        try? await Task.sleep(nanoseconds: 100_000_000)

        XCTAssertFalse(apiClient.submittedSteps.isEmpty)
    }

    func testSyncSteps_marksSyncedOnSuccess() async {
        let (vm, healthKit, _, stepStore, _) = makeViewModel()
        healthKit.steps = [
            StepEntry(date: "2024-01-01", steps: 5000),
            StepEntry(date: "2024-01-02", steps: 8000),
        ]

        await vm.loadSteps()

        let allSteps = await stepStore.loadAllSteps()
        XCTAssertTrue(allSteps.allSatisfy { $0.syncStatus == .synced })
    }

    func testSyncSteps_marksFailedOnError() async {
        let connectivity = FakeConnectivityMonitor()
        connectivity.isConnected = false
        let apiClient = FakeAPIClient()
        apiClient.shouldThrow = true
        let (vm, healthKit, _, stepStore, _) = makeViewModel(apiClient: apiClient, connectivity: connectivity)
        healthKit.steps = [
            StepEntry(date: "2024-01-01", steps: 5000),
        ]
        vm.start()

        // Load steps offline (they stay pending, no sync attempted)
        await vm.loadSteps()

        // Go online — auto-retry will fail since shouldThrow = true
        connectivity.simulateConnectivityChange(connected: true)
        try? await Task.sleep(nanoseconds: 100_000_000)

        let allSteps = await stepStore.loadAllSteps()
        XCTAssertTrue(allSteps.allSatisfy { $0.syncStatus == .failed })
    }
}
