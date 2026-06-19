"use client";

import TemplateSelector from "@/components/TemplateSelector";
import { languageOptions, toneOptions } from "@/data/mailOptions";
import {
  getMailTemplateById,
  mailTemplates,
  templateToMailCaseMap,
} from "@/data/mailTemplates";
import type { MailFormInput, MailTemplateId } from "@/types/mail";

interface MailFormProps {
  value: MailFormInput;
  isGenerating: boolean;
  message?: string;
  onChange: (value: MailFormInput) => void;
  onSubmit: () => void;
}

const draftPlaceholders: Partial<Record<MailTemplateId, string>> = {
  "work-request": "요청하고 싶은 업무, 요청 배경, 희망 기한을 투박하게 적어주세요.",
  "schedule-adjustment": "조율하려는 일정, 가능한 날짜/시간, 상대방에게 묻고 싶은 내용을 적어주세요.",
  "meeting-request": "미팅 목적, 논의하고 싶은 내용, 희망 일정을 간단히 적어주세요.",
  "meeting-follow-up": "이전 미팅에서 논의한 내용과 후속 액션을 메모하듯 적어주세요.",
  proposal: "제안 배경, 제안 내용, 기대 효과, 요청하고 싶은 답변을 적어주세요.",
  collaboration: "협업 제안 배경, 아이디어, 상대방에게 줄 수 있는 이점을 적어주세요.",
  "quotation-request": "견적이 필요한 제품/서비스, 조건, 수량, 희망 회신 기한을 적어주세요.",
  "document-request": "필요한 자료, 사용 목적, 전달받고 싶은 기한을 적어주세요.",
  "reply-reminder": "이전에 요청한 내용, 현재 필요한 회신, 희망 회신 시점을 적어주세요.",
  thanks: "감사한 일, 상대방이 도와준 내용, 앞으로 이어가고 싶은 관계를 적어주세요.",
  apology: "문제 상황, 사과해야 하는 이유, 대응 방안, 재발 방지 내용을 적어주세요.",
  rejection: "거절해야 하는 요청, 사유, 대안이나 양해를 구할 내용을 적어주세요.",
  complaint: "문제 상황, 발생한 영향, 상대방에게 요청할 조치를 적어주세요.",
  report: "보고할 업무, 진행 상황, 이슈, 다음 액션을 적어주세요.",
  "self-introduction": "자기소개, 연락 목적, 강조하고 싶은 강점이나 링크를 적어주세요.",
  "global-business": "Write rough notes, key points, or a draft for a global business email.",
};

const keyPointPlaceholders: Partial<Record<MailTemplateId, string>> = {
  "work-request": "예: 요청 업무, 참고 자료, 희망 기한, 상대방 액션",
  "schedule-adjustment": "예: 6/24 오전 10시, 6/25 오후 2시, 가능 시간 회신 요청",
  "meeting-request": "예: 논의 안건 3개, 희망 일정, 참석자, 회신 요청",
  "meeting-follow-up": "예: 결정 사항, 담당자별 액션, 다음 공유 일정",
  proposal: "예: 제안 개요, 기대 효과, 검토 요청, 다음 미팅 제안",
  collaboration: "예: 협업 방식, 진행 범위, 기대 효과, 미팅 요청",
  "quotation-request": "예: 요청 항목, 수량, 납기, 예산 조건, 회신 기한",
  "document-request": "예: 보고서 파일, 이미지 원본, 사용 목적, 금요일까지",
  "reply-reminder": "예: 이전 요청일, 필요한 답변, 회신 희망 시점",
  thanks: "예: 도움 받은 내용, 긍정적 결과, 향후 협업 기대",
  apology: "예: 지연 사유, 현재 조치, 재발 방지 계획",
  rejection: "예: 감사 표현, 거절 사유, 대안, 향후 가능성",
  complaint: "예: 문제 현상, 발생 시점, 영향, 요청 조치",
  report: "예: 핵심 요약, 진행률, 주요 이슈, 다음 액션",
  "self-introduction": "예: 경력 요약, 지원 목적, 포트폴리오 링크, 강점",
  "global-business": "Example: purpose, key context, request, deadline, next step",
};

