export default function Home() {
  return (
    <main className="min-h-screen bg-[#F8F6F1] px-6 py-10 text-[#141210]">
      <section className="mx-auto flex min-h-[80vh] max-w-5xl flex-col justify-center">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-[#E63E1C]">
          LeadPilot
        </p>

        <h1 className="max-w-3xl text-5xl font-bold tracking-tight md:text-7xl">
          Cockpit de prospection intelligente
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-700">
          Un outil privé pour détecter, scorer, prioriser et activer les
          meilleures opportunités commerciales à partir de signaux faibles.
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <div className="border border-neutral-300 bg-white p-6">
            <h2 className="font-semibold">Signaux faibles</h2>
            <p className="mt-2 text-sm text-neutral-600">
              Website, Google Maps, Pages Jaunes, réseaux sociaux et données terrain.
            </p>
          </div>

          <div className="border border-neutral-300 bg-white p-6">
            <h2 className="font-semibold">Scoring explicable</h2>
            <p className="mt-2 text-sm text-neutral-600">
              Chaque priorité commerciale doit être justifiée par des preuves observables.
            </p>
          </div>

          <div className="border border-neutral-300 bg-white p-6">
            <h2 className="font-semibold">Activation GHL</h2>
            <p className="mt-2 text-sm text-neutral-600">
              Les meilleurs leads sont envoyés vers GoHighLevel avec contexte et accroches IA.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
