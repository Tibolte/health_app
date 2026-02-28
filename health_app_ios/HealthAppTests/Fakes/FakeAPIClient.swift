import Foundation
@testable import HealthApp

final class FakeAPIClient: APIClientProtocol {
    var submittedSteps: [[StepEntry]] = []
    var shouldThrow = false

    func submitSteps(_ steps: [StepEntry]) async throws -> StepSubmitResult {
        if shouldThrow {
            throw FakeError.api
        }
        submittedSteps.append(steps)
        return StepSubmitResult(success: true, upserted: steps.count)
    }

    func fetchSteps() async throws -> StepResponse {
        return StepResponse(steps: [])
    }
}
