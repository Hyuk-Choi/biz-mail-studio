import type {
  DraftAnalysis,
  MailFormInput,
  MailTemplateId,
  MailTone,
} from "@/types/mail";
import {
  extractBizMailMarkerInsightsFromInput,
  formatBizMailMarkerInsight,
  normalizeBizMailMarkerSyntax,
  stripBizMailMarkerSegments,
} from "@/lib/bizMailMarkers";

type DetectedLanguage = DraftAnalysis["detectedLanguage"];
type DetectedUrgency = DraftAnalysis["detectedUrgency"];

interface TemplateRule {
  id: MailTemplateId;
  situation: string;
  purpose: string;
  tone: MailTone;
  keywords: string[];
  priority: number;
}

const templateRules: TemplateRule[] = [
  {
    id: "apology",
    situation: "사과와 후속 조치 안내가 필요한 상황",
    purpose: "문제 상황에 대해 사과하고 대응 계획을 안내",
    tone: "polite",
    keywords: ["죄송", "사과", "지연", "누락", "실수", "불편", "늦게", "apology", "sorry", "delayed"],
    priority: 100,
  },
  {
    id: "complaint",
    situation: "문제나 불만을 차분하게 전달해야 하는 상황",
    purpose: "문제 상황을 설명하고 해결 또는 답변을 요청",
    tone: "firm",
    keywords: [
      "문제",
      "불만",
      "클레임",
      "오류",
      "개선 요청",
      "환불",
      "해결 요청",
      "파손",
      "불량",
      "누락",
      "교환",
      "재발 방지",
      "납품",
      "조치",
      "issue",
      "complaint",
    ],
    priority: 95,
  },
  {
    id: "rejection",
    situation: "요청이나 제안을 정중히 거절해야 하는 상황",
    purpose: "감사 표현과 함께 거절 사유를 전달",
    tone: "soft",
    keywords: ["어렵다", "불가", "거절", "진행 어렵", "함께하기 어렵", "정중히 거절", "unfortunately", "decline"],
    priority: 90,
  },
  {
    id: "meeting-follow-up",
    situation: "미팅 이후 논의 내용과 후속 액션을 정리하는 상황",
    purpose: "이전 논의를 정리하고 다음 액션을 공유",
    tone: "polite",
    keywords: [
      "오늘 미팅",
      "오늘 회의",
      "지난 회의",
      "회의 내용",
      "미팅 후",
      "회의 후",
      "논의 내용",
      "후속",
      "팔로업",
      "정리해서 공유",
      "다음 액션",
      "follow-up",
      "recap",
      "next steps",
    ],
    priority: 82,
  },
  {
    id: "reply-reminder",
    situation: "이전 요청에 대한 회신을 정중하게 리마인드해야 하는 상황",
    purpose: "이전 요청을 언급하고 회신 또는 업데이트를 요청",
    tone: "polite",
    keywords: ["회신", "답변", "리마인드", "확인차", "아직 답", "답이 없", "다시 연락", "follow up", "reminder"],
    priority: 80,
  },
  {
    id: "quotation-request",
    situation: "제품이나 서비스의 비용 조건을 확인해야 하는 상황",
    purpose: "견적 또는 가격 정보를 요청",
    tone: "polite",
    keywords: ["견적", "비용", "가격", "단가", "견적서", "비용 문의", "quotation", "estimate", "pricing"],
    priority: 76,
  },
  {
    id: "schedule-adjustment",
    situation: "일정 또는 시간을 조율해야 하는 상황",
    purpose: "가능한 일정 확인 및 조율 요청",
    tone: "soft",
    keywords: ["일정", "시간", "가능하신가요", "가능한지", "조율", "미팅 시간", "날짜", "회의 일정", "화요일", "수요일"],
    priority: 72,
  },
  {
    id: "meeting-request",
    situation: "미팅을 제안하거나 논의 시간을 요청하는 상황",
    purpose: "미팅 목적과 논의 주제를 전달하고 일정을 요청",
    tone: "polite",
    keywords: [
      "미팅 요청",
      "논의",
      "이야기 나누",
      "회의 요청",
      "만나서 설명",
      "줌",
      "구글밋",
      "zoom",
      "google meet",
      "meeting",
      "discuss",
      "request a meeting",
    ],
    priority: 70,
  },
  {
    id: "document-request",
    situation: "자료나 파일 전달을 요청해야 하는 상황",
    purpose: "필요한 자료와 전달 기한을 요청",
    tone: "polite",
    keywords: ["자료 요청", "파일", "문서", "이미지", "데이터", "보고서", "전달 부탁", "공유 부탁", "첨부", "send", "proposal"],
    priority: 68,
  },
  {
    id: "proposal",
    situation: "아이디어나 프로젝트를 제안하는 상황",
    purpose: "제안 내용과 기대 효과를 설명하고 검토를 요청",
    tone: "persuasive",
    keywords: ["제안", "아이디어", "캠페인", "프로젝트 제안", "서비스 제안", "도입 제안", "개선안", "proposal"],
    priority: 64,
  },
  {
    id: "collaboration",
    situation: "협업 또는 제휴를 요청하는 상황",
    purpose: "협업 배경과 아이디어를 설명하고 검토를 요청",
    tone: "friendly-professional",
    keywords: ["협업", "협업 제안", "협업을 제안", "콜라보", "파트너십", "제휴", "브랜드 협업", "같이 진행", "공동 프로젝트", "partnership"],
    priority: 78,
  },
  {
    id: "thanks",
    situation: "도움이나 협조에 대해 감사 인사를 전하는 상황",
    purpose: "상대방의 도움에 감사하고 향후 관계를 이어감",
    tone: "soft",
    keywords: ["감사", "고맙습니다", "도움 주셔서", "시간 내주셔서", "협조해주셔서", "thanks", "appreciate"],
    priority: 60,
  },
  {
    id: "report",
    situation: "업무 진행 상황이나 결과를 보고하는 상황",
    purpose: "핵심 요약, 진행 상황, 이슈, 다음 액션을 보고",
    tone: "concise",
    keywords: ["보고", "공유드립니다", "진행 상황", "결과", "현황", "이슈", "status update", "report"],
    priority: 58,
  },
  {
    id: "self-introduction",
    situation: "자기소개, 지원, 포트폴리오 전달이 필요한 상황",
    purpose: "자기소개와 연락 목적, 강점을 전달",
    tone: "formal",
    keywords: ["지원", "자기소개", "포트폴리오", "이력서", "관심 있어서 연락", "채용", "apply", "resume", "portfolio"],
    priority: 56,
  },
  {
    id: "global-business",
    situation: "해외 파트너 또는 클라이언트에게 영어로 커뮤니케이션하는 상황",
    purpose: "글로벌 비즈니스 톤으로 요청 또는 안내",
    tone: "global-business",
    keywords: ["overseas", "partner", "buyer", "client", "business inquiry", "global", "english email", "해외 거래처", "바이어", "해외 파트너"],
    priority: 54,
  },
  {
    id: "work-request",
    situation: "상대방에게 업무 처리나 확인을 요청하는 상황",
    purpose: "요청 배경과 필요한 액션을 명확하게 전달",
    tone: "polite",
    keywords: ["요청", "확인 부탁", "처리", "진행", "검토", "전달", "승인", "수정", "공유", "review", "approve"],
    priority: 50,
  },
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
  ]
    .filter(Boolean)
    .join(" ");
}

