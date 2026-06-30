"use client";

import AnalysisResultCard from "@/components/AnalysisResultCard";
import CopyButton from "@/components/CopyButton";
import { toneOptions } from "@/data/mailOptions";
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
  { id: "clearer", label: "더 명확하게" },
  { id: "softer", label: "더 부드럽게" },
  { id: "firmer", label: "더 단호하게" },
  { id: "translate_to_english", label: "영어로 바꾸기" },
  { id: "translate_to_korean", label: "한국어로 바꾸기" },
  { id: "regenerate", label: "다시 생성" },
];

const urgencyLabels = {
  low: "낮음",
  medium: "보통",
  high: "높음",
};

function toneLabel(tone: string) {
  return toneOptions.find((option) => option.id === tone)?.label ?? tone;
}

function formatResultForCopy(result: GeneratedMailResult) {
  const analysisResult = result.analysisResult
    ? [
        "",
        "AI 분석형 결과",
        `요약: ${result.analysisResult.summary}`,
        `총점: ${result.analysisResult.totalScore}`,
        `신뢰도: ${result.analysisResult.confidenceLevel}`,
        "",
        "핵심 인사이트",
        ...result.analysisResult.keyInsights.map((point) => `- ${point}`),
        "",
        "우선 액션",
        ...result.analysisResult.priorityActions.map(
          (action) => `- [${action.priority}] ${action.action}: ${action.reason}`,
        ),
        "",
        "바로 활용 가능한 문장",
        ...result.analysisResult.generatedCopy.map((copy) => `- ${copy}`),
        "",
        `주의: ${result.analysisResult.caution}`,
      ]
    : [];

  return [
    "입력 내용 분석 결과",
    `목적: ${result.analysis.detectedPurpose}`,
    `추천 폼: ${result.appliedTemplateLabel}`,
    `추천 톤: ${toneLabel(result.analysis.recommendedTone)}`,
    "",
    "추천 제목",
    ...result.subjects.map((subject, index) => `${index + 1}. ${subject}`),
    "",
    "완성된 비즈니스 메일",
    result.body,
    "",
    "개선 포인트",
    ...result.improvements.map((point, index) => `${index + 1}. ${point}`),
    "",
    "누락 정보",
    ...result.missingInfoNotice.map((point, index) => `${index + 1}. ${point}`),
    ...analysisResult,
  ].join("\n");
}

function AnalysisItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export default function MailResult({
  result,
  isGenerating,
  message = "",
  onRefine,
}: MailResultProps) {
  const copyText = result ? formatResultForCopy(result) : "";
  const confidence = result
    ? Math.round(result.analysis.confidenceScore * 100)
    : 0;

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">작성 결과</h2>
          <p className="mt-1 text-sm text-slate-500">
            분석 결과와 완성된 메일을 확인하세요.
          </p>
        </div>
        <CopyButton text={copyText} />
      </div>

      {message ? (
        <div className="mb-6 rounded-md border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {message}
        </div>
      ) : null}

      {isGenerating ? (
        <div className="grid gap-4">
          <div className="rounded-md border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-800">
            초안을 분석하고 적합한 비즈니스 메일 폼으로 재작성하고 있습니다.
          </div>
          <div className="h-28 animate-pulse rounded-md bg-slate-100" />
          <div className="h-24 animate-pulse rounded-md bg-slate-100" />
          <div className="h-72 animate-pulse rounded-md bg-slate-100" />
          <div className="h-24 animate-pulse rounded-md bg-slate-100" />
        </div>
      ) : result ? (
        <div className="grid gap-6">
          <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-slate-800">
                입력 내용 분석 결과
              </h3>
              <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-800">
                신뢰도 {confidence}%
              </span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <AnalysisItem
                label="감지된 목적"
                value={result.analysis.detectedPurpose}
              />
              <AnalysisItem
                label="추천된 메일 폼"
                value={result.appliedTemplateLabel}
              />
              <AnalysisItem
                label="추천 톤"
                value={toneLabel(result.analysis.recommendedTone)}
              />
              <AnalysisItem
                label="긴급도"
                value={urgencyLabels[result.analysis.detectedUrgency]}
              />
              <AnalysisItem
                label="받는 사람 유형"
                value={result.analysis.detectedRecipientType}
              />
              <AnalysisItem
                label="감지 언어"
                value={result.analysis.detectedLanguage}
              />
            </div>
          </div>

          <AnalysisResultCard result={result.analysisResult} />

          <div>
            <h3 className="text-sm font-semibold text-slate-700">
              추천 제목 3개
            </h3>
            <ul className="mt-3 grid gap-2">
              {result.subjects.map((subject) => (
                <li
                  key={subject}
                  className="flex flex-col gap-2 rounded-md border border-blue-100 bg-blue-50 px-3 py-3 text-sm font-medium text-blue-900 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span>{subject}</span>
                  <CopyButton text={subject} className="px-2.5 py-1.5" />
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-slate-700">
                완성된 비즈니스 메일
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

          <div>
            <h3 className="text-sm font-semibold text-slate-700">누락 정보 안내</h3>
            <ul className="mt-3 grid gap-2">
              {result.missingInfoNotice.map((point) => (
                <li
                  key={point}
                  className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-700"
                >
                  {point}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-700">다시 쓰기 옵션</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {refinementActions.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => onRefine(action.id)}
                  disabled={isGenerating}
                  className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex min-h-96 items-center justify-center rounded-md border border-dashed border-slate-200 bg-slate-50 px-6 text-center">
          <div>
            <p className="text-sm font-medium text-slate-700">
              아직 작성된 메일이 없습니다.
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              왼쪽에 말하듯 초안을 입력하면 자동으로 폼을 추천하고 완성된
              비즈니스 메일을 작성합니다.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
