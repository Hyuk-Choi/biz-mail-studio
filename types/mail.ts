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
  | "global-business"
  | "general-business";

export type LanguageMode = "auto" | "ko" | "en" | "ko-to-en" | "en-to-ko";

export type TemplateMode = "auto" | "manual";

export type MailTone =
  | "auto"
  | "polite"
  | "concise"
  | "soft"
  | "firm"
  | "persuasive"
  | "friendly-professional"
  | "formal"
  | "global-business";

export type MailRefinementAction =
  | "more_polite"
  | "shorter"
  | "clearer"
  | "softer"
  | "firmer"
  | "translate_to_english"
  | "translate_to_korean"
  | "regenerate";

export type DraftAnalysis = {
  detectedPurpose: string;
  detectedRecipientType: string;
  detectedSituation: string;
  detectedUrgency: "low" | "medium" | "high";
  detectedLanguage: "ko" | "en" | "mixed" | "unknown";
  recommendedTemplateId: MailTemplateId;
  recommendedTone: MailTone;
  keyPoints: string[];
  requestedActions: string[];
  missingInfo: string[];
  confidenceScore: number;
};

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

export type MailFormInput = {
  rawDraft: string;
  templateMode: TemplateMode;
  selectedTemplateId?: MailTemplateId;
  languageMode: LanguageMode;
  tone: MailTone;
  recipient?: string;
  sender?: string;
  purpose?: string;
  mustInclude?: string;
  extraInstruction?: string;
};

export type GeneratedMailResult = {
  analysis: DraftAnalysis;
  appliedTemplateId: MailTemplateId;
  appliedTemplateLabel: string;
  subjects: string[];
  body: string;
  improvements: string[];
  missingInfoNotice: string[];
};

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
