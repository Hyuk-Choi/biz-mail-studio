import type {
  LanguageMode,
  MailCase,
  MailOption,
  MailTone,
  TemplateMode,
} from "@/types/mail";

export const mailCases: MailOption<MailCase>[] = [
  { id: "work_request", label: "업무 요청 메일", description: "명확한 요청과 기한을 전달합니다." },
  { id: "schedule_coordination", label: "일정 조율 메일", description: "회의나 업무 일정을 부드럽게 조율합니다." },
  { id: "meeting_request", label: "미팅 요청 메일", description: "목적과 안건이 분명한 미팅을 제안합니다." },
  { id: "meeting_follow_up", label: "미팅 후 팔로업 메일", description: "논의 내용과 후속 액션을 정리합니다." },
  { id: "proposal", label: "제안 메일", description: "상대가 검토하기 쉬운 제안을 작성합니다." },
  { id: "collaboration_request", label: "협업 요청 메일", description: "상호 이점을 중심으로 협업을 요청합니다." },
  { id: "quote_request", label: "견적 요청 메일", description: "필요 조건을 정리해 견적을 요청합니다." },
  { id: "document_request", label: "자료 요청 메일", description: "필요 자료와 사용 목적을 정중히 전달합니다." },
  { id: "reply_reminder", label: "회신 독촉 메일", description: "부담을 줄이면서 회신을 요청합니다." },
  { id: "thanks", label: "감사 메일", description: "감사의 뜻을 전문적으로 표현합니다." },
  { id: "apology", label: "사과 메일", description: "상황 설명과 재발 방지 의지를 전달합니다." },
  { id: "rejection", label: "거절 메일", description: "관계를 해치지 않게 거절 의사를 전합니다." },
  { id: "complaint", label: "클레임/불만 전달 메일", description: "문제 상황과 요청 사항을 차분히 전달합니다." },
  { id: "report", label: "보고 메일", description: "핵심 결과와 진행 상황을 구조적으로 보고합니다." },
  { id: "self_introduction", label: "자기소개/지원 메일", description: "첫인상과 강점을 전문적으로 전달합니다." },
  { id: "overseas_partner", label: "해외 거래처 메일", description: "글로벌 비즈니스 맥락에 맞게 작성합니다." },
  { id: "other", label: "기타", description: "특수한 상황의 메일을 작성합니다." },
];

export const templateModeOptions: MailOption<TemplateMode>[] = [
  {
    id: "auto",
    label: "자동 추천",
    description: "입력 내용을 분석해 가장 적절한 메일 폼을 추천합니다.",
  },
  {
    id: "manual",
    label: "직접 선택",
    description: "사용자가 고른 메일 폼을 우선 적용합니다.",
  },
];

export const languageOptions: MailOption<LanguageMode>[] = [
  { id: "auto", label: "자동 감지" },
  { id: "ko", label: "한국어 비즈니스 메일" },
  { id: "en", label: "영어 비즈니스 메일" },
  { id: "ko-to-en", label: "한국어 초안을 영어 메일로" },
  { id: "en-to-ko", label: "영어 초안을 한국어 메일로" },
];

export const toneOptions: MailOption<MailTone>[] = [
  { id: "auto", label: "자동 추천" },
  { id: "polite", label: "정중한" },
  { id: "concise", label: "간결한" },
  { id: "soft", label: "부드러운" },
  { id: "firm", label: "단호한" },
  { id: "persuasive", label: "설득력 있는" },
  { id: "friendly-professional", label: "친근하지만 전문적인" },
  { id: "formal", label: "격식 있는" },
  { id: "global-business", label: "글로벌 비즈니스 스타일" },
];

export const featuredCaseCards = [
  {
    title: "요청 메일",
    description: "업무 요청과 자료 요청을 명확하고 정중하게 정리합니다.",
  },
  {
    title: "일정 조율",
    description: "가능 시간, 대안 일정, 회신 요청을 자연스럽게 구성합니다.",
  },
  {
    title: "제안 메일",
    description: "제안 배경, 기대 효과, 다음 액션을 설득력 있게 전달합니다.",
  },
  {
    title: "감사 메일",
    description: "협조와 도움에 대한 감사를 과하지 않게 표현합니다.",
  },
  {
    title: "사과 메일",
    description: "문제 인정, 조치 사항, 재발 방지 의지를 차분히 담습니다.",
  },
  {
    title: "영어 메일",
    description: "해외 거래처에 맞는 자연스러운 글로벌 비즈니스 표현으로 바꿉니다.",
  },
];
