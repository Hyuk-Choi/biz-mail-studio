import { getBenchmarksForTemplate } from "@/data/benchmarkData";
import {
  allKnowledgeItems,
  caseStrategyMap,
  type KnowledgeItem,
} from "@/data/mockKnowledgeBase";
import type {
  AnalysisScoreKey,
  AnalysisScores,
  ConfidenceLevel,
  DetectedSignal,
  InputCompleteness,
  ScoreBreakdown,
} from "@/types/analysis";
import type {
  DraftAnalysis,
  GenerateEmailOptions,
  MailFormInput,
  MailTemplateId,
} from "@/types/mail";
import { clampScore } from "@/lib/textVariation";

const scoreWeights: Record<AnalysisScoreKey, number> = {
  marketFit: 0.17,
  targetFit: 0.16,
  messageClarity: 0.22,
  conversionPotential: 0.18,
  budgetEfficiency: 0.13,
  executionDifficulty: 0.14,
};

const scoreLabels: Record<AnalysisScoreKey, string> = {
  marketFit: "상황 적합도",
  targetFit: "수신자 적합도",
  messageClarity: "메시지 명확도",
  conversionPotential: "회신/전환 가능성",
  budgetEfficiency: "커뮤니케이션 효율",
  executionDifficulty: "실행 용이성",
};

type FieldRule = {
  key: keyof MailFormInput;
  label: string;
  weight: number;
};

const completenessRules: FieldRule[] = [
  { key: "rawDraft", label: "초안", weight: 26 },
  { key: "purpose", label: "메일 목적", weight: 15 },
  { key: "mustInclude", label: "반드시 포함할 내용", weight: 15 },
  { key: "recipient", label: "받는 사람", weight: 12 },
  { key: "sender", label: "보내는 사람", weight: 8 },
  { key: "extraInstruction", label: "추가 요청사항", weight: 6 },
];

function normalize(value = "") {
  return value.trim();
}

function sourceText(input: MailFormInput) {
  return [
    input.rawDraft,
    input.purpose,
    input.mustInclude,
    input.extraInstruction,
    input.recipient,
    input.sender,
  ]
    .filter(Boolean)
    .join(" ");
}

function hasDeadline(text: string) {
  return /(오늘|내일|이번\s*주|다음\s*주|월요일|화요일|수요일|목요일|금요일|까지|오전|오후|by\s|tomorrow|friday|this week|next week)/i.test(
    text,
  );
}

function hasAction(text: string) {
  return /(확인|회신|전달|검토|공유|요청|보내|승인|조율|confirm|review|send|share|reply|let me know)/i.test(
    text,
  );
}

function hasMarkers(text: string) {
  return /必|有|多|필수|변동\s*가능성|다수|여러/.test(text);
}

function matchesItem(item: KnowledgeItem, text: string) {
  if (!item.keywords.length) {
    return false;
  }

  const lower = text.toLowerCase();

  return item.keywords.some((keyword) => {
    if (!keyword) {
      return false;
    }

    return lower.includes(keyword.toLowerCase());
  });
}

function templateCompatible(item: KnowledgeItem, templateId: MailTemplateId) {
  return !item.cases || item.cases.includes(templateId);
}

function uniqueKnowledgeItems(items: KnowledgeItem[]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    if (seen.has(item.id)) {
      return false;
    }

    seen.add(item.id);
    return true;
  });
}

function inputCompleteness(input: MailFormInput): InputCompleteness {
  const filledFields: string[] = [];
  const missingFields: string[] = [];
  let score = 0;

  for (const rule of completenessRules) {
    const value = input[rule.key];

    if (typeof value === "string" && value.trim()) {
      filledFields.push(rule.label);
      score += rule.weight;
    } else {
      missingFields.push(rule.label);
    }
  }

  if (input.languageMode !== "auto") {
    score += 5;
    filledFields.push("언어 선택");
  }

  if (input.tone !== "auto") {
    score += 5;
    filledFields.push("톤 선택");
  }

  if (input.templateMode === "manual" && input.selectedTemplateId) {
    score += 8;
    filledFields.push("메일 폼 직접 선택");
  } else {
    score += 4;
  }

  const followUpQuestions = missingFields.slice(0, 3).map((field) => {
    if (field === "받는 사람") {
      return "받는 사람의 이름, 직함, 회사명을 알고 있나요?";
    }

    if (field === "보내는 사람") {
      return "실제 발송에 들어갈 이름 또는 서명을 추가할까요?";
    }

    if (field === "반드시 포함할 내용") {
      return "절대 빠지면 안 되는 조건이나 기한이 있나요?";
    }

    if (field === "메일 목적") {
      return "이 메일로 상대가 어떤 행동을 하길 원하나요?";
    }

    return `${field} 정보를 보완하면 결과 신뢰도가 올라갑니다.`;
  });

  return {
    score: clampScore(score),
    filledFields,
    missingFields,
    followUpQuestions,
  };
}

