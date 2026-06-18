"use client";

import { useState } from "react";

interface CopyButtonProps {
  text: string;
  className?: string;
}

export default function CopyButton({ text, className = "" }: CopyButtonProps) {
  const [feedback, setFeedback] = useState<"idle" | "copied" | "error">("idle");

  const handleCopy = async () => {
    if (!text.trim()) {
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setFeedback("copied");
    } catch {
      setFeedback("error");
    }

    window.setTimeout(() => {
      setFeedback("idle");
    }, 1400);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleCopy}
        disabled={!text.trim()}
        className={`rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      >
        {feedback === "copied"
          ? "복사 완료"
          : feedback === "error"
            ? "복사 실패"
            : "복사"}
      </button>

      {feedback !== "idle" ? (
        <div
          aria-live="polite"
          className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-soft"
        >
          {feedback === "copied"
            ? "클립보드에 복사했습니다."
            : "복사 권한을 확인해주세요."}
        </div>
      ) : null}
    </>
  );
}
