import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

const verticales = [
  { name: "Restaurant", description: "Restaurants, cafés, brasseries et établissements de restauration." },
  { name: "Immobilier", description: "Agences immobilières, mandataires et professionnels de la transaction." },
  { name: "Avocat", description: "Cabinets d'avocats et professions juridiques." },
  { name: "Comptable", description: "Experts-comptables, cabinets comptables et gestionnaires financiers." },
  { name: "E-commerce", description: "Boutiques en ligne et activités de vente digitale." },
  { name: "Agence marketing", description: "Agences marketing, communication, acquisition et stratégie digitale." },
  { name: "Industrie", description: "Entreprises industrielles, production, fabrication et B2B technique." },
  { name: "Artisan", description: "Artisans, entreprises locales et métiers de proximité." },
  { name: "Formation", description: "Organismes de formation, écoles privées et formateurs." },
  { name: "Coaching", description: "Coachings professionnels, personnels, business et accompagnement." },
];

const weakSignals = [
  // ── Conversion ───────────────────────────────────────────────
  {
    code: "WEBSITE_NO_CLEAR_CTA",
    label: "Absence de CTA clair",
    description: "Aucun appel à l'action clair n'a été détecté sur le site.",
    category: "conversion",
    defaultWeight: 7,
  },
  {
    code: "WEBSITE_NO_FORM_DETECTED",
    label: "Aucun formulaire détecté",
    description: "Aucun formulaire de contact ou de capture n'a été détecté.",
    category: "conversion",
    defaultWeight: 5,
  },
  {
    code: "WEBSITE_NO_BOOKING_SYSTEM",
    label: "Aucun système de réservation",
    description: "Aucun outil de réservation en ligne détecté (Calendly, Planity, Doctolib, etc.).",
    category: "conversion",
    defaultWeight: 5,
  },
  // ── Automation ───────────────────────────────────────────────
  {
    code: "WEBSITE_NO_TRACKING_DETECTED",
    label: "Aucun tracking détecté",
    description: "Aucun outil de tracking évident n'a été détecté (GA4, GTM, Meta Pixel, etc.).",
    category: "automation",
    defaultWeight: 5,
  },
  {
    code: "WEBSITE_NO_CHATBOT",
    label: "Aucun chatbot ou chat en direct",
    description: "Aucun système de chat en direct détecté (Intercom, Drift, Crisp, Tawk, etc.).",
    category: "automation",
    defaultWeight: 4,
  },
  // ── Social ───────────────────────────────────────────────────
  {
    code: "WEBSITE_NO_SOCIAL_LINKS",
    label: "Aucun réseau social détecté",
    description: "Aucun lien vers des réseaux sociaux n'a été détecté.",
    category: "social",
    defaultWeight: 4,
  },
  // ── SEO ──────────────────────────────────────────────────────
  {
    code: "WEBSITE_MISSING_OR_WEAK_META_DESCRIPTION",
    label: "Meta description absente ou faible",
    description: "La page ne contient pas de meta description solide.",
    category: "seo",
    defaultWeight: 6,
  },
  {
    code: "WEBSITE_MISSING_OR_WEAK_TITLE",
    label: "Title absent ou trop court",
    description: "La balise title est absente ou insuffisamment descriptive.",
    category: "seo",
    defaultWeight: 6,
  },
  {
    code: "SEO_NO_H1",
    label: "Balise H1 absente",
    description: "Aucune balise H1 détectée sur la page.",
    category: "seo",
    defaultWeight: 5,
  },
  {
    code: "SEO_MULTIPLE_H1",
    label: "Plusieurs balises H1",
    description: "Plusieurs balises H1 détectées — mauvaise pratique SEO.",
    category: "seo",
    defaultWeight: 3,
  },
  {
    code: "SEO_NO_CANONICAL",
    label: "Canonical absente",
    description: "Aucune balise canonical n'a été détectée.",
    category: "seo",
    defaultWeight: 3,
  },
  {
    code: "SEO_NOINDEX_DETECTED",
    label: "Noindex détecté",
    description: "La page est explicitement exclue de l'indexation Google.",
    category: "seo",
    defaultWeight: 9,
  },
  {
    code: "SEO_NO_OPENGRAPH",
    label: "Open Graph absent",
    description: "Aucune balise Open Graph détectée (og:title, og:image).",
    category: "seo",
    defaultWeight: 4,
  },
  // ── Website ──────────────────────────────────────────────────
  {
    code: "WEBSITE_NO_HTTPS",
    label: "Site sans HTTPS",
    description: "Le site n'utilise pas HTTPS — problème de sécurité et de référencement.",
    category: "website",
    defaultWeight: 8,
  },
];

