import { mailCases, toneOptions } from "@/data/mailOptions";
import type {
  GenerateEmailOptions,
  GeneratedMailResult,
  MailCase,
  MailFormInput,
  MailLanguage,
  MailRefinementAction,
  MailTone,
} from "@/types/mail";

type OutputLanguage = "ko" | "en";

interface MailContent {
  recipient: string;
  purpose: string;
  keyPoints: string[];
  draft: string;
  additionalRequests: string;
}

interface SectionTemplate {
  title: string;
  build: (content: MailContent, tone: MailTone, variant: number) => string;
}

interface CaseTemplate {
  ko: SectionTemplate[];
  en: SectionTemplate[];
}

const UNKNOWN_KO = "입력해주신 내용";
const UNKNOWN_EN = "the details you shared";

const englishCaseLabels: Record<MailCase, string> = {
  work_request: "Work Request",
  schedule_coordination: "Schedule Coordination",
  meeting_request: "Meeting Request",
  meeting_follow_up: "Meeting Follow-up",
  proposal: "Proposal",
  collaboration_request: "Collaboration Request",
  quote_request: "Quotation Request",
  document_request: "Document Request",
  reply_reminder: "Follow-up Reminder",
  thanks: "Thank You",
  apology: "Apology",
  rejection: "Decline Notice",
  complaint: "Issue Report",
  report: "Status Report",
  self_introduction: "Introduction",
  overseas_partner: "International Business",
  other: "Business Email",
};

const englishToneLabels: Record<MailTone, string> = {
  polite: "polite",
  concise: "concise",
  warm: "warm",
  firm: "firm",
  persuasive: "persuasive",
  friendly_professional: "friendly but professional",
  formal: "formal",
  global_business: "global business",
};

function optionLabel<T extends string>(
  options: Array<{ id: T; label: string }>,
  id: T,
) {
  return options.find((option) => option.id === id)?.label ?? id;
}

function normalize(value: string) {
  return value.trim();
}

