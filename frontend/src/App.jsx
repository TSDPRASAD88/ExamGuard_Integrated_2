import { useState, useEffect, useCallback } from "react"; // ✅ added useCallback
import useProctoring from "./hooks/useProctoring";

function App() {
  const [started, setStarted] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [violationScore, setViolationScore] = useState(0);

  const getToken = () => localStorage.getItem("token");

  // 🔹 Restore session OR clean stale data
  useEffect(() => {
    const savedSession = localStorage.getItem("sessionId");
    const token = getToken();

    if (savedSession && token) {
      setSessionId(savedSession);
      setStarted(true);

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
        setStarted(true);

        if (window.chrome && chrome.storage) {
          chrome.storage.local.set({ token, sessionId: newSessionId });
        }
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Start Session Error:", error);
    }
  };

  // 🔹 END SESSION
  // ✅ FIX: useCallback ensures the auto-terminate useEffect always
  // calls endSession with the latest sessionId, not a stale closure.
  const endSession = useCallback(async () => {
    const token = getToken();

    if (!sessionId || !token) return;

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
  }, [sessionId]); // ✅ recreates only when sessionId changes

  // 🔹 PROCTORING
  const token = getToken();
  useProctoring(sessionId, token, setViolationScore, started);

  // 🔥 AUTO TERMINATE
  // ✅ FIX: endSession replaces sessionId in deps — it already captures sessionId inside
  useEffect(() => {
    if (violationScore >= 10 && started) {
      alert("❌ Exam terminated due to cheating!");

      endSession();

      setStarted(false);
      setSessionId(null);
      setViolationScore(0);
      localStorage.removeItem("sessionId");
    }
  }, [violationScore, started, endSession]); // ✅ was [violationScore, started, sessionId]

  return (
    <div style={{ padding: "20px" }}>
      {!started ? (
        <>
          <h1>Start Exam</h1>
          <button onClick={startSession}>Start Exam</button>
        </>
      ) : (
        <>
          <h1>Exam in Progress</h1>
          <p>Do not switch tabs 😐</p>
          <p style={{ color: "red", fontWeight: "bold" }}>
            Score: {violationScore} / 10
          </p>
        </>
      )}
    </div>
  );
}

export default App;
