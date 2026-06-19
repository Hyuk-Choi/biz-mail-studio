import { createSystemPrompt, createUserPrompt } from "@/lib/prompts";
import type {
  DraftAnalysis,
  GenerateEmailOptions,
  GeneratedMailResult,
  MailFormInput,
} from "@/types/mail";

const OPENAI_CHAT_COMPLETIONS_URL = "https://api.openai.com/v1/chat/completions";

const templateIds = [
  "work-request",
  "schedule-adjustment",
  "meeting-request",
  "meeting-follow-up",
  "proposal",
  "collaboration",
  "quotation-request",
  "document-request",
  "reply-reminder",
  "thanks",
  "apology",
  "rejection",
  "complaint",
  "report",
  "self-introduction",
  "global-business",
  "general-business",
] as const;

const toneIds = [
  "auto",
  "polite",
  "concise",
  "soft",
  "firm",
  "persuasive",
  "friendly-professional",
  "formal",
  "global-business",
] as const;

const resultJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "analysis",
    "appliedTemplateId",
    "appliedTemplateLabel",
    "subjects",
    "body",
    "improvements",
    "missingInfoNotice",
  ],
  properties: {
    analysis: {
      type: "object",
      additionalProperties: false,
      required: [
        "detectedPurpose",
        "detectedRecipientType",
        "detectedSituation",
        "detectedUrgency",
        "detectedLanguage",
        "recommendedTemplateId",
        "recommendedTone",
        "keyPoints",
        "requestedActions",
        "missingInfo",
        "confidenceScore",
      ],
      properties: {
        detectedPurpose: { type: "string" },
        detectedRecipientType: { type: "string" },
        detectedSituation: { type: "string" },
        detectedUrgency: { type: "string", enum: ["low", "medium", "high"] },
        detectedLanguage: {
          type: "string",
          enum: ["ko", "en", "mixed", "unknown"],
        },
        recommendedTemplateId: { type: "string", enum: templateIds },
        recommendedTone: { type: "string", enum: toneIds },
        keyPoints: {
          type: "array",
          items: { type: "string" },
        },
        requestedActions: {
          type: "array",
          items: { type: "string" },
        },
        missingInfo: {
          type: "array",
          items: { type: "string" },
        },
        confidenceScore: { type: "number" },
      },
    },
    appliedTemplateId: { type: "string", enum: templateIds },
    appliedTemplateLabel: { type: "string" },
    subjects: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: { type: "string" },
    },
    body: {
      type: "string",
    },
    improvements: {
      type: "array",
      minItems: 3,
      maxItems: 4,
      items: { type: "string" },
    },
    missingInfoNotice: {
      type: "array",
      items: { type: "string" },
    },
  },
} as const;

function stringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function assertDraftAnalysis(value: unknown): DraftAnalysis {
  if (!value || typeof value !== "object") {
    throw new Error("AI 분석 응답 형식이 올바르지 않습니다.");
  }

  const analysis = value as Partial<DraftAnalysis>;

  if (
    typeof analysis.detectedPurpose !== "string" ||
    typeof analysis.detectedRecipientType !== "string" ||
    typeof analysis.detectedSituation !== "string" ||
    typeof analysis.detectedUrgency !== "string" ||
    typeof analysis.detectedLanguage !== "string" ||
    typeof analysis.recommendedTemplateId !== "string" ||
    typeof analysis.recommendedTone !== "string" ||
    typeof analysis.confidenceScore !== "number"
  ) {
    throw new Error("AI 분석 응답 파싱에 실패했습니다.");
  }

  return {
    detectedPurpose: analysis.detectedPurpose,
    detectedRecipientType: analysis.detectedRecipientType,
    detectedSituation: analysis.detectedSituation,
    detectedUrgency: analysis.detectedUrgency,
    detectedLanguage: analysis.detectedLanguage,
    recommendedTemplateId: analysis.recommendedTemplateId,
    recommendedTone: analysis.recommendedTone,
    keyPoints: stringArray(analysis.keyPoints),
    requestedActions: stringArray(analysis.requestedActions),
    missingInfo: stringArray(analysis.missingInfo),
    confidenceScore: analysis.confidenceScore,
  } as DraftAnalysis;
}

function assertGeneratedMailResult(value: unknown): GeneratedMailResult {
  if (!value || typeof value !== "object") {
    throw new Error("AI 응답 형식이 올바르지 않습니다.");
  }

  const result = value as Partial<GeneratedMailResult>;

  if (
    !result.analysis ||
    typeof result.appliedTemplateId !== "string" ||
    typeof result.appliedTemplateLabel !== "string" ||
    !Array.isArray(result.subjects) ||
    typeof result.body !== "string" ||
    !Array.isArray(result.improvements) ||
    !Array.isArray(result.missingInfoNotice)
  ) {
    throw new Error("AI 응답 파싱에 실패했습니다.");
  }

  return {
    analysis: assertDraftAnalysis(result.analysis),
    appliedTemplateId: result.appliedTemplateId,
    appliedTemplateLabel: result.appliedTemplateLabel,
    subjects: stringArray(result.subjects).slice(0, 3),
    body: result.body,
    improvements: stringArray(result.improvements).slice(0, 4),
    missingInfoNotice: stringArray(result.missingInfoNotice),
  } as GeneratedMailResult;
}

function extractMessageContent(responseBody: unknown) {
  const body = responseBody as {
    choices?: Array<{
      message?: {
        content?: string | null;
      };
    }>;
  };

  return body.choices?.[0]?.message?.content ?? "";
}

export async function generateOpenAIEmail(
  input: MailFormInput,
  options: GenerateEmailOptions = {},
): Promise<GeneratedMailResult> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY가 설정되어 있지 않습니다.");
  }

  const response = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: createSystemPrompt(),
        },
        {
          role: "user",
          content: createUserPrompt(input, options),
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "bizmail_generation_result",
          strict: true,
          schema: resultJsonSchema,
        },
      },
      temperature: 0.35,
    }),
  });

  const responseBody: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const maybeError = responseBody as { error?: { message?: string } } | null;
    throw new Error(
      maybeError?.error?.message ||
        "OpenAI API 호출 중 오류가 발생했습니다.",
    );
  }

  const content = extractMessageContent(responseBody);

  if (!content) {
    throw new Error("OpenAI 응답에서 메일 내용을 찾지 못했습니다.");
  }

  try {
    return assertGeneratedMailResult(JSON.parse(content));
  } catch {
    throw new Error("AI 응답 파싱에 실패했습니다. 잠시 후 다시 시도해주세요.");
  }
}
