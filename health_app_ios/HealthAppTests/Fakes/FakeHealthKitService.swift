import Foundation
@testable import HealthApp

final class FakeHealthKitService: HealthKitServiceProtocol {
    var steps: [StepEntry] = []
    var shouldThrowOnAuthorization = false
    var shouldThrowOnFetch = false
    private(set) var authorizationRequested = false

    func requestAuthorization() async throws {
        authorizationRequested = true
        if shouldThrowOnAuthorization {
            throw FakeError.authorization
        }
    }

    func fetchSteps(days: Int) async throws -> [StepEntry] {
        if shouldThrowOnFetch {
            throw FakeError.fetch
        }
        return steps
    }
}

enum FakeError: LocalizedError {
    case authorization
    case fetch
    case api

    var errorDescription: String? {
        switch self {
        case .authorization: return "Authorization failed"
        case .fetch: return "Fetch failed"
        case .api: return "API request failed"
        }
    }
}
