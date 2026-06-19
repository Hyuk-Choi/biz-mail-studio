"use client";

import TemplateSelector from "@/components/TemplateSelector";
import {
  languageOptions,
  templateModeOptions,
  toneOptions,
} from "@/data/mailOptions";
import { mailTemplates } from "@/data/mailTemplates";
import type { MailFormInput, MailTemplateId } from "@/types/mail";

interface MailFormProps {
  value: MailFormInput;
  isGenerating: boolean;
  message?: string;
  onChange: (value: MailFormInput) => void;
  onSubmit: () => void;
}

const defaultSelectedTemplateId: MailTemplateId = "work-request";

export default function MailForm({
  value,
  isGenerating,
  message = "",
  onChange,
  onSubmit,
}: MailFormProps) {
  const updateField = <K extends keyof MailFormInput>(
    field: K,
    fieldValue: MailFormInput[K],
  ) => {
    onChange({
      ...value,
      [field]: fieldValue,
    });
  };

  const selectedTemplateId =
    value.selectedTemplateId ?? defaultSelectedTemplateId;
  const hasInput = Boolean(
    value.rawDraft.trim() ||
      value.purpose?.trim() ||
      value.mustInclude?.trim() ||
      value.extraInstruction?.trim(),
  );
  const guidanceMessage =
    message || "대충 쓴 메일 내용이나 반드시 포함할 내용을 입력해주세요.";

  return (
    <form
      className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
          Draft first
        </p>
        <h2 className="mt-1 text-lg font-semibold text-slate-950">
          대충 쓴 내용을 비즈니스 메일로 변환
        </h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          말하듯 적어도 의도, 폼, 톤, 언어를 분석해 완성된 메일로 정리합니다.
        </p>
      </div>

      <div className="grid gap-5">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">
            대충 쓴 메일 내용
          </span>
          <textarea
            value={value.rawDraft}
            onChange={(event) => updateField("rawDraft", event.target.value)}
            placeholder="보내고 싶은 내용을 편하게 적어주세요. 예: 거래처에 자료가 늦어서 죄송하다고 하고, 오늘 오후까지 다시 보내겠다고 말하고 싶어."
            rows={8}
            className="resize-y rounded-md border border-slate-200 bg-white px-3 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </label>

        <div className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">
            메일 폼 선택 방식
          </span>
          <div className="grid grid-cols-2 gap-2 rounded-md bg-slate-100 p-1">
            {templateModeOptions.map((option) => {
              const isSelected = value.templateMode === option.id;

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => updateField("templateMode", option.id)}
                  className={`rounded px-3 py-2 text-sm font-semibold transition ${
                    isSelected
                      ? "bg-white text-blue-700 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          <p className="text-xs leading-5 text-slate-500">
            자동 추천 모드에서는 초안 분석 결과를 기준으로 적합한 메일 폼을
            선택합니다.
          </p>
        </div>

        {value.templateMode === "manual" ? (
          <TemplateSelector
            templates={mailTemplates}
            selectedId={selectedTemplateId}
            onSelect={(templateId) =>
              updateField("selectedTemplateId", templateId)
            }
          />
        ) : null}

        <div className="grid gap-5 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">언어 선택</span>
            <select
              value={value.languageMode}
              onChange={(event) =>
                updateField(
                  "languageMode",
                  event.target.value as MailFormInput["languageMode"],
                )
              }
              className="h-11 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              {languageOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">톤 선택</span>
            <select
              value={value.tone}
              onChange={(event) =>
                updateField("tone", event.target.value as MailFormInput["tone"])
              }
              className="h-11 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              {toneOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">
              받는 사람
              <span className="ml-1 font-normal text-slate-400">선택</span>
            </span>
            <input
              value={value.recipient ?? ""}
              onChange={(event) => updateField("recipient", event.target.value)}
              placeholder="예: 김지훈 팀장님, Alex, ABC Trading 담당자"
              className="h-11 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">
              보내는 사람
              <span className="ml-1 font-normal text-slate-400">선택</span>
            </span>
            <input
              value={value.sender ?? ""}
              onChange={(event) => updateField("sender", event.target.value)}
              placeholder="예: 홍길동, Hyuk Choi"
              className="h-11 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </label>
        </div>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">
            반드시 포함할 내용
            <span className="ml-1 font-normal text-slate-400">선택</span>
          </span>
          <textarea
            value={value.mustInclude ?? ""}
            onChange={(event) => updateField("mustInclude", event.target.value)}
            placeholder="예: 오늘 오후까지 재전달, 금요일까지 회신 요청, 수정 제안서 첨부 예정"
            rows={4}
            className="resize-y rounded-md border border-slate-200 bg-white px-3 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </label>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">
              메일 목적
              <span className="ml-1 font-normal text-slate-400">선택</span>
            </span>
            <input
              value={value.purpose ?? ""}
              onChange={(event) => updateField("purpose", event.target.value)}
              placeholder="예: 자료 전달 지연 사과 및 재전달 안내"
              className="h-11 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">
              추가 요청사항
              <span className="ml-1 font-normal text-slate-400">선택</span>
            </span>
            <input
              value={value.extraInstruction ?? ""}
              onChange={(event) =>
                updateField("extraInstruction", event.target.value)
              }
              placeholder="예: 너무 딱딱하지 않게, 영어권 표현으로 자연스럽게"
              className="h-11 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </label>
        </div>
      </div>

      <button
        type="submit"
        disabled={isGenerating || !hasInput}
        className="mt-6 flex h-12 w-full items-center justify-center rounded-md bg-blue-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {isGenerating ? "분석 및 작성 중..." : "비즈니스 메일로 바꾸기"}
      </button>

      {!hasInput || message ? (
        <p className="mt-3 rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-800">
          {guidanceMessage}
        </p>
      ) : null}
    </form>
  );
}
