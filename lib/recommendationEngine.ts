import { copyTemplates } from "@/data/copyTemplates";
import { caseStrategyMap, type KnowledgeItem } from "@/data/mockKnowledgeBase";
import type {
  AnalysisScoreKey,
  PriorityAction,
} from "@/types/analysis";
import type {
  DraftAnalysis,
  GenerateEmailOptions,
  GeneratedMailResult,
  MailFormInput,
  MailTemplateId,
} from "@/types/mail";
import type { ScoringResult } from "@/lib/scoringEngine";
import { pickManyBySeed, uniqueByText } from "@/lib/textVariation";

type RecommendationContext = {
  input: MailFormInput;
  analysis: DraftAnalysis;
  generated: Omit<GeneratedMailResult, "analysisResult">;
  scoring: ScoringResult;
  options?: GenerateEmailOptions;
};

const lowScoreActions: Record<AnalysisScoreKey, PriorityAction> = {
  marketFit: {
    priority: "중간",
    action: "메일 폼과 목적을 다시 확인",
    reason: "입력 목적과 적용 폼의 연결성이 약하면 문장 흐름이 일반적으로 보일 수 있습니다.",
  },
  targetFit: {
    priority: "높음",
    action: "받는 사람 정보 보완",
    reason: "수신자의 이름, 직함, 회사명을 알면 호칭과 문체를 더 정확히 맞출 수 있습니다.",
  },
  messageClarity: {
    priority: "높음",
    action: "요청 액션과 기준을 한 문장으로 추가",
    reason: "수신자가 무엇을 확인하거나 회신해야 하는지 더 선명하게 만들 수 있습니다.",
  },
  conversionPotential: {
    priority: "높음",
    action: "희망 회신 기한 또는 다음 단계 추가",
    reason: "명확한 다음 행동이 있어야 실제 회신 가능성이 높아집니다.",
  },
  budgetEfficiency: {
    priority: "중간",
    action: "범위, 조건, 포함/제외 사항 정리",
    reason: "추가 질의를 줄이고 한 번에 처리될 가능성을 높입니다.",
  },
  executionDifficulty: {
    priority: "높음",
    action: "발송 전 사실 정보 검수",
    reason: "날짜, 금액, 첨부, 고유명사 같은 정보는 실제 발송 전 확인이 필요합니다.",
  },
};

const templateTestIdeas: Record<MailTemplateId, string[]> = {
  "work-request": [
    "기한을 넣은 버전과 기한 없이 요청만 남긴 버전 비교",
    "요청 항목을 bullet로 나눈 버전과 짧은 문단 버전 비교",
    "수신자를 내부 구성원으로 가정한 톤과 외부 거래처 톤 비교",
  ],
  "schedule-adjustment": [
    "후보 일정 2개 버전과 3개 버전 비교",
    "상대가 시간을 제안하도록 여지를 둔 버전 테스트",
    "미팅 목적을 첫 문장에 넣은 버전과 제목에 넣은 버전 비교",
  ],
  "meeting-request": [
    "안건을 2개로 줄인 버전과 상세 안건 버전 비교",
    "미팅 소요 시간을 명시한 버전 테스트",
    "영어 글로벌 톤으로 변환한 버전 비교",
  ],
  "meeting-follow-up": [
    "후속 액션을 담당자별로 나눈 버전 테스트",
    "회의 요약을 3줄 이내로 압축한 버전 비교",
    "다음 확인 시점을 넣은 버전 테스트",
  ],
  proposal: [
    "기대 효과를 첫 문단에 배치한 버전 테스트",
    "상대 이점을 강조한 버전과 실행 부담을 낮춘 버전 비교",
    "미팅 요청을 포함한 버전과 의견 회신만 요청한 버전 비교",
  ],
  collaboration: [
    "상호 이점을 강조한 버전과 브랜드 적합성을 강조한 버전 비교",
    "짧은 미팅 요청을 넣은 버전 테스트",
    "사전 검수 조건을 명확히 넣은 버전 비교",
  ],
  "quotation-request": [
    "조건을 목록화한 버전과 문단형 버전 비교",
    "회신 기한을 넣은 버전 테스트",
    "포함/제외 범위를 명시한 버전 비교",
  ],
  "document-request": [
    "사용 목적을 포함한 버전과 자료명만 요청한 버전 비교",
    "전달 희망 기한을 넣은 버전 테스트",
    "자료 형식을 지정한 버전 비교",
  ],
  "reply-reminder": [
    "더 부드러운 리마인드와 더 명확한 리마인드 버전 비교",
    "이전 발송일을 포함한 버전 테스트",
    "회신 기한을 넣은 버전과 제외한 버전 비교",
  ],
  thanks: [
    "구체적 감사 사유를 앞에 둔 버전 테스트",
    "향후 협업 기대를 넣은 버전 비교",
    "짧은 감사 메일과 정중한 감사 메일 비교",
  ],
  apology: [
    "대응 일정을 강조한 버전 테스트",
    "재발 방지 문장을 강화한 버전 비교",
    "사과 표현을 더 간결하게 줄인 버전 테스트",
  ],
  rejection: [
    "거절 사유를 짧게 둔 버전과 대안을 포함한 버전 비교",
    "향후 가능성을 열어둔 버전 테스트",
    "더 부드러운 톤과 더 명확한 톤 비교",
  ],
  complaint: [
    "문제 상황을 더 객관적으로 쓴 버전 테스트",
    "요청 조치를 앞쪽에 배치한 버전 비교",
    "해결 기대 일정을 넣은 버전 테스트",
  ],
  report: [
    "핵심 요약을 맨 위에 둔 버전 테스트",
    "이슈와 다음 액션을 분리한 버전 비교",
    "상급자 보고용 간결 버전 테스트",
  ],
  "self-introduction": [
    "강점을 2개로 압축한 버전 테스트",
    "포트폴리오 링크를 앞쪽에 둔 버전 비교",
    "격식 있는 톤과 친근한 전문 톤 비교",
  ],
  "global-business": [
    "Could you please 요청형과 I would appreciate 확인형 비교",
    "Subject line을 더 직접적으로 쓴 버전 테스트",
    "한국식 완곡 표현을 줄인 짧은 버전 비교",
  ],
  "general-business": [
    "목적을 첫 문장에 둔 버전 테스트",
    "요청 액션을 더 명확히 한 버전 비교",
    "짧은 버전과 정중한 버전 비교",
  ],
};

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

