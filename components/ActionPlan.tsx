import type { PriorityAction, PriorityLevel } from "@/types/analysis";

interface ActionPlanProps {
  actions: PriorityAction[];
}

const priorityClasses: Record<PriorityLevel, string> = {
  높음: "bg-blue-700 text-white",
  중간: "bg-sky-100 text-sky-800",
  낮음: "bg-slate-100 text-slate-700",
};

export default function ActionPlan({ actions }: ActionPlanProps) {
  if (!actions.length) {
    return null;
  }

  return (
    <section>
      <h4 className="text-sm font-semibold text-slate-800">우선 액션 플랜</h4>
      <ol className="mt-3 grid gap-2">
        {actions.map((action, index) => (
          <li
            key={`${action.action}-${index}`}
            className="rounded-md border border-slate-200 bg-white px-3 py-3"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-bold ${priorityClasses[action.priority]}`}
              >
                {action.priority}
              </span>
              <p className="text-sm font-semibold text-slate-950">
                {index + 1}. {action.action}
              </p>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">{action.reason}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
