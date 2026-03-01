import Foundation
import SwiftData

enum SyncStatus: Int, Codable {
    case pending = 0
    case syncing = 1
    case synced = 2
    case failed = 3
}

@Model
final class PersistedStepEntry {
    @Attribute(.unique) var date: String
    var steps: Int
    var source: String
    var syncStatusRaw: Int
    var lastSyncAttempt: Date?

    var syncStatus: SyncStatus {
        get { SyncStatus(rawValue: syncStatusRaw) ?? .pending }
        set { syncStatusRaw = newValue.rawValue }
    }

    init(date: String, steps: Int, source: String = "healthkit", syncStatus: SyncStatus = .pending) {
        self.date = date
        self.steps = steps
        self.source = source
        self.syncStatusRaw = syncStatus.rawValue
    }
}
