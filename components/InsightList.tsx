type InsightTone = "blue" | "green" | "amber" | "red" | "slate";

interface InsightListProps {
  title: string;
  items: string[];
  tone?: InsightTone;
}

const toneClasses: Record<InsightTone, string> = {
  blue: "border-blue-100 bg-blue-50 text-blue-950",
  green: "border-emerald-100 bg-emerald-50 text-emerald-950",
  amber: "border-amber-100 bg-amber-50 text-amber-950",
  red: "border-red-100 bg-red-50 text-red-950",
  slate: "border-slate-200 bg-slate-50 text-slate-800",
};

export default function InsightList({
  title,
  items,
  tone = "slate",
}: InsightListProps) {
  if (!items.length) {
    return null;
  }

  return (
    <section>
      <h4 className="text-sm font-semibold text-slate-800">{title}</h4>
      <ul className="mt-3 grid gap-2">
        {items.map((item) => (
          <li
            key={item}
            className={`rounded-md border px-3 py-2 text-sm leading-6 ${toneClasses[tone]}`}
          >
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
