"use client";

import { useState } from "react";
import CaseCards from "@/components/CaseCards";
import Header from "@/components/Header";
import MailForm from "@/components/MailForm";
import MailResult from "@/components/MailResult";
import { requestMailGeneration } from "@/lib/mailApiClient";
import type {
  GeneratedMailResult,
  MailFormInput,
  MailRefinementAction,
} from "@/types/mail";

const initialInput: MailFormInput = {
  rawDraft: "",
  templateMode: "auto",
  selectedTemplateId: "work-request",
  languageMode: "auto",
  tone: "auto",
  recipient: "",
  sender: "",
  purpose: "",
  mustInclude: "",
  extraInstruction: "",
};

function applyRefinementAction(
  input: MailFormInput,
  action?: MailRefinementAction,
): MailFormInput {
  if (!action || action === "regenerate") {
    return input;
  }

  if (action === "more_polite") {
    return { ...input, tone: "polite" };
  }

  if (action === "shorter") {
    return { ...input, tone: "concise" };
  }

  if (action === "clearer") {
    return {
      ...input,
      extraInstruction: [input.extraInstruction, "요청사항과 액션 아이템을 더 명확하게"]
        .filter(Boolean)
        .join("\n"),
    };
  }

  if (action === "softer") {
    return { ...input, tone: "soft" };
  }

  if (action === "firmer") {
    return { ...input, tone: "firm" };
  }

  if (action === "translate_to_english") {
    return { ...input, languageMode: "ko-to-en" };
  }

  if (action === "translate_to_korean") {
    return { ...input, languageMode: "en-to-ko" };
  }

  return input;
}

export default function Home() {
  const [formInput, setFormInput] = useState<MailFormInput>(initialInput);
  const [result, setResult] = useState<GeneratedMailResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [formMessage, setFormMessage] = useState("");
  const [resultMessage, setResultMessage] = useState("");
  const [variant, setVariant] = useState(0);

  const handleFormChange = (nextInput: MailFormInput) => {
    setFormInput(nextInput);
    if (formMessage) {
      setFormMessage("");
    }
  };

  const handleGenerate = async (action?: MailRefinementAction) => {
    const effectiveInput = applyRefinementAction(formInput, action);
    const hasRequiredContent =
      effectiveInput.rawDraft.trim() ||
      effectiveInput.purpose?.trim() ||
      effectiveInput.mustInclude?.trim() ||
      effectiveInput.extraInstruction?.trim();

    if (!hasRequiredContent || isGenerating) {
      if (!hasRequiredContent) {
        setFormMessage("대충 쓴 메일 내용이나 반드시 포함할 내용을 입력해주세요.");
      }
      return;
    }

    const nextVariant = action === "regenerate" ? variant + 1 : variant;

    setVariant(nextVariant);
    setFormInput(effectiveInput);
    setIsGenerating(true);
    setFormMessage("");
    setResultMessage("");

    try {
      const generated = await requestMailGeneration(effectiveInput, {
        action,
        variant: nextVariant,
      });
      setResult(generated);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "메일 생성에 실패했습니다. 잠시 후 다시 시도해주세요.";
      setResultMessage(message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <Header />

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-8 sm:px-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:px-8">
        <MailForm
          value={formInput}
          isGenerating={isGenerating}
          message={formMessage}
          onChange={handleFormChange}
          onSubmit={() => handleGenerate()}
        />
        <MailResult
          result={result}
          isGenerating={isGenerating}
          message={resultMessage}
          onRefine={handleGenerate}
        />
      </section>

      <CaseCards />
    </main>
  );
}
