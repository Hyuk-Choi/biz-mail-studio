import type { MailTemplateId } from "@/types/mail";

export type ConfidenceLevel = "높음" | "보통" | "낮음";

export type AnalysisScoreKey =
  | "marketFit"
  | "targetFit"
  | "messageClarity"
  | "conversionPotential"
  | "budgetEfficiency"
  | "executionDifficulty";

export type AnalysisScores = Record<AnalysisScoreKey, number>;

export type PriorityLevel = "높음" | "중간" | "낮음";

export type PriorityAction = {
  priority: PriorityLevel;
  action: string;
  reason: string;
};

export type InputCompleteness = {
  score: number;
  filledFields: string[];
  missingFields: string[];
  followUpQuestions: string[];
};

export type ScoreBreakdown = {
  key: AnalysisScoreKey;
  label: string;
  score: number;
  weight: number;
  reason: string;
};

export type BenchmarkRange = {
  label: string;
  range: string;
  note: string;
};

export type DetectedSignal = {
  label: string;
  value: string;
};

export type AnalysisResult = {
  summary: string;
  totalScore: number;
  confidenceLevel: ConfidenceLevel;
  scores: AnalysisScores;
  keyInsights: string[];
  problems: string[];
  recommendations: string[];
  priorityActions: PriorityAction[];
  generatedCopy: string[];
  nextTestIdeas: string[];
  caution: string;
  reasoningSummary: string[];
  scoreBreakdown: ScoreBreakdown[];
  benchmarkRanges: BenchmarkRange[];
  inputCompleteness: InputCompleteness;
  detectedSignals: DetectedSignal[];
  matchedKnowledgeIds: string[];
  appliedTemplateId: MailTemplateId;
};
