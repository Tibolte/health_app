import XCTest
@testable import HealthApp

final class StepSyncViewModelTests: XCTestCase {

    // MARK: - loadSteps

    func testLoadSteps_success() async {
        let fakeHealthKit = FakeHealthKitService()
        fakeHealthKit.steps = [
            StepEntry(date: "2024-01-01", steps: 5000),
            StepEntry(date: "2024-01-02", steps: 8000),
        ]
        let viewModel = StepSyncViewModel(healthKit: fakeHealthKit, apiClient: FakeAPIClient())

        await viewModel.loadSteps()

        XCTAssertEqual(viewModel.steps.count, 2)
        XCTAssertEqual(viewModel.steps[0].steps, 5000)
        XCTAssertEqual(viewModel.steps[1].steps, 8000)
        XCTAssertNil(viewModel.error)
        XCTAssertFalse(viewModel.isLoading)
        XCTAssertTrue(fakeHealthKit.authorizationRequested)
    }

    func testLoadSteps_authorizationError() async {
        let fakeHealthKit = FakeHealthKitService()
        fakeHealthKit.shouldThrowOnAuthorization = true
        let viewModel = StepSyncViewModel(healthKit: fakeHealthKit, apiClient: FakeAPIClient())

        await viewModel.loadSteps()

        XCTAssertTrue(viewModel.steps.isEmpty)
        XCTAssertNotNil(viewModel.error)
        XCTAssertEqual(viewModel.error, "Authorization failed")
        XCTAssertFalse(viewModel.isLoading)
    }

    func testLoadSteps_fetchError() async {
        let fakeHealthKit = FakeHealthKitService()
        fakeHealthKit.shouldThrowOnFetch = true
        let viewModel = StepSyncViewModel(healthKit: fakeHealthKit, apiClient: FakeAPIClient())

        await viewModel.loadSteps()

        XCTAssertTrue(viewModel.steps.isEmpty)
        XCTAssertNotNil(viewModel.error)
        XCTAssertEqual(viewModel.error, "Fetch failed")
        XCTAssertFalse(viewModel.isLoading)
    }

    // MARK: - syncSteps

    func testSyncSteps_success() async {
        let fakeAPI = FakeAPIClient()
        let fakeHealthKit = FakeHealthKitService()
        fakeHealthKit.steps = [
            StepEntry(date: "2024-01-01", steps: 5000),
            StepEntry(date: "2024-01-02", steps: 8000),
        ]
        let viewModel = StepSyncViewModel(healthKit: fakeHealthKit, apiClient: fakeAPI)

        await viewModel.loadSteps()
        await viewModel.syncSteps()

        XCTAssertEqual(viewModel.lastSyncResult, "Synced 2 days")
        XCTAssertNil(viewModel.error)
        XCTAssertFalse(viewModel.isSyncing)
        XCTAssertEqual(fakeAPI.submittedSteps.count, 1)
        XCTAssertEqual(fakeAPI.submittedSteps[0].count, 2)
    }

    func testSyncSteps_emptySteps() async {
        let fakeAPI = FakeAPIClient()
        let viewModel = StepSyncViewModel(healthKit: FakeHealthKitService(), apiClient: fakeAPI)

        await viewModel.syncSteps()

        XCTAssertEqual(viewModel.error, "No steps to sync")
        XCTAssertNil(viewModel.lastSyncResult)
        XCTAssertTrue(fakeAPI.submittedSteps.isEmpty)
    }

    func testSyncSteps_apiError() async {
        let fakeAPI = FakeAPIClient()
        fakeAPI.shouldThrow = true
        let fakeHealthKit = FakeHealthKitService()
        fakeHealthKit.steps = [
            StepEntry(date: "2024-01-01", steps: 5000),
        ]
        let viewModel = StepSyncViewModel(healthKit: fakeHealthKit, apiClient: fakeAPI)

        await viewModel.loadSteps()
        await viewModel.syncSteps()

        XCTAssertNotNil(viewModel.error)
        XCTAssertEqual(viewModel.error, "API request failed")
        XCTAssertNil(viewModel.lastSyncResult)
        XCTAssertFalse(viewModel.isSyncing)
    }
}
