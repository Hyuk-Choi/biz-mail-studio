import { featuredCaseCards } from "@/data/mailOptions";

export default function CaseCards() {
  return (
    <section className="mx-auto max-w-7xl px-5 pb-12 sm:px-6 lg:px-8">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">
            자주 쓰는 메일 케이스
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            다양한 비즈니스 상황에 맞춰 초안을 정리할 수 있습니다.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {featuredCaseCards.map((card) => (
          <article
            key={card.title}
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-soft"
          >
            <h3 className="text-base font-semibold text-slate-950">
              {card.title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {card.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
