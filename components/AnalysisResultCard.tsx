"use client";

import ActionPlan from "@/components/ActionPlan";
import CopyButton from "@/components/CopyButton";
import InsightList from "@/components/InsightList";
import ScoreBreakdown from "@/components/ScoreBreakdown";
import type { AnalysisResult } from "@/types/analysis";

interface AnalysisResultCardProps {
  result?: AnalysisResult;
}

function formatAnalysisForCopy(result: AnalysisResult) {
  return [
    "AI 분석형 결과",
    `요약: ${result.summary}`,
    `총점: ${result.totalScore}`,
    `신뢰도: ${result.confidenceLevel}`,
    "",
    "점수",
    ...result.scoreBreakdown.map(
      (score) => `- ${score.label}: ${score.score}점 (${score.reason})`,
    ),
    "",
    "핵심 인사이트",
    ...result.keyInsights.map((item) => `- ${item}`),
    "",
    "문제 가능성",
    ...result.problems.map((item) => `- ${item}`),
    "",
    "추천 보완",
    ...result.recommendations.map((item) => `- ${item}`),
    "",
    "우선 액션",
    ...result.priorityActions.map(
      (item) => `- [${item.priority}] ${item.action}: ${item.reason}`,
    ),
    "",
    "활용 가능한 문장",
    ...result.generatedCopy.map((item) => `- ${item}`),
    "",
    "다음 테스트 아이디어",
    ...result.nextTestIdeas.map((item) => `- ${item}`),
    "",
    `주의: ${result.caution}`,
  ].join("\n");
}

function scoreTone(score: number) {
  if (score >= 82) {
    return "text-blue-700";
  }

  if (score >= 68) {
    return "text-sky-600";
  }

  return "text-amber-600";
}

export default function AnalysisResultCard({ result }: AnalysisResultCardProps) {
  if (!result) {
    return null;
  }

  const copyText = formatAnalysisForCopy(result);

  const handleExport = () => {
    const blob = new Blob([copyText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "bizmail-analysis-result.txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="rounded-md border border-blue-100 bg-blue-50/60 p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
            mock 데이터 기반 분석 결과
          </p>
          <h3 className="mt-1 text-base font-semibold text-slate-950">
            AI 분석형 결과
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-700">{result.summary}</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <CopyButton text={copyText} className="px-2.5 py-1.5" />
          <button
            type="button"
            onClick={handleExport}
            className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
          >
            TXT 저장
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-md border border-slate-200 bg-white p-3">
          <p className="text-xs font-medium text-slate-500">총점</p>
          <p className={`mt-1 text-3xl font-bold ${scoreTone(result.totalScore)}`}>
            {result.totalScore}
          </p>
        </div>
        <div className="rounded-md border border-slate-200 bg-white p-3">
          <p className="text-xs font-medium text-slate-500">신뢰도</p>
          <p className="mt-2 inline-flex rounded-full bg-blue-100 px-3 py-1 text-sm font-bold text-blue-800">
            {result.confidenceLevel}
          </p>
        </div>
        <div className="rounded-md border border-slate-200 bg-white p-3">
          <p className="text-xs font-medium text-slate-500">입력 완성도</p>
          <p className={`mt-1 text-3xl font-bold ${scoreTone(result.inputCompleteness.score)}`}>
            {result.inputCompleteness.score}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        {result.detectedSignals.map((signal) => (
          <div
            key={`${signal.label}-${signal.value}`}
            className="rounded-md border border-slate-200 bg-white px-3 py-2"
          >
            <p className="text-xs font-medium text-slate-500">{signal.label}</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {signal.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-5">
        <section>
          <h4 className="text-sm font-semibold text-slate-800">점수 상세</h4>
          <div className="mt-3">
            <ScoreBreakdown items={result.scoreBreakdown} />
          </div>
        </section>

        <InsightList title="판단 근거" items={result.reasoningSummary} tone="blue" />
        <InsightList title="핵심 인사이트" items={result.keyInsights} tone="green" />
        <InsightList title="문제 가능성" items={result.problems} tone="amber" />
        <InsightList title="추천 보완" items={result.recommendations} tone="slate" />
        <ActionPlan actions={result.priorityActions} />

        <section>
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-sm font-semibold text-slate-800">
              바로 활용 가능한 문장
            </h4>
          </div>
          <ul className="mt-3 grid gap-2">
            {result.generatedCopy.map((copy) => (
              <li
                key={copy}
                className="flex flex-col gap-2 rounded-md border border-slate-200 bg-white px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="text-sm leading-6 text-slate-700">{copy}</span>
                <CopyButton text={copy} className="px-2.5 py-1.5" />
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h4 className="text-sm font-semibold text-slate-800">
            내부 시뮬레이션 기준
          </h4>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {result.benchmarkRanges.map((benchmark) => (
              <div
                key={`${benchmark.label}-${benchmark.range}`}
                className="rounded-md border border-slate-200 bg-white p-3"
              >
                <p className="text-sm font-semibold text-slate-950">
                  {benchmark.label}
                </p>
                <p className="mt-1 text-lg font-bold text-blue-700">
                  {benchmark.range}
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {benchmark.note}
                </p>
              </div>
            ))}
          </div>
        </section>

        <InsightList
          title="다음 테스트 아이디어"
          items={result.nextTestIdeas}
          tone="blue"
        />

        {result.inputCompleteness.followUpQuestions.length ? (
          <InsightList
            title="보완 질문"
            items={result.inputCompleteness.followUpQuestions}
            tone="slate"
          />
        ) : null}

        <div className="rounded-md border border-slate-200 bg-white px-3 py-3 text-sm leading-6 text-slate-600">
          {result.caution}
        </div>
      </div>
    </section>
  );
}
