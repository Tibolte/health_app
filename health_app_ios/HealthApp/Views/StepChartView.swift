import SwiftUI
import Charts

struct StepChartView: View {
    let steps: [PersistedStepEntry]
    let todayString: String

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("This Week")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .padding(.horizontal)

            Chart(steps, id: \.date) { entry in
                BarMark(
                    x: .value("Day", DateFormatting.shortWeekday(from: entry.date)),
                    y: .value("Steps", entry.steps)
                )
                .foregroundStyle(entry.date == todayString ? .green : .green.opacity(0.5))
                .cornerRadius(4)
                .annotation(position: .top) {
                    if entry.date == todayString {
                        Text(abbreviatedSteps(entry.steps))
                            .font(.caption2)
                            .fontWeight(.medium)
                            .foregroundStyle(.green)
                    }
                }
            }
            .chartYAxis {
                AxisMarks(position: .leading) { value in
                    AxisGridLine(stroke: StrokeStyle(dash: [4, 4]))
                        .foregroundStyle(.secondary.opacity(0.3))
                    AxisValueLabel {
                        if let intValue = value.as(Int.self) {
                            Text(abbreviatedSteps(intValue))
                                .font(.caption2)
                        }
                    }
                }
            }
            .chartXAxis {
                AxisMarks { value in
                    AxisValueLabel()
                        .font(.caption2)
                }
            }
            .frame(height: 200)
            .padding(.horizontal)
        }
        .padding(.vertical)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
    }

    private func abbreviatedSteps(_ value: Int) -> String {
        if value >= 1000 {
            let k = Double(value) / 1000.0
            if k == k.rounded() {
                return "\(Int(k))k"
            }
            return String(format: "%.1fk", k)
        }
        return "\(value)"
    }
}

#Preview {
    StepChartView(
        steps: [
            PersistedStepEntry(date: "2024-06-17", steps: 6200),
            PersistedStepEntry(date: "2024-06-18", steps: 8400),
            PersistedStepEntry(date: "2024-06-19", steps: 5100),
            PersistedStepEntry(date: "2024-06-20", steps: 9300),
            PersistedStepEntry(date: "2024-06-21", steps: 7800),
            PersistedStepEntry(date: "2024-06-22", steps: 4500),
            PersistedStepEntry(date: "2024-06-23", steps: 8900),
        ],
        todayString: "2024-06-23"
    )
    .padding()
    .background(Color(.systemGroupedBackground))
}
