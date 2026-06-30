import type { ScoreBreakdown as ScoreBreakdownItem } from "@/types/analysis";

interface ScoreBreakdownProps {
  items: ScoreBreakdownItem[];
}

function scoreColor(score: number) {
  if (score >= 82) {
    return "bg-blue-700";
  }

  if (score >= 68) {
    return "bg-sky-500";
  }

  return "bg-amber-500";
}

export default function ScoreBreakdown({ items }: ScoreBreakdownProps) {
  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <div key={item.key} className="rounded-md border border-slate-200 bg-white p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">{item.label}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">{item.reason}</p>
            </div>
            <span className="shrink-0 text-sm font-bold text-slate-950">
              {item.score}
            </span>
          </div>
          <div className="mt-3 h-2 rounded-full bg-slate-100">
            <div
              className={`h-2 rounded-full ${scoreColor(item.score)}`}
              style={{ width: `${item.score}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
