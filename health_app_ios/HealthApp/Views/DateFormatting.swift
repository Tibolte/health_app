import Foundation

enum DateFormatting {
    private static let dateFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        f.locale = Locale(identifier: "en_US_POSIX")
        f.timeZone = .current
        return f
    }()

    private static let weekdayFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "EEE"
        f.locale = Locale(identifier: "en_US_POSIX")
        return f
    }()

    private static let shortDateFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "MMM d"
        f.locale = Locale(identifier: "en_US_POSIX")
        return f
    }()

    static func todayString() -> String {
        dateFormatter.string(from: Date())
    }

    static func lastNDayStrings(_ n: Int) -> [String] {
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: Date())
        return (0..<n).reversed().compactMap { offset in
            guard let day = calendar.date(byAdding: .day, value: -offset, to: today) else { return nil }
            return dateFormatter.string(from: day)
        }
    }

    static func date(from string: String) -> Date? {
        dateFormatter.date(from: string)
    }

    static func shortWeekday(from dateString: String) -> String {
        guard let date = date(from: dateString) else { return "" }
        return weekdayFormatter.string(from: date)
    }

    static func shortDate(from dateString: String) -> String {
        guard let date = date(from: dateString) else { return "" }
        return shortDateFormatter.string(from: date)
    }
}
