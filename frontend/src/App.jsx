import { useState, useEffect, useCallback } from "react";
import useProctoring, { enterFullscreen, isFullscreen } from "./hooks/useProctoring";

function App() {
  const [started, setStarted] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [violationScore, setViolationScore] = useState(0);
  const [fullscreenWarning, setFullscreenWarning] = useState(false); // ✅ NEW

  const getToken = () => localStorage.getItem("token");

  // 🔹 Restore session on page reload
  useEffect(() => {
    const savedSession = localStorage.getItem("sessionId");
    const token = getToken();

    if (savedSession && token) {
      setSessionId(savedSession);
      setStarted(true);
      enterFullscreen().catch(() => {});

      if (window.chrome && chrome.storage) {
        chrome.storage.local.set({ token, sessionId: savedSession });
      }
    } else {
      if (window.chrome && chrome.storage) {
        chrome.storage.local.remove(["sessionId", "token"], () => {
          console.log("🛑 Cleaned stale extension data on load");
        });
      }
    }
  }, []);

  // 🔹 START SESSION
  const startSession = async () => {
    const token = getToken();

    if (!token) {
      alert("❌ No token found. Login again.");
      return;
    }

    // ✅ Enter fullscreen first — must be triggered by user click (browser rule)
    try {
      await enterFullscreen();
    } catch (err) {
      alert("❌ Fullscreen is required to start the exam. Please allow fullscreen.");
      return;
    }

    try {
      const res = await fetch("http://localhost:8080/api/session/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ examId: "exam123" }),
      });

      const data = await res.json();

      if (data.success) {
        const newSessionId = data.session._id;

        setSessionId(newSessionId);
        localStorage.setItem("sessionId", newSessionId);
        setViolationScore(0);
        setFullscreenWarning(false);
        setStarted(true);

        if (window.chrome && chrome.storage) {
          chrome.storage.local.set({ token, sessionId: newSessionId });
        }
      } else {
        alert(data.message);
        if (document.exitFullscreen) document.exitFullscreen();
      }
    } catch (error) {
      console.error("Start Session Error:", error);
      if (document.exitFullscreen) document.exitFullscreen();
    }
  };

  // 🔹 END SESSION
  const endSession = useCallback(async () => {
    const token = getToken();
    if (!sessionId || !token) return;

    // Exit fullscreen cleanly when exam ends
    if (isFullscreen() && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }

    try {
      await fetch("http://localhost:8080/api/session/end", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ sessionId }),
      });
    } catch (err) {
      console.error("End Session Error:", err);
    }

    if (window.chrome && chrome.storage) {
      chrome.storage.local.remove(["sessionId", "token"], () => {
        console.log("🛑 Extension storage cleared");
      });
    }
  }, [sessionId]);

  // ✅ Handler for the "Return to Fullscreen" button
  // This IS a user gesture so requestFullscreen works here
  const handleReturnFullscreen = async () => {
    try {
      await enterFullscreen();
      setFullscreenWarning(false);
    } catch (err) {
      alert("❌ Could not enter fullscreen. Please click the button again.");
    }
  };

  // 🔹 PROCTORING HOOK
  const token = getToken();
  useProctoring(sessionId, token, setViolationScore, started, setFullscreenWarning);

  // 🔥 AUTO TERMINATE
  useEffect(() => {
    if (violationScore >= 10 && started) {
      alert("❌ Exam terminated due to cheating!");
      endSession();
      setStarted(false);
      setSessionId(null);
      setViolationScore(0);
      setFullscreenWarning(false);
      localStorage.removeItem("sessionId");
    }
  }, [violationScore, started, endSession]);

  return (
    <div style={{ padding: "20px" }}>

      {/* ✅ FULLSCREEN WARNING BANNER */}
      {fullscreenWarning && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0,
          background: "#ff4444",
          color: "white",
          padding: "16px",
          textAlign: "center",
          zIndex: 9999,
          fontSize: "16px",
          fontWeight: "bold",
        }}>
          ⚠️ You exited fullscreen! Return immediately or your exam will be terminated.
          <button
            onClick={handleReturnFullscreen}
            style={{
              marginLeft: "16px",
              padding: "8px 16px",
              background: "white",
              color: "#ff4444",
              border: "none",
              borderRadius: "6px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Return to Fullscreen
          </button>
        </div>
      )}

      {!started ? (
        <>
          <h1>Start Exam</h1>
          <p style={{ color: "#888", fontSize: "14px" }}>
            📌 Fullscreen is required. Your activity will be monitored.
          </p>
          <button onClick={startSession}>Start Exam</button>
        </>
      ) : (
        <>
          <h1>Exam in Progress</h1>
          <p>Do not switch tabs or exit fullscreen 😐</p>
          <p style={{ color: "red", fontWeight: "bold" }}>
            Score: {violationScore} / 10
          </p>
        </>
      )}
    </div>
  );
}

export default App;
