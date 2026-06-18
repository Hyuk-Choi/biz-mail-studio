export default function Header() {
  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-700 text-sm font-bold text-white shadow-sm">
            B
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-normal text-slate-950">
              BizMail Studio
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              초안을 전문적인 비즈니스 메일로 바꿔보세요.
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
