import Foundation

@Observable
final class StepSyncViewModel {
    var steps: [PersistedStepEntry] = []
    var isLoading = false
    var isSyncing = false
    var error: String?
    var lastSyncResult: String?
    var isConnected = true
    var pendingCount = 0

    private let healthKit: HealthKitServiceProtocol
    private let apiClient: APIClientProtocol
    private let stepStore: StepStoreProtocol
    private var connectivityMonitor: ConnectivityMonitorProtocol

    init(
        healthKit: HealthKitServiceProtocol = HealthKitService(),
        apiClient: APIClientProtocol = APIClient(),
        stepStore: StepStoreProtocol,
        connectivityMonitor: ConnectivityMonitorProtocol = ConnectivityMonitor()
    ) {
        self.healthKit = healthKit
        self.apiClient = apiClient
        self.stepStore = stepStore
        self.connectivityMonitor = connectivityMonitor
    }

    func start() {
        connectivityMonitor.onConnectivityChange = { [weak self] connected in
            guard let self else { return }
            self.isConnected = connected
            if connected {
                Task { @MainActor in
                    await self.syncPendingSteps()
                }
            }
        }
        connectivityMonitor.start()
        isConnected = connectivityMonitor.isConnected
    }

    func loadSteps() async {
        // Show cached data immediately
        let cached = await stepStore.loadAllSteps()
        if !cached.isEmpty {
            steps = cached
            updatePendingCount()
        }

        isLoading = cached.isEmpty
        error = nil

        do {
            try await healthKit.requestAuthorization()
            let freshSteps = try await healthKit.fetchSteps(days: 7)
            await stepStore.upsertSteps(freshSteps)
            steps = await stepStore.loadAllSteps()
            updatePendingCount()

            if isConnected {
                await syncPendingSteps()
            }
        } catch {
            self.error = error.localizedDescription
        }

        isLoading = false
    }

    func syncSteps() async {
        guard !steps.isEmpty else {
            error = "No steps to sync"
            return
        }

        if !isConnected {
            lastSyncResult = "Offline — steps queued for sync"
            return
        }

        await syncPendingSteps()
    }

    func syncPendingSteps() async {
        let pending = await stepStore.pendingSteps()
        guard !pending.isEmpty else { return }

        isSyncing = true
        error = nil
        lastSyncResult = nil
        defer { isSyncing = false }

        let dates = pending.map(\.date)
        await stepStore.markSyncing(dates: dates)

        let payload = pending.map { StepEntry(date: $0.date, steps: $0.steps, source: $0.source) }

        do {
            let result = try await apiClient.submitSteps(payload)
            await stepStore.markSynced(dates: dates)
            steps = await stepStore.loadAllSteps()
            updatePendingCount()
            lastSyncResult = "Synced \(result.upserted) days"
        } catch {
            await stepStore.markFailed(dates: dates)
            steps = await stepStore.loadAllSteps()
            updatePendingCount()
            self.error = error.localizedDescription
        }
    }

    // MARK: - Computed properties

    var chronologicalSteps: [PersistedStepEntry] {
        steps.sorted { $0.date < $1.date }
    }

    var todaySteps: Int {
        let today = DateFormatting.todayString()
        return steps.first { $0.date == today }?.steps ?? 0
    }

    var sevenDayAverage: Int {
        let last7 = Set(DateFormatting.lastNDayStrings(7))
        let matching = steps.filter { last7.contains($0.date) }
        guard !matching.isEmpty else { return 0 }
        let total = matching.reduce(0) { $0 + $1.steps }
        return total / matching.count
    }

    // MARK: - Private

    private func updatePendingCount() {
        pendingCount = steps.filter { $0.syncStatus == .pending || $0.syncStatus == .failed }.count
    }
}
