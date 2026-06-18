"use client";

import { languageOptions, mailCases, toneOptions } from "@/data/mailOptions";
import type { MailFormInput } from "@/types/mail";

interface MailFormProps {
  value: MailFormInput;
  isGenerating: boolean;
  message?: string;
  onChange: (value: MailFormInput) => void;
  onSubmit: () => void;
}

export default function MailForm({
  value,
  isGenerating,
  message = "",
  onChange,
  onSubmit,
}: MailFormProps) {
  const updateField = <K extends keyof MailFormInput>(
    field: K,
    fieldValue: MailFormInput[K],
  ) => {
    onChange({
      ...value,
      [field]: fieldValue,
    });
  };

  const hasInput = Boolean(
    value.purpose.trim() || value.keyPoints.trim() || value.draft.trim(),
  );
  const guidanceMessage =
    message || "메일 목적, 반드시 포함할 내용, 초안 중 하나 이상 입력해주세요.";

  return (
    <form
      className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-950">메일 정보 입력</h2>
        <p className="mt-1 text-sm text-slate-500">
          핵심 내용만 적어도 전문적인 메일 형식으로 정리합니다.
        </p>
      </div>

      <div className="grid gap-5">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">메일 케이스</span>
          <select
            value={value.mailCase}
            onChange={(event) =>
              updateField("mailCase", event.target.value as MailFormInput["mailCase"])
            }
            className="h-11 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          >
            {mailCases.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">언어</span>
            <select
              value={value.language}
              onChange={(event) =>
                updateField(
                  "language",
                  event.target.value as MailFormInput["language"],
                )
              }
              className="h-11 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              {languageOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">톤</span>
            <select
              value={value.tone}
              onChange={(event) =>
                updateField("tone", event.target.value as MailFormInput["tone"])
              }
              className="h-11 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              {toneOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">받는 사람</span>
          <input
            value={value.recipient}
            onChange={(event) => updateField("recipient", event.target.value)}
            placeholder="예: 김지훈 팀장님, ABC Trading 담당자"
            className="h-11 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">메일 목적</span>
          <input
            value={value.purpose}
            onChange={(event) => updateField("purpose", event.target.value)}
            placeholder="예: 다음 주 캠페인 일정 조율 요청"
            className="h-11 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">
            반드시 포함할 내용
          </span>
          <textarea
            value={value.keyPoints}
            onChange={(event) => updateField("keyPoints", event.target.value)}
            placeholder="예: 가능한 일정 2개, 회신 기한, 첨부 자료 확인 요청"
            rows={4}
            className="resize-y rounded-md border border-slate-200 bg-white px-3 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">
            사용자가 작성한 초안
          </span>
          <textarea
            value={value.draft}
            onChange={(event) => updateField("draft", event.target.value)}
            placeholder="투박하게 작성한 메일 초안이나 핵심 문장을 붙여넣으세요."
            rows={6}
            className="resize-y rounded-md border border-slate-200 bg-white px-3 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">추가 요청사항</span>
          <textarea
            value={value.additionalRequests}
            onChange={(event) =>
              updateField("additionalRequests", event.target.value)
            }
            placeholder="예: 너무 딱딱하지 않게, 해외 거래처가 이해하기 쉽게"
            rows={3}
            className="resize-y rounded-md border border-slate-200 bg-white px-3 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={isGenerating || !hasInput}
        className="mt-6 flex h-12 w-full items-center justify-center rounded-md bg-blue-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {isGenerating ? "작성 중..." : "메일 작성하기"}
      </button>

      {!hasInput || message ? (
        <p className="mt-3 rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-800">
          {guidanceMessage}
        </p>
      ) : null}
    </form>
  );
}
