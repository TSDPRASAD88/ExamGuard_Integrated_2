// ✅ FIX 1: lastUrl stored in chrome.storage.session so it survives service worker restarts
// ✅ FIX 2: violation type changed from "tab_switch_extension" → "tab_switch" to match Mongoose enum

chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.storage.local.get(["sessionId", "token"], (localData) => {
    const { sessionId, token } = localData;

    // 🔥 HARD STOP: no session = no tracking
    if (!sessionId || !token) {
      console.log("🛑 No active session → skipping detection");
      chrome.storage.session.remove("lastUrl");
      return;
    }

    chrome.tabs.get(activeInfo.tabId, (tab) => {
      if (!tab || !tab.url) return;

      console.log("Switched to:", tab.url);

      const isExamTab = tab.url.includes("localhost:5173");

      // ✅ Read lastUrl from session storage (survives SW restart)
      chrome.storage.session.get("lastUrl", (sessionData) => {
        const lastUrl = sessionData.lastUrl || null;

        // First time setup — just save current URL, don't log anything
        if (lastUrl === null) {
          chrome.storage.session.set({ lastUrl: tab.url });
          return;
        }

        const wasExamTab = lastUrl.includes("localhost:5173");

        // 🚨 Detect leaving exam tab
        if (wasExamTab && !isExamTab) {
          console.log("🚨 User left exam tab!");

          fetch("http://localhost:8080/api/violation/log", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              sessionId,
              type: "tab_switch",   // ✅ FIXED: was "tab_switch_extension" — not in enum
              severity: 5,
            }),
          })
            .then((res) => res.json())
            .then((res) => console.log("Violation sent:", res))
            .catch((err) => console.error("Violation fetch error:", err));
        }

        // ✅ Always update lastUrl in session storage
        chrome.storage.session.set({ lastUrl: tab.url });
      });
    });
  });
});