function isEnglishResult(input: MailFormInput, generated: GeneratedMailResult) {
  return (
    input.languageMode === "en" ||
    input.languageMode === "ko-to-en" ||
    /^(hi|dear|hello),/i.test(generated.body)
  );
}

function inferTopic(generated: GeneratedMailResult) {
  const subject = generated.subjects[0] ?? "";
  const cleaned = subject
    .replace(/\[[^\]]+\]/g, "")
    .replace(/관련하여|관련|문의드립니다|확인 부탁드립니다|검토 부탁드립니다|request|regarding|follow-up|:/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned || generated.appliedTemplateLabel;
}

function deadlinePlaceholder(input: MailFormInput, generated: GeneratedMailResult) {
  const text = sourceText(input);
  const match = text.match(
    /(오늘\s*(?:오전|오후)?\s*\d{0,2}시?|내일\s*(?:오전|오후)?|이번\s*주\s*(?:안|중|까지)?|다음\s*주\s*(?:월요일|화요일|수요일|목요일|금요일)?|금요일까지|by\s+(?:friday|tomorrow|this week))/i,
  );

  if (match?.[0]) {
    const value = match[0].trim();

    if (/^by\s/i.test(value)) {
      return value;
    }

    return value.endsWith("까지") || value.endsWith("중") || value.endsWith("안")
      ? value
      : `${value}까지`;
  }

  return isEnglishResult(input, generated) ? "by the requested timeline" : "가능한 일정에 맞춰";
}

function fillTemplate(template: string, topic: string, deadline: string) {
  return template
    .replaceAll("{{topic}}", topic)
    .replaceAll("{{deadline}}", deadline)
    .replace(/\s+/g, " ")
    .trim();
}

function matchingCopyTemplates(templateId: MailTemplateId, text: string) {
  const lower = text.toLowerCase();

  return copyTemplates.filter((template) => {
    const caseMatch = template.cases === "all" || template.cases.includes(templateId);
    const tagMatch = template.tags.some((tag) => lower.includes(tag.toLowerCase()));

    return caseMatch && (tagMatch || template.cases !== "all");
  });
}

function lowerScoringActions(scoring: ScoringResult) {
  return scoring.scoreBreakdown
    .filter((item) => item.score < 76)
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map((item) => lowScoreActions[item.key]);
}

function priorityFromKnowledge(items: KnowledgeItem[]) {
  return items
    .filter((item) => item.priority !== "낮음")
    .slice(0, 4)
    .map<PriorityAction>((item) => ({
      priority: item.priority,
      action: item.recommendation,
      reason: item.problem,
    }));
}

