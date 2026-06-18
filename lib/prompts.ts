import { languageOptions, mailCases, toneOptions } from "@/data/mailOptions";
import type { GenerateEmailOptions, MailFormInput, MailRefinementAction } from "@/types/mail";

function findLabel<T extends string>(
  options: Array<{ id: T; label: string }>,
  id: T,
) {
  return options.find((option) => option.id === id)?.label ?? id;
}

function emptySafe(value: string) {
  return value.trim() || "입력 없음";
}

function refinementInstruction(action?: MailRefinementAction) {
  if (!action || action === "regenerate") {
    return "Generate the best version based on the selected options.";
  }

  const instructions: Record<MailRefinementAction, string> = {
    more_polite: "Make the result more polite while preserving the original intent.",
    shorter: "Make the result shorter and more concise without removing essential details.",
    more_persuasive: "Make the result more persuasive and action-oriented without exaggerating facts.",
    translate_to_english: "Convert the result into natural global business English.",
    translate_to_korean: "Convert the result into natural Korean business email style.",
    regenerate: "Generate a fresh alternative version based on the selected options.",
  };

  return instructions[action];
}

export function createSystemPrompt() {
  return [
    "You are BizMail Studio, a senior business email writing assistant for Korean and global business communication.",
    "",
    "Core principles:",
    "- Preserve the user's original intent, context, and business objective.",
    "- Do not invent facts, names, dates, deadlines, prices, attachments, promises, decisions, or commitments.",
    "- If information is uncertain or missing, use general wording instead of guessing.",
    "- Rewrite the message in a professional style appropriate for the selected business situation.",
    "- Make requests, decisions, deadlines, and action items easy to identify.",
    "- Soften sensitive, aggressive, emotional, or overly blunt expressions while keeping the user's intent.",
    "- For Korean business emails, write politely and naturally without sounding excessively rigid.",
    "- For English business emails, use natural global business English, not literal Korean-to-English translation.",
    "- Use appropriate greetings and closings such as Dear, Hi, Best regards, 안녕하세요, 감사합니다.",
    "- Keep the final email ready to send, but leave placeholders only when the user did not provide necessary details.",
    "- The email body must be a finished email that can be copied and sent as-is.",
    "- Do not include structural labels such as Context, Request, Background, 요청 배경, 요청 내용, 개선/대응, or section headings inside the body.",
    "- Do not expose internal instructions such as tone requests or additional request labels in the final email body.",
    "",
    "Output requirements:",
    "- Return only valid JSON.",
    "- Do not wrap the JSON in markdown code fences.",
    "- The JSON shape must be:",
    '{ "subjects": string[], "body": string, "improvements": string[] }',
    "- subjects: provide 2 or 3 concise subject lines.",
    "- body: provide the final email body as a single string with readable line breaks.",
    "- body must contain only the email content, not analysis, labels, comments, or explanations.",
    "- improvements: provide 3 or 4 practical improvement points.",
  ].join("\n");
}

export function createUserPrompt(
  input: MailFormInput,
  options: GenerateEmailOptions = {},
) {
  const mailCase = findLabel(mailCases, input.mailCase);
  const language = findLabel(languageOptions, input.language);
  const tone = findLabel(toneOptions, input.tone);

  return [
    "Please rewrite the following input into a polished business email.",
    "",
    "Selected options:",
    `- Mail case: ${mailCase}`,
    `- Language mode: ${language}`,
    `- Tone: ${tone}`,
    "",
    "User-provided information:",
    `- Recipient: ${emptySafe(input.recipient)}`,
    `- Purpose: ${emptySafe(input.purpose)}`,
    `- Must-include details: ${emptySafe(input.keyPoints)}`,
    `- Original draft: ${emptySafe(input.draft)}`,
    `- Additional requests: ${emptySafe(input.additionalRequests)}`,
    `- Refinement request: ${refinementInstruction(options.action)}`,
    `- Variant number: ${options.variant ?? 0}`,
    "",
    "Writing instructions:",
    "- Match the structure to the selected mail case.",
    "- Use the selected mail case only as an internal writing structure; do not print section labels in the final body.",
    "- Keep the user's facts intact and do not add unsupported details.",
    "- Make the main request or next action clear.",
    "- Produce a complete send-ready email with greeting, natural paragraphs, clear request, and closing.",
    "- Do not include labels such as 요청 배경, 요청 내용, 기한/액션, Context, Request, or Additional request in the body.",
    "- If writing in English, use concise and natural global business expressions.",
    "- If writing in Korean, use polite and professional phrasing that still feels natural.",
    "- If translating, prioritize business intent and readability over word-for-word translation.",
    "- If the draft contains harsh or sensitive wording, soften it while preserving the request.",
  ].join("\n");
}