function specialKnowledgeItems(input: MailFormInput, text: string) {
  const items: KnowledgeItem[] = [];

  const byId = (id: string) => allKnowledgeItems.find((item) => item.id === id);

  if (text.trim().length < 32) {
    const item = byId("ql-short-draft");
    if (item) items.push(item);
  }

  if (text.length > 450) {
    const item = byId("ql-too-long");
    if (item) items.push(item);
  }

  if (!normalize(input.recipient)) {
    const item = byId("aud-unknown");
    if (item) items.push(item);
  }

  if (!normalize(input.sender)) {
    const item = byId("aud-sender-missing");
    if (item) items.push(item);
  }

  if (input.templateMode === "manual") {
    const item = byId("ql-manual-template");
    if (item) items.push(item);
  }

  return items;
}

export function getMatchedKnowledgeItems(
  input: MailFormInput,
  analysis: DraftAnalysis,
) {
  const text = sourceText(input);
  const matched = allKnowledgeItems.filter(
    (item) => matchesItem(item, text) && templateCompatible(item, analysis.recommendedTemplateId),
  );

  return uniqueKnowledgeItems([...matched, ...specialKnowledgeItems(input, text)]);
}

function applyKnowledgeImpacts(scores: AnalysisScores, items: KnowledgeItem[]) {
  const next = { ...scores };

  for (const item of items) {
    for (const key of Object.keys(item.scoreImpact) as AnalysisScoreKey[]) {
      next[key] = clampScore(next[key] + (item.scoreImpact[key] ?? 0));
    }
  }

  return next;
}

function confidenceLevel(value: number): ConfidenceLevel {
  if (value >= 78) {
    return "높음";
  }

  if (value >= 60) {
    return "보통";
  }

  return "낮음";
}

function getScoreReason(key: AnalysisScoreKey, score: number) {
  if (key === "marketFit") {
    return score >= 80
      ? "선택된 메일 폼과 입력 상황이 잘 맞습니다."
      : "입력 상황과 폼은 맞지만 세부 맥락 보완 여지가 있습니다.";
  }

  if (key === "targetFit") {
    return score >= 80
      ? "수신자 관계와 톤이 안정적으로 맞춰졌습니다."
      : "수신자 정보가 더 있으면 호칭과 문체를 더 정교하게 맞출 수 있습니다.";
  }

  if (key === "messageClarity") {
    return score >= 80
      ? "목적, 핵심 내용, 요청 액션이 비교적 선명합니다."
      : "요청 대상, 기한, 조건 중 일부가 더 구체적이면 좋습니다.";
  }

  if (key === "conversionPotential") {
    return score >= 80
      ? "수신자가 회신하거나 다음 행동을 취하기 쉬운 구조입니다."
      : "다음 액션과 회신 기준을 더 분명히 하면 반응 가능성이 올라갑니다.";
  }

  if (key === "budgetEfficiency") {
    return score >= 80
      ? "불필요한 왕복 커뮤니케이션을 줄일 정보가 충분합니다."
      : "범위, 조건, 자료 기준을 보완하면 추가 질의를 줄일 수 있습니다.";
  }

  return score >= 80
    ? "실제 발송 전 확인해야 할 리스크가 낮은 편입니다."
    : "수신자명, 날짜, 첨부, 금액 등 발송 전 확인 항목이 남아 있습니다.";
}

function scoreBreakdown(scores: AnalysisScores): ScoreBreakdown[] {
  return (Object.keys(scores) as AnalysisScoreKey[]).map((key) => ({
    key,
    label: scoreLabels[key],
    score: scores[key],
    weight: scoreWeights[key],
    reason: getScoreReason(key, scores[key]),
  }));
}

function detectedSignals(
  input: MailFormInput,
  analysis: DraftAnalysis,
  templateId: MailTemplateId,
  matchedItems: KnowledgeItem[],
): DetectedSignal[] {
  const strategy = caseStrategyMap[templateId];
  const text = sourceText(input);
  const signals: DetectedSignal[] = [
    { label: "적용 폼", value: strategy.label },
    { label: "감지 목적", value: analysis.detectedPurpose },
    { label: "수신자", value: normalize(input.recipient) || analysis.detectedRecipientType },
    { label: "긴급도", value: analysis.detectedUrgency === "high" ? "높음" : analysis.detectedUrgency === "medium" ? "보통" : "낮음" },
    { label: "언어", value: analysis.detectedLanguage },
  ];

  if (hasDeadline(text)) {
    signals.push({ label: "기한 신호", value: "있음" });
  }

  if (hasMarkers(text)) {
    signals.push({ label: "BizMail 표기", value: "必/有/多 또는 유사 표기 감지" });
  }

  if (matchedItems.length) {
    signals.push({
      label: "주요 근거",
      value: matchedItems
        .slice(0, 3)
        .map((item) => item.label)
        .join(", "),
    });
  }

  return signals;
}