function missingInfoActions(analysis: DraftAnalysis) {
  return analysis.missingInfo.slice(0, 3).map<PriorityAction>((field) => ({
    priority: field.includes("받는 사람") || field.includes("기한") ? "높음" : "중간",
    action: `${field} 정보 보완`,
    reason: `${field} 정보가 있으면 실제 발송 전 수정해야 할 부분이 줄어듭니다.`,
  }));
}

function uniqueActions(actions: PriorityAction[]) {
  const seen = new Set<string>();

  return actions.filter((action) => {
    const key = action.action.replace(/\s+/g, "");

    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function confidenceInsight(scoring: ScoringResult) {
  if (scoring.confidenceLevel === "높음") {
    return "입력된 정보와 선택된 폼의 연결성이 높아, 현재 결과는 바로 발송 전 검수 단계에 가깝습니다.";
  }

  if (scoring.confidenceLevel === "보통") {
    return "핵심 의도는 충분히 반영되었지만, 일부 세부 정보가 보완되면 더 자연스럽고 정확해집니다.";
  }

  return "초안 정보가 제한적이어서 결과가 일반적인 비즈니스 문장에 가깝습니다.";
}

export function buildRecommendations({
  input,
  analysis,
  generated,
  scoring,
  options = {},
}: RecommendationContext) {
  const text = sourceText(input);
  const templateId = generated.appliedTemplateId;
  const strategy = caseStrategyMap[templateId];
  const seedText = `${text}:${generated.subjects.join("|")}:${templateId}`;
  const isEnglish = isEnglishResult(input, generated);
  const topic = inferTopic(generated);
  const deadline = deadlinePlaceholder(input, generated);
  const copyPool = matchingCopyTemplates(templateId, text);
  const selectedCopyTemplates = pickManyBySeed(
    copyPool.length ? copyPool : copyTemplates,
    4,
    seedText,
    options.variant ?? 0,
    "copy",
  );

  const keyInsights = uniqueByText([
    confidenceInsight(scoring),
    strategy.reasoning,
    ...scoring.matchedKnowledgeItems.map((item) => item.insight),
    scoring.inputCompleteness.missingFields.length
      ? `보완하면 좋은 정보: ${scoring.inputCompleteness.missingFields.slice(0, 3).join(", ")}`
      : "입력 필드가 충분히 채워져 있어 결과 신뢰도가 안정적입니다.",
  ]).slice(0, 6);

  const problems = uniqueByText([
    ...scoring.matchedKnowledgeItems
      .filter((item) => item.priority !== "낮음")
      .map((item) => item.problem),
    ...analysis.missingInfo.map((field) => `${field} 정보가 없어 일부 표현은 일반형으로 처리했습니다.`),
    scoring.totalScore < 72
      ? "현재 입력만으로는 수신자 맞춤 표현과 구체적인 액션 설계에 한계가 있습니다."
      : "",
  ]).slice(0, 6);

  const recommendations = uniqueByText([
    ...scoring.matchedKnowledgeItems.map((item) => item.recommendation),
    ...scoring.inputCompleteness.followUpQuestions,
    strategy.idealStructure.length
      ? `${strategy.label} 구조는 ${strategy.idealStructure.join(" → ")} 흐름으로 유지하는 것이 좋습니다.`
      : "",
  ]).slice(0, 7);

  const priorityActions = uniqueActions([
    ...missingInfoActions(analysis),
    ...lowerScoringActions(scoring),
    ...priorityFromKnowledge(scoring.matchedKnowledgeItems),
  ]).slice(0, 5);

  const generatedCopy = uniqueByText(
    selectedCopyTemplates.map((template) =>
      fillTemplate(isEnglish ? template.en : template.ko, topic, deadline),
    ),
  ).slice(0, 4);

  const nextTestIdeas = pickManyBySeed(
    templateTestIdeas[templateId],
    3,
    seedText,
    options.variant ?? 0,
    "tests",
  );

  const caution = isEnglish
    ? "This is a mock-data-based analysis result. Please verify names, dates, amounts, attachments, and any commitments before sending."
    : "mock 데이터 기반 분석 결과입니다. 실제 발송 전 수신자명, 날짜, 금액, 첨부파일, 약속된 일정은 반드시 직접 확인하세요.";

  return {
    summary: `${strategy.label} 상황으로 판단하여 ${strategy.idealStructure.join(" → ")} 흐름에 맞게 정리했습니다. 총점은 ${scoring.totalScore}점이며 신뢰도는 ${scoring.confidenceLevel}입니다.`,
    keyInsights,
    problems,
    recommendations,
    priorityActions,
    generatedCopy,
    nextTestIdeas,
    caution,
  };
}
