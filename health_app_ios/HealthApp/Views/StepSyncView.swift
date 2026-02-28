import SwiftUI

struct StepSyncView: View {
    @State private var viewModel = StepSyncViewModel()

    var body: some View {
        NavigationStack {
            List {
                stepsSection
            }
            .navigationTitle("Step Sync")
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button {
                        Task { await viewModel.syncSteps() }
                    } label: {
                        if viewModel.isSyncing {
                            ProgressView()
                        } else {
                            Label("Sync", systemImage: "arrow.triangle.2.circlepath")
                        }
                    }
                    .disabled(viewModel.isSyncing || viewModel.steps.isEmpty)
                }
            }
            .task {
                await viewModel.loadSteps()
            }
        }
    }

    // MARK: - Sections

    private var stepsSection: some View {
        Section {
            if viewModel.isLoading {
                HStack {
                    Spacer()
                    ProgressView("Loading steps...")
                    Spacer()
                }
            } else if viewModel.steps.isEmpty {
                ContentUnavailableView(
                    "No Steps",
                    systemImage: "figure.walk",
                    description: Text("Grant HealthKit access to see your steps.")
                )
            } else {
                ForEach(viewModel.steps) { entry in
                    HStack {
                        Text(entry.date)
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                        Spacer()
                        Text("\(entry.steps)")
                            .font(.headline)
                            .monospacedDigit()
                    }
                }
            }
        } header: {
            Text("Last 7 Days")
        } footer: {
            statusFooter
        }
    }

    @ViewBuilder
    private var statusFooter: some View {
        if let error = viewModel.error {
            Label(error, systemImage: "exclamationmark.triangle")
                .foregroundStyle(.red)
        } else if let result = viewModel.lastSyncResult {
            Label(result, systemImage: "checkmark.circle")
                .foregroundStyle(.green)
        }
    }
}

#Preview {
    StepSyncView()
}