export type ScoringResult = {
  scores: AnalysisScores;
  totalScore: number;
  confidenceLevel: ConfidenceLevel;
  inputCompleteness: InputCompleteness;
  matchedKnowledgeItems: KnowledgeItem[];
  scoreBreakdown: ScoreBreakdown[];
  benchmarkRanges: ReturnType<typeof getBenchmarksForTemplate>[number]["ranges"];
  detectedSignals: DetectedSignal[];
  reasoningSummary: string[];
};

export function scoreMailInput(
  input: MailFormInput,
  analysis: DraftAnalysis,
  options: GenerateEmailOptions = {},
): ScoringResult {
  const text = sourceText(input);
  const templateId = analysis.recommendedTemplateId;
  const completeness = inputCompleteness(input);
  const matchedKnowledgeItems = getMatchedKnowledgeItems(input, analysis);
  const hasDeadlineSignal = hasDeadline(text);
  const hasActionSignal = hasAction(text);
  const markerSignal = hasMarkers(text);
  const missingCount = analysis.missingInfo.length;
  const keyPointCount = analysis.keyPoints.length;
  const confidence = Math.round(analysis.confidenceScore * 100);
  const isManual = input.templateMode === "manual";
  const strategy = caseStrategyMap[templateId];

  const baseScores: AnalysisScores = {
    marketFit: 50 + Math.round(confidence * 0.26) + (isManual ? 8 : 0),
    targetFit: 55 + (normalize(input.recipient) ? 12 : -6) + (input.tone !== "auto" ? 5 : 0),
    messageClarity:
      50 +
      Math.min(20, keyPointCount * 4) +
      (hasDeadlineSignal ? 6 : 0) +
      (hasActionSignal ? 8 : 0) +
      (markerSignal ? 4 : 0) -
      missingCount * 4,
    conversionPotential:
      52 +
      (hasActionSignal ? 10 : 0) +
      (hasDeadlineSignal ? 6 : 0) +
      (["proposal", "collaboration", "meeting-request", "reply-reminder"].includes(templateId)
        ? 4
        : 0) -
      Math.max(0, missingCount - 1) * 3,
    budgetEfficiency:
      56 +
      (normalize(input.mustInclude) ? 8 : 0) +
      (markerSignal ? 5 : 0) +
      (text.length > 450 ? -5 : 0) +
      (["quotation-request", "document-request", "report"].includes(templateId) ? 5 : 0),
    executionDifficulty:
      58 +
      (hasDeadlineSignal ? 5 : 0) +
      (hasActionSignal ? 6 : 0) +
      (markerSignal ? 4 : 0) -
      missingCount * 5,
  };

  const scores = applyKnowledgeImpacts(
    Object.fromEntries(
      Object.entries(baseScores).map(([key, value]) => [key, clampScore(value)]),
    ) as AnalysisScores,
    matchedKnowledgeItems,
  );

  const totalScore = clampScore(
    (Object.keys(scoreWeights) as AnalysisScoreKey[]).reduce(
      (total, key) => total + scores[key] * scoreWeights[key],
      0,
    ),
  );
  const confidenceComposite = clampScore(
    totalScore * 0.45 + completeness.score * 0.35 + confidence * 0.2 + (options.variant ? 0 : 0),
  );
  const benchmarks = getBenchmarksForTemplate(templateId);

  return {
    scores,
    totalScore,
    confidenceLevel: confidenceLevel(confidenceComposite),
    inputCompleteness: completeness,
    matchedKnowledgeItems,
    scoreBreakdown: scoreBreakdown(scores),
    benchmarkRanges: benchmarks.flatMap((benchmark) => benchmark.ranges).slice(0, 4),
    detectedSignals: detectedSignals(input, analysis, templateId, matchedKnowledgeItems),
    reasoningSummary: [
      strategy.reasoning,
      `입력 완성도는 ${completeness.score}점이며, ${completeness.filledFields.join(", ") || "기본 초안"} 정보를 기준으로 분석했습니다.`,
      matchedKnowledgeItems.length
        ? `${matchedKnowledgeItems
            .slice(0, 3)
            .map((item) => item.label)
            .join(", ")} 신호가 결과 품질에 반영되었습니다.`
        : "명확한 특수 신호가 적어 일반 비즈니스 메일 기준으로 안정적으로 정리했습니다.",
    ],
  };
}
