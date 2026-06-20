import { getMailTemplateById } from "@/data/mailTemplates";
import { analyzeDraft } from "@/lib/analyzeDraft";
import type {
  DraftAnalysis,
  GenerateEmailOptions,
  MailFormInput,
  MailRefinementAction,
} from "@/types/mail";

function emptySafe(value?: string) {
  return value?.trim() || "입력 없음";
}

function refinementInstruction(action?: MailRefinementAction) {
  if (!action || action === "regenerate") {
    return "Generate the best version based on the draft analysis.";
  }

  const instructions: Record<MailRefinementAction, string> = {
    more_polite: "Make the result more polite while preserving the original intent.",
    shorter: "Make the result shorter and more concise without removing essential details.",
    clearer: "Make the request, action items, and timeline clearer.",
    softer: "Make the wording softer and less pressuring.",
    firmer: "Make the wording firmer while remaining professional.",
    translate_to_english: "Rewrite the result in natural global business English.",
    translate_to_korean: "Rewrite the result in natural Korean business email style.",
    regenerate: "Generate a fresh alternative version based on the same analysis.",
  };

  return instructions[action];
}

export function createSystemPrompt() {
  return [
    "You are BizMail Studio, a senior business email rewriting assistant for Korean and global business communication.",
    "",
    "Core principles:",
    "- Analyze the user's rough draft, memo, or casually written request before writing.",
    "- Interpret memo markers when they appear in the draft: 必 means mandatory/required, 有 means exists/possible/present, and 多 means many/multiple items.",
    "- Preserve the user's original intent, business objective, and provided facts.",
    "- Do not invent names, dates, deadlines, prices, attachments, decisions, promises, or commitments.",
    "- If information is missing or uncertain, use general wording and mention missing information separately.",
    "- Select the most appropriate business email template unless the user manually selected one.",
    "- Follow the selected template structure internally, but do not print section headings in the final body.",
    "- For Korean emails, write politely and naturally without sounding overly stiff.",
    "- For English emails, use natural global business English instead of literal translation.",
    "- Soften harsh, emotional, or overly casual wording while keeping the intended action clear.",
    "- Do not print raw memo markers such as 必, 有, or 多 in the final body. Convert them into natural business wording.",
    "- Return only valid JSON. Do not wrap JSON in markdown.",
  ].join("\n");
}

export function buildDraftAnalysisPrompt(input: MailFormInput) {
  return [
    "Analyze the user's rough email draft and return JSON only.",
    "",
    "User input:",
    `- Raw draft: ${emptySafe(input.rawDraft)}`,
    `- Template mode: ${input.templateMode}`,
    `- Manually selected template: ${input.selectedTemplateId ?? "none"}`,
    `- Language mode: ${input.languageMode}`,
    `- Tone preference: ${input.tone}`,
    `- Recipient: ${emptySafe(input.recipient)}`,
    `- Sender: ${emptySafe(input.sender)}`,
    `- 有 Purpose/context: ${emptySafe(input.purpose)}`,
    `- 必 Must-include details: ${emptySafe(input.mustInclude)}`,
    `- 多 Rewriting instruction: ${emptySafe(input.extraInstruction)}`,
    "",
    "Analyze and extract:",
    "- detectedPurpose",
    "- detectedRecipientType",
    "- detectedSituation",
    "- detectedUrgency: low, medium, or high",
    "- detectedLanguage: ko, en, mixed, or unknown",
    "- recommendedTemplateId",
    "- recommendedTone",
    "- keyPoints",
    "- requestedActions",
    "- missingInfo",
    "- confidenceScore from 0 to 1",
    "",
    "Rules:",
    "- If templateMode is manual and selectedTemplateId is provided, use that template.",
    "- Prioritize sensitive templates such as apology, complaint, and rejection when their keywords appear.",
    "- Distinguish meeting follow-up from meeting request.",
    "- Distinguish schedule adjustment from meeting request.",
    "- If no template is clearly matched, use general-business.",
    "- Do not infer unsupported facts.",
    "- Treat inline markers as business memo shorthand. Example: '사전 검수 必' means pre-review is mandatory, '변동 가능성 有' means there may be changes, and '수정 사항 多' means there are many revision items.",
    "- Return JSON only.",
  ].join("\n");
}

export function buildBusinessMailPrompt(
  input: MailFormInput,
  analysis: DraftAnalysis,
) {
  const template = getMailTemplateById(analysis.recommendedTemplateId);

  return [
    "Write a polished business email based on the draft analysis. Return JSON only.",
    "",
    "Selected template:",
    `- ID: ${template.id}`,
    `- Label: ${template.label}`,
    `- Description: ${template.description}`,
    `- Subject pattern reference: ${template.subjectPattern}`,
    `- Internal structure: ${template.structure.join(" -> ")}`,
    "",
    "Draft analysis:",
    JSON.stringify(analysis, null, 2),
    "",
    "Original user input:",
    `- Raw draft: ${emptySafe(input.rawDraft)}`,
    `- Recipient: ${emptySafe(input.recipient)}`,
    `- Sender: ${emptySafe(input.sender)}`,
    `- 有 Purpose/context: ${emptySafe(input.purpose)}`,
    `- 必 Must-include details: ${emptySafe(input.mustInclude)}`,
    `- 多 Rewriting instruction: ${emptySafe(input.extraInstruction)}`,
    `- Language mode: ${input.languageMode}`,
    `- Tone preference: ${input.tone}`,
    "",
    "Generation rules:",
    "- Use the analysis to choose intent, tone, template, urgency, and missing information.",
    "- Follow the selected business mail template structure internally.",
    "- Interpret inline memo markers: 必 as required/mandatory, 有 as exists/possible/present, and 多 as many/multiple items.",
    "- Convert marker notation into natural wording. For example, '(사전 검수 必)' should become '사전 검수는 필수로 진행되어야 합니다' or similar, and '변동 가능성 有' should become '세부 내용은 변동될 수 있습니다' or similar.",
    "- Preserve the user's intent and facts exactly.",
    "- Do not invent unsupported facts.",
    "- If details are missing, use general wording in the body and list missing items in missingInfoNotice.",
    "- Provide exactly 3 concise subject lines.",
    "- Provide a send-ready email body with greeting, natural paragraphs, clear action items, and closing.",
    "- Do not include section headings such as Context, Request, 요청 배경, or 개선 포인트 inside the body.",
    "- For English, use natural global business expressions such as Could you please review, I would appreciate it if you could, and Please let me know.",
    "- For Korean, start with a polite greeting and make the requested action clear without pressuring the recipient.",
    "- Return JSON with analysis, appliedTemplateId, appliedTemplateLabel, subjects, body, improvements, and missingInfoNotice.",
  ].join("\n");
}

export function createUserPrompt(
  input: MailFormInput,
  options: GenerateEmailOptions = {},
) {
  const analysis = analyzeDraft(input);

  return [
    buildBusinessMailPrompt(input, analysis),
    "",
    "Refinement controls:",
    `- Refinement request: ${refinementInstruction(options.action)}`,
    `- Variant number: ${options.variant ?? 0}`,
  ].join("\n");
}
