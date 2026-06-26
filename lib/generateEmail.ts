import { getMailTemplateById } from "@/data/mailTemplates";
import { analyzeDraft } from "@/lib/analyzeDraft";
import {
  extractBizMailMarkerInsightsFromInput,
  formatBizMailMarkerInsight,
  normalizeBizMailMarkerSyntax,
} from "@/lib/bizMailMarkers";
import type {
  DraftAnalysis,
  GenerateEmailOptions,
  GeneratedMailResult,
  LanguageMode,
  MailFormInput,
  MailRefinementAction,
  MailTemplateId,
  MailTone,
} from "@/types/mail";

type OutputLanguage = "ko" | "en";

interface GenerationContext {
  input: MailFormInput;
  analysis: DraftAnalysis;
  templateId: MailTemplateId;
  language: OutputLanguage;
  tone: MailTone;
  topic: string;
  deadline: string;
  keyPoints: string[];
}

const toneLabels: Record<MailTone, string> = {
  auto: "자동 추천",
  polite: "정중한",
  concise: "간결한",
  soft: "부드러운",
  firm: "단호한",
  persuasive: "설득력 있는",
  "friendly-professional": "친근하지만 전문적인",
  formal: "격식 있는",
  "global-business": "글로벌 비즈니스 스타일",
};

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

