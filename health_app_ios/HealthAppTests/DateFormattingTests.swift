import XCTest
@testable import HealthApp

final class DateFormattingTests: XCTestCase {

    func testTodayString_returnsCurrentDate() {
        let result = DateFormatting.todayString()
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        formatter.locale = Locale(identifier: "en_US_POSIX")
        let expected = formatter.string(from: Date())
        XCTAssertEqual(result, expected)
    }

    func testLastNDayStrings_returns7Days() {
        let days = DateFormatting.lastNDayStrings(7)
        XCTAssertEqual(days.count, 7)
        XCTAssertEqual(days.last, DateFormatting.todayString())
    }

    func testLastNDayStrings_sortedChronologically() {
        let days = DateFormatting.lastNDayStrings(7)
        let sorted = days.sorted()
        XCTAssertEqual(days, sorted)
    }

    func testLastNDayStrings_zeroReturnsEmpty() {
        let days = DateFormatting.lastNDayStrings(0)
        XCTAssertTrue(days.isEmpty)
    }

    func testDateFrom_validString() {
        let date = DateFormatting.date(from: "2024-06-15")
        XCTAssertNotNil(date)
        let calendar = Calendar.current
        XCTAssertEqual(calendar.component(.year, from: date!), 2024)
        XCTAssertEqual(calendar.component(.month, from: date!), 6)
        XCTAssertEqual(calendar.component(.day, from: date!), 15)
    }

    func testDateFrom_invalidString() {
        XCTAssertNil(DateFormatting.date(from: "not-a-date"))
        XCTAssertNil(DateFormatting.date(from: ""))
    }

    func testShortWeekday_validDate() {
        // 2024-06-17 is a Monday
        let weekday = DateFormatting.shortWeekday(from: "2024-06-17")
        XCTAssertEqual(weekday, "Mon")
    }

    func testShortWeekday_invalidDate() {
        XCTAssertEqual(DateFormatting.shortWeekday(from: "invalid"), "")
    }

    func testShortDate_validDate() {
        let result = DateFormatting.shortDate(from: "2024-06-15")
        XCTAssertEqual(result, "Jun 15")
    }

    func testShortDate_invalidDate() {
        XCTAssertEqual(DateFormatting.shortDate(from: "invalid"), "")
    }
}
