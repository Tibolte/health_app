import SwiftUI

@main
struct HealthAppApp: App {
    init() {
        Self.seedAPIKeyIfNeeded()
    }

    var body: some Scene {
        WindowGroup {
            StepSyncView()
        }
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
