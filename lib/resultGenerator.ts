import { buildRecommendations } from "@/lib/recommendationEngine";
import { scoreMailInput } from "@/lib/scoringEngine";
import type { AnalysisResult } from "@/types/analysis";
import type {
  GenerateEmailOptions,
  GeneratedMailResult,
  MailFormInput,
} from "@/types/mail";

export function generateAnalysisResult(
  input: MailFormInput,
  generated: Omit<GeneratedMailResult, "analysisResult">,
  options: GenerateEmailOptions = {},
): AnalysisResult {
  const scoring = scoreMailInput(input, generated.analysis, options);
  const recommendations = buildRecommendations({
    input,
    analysis: generated.analysis,
    generated,
    scoring,
    options,
  });

  return {
    summary: recommendations.summary,
    totalScore: scoring.totalScore,
    confidenceLevel: scoring.confidenceLevel,
    scores: scoring.scores,
    keyInsights: recommendations.keyInsights,
    problems: recommendations.problems,
    recommendations: recommendations.recommendations,
    priorityActions: recommendations.priorityActions,
    generatedCopy: recommendations.generatedCopy,
    nextTestIdeas: recommendations.nextTestIdeas,
    caution: recommendations.caution,
    reasoningSummary: scoring.reasoningSummary,
    scoreBreakdown: scoring.scoreBreakdown,
    benchmarkRanges: scoring.benchmarkRanges,
    inputCompleteness: scoring.inputCompleteness,
    detectedSignals: scoring.detectedSignals,
    matchedKnowledgeIds: scoring.matchedKnowledgeItems.map((item) => item.id),
    appliedTemplateId: generated.appliedTemplateId,
  };
}
