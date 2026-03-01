import Foundation
@testable import HealthApp

final class FakeConnectivityMonitor: ConnectivityMonitorProtocol {
    var isConnected = true
    var onConnectivityChange: ((Bool) -> Void)?
    private(set) var started = false

    func start() {
        started = true
    }

    func stop() {
        started = false
    }

    func simulateConnectivityChange(connected: Bool) {
        isConnected = connected
        onConnectivityChange?(connected)
    }
}
