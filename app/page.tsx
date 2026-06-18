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
  mailCase: "work_request",
  language: "ko_business",
  tone: "polite",
  recipient: "",
  purpose: "",
  keyPoints: "",
  draft: "",
  additionalRequests: "",
};

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
    const hasRequiredContent =
      formInput.purpose.trim() ||
      formInput.keyPoints.trim() ||
      formInput.draft.trim();

    if (!hasRequiredContent || isGenerating) {
      if (!hasRequiredContent) {
        setFormMessage("메일 목적, 반드시 포함할 내용, 초안 중 하나 이상 입력해주세요.");
      }
      return;
    }

    const nextVariant = action === "regenerate" ? variant + 1 : variant;
    setVariant(nextVariant);
    setIsGenerating(true);
    setFormMessage("");
    setResultMessage("");

    try {
      const generated = await requestMailGeneration(formInput, {
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
