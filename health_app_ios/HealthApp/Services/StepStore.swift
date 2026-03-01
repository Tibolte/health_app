import Foundation
import SwiftData

protocol StepStoreProtocol {
    func loadAllSteps() async -> [PersistedStepEntry]
    func pendingSteps() async -> [PersistedStepEntry]
    func upsertSteps(_ steps: [StepEntry]) async
    func markSynced(dates: [String]) async
    func markFailed(dates: [String]) async
    func markSyncing(dates: [String]) async
}

@MainActor
final class StepStore: StepStoreProtocol {
    private let modelContext: ModelContext

    init(modelContainer: ModelContainer) {
        self.modelContext = ModelContext(modelContainer)
    }

    func loadAllSteps() async -> [PersistedStepEntry] {
        let descriptor = FetchDescriptor<PersistedStepEntry>(
            sortBy: [SortDescriptor(\.date, order: .reverse)]
        )
        return (try? modelContext.fetch(descriptor)) ?? []
    }

    func pendingSteps() async -> [PersistedStepEntry] {
        let pendingRaw = SyncStatus.pending.rawValue
        let failedRaw = SyncStatus.failed.rawValue
        let descriptor = FetchDescriptor<PersistedStepEntry>(
            predicate: #Predicate { $0.syncStatusRaw == pendingRaw || $0.syncStatusRaw == failedRaw },
            sortBy: [SortDescriptor(\.date)]
        )
        return (try? modelContext.fetch(descriptor)) ?? []
    }

    func upsertSteps(_ steps: [StepEntry]) async {
        for step in steps {
            let date = step.date
            let descriptor = FetchDescriptor<PersistedStepEntry>(
                predicate: #Predicate { $0.date == date }
            )
            if let existing = try? modelContext.fetch(descriptor).first {
                if existing.steps != step.steps {
                    existing.steps = step.steps
                    existing.syncStatus = .pending
                }
            } else {
                let entry = PersistedStepEntry(
                    date: step.date,
                    steps: step.steps,
                    source: step.source ?? "healthkit"
                )
                modelContext.insert(entry)
            }
        }
        try? modelContext.save()
    }

    func markSynced(dates: [String]) async {
        updateStatus(dates: dates, status: .synced)
    }

    func markFailed(dates: [String]) async {
        updateStatus(dates: dates, status: .failed)
    }

    func markSyncing(dates: [String]) async {
        updateStatus(dates: dates, status: .syncing)
    }

    // MARK: - Private

    private func updateStatus(dates: [String], status: SyncStatus) {
        for date in dates {
            let descriptor = FetchDescriptor<PersistedStepEntry>(
                predicate: #Predicate { $0.date == date }
            )
            if let entry = try? modelContext.fetch(descriptor).first {
                entry.syncStatus = status
                entry.lastSyncAttempt = Date()
            }
        }
        try? modelContext.save()
    }
}
