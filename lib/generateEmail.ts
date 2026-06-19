import { getMailTemplateById } from "@/data/mailTemplates";
import { analyzeDraft } from "@/lib/analyzeDraft";
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
    .split(/\n|;|•/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function cleanInstructionWords(value: string) {
  return value
    .replace(/말해줘|말하고 싶어|하고 싶어|물어보고 싶어|작성해줘|써줘/g, "")
    .replace(/싶다고\s*\.?/g, "")
    .replace(/^ask the client to\s+/i, "")
    .replace(/^please\s+/i, "")
    .replace(/\s+\./g, ".")
    .trim();
}

function titleCase(value: string) {
  return value.replace(/\w\S*/g, (word) => {
    const lower = word.toLowerCase();
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
    /by\s+(?:this\s+)?(?:monday|tuesday|wednesday|thursday|friday|tomorrow|today|eod|end of day)/i,
    /by\s+the\s+end\s+of\s+this\s+week/i,
    /this week/i,
    /오늘\s*(?:오전|오후|중)?/i,
    /내일\s*(?:오전|오후|중)?/i,
    /이번\s*주\s*(?:안으로|안|중|까지)?/i,
    /다음\s*주\s*(?:월요일|화요일|수요일|목요일|금요일)(?:이나|또는|,|\s)*(?:월요일|화요일|수요일|목요일|금요일)?/i,
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
    return value;
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

function inferTopic(input: MailFormInput, analysis: DraftAnalysis, language: OutputLanguage) {
  const text = sourceText(input);
  const cleanedDraft = cleanInstructionWords(normalize(input.rawDraft));
  const explicit = normalize(input.purpose) || cleanedDraft;
  const lower = text.toLowerCase();

  if (language === "en") {
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

  if (analysis.recommendedTemplateId === "apology" && /(자료|파일|문서)/.test(text)) {
    return "자료 전달 지연";
  }

  if (analysis.recommendedTemplateId === "collaboration" && /신규\s*캠페인/.test(text)) {
    return "신규 캠페인 협업";
  }

  if (analysis.recommendedTemplateId === "collaboration" && /협업/.test(text)) {
    return "협업 제안";
  }

  if (/(견적서|견적|비용|가격)/.test(text)) {
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

  return explicit || "관련 건";
}

function getKeyPoints(input: MailFormInput, analysis: DraftAnalysis) {
  const explicit = compactLines(input.mustInclude);

  if (explicit.length) {
    return explicit;
  }

  return analysis.keyPoints.length ? analysis.keyPoints : [cleanInstructionWords(input.rawDraft)];
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
  const cleaned = items.map(cleanInstructionWords).filter(Boolean);

  if (!cleaned.length) {
    return language === "en"
      ? "- The details shared in your draft"
      : "- 입력해주신 핵심 내용";
  }

  return cleaned.map((item) => `- ${item}`).join("\n");
}

function koreanBody(ctx: GenerationContext) {
  const { input, templateId, topic, deadline, keyPoints, tone } = ctx;
  const short = tone === "concise";
  const details = bulletList(keyPoints, "ko");

  const introByTemplate: Record<MailTemplateId, string> = {
    "work-request": `${topic} 관련하여 업무 협조를 요청드리고자 합니다.`,
    "schedule-adjustment": `${topic} 조율을 위해 연락드립니다.`,
    "meeting-request": `${topic}에 대해 논의드리고자 미팅을 요청드립니다.`,
    "meeting-follow-up": `앞서 논의한 ${topic} 관련 내용을 정리하여 공유드립니다.`,
    proposal: `${topic} 관련하여 아래와 같이 제안드립니다.`,
    collaboration: `${topic}${topic.includes("협업") ? " 가능성을" : " 관련 협업 가능성을"} 논의드리고자 연락드립니다.`,
    "quotation-request": `${topic} 관련 견적을 문의드립니다.`,
    "document-request": `${topic} 관련 자료 전달을 요청드립니다.`,
    "reply-reminder": `지난번 전달드린 ${topic} 관련하여 확인차 다시 연락드립니다.`,
    thanks: `${topic} 관련하여 도움 주셔서 감사 인사를 드리고자 합니다.`,
    apology: `${topic}과 관련하여 불편을 드린 점 진심으로 죄송합니다.`,
    rejection: `${topic} 관련하여 검토 결과를 공유드립니다.`,
    complaint: `${topic} 관련하여 확인이 필요한 사항이 있어 연락드립니다.`,
    report: `${topic} 관련 진행 상황을 공유드립니다.`,
    "self-introduction": `${topic} 관련하여 제 소개와 연락 목적을 전달드리고자 합니다.`,
    "global-business": `${topic} 관련하여 명확히 요청드리고자 합니다.`,
    "general-business": `${topic} 관련하여 메일드립니다.`,
  };

  const actionByTemplate: Record<MailTemplateId, string> = {
    "work-request": `아래 내용을 확인하시고 가능하신 방향으로 처리 부탁드립니다.\n${details}`,
    "schedule-adjustment": deadline
      ? `가능하시다면 ${deadline} 중 편하신 시간이 있으신지 확인 부탁드립니다. 해당 일정이 어려우시면 가능하신 시간을 알려주시면 조율하겠습니다.`
      : `가능하신 일정이나 대안 시간을 알려주시면 조율하겠습니다.`,
    "meeting-request": `미팅에서는 아래 내용을 중심으로 논의하고자 합니다.\n${details}`,
    "meeting-follow-up": `주요 논의 내용과 후속 액션은 아래와 같습니다.\n${details}`,
    proposal: `제안드리는 주요 내용은 아래와 같습니다.\n${details}`,
    collaboration: `협업 방향은 아래와 같이 생각하고 있습니다.\n${details}`,
    "quotation-request": deadline
      ? `아래 조건을 기준으로 ${deadline}까지 견적 확인을 부탁드립니다.\n${details}`
      : `아래 조건을 기준으로 견적 확인을 부탁드립니다.\n${details}`,
    "document-request": deadline
      ? `아래 자료를 ${deadline}까지 공유해주실 수 있을지 확인 부탁드립니다.\n${details}`
      : `아래 자료 공유 가능 여부를 확인 부탁드립니다.\n${details}`,
    "reply-reminder": deadline
      ? `바쁘시겠지만 ${deadline}까지 회신 가능하실지 확인 부탁드립니다.\n${details}`
      : `확인 가능하실 때 진행 상황이나 의견을 회신해주시면 감사하겠습니다.\n${details}`,
    thanks: `특히 아래 부분에 감사드립니다.\n${details}`,
    apology: deadline
      ? `해당 건은 ${deadline}까지 다시 확인하여 전달드리겠습니다. 전달 전 내용을 한 번 더 점검해 누락이 없도록 하겠습니다.`
      : `현재 해당 건을 다시 확인하고 있으며, 가능한 일정에 맞춰 후속 조치를 안내드리겠습니다.`,
    rejection: `검토 결과, 아쉽게도 이번에는 진행이 어려울 것 같습니다. 아래 사유 또는 고려 사항을 함께 전달드립니다.\n${details}`,
    complaint: `현재 확인된 내용은 아래와 같습니다.\n${details}\n\n해당 건에 대해 가능한 조치 방안과 일정을 회신 부탁드립니다.`,
    report: `핵심 내용은 아래와 같습니다.\n${details}`,
    "self-introduction": `아래 내용을 중심으로 소개드립니다.\n${details}`,
    "global-business": `요청드릴 내용은 아래와 같습니다.\n${details}`,
    "general-business": `핵심 내용은 아래와 같습니다.\n${details}`,
  };

  const closingSentenceByTemplate: Partial<Record<MailTemplateId, string>> = {
    apology: "앞으로 동일한 문제가 반복되지 않도록 일정과 확인 과정을 더 세심하게 관리하겠습니다.",
    thanks: "앞으로도 좋은 협업을 이어갈 수 있기를 바랍니다.",
    rejection: "좋은 제안에도 긍정적인 답변을 드리지 못해 양해 부탁드립니다.",
    "schedule-adjustment": "확인 후 편하신 시간으로 회신 부탁드립니다.",
    "meeting-request": "가능하신 일정이 있으시면 회신 부탁드립니다.",
    "quotation-request": "견적 산정에 추가 정보가 필요하시면 말씀 부탁드립니다.",
    "document-request": "확인 후 공유 가능 여부를 회신해주시면 감사하겠습니다.",
    "reply-reminder": "확인 부탁드리며, 회신 기다리겠습니다.",
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
  const deadlineText = deadline ? ` ${deadline}` : "";

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

function englishBody(ctx: GenerationContext) {
  const { input, templateId, topic, deadline, keyPoints, tone } = ctx;
  const details = bulletList(keyPoints, "en");
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
    "work-request": englishRequestSentence(templateId, topic, deadline),
    "schedule-adjustment": deadline
      ? `Would you be available around ${deadline}? If not, please feel free to suggest another time that works better for you.`
      : "Please let me know a few time options that would work for your schedule.",
    "meeting-request": `I would like to discuss the following points:\n${details}`,
    "meeting-follow-up": `Please see the key follow-up items below:\n${details}`,
    proposal: `The key points of the proposal are as follows:\n${details}`,
    collaboration: `The potential collaboration could be structured around the following points:\n${details}`,
    "quotation-request": englishRequestSentence(templateId, topic, deadline),
    "document-request": englishRequestSentence(templateId, topic, deadline),
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

  const koSubjects: Record<MailTemplateId, string[]> = {
    "work-request": [`[요청] ${koTopic} 확인 부탁드립니다`, `${koTopic} 관련 업무 요청드립니다`, `${koTopic} 건 검토 부탁드립니다`],
    "schedule-adjustment": [`[일정 조율] ${koTopic} 확인 요청드립니다`, `${koTopic} 조율 문의드립니다`, `${koTopic} 가능 시간 확인 부탁드립니다`],
    "meeting-request": [`[미팅 요청] ${koTopic} 관련 논의 요청드립니다`, `${koTopic} 미팅 가능 여부 문의드립니다`, `${koTopic} 관련 미팅 요청드립니다`],
    "meeting-follow-up": [`[팔로업] ${koTopic} 논의 내용 공유드립니다`, `${koTopic} 후속 액션 공유드립니다`, `${koTopic} 미팅 후속 정리드립니다`],
    proposal: [`[제안] ${koTopic} 관련 제안드립니다`, `${koTopic} 제안 검토 부탁드립니다`, `${koTopic} 관련 제안서 공유드립니다`],
    collaboration: koTopic.includes("협업")
      ? [`[협업 제안] ${koTopic} 제안드립니다`, `${koTopic} 논의 요청드립니다`, `${koTopic} 검토 부탁드립니다`]
      : [`[협업 제안] ${koTopic} 협업 제안드립니다`, `${koTopic} 관련 협업 논의 요청드립니다`, `${koTopic} 파트너십 제안드립니다`],
    "quotation-request": [`[견적 요청] ${koTopic} 견적 문의드립니다`, `${koTopic} 견적 확인 부탁드립니다`, `${koTopic} 비용 문의드립니다`],
    "document-request": [`[자료 요청] ${koTopic} 전달 요청드립니다`, `${koTopic} 자료 공유 부탁드립니다`, `${koTopic} 관련 자료 요청드립니다`],
    "reply-reminder": [`[리마인드] ${koTopic} 관련 회신 요청드립니다`, `${koTopic} 확인차 다시 연락드립니다`, `${koTopic} 회신 확인 부탁드립니다`],
    thanks: [`[감사 인사] ${koTopic} 관련 감사드립니다`, `${koTopic} 도움에 감사드립니다`, `${koTopic} 관련 감사 인사드립니다`],
    apology: [`[사과 말씀] ${koTopic} 관련 안내드립니다`, `${koTopic}에 대한 사과 및 재안내`, `${koTopic} 관련 사과드립니다`],
    rejection: [`[회신] ${koTopic} 관련 검토 결과 공유드립니다`, `${koTopic} 관련 양해 말씀드립니다`, `${koTopic} 검토 결과 안내드립니다`],
    complaint: [`[확인 요청] ${koTopic} 관련 문의드립니다`, `${koTopic} 문제 확인 요청드립니다`, `${koTopic} 관련 조치 요청드립니다`],
    report: [`[보고] ${koTopic} 진행 상황 공유드립니다`, `${koTopic} 현황 보고드립니다`, `${koTopic} 관련 업데이트 공유드립니다`],
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

  if (ctx.language === "en") {
    return [
      `Analyzed the rough input and matched it to the ${template.label} structure.`,
      "Converted the message into natural global business English rather than a literal translation.",
      `Adjusted the tone to ${toneLabels[ctx.tone]}.`,
      "Kept the content limited to the facts and intent provided by the user.",
    ];
  }

  return [
    `입력 내용을 분석해 ${template.label} 구조로 재작성했습니다.`,
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
  const keyPoints = getKeyPoints(input, analysis);

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
