import Link from "next/link";

export function Sidebar() {
  return (
    <aside className="hidden min-h-screen w-72 border-r border-slate-800 bg-slate-950 px-5 py-6 text-slate-100 lg:block">
      <div className="mb-10">
        <p className="text-xs uppercase tracking-[0.35em] text-slate-500">LeadPilot</p>
        <h1 className="mt-2 text-xl font-semibold">Cockpit</h1>
      </div>

      <nav className="space-y-2">
        <Link
          href="/leads"
          className="block rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white"
        >
          Leads
        </Link>
      </nav>
    </aside>
  );
}