import Foundation

struct StepEntry: Codable, Identifiable {
    var id: String { date }
    let date: String
    let steps: Int
    let source: String?

    init(date: String, steps: Int, source: String? = "healthkit") {
        self.date = date
        self.steps = steps
        self.source = source
    }
}

struct StepRecord: Codable, Identifiable {
    let id: String
    let date: Date
    let steps: Int
    let source: String
    let createdAt: Date
    let updatedAt: Date
}

struct StepResponse: Codable {
    let steps: [StepRecord]
}

struct StepSubmitResult: Codable {
    let success: Bool
    let upserted: Int
}
