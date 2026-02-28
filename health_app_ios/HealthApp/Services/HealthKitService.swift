import HealthKit

protocol HealthKitServiceProtocol {
    func requestAuthorization() async throws
    func fetchSteps(days: Int) async throws -> [StepEntry]
}

final class HealthKitService: HealthKitServiceProtocol {
    private let store = HKHealthStore()
    private let stepType = HKQuantityType(.stepCount)

    func requestAuthorization() async throws {
        try await store.requestAuthorization(toShare: [], read: [stepType])
    }

    func fetchSteps(days: Int) async throws -> [StepEntry] {
        let calendar = Calendar.current
        let now = Date()
        let startOfToday = calendar.startOfDay(for: now)
        guard let startDate = calendar.date(byAdding: .day, value: -days, to: startOfToday) else {
            return []
        }
        let endDate = startOfToday.addingTimeInterval(86400)

        let interval = DateComponents(day: 1)
        let predicate = HKQuery.predicateForSamples(
            withStart: startDate, end: endDate, options: .strictStartDate
        )

        let query = HKStatisticsCollectionQuery(
            quantityType: stepType,
            quantitySamplePredicate: predicate,
            options: .cumulativeSum,
            anchorDate: startDate,
            intervalComponents: interval
        )

        return try await withCheckedThrowingContinuation { continuation in
            query.initialResultsHandler = { _, results, error in
                if let error {
                    continuation.resume(throwing: error)
                    return
                }

                guard let results else {
                    continuation.resume(returning: [])
                    return
                }

                let formatter = DateFormatter()
                formatter.dateFormat = "yyyy-MM-dd"
                formatter.timeZone = calendar.timeZone

                var entries: [StepEntry] = []
                results.enumerateStatistics(from: startDate, to: now) { statistics, _ in
                    let steps = Int(
                        statistics.sumQuantity()?.doubleValue(for: .count()) ?? 0)
                    let dateString = formatter.string(from: statistics.startDate)
                    entries.append(StepEntry(date: dateString, steps: steps))
                }

                continuation.resume(returning: entries)
            }

            store.execute(query)
        }
    }
}
