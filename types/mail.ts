export type MailCase =
  | "work_request"
  | "schedule_coordination"
  | "meeting_request"
  | "meeting_follow_up"
  | "proposal"
  | "collaboration_request"
  | "quote_request"
  | "document_request"
  | "reply_reminder"
  | "thanks"
  | "apology"
  | "rejection"
  | "complaint"
  | "report"
  | "self_introduction"
  | "overseas_partner"
  | "other";

export type MailLanguage =
  | "ko_business"
  | "en_business"
  | "ko_to_en"
  | "en_to_ko";

export type MailTone =
  | "polite"
  | "concise"
  | "warm"
  | "firm"
  | "persuasive"
  | "friendly_professional"
  | "formal"
  | "global_business";

export type MailRefinementAction =
  | "more_polite"
  | "shorter"
  | "more_persuasive"
  | "translate_to_english"
  | "translate_to_korean"
  | "regenerate";

export type MailTemplateId =
  | "work-request"
  | "schedule-adjustment"
  | "meeting-request"
  | "meeting-follow-up"
  | "proposal"
  | "collaboration"
  | "quotation-request"
  | "document-request"
  | "reply-reminder"
  | "thanks"
  | "apology"
  | "rejection"
  | "complaint"
  | "report"
  | "self-introduction"
  | "global-business";

export type MailTemplate = {
  id: MailTemplateId;
  label: string;
  description: string;
  recommendedTone: string;
  subjectPattern: string;
  structure: string[];
  guideQuestions: string[];
  koreanExample: string;
  englishExample?: string;
};

export interface MailOption<T extends string> {
  id: T;
  label: string;
  description?: string;
}

export interface MailFormInput {
  mailCase: MailCase;
  mailTemplateId: MailTemplateId;
  language: MailLanguage;
  tone: MailTone;
  recipient: string;
  purpose: string;
  keyPoints: string;
  draft: string;
  additionalRequests: string;
}

export interface GeneratedMailResult {
  subjects: string[];
  body: string;
  improvements: string[];
}

export interface GenerateEmailOptions {
  action?: MailRefinementAction;
  variant?: number;
}

export interface MailGenerationRequest {
  input: MailFormInput;
  options?: GenerateEmailOptions;
}

export type MailGenerationResponse =
  | {
      success: true;
      data: GeneratedMailResult;
      provider: "openai" | "mock";
    }
  | {
      success: false;
      error: string;
    };
