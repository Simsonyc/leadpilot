export function Topbar() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-800 bg-slate-950/80 px-6 text-slate-100">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
          Prospection intelligente
        </p>
      </div>

      <div className="rounded-full border border-slate-700 px-4 py-2 text-xs text-slate-300">
        Cockpit privé
      </div>
    </header>
  );
}