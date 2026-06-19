import { NextResponse } from "next/server";
import { generateBusinessMail } from "@/lib/generateEmail";
import { generateOpenAIEmail } from "@/lib/openaiEmail";
import type {
  GenerateEmailOptions,
  MailRefinementAction,
  MailFormInput,
  MailGenerationRequest,
  MailGenerationResponse,
} from "@/types/mail";

export const runtime = "nodejs";

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

function isMailFormInput(value: unknown): value is MailFormInput {
  if (!value || typeof value !== "object") {
    return false;
  }

  const input = value as Record<keyof MailFormInput, unknown>;

  return (
    isString(input.rawDraft) &&
    isString(input.templateMode) &&
    isOptionalString(input.selectedTemplateId) &&
    isString(input.languageMode) &&
    isString(input.tone) &&
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
  const forceMock = process.env.MAIL_GENERATION_PROVIDER === "mock";
  const hasApiKey = Boolean(process.env.OPENAI_API_KEY);

  try {
    if (forceMock || !hasApiKey) {
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
