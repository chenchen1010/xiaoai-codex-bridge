import AppKit
import Foundation

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
