// content.js — syncs localStorage → chrome.storage.local for background.js

let intervalId = null;
let lastSyncedSessionId = null;

function syncToExtension() {
  if (typeof chrome === "undefined" || !chrome.storage) {
    clearInterval(intervalId);
    return;
  }

  const token = localStorage.getItem("token");
  const sessionId = localStorage.getItem("sessionId");

  if (token && sessionId) {
    // ✅ Only write if sessionId actually changed — avoids unnecessary writes
    if (sessionId !== lastSyncedSessionId) {
      lastSyncedSessionId = sessionId;
      chrome.storage.local.set({ token, sessionId }, () => {
        if (typeof chrome === "undefined" || chrome.runtime.lastError) return;
        console.log("✅ Synced | session:", sessionId);
      });
    }
  } else {
    // ✅ Only clear if we previously had a session — don't clear on every tick
    if (lastSyncedSessionId !== null) {
      lastSyncedSessionId = null;
      chrome.storage.local.remove(["token", "sessionId"], () => {
        if (typeof chrome === "undefined" || chrome.runtime.lastError) return;
        console.log("🛑 No active session — cleared extension storage");
      });
    }
  }
}

// ✅ Sync immediately on page load
syncToExtension();

// ✅ Poll every 500ms — fast enough to catch session start before first tab switch
intervalId = setInterval(syncToExtension, 500);