function compactLines(value: string) {
  return value
    .split(/\n|;/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function sentence(value: string, fallback: string) {
  return normalize(value) || fallback;
}

function hasKoreanFinalConsonant(value: string) {
  const lastChar = value.trim().at(-1);

  if (!lastChar) {
    return false;
  }

  const code = lastChar.charCodeAt(0);

  if (code < 0xac00 || code > 0xd7a3) {
    return false;
  }

  return (code - 0xac00) % 28 !== 0;
}

function withKoreanParticle(
  value: string,
  fallback: string,
  consonantParticle: string,
  vowelParticle: string,
) {
  const base = sentence(value, fallback);
  return `${base}${hasKoreanFinalConsonant(base) ? consonantParticle : vowelParticle}`;
}

function isEnglishOutput(language: MailLanguage) {
  return language === "en_business" || language === "ko_to_en";
}

function resolveOutputLanguage(
  language: MailLanguage,
  action?: MailRefinementAction,
): OutputLanguage {
  if (action === "translate_to_english") {
    return "en";
  }

  if (action === "translate_to_korean") {
    return "ko";
  }

  return isEnglishOutput(language) ? "en" : "ko";
}

function resolveTone(tone: MailTone, action?: MailRefinementAction): MailTone {
  if (action === "more_polite") {
    return "polite";
  }

  if (action === "shorter") {
    return "concise";
  }

  if (action === "more_persuasive") {
    return "persuasive";
  }

  return tone;
}

function buildContent(input: MailFormInput): MailContent {
  return {
    recipient: normalize(input.recipient),
    purpose: sentence(input.purpose, ""),
    keyPoints: compactLines(input.keyPoints),
    draft: normalize(input.draft),
    additionalRequests: normalize(input.additionalRequests),
  };
}

function detailList(content: MailContent, language: OutputLanguage) {
  const details = [...content.keyPoints];

  if (!details.length && content.draft) {
    details.push(content.draft);
  }

  if (!details.length) {
    details.push(language === "ko" ? UNKNOWN_KO : UNKNOWN_EN);
  }

  return details;
}

function listSentence(content: MailContent, language: OutputLanguage) {
  const details = detailList(content, language);

  if (details.length === 1) {
    return details[0];
  }

  return details.map((detail) => `- ${detail}`).join("\n");
}

function closingRequest(language: OutputLanguage, tone: MailTone) {
  if (language === "en") {
    if (tone === "concise") {
      return "Please let me know your thoughts when convenient.";
    }

    if (tone === "persuasive") {
      return "I would appreciate your review and would be glad to discuss the next steps in more detail.";
    }

    return "I would appreciate it if you could review this and share your thoughts when convenient.";
  }

  if (tone === "concise") {
    return "확인 후 의견 부탁드립니다.";
  }

  if (tone === "persuasive") {
    return "검토해주시면 다음 단계에서 구체적인 실행 방안을 함께 논의드리겠습니다.";
  }

  return "검토 후 가능하신 방향이나 의견을 회신해주시면 감사하겠습니다.";
}

function addAdditionalRequest(
  sections: string[],
  content: MailContent,
  language: OutputLanguage,
) {
  if (!content.additionalRequests) {
    return;
  }

  sections.push(
    language === "ko"
      ? `추가 요청사항: ${content.additionalRequests}`
      : `Additional request: ${content.additionalRequests}`,
  );
}

function buildSection(
  template: SectionTemplate,
  content: MailContent,
  tone: MailTone,
  variant: number,
) {
  return `${template.title}\n${template.build(content, tone, variant)}`;
}

const caseTemplates: Record<MailCase, CaseTemplate> = {
  work_request: {
    ko: [
      {
        title: "요청 배경",
        build: (content) =>
          `${withKoreanParticle(content.purpose, UNKNOWN_KO, "과", "와")} 관련하여 업무 협조를 요청드리고자 합니다.`,
      },
      {
        title: "요청 내용",
        build: (content) => listSentence(content, "ko"),
      },
      {
        title: "기한/액션",
        build: (content, tone) =>
          `${closingRequest("ko", tone)} 필요하신 정보가 있다면 알려주시기 바랍니다.`,
      },
      {
        title: "감사 인사",
        build: () => "바쁘신 중에도 확인해주셔서 감사합니다.",
      },
    ],
    en: [
      {
        title: "Context",
        build: (content) =>
          `I am reaching out regarding ${sentence(content.purpose, UNKNOWN_EN)} and would like to ask for your support.`,
      },
      {
        title: "Request",
        build: (content) => listSentence(content, "en"),
      },
      {
        title: "Timeline / Action",
        build: (content, tone) =>
          `${closingRequest("en", tone)} Please let me know if you need any further context.`,
      },
      {
        title: "Appreciation",
        build: () => "Thank you for your time and support.",
      },
    ],
  },
  schedule_coordination: {
    ko: [
      {
        title: "목적",
        build: (content) =>
          `${withKoreanParticle(content.purpose, UNKNOWN_KO, "을", "를")} 위해 일정을 조율드리고자 합니다.`,
      },
      {
        title: "가능 일정",
        build: (content) => listSentence(content, "ko"),
      },
      {
        title: "조율 요청",
        build: () =>
          "가능하신 일정이나 대안 시간이 있다면 편하신 방식으로 회신 부탁드립니다.",
      },
      {
        title: "마무리",
        build: () => "확인해주시면 일정 확정 후 다시 공유드리겠습니다.",
      },
    ],
    en: [
      {
        title: "Purpose",
        build: (content) =>
          `I would like to coordinate a suitable time for ${sentence(content.purpose, UNKNOWN_EN)}.`,
      },
      {
        title: "Available Options",
        build: (content) => listSentence(content, "en"),
      },
      {
        title: "Scheduling Request",
        build: () =>
          "Please let me know which option works best for you, or feel free to suggest an alternative.",
      },
      {
        title: "Closing",
        build: () => "Once confirmed, I will follow up with the final schedule.",
      },
    ],
  },
  meeting_request: {
    ko: [
      {
        title: "미팅 목적",
        build: (content) =>
          `${sentence(content.purpose, UNKNOWN_KO)}에 대해 논의드리고자 미팅을 요청드립니다.`,
      },
      {
        title: "논의하고 싶은 내용",
        build: (content) => listSentence(content, "ko"),
      },
      {
        title: "가능 일정",
        build: () =>
          "가능하신 일정이 있다면 몇 가지 후보 시간을 공유해주시면 감사하겠습니다.",
      },
      {
        title: "요청",
        build: (content, tone) => closingRequest("ko", tone),
      },
    ],
    en: [
      {
        title: "Meeting Purpose",
        build: (content) =>
          `I would like to request a meeting to discuss ${sentence(content.purpose, UNKNOWN_EN)}.`,
      },
      {
        title: "Topics to Discuss",
        build: (content) => listSentence(content, "en"),
      },
      {
        title: "Availability",
        build: () =>
          "If you are available, please share a few time options that work for your schedule.",
      },
      {
        title: "Request",
        build: (content, tone) => closingRequest("en", tone),
      },
    ],
  },
  meeting_follow_up: {
    ko: [
      {
        title: "이전 논의 요약",
        build: (content) =>
          `${withKoreanParticle(content.purpose, UNKNOWN_KO, "과", "와")} 관련해 논의한 내용을 기준으로 정리드립니다.`,
      },
      {
        title: "후속 액션",
        build: (content) => listSentence(content, "ko"),
      },
      {
        title: "다음 단계",
        build: () =>
          "확인 후 보완할 사항이나 추가로 진행할 내용이 있다면 알려주시기 바랍니다.",
      },
    ],
    en: [
      {
        title: "Summary of Previous Discussion",
        build: (content) =>
          `I am following up on our discussion regarding ${sentence(content.purpose, UNKNOWN_EN)}.`,
      },
      {
        title: "Follow-up Actions",
        build: (content) => listSentence(content, "en"),
      },
      {
        title: "Next Steps",
        build: () =>
          "Please let me know if there is anything that needs to be revised or added before we move forward.",
      },
    ],
  },
  proposal: {
    ko: [
      {
        title: "제안 배경",
        build: (content) =>
          `${withKoreanParticle(content.purpose, UNKNOWN_KO, "과", "와")} 관련하여 아래와 같이 제안드립니다.`,
      },
      {
        title: "제안 내용",
        build: (content) => listSentence(content, "ko"),
      },
      {
        title: "기대 효과",
        build: () =>
          "해당 방향은 논의 중인 목표를 보다 명확하게 실행하는 데 도움이 될 것으로 생각합니다.",
      },
      {
        title: "회신 요청",
        build: (content, tone) => closingRequest("ko", tone),
      },
    ],
    en: [
      {
        title: "Background",
        build: (content) =>
          `I would like to share a proposal regarding ${sentence(content.purpose, UNKNOWN_EN)}.`,
      },
      {
        title: "Proposal",
        build: (content) => listSentence(content, "en"),
      },
      {
        title: "Expected Value",
        build: () =>
          "I believe this direction can help clarify the next steps and support a more effective execution.",
      },
      {
        title: "Request for Feedback",
        build: (content, tone) => closingRequest("en", tone),
      },
    ],
  },
  collaboration_request: {
    ko: [
      {
        title: "협업 배경",
        build: (content) =>
          `${withKoreanParticle(content.purpose, UNKNOWN_KO, "을", "를")} 계기로 협업 가능성을 논의드리고자 합니다.`,
      },
      {
        title: "협업 아이디어",
        build: (content) => listSentence(content, "ko"),
      },
      {
        title: "기대 효과",
        build: () =>
          "양측의 강점을 살려 보다 의미 있는 결과를 만들 수 있을 것으로 기대합니다.",
      },
      {
        title: "검토 요청",
        build: (content, tone) => closingRequest("ko", tone),
      },
    ],
    en: [
      {
        title: "Collaboration Context",
        build: (content) =>
          `I am reaching out to explore a potential collaboration related to ${sentence(content.purpose, UNKNOWN_EN)}.`,
      },
      {
        title: "Collaboration Idea",
        build: (content) => listSentence(content, "en"),
      },
      {
        title: "Expected Value",
        build: () =>
          "I believe this could create meaningful value by combining both sides' strengths.",
      },
      {
        title: "Request for Review",
        build: (content, tone) => closingRequest("en", tone),
      },
    ],
  },
  quote_request: {
    ko: [
      {
        title: "필요한 항목",
        build: (content) =>
          `${sentence(content.purpose, UNKNOWN_KO)}에 대한 견적을 요청드립니다.\n${listSentence(content, "ko")}`,
      },
      {
        title: "조건",
        build: () =>
          "견적 산정에 필요한 조건이나 추가 확인 사항이 있다면 함께 안내 부탁드립니다.",
      },
      {
        title: "회신 요청",
        build: () => "검토 가능하신 일정에 맞춰 견적 회신 부탁드립니다.",
      },
    ],
    en: [
      {
        title: "Items Needed",
        build: (content) =>
          `I would like to request a quotation for ${sentence(content.purpose, UNKNOWN_EN)}.\n${listSentence(content, "en")}`,
      },
      {
        title: "Conditions",
        build: () =>
          "Please let me know if there are any requirements or details needed to prepare the quotation.",
      },
      {
        title: "Request for Response",
        build: () =>
          "I would appreciate it if you could share the quotation when available.",
      },
    ],
  },
  document_request: {
    ko: [
      {
        title: "필요한 자료",
        build: (content) => listSentence(content, "ko"),
      },
      {
        title: "사용 목적",
        build: (content) =>
          `${withKoreanParticle(content.purpose, "업무 검토", "을", "를")} 위해 해당 자료가 필요합니다.`,
      },
      {
        title: "요청 기한",
        build: () =>
          "가능하신 범위에서 회신 또는 자료 공유 부탁드립니다.",
      },
    ],
    en: [
      {
        title: "Requested Materials",
        build: (content) => listSentence(content, "en"),
      },
      {
        title: "Purpose",
        build: (content) =>
          `The materials will be used for ${sentence(content.purpose, "business review")}.`,
      },
      {
        title: "Requested Timeline",
        build: () =>
          "Please share the materials or let me know the available timeline when convenient.",
      },
    ],
  },
  reply_reminder: {
    ko: [
      {
        title: "이전 요청 언급",
        build: (content) =>
          `${sentence(content.purpose, UNKNOWN_KO)} 관련해 이전에 전달드린 내용을 다시 한번 확인 요청드립니다.`,
      },
      {
        title: "정중한 리마인드",
        build: (content) => listSentence(content, "ko"),
      },
      {
        title: "회신 요청",
        build: () =>
          "확인 가능하실 때 진행 상황이나 의견을 회신해주시면 감사하겠습니다.",
      },
    ],
    en: [
      {
        title: "Previous Request",
        build: (content) =>
          `I wanted to kindly follow up on my previous message regarding ${sentence(content.purpose, UNKNOWN_EN)}.`,
      },
      {
        title: "Reminder",
        build: (content) => listSentence(content, "en"),
      },
      {
        title: "Request for Reply",
        build: () =>
          "When you have a chance, I would appreciate an update or your feedback.",
      },
    ],
  },
  thanks: {
    ko: [
      {
        title: "감사 대상",
        build: (content) =>
          `${withKoreanParticle(content.purpose, UNKNOWN_KO, "과", "와")} 관련해 도움 주신 점에 감사드립니다.`,
      },
      {
        title: "구체적 감사 내용",
        build: (content) => listSentence(content, "ko"),
      },
      {
        title: "향후 관계 유지",
        build: () =>
          "앞으로도 좋은 협업을 이어갈 수 있기를 바랍니다.",
      },
    ],
    en: [
      {
        title: "Appreciation",
        build: (content) =>
          `Thank you for your support regarding ${sentence(content.purpose, UNKNOWN_EN)}.`,
      },
      {
        title: "Specific Thanks",
        build: (content) => listSentence(content, "en"),
      },
      {
        title: "Continued Relationship",
        build: () =>
          "I look forward to continuing our positive working relationship.",
      },
    ],
  },
  apology: {
    ko: [
      {
        title: "문제 인정",
        build: (content) =>
          `${withKoreanParticle(content.purpose, UNKNOWN_KO, "과", "와")} 관련해 불편을 드린 점을 인지하고 있습니다.`,
      },
      {
        title: "사과",
        build: () => "먼저 해당 상황으로 불편을 드려 진심으로 죄송합니다.",
      },
      {
        title: "개선/대응",
        build: (content) => listSentence(content, "ko"),
      },
      {
        title: "재발 방지",
        build: () =>
          "동일한 문제가 반복되지 않도록 관련 내용을 다시 점검하겠습니다.",
      },
    ],
    en: [
      {
        title: "Acknowledgement",
        build: (content) =>
          `I understand the concern regarding ${sentence(content.purpose, UNKNOWN_EN)}.`,
      },
      {
        title: "Apology",
        build: () => "Please accept my sincere apologies for the inconvenience.",
      },
      {
        title: "Response / Improvement",
        build: (content) => listSentence(content, "en"),
      },
      {
        title: "Prevention",
        build: () =>
          "We will review the relevant process to help prevent a similar issue from recurring.",
      },
    ],
  },
  rejection: {
    ko: [
      {
        title: "감사 표현",
        build: () => "먼저 제안과 관심을 보내주셔서 감사합니다.",
      },
      {
        title: "거절 사유",
        build: (content) =>
          `${withKoreanParticle(content.purpose, UNKNOWN_KO, "과", "와")} 관련해 내부적으로 검토했으나, 이번에는 진행이 어렵게 되었습니다.`,
      },
      {
        title: "대안 또는 양해 요청",
        build: (content) =>
          content.keyPoints.length
            ? listSentence(content, "ko")
            : "너른 양해 부탁드리며, 향후 적합한 기회가 있다면 다시 논의드리겠습니다.",
      },
    ],
    en: [
      {
        title: "Appreciation",
        build: () => "Thank you for your proposal and for considering us.",
      },
      {
        title: "Reason for Declining",
        build: (content) =>
          `After reviewing ${sentence(content.purpose, UNKNOWN_EN)}, we are unable to move forward at this time.`,
      },
      {
        title: "Alternative / Understanding",
        build: (content) =>
          content.keyPoints.length
            ? listSentence(content, "en")
            : "We appreciate your understanding and hope there may be another opportunity to connect in the future.",
      },
    ],
  },
  complaint: {
    ko: [
      {
        title: "문제 상황",
        build: (content) =>
          `${withKoreanParticle(content.purpose, UNKNOWN_KO, "과", "와")} 관련해 아래와 같은 사항을 전달드립니다.`,
      },
      {
        title: "영향",
        build: (content) => listSentence(content, "ko"),
      },
      {
        title: "요청 사항",
        build: () =>
          "해당 내용을 확인하신 뒤 가능한 해결 방안이나 조치 계획을 공유 부탁드립니다.",
      },
      {
        title: "해결 기대",
        build: () => "원활한 해결을 위해 적극적인 확인을 부탁드립니다.",
      },
    ],
    en: [
      {
        title: "Issue",
        build: (content) =>
          `I am writing to raise a concern regarding ${sentence(content.purpose, UNKNOWN_EN)}.`,
      },
      {
        title: "Impact",
        build: (content) => listSentence(content, "en"),
      },
      {
        title: "Requested Action",
        build: () =>
          "Please review the matter and share a possible resolution or action plan.",
      },
      {
        title: "Expected Resolution",
        build: () =>
          "I would appreciate your support in resolving this smoothly.",
      },
    ],
  },
  report: {
    ko: [
      {
        title: "핵심 요약",
        build: (content) =>
          `${sentence(content.purpose, UNKNOWN_KO)}에 대한 주요 내용을 보고드립니다.`,
      },
      {
        title: "진행 상황",
        build: (content) => listSentence(content, "ko"),
      },
      {
        title: "이슈",
        build: (content) =>
          content.draft ? content.draft : "현재 공유 가능한 이슈는 입력된 범위 내에서만 정리했습니다.",
      },
      {
        title: "다음 액션",
        build: () => "추가 확인이 필요한 사항은 확인 후 업데이트드리겠습니다.",
      },
    ],
    en: [
      {
        title: "Executive Summary",
        build: (content) =>
          `I would like to share an update on ${sentence(content.purpose, UNKNOWN_EN)}.`,
      },
      {
        title: "Progress",
        build: (content) => listSentence(content, "en"),
      },
      {
        title: "Issues",
        build: (content) =>
          content.draft || "No additional issues were specified beyond the provided details.",
      },
      {
        title: "Next Actions",
        build: () =>
          "I will follow up with any additional updates as they become available.",
      },
    ],
  },
  self_introduction: {
    ko: [
      {
        title: "자기소개",
        build: (content) =>
          content.draft || "간단히 제 소개와 연락 목적을 전달드리고자 합니다.",
      },
      {
        title: "지원/연락 목적",
        build: (content) => sentence(content.purpose, UNKNOWN_KO),
      },
      {
        title: "강점",
        build: (content) => listSentence(content, "ko"),
      },
      {
        title: "마무리",
        build: () => "검토해주셔서 감사드리며, 편하실 때 회신 부탁드립니다.",
      },
    ],
    en: [
      {
        title: "Introduction",
        build: (content) =>
          content.draft || "I would like to briefly introduce myself and the reason for reaching out.",
      },
      {
        title: "Purpose",
        build: (content) => sentence(content.purpose, UNKNOWN_EN),
      },
      {
        title: "Strengths",
        build: (content) => listSentence(content, "en"),
      },
      {
        title: "Closing",
        build: () =>
          "Thank you for your consideration. I would appreciate the opportunity to connect further.",
      },
    ],
  },
  overseas_partner: {
    ko: [
      {
        title: "글로벌 비즈니스 톤",
        build: (content) =>
          `${withKoreanParticle(content.purpose, UNKNOWN_KO, "과", "와")} 관련해 명확하고 정중하게 요청드립니다.`,
      },
      {
        title: "명확한 요청",
        build: (content) => listSentence(content, "ko"),
      },
      {
        title: "정중한 마무리",
        build: (content, tone) => closingRequest("ko", tone),
      },
    ],
    en: [
      {
        title: "Business Context",
        build: (content) =>
          `I am reaching out regarding ${sentence(content.purpose, UNKNOWN_EN)}.`,
      },
      {
        title: "Clear Request",
        build: (content) => listSentence(content, "en"),
      },
      {
        title: "Professional Closing",
        build: (content, tone) => closingRequest("en", tone),
      },
    ],
  },
  other: {
    ko: [
      {
        title: "목적",
        build: (content) =>
          `${withKoreanParticle(content.purpose, UNKNOWN_KO, "과", "와")} 관련하여 메일드립니다.`,
      },
      {
        title: "핵심 내용",
        build: (content) => listSentence(content, "ko"),
      },
      {
        title: "요청 사항",
        build: (content, tone) => closingRequest("ko", tone),
      },
    ],
    en: [
      {
        title: "Purpose",
        build: (content) =>
          `I am writing regarding ${sentence(content.purpose, UNKNOWN_EN)}.`,
      },
      {
        title: "Key Details",
        build: (content) => listSentence(content, "en"),
      },
      {
        title: "Request",
        build: (content, tone) => closingRequest("en", tone),
      },
    ],
  },
};

function getGreeting(content: MailContent, language: OutputLanguage, tone: MailTone) {
  if (language === "en") {
    if (content.recipient) {
      return tone === "formal" ? `Dear ${content.recipient},` : `Hi ${content.recipient},`;
    }

    return tone === "formal" ? "Dear Sir or Madam," : "Hello,";
  }

  return content.recipient ? `${content.recipient}께,` : "안녕하세요.";
}

function getSignOff(language: OutputLanguage, tone: MailTone) {
  if (language === "en") {
    if (tone === "formal") {
      return "Sincerely,";
    }

    return "Best regards,";
  }

  if (tone === "formal") {
    return "감사합니다.";
  }

  return "감사합니다.";
}

function buildBody(
  input: MailFormInput,
  language: OutputLanguage,
  tone: MailTone,
  variant: number,
) {
  const content = buildContent(input);
  const templates = caseTemplates[input.mailCase][language];
  const sections = templates.map((template) =>
    buildSection(template, content, tone, variant),
  );

  addAdditionalRequest(sections, content, language);

  const intro =
    language === "en"
      ? variant % 2 === 1
        ? "I hope this message finds you well."
        : "I hope you are doing well."
      : variant % 2 === 1
        ? "안녕하세요. 아래 내용 확인 부탁드립니다."
        : "안녕하세요.";

  const shortMode = tone === "concise";
  const visibleSections = shortMode ? sections.slice(0, 3) : sections;

  return [
    getGreeting(content, language, tone),
    "",
    intro,
    "",
    visibleSections.join("\n\n"),
    "",
    getSignOff(language, tone),
  ].join("\n");
}

function buildSubjects(
  input: MailFormInput,
  language: OutputLanguage,
  tone: MailTone,
  variant: number,
) {
  const mailCaseLabel = optionLabel(mailCases, input.mailCase);
  const outputCaseLabel =
    language === "en" ? englishCaseLabels[input.mailCase] : mailCaseLabel;
  const purpose = sentence(input.purpose, outputCaseLabel);
  const concise = tone === "concise";
  const variants =
    language === "en"
      ? [
          `Regarding ${purpose}`,
          concise ? `${purpose} - Quick Follow-up` : `Follow-up on ${purpose}`,
          `${outputCaseLabel}: Request for Review`,
        ]
      : [
          `[${mailCaseLabel}] ${purpose}`,
          concise ? `${purpose} 확인 요청` : `${purpose} 관련 검토 요청드립니다`,
          `${mailCaseLabel} 관련 문의드립니다`,
        ];

  if (variant % 2 === 1) {
    return [variants[1], variants[0], variants[2]];
  }

  return variants;
}

function buildImprovements(
  input: MailFormInput,
  language: OutputLanguage,
  tone: MailTone,
  action?: MailRefinementAction,
) {
  const toneLabel = optionLabel(toneOptions, tone);
  const mailCaseLabel = optionLabel(mailCases, input.mailCase);

  if (language === "en") {
    const outputCaseLabel = englishCaseLabels[input.mailCase];
    const outputToneLabel = englishToneLabels[tone];
    const actionNote =
      action === "translate_to_english"
        ? "Converted the structure into a natural global business email style."
        : "Used clear business English instead of direct, literal phrasing.";

    return [
      `Restructured the message for the selected case: ${outputCaseLabel}.`,
      `Adjusted the tone to ${outputToneLabel}.`,
      actionNote,
      "Kept the content limited to the details provided by the user.",
    ];
  }

  const actionNote =
    action === "translate_to_korean"
      ? "한국어 비즈니스 메일로 자연스럽게 재구성했습니다."
      : "정중하지만 과하게 딱딱하지 않은 문장으로 다듬었습니다.";

  return [
    `${mailCaseLabel} 흐름에 맞춰 본문 구조를 재정리했습니다.`,
    `${toneLabel} 톤에 맞춰 표현 강도를 조정했습니다.`,
    actionNote,
    "입력된 정보 외의 사실은 임의로 추가하지 않았습니다.",
  ];
}

export async function generateMockEmail(
  input: MailFormInput,
  options: GenerateEmailOptions = {},
): Promise<GeneratedMailResult> {
  const tone = resolveTone(input.tone, options.action);
  const language = resolveOutputLanguage(input.language, options.action);
  const variant = options.variant ?? 0;

  const subjects = buildSubjects(input, language, tone, variant);
  const body = buildBody(input, language, tone, variant);
  const improvements = buildImprovements(input, language, tone, options.action);

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        subjects: subjects.slice(0, 3),
        body,
        improvements: improvements.slice(0, 4),
      });
    }, 550);
  });
}

export async function generateEmail(
  input: MailFormInput,
  options?: GenerateEmailOptions,
): Promise<GeneratedMailResult> {
  return generateMockEmail(input, options);
}
