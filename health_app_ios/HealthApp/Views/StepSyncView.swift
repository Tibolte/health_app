import SwiftUI
import SwiftData

struct StepSyncView: View {
    let modelContainer: ModelContainer
    @State private var viewModel: StepSyncViewModel?

    var body: some View {
        NavigationStack {
            List {
                if let viewModel {
                    if !viewModel.isConnected {
                        offlineBanner
                    }
                    stepsSection(viewModel: viewModel)
                }
            }
            .navigationTitle("Step Sync")
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button {
                        if let viewModel {
                            Task { await viewModel.syncSteps() }
                        }
                    } label: {
                        if viewModel?.isSyncing == true {
                            ProgressView()
                        } else {
                            Label("Sync", systemImage: "arrow.triangle.2.circlepath")
                        }
                    }
                    .disabled(viewModel?.isSyncing == true || viewModel?.steps.isEmpty != false)
                }
            }
            .task {
                let store = StepStore(modelContainer: modelContainer)
                let vm = StepSyncViewModel(stepStore: store)
                viewModel = vm
                vm.start()
                await vm.loadSteps()
            }
        }
    }

    // MARK: - Sections

    private var offlineBanner: some View {
        Section {
            Label("You're offline. Steps will sync when connection returns.", systemImage: "wifi.slash")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
    }

    private func stepsSection(viewModel: StepSyncViewModel) -> some View {
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
                ForEach(viewModel.steps, id: \.date) { entry in
                    HStack {
                        Text(entry.date)
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                        Spacer()
                        Text("\(entry.steps)")
                            .font(.headline)
                            .monospacedDigit()
                        syncStatusIcon(for: entry.syncStatus)
                    }
                }
            }
        } header: {
            HStack {
                Text("Last 7 Days")
                if viewModel.pendingCount > 0 {
                    Spacer()
                    Text("\(viewModel.pendingCount) pending")
                        .font(.caption)
                        .foregroundStyle(.orange)
                }
            }
        } footer: {
            statusFooter(viewModel: viewModel)
        }
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

    @ViewBuilder
    private func statusFooter(viewModel: StepSyncViewModel) -> some View {
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
    StepSyncView(modelContainer: try! ModelContainer(for: PersistedStepEntry.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true)))
}
