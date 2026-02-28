import Foundation

@Observable
final class StepSyncViewModel {
    var steps: [StepEntry] = []
    var isLoading = false
    var isSyncing = false
    var error: String?
    var lastSyncResult: String?

    private let healthKit: HealthKitServiceProtocol
    private let apiClient: APIClientProtocol

    init(
        healthKit: HealthKitServiceProtocol = HealthKitService(),
        apiClient: APIClientProtocol = APIClient()
    ) {
        self.healthKit = healthKit
        self.apiClient = apiClient
    }

    func loadSteps() async {
        isLoading = true
        error = nil
        defer { isLoading = false }

        do {
            try await healthKit.requestAuthorization()
            steps = try await healthKit.fetchSteps(days: 7)
        } catch {
            self.error = error.localizedDescription
        }
    }

    func syncSteps() async {
        guard !steps.isEmpty else {
            error = "No steps to sync"
            return
        }

        isSyncing = true
        error = nil
        lastSyncResult = nil
        defer { isSyncing = false }

        do {
            let result = try await apiClient.submitSteps(steps)
            lastSyncResult = "Synced \(result.upserted) days"
        } catch {
            self.error = error.localizedDescription
        }
    }

}
