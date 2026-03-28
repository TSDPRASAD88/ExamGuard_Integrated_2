import { useEffect, useRef } from "react";
import { logViolation } from "../api/violation";

const useProctoring = (sessionId, token, setViolationScore, isActive) => {
  const activeRef = useRef(isActive);

  // ✅ Keep latest isActive in ref so event handlers always see current value
  useEffect(() => {
    activeRef.current = isActive;
  }, [isActive]);

  useEffect(() => {
    if (!sessionId || !token || !isActive) return;

    // ✅ FIX: debounce flag — prevents blur + visibilitychange both firing on same tab switch
    // When user switches tab: visibilitychange fires first (+3), then blur fires.
    // Without this flag both would fire, charging +5 for a single tab switch.
    const tabSwitchRef = { current: false };

    const increaseViolation = (points) => {
      if (!activeRef.current) return;
      setViolationScore((prev) => prev + points);
    };

    // TAB SWITCH (HIGH SEVERITY)
    const handleVisibility = () => {
      if (!activeRef.current) return;

      if (document.hidden) {
        // ✅ Set flag so handleBlur knows this was a tab switch, not a standalone blur
        tabSwitchRef.current = true;
        setTimeout(() => { tabSwitchRef.current = false; }, 500);

        alert("⚠️ Tab switching detected!");
        increaseViolation(3);

        logViolation(
          { sessionId, type: "tab_switch", severity: 3 },
          token
        );
      }
    };

    // WINDOW BLUR (MEDIUM) — only fires if NOT caused by a tab switch
    const handleBlur = () => {
      if (!activeRef.current) return;

      // ✅ Skip if this blur was triggered by a tab switch (already logged above)
      if (tabSwitchRef.current) return;

      increaseViolation(2);

      logViolation(
        { sessionId, type: "window_blur", severity: 2 },
        token
      );
    };

    // COPY (MEDIUM)
    const handleCopy = () => {
      if (!activeRef.current) return;

      increaseViolation(2);

      logViolation(
        { sessionId, type: "copy_paste", severity: 2 },
        token
      );
    };

    // ✅ Attach listeners only when active
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("copy", handleCopy);

    // ✅ Cleanup on unmount or when session/active state changes
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("copy", handleCopy);
    };
  }, [sessionId, token, isActive, setViolationScore]);
};

export default useProctoring;