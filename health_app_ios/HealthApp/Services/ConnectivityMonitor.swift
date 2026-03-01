import Foundation
import Network

protocol ConnectivityMonitorProtocol {
    var isConnected: Bool { get }
    var onConnectivityChange: ((Bool) -> Void)? { get set }
    func start()
    func stop()
}

@Observable
final class ConnectivityMonitor: ConnectivityMonitorProtocol {
    var isConnected = true
    var onConnectivityChange: ((Bool) -> Void)?

    private let monitor = NWPathMonitor()
    private let queue = DispatchQueue(label: "ConnectivityMonitor")

    func start() {
        monitor.pathUpdateHandler = { [weak self] path in
            let connected = path.status == .satisfied
            DispatchQueue.main.async {
                guard let self else { return }
                let changed = self.isConnected != connected
                self.isConnected = connected
                if changed {
                    self.onConnectivityChange?(connected)
                }
            }
        }
        monitor.start(queue: queue)
    }

    func stop() {
        monitor.cancel()
    }
}
