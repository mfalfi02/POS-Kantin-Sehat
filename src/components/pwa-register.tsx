"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    const isSecureContext = window.location.protocol === "https:" || window.location.hostname === "localhost";

    if (!("serviceWorker" in navigator) || !isSecureContext) {
      return;
    }

    void navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .catch(() => {
        // PWA enhancements are optional; the app remains usable if registration fails.
      });
  }, []);

  return null;
}
