import { useState, useEffect } from "react";
import useProctoring from "./hooks/useProctoring";

function App() {
  const [started, setStarted] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [violationScore, setViolationScore] = useState(0);

  const token = localStorage.getItem("token");

  // 🔹 Restore session on refresh
  useEffect(() => {
    const savedSession = localStorage.getItem("sessionId");
    if (savedSession) {
      setSessionId(savedSession);
      setStarted(true);
    }
  }, []);

  // 🔹 START SESSION
  const startSession = async () => {
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
        setSessionId(data.session._id);
        localStorage.setItem("sessionId", data.session._id);
        setViolationScore(0);
        setStarted(true);
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // 🔹 END SESSION
  const endSession = async () => {
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
      console.error(err);
    }
  };

  // 🔹 PROCTORING (controlled)
  useProctoring(sessionId, token, setViolationScore, started);

  // 🔥 AUTO TERMINATE BASED ON SCORE
  useEffect(() => {
    if (violationScore >= 10 && started) {
      alert("❌ Exam terminated due to cheating!");

      endSession();

      // HARD RESET
      setStarted(false);
      setSessionId(null);
      setViolationScore(0);

      localStorage.removeItem("sessionId");
    }
  }, [violationScore, started]);

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