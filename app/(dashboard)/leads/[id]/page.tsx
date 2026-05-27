type LeadDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function LeadDetailPage({ params }: LeadDetailPageProps) {
  const { id } = await params;

  return (
    <main className="min-h-screen bg-[#F8F6F1] px-6 py-10 text-[#141210]">
      <section className="mx-auto max-w-5xl">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#E63E1C]">
          LeadPilot
        </p>

        <h1 className="mt-4 text-4xl font-bold tracking-tight">
          Fiche lead
        </h1>

        <p className="mt-4 text-neutral-700">
          Identifiant du lead : <span className="font-mono">{id}</span>
        </p>
      </section>
    </main>
  );
}