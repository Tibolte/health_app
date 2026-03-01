import SwiftUI

struct StepStatsRow: View {
    let todaySteps: Int
    let sevenDayAverage: Int

    var body: some View {
        HStack(spacing: 12) {
            statCard(
                title: "Today",
                value: todaySteps,
                icon: "figure.walk"
            )
            statCard(
                title: "7-Day Avg",
                value: sevenDayAverage,
                icon: "chart.bar.fill"
            )
        }
    }

    private func statCard(title: String, value: Int, icon: String) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Label(title, systemImage: icon)
                .font(.subheadline)
                .foregroundStyle(.secondary)
            Text("\(value.formatted())")
                .font(.title)
                .fontWeight(.semibold)
                .foregroundStyle(.green)
                .monospacedDigit()
                .contentTransition(.numericText())
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
    }
}

#Preview {
    StepStatsRow(todaySteps: 8432, sevenDayAverage: 6789)
        .padding()
        .background(Color(.systemGroupedBackground))
}
