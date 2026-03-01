import SwiftUI
import SwiftData

struct StepSyncView: View {
    private let modelContainer: ModelContainer?
    @State private var viewModel: StepSyncViewModel?

    init(modelContainer: ModelContainer) {
        self.modelContainer = modelContainer
    }

    fileprivate init(viewModel: StepSyncViewModel) {
        self.modelContainer = nil
        self._viewModel = State(initialValue: viewModel)
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                if let viewModel {
                    VStack(spacing: 16) {
                        if !viewModel.isConnected {
                            offlineBanner
                        }

                        if viewModel.isLoading {
                            ProgressView("Loading steps...")
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 40)
                        } else if viewModel.steps.isEmpty {
                            ContentUnavailableView(
                                "No Steps",
                                systemImage: "figure.walk",
                                description: Text("Grant HealthKit access to see your steps.")
                            )
                        } else {
                            StepStatsRow(
                                todaySteps: viewModel.todaySteps,
                                sevenDayAverage: viewModel.sevenDayAverage
                            )

                            StepChartView(
                                steps: viewModel.chronologicalSteps,
                                todayString: DateFormatting.todayString()
                            )

                            StepDetailList(
                                steps: viewModel.steps,
                                pendingCount: viewModel.pendingCount
                            )

                            statusFooter(viewModel: viewModel)
                        }
                    }
                    .padding()
                }
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle("Steps")
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
                guard viewModel == nil, let modelContainer else { return }
                let store = StepStore(modelContainer: modelContainer)
                let vm = StepSyncViewModel(stepStore: store)
                viewModel = vm
                vm.start()
                await vm.loadSteps()
            }
        }
    }

    // MARK: - Sub-views

    private var offlineBanner: some View {
        Label("You're offline. Steps will sync when connection returns.", systemImage: "wifi.slash")
            .font(.subheadline)
            .foregroundStyle(.secondary)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding()
            .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
    }

    @ViewBuilder
    private func statusFooter(viewModel: StepSyncViewModel) -> some View {
        if let error = viewModel.error {
            Label(error, systemImage: "exclamationmark.triangle")
                .foregroundStyle(.red)
                .font(.footnote)
                .frame(maxWidth: .infinity, alignment: .leading)
        } else if let result = viewModel.lastSyncResult {
            Label(result, systemImage: "checkmark.circle")
                .foregroundStyle(.green)
                .font(.footnote)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}

#if DEBUG
private struct NoOpStepStore: StepStoreProtocol {
    func loadAllSteps() async -> [PersistedStepEntry] { [] }
    func pendingSteps() async -> [PersistedStepEntry] { [] }
    func upsertSteps(_ steps: [StepEntry]) async {}
    func markSynced(dates: [String]) async {}
    func markFailed(dates: [String]) async {}
    func markSyncing(dates: [String]) async {}
}

#Preview("With Data") {
    let vm = StepSyncViewModel(stepStore: NoOpStepStore())
    let days = DateFormatting.lastNDayStrings(7)
    let counts = [6200, 8400, 5100, 9300, 7800, 4500, 10200]
    vm.steps = zip(days, counts).map { date, steps in
        PersistedStepEntry(date: date, steps: steps, syncStatus: .synced)
    }
    vm.steps[vm.steps.count - 1].syncStatus = .pending
    vm.pendingCount = 1
    return StepSyncView(viewModel: vm)
}

#Preview("Empty") {
    StepSyncView(modelContainer: try! ModelContainer(
        for: PersistedStepEntry.self,
        configurations: ModelConfiguration(isStoredInMemoryOnly: true)
    ))
}
#endif
