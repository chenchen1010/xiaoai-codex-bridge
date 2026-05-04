import AppKit
import ApplicationServices
import Foundation

func ensureAccessibilityPermission() {
    let trusted = AXIsProcessTrusted()
    if trusted {
        return
    }

    let app = NSApplication.shared
    app.setActivationPolicy(.regular)
    app.activate(ignoringOtherApps: true)

    let options = [kAXTrustedCheckOptionPrompt.takeUnretainedValue() as String: true] as CFDictionary
    AXIsProcessTrustedWithOptions(options)

    let alert = NSAlert()
    alert.messageText = "需要辅助功能权限"
    alert.informativeText = "请在系统设置 > 隐私与安全性 > 辅助功能中允许“小爱Codex输入助手”。授权后再试一次语音回复。"
    alert.alertStyle = .warning
    alert.addButton(withTitle: "知道了")
    alert.runModal()
    exit(13)
}

func postKey(_ keyCode: CGKeyCode, flags: CGEventFlags = []) {
    let source = CGEventSource(stateID: .hidSystemState)
    let down = CGEvent(keyboardEventSource: source, virtualKey: keyCode, keyDown: true)
    let up = CGEvent(keyboardEventSource: source, virtualKey: keyCode, keyDown: false)
    down?.flags = flags
    up?.flags = flags
    down?.post(tap: .cghidEventTap)
    up?.post(tap: .cghidEventTap)
}

let text = CommandLine.arguments.dropFirst().joined(separator: " ").trimmingCharacters(in: .whitespacesAndNewlines)
guard !text.isEmpty else {
    exit(2)
}

ensureAccessibilityPermission()

let pasteboard = NSPasteboard.general
pasteboard.clearContents()
pasteboard.setString(text, forType: .string)

let workspace = NSWorkspace.shared
let codex = workspace.runningApplications.first { app in
    app.localizedName == "Codex" || app.bundleIdentifier == "com.openai.codex"
}

if let codex {
    codex.activate(options: [.activateAllWindows, .activateIgnoringOtherApps])
} else {
    workspace.launchApplication("Codex")
}

Thread.sleep(forTimeInterval: 0.35)
postKey(9, flags: .maskCommand) // Cmd+V
Thread.sleep(forTimeInterval: 0.08)
postKey(36) // Enter
