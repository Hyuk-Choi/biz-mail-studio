import type { MailFormInput } from "@/types/mail";

export type BizMailMarkerKind = "required" | "exists" | "many";

export interface BizMailMarkerInsight {
  marker: "必" | "有" | "多";
  kind: BizMailMarkerKind;
  value: string;
}

type OutputLanguage = "ko" | "en";

const markerConfig: Record<
  BizMailMarkerInsight["marker"],
  { kind: BizMailMarkerKind; koSuffix: string; enPrefix: string }
> = {
  "必": {
    kind: "required",
    koSuffix: "필수",
    enPrefix: "Required",
  },
  "有": {
    kind: "exists",
    koSuffix: "있음",
    enPrefix: "Note",
  },
  "多": {
    kind: "many",
    koSuffix: "다수",
    enPrefix: "Multiple",
  },
};

const markerPattern = /[必有多]/;
const markerGlobalPattern = /[必有多]/g;
const bracketedMarkerPattern =
  /[\(\[\{（【]([^()\[\]{}（）【】]*[必有多][^()\[\]{}（）【】]*)[\)\]\}）】]/g;

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function cleanMarkerValue(value: string) {
  return normalizeWhitespace(
    value
      .replace(markerGlobalPattern, "")
      .replace(/^[\s:：\-–—,，;；/]+|[\s:：\-–—,，;；/]+$/g, "")
      .replace(/^(필수|있음|다수|많음)\s*/g, "")
      .replace(/\s*(필수|있음|다수|많음)$/g, ""),
  );
}

function markerFromPhrase(phrase: string): BizMailMarkerInsight | null {
  const marker = phrase.match(markerPattern)?.[0] as
    | BizMailMarkerInsight["marker"]
    | undefined;

  if (!marker) {
    return null;
  }

  const value = cleanMarkerValue(phrase);

  if (!value) {
    return null;
  }

  return {
    marker,
    kind: markerConfig[marker].kind,
    value,
  };
}

function splitMemoSegments(value: string) {
  return value
    .split(/\n|,|，|;|；|•|\/|(?<!\d)\.(?!\d)/)
    .map((segment) => segment.trim())
    .filter(Boolean);
}

function uniqueInsights(insights: BizMailMarkerInsight[]) {
  const seen = new Set<string>();

  return insights.filter((insight) => {
    const key = `${insight.kind}:${insight.value}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export function extractBizMailMarkerInsights(value = "") {
  const insights: BizMailMarkerInsight[] = [];

  bracketedMarkerPattern.lastIndex = 0;
  let match = bracketedMarkerPattern.exec(value);

  while (match) {
    const insight = markerFromPhrase(match[1]);

    if (insight) {
      insights.push(insight);
    }

    match = bracketedMarkerPattern.exec(value);
  }

  const withoutBracketedMarkers = value.replace(bracketedMarkerPattern, " ");

  for (const segment of splitMemoSegments(withoutBracketedMarkers)) {
    const insight = markerFromPhrase(segment);

    if (insight) {
      insights.push(insight);
    }
  }

  return uniqueInsights(insights);
}

export function extractBizMailMarkerInsightsFromInput(input: MailFormInput) {
  return uniqueInsights(
    [
      input.rawDraft,
      input.purpose,
      input.mustInclude,
      input.extraInstruction,
    ].flatMap((value) => extractBizMailMarkerInsights(value)),
  );
}

export function stripBizMailMarkerSegments(value = "") {
  const withoutBracketedMarkers = value.replace(bracketedMarkerPattern, " ");

  return splitMemoSegments(withoutBracketedMarkers)
    .filter((segment) => !markerPattern.test(segment))
    .join(", ");
}

export function formatBizMailMarkerInsight(
  insight: BizMailMarkerInsight,
  language: OutputLanguage,
) {
  const config = markerConfig[insight.marker];

  if (language === "en") {
    return `${config.enPrefix}: ${insight.value}`;
  }

  return `${insight.value} ${config.koSuffix}`;
}

export function normalizeBizMailMarkerSyntax(
  value = "",
  language: OutputLanguage = "ko",
) {
  let normalized = value.replace(bracketedMarkerPattern, (_, phrase: string) => {
    const insight = markerFromPhrase(phrase);
    return insight ? formatBizMailMarkerInsight(insight, language) : phrase;
  });

  for (const marker of Object.keys(markerConfig) as Array<
    BizMailMarkerInsight["marker"]
  >) {
    const suffixPattern = new RegExp(
      `([^\\n,，;；/()\\[\\]{}（）【】]+?)\\s*${marker}`,
      "g",
    );
    const prefixPattern = new RegExp(
      `${marker}\\s*([^\\n,，;；/()\\[\\]{}（）【】]+)`,
      "g",
    );

    normalized = normalized
      .replace(suffixPattern, (_, phrase: string) => {
        const value = cleanMarkerValue(`${phrase} ${marker}`);
        return value
          ? formatBizMailMarkerInsight(
              { marker, kind: markerConfig[marker].kind, value },
              language,
            )
          : phrase;
      })
      .replace(prefixPattern, (_, phrase: string) => {
        const value = cleanMarkerValue(`${marker} ${phrase}`);
        return value
          ? formatBizMailMarkerInsight(
              { marker, kind: markerConfig[marker].kind, value },
              language,
            )
          : phrase;
      });
  }

  return normalizeWhitespace(normalized);
}
