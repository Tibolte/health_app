import SwiftUI

struct StepDetailList: View {
    let steps: [PersistedStepEntry]
    let pendingCount: Int

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Details")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                if pendingCount > 0 {
                    Spacer()
                    Text("\(pendingCount) pending")
                        .font(.caption)
                        .foregroundStyle(.orange)
                }
            }
            .padding(.horizontal)

            VStack(spacing: 0) {
                ForEach(Array(steps.enumerated()), id: \.element.date) { index, entry in
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(DateFormatting.shortDate(from: entry.date))
                                .font(.subheadline)
                            Text(DateFormatting.shortWeekday(from: entry.date))
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        Spacer()
                        Text("\(entry.steps.formatted())")
                            .font(.headline)
                            .monospacedDigit()
                        syncStatusIcon(for: entry.syncStatus)
                    }
                    .padding(.horizontal)
                    .padding(.vertical, 10)

                    if index < steps.count - 1 {
                        Divider()
                            .padding(.leading)
                    }
                }
            }
        }
        .padding(.vertical)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
    }

    @ViewBuilder
    private func syncStatusIcon(for status: SyncStatus) -> some View {
        switch status {
        case .synced:
            Image(systemName: "checkmark.icloud.fill")
                .foregroundStyle(.green)
                .font(.caption)
        case .pending:
            Image(systemName: "icloud.slash")
                .foregroundStyle(.orange)
                .font(.caption)
        case .syncing:
            ProgressView()
                .controlSize(.mini)
        case .failed:
            Image(systemName: "exclamationmark.icloud.fill")
                .foregroundStyle(.red)
                .font(.caption)
        }
    }
}

#Preview {
    StepDetailList(
        steps: [
            PersistedStepEntry(date: "2024-06-23", steps: 8900, syncStatus: .synced),
            PersistedStepEntry(date: "2024-06-22", steps: 4500, syncStatus: .synced),
            PersistedStepEntry(date: "2024-06-21", steps: 7800, syncStatus: .pending),
            PersistedStepEntry(date: "2024-06-20", steps: 9300, syncStatus: .failed),
        ],
        pendingCount: 2
    )
    .padding()
    .background(Color(.systemGroupedBackground))
}
