import type { BenchmarkRange } from "@/types/analysis";
import type { MailTemplateId } from "@/types/mail";

export type TemplateBenchmark = {
  id: string;
  label: string;
  appliesTo: MailTemplateId[];
  summary: string;
  ranges: BenchmarkRange[];
};

export const templateBenchmarks: TemplateBenchmark[] = [
  {
    id: "bench-work-request",
    label: "업무 요청 메일 기준",
    appliesTo: ["work-request"],
    summary: "업무 요청은 요청 대상, 기한, 후속 액션이 분리되어 있을 때 완성도가 높습니다.",
    ranges: [
      { label: "요청 명확도", range: "75-90", note: "요청 대상과 액션이 명확한 경우" },
      { label: "실행 안정성", range: "70-88", note: "기한과 확인 항목이 함께 있는 경우" },
    ],
  },
  {
    id: "bench-schedule",
    label: "일정 조율 메일 기준",
    appliesTo: ["schedule-adjustment"],
    summary: "일정 조율은 2개 이상의 후보와 대안 요청이 있으면 왕복 커뮤니케이션을 줄일 수 있습니다.",
    ranges: [
      { label: "조율 효율", range: "76-92", note: "후보 일정과 대안 요청이 있는 경우" },
      { label: "수신자 배려", range: "72-88", note: "상대 일정 선택권을 열어둔 경우" },
    ],
  },
  {
    id: "bench-meeting",
    label: "미팅 요청 메일 기준",
    appliesTo: ["meeting-request"],
    summary: "미팅 목적과 논의 안건이 선명할수록 수락 가능성이 높아집니다.",
    ranges: [
      { label: "미팅 수락 가능성", range: "70-86", note: "목적, 안건, 후보 일정이 모두 있는 경우" },
      { label: "메시지 명확도", range: "74-90", note: "논의 항목이 목록화된 경우" },
    ],
  },
  {
    id: "bench-followup",
    label: "팔로업 메일 기준",
    appliesTo: ["meeting-follow-up"],
    summary: "팔로업은 논의 요약보다 다음 액션과 책임 범위가 핵심입니다.",
    ranges: [
      { label: "후속 실행력", range: "78-92", note: "후속 액션과 확인 시점이 있는 경우" },
      { label: "정리 품질", range: "72-88", note: "논의 내용이 과하지 않게 요약된 경우" },
    ],
  },
  {
    id: "bench-proposal",
    label: "제안 메일 기준",
    appliesTo: ["proposal"],
    summary: "제안 메일은 상대 관점의 기대 효과와 다음 논의 요청이 있어야 설득력이 생깁니다.",
    ranges: [
      { label: "설득 가능성", range: "68-88", note: "기대 효과와 실행 부담이 함께 설명된 경우" },
      { label: "검토 유도력", range: "70-86", note: "다음 단계가 명확한 경우" },
    ],
  },
  {
    id: "bench-collaboration",
    label: "협업 요청 메일 기준",
    appliesTo: ["collaboration"],
    summary: "협업 요청은 상호 이점과 브랜드 적합성이 드러날 때 응답률이 좋아집니다.",
    ranges: [
      { label: "상대 적합도", range: "72-90", note: "상대 브랜드 관점의 이점이 있는 경우" },
      { label: "후속 논의 가능성", range: "68-86", note: "짧은 미팅 또는 회신 요청이 있는 경우" },
    ],
  },
  {
    id: "bench-quotation",
    label: "견적 요청 메일 기준",
    appliesTo: ["quotation-request"],
    summary: "견적 요청은 범위, 조건, 기한이 명확해야 추가 질의를 줄일 수 있습니다.",
    ranges: [
      { label: "견적 정확도", range: "76-92", note: "수량, 범위, 포함/제외 조건이 있는 경우" },
      { label: "회신 효율", range: "70-88", note: "희망 회신 기한이 있는 경우" },
    ],
  },
  {
    id: "bench-document",
    label: "자료 요청 메일 기준",
    appliesTo: ["document-request"],
    summary: "자료 요청은 필요한 자료와 사용 목적을 함께 제시해야 정확한 자료를 받을 수 있습니다.",
    ranges: [
      { label: "자료 정확도", range: "74-90", note: "자료명과 사용 목적이 함께 있는 경우" },
      { label: "처리 속도", range: "68-86", note: "전달 기한과 형식이 명확한 경우" },
    ],
  },
  {
    id: "bench-reminder",
    label: "회신 리마인드 메일 기준",
    appliesTo: ["reply-reminder"],
    summary: "리마인드는 이전 요청을 환기하되 압박감을 줄여야 관계 리스크가 낮아집니다.",
    ranges: [
      { label: "회신 유도력", range: "70-88", note: "이전 요청과 희망 회신 시점이 있는 경우" },
      { label: "톤 안정성", range: "76-92", note: "상대 상황을 배려하는 표현이 있는 경우" },
    ],
  },
  {
    id: "bench-thanks",
    label: "감사 메일 기준",
    appliesTo: ["thanks"],
    summary: "감사 메일은 구체적 감사 사유가 있을 때 형식적인 인사를 넘어섭니다.",
    ranges: [
      { label: "진정성", range: "72-90", note: "도움 받은 내용과 결과가 있는 경우" },
      { label: "관계 유지력", range: "70-86", note: "향후 협업 의지가 자연스럽게 포함된 경우" },
    ],
  },
  {
    id: "bench-apology",
    label: "사과 메일 기준",
    appliesTo: ["apology"],
    summary: "사과 메일은 문제 인정, 대응 일정, 재발 방지 문장이 함께 있어야 신뢰가 회복됩니다.",
    ranges: [
      { label: "신뢰 회복력", range: "74-90", note: "사과와 대응 계획이 분리된 경우" },
      { label: "리스크 관리", range: "72-88", note: "재발 방지 문장이 있는 경우" },
    ],
  },
  {
    id: "bench-rejection",
    label: "거절 메일 기준",
    appliesTo: ["rejection"],
    summary: "거절 메일은 짧은 사유와 관계를 남기는 마무리가 균형을 만듭니다.",
    ranges: [
      { label: "관계 보존", range: "72-88", note: "감사와 양해 표현이 있는 경우" },
      { label: "메시지 선명도", range: "68-84", note: "거절 의사가 모호하지 않은 경우" },
    ],
  },
  {
    id: "bench-complaint",
    label: "클레임 메일 기준",
    appliesTo: ["complaint"],
    summary: "클레임 메일은 감정 표현을 낮추고 사실, 영향, 요청 조치를 분리해야 합니다.",
    ranges: [
      { label: "해결 가능성", range: "70-88", note: "요청 조치와 기대 회신이 있는 경우" },
      { label: "톤 안정성", range: "74-90", note: "감정적 표현을 낮춘 경우" },
    ],
  },
  {
    id: "bench-report",
    label: "보고 메일 기준",
    appliesTo: ["report"],
    summary: "보고 메일은 핵심 요약, 진행 상황, 이슈, 다음 액션이 먼저 보여야 합니다.",
    ranges: [
      { label: "보고 가독성", range: "76-92", note: "핵심 요약과 이슈가 분리된 경우" },
      { label: "의사결정 지원", range: "72-88", note: "다음 액션이나 필요한 결정이 있는 경우" },
    ],
  },
  {
    id: "bench-intro",
    label: "자기소개/지원 메일 기준",
    appliesTo: ["self-introduction"],
    summary: "지원 메일은 지원 목적, 강점, 첨부 자료가 빠르게 보여야 합니다.",
    ranges: [
      { label: "적합성 전달", range: "70-88", note: "지원 목적과 강점이 연결된 경우" },
      { label: "검토 편의성", range: "72-86", note: "포트폴리오나 첨부 안내가 명확한 경우" },
    ],
  },
  {
    id: "bench-global",
    label: "글로벌 비즈니스 메일 기준",
    appliesTo: ["global-business"],
    summary: "영어 비즈니스 메일은 목적, 요청, 기한이 간결하게 보일 때 자연스럽습니다.",
    ranges: [
      { label: "글로벌 톤 적합도", range: "74-92", note: "직역 표현 없이 요청이 명확한 경우" },
      { label: "회신 유도력", range: "70-88", note: "Could you please, Please let me know 구조가 자연스러운 경우" },
    ],
  },
  {
    id: "bench-general",
    label: "일반 비즈니스 메일 기준",
    appliesTo: ["general-business"],
    summary: "일반 메일은 목적과 핵심 내용을 분리하면 대부분의 업무 상황에 안정적으로 대응합니다.",
    ranges: [
      { label: "범용 완성도", range: "68-84", note: "목적, 핵심 내용, 요청이 모두 있는 경우" },
      { label: "추가 정보 필요도", range: "60-78", note: "특수 폼이 불명확한 경우" },
    ],
  },
  {
    id: "bench-marker",
    label: "BizMail 메모 표기 기준",
    appliesTo: [
      "work-request",
      "document-request",
      "quotation-request",
      "collaboration",
      "global-business",
    ],
    summary: "必/有/多 표기는 외부 메일에 그대로 두지 않고 자연스러운 업무 문장으로 변환해야 합니다.",
    ranges: [
      { label: "표기 해석 품질", range: "78-94", note: "필수 조건, 가능성, 다수 항목으로 풀어 쓴 경우" },
      { label: "발송 안정성", range: "72-90", note: "내부 약어가 남지 않은 경우" },
    ],
  },
  {
    id: "bench-low-context",
    label: "저맥락 입력 보완 기준",
    appliesTo: [
      "work-request",
      "schedule-adjustment",
      "meeting-request",
      "reply-reminder",
      "general-business",
    ],
    summary: "대충 쓴 초안은 제공된 사실만 사용하고 부족한 정보는 누락 안내로 분리하는 것이 안전합니다.",
    ranges: [
      { label: "의도 보존", range: "66-84", note: "새 사실을 추가하지 않은 경우" },
      { label: "보완 필요도", range: "58-76", note: "수신자, 기한, 서명이 빠진 경우" },
    ],
  },
];

export function getBenchmarksForTemplate(templateId: MailTemplateId) {
  const matched = templateBenchmarks.filter((benchmark) =>
    benchmark.appliesTo.includes(templateId),
  );

  return matched.length
    ? matched
    : templateBenchmarks.filter((benchmark) =>
        benchmark.appliesTo.includes("general-business"),
      );
}