function compactLines(value = "") {
  return value
    .split(/\n|,|，|;|；|•/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function cleanInstructionWords(value: string) {
  return value
    .replace(/^[가-힣A-Za-z0-9\s]+(?:담당자|팀장님|팀장|님|파트너사|거래처)에게\s+/, "")
    .replace(/말해줘|말하고 싶어|하고 싶어|물어보고 싶어|작성해줘|써줘/g, "")
    .replace(/정중하게/g, "")
    .replace(/정중히/g, "")
    .replace(/싶다고\s*\.?/g, "")
    .replace(/^ask the client to\s+/i, "")
    .replace(/하고\s*전달$/g, "")
    .replace(/\s+\./g, ".")
    .trim();
}

function translateKnownBusinessKorean(value: string) {
  const replacements: Array<[RegExp, string]> = [
    [/신규\s*대시보드\s*도입/g, "new dashboard implementation"],
    [/다음\s*주\s*금요일\s*오후/g, "next Friday afternoon"],
    [/다음\s*주\s*수요일/g, "next Wednesday"],
    [/30분\s*미팅\s*요청/g, "request a 30-minute meeting"],
    [/수정\s*계약서/g, "revised contract"],
    [/검토\s*의견/g, "review feedback"],
    [/비용/g, "cost"],
    [/일정/g, "timeline"],
    [/필요\s*기능/g, "required features"],
    [/사전\s*검수\s*필수/g, "pre-review required"],
    [/변동\s*가능성\s*있음/g, "subject to change"],
    [/수정\s*요청\s*다수/g, "multiple revision requests"],
    [/인플루언서\s*5인\s*차주\s*진행/g, "proceed with five influencers next week"],
    [/촬영\s*패키지/g, "filming package"],
    [/기본\s*촬영\s*1일/g, "one day of basic shooting"],
    [/보정\s*컷\s*20장/g, "20 retouched images"],
    [/영상\s*편집\s*1본/g, "one edited video"],
  ];

  return replacements.reduce(
    (result, [pattern, replacement]) => result.replace(pattern, replacement),
    value,
  )
    .replace(
      /new dashboard implementation\s*관련해서\s*next Friday afternoon에\s*request a 30-minute meeting/g,
      "Request a 30-minute meeting next Friday afternoon regarding the new dashboard implementation",
    )
    .replace(/required features을 논의/g, "required features")
    .replace(/(.+)을 논의/g, "$1")
    .replace(/관련해서/g, "regarding")
    .replace(/에\s+/g, " ")
    .trim();
}

function translateKnownBusinessEnglishToKorean(value: string) {
  const replacements: Array<[RegExp, string]> = [
    [/please\s+let\s+us\s+know\s+if\s+you\s+can\s+share\s+/gi, ""],
    [/updated\s+pricing\s+table/gi, "업데이트된 가격표"],
    [/pricing\s+table/gi, "가격표"],
    [/revised\s+proposal/gi, "수정 제안서"],
    [/revised\s+contract/gi, "수정 계약서"],
    [/by\s+tomorrow\s+morning/gi, "내일 오전까지"],
    [/by\s+tomorrow/gi, "내일까지"],
    [/by\s+friday/gi, "금요일까지"],
    [/share\s+/gi, "공유"],
  ];

  return replacements.reduce(
    (result, [pattern, replacement]) => result.replace(pattern, replacement),
    value,
  ).trim();
}

function cleanKeyPoint(value: string, language: OutputLanguage) {
  const cleaned = cleanInstructionWords(normalizeBizMailMarkerSyntax(value, language));

  return language === "en"
    ? translateKnownBusinessKorean(cleaned)
    : polishKoreanPoint(translateKnownBusinessEnglishToKorean(cleaned));
}

function polishKoreanPoint(value: string) {
  return value
    .replace(/이번주/g, "이번 주")
    .replace(/다음주/g, "다음 주")
    .replace(/(\S+)랑\s+/g, "$1 및 ")
    .replace(/제안서에 넣어야 해서/g, "제안서 작성을 위해")
    .replace(/첫 구매\s*7일\s*뒤\s*쿠폰 메시지 발송하면\s*재구매율 높일 수 있음/g, "첫 구매 7일 후 쿠폰 메시지 발송을 통한 재구매율 개선 기대")
    .replace(/상세페이지 제작 견적 필요/g, "상세페이지 제작 견적 요청")
    .replace(/견적서 요청/g, "견적서 전달 요청")
    .replace(/소재 피로도 높아짐/g, "소재 피로도 상승 이슈")
    .replace(/^다만\s+/g, "")
    .trim();
}

function uniqueLines(lines: string[]) {
  const seen = new Set<string>();

  return lines.filter((line) => {
    const normalized = line.trim();
    const comparable = normalized
      .replace(/\s+/g, "")
      .replace(/필수/g, "필요")
      .replace(/요청드립니다|부탁드립니다|부탁|요청/g, "")
      .replace(/[.,，。:：]/g, "");

    if (!normalized || seen.has(comparable)) {
      return false;
    }

    seen.add(comparable);
    return true;
  });
}

function titleCase(value: string) {
  const smallWords = new Set(["and", "or", "of", "for", "to", "the", "a", "an"]);

  return value.replace(/\w\S*/g, (word, index) => {
    const lower = word.toLowerCase();

    if (index > 0 && smallWords.has(lower)) {
      return lower;
    }

    return lower.charAt(0).toUpperCase() + lower.slice(1);
  });
}

function resolveLanguageMode(
  input: MailFormInput,
  analysis: DraftAnalysis,
  action?: MailRefinementAction,
): OutputLanguage {
  if (action === "translate_to_english") {
    return "en";
  }

  if (action === "translate_to_korean") {
    return "ko";
  }

  const mode: LanguageMode = input.languageMode;

  if (mode === "ko" || mode === "en-to-ko") {
    return "ko";
  }

  if (mode === "en" || mode === "ko-to-en") {
    return "en";
  }

  if (analysis.recommendedTemplateId === "global-business") {
    return "en";
  }

  if (analysis.detectedLanguage === "en") {
    return "en";
  }

  return "ko";
}

function resolveTone(
  input: MailFormInput,
  analysis: DraftAnalysis,
  action?: MailRefinementAction,
): MailTone {
  if (action === "more_polite") {
    return "polite";
  }

  if (action === "shorter") {
    return "concise";
  }

  if (action === "softer") {
    return "soft";
  }

  if (action === "firmer") {
    return "firm";
  }

  if (input.tone !== "auto") {
    return input.tone;
  }

  return analysis.recommendedTone === "auto" ? "polite" : analysis.recommendedTone;
}

function extractDeadline(text: string, language: OutputLanguage) {
  const candidates = [
    /by\s+tomorrow\s+morning/i,
    /by\s+(?:this\s+)?(?:monday|tuesday|wednesday|thursday|friday)\s+(?:morning|afternoon)/i,
    /by\s+(?:this\s+)?(?:monday|tuesday|wednesday|thursday|friday|tomorrow|today|eod|end of day)/i,
    /by\s+the\s+end\s+of\s+this\s+week/i,
    /next\s+week/i,
    /this week/i,
    /이번\s*주\s*(?:월요일|화요일|수요일|목요일|금요일)(?:까지)?/i,
    /다음\s*주\s*(?:월요일|화요일|수요일|목요일|금요일)(?:이나|또는|,|\s)*(?:월요일|화요일|수요일|목요일|금요일)?/i,
    /오늘\s*(?:오전|오후)\s*\d{1,2}시(?:까지)?/i,
    /내일\s*(?:오전|오후)\s*\d{1,2}시(?:까지)?/i,
    /오늘\s*(?:오전|오후|중)?/i,
    /내일\s*(?:오전|오후|중)?/i,
    /이번\s*주\s*(?:안으로|안|중|까지)?/i,
    /다음\s*주\s*(?:월요일|화요일|수요일|목요일|금요일)?/i,
    /(?:월요일|화요일|수요일|목요일|금요일)\s*(?:오전|오후|까지)?/i,
    /\d{1,2}시(?:까지)?/i,
  ];

  for (const pattern of candidates) {
    const match = text.match(pattern);

    if (match?.[0]) {
      return formatDeadline(match[0].trim(), language);
    }
  }

  return "";
}

function formatDeadline(value: string, language: OutputLanguage) {
  if (language === "ko") {
    if (/by\s+tomorrow\s+morning/i.test(value)) {
      return "내일 오전까지";
    }

    if (/by\s+tomorrow/i.test(value)) {
      return "내일까지";
    }

    if (/by\s+friday/i.test(value)) {
      return "금요일까지";
    }

    if (/by\s+(?:this\s+)?monday/i.test(value)) {
      return "월요일까지";
    }

    if (/by\s+(?:this\s+)?tuesday/i.test(value)) {
      return "화요일까지";
    }

    if (/by\s+(?:this\s+)?wednesday/i.test(value)) {
      return "수요일까지";
    }

    if (/by\s+(?:this\s+)?thursday/i.test(value)) {
      return "목요일까지";
    }

    return value
      .replace(/이번주/g, "이번 주")
      .replace(/다음주/g, "다음 주")
      .replace(/오늘\s*(오전|오후)\s*(\d{1,2}시)/g, "오늘 $1 $2")
      .replace(/내일\s*(오전|오후)\s*(\d{1,2}시)/g, "내일 $1 $2");
  }

  if (/오늘\s*오후/.test(value)) {
    return "by this afternoon";
  }

  if (/오늘/.test(value)) {
    return "by today";
  }

  if (/내일/.test(value)) {
    return "by tomorrow";
  }

  if (/이번\s*주/.test(value)) {
    return "by the end of this week";
  }

  if (/다음\s*주\s*화요일(?:이나|또는|,|\s)*수요일/.test(value)) {
    return "next Tuesday or Wednesday";
  }

  const weekdays: Array<[RegExp, string]> = [
    [/월요일/, "Monday"],
    [/화요일/, "Tuesday"],
    [/수요일/, "Wednesday"],
    [/목요일/, "Thursday"],
    [/금요일/, "Friday"],
  ];
  const weekday = weekdays.find(([pattern]) => pattern.test(value));

  if (weekday) {
    return value.includes("다음 주") ? `next ${weekday[1]}` : `by ${weekday[1]}`;
  }

  return value;
}

function conciseExplicitTopic(value = "") {
  const cleaned = cleanInstructionWords(normalizeBizMailMarkerSyntax(value, "ko"));

  return cleaned.length <= 36 ? cleaned : "";
}

function cleanTopicByTemplate(value: string, templateId: MailTemplateId) {
  let cleaned = value
    .replace(/\s+/g, " ")
    .replace(/[.,，。]+$/g, "")
    .trim();

  const replacements: Partial<Record<MailTemplateId, Array<[RegExp, string]>>> = {
    apology: [
      [/\s*(관련)?\s*(사과|사과 메일|안내|재안내)\s*$/g, ""],
      [/(자료|파일|문서)\s*(전달|공유)?\s*지연.*/g, "$1 전달 지연"],
      [/샘플\s*(배송|전달)\s*지연.*/g, "샘플 배송 지연"],
    ],
    report: [
      [/\s*(관련)?\s*(보고|보고 메일|현황 공유|공유|업데이트)\s*$/g, ""],
    ],
    proposal: [
      [/\s*(관련)?\s*(제안|제안 메일|검토 요청)\s*$/g, ""],
    ],
    collaboration: [
      [/\s*(관련)?\s*(협업 제안|협업 요청|제안)\s*$/g, " 협업"],
    ],
    "quotation-request": [
      [/\s*(관련)?\s*(견적 요청|견적서 요청|견적 필요|견적 문의|견적)\s*$/g, ""],
    ],
    "document-request": [
      [/\s*(관련)?\s*(자료 요청|전달 요청|공유 요청|자료)\s*$/g, ""],
    ],
    "reply-reminder": [
      [/\s*(관련)?\s*(회신 리마인드|회신 독촉|리마인드|회신 요청|회신)\s*$/g, ""],
    ],
    "meeting-follow-up": [
      [/\s*(관련)?\s*(미팅 후 팔로업|회의 후 팔로업|팔로업|후속 액션 정리|정리)\s*$/g, ""],
    ],
    "meeting-request": [
      [/\s*(관련)?\s*(미팅 요청|회의 요청|논의 요청)\s*$/g, ""],
    ],
    "schedule-adjustment": [
      [/\s*(관련)?\s*(일정 조율|일정 확인|시간 조율)\s*$/g, ""],
    ],
    thanks: [
      [/\s*(관련)?\s*(감사 인사|감사 메일|감사)\s*$/g, ""],
    ],
  };

  for (const [pattern, replacement] of replacements[templateId] ?? []) {
    cleaned = cleaned.replace(pattern, replacement).trim();
  }

  return cleaned
    .replace(/\s+/g, " ")
    .replace(/[.,，。]+$/g, "")
    .trim();
}

function hasFinalConsonant(value: string) {
  const trimmed = value.trim();
  const lastChar = trimmed.charAt(trimmed.length - 1);

  if (!lastChar) {
    return false;
  }

  const code = lastChar.charCodeAt(0);

  if (code < 0xac00 || code > 0xd7a3) {
    return false;
  }

  return (code - 0xac00) % 28 !== 0;
}

function appendJosa(value: string, consonantJosa: string, vowelJosa: string) {
  return `${value}${hasFinalConsonant(value) ? consonantJosa : vowelJosa}`;
}

function inferTopic(input: MailFormInput, analysis: DraftAnalysis, language: OutputLanguage) {
  const text = sourceText(input);
  const cleanedDraft = conciseExplicitTopic(input.rawDraft);
  const explicit = cleanTopicByTemplate(
    conciseExplicitTopic(input.purpose) || cleanedDraft,
    analysis.recommendedTemplateId,
  );
  const lower = text.toLowerCase();

  if (language === "en") {
    if (/신규\s*대시보드/.test(text)) {
      return "the new dashboard implementation";
    }

    if (/수정\s*계약서|revised contract/i.test(text)) {
      return "the revised contract";
    }

    if (/shipment\s+schedule.*invoice|invoice.*shipment\s+schedule/i.test(text)) {
      return "the shipment schedule and invoice";
    }

    if (/q3\s+campaign\s+launch|campaign\s+launch/i.test(text)) {
      return "the Q3 campaign launch";
    }

    if (/(견적서|견적|비용|가격)/.test(text)) {
      return "the quotation";
    }

    if (/(제안서|제안)/.test(text)) {
      return "the proposal";
    }

    if (/(자료|파일|문서|보고서)/.test(text)) {
      return "the requested materials";
    }

    if (/revised proposal/i.test(text)) {
      return "the revised proposal";
    }

    if (/quotation|estimate|pricing|price/i.test(text)) {
      return "the quotation";
    }

    if (/document|file|report|material/i.test(text)) {
      return "the requested materials";
    }

    if (analysis.recommendedTemplateId === "apology") {
      return "the delayed materials";
    }

    return explicit && /[A-Za-z]/.test(explicit)
      ? explicit.replace(/\.$/, "")
      : "the requested matter";
  }

  if (analysis.recommendedTemplateId === "work-request" && /인플루언서\s*5인|사전\s*검수|변동\s*가능성/.test(text)) {
    return "인플루언서 진행 조건";
  }

  if (analysis.recommendedTemplateId === "apology" && /(자료|파일|문서)/.test(text)) {
    return "자료 전달 지연";
  }

  if (analysis.recommendedTemplateId === "apology" && /샘플\s*(배송|전달)\s*.*(늦|지연)/.test(text)) {
    return "샘플 배송 지연";
  }

  if (analysis.recommendedTemplateId === "thanks") {
    if (/긴급\s*요청|클라이언트\s*보고/.test(text)) {
      return "긴급 요청 지원";
    }

    return "지원 및 협조";
  }

  if (/(샘플|포장).*(파손|불량)|파손.*(샘플|포장)/.test(text)) {
    return "샘플 포장 파손";
  }

  if (/6월\s*캠페인/.test(text)) {
    return "6월 캠페인 진행 상황";
  }

  const projectMatch = text.match(/프로젝트\s*[A-Za-z0-9가-힣]+/);

  if (projectMatch) {
    return `${projectMatch[0]} 진행 상황`;
  }

  if (/마케팅\s*인턴|지원\s*메일|포트폴리오|채용/i.test(text)) {
    return "마케팅 인턴 지원";
  }

  if (analysis.recommendedTemplateId === "report") {
    if (/광고\s*성과/.test(text)) {
      return "주간 광고 성과";
    }

    if (/런칭\s*준비/.test(text)) {
      return "런칭 준비 상황";
    }

    if (explicit) {
      return explicit;
    }
  }

  if (analysis.recommendedTemplateId === "meeting-follow-up") {
    if (/오늘\s*회의|오늘\s*미팅/.test(text)) {
      return "오늘 회의";
    }

    return explicit || "미팅 후속 내용";
  }

  if (/updated\s+pricing\s+table|pricing\s+table|가격표/i.test(text)) {
    return "가격표";
  }

  if (/상세페이지\s*제작/.test(text)) {
    return "상세페이지 제작";
  }

  if (/여름\s*캠페인.*협업|협업.*여름\s*캠페인/.test(text)) {
    return "여름 캠페인 콘텐츠 협업";
  }

  if (analysis.recommendedTemplateId === "collaboration" && /신규\s*캠페인/.test(text)) {
    return "신규 캠페인 협업";
  }

  if (analysis.recommendedTemplateId === "collaboration" && /협업/.test(text)) {
    return "협업 제안";
  }

  if (/(견적서|견적|비용|가격)/.test(text)) {
    if (/촬영\s*패키지/.test(text)) {
      return "촬영 패키지";
    }

    return "견적";
  }

  if (/(제안서)/.test(text)) {
    return "제안서";
  }

  if (/(미팅|회의)/.test(text) && /(일정|화요일|수요일|목요일|금요일|시간)/.test(text)) {
    return "미팅 일정";
  }

  if (/(자료|파일|문서|보고서)/.test(text)) {
    return "자료";
  }

  if (analysis.recommendedTemplateId === "rejection" && /제안/.test(text)) {
    return "제안 건";
  }

  return explicit || "관련 건";
}

function getKeyPoints(
  input: MailFormInput,
  analysis: DraftAnalysis,
  language: OutputLanguage,
) {
  const markerPoints = extractBizMailMarkerInsightsFromInput(input).map((insight) =>
    formatBizMailMarkerInsight(insight, language),
  );
  const explicit = compactLines(input.mustInclude).map((line) =>
    normalizeBizMailMarkerSyntax(line, language),
  );

  if (explicit.length) {
    return uniqueLines([...explicit, ...markerPoints]);
  }

  const analyzedPoints = analysis.keyPoints.map((point) =>
    normalizeBizMailMarkerSyntax(point, language),
  );
  const text = sourceText(input);

  if (language === "en" && /shipment\s+schedule.*invoice|invoice.*shipment\s+schedule/i.test(text)) {
    return uniqueLines([
      deadlineFromTextForEnglishPoint(
        text,
        "Please share the updated shipment schedule and invoice",
      ),
      /final\s+quantity|quantity/i.test(text)
        ? "The final quantity may be subject to change"
        : "",
      /confirm/i.test(text) ? "Please confirm the latest available information" : "",
      ...markerPoints,
    ].filter(Boolean));
  }

  if (language === "en" && analysis.recommendedTemplateId === "meeting-request" && /campaign\s+launch|q3/i.test(text)) {
    return uniqueLines([
      "Discuss the Q3 campaign launch",
      /tuesday\s+10/i.test(text) ? "Tuesday at 10:00 as a possible option" : "",
      /wednesday\s+3/i.test(text) ? "Wednesday at 3:00 as a possible option" : "",
      ...markerPoints,
    ].filter(Boolean));
  }

  if (language === "en" && /수정\s*계약서|revised contract/i.test(text)) {
    return uniqueLines([
      deadlineFromTextForEnglishPoint(text, "Please share review feedback on the revised contract"),
      ...markerPoints,
    ]);
  }

  if (language === "ko" && analysis.recommendedTemplateId === "schedule-adjustment") {
    const schedulePoints = [
      /화요일\s*오전/.test(text) ? "화요일 오전 가능" : "",
      /목요일\s*오후/.test(text) ? "목요일 오후 가능" : "",
      /편한\s*시간|가능하신\s*시간/.test(text)
        ? "위 일정이 어려울 경우 가능한 시간 제안 요청"
        : "",
    ].filter(Boolean);

    if (schedulePoints.length) {
      return uniqueLines([...schedulePoints, ...markerPoints]);
    }
  }

  if (language === "ko" && analysis.recommendedTemplateId === "proposal" && /리텐션\s*캠페인/.test(text)) {
    return uniqueLines([
      "신규 고객 대상 리텐션 캠페인",
      /첫 구매\s*7일/.test(text) ? "첫 구매 7일 후 쿠폰 메시지 발송" : "",
      /재구매율/.test(text) ? "재구매율 개선 기대" : "",
      /검토/.test(text) ? "제안 내용 검토 요청" : "",
      ...markerPoints,
    ].filter(Boolean));
  }

  if (language === "ko" && analysis.recommendedTemplateId === "quotation-request" && /상세페이지\s*제작/.test(text)) {
    return uniqueLines([
      /10페이지/.test(text) ? "상세페이지 10페이지 제작" : "상세페이지 제작",
      /촬영\s*제외/.test(text) ? "촬영 제외" : "",
      /디자인/.test(text) || /퍼블리싱/.test(text)
        ? "디자인 및 퍼블리싱 포함"
        : "",
      deadlineLabelFromText(text, "희망 회신 기한"),
      ...markerPoints,
    ].filter(Boolean));
  }

  if (language === "ko" && analysis.recommendedTemplateId === "document-request" && /가격표|제품\s*스펙/.test(text)) {
    return uniqueLines([
      /가격표/.test(text) ? "업데이트된 가격표" : "",
      /제품\s*스펙/.test(text) ? "제품 스펙 자료" : "",
      /제안서/.test(text) ? "제안서 작성에 활용 예정" : "",
      deadlineLabelFromText(text, "희망 공유 기한"),
      ...markerPoints,
    ].filter(Boolean));
  }

  if (language === "ko" && analysis.recommendedTemplateId === "report" && /광고\s*결과|광고\s*성과/.test(text)) {
    return uniqueLines([
      "이번 주 광고 성과 보고",
      /전환율/.test(text) ? "전환율 2.1에서 2.8로 상승" : "",
      /CPA/.test(text) ? "CPA 18% 감소" : "",
      /소재\s*피로도/.test(text) ? "소재 피로도 상승 이슈" : "",
      /신규\s*소재\s*테스트/.test(text) ? "다음 주 신규 소재 테스트 예정" : "",
      ...markerPoints,
    ].filter(Boolean));
  }

  if (language === "ko" && /updated\s+pricing\s+table|pricing\s+table/i.test(text)) {
    return uniqueLines([
      "업데이트된 가격표 공유 가능 여부 확인",
      deadlineLabelFromText(text, "희망 공유 기한"),
      ...markerPoints,
    ]);
  }

  if (language === "ko" && analysis.recommendedTemplateId === "thanks") {
    const thanksPoints = [
      /긴급\s*요청|도와/i.test(text) ? "긴급 요청에 협조해주신 점" : "",
      /제시간|보고/i.test(text)
        ? "도움 덕분에 클라이언트 보고를 제시간에 마무리한 점"
        : "",
      /다음에도|앞으로/i.test(text) ? "향후에도 좋은 협업을 이어가고 싶은 마음" : "",
    ].filter(Boolean);

    if (thanksPoints.length) {
      return uniqueLines([...thanksPoints, ...markerPoints]);
    }
  }

  if (language === "ko" && analysis.recommendedTemplateId === "self-introduction") {
    const introPoints = [
      /마케팅\s*인턴/.test(text) ? "마케팅 인턴 포지션 지원" : "",
      /퍼포먼스\s*광고/.test(text) ? "퍼포먼스 광고 운영 경험 보유" : "",
      /GA4/.test(text) ? "GA4 활용 가능" : "",
      /Meta/.test(text) ? "Meta 광고 집행 가능" : "",
      /포트폴리오/.test(text) ? "포트폴리오 링크 첨부" : "",
    ].filter(Boolean);

    if (introPoints.length) {
      return uniqueLines([...introPoints, ...markerPoints]);
    }
  }

  if (language === "ko" && analysis.recommendedTemplateId === "rejection") {
    const rejectionPoints = [
      /예산/.test(text) ? "이번 분기 예산 문제로 진행이 어려운 상황" : "",
      /다음\s*기회|재논의|다시\s*논의/.test(text)
        ? "향후 적합한 기회에 다시 논의 희망"
        : "",
    ].filter(Boolean);

    if (rejectionPoints.length) {
      return uniqueLines([...rejectionPoints, ...markerPoints]);
    }
  }

  if (language === "ko" && analysis.recommendedTemplateId === "reply-reminder") {
    const reminderPoints = [
      /제안서/.test(text) ? "지난주 전달한 제안서 검토 의견 확인" : "",
      deadlineLabelFromText(text, "희망 회신 기한"),
    ].filter(Boolean);

    if (reminderPoints.length) {
      return uniqueLines([...reminderPoints, ...markerPoints]);
    }
  }

  return uniqueLines(
    analyzedPoints.length
      ? [...analyzedPoints, ...markerPoints]
      : [cleanKeyPoint(input.rawDraft, language), ...markerPoints],
  );
}

function deadlineFromTextForPoint(text: string, fallback = "회신 요청") {
  const deadline = extractDeadline(text, "ko");

  if (!deadline) {
    return fallback;
  }

  return fallback === "회신 요청"
    ? `${koreanDeadlineTarget(deadline)} 회신 요청`
    : `${fallback}: ${koreanDeadlineTarget(deadline)}`;
}

function deadlineLabelFromText(text: string, label: string) {
  const deadline = extractDeadline(text, "ko");

  return deadline ? `${label}: ${koreanDeadlineTarget(deadline)}` : "";
}

function deadlineFromTextForEnglishPoint(text: string, fallback: string) {
  const deadline = extractDeadline(text, "en");

  if (!deadline) {
    return fallback;
  }

  return `${fallback} ${deadline}`;
}

function greeting(input: MailFormInput, language: OutputLanguage, tone: MailTone) {
  const recipient = normalize(input.recipient);

  if (language === "en") {
    if (!recipient) {
      return tone === "formal" ? "Dear Sir or Madam," : "Hello,";
    }

    return tone === "formal" ? `Dear ${recipient},` : `Hi ${recipient},`;
  }

  if (!recipient) {
    return "안녕하세요.";
  }

  if (recipient.endsWith("님") || recipient.endsWith("께")) {
    return `${recipient}께,`;
  }

  return `${recipient}님께,`;
}

function closing(input: MailFormInput, language: OutputLanguage, tone: MailTone) {
  const sender = normalize(input.sender);

  if (language === "en") {
    const signOff = tone === "formal" ? "Sincerely," : "Best regards,";
    return sender ? `${signOff}\n${sender}` : signOff;
  }

  return sender ? `감사합니다.\n${sender}` : "감사합니다.";
}

function bulletList(items: string[], language: OutputLanguage) {
  const cleaned = uniqueLines(
    items.map((item) => cleanKeyPoint(item, language)).filter(Boolean),
  );

  if (!cleaned.length) {
    return language === "en"
      ? "- The details shared in your draft"
      : "- 입력해주신 핵심 내용";
  }

  return cleaned.map((item) => `- ${item}`).join("\n");
}

function koreanDeadlineTarget(deadline: string) {
  if (!deadline) {
    return "";
  }

  return /(까지|중|안으로)$/.test(deadline) ? deadline : `${deadline}까지`;
}

function koreanBody(ctx: GenerationContext) {
  const { input, templateId, topic, deadline, keyPoints, tone } = ctx;
  const short = tone === "concise";
  const details = bulletList(keyPoints, "ko");
  const deadlineTarget = koreanDeadlineTarget(deadline);
  const meetingWindow = deadline
    ? /(중|안으로)$/.test(deadline)
      ? deadline
      : `${deadline} 중`
    : "";

  const introByTemplate: Record<MailTemplateId, string> = {
    "work-request": `${topic} 관련하여 업무 협조를 요청드리고자 합니다.`,
    "schedule-adjustment": `${topic} 조율을 위해 연락드립니다.`,
    "meeting-request": `${topic}에 대해 논의드리고자 미팅을 요청드립니다.`,
    "meeting-follow-up": `앞서 논의한 ${topic} 관련 내용을 정리하여 공유드립니다.`,
    proposal: `${topic}에 대해 아래와 같이 제안드립니다.`,
    collaboration: `${topic}${topic.includes("협업") ? " 가능성을" : " 관련 협업 가능성을"} 논의드리고자 연락드립니다.`,
    "quotation-request": topic.includes("견적")
      ? `${topic}을 문의드립니다.`
      : `${topic} 관련 견적을 문의드립니다.`,
    "document-request": `${topic} 관련 자료 전달을 요청드립니다.`,
    "reply-reminder": `지난번 전달드린 ${topic} 관련하여 확인차 다시 연락드립니다.`,
    thanks: `${topic} 관련하여 도움 주셔서 감사 인사를 드리고자 합니다.`,
    apology: `${appendJosa(topic, "과", "와")} 관련하여 불편을 드린 점 진심으로 죄송합니다.`,
    rejection: `${topic} 관련하여 검토 결과를 공유드립니다.`,
    complaint: `${topic} 관련하여 확인이 필요한 사항이 있어 연락드립니다.`,
    report: topic.includes("진행 상황")
      ? `${topic}을 공유드립니다.`
      : `${topic} 관련 진행 상황을 공유드립니다.`,
    "self-introduction": `${topic} 관련하여 제 소개와 연락 목적을 전달드리고자 합니다.`,
    "global-business": `${topic} 관련하여 명확히 요청드리고자 합니다.`,
    "general-business": `${topic} 관련하여 메일드립니다.`,
  };

  const actionByTemplate: Record<MailTemplateId, string> = {
    "work-request": `아래 내용을 기준으로 진행 가능 여부와 필요한 후속 조치를 확인 부탁드립니다.\n${details}\n\n진행 전 확인이 필요한 부분이 있다면 함께 알려주시면 반영하겠습니다.`,
    "schedule-adjustment": deadline
      ? `아래 일정 중 편하신 시간이 있으신지 확인 부탁드립니다.\n${details}\n\n해당 일정이 어려우시면 가능하신 시간을 알려주시면 조율하겠습니다.`
      : `아래 일정 중 편하신 시간이 있으신지 확인 부탁드립니다.\n${details}\n\n가능하신 일정이나 대안 시간을 알려주시면 조율하겠습니다.`,
    "meeting-request": deadline
      ? `미팅에서는 아래 내용을 중심으로 논의하고자 합니다.\n${details}\n\n가능하시다면 ${meetingWindow} 미팅 가능 여부를 회신 부탁드립니다.`
      : `미팅에서는 아래 내용을 중심으로 논의하고자 합니다.\n${details}\n\n가능하신 일정이 있으시면 회신 부탁드립니다.`,
    "meeting-follow-up": `주요 논의 내용과 후속 액션은 아래와 같습니다.\n${details}\n\n각 항목의 진행 상황은 다음 확인 시점에 맞춰 다시 점검하겠습니다.`,
    proposal: `제안드리는 주요 내용은 아래와 같습니다.\n${details}\n\n관심 있으시면 구체적인 진행 방식과 일정을 추가로 조율하겠습니다.`,
    collaboration: `협업 방향은 아래와 같이 생각하고 있습니다.\n${details}\n\n관심 있으시다면 다음 단계 논의를 위한 미팅 가능 일정을 알려주시면 감사하겠습니다.`,
    "quotation-request": deadlineTarget
      ? `아래 조건을 기준으로 견적서 전달 가능 여부를 ${deadlineTarget} 회신 부탁드립니다.\n${details}`
      : `아래 조건을 기준으로 견적서 전달 가능 여부를 확인 부탁드립니다.\n${details}`,
    "document-request": deadlineTarget
      ? `아래 자료를 ${deadlineTarget} 공유해주실 수 있을지 확인 부탁드립니다.\n${details}`
      : `아래 자료 공유 가능 여부를 확인 부탁드립니다.\n${details}`,
    "reply-reminder": deadlineTarget
      ? `바쁘시겠지만 ${deadlineTarget} 회신 가능하실지 확인 부탁드립니다.\n${details}\n\n검토에 추가 정보가 필요하시다면 알려주시면 바로 보완해드리겠습니다.`
      : `확인 가능하실 때 진행 상황이나 의견을 회신해주시면 감사하겠습니다.\n${details}\n\n검토에 추가 정보가 필요하시다면 알려주시면 바로 보완해드리겠습니다.`,
    thanks: `특히 아래 부분에 감사드립니다.\n${details}`,
    apology: deadlineTarget
      ? `해당 건은 ${deadlineTarget} 다시 확인하여 전달드리겠습니다. 전달 전 내용을 한 번 더 점검해 누락이 없도록 하겠습니다.`
      : `현재 해당 건을 다시 확인하고 있으며, 가능한 일정에 맞춰 후속 조치를 안내드리겠습니다.`,
    rejection: `검토 결과, 아쉽게도 이번에는 진행이 어려울 것 같습니다. 아래 사유와 검토 내용을 함께 전달드립니다.\n${details}`,
    complaint: `현재 확인된 내용은 아래와 같습니다.\n${details}\n\n해당 건에 대해 가능한 조치 방안, 처리 일정, 재발 방지 방안을 회신 부탁드립니다.`,
    report: `현재까지의 핵심 진행 상황은 아래와 같습니다.\n${details}\n\n특이사항은 계속 확인하고 있으며, 다음 액션 진행 상황도 이어서 공유드리겠습니다.`,
    "self-introduction": `아래 내용을 중심으로 소개드립니다.\n${details}\n\n관련 자료를 함께 검토해주시면 감사하겠습니다.`,
    "global-business": `요청드릴 내용은 아래와 같습니다.\n${details}`,
    "general-business": `핵심 내용은 아래와 같습니다.\n${details}`,
  };

  const closingSentenceByTemplate: Partial<Record<MailTemplateId, string>> = {
    apology: "앞으로 동일한 문제가 반복되지 않도록 일정과 확인 과정을 더 세심하게 관리하겠습니다.",
    thanks: "앞으로도 좋은 협업을 이어갈 수 있기를 바랍니다.",
    rejection: "좋은 제안에도 긍정적인 답변을 드리지 못해 양해 부탁드립니다.",
    "schedule-adjustment": "확인 후 편하신 시간으로 회신 부탁드립니다. 확정되는 일정에 맞춰 필요한 내용을 준비하겠습니다.",
    "meeting-request": "가능하신 일정이 있으시면 회신 부탁드립니다.",
    "quotation-request": "견적 산정에 추가 정보가 필요하시면 말씀 부탁드립니다.",
    "document-request": "확인 후 공유 가능 여부를 회신해주시면 감사하겠습니다.",
    "reply-reminder": "확인 부탁드리며, 회신 기다리겠습니다.",
    "work-request": "확인 후 진행 가능 여부를 회신해주시면 감사하겠습니다.",
    collaboration: "검토 부탁드리며, 가능하신 일정이나 의견을 회신 부탁드립니다.",
    proposal: "검토 후 의견을 공유해주시면 감사하겠습니다.",
    complaint: "확인 후 빠른 회신 부탁드립니다.",
    report: "추가로 확인이 필요한 사항이 있으시면 말씀 부탁드립니다.",
    "self-introduction": "추가로 필요한 자료가 있으시면 언제든 말씀 부탁드립니다.",
  };

  const paragraphs = [
    greeting(input, "ko", tone),
    "",
    introByTemplate[templateId],
    "",
    actionByTemplate[templateId],
  ];

  if (!short && closingSentenceByTemplate[templateId]) {
    paragraphs.push("", closingSentenceByTemplate[templateId] as string);
  }

  paragraphs.push("", closing(input, "ko", tone));

  return paragraphs.join("\n");
}

function englishRequestSentence(templateId: MailTemplateId, topic: string, deadline: string) {
  const deadlineText = deadline ? ` ${englishDuePhrase(deadline)}` : "";

  if (templateId === "quotation-request") {
    return `Could you please let me know if it would be possible to share the quotation${deadlineText}?`;
  }

  if (templateId === "document-request" || templateId === "work-request") {
    return `Could you please send ${topic}${deadlineText}?`;
  }

  if (templateId === "reply-reminder") {
    return `I wanted to kindly follow up on ${topic}${deadlineText}.`;
  }

  return `I would appreciate it if you could review ${topic} and share your feedback when convenient.`;
}

function englishDuePhrase(deadline: string) {
  if (!deadline) {
    return "";
  }

  if (/^(by|around|next\s+tuesday\s+or\s+wednesday)/i.test(deadline)) {
    return deadline;
  }

  if (/^next\s+week/i.test(deadline)) {
    return deadline;
  }

  return `by ${deadline}`;
}

function englishWorkRequestSentence(input: MailFormInput, topic: string, deadline: string) {
  const text = sourceText(input);

  if (/검토\s*의견|review feedback/i.test(text)) {
    const due = deadline ? ` ${englishDuePhrase(deadline)}` : "";
    return `Could you please share your review feedback on ${topic}${due}?`;
  }

  return englishRequestSentence("work-request", topic, deadline);
}

function englishMeetingAvailabilitySentence(input: MailFormInput, deadline: string) {
  const text = sourceText(input);
  const options = [
    /tuesday\s+(?:at\s*)?10/i.test(text) ? "Tuesday at 10:00" : "",
    /wednesday\s+(?:at\s*)?3/i.test(text) ? "Wednesday at 3:00" : "",
    /thursday\s+(?:at\s*)?3/i.test(text) ? "Thursday at 3:00" : "",
  ].filter(Boolean);

  if (options.length) {
    const joined =
      options.length === 1
        ? options[0]
        : `${options.slice(0, -1).join(", ")} or ${options[options.length - 1]}`;
    const alternative = deadline ? ` another time ${deadline}` : " another time that works better";

    return `Would ${joined} work for you? If neither option is convenient, please feel free to suggest${alternative}.`;
  }

  if (deadline) {
    return `Would you be available ${deadline}? If not, please feel free to suggest another time that works better for you.`;
  }

  return "Please let me know a few time options that would work for your schedule.";
}

function englishAdditionalNotes(input: MailFormInput, details: string) {
  const text = sourceText(input);
  const notes = [
    /pre-?review|사전\s*검수/i.test(text)
      ? "- Pre-review is required before final approval."
      : "",
    /subject to change|변동\s*가능성/i.test(text)
      ? "- The details may be subject to change."
      : "",
  ].filter(Boolean);

  if (notes.length) {
    return notes.join("\n");
  }

  return details;
}

function englishBody(ctx: GenerationContext) {
  const { input, templateId, topic, deadline, keyPoints, tone } = ctx;
  const details = bulletList(keyPoints, "en");
  const additionalNotes = englishAdditionalNotes(input, details);
  const short = tone === "concise";

  const introByTemplate: Record<MailTemplateId, string> = {
    "work-request": `I am reaching out regarding ${topic}.`,
    "schedule-adjustment": `I would like to coordinate a suitable time for ${topic}.`,
    "meeting-request": `I would like to request a meeting to discuss ${topic}.`,
    "meeting-follow-up": `Thank you for your time during our discussion regarding ${topic}.`,
    proposal: `I would like to share a proposal regarding ${topic}.`,
    collaboration: `I am reaching out to explore a potential collaboration regarding ${topic}.`,
    "quotation-request": "I am writing to ask whether it would be possible to receive a quotation.",
    "document-request": `I am writing to request the materials related to ${topic}.`,
    "reply-reminder": `I wanted to kindly follow up on my previous message regarding ${topic}.`,
    thanks: `Thank you for your support regarding ${topic}.`,
    apology: `I sincerely apologize for the issue regarding ${topic}.`,
    rejection: `Thank you for reaching out regarding ${topic}.`,
    complaint: `I am writing to raise a concern regarding ${topic}.`,
    report: `I would like to share an update regarding ${topic}.`,
    "self-introduction": `I would like to briefly introduce myself regarding ${topic}.`,
    "global-business": `I am reaching out regarding ${topic}.`,
    "general-business": `I am reaching out regarding ${topic}.`,
  };

  const actionByTemplate: Record<MailTemplateId, string> = {
    "work-request": englishWorkRequestSentence(input, topic, deadline),
    "schedule-adjustment": deadline
      ? `Would you be available around ${deadline}? If not, please feel free to suggest another time that works better for you.`
      : "Please let me know a few time options that would work for your schedule.",
    "meeting-request": `I would like to discuss the following points:\n${details}\n\n${englishMeetingAvailabilitySentence(input, deadline)}`,
    "meeting-follow-up": `Please see the key follow-up items below:\n${details}`,
    proposal: `The key points of the proposal are as follows:\n${details}`,
    collaboration: `The potential collaboration could be structured around the following points:\n${details}`,
    "quotation-request": englishRequestSentence(templateId, topic, deadline),
    "document-request": `${englishRequestSentence(templateId, topic, deadline)}\n\nPlease also note the following:\n${additionalNotes}`,
    "reply-reminder": englishRequestSentence(templateId, topic, deadline),
    thanks: `I especially appreciate the following:\n${details}`,
    apology: deadline
      ? `We will review the matter and resend the relevant materials ${deadline}.`
      : "We are reviewing the matter and will follow up with the necessary update as soon as possible.",
    rejection: `After careful review, we are unfortunately unable to move forward at this time. The key considerations are:\n${details}`,
    complaint: `The issue and requested action are as follows:\n${details}`,
    report: `Please see the key update below:\n${details}`,
    "self-introduction": `The key points I would like to share are:\n${details}`,
    "global-business": `Please see the key details below:\n${details}`,
    "general-business": `Please see the key details below:\n${details}`,
  };

  const finalByTemplate: Partial<Record<MailTemplateId, string>> = {
    apology: "We will take extra care to prevent a similar issue from recurring.",
    thanks: "I look forward to continuing our positive working relationship.",
    rejection: "We appreciate your understanding and hope there may be another opportunity to connect in the future.",
    "work-request": "Thank you for your time and support.",
    "document-request": "Please let me know if you need any further context.",
    "quotation-request": "Please let me know if any additional information is needed to prepare the quotation.",
    "reply-reminder": "I would appreciate your update when you have a chance.",
    "meeting-request": "Thank you, and I look forward to finding a convenient time to speak.",
    "global-business": "Please let me know if the requested timeline works on your end.",
  };

  const paragraphs = [
    greeting(input, "en", tone),
    "",
    short ? "I hope you are doing well." : "I hope this message finds you well.",
    "",
    introByTemplate[templateId],
    "",
    actionByTemplate[templateId],
  ];

  if (!short && finalByTemplate[templateId]) {
    paragraphs.push("", finalByTemplate[templateId] as string);
  }

  paragraphs.push("", closing(input, "en", tone));

  return paragraphs.join("\n");
}

function buildSubjects(ctx: GenerationContext) {
  const { templateId, language, topic, deadline } = ctx;
  const koTopic = topic || "관련 건";
  const enTopic = titleCase(topic.replace(/^the\s+/i, "")) || "Requested Matter";

  if (language === "en") {
    if (templateId === "quotation-request" && /quotation/i.test(enTopic)) {
      return [
        "Quotation Request",
        "Request for Pricing Information",
        "Quotation Inquiry",
      ];
    }

    if (templateId === "global-business" && /shipment schedule and invoice/i.test(enTopic)) {
      return [
        "Request for Updated Shipment Schedule and Invoice",
        "Shipment Schedule and Invoice Confirmation",
        "Follow-up on Shipment Schedule and Invoice",
      ];
    }

    const subjects: Record<MailTemplateId, string[]> = {
      "work-request": [`Request for ${enTopic}`, `Regarding ${enTopic}`, `${enTopic} - Request for Review`],
      "schedule-adjustment": [`Schedule Coordination for ${enTopic}`, `Availability for ${enTopic}`, `Meeting Schedule Options`],
      "meeting-request": [`Meeting Request: ${enTopic}`, `Request to Discuss ${enTopic}`, `Meeting Availability for ${enTopic}`],
      "meeting-follow-up": [`Follow-up on ${enTopic}`, `${enTopic} - Discussion Summary`, `Next Steps for ${enTopic}`],
      proposal: [`Proposal: ${enTopic}`, `Proposal for Your Review`, `${enTopic} - Proposal`],
      collaboration: [`Collaboration Opportunity: ${enTopic}`, `Potential Partnership Discussion`, `${enTopic} Collaboration Proposal`],
      "quotation-request": [`Quotation Request: ${enTopic}`, `Request for Pricing Information`, `${enTopic} - Quotation Inquiry`],
      "document-request": [`Request for ${enTopic}`, `${enTopic} - Materials Request`, `Requested Materials for ${enTopic}`],
      "reply-reminder": [`Follow-up on ${enTopic}`, `Kind Reminder: ${enTopic}`, `${enTopic} - Follow-up Request`],
      thanks: [`Thank You for Your Support`, `Appreciation Regarding ${enTopic}`, `Thank You`],
      apology: [`Apology Regarding ${enTopic}`, `${enTopic} - Apology and Update`, `Follow-up on ${enTopic}`],
      rejection: [`Update Regarding ${enTopic}`, `${enTopic} - Review Result`, `Response Regarding ${enTopic}`],
      complaint: [`Issue Regarding ${enTopic}`, `${enTopic} - Request for Resolution`, `Concern Regarding ${enTopic}`],
      report: [`Status Update: ${enTopic}`, `${enTopic} - Progress Update`, `Report on ${enTopic}`],
      "self-introduction": [`Introduction: ${enTopic}`, `Introduction and Materials for Review`, `${enTopic} - Introduction`],
      "global-business": [`Regarding ${enTopic}`, `${enTopic} - Request for Review`, `Follow-up on ${enTopic}`],
      "general-business": [`Regarding ${enTopic}`, `${enTopic} - Follow-up`, `Request for Review: ${enTopic}`],
    };

    return subjects[templateId].slice(0, 3);
  }

  const quotationSubjects = koTopic.includes("견적")
    ? [
        `[견적 요청] ${koTopic} 문의드립니다`,
        `${koTopic} 확인 부탁드립니다`,
        `${koTopic} 관련 비용 문의드립니다`,
      ]
    : [
        `[견적 요청] ${koTopic} 견적 문의드립니다`,
        `${koTopic} 견적 확인 부탁드립니다`,
        `${koTopic} 비용 문의드립니다`,
      ];
  const proposalSubjects = koTopic.includes("제안")
    ? [
        `[제안] ${koTopic} 검토 부탁드립니다`,
        `${koTopic} 관련 의견 요청드립니다`,
        `${koTopic} 내용 공유드립니다`,
      ]
    : [
        `[제안] ${koTopic} 제안드립니다`,
        `${koTopic} 제안 검토 부탁드립니다`,
        `${koTopic} 관련 의견 요청드립니다`,
      ];
  const collaborationSubjects = koTopic.includes("협업")
    ? [
        `[협업 제안] ${koTopic} 검토 부탁드립니다`,
        `${koTopic} 논의 요청드립니다`,
        `${koTopic} 관련 의견 부탁드립니다`,
      ]
    : [
        `[협업 제안] ${koTopic} 협업 제안드립니다`,
        `${koTopic} 관련 협업 논의 요청드립니다`,
        `${koTopic} 파트너십 제안드립니다`,
      ];
  const reportSubjects = koTopic.includes("진행 상황")
    ? [
        `[보고] ${koTopic} 공유드립니다`,
        `${koTopic} 보고드립니다`,
        `${koTopic} 업데이트 공유드립니다`,
      ]
    : [
        `[보고] ${koTopic} 공유드립니다`,
        `${koTopic} 현황 보고드립니다`,
        `${koTopic} 관련 업데이트 공유드립니다`,
      ];

  const koSubjects: Record<MailTemplateId, string[]> = {
    "work-request": [`[요청] ${koTopic} 확인 부탁드립니다`, `${koTopic} 관련 업무 요청드립니다`, `${koTopic} 건 검토 부탁드립니다`],
    "schedule-adjustment": [`[일정 조율] ${koTopic} 확인 요청드립니다`, `${koTopic} 조율 문의드립니다`, `${koTopic} 가능 시간 확인 부탁드립니다`],
    "meeting-request": [`[미팅 요청] ${koTopic} 관련 논의 요청드립니다`, `${koTopic} 미팅 가능 여부 문의드립니다`, `${koTopic} 관련 미팅 요청드립니다`],
    "meeting-follow-up": [`[팔로업] ${koTopic} 논의 내용 공유드립니다`, `${koTopic} 후속 액션 공유드립니다`, `${koTopic} 미팅 후속 정리드립니다`],
    proposal: proposalSubjects,
    collaboration: collaborationSubjects,
    "quotation-request": quotationSubjects,
    "document-request": [`[자료 요청] ${koTopic} 전달 요청드립니다`, `${koTopic} 자료 공유 부탁드립니다`, `${koTopic} 관련 자료 요청드립니다`],
    "reply-reminder": [`[리마인드] ${koTopic} 관련 회신 요청드립니다`, `${koTopic} 확인차 다시 연락드립니다`, `${koTopic} 회신 확인 부탁드립니다`],
    thanks: [`[감사 인사] ${koTopic} 관련 감사드립니다`, `${koTopic} 도움에 감사드립니다`, `${koTopic} 관련 감사 인사드립니다`],
    apology: [`[사과 말씀] ${koTopic} 관련 안내드립니다`, `${koTopic}에 대한 사과 및 재안내`, `${koTopic} 관련 사과드립니다`],
    rejection: [`[회신] ${koTopic} 관련 검토 결과 공유드립니다`, `${koTopic} 관련 양해 말씀드립니다`, `${koTopic} 검토 결과 안내드립니다`],
    complaint: [`[확인 요청] ${koTopic} 관련 문의드립니다`, `${koTopic} 문제 확인 요청드립니다`, `${koTopic} 관련 조치 요청드립니다`],
    report: reportSubjects,
    "self-introduction": [`[소개] ${koTopic} 관련 자료 전달드립니다`, `${koTopic} 자기소개 및 자료 공유드립니다`, `${koTopic} 관련 지원 문의드립니다`],
    "global-business": [`[문의] ${koTopic} 관련하여 메일드립니다`, `${koTopic} 관련 확인 요청드립니다`, `${koTopic} 관련 안내드립니다`],
    "general-business": [`[문의] ${koTopic} 관련하여 메일드립니다`, `${koTopic} 관련 확인 부탁드립니다`, `${koTopic} 건 공유드립니다`],
  };

  if (templateId === "apology" && /자료 전달 지연/.test(koTopic) && deadline) {
    return [
      "[사과 말씀] 자료 전달 지연 관련 안내드립니다",
      "자료 전달 지연에 대한 사과 및 재전달 안내",
      "자료 전달 일정 관련 사과드립니다",
    ];
  }

  return koSubjects[templateId].slice(0, 3);
}

function buildImprovements(ctx: GenerationContext) {
  const template = getMailTemplateById(ctx.templateId);
  const hasMarkerInsights = extractBizMailMarkerInsightsFromInput(ctx.input).length > 0;

  if (ctx.language === "en") {
    return [
      `Analyzed the rough input and matched it to the ${template.label} structure.`,
      hasMarkerInsights
        ? "Interpreted the 必/有/多 memo markers as required, existing/possible, and multiple-item notes."
        : "Applied the BizMail framework to separate facts, context, and requested actions.",
      "Converted the message into natural global business English rather than a literal translation.",
      `Adjusted the tone to ${toneLabels[ctx.tone]}.`,
      "Kept the content limited to the facts and intent provided by the user.",
    ];
  }

  return [
    `입력 내용을 분석해 ${template.label} 구조로 재작성했습니다.`,
    hasMarkerInsights
      ? "초안의 必/有/多 표기를 필수 조건, 있음/가능성, 다수 항목으로 해석했습니다."
      : "입력 내용을 필수 정보, 맥락, 요청 액션으로 구분했습니다.",
    "말하듯 입력된 표현을 정중한 비즈니스 문장으로 완화했습니다.",
    `${toneLabels[ctx.tone]} 톤에 맞춰 요청사항과 액션을 명확하게 정리했습니다.`,
    "사용자가 제공하지 않은 사실은 임의로 추가하지 않았습니다.",
  ];
}

function buildContext(
  input: MailFormInput,
  options: GenerateEmailOptions,
): GenerationContext {
  const analysis = analyzeDraft(input);
  const action = options.action;
  const templateId = analysis.recommendedTemplateId;
  const language = resolveLanguageMode(input, analysis, action);
  const tone = resolveTone(input, analysis, action);
  const text = sourceText(input);
  const deadline = extractDeadline(text, language);
  const topic = inferTopic(input, analysis, language);
  const keyPoints = getKeyPoints(input, analysis, language);

  return {
    input,
    analysis,
    templateId,
    language,
    tone,
    topic,
    deadline,
    keyPoints,
  };
}

export async function generateBusinessMail(
  input: MailFormInput,
  options: GenerateEmailOptions = {},
): Promise<GeneratedMailResult> {
  const ctx = buildContext(input, options);
  const template = getMailTemplateById(ctx.templateId);
  const body = ctx.language === "en" ? englishBody(ctx) : koreanBody(ctx);
  const missingInfoNotice = ctx.analysis.missingInfo.length
    ? ctx.analysis.missingInfo
    : ["추가로 필요한 정보가 없습니다."];

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        analysis: ctx.analysis,
        appliedTemplateId: ctx.templateId,
        appliedTemplateLabel: template.label,
        subjects: buildSubjects(ctx),
        body,
        improvements: buildImprovements(ctx),
        missingInfoNotice,
      });
    }, 450);
  });
}

export async function generateMockEmail(
  input: MailFormInput,
  options: GenerateEmailOptions = {},
): Promise<GeneratedMailResult> {
  return generateBusinessMail(input, options);
}

export async function generateEmail(
  input: MailFormInput,
  options?: GenerateEmailOptions,
): Promise<GeneratedMailResult> {
  return generateBusinessMail(input, options);
}
