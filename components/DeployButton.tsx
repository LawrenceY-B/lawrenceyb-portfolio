"use client";

import { useEffect, useRef, useState } from "react";

export function DeployButton() {
  const [label, setLabel] = useState("Deploy");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const deploy = () => {
    if (label !== "Deploy") return;
    setLabel("Building…");
    timers.current = [
      setTimeout(() => setLabel("✓ Deployed · 200 OK"), 900),
      setTimeout(() => setLabel("Deploy"), 3200),
    ];
  };

  return (
    <button type="button" className="gbtn hot" id="deploy" data-cursor="Ship it" onClick={deploy}>
      <span aria-hidden="true">⚡</span>
      <span aria-live="polite">{label}</span>
    </button>
  );
}
