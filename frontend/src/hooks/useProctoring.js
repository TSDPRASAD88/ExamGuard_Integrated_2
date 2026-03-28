import { useEffect, useRef } from "react";
import { logViolation } from "../api/violation";

const useProctoring = (sessionId, token, setViolationScore, isActive) => {
  const activeRef = useRef(isActive);

  // 🔹 keep latest active state
  useEffect(() => {
    activeRef.current = isActive;
  }, [isActive]);

  useEffect(() => {
    if (!sessionId || !token || !isActive) return;

    // 🔥 increase score instead of count
    const increaseViolation = (points) => {
      if (!activeRef.current) return;
      setViolationScore((prev) => prev + points);
    };

    // TAB SWITCH (HIGH SEVERITY)
    const handleVisibility = () => {
      if (!activeRef.current) return;

      if (document.hidden) {
        alert("⚠️ Tab switching detected!");

        increaseViolation(3);

        logViolation(
          {
            sessionId,
            type: "tab_switch",
            severity: 3,
          },
          token
        );
      }
    };

    // WINDOW BLUR (MEDIUM)
    const handleBlur = () => {
      if (!activeRef.current) return;

      increaseViolation(2);

      logViolation(
        {
          sessionId,
          type: "window_blur",
          severity: 2,
        },
        token
      );
    };

    // COPY (MEDIUM)
    const handleCopy = () => {
      if (!activeRef.current) return;

      increaseViolation(2);

      logViolation(
        {
          sessionId,
          type: "copy_paste",
          severity: 2,
        },
        token
      );
    };

    // ✅ attach listeners ONLY when active
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("copy", handleCopy);

    // ✅ cleanup
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("copy", handleCopy);
    };
  }, [sessionId, token, isActive, setViolationScore]);
};

export default useProctoring;