"use client";

import { useEffect, useRef, useState } from "react";

export function MailCopy({ email }: { email: string }) {
  const [status, setStatus] = useState("");
  const text = useRef<HTMLSpanElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const done = (ok: boolean) => {
    setStatus(ok ? "200 OK · copied" : "select and copy ↑");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setStatus(""), 2400);
  };
  const select = () => {
    if (!text.current) return;
    const range = document.createRange();
    range.selectNodeContents(text.current);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      done(true);
    } catch {
      select();
      done(false);
    }
  };

  return (
    <button
      type="button"
      className="mail"
      data-cursor="Copy"
      onClick={() => void copy()}
      aria-describedby="mailStatus"
    >
      <span ref={text}>{email}</span>
      <span className="status" id="mailStatus" role="status">
        {status}
      </span>
    </button>
  );
}
