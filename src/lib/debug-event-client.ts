export function reportDebugEvent(event: Record<string, unknown>) {
  if (typeof window === "undefined") {
    return;
  }

  const endpoint = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/api/debug/events`;
  const payload = JSON.stringify(event);

  try {
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([payload], { type: "application/json" });
      if (navigator.sendBeacon(endpoint, blob)) {
        return;
      }
    }
  } catch {
    // Fall through to fetch when sendBeacon is unavailable or fails.
  }

  try {
    void fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {
      // best effort only
    });
  } catch {
    // best effort only
  }
}
