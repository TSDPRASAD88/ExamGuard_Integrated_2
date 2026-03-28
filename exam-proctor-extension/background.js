// background.js

// ─── Track last known URL in session storage ────────────────────────────────

function getCurrentExamTab(callback) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs[0]) callback(tabs[0]);
    else callback(null);
  });
}

// ─── TAB SWITCH DETECTION ───────────────────────────────────────────────────

chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.storage.local.get(["sessionId", "token"], (localData) => {
    const { sessionId, token } = localData;

    console.log("🔍 Tab activated — storage read:", {
      sessionId: sessionId || "undefined",
      token: token ? "exists" : "missing",
    });

    if (!sessionId || !token) {
      console.log("🛑 No active session → skipping detection");
      chrome.storage.session.remove("lastUrl");
      return;
    }

    chrome.tabs.get(activeInfo.tabId, (tab) => {
      if (!tab || !tab.url) return;
      handleTabSwitch(tab.url, sessionId, token);
    });
  });
});

// ─── STORAGE CHANGE LISTENER ────────────────────────────────────────────────
// ✅ This fires the moment content.js writes sessionId/token to storage.
// If a tab switch already happened before the write, we catch it here.

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;

  const newSessionId = changes.sessionId?.newValue;
  const newToken = changes.token?.newValue;

  // Session just became active
  if (newSessionId && newToken) {
    console.log("✅ Session detected in storage:", newSessionId);

    // Check which tab is currently active
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || !tabs[0]) return;
      const currentUrl = tabs[0].url || "";

      // If the active tab is NOT the exam tab at the moment session is set,
      // it means user switched away before or during session start
      if (!currentUrl.includes("localhost:5173")) {
        console.log("🚨 Active tab is not exam tab when session started!");
        sendViolation(newSessionId, newToken);
      }

      // Save current URL as starting point
      chrome.storage.session.set({ lastUrl: currentUrl });
    });
  }

  // Session cleared
  if (changes.sessionId?.oldValue && !changes.sessionId?.newValue) {
    console.log("🛑 Session cleared from storage");
    chrome.storage.session.remove("lastUrl");
  }
});

// ─── HELPERS ────────────────────────────────────────────────────────────────

function handleTabSwitch(newUrl, sessionId, token) {
  console.log("Switched to:", newUrl);

  chrome.storage.session.get("lastUrl", (sessionData) => {
    const lastUrl = sessionData.lastUrl || null;

    if (lastUrl === null) {
      chrome.storage.session.set({ lastUrl: newUrl });
      return;
    }

    const wasExamTab = lastUrl.includes("localhost:5173");
    const isExamTab = newUrl.includes("localhost:5173");

    if (wasExamTab && !isExamTab) {
      console.log("🚨 User left exam tab!");
      sendViolation(sessionId, token);
    }

    chrome.storage.session.set({ lastUrl: newUrl });
  });
}

function sendViolation(sessionId, token) {
  fetch("http://localhost:8080/api/violation/log", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      sessionId,
      type: "tab_switch",
      severity: 5,
    }),
  })
    .then((res) => res.json())
    .then((res) => console.log("Violation sent:", res))
    .catch((err) => console.error("Violation fetch error:", err));
}