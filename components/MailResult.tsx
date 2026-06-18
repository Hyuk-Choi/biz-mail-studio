"use client";

import CopyButton from "@/components/CopyButton";
import type { GeneratedMailResult, MailRefinementAction } from "@/types/mail";

interface MailResultProps {
  result: GeneratedMailResult | null;
  isGenerating: boolean;
  message?: string;
  onRefine: (action: MailRefinementAction) => void;
}

const refinementActions: Array<{
  id: MailRefinementAction;
  label: string;
}> = [
  { id: "more_polite", label: "더 정중하게" },
  { id: "shorter", label: "더 짧게" },
  { id: "more_persuasive", label: "더 설득력 있게" },
  { id: "translate_to_english", label: "영어로 변환" },
  { id: "translate_to_korean", label: "한국어로 변환" },
  { id: "regenerate", label: "다시 생성" },
];

function formatResultForCopy(result: GeneratedMailResult) {
  return [
    "추천 제목",
    ...result.subjects.map((subject, index) => `${index + 1}. ${subject}`),
    "",
    "최종 메일 본문",
    result.body,
    "",
    "개선 포인트",
    ...result.improvements.map((point, index) => `${index + 1}. ${point}`),
  ].join("\n");
}

export default function MailResult({
  result,
  isGenerating,
  message = "",
  onRefine,
}: MailResultProps) {
  const copyText = result ? formatResultForCopy(result) : "";

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">작성 결과</h2>
          <p className="mt-1 text-sm text-slate-500">
            추천 제목, 최종 본문, 개선 포인트를 확인하세요.
          </p>
        </div>
        <CopyButton text={copyText} />
      </div>

      {result ? (
        <div className="mb-6 flex flex-wrap gap-2">
          {refinementActions.map((action) => (
            <button
              key={action.id}
              type="button"
              onClick={() => onRefine(action.id)}
              disabled={isGenerating}
              className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : null}

      {message ? (
        <div className="mb-6 rounded-md border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {message}
        </div>
      ) : null}

      {isGenerating ? (
        <div className="grid gap-4">
          <div className="rounded-md border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-800">
            선택한 케이스와 톤에 맞춰 메일을 정리하고 있습니다.
          </div>
          <div className="h-20 animate-pulse rounded-md bg-slate-100" />
          <div className="h-64 animate-pulse rounded-md bg-slate-100" />
          <div className="h-24 animate-pulse rounded-md bg-slate-100" />
        </div>
      ) : result ? (
        <div className="grid gap-6">
          <div>
            <h3 className="text-sm font-semibold text-slate-700">추천 제목</h3>
            <ul className="mt-3 grid gap-2">
              {result.subjects.map((subject) => (
                <li
                  key={subject}
                  className="rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-900"
                >
                  {subject}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-slate-700">
                최종 메일 본문
              </h3>
              <CopyButton text={result.body} className="px-2.5 py-1.5" />
            </div>
            <div className="min-h-72 whitespace-pre-wrap rounded-md border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-800">
              {result.body}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-700">개선 포인트</h3>
            <ul className="mt-3 grid gap-2">
              {result.improvements.map((point) => (
                <li
                  key={point}
                  className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm leading-6 text-slate-700"
                >
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="flex min-h-96 items-center justify-center rounded-md border border-dashed border-slate-200 bg-slate-50 px-6 text-center">
          <div>
            <p className="text-sm font-medium text-slate-700">
              아직 작성된 메일이 없습니다.
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              왼쪽 입력 영역에 목적이나 초안을 입력한 뒤 메일을 작성해보세요.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
