import Foundation
@testable import HealthApp

final class FakeStepStore: StepStoreProtocol {
    var storedSteps: [PersistedStepEntry] = []

    func loadAllSteps() async -> [PersistedStepEntry] {
        storedSteps
    }

    func pendingSteps() async -> [PersistedStepEntry] {
        storedSteps.filter { $0.syncStatus == .pending || $0.syncStatus == .failed }
    }

    func upsertSteps(_ steps: [StepEntry]) async {
        for step in steps {
            if let existing = storedSteps.first(where: { $0.date == step.date }) {
                existing.steps = step.steps
                if existing.syncStatus != .synced {
                    existing.syncStatus = .pending
                }
            } else {
                storedSteps.append(PersistedStepEntry(date: step.date, steps: step.steps, source: step.source ?? "healthkit"))
            }
        }
    }

    func markSynced(dates: [String]) async {
        for entry in storedSteps where dates.contains(entry.date) {
            entry.syncStatus = .synced
        }
    }

    func markFailed(dates: [String]) async {
        for entry in storedSteps where dates.contains(entry.date) {
            entry.syncStatus = .failed
        }
    }

    func markSyncing(dates: [String]) async {
        for entry in storedSteps where dates.contains(entry.date) {
            entry.syncStatus = .syncing
        }
    }
}
