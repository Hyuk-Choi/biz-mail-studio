import { NextResponse } from "next/server";
import { generateBusinessMail } from "@/lib/generateEmail";
import { generateOpenAIEmail } from "@/lib/openaiEmail";
import type {
  GenerateEmailOptions,
  LanguageMode,
  MailRefinementAction,
  MailFormInput,
  MailGenerationRequest,
  MailGenerationResponse,
  MailTemplateId,
  MailTone,
  TemplateMode,
} from "@/types/mail";

export const runtime = "nodejs";

const templateModes = new Set<TemplateMode>(["auto", "manual"]);

const templateIds = new Set<MailTemplateId>([
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
]);

const languageModes = new Set<LanguageMode>([
  "auto",
  "ko",
  "en",
  "ko-to-en",
  "en-to-ko",
]);

const toneIds = new Set<MailTone>([
  "auto",
  "polite",
  "concise",
  "soft",
  "firm",
  "persuasive",
  "friendly-professional",
  "formal",
  "global-business",
]);

const refinementActions = new Set<MailRefinementAction>([
  "more_polite",
  "shorter",
  "clearer",
  "softer",
  "firmer",
  "translate_to_english",
  "translate_to_korean",
  "regenerate",
]);

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isOptionalString(value: unknown): value is string | undefined {
  return value === undefined || typeof value === "string";
}

function isAllowedValue<T extends string>(
  value: unknown,
  allowedValues: Set<T>,
): value is T {
  return typeof value === "string" && allowedValues.has(value as T);
}

function isMailFormInput(value: unknown): value is MailFormInput {
  if (!value || typeof value !== "object") {
    return false;
  }

  const input = value as Record<keyof MailFormInput, unknown>;

  return (
    isString(input.rawDraft) &&
    isAllowedValue(input.templateMode, templateModes) &&
    (input.selectedTemplateId === undefined ||
      isAllowedValue(input.selectedTemplateId, templateIds)) &&
    isAllowedValue(input.languageMode, languageModes) &&
    isAllowedValue(input.tone, toneIds) &&
    isOptionalString(input.recipient) &&
    isOptionalString(input.sender) &&
    isOptionalString(input.purpose) &&
    isOptionalString(input.mustInclude) &&
    isOptionalString(input.extraInstruction)
  );
}

function hasMinimumContent(input: MailFormInput) {
  return Boolean(
    input.rawDraft.trim() ||
      input.purpose?.trim() ||
      input.mustInclude?.trim() ||
      input.extraInstruction?.trim(),
  );
}

function cleanOptions(options: unknown): GenerateEmailOptions {
  if (!options || typeof options !== "object") {
    return {};
  }

  const raw = options as GenerateEmailOptions;
  const action = raw.action;

  return {
    action: action && refinementActions.has(action) ? action : undefined,
    variant: typeof raw.variant === "number" ? raw.variant : 0,
  };
}

export async function POST(request: Request) {
  let payload: Partial<MailGenerationRequest>;

  try {
    payload = (await request.json()) as Partial<MailGenerationRequest>;
  } catch {
    return NextResponse.json<MailGenerationResponse>(
      { success: false, error: "요청 형식이 올바르지 않습니다." },
      { status: 400 },
    );
  }

  if (!isMailFormInput(payload.input)) {
    return NextResponse.json<MailGenerationResponse>(
      { success: false, error: "메일 입력값을 확인해주세요." },
      { status: 400 },
    );
  }

  if (!hasMinimumContent(payload.input)) {
    return NextResponse.json<MailGenerationResponse>(
      {
        success: false,
        error: "대충 쓴 메일 내용이나 반드시 포함할 내용을 입력해주세요.",
      },
      { status: 400 },
    );
  }

  const options = cleanOptions(payload.options);
  const useOpenAI = process.env.MAIL_GENERATION_PROVIDER === "openai";
  const hasApiKey = Boolean(process.env.OPENAI_API_KEY);

  try {
    if (!useOpenAI || !hasApiKey) {
      const data = await generateBusinessMail(payload.input, options);

      return NextResponse.json<MailGenerationResponse>({
        success: true,
        data,
        provider: "mock",
      });
    }

    const data = await generateOpenAIEmail(payload.input, options);

    return NextResponse.json<MailGenerationResponse>({
      success: true,
      data,
      provider: "openai",
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "메일 생성 중 알 수 없는 오류가 발생했습니다.";

    return NextResponse.json<MailGenerationResponse>(
      {
        success: false,
        error:
          message ||
          "메일 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
      },
      { status: 500 },
    );
  }
}