const customWeights = [
  {
    verticaleName: "Agence marketing",
    weakSignalCode: "WEBSITE_NO_SOCIAL_LINKS",
    weight: 9,
    notes: "Un manque de présence sociale est très pénalisant pour une agence marketing.",
  },
  {
    verticaleName: "Agence marketing",
    weakSignalCode: "WEBSITE_NO_TRACKING_DETECTED",
    weight: 9,
    notes: "Une agence sans tracking est incohérente avec son offre.",
  },
  {
    verticaleName: "Restaurant",
    weakSignalCode: "WEBSITE_NO_CLEAR_CTA",
    weight: 9,
    notes: "Un restaurant doit faciliter rapidement la réservation ou le contact.",
  },
  {
    verticaleName: "Restaurant",
    weakSignalCode: "WEBSITE_NO_BOOKING_SYSTEM",
    weight: 8,
    notes: "La réservation en ligne est critique pour un restaurant.",
  },
  {
    verticaleName: "E-commerce",
    weakSignalCode: "WEBSITE_NO_TRACKING_DETECTED",
    weight: 8,
    notes: "Le tracking est critique pour piloter l'acquisition et les conversions e-commerce.",
  },
  {
    verticaleName: "Immobilier",
    weakSignalCode: "WEBSITE_NO_FORM_DETECTED",
    weight: 8,
    notes: "Un formulaire est essentiel pour capter les demandes vendeurs, acheteurs et estimations.",
  },
  {
    verticaleName: "Coaching",
    weakSignalCode: "WEBSITE_NO_BOOKING_SYSTEM",
    weight: 8,
    notes: "La prise de RDV en ligne est indispensable pour un coach.",
  },
  {
    verticaleName: "Avocat",
    weakSignalCode: "SEO_NOINDEX_DETECTED",
    weight: 10,
    notes: "Un site d'avocat invisible sur Google est une catastrophe commerciale.",
  },
  {
    verticaleName: "Formation",
    weakSignalCode: "WEBSITE_NO_CHATBOT",
    weight: 7,
    notes: "Un chat en direct améliore fortement la conversion sur un site de formation.",
  },
];

async function main() {
  console.log("🌱 Seed démarré...");

  const verticaleByName = new Map<string, { id: string }>();
  const weakSignalByCode = new Map<string, { id: string }>();

  // Verticales
  for (const verticale of verticales) {
    const saved = await prisma.verticale.upsert({
      where: { name: verticale.name },
      update: { description: verticale.description },
      create: verticale,
      select: { id: true },
    });
    verticaleByName.set(verticale.name, saved);
    console.log(`  ✓ Verticale : ${verticale.name}`);
  }

  // Weak signals
  for (const signal of weakSignals) {
    const saved = await prisma.weakSignal.upsert({
      where: { code: signal.code },
      update: {
        label: signal.label,
        description: signal.description,
        category: signal.category,
        defaultWeight: signal.defaultWeight,
      },
      create: signal,
      select: { id: true },
    });
    weakSignalByCode.set(signal.code, saved);
    console.log(`  ✓ Signal : ${signal.code}`);
  }

  // Poids personnalisés par verticale
  for (const cw of customWeights) {
    const verticale = verticaleByName.get(cw.verticaleName);
    const weakSignal = weakSignalByCode.get(cw.weakSignalCode);

    if (!verticale || !weakSignal) {
      console.warn(`  ⚠ Ignoré : ${cw.verticaleName} / ${cw.weakSignalCode}`);
      continue;
    }

    await prisma.verticalSignalWeight.upsert({
      where: {
        verticaleId_weakSignalId: {
          verticaleId: verticale.id,
          weakSignalId: weakSignal.id,
        },
      },
      update: { weight: cw.weight, isActive: true, notes: cw.notes },
      create: {
        verticaleId: verticale.id,
        weakSignalId: weakSignal.id,
        weight: cw.weight,
        isActive: true,
        notes: cw.notes,
      },
    });
    console.log(`  ✓ Poids : ${cw.verticaleName} / ${cw.weakSignalCode} = ${cw.weight}`);
  }

  console.log("✅ Seed terminé.");
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