function detectLanguage(text: string): DetectedLanguage {
  const hasKorean = /[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(text);
  const hasEnglish = /[A-Za-z]/.test(text);

  if (hasKorean && hasEnglish) {
    return "mixed";
  }

  if (hasKorean) {
    return "ko";
  }

  if (hasEnglish) {
    return "en";
  }

  return "unknown";
}

function detectUrgency(text: string): DetectedUrgency {
  const lower = text.toLowerCase();

  if (
    ["긴급", "급하게", "asap", "immediately", "오늘 중", "오늘 오후", "오늘 오전", "eod"].some(
      (keyword) => lower.includes(keyword),
    )
  ) {
    return "high";
  }

  if (
    ["내일", "이번 주", "금요일", "목요일", "수요일", "화요일", "월요일", "by friday", "this week", "tomorrow"].some(
      (keyword) => lower.includes(keyword),
    )
  ) {
    return "medium";
  }

  return "low";
}

function countMatches(text: string, keywords: string[]) {
  return keywords.reduce(
    (count, keyword) => count + (text.includes(keyword.toLowerCase()) ? 1 : 0),
    0,
  );
}

function pickTemplate(
  input: MailFormInput,
  text: string,
): { id: MailTemplateId; matchCount: number; isManual: boolean } {
  if (input.templateMode === "manual" && input.selectedTemplateId) {
    return {
      id: input.selectedTemplateId,
      matchCount: 4,
      isManual: true,
    };
  }

  if (
    /(감사|고맙|덕분|thanks|appreciate)/i.test(text) &&
    !/(죄송|사과|불편|파손|불량|클레임|거절|어렵다|불가|unfortunately|decline|논의\s*내용|후속|팔로업|다음\s*액션|follow-up)/i.test(text)
  ) {
    return {
      id: "thanks",
      matchCount: 4,
      isManual: false,
    };
  }

  if (/share.*pricing\s+table|updated\s+pricing\s+table|가격표.*공유/i.test(text)) {
    return {
      id: "document-request",
      matchCount: 4,
      isManual: false,
    };
  }

  if (/(사전\s*검수|인플루언서|차주\s*진행|필수|必|변동\s*가능성)/i.test(text)) {
    return {
      id: "work-request",
      matchCount: 4,
      isManual: false,
    };
  }

  const scored = templateRules
    .map((rule) => ({
      ...rule,
      matchCount: countMatches(text, rule.keywords),
    }))
    .filter((rule) => rule.matchCount > 0)
    .sort((a, b) => b.matchCount - a.matchCount || b.priority - a.priority);

  const best = scored[0];

  return {
    id: best?.id ?? "general-business",
    matchCount: best?.matchCount ?? 0,
    isManual: false,
  };
}

function findRule(id: MailTemplateId) {
  return (
    templateRules.find((rule) => rule.id === id) ?? {
      id,
      purpose: "비즈니스 목적에 맞게 내용을 정리",
      situation: "일반적인 비즈니스 커뮤니케이션 상황",
      tone: "polite" as MailTone,
      keywords: [],
      priority: 0,
    }
  );
}

function detectRecipientType(input: MailFormInput, text: string) {
  if (normalize(input.recipient)) {
    return input.recipient as string;
  }

  if (/(거래처|클라이언트|client|buyer|파트너|partner)/i.test(text)) {
    return "외부 거래처 또는 클라이언트";
  }

  if (/(팀장|상무|대표|매니저|manager|director)/i.test(text)) {
    return "상급자 또는 의사결정자";
  }

  if (/(팀|동료|내부|부서)/i.test(text)) {
    return "내부 구성원";
  }

  return "받는 사람 정보 미입력";
}

function compactLines(value = "") {
  return value
    .split(/\n|;|•|-/)
    .map((line) => line.trim())
    .filter((line) => line.length > 1);
}

function cleanDraftSegment(value: string) {
  return value
    .replace(/말해줘|말하고 싶어|하고 싶어|물어보고 싶어|작성해줘|써줘/g, "")
    .replace(/정중하게/g, "")
    .replace(/싶다고\s*\.?/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function splitDraftSegments(value = "") {
  return stripBizMailMarkerSegments(value)
    .split(/\n|,|，|;|；|•|(?<!\d)\.(?!\d)\s*/)
    .map(cleanDraftSegment)
    .filter((line) => line.length > 1);
}

function uniqueLines(lines: string[]) {
  const seen = new Set<string>();

  return lines.filter((line) => {
    const normalized = line.trim();

    if (!normalized || seen.has(normalized)) {
      return false;
    }

    seen.add(normalized);
    return true;
  });
}

function extractKeyPoints(input: MailFormInput, templateId: MailTemplateId) {
  const markerPoints = extractBizMailMarkerInsightsFromInput(input).map((insight) =>
    formatBizMailMarkerInsight(insight, "ko"),
  );
  const explicit = compactLines(input.mustInclude).map((line) =>
    normalizeBizMailMarkerSyntax(line, "ko"),
  );

  if (explicit.length) {
    return uniqueLines([...explicit, ...markerPoints]).slice(0, 6);
  }

  const draftSegments = splitDraftSegments(input.rawDraft);

  if (!draftSegments.length) {
    return markerPoints.length
      ? markerPoints.slice(0, 6)
      : ["입력된 초안의 핵심 내용을 비즈니스 문장으로 정리"];
  }

  return uniqueLines([...draftSegments, ...markerPoints]).slice(0, 6);
}

function requestedActions(templateId: MailTemplateId) {
  const actions: Record<MailTemplateId, string[]> = {
    "work-request": ["요청 사항 확인 및 처리"],
    "schedule-adjustment": ["가능 일정 확인 및 회신"],
    "meeting-request": ["미팅 가능 여부 회신"],
    "meeting-follow-up": ["후속 액션 확인"],
    proposal: ["제안 내용 검토 및 의견 회신"],
    collaboration: ["협업 가능성 검토"],
    "quotation-request": ["견적 또는 가격 정보 회신"],
    "document-request": ["필요 자료 전달"],
    "reply-reminder": ["이전 요청 건에 대한 회신"],
    thanks: ["감사 인사 전달"],
    apology: ["사과 및 후속 대응 일정 안내"],
    rejection: ["정중한 거절 의사 전달"],
    complaint: ["문제 확인 및 해결 방안 회신"],
    report: ["진행 상황 공유 및 다음 액션 확인"],
    "self-introduction": ["자기소개 및 자료 검토 요청"],
    "global-business": ["글로벌 비즈니스 요청 또는 안내"],
    "general-business": ["핵심 내용 확인 및 필요한 회신"],
  };

  return actions[templateId];
}

function hasDeadline(text: string) {
  return /(오늘|내일|이번 주|금요일|목요일|수요일|화요일|월요일|오전|오후|까지|by |this week|tomorrow|friday)/i.test(
    text,
  );
}

function detectMissingInfo(input: MailFormInput, templateId: MailTemplateId, text: string) {
  const missing: string[] = [];

  if (!normalize(input.recipient)) {
    missing.push("받는 사람");
  }

  if (!normalize(input.sender)) {
    missing.push("보내는 사람 또는 서명");
  }

  if (
    ["schedule-adjustment", "meeting-request"].includes(templateId) &&
    !/(월요일|화요일|수요일|목요일|금요일|주말|오전|오후|시|날짜|time|date|next week)/i.test(text)
  ) {
    missing.push("희망 일정 또는 가능한 시간");
  }

  if (
    ["apology", "quotation-request", "document-request", "reply-reminder"].includes(
      templateId,
    ) &&
    !hasDeadline(text)
  ) {
    missing.push("희망 회신 기한 또는 대응 일정");
  }

  if (templateId === "complaint" && !/(요청|해결|환불|조치|답변|resolution|refund)/i.test(text)) {
    missing.push("상대방에게 기대하는 조치");
  }

  return missing;
}

function confidence(matchCount: number, isManual: boolean) {
  if (isManual) {
    return 0.95;
  }

  if (matchCount <= 0) {
    return 0.48;
  }

  return Number(Math.min(0.92, 0.58 + matchCount * 0.11).toFixed(2));
}

export function analyzeDraft(input: MailFormInput): DraftAnalysis {
  const rawText = sourceText(input);
  const lowerText = rawText.toLowerCase();
  const picked = pickTemplate(input, lowerText);
  const rule = findRule(picked.id);
  const keyPoints = extractKeyPoints(input, picked.id);

  return {
    detectedPurpose:
      normalizeBizMailMarkerSyntax(normalize(input.purpose), "ko") ||
      rule.purpose,
    detectedRecipientType: detectRecipientType(input, rawText),
    detectedSituation: rule.situation,
    detectedUrgency: detectUrgency(rawText),
    detectedLanguage: detectLanguage(rawText),
    recommendedTemplateId: picked.id,
    recommendedTone: input.tone === "auto" ? rule.tone : input.tone,
    keyPoints,
    requestedActions: requestedActions(picked.id),
    missingInfo: detectMissingInfo(input, picked.id, rawText),
    confidenceScore: confidence(picked.matchCount, picked.isManual),
  };
}
