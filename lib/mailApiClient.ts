import type {
  GenerateEmailOptions,
  GeneratedMailResult,
  MailFormInput,
  MailGenerationResponse,
} from "@/types/mail";

export async function requestMailGeneration(
  input: MailFormInput,
  options: GenerateEmailOptions = {},
): Promise<GeneratedMailResult> {
  const response = await fetch("/api/mail/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ input, options }),
  });

  const payload = (await response.json().catch(() => null)) as
    | MailGenerationResponse
    | null;

  if (!response.ok || !payload?.success) {
    throw new Error(
      payload && !payload.success
        ? payload.error
        : "메일 생성에 실패했습니다. 잠시 후 다시 시도해주세요.",
    );
  }

  return payload.data;
}
