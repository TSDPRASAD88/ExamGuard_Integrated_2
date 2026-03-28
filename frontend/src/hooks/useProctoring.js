import { useEffect, useRef } from "react";
import { logViolation } from "../api/violation";

// ✅ Cross-browser fullscreen enter
export const enterFullscreen = () => {
  const el = document.documentElement;
  if (el.requestFullscreen) return el.requestFullscreen();
  if (el.webkitRequestFullscreen) return el.webkitRequestFullscreen();
  if (el.mozRequestFullScreen) return el.mozRequestFullScreen();
  if (el.msRequestFullscreen) return el.msRequestFullscreen();
};

// ✅ Check if currently fullscreen
export const isFullscreen = () =>
  !!(
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement
  );

const useProctoring = (sessionId, token, setViolationScore, isActive, setFullscreenWarning) => {
  const activeRef = useRef(isActive);

  useEffect(() => {
    activeRef.current = isActive;
  }, [isActive]);

  useEffect(() => {
    if (!sessionId || !token || !isActive) return;

    const tabSwitchRef = { current: false };
    const fullscreenExitRef = { current: false };

    const increaseViolation = (points) => {
      if (!activeRef.current) return;
      setViolationScore((prev) => prev + points);
    };

    // ─── TAB SWITCH (severity 3) ────────────────────────────────────────────
    const handleVisibility = () => {
      if (!activeRef.current) return;
      if (document.hidden) {
        tabSwitchRef.current = true;
        setTimeout(() => { tabSwitchRef.current = false; }, 500);

        alert("⚠️ Tab switching detected!");
        increaseViolation(3);
        logViolation({ sessionId, type: "tab_switch", severity: 3 }, token);
      }
    };

    // ─── WINDOW BLUR (severity 2) ────────────────────────────────────────────
    const handleBlur = () => {
      if (!activeRef.current) return;
      if (tabSwitchRef.current) return;
      if (fullscreenExitRef.current) return;

      increaseViolation(2);
      logViolation({ sessionId, type: "window_blur", severity: 2 }, token);
    };

    // ─── COPY (severity 2) ───────────────────────────────────────────────────
    const handleCopy = () => {
      if (!activeRef.current) return;
      increaseViolation(2);
      logViolation({ sessionId, type: "copy_paste", severity: 2 }, token);
    };

    // ─── FULLSCREEN EXIT (severity 3) ────────────────────────────────────────
    const handleFullscreenChange = () => {
      if (!activeRef.current) return;

      if (!isFullscreen()) {
        // Set debounce flag so blur doesn't double-count
        fullscreenExitRef.current = true;
        setTimeout(() => { fullscreenExitRef.current = false; }, 500);

        increaseViolation(3);
        logViolation({ sessionId, type: "fullscreen_exit", severity: 3 }, token);

        // ✅ Show warning banner in UI — user must click button to return
        // We cannot call requestFullscreen() here (not a user gesture)
        setFullscreenWarning(true);
      } else {
        // User returned to fullscreen — hide the warning
        setFullscreenWarning(false);
      }
    };

    // ─── Attach listeners ────────────────────────────────────────────────────
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
    };
  }, [sessionId, token, isActive, setViolationScore, setFullscreenWarning]);
};

export default useProctoring;