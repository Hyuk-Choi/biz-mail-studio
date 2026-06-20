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

const draftExamples = [
  {
    label: "자료 전달 지연 사과",
    draft:
      "거래처에 자료 전달이 늦어서 죄송하다고 하고, 오늘 오후까지 다시 확인해서 보내겠다고 말해줘.",
  },
  {
    label: "미팅 일정 조율",
    draft:
      "다음 주 화요일이나 수요일 중에 미팅 가능한지 정중하게 물어보고 싶어.",
  },
  {
    label: "견적서 요청",
    draft:
      "거래처에 견적서를 이번 주 안으로 받을 수 있는지 정중하게 물어보고 싶어.",
  },
  {
    label: "회신 리마인드",
    draft:
      "지난주에 보낸 제안서에 아직 답이 없어서 정중하게 다시 확인하고 싶어.",
  },
  {
    label: "영어 요청 메일",
    draft: "Ask the client to send the revised proposal by Friday.",
  },
  {
    label: "협업 제안 메일",
    draft:
      "브랜드 담당자에게 신규 캠페인 관련 협업을 제안하고, 관심 있으면 다음 주에 짧게 미팅하고 싶다고 말해줘.",
  },
];

const inputFrameworkItems = [
  {
    symbol: "必",
    label: "반드시 넣을 정보",
    description: "상대에게 꼭 전달되어야 하는 사실, 기한, 요청사항",
  },
  {
    symbol: "有",
    label: "있으면 좋은 맥락",
    description: "받는 사람, 목적, 배경처럼 메일을 더 자연스럽게 만드는 정보",
  },
  {
    symbol: "多",
    label: "다듬기 방향",
    description: "더 정중하게, 짧게, 설득력 있게 등 원하는 표현 방식",
  },
];

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
        <section className="rounded-md border border-blue-100 bg-blue-50/70 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                BizMail Form
              </p>
              <h3 className="mt-1 text-sm font-semibold text-slate-950">
                必 · 有 · 多 입력 프레임워크
              </h3>
            </div>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {inputFrameworkItems.map((item) => (
              <div
                key={item.symbol}
                className="rounded-md border border-blue-100 bg-white px-3 py-3"
              >
                <div className="flex items-center gap-2">
                  <span className="flex size-7 items-center justify-center rounded bg-blue-700 text-sm font-bold text-white">
                    {item.symbol}
                  </span>
                  <span className="text-sm font-semibold text-slate-900">
                    {item.label}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-600">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <div className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">
            입력 예시
          </span>
          <div className="flex flex-wrap gap-2">
            {draftExamples.map((example) => (
              <button
                key={example.label}
                type="button"
                onClick={() => updateField("rawDraft", example.draft)}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              >
                {example.label}
              </button>
            ))}
          </div>
        </div>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">
            必 대충 쓴 메일 내용
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
            必 반드시 포함할 내용
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
              有 메일 목적
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
              多 추가 요청사항
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
