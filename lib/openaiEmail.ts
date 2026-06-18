import { createSystemPrompt, createUserPrompt } from "@/lib/prompts";
import type {
  GenerateEmailOptions,
  GeneratedMailResult,
  MailFormInput,
} from "@/types/mail";

const OPENAI_CHAT_COMPLETIONS_URL = "https://api.openai.com/v1/chat/completions";

const resultJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["subjects", "body", "improvements"],
  properties: {
    subjects: {
      type: "array",
      minItems: 2,
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
  },
} as const;

function assertGeneratedMailResult(value: unknown): GeneratedMailResult {
  if (!value || typeof value !== "object") {
    throw new Error("AI 응답 형식이 올바르지 않습니다.");
  }

  const result = value as Partial<GeneratedMailResult>;

  if (
    !Array.isArray(result.subjects) ||
    typeof result.body !== "string" ||
    !Array.isArray(result.improvements)
  ) {
    throw new Error("AI 응답 파싱에 실패했습니다.");
  }

  return {
    subjects: result.subjects
      .filter((subject): subject is string => typeof subject === "string")
      .slice(0, 3),
    body: result.body,
    improvements: result.improvements
      .filter((point): point is string => typeof point === "string")
      .slice(0, 4),
  };
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
      temperature: 0.4,
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
