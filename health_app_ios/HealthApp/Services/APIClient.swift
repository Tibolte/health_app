import Foundation

protocol APIClientProtocol {
    func submitSteps(_ steps: [StepEntry]) async throws -> StepSubmitResult
    func fetchSteps() async throws -> StepResponse
}

enum APIError: LocalizedError {
    case missingAPIKey
    case invalidResponse(Int)

    var errorDescription: String? {
        switch self {
        case .missingAPIKey:
            return "API key not configured. Add your key in settings."
        case .invalidResponse(let code):
            return "Server error (HTTP \(code))"
        }
    }
}

final class APIClient: APIClientProtocol {
    private let baseURL: URL
    private let session: URLSession
    private static let apiKeyKeychainKey = "api_key"

    init(
        baseURL: URL = URL(string: "https://health-app-gamma-one.vercel.app")!,
        session: URLSession = .shared
    ) {
        self.baseURL = baseURL
        self.session = session
    }

    func submitSteps(_ steps: [StepEntry]) async throws -> StepSubmitResult {
        var request = try makeRequest(path: "/api/steps", method: "POST")
        request.httpBody = try JSONEncoder().encode(steps)

        let (data, response) = try await session.data(for: request)
        try validateResponse(response)

        return try JSONDecoder().decode(StepSubmitResult.self, from: data)
    }

    func fetchSteps() async throws -> StepResponse {
        let request = try makeRequest(path: "/api/steps", method: "GET")

        let (data, response) = try await session.data(for: request)
        try validateResponse(response)

        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return try decoder.decode(StepResponse.self, from: data)
    }

    // MARK: - Private

    private func makeRequest(path: String, method: String) throws -> URLRequest {
        guard let apiKey = KeychainService.load(key: Self.apiKeyKeychainKey) else {
            throw APIError.missingAPIKey
        }

        var request = URLRequest(url: baseURL.appendingPathComponent(path))
        request.httpMethod = method
        request.setValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        return request
    }

    private func validateResponse(_ response: URLResponse) throws {
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse(0)
        }
        guard (200...299).contains(httpResponse.statusCode) else {
            throw APIError.invalidResponse(httpResponse.statusCode)
        }
    }
}
