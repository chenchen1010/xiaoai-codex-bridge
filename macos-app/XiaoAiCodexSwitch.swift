import AppKit
import Foundation

private let serviceLabel = "com.burning.xiaoai-codex-bridge"
private let rootDir = Bundle.main.object(forInfoDictionaryKey: "XiaoAiBridgeRoot") as? String ?? FileManager.default.currentDirectoryPath
private let healthURL = URL(string: "http://127.0.0.1:3337/health")!

final class AppDelegate: NSObject, NSApplicationDelegate {
    private let statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
    private let menu = NSMenu()
    private let statusMenuItem = NSMenuItem(title: "状态：检查中...", action: nil, keyEquivalent: "")
    private var timer: Timer?

    func applicationDidFinishLaunching(_ notification: Notification) {
        NSApp.setActivationPolicy(.accessory)
        configureMenu()
        setTitle("小爱Codex", color: "🟡")
        startService()
        refreshStatus()
        timer = Timer.scheduledTimer(withTimeInterval: 5, repeats: true) { [weak self] _ in
            self?.refreshStatus()
        }
    }

    private func configureMenu() {
        statusItem.button?.title = "小爱Codex 🟡"
        statusItem.menu = menu

        menu.addItem(statusMenuItem)
        menu.addItem(NSMenuItem.separator())
        menu.addItem(NSMenuItem(title: "启动/重启", action: #selector(startMenuAction), keyEquivalent: "r"))
        menu.addItem(NSMenuItem(title: "停止", action: #selector(stopMenuAction), keyEquivalent: "s"))
        menu.addItem(NSMenuItem(title: "打开日志", action: #selector(openLogs), keyEquivalent: "l"))
        menu.addItem(NSMenuItem.separator())
        menu.addItem(NSMenuItem(title: "退出菜单栏图标", action: #selector(quit), keyEquivalent: "q"))
    }

    private func setTitle(_ title: String, color: String) {
        DispatchQueue.main.async {
            self.statusItem.button?.title = "\(title) \(color)"
        }
    }

    private func setStatus(_ text: String) {
        DispatchQueue.main.async {
            self.statusMenuItem.title = "状态：\(text)"
        }
    }

    @objc private func startMenuAction() {
        startService()
    }

    @objc private func stopMenuAction() {
        DispatchQueue.global(qos: .userInitiated).async {
            _ = self.runShell("launchctl stop \(serviceLabel) 2>/dev/null || true")
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.8) {
                self.refreshStatus()
            }
        }
    }

    @objc private func openLogs() {
        NSWorkspace.shared.open(URL(fileURLWithPath: "\(rootDir)/.data/logs"))
    }

    @objc private func quit() {
        NSApp.terminate(nil)
    }

    private func startService() {
        setTitle("小爱Codex", color: "🟡")
        setStatus("启动中")
        DispatchQueue.global(qos: .userInitiated).async {
            let plist = "\(NSHomeDirectory())/Library/LaunchAgents/\(serviceLabel).plist"
            let command: String
            if FileManager.default.fileExists(atPath: plist) {
                command = "launchctl stop \(serviceLabel) 2>/dev/null || true; launchctl start \(serviceLabel) 2>/dev/null || cd '\(rootDir)' && npm run service:install"
            } else {
                command = "cd '\(rootDir)' && npm run service:install"
            }
            _ = self.runShell(command)
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) {
                self.refreshStatus()
            }
        }
    }

    private func refreshStatus() {
        DispatchQueue.global(qos: .utility).async {
            let online = self.runShell("curl -fsS '\(healthURL.absoluteString)' >/dev/null 2>&1")
            if online == 0 {
                self.setTitle("小爱Codex", color: "🟢")
                self.setStatus("运行中")
            } else {
                self.setTitle("小爱Codex", color: "🔴")
                self.setStatus("未运行")
            }
        }
    }

    @discardableResult
    private func runShell(_ command: String) -> Int32 {
        let process = Process()
        process.executableURL = URL(fileURLWithPath: "/bin/bash")
        process.arguments = ["-lc", command]
        process.currentDirectoryURL = URL(fileURLWithPath: rootDir)
        do {
            try process.run()
            process.waitUntilExit()
            return process.terminationStatus
        } catch {
            return 1
        }
    }
}

let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.run()
