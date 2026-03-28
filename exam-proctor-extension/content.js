// content.js — syncs localStorage → chrome.storage.local for background.js

let intervalId = null;

function syncToExtension() {
  // ✅ If chrome is gone (extension reloaded/disabled), kill interval and stop
  if (typeof chrome === "undefined" || !chrome.storage) {
    clearInterval(intervalId);
    return;
  }

  const token = localStorage.getItem("token");
  const sessionId = localStorage.getItem("sessionId");

  if (token && sessionId) {
    chrome.storage.local.set({ token, sessionId }, () => {
      if (typeof chrome === "undefined" || chrome.runtime.lastError) return;
      console.log("✅ Synced | session:", sessionId);
    });
  } else {
    chrome.storage.local.remove(["token", "sessionId"], () => {
      if (typeof chrome === "undefined" || chrome.runtime.lastError) return;
      console.log("🛑 No active session — cleared extension storage");
    });
  }
}

syncToExtension();
intervalId = setInterval(syncToExtension, 2000);