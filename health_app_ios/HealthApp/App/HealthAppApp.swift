import SwiftUI
import SwiftData

@main
struct HealthAppApp: App {
    let modelContainer: ModelContainer

    init() {
        Self.seedAPIKeyIfNeeded()
        do {
            modelContainer = try ModelContainer(for: PersistedStepEntry.self)
        } catch {
            fatalError("Failed to create ModelContainer: \(error)")
        }
    }

    var body: some Scene {
        WindowGroup {
            StepSyncView(modelContainer: modelContainer)
        }
        .modelContainer(modelContainer)
    }

    private static func seedAPIKeyIfNeeded() {
        let keychainKey = "api_key"
        guard KeychainService.load(key: keychainKey) == nil else { return }
        guard let key = Bundle.main.infoDictionary?["APISecretKey"] as? String,
              !key.isEmpty,
              key != "your_api_key_here"
        else { return }
        KeychainService.save(key: keychainKey, value: key)
    }
}