function getDraftPlaceholder(templateId: MailTemplateId) {
  return (
    draftPlaceholders[templateId] ??
    "투박하게 작성한 메일 초안이나 핵심 문장을 붙여넣으세요."
  );
}

function getKeyPointPlaceholder(templateId: MailTemplateId) {
  return (
    keyPointPlaceholders[templateId] ??
    "예: 반드시 포함해야 할 내용, 회신 기한, 참고 사항"
  );
}

export default function MailForm({
  value,
  isGenerating,
  message = "",
  onChange,
  onSubmit,
}: MailFormProps) {
  const selectedTemplate = getMailTemplateById(value.mailTemplateId);
  const updateField = <K extends keyof MailFormInput>(
    field: K,
    fieldValue: MailFormInput[K],
  ) => {
    onChange({
      ...value,
      [field]: fieldValue,
    });
  };

  const handleTemplateSelect = (templateId: MailTemplateId) => {
    const isGlobalBusiness = templateId === "global-business";

    onChange({
      ...value,
      mailTemplateId: templateId,
      mailCase: templateToMailCaseMap[templateId],
      language: isGlobalBusiness ? "en_business" : value.language,
      tone: isGlobalBusiness ? "global_business" : value.tone,
    });
  };

  const hasInput = Boolean(
    value.purpose.trim() || value.keyPoints.trim() || value.draft.trim(),
  );
  const guidanceMessage =
    message || "메일 목적, 반드시 포함할 내용, 초안 중 하나 이상 입력해주세요.";

  return (
    <form
      className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-950">메일 정보 입력</h2>
        <p className="mt-1 text-sm text-slate-500">
          핵심 내용만 적어도 전문적인 메일 형식으로 정리합니다.
        </p>
      </div>

      <div className="grid gap-5">
        <TemplateSelector
          templates={mailTemplates}
          selectedId={value.mailTemplateId}
          onSelect={handleTemplateSelect}
        />

        <div className="grid gap-5 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">언어</span>
            <select
              value={value.language}
              onChange={(event) =>
                updateField(
                  "language",
                  event.target.value as MailFormInput["language"],
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
            <span className="text-sm font-medium text-slate-700">톤</span>
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

        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">받는 사람</span>
          <input
            value={value.recipient}
            onChange={(event) => updateField("recipient", event.target.value)}
            placeholder="예: 김지훈 팀장님, ABC Trading 담당자"
            className="h-11 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">메일 목적</span>
          <input
            value={value.purpose}
            onChange={(event) => updateField("purpose", event.target.value)}
            placeholder="예: 다음 주 캠페인 일정 조율 요청"
            className="h-11 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">
            반드시 포함할 내용
          </span>
          <textarea
            value={value.keyPoints}
            onChange={(event) => updateField("keyPoints", event.target.value)}
            placeholder={getKeyPointPlaceholder(value.mailTemplateId)}
            rows={4}
            className="resize-y rounded-md border border-slate-200 bg-white px-3 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </label>

        <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-sm font-semibold text-slate-800">
            작성 전 확인하면 좋은 질문
          </p>
          <ul className="mt-2 grid gap-1.5">
            {selectedTemplate.guideQuestions.map((question) => (
              <li key={question} className="text-sm leading-6 text-slate-600">
                - {question}
              </li>
            ))}
          </ul>
        </div>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">
            사용자가 작성한 초안
          </span>
          <textarea
            value={value.draft}
            onChange={(event) => updateField("draft", event.target.value)}
            placeholder={getDraftPlaceholder(value.mailTemplateId)}
            rows={6}
            className="resize-y rounded-md border border-slate-200 bg-white px-3 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">추가 요청사항</span>
          <textarea
            value={value.additionalRequests}
            onChange={(event) =>
              updateField("additionalRequests", event.target.value)
            }
            placeholder="예: 너무 딱딱하지 않게, 해외 거래처가 이해하기 쉽게"
            rows={3}
            className="resize-y rounded-md border border-slate-200 bg-white px-3 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={isGenerating || !hasInput}
        className="mt-6 flex h-12 w-full items-center justify-center rounded-md bg-blue-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {isGenerating ? "작성 중..." : "메일 작성하기"}
      </button>

      {!hasInput || message ? (
        <p className="mt-3 rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-800">
          {guidanceMessage}
        </p>
      ) : null}
    </form>
  );
}
