import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

const verticales = [
  { name: "Restaurant", description: "Restaurants, cafés, brasseries et établissements de restauration." },
  { name: "Immobilier", description: "Agences immobilières, mandataires et professionnels de la transaction." },
  { name: "Avocat", description: "Cabinets d’avocats et professions juridiques." },
  { name: "Comptable", description: "Experts-comptables, cabinets comptables et gestionnaires financiers." },
  { name: "E-commerce", description: "Boutiques en ligne et activités de vente digitale." },
  { name: "Agence marketing", description: "Agences marketing, communication, acquisition et stratégie digitale." },
  { name: "Industrie", description: "Entreprises industrielles, production, fabrication et B2B technique." },
  { name: "Artisan", description: "Artisans, entreprises locales et métiers de proximité." },
  { name: "Formation", description: "Organismes de formation, écoles privées et formateurs." },
  { name: "Coaching", description: "Coachings professionnels, personnels, business et accompagnement." },
];

const weakSignals = [
  {
    code: "WEBSITE_NO_CLEAR_CTA",
    label: "Absence de CTA clair",
    description: "Aucun appel à l’action clair n’a été détecté sur le site.",
    category: "conversion",
    defaultWeight: 7,
  },
  {
    code: "WEBSITE_NO_FORM_DETECTED",
    label: "Aucun formulaire détecté",
    description: "Aucun formulaire de contact ou de capture n’a été détecté.",
    category: "conversion",
    defaultWeight: 5,
  },
  {
    code: "WEBSITE_NO_TRACKING_DETECTED",
    label: "Aucun tracking détecté",
    description: "Aucun outil de tracking évident n’a été détecté.",
    category: "automation",
    defaultWeight: 5,
  },
  {
    code: "WEBSITE_NO_SOCIAL_LINKS",
    label: "Aucun réseau social détecté",
    description: "Aucun lien évident vers des réseaux sociaux n’a été détecté.",
    category: "social",
    defaultWeight: 4,
  },
  {
    code: "WEBSITE_MISSING_OR_WEAK_META_DESCRIPTION",
    label: "Meta description absente ou faible",
    description: "La page ne contient pas de meta description solide.",
    category: "seo",
    defaultWeight: 6,
  },
  {
    code: "SEO_NO_CANONICAL",
    label: "Canonical absente",
    description: "Aucune balise canonical n’a été détectée.",
    category: "seo",
    defaultWeight: 3,
  },
];

async function main() {
  const verticaleByName = new Map<string, { id: string }>();
  const weakSignalByCode = new Map<string, { id: string }>();

  for (const verticale of verticales) {
    const savedVerticale = await prisma.verticale.upsert({
      where: {
        name: verticale.name,
      },
      update: {
        description: verticale.description,
      },
      create: {
        name: verticale.name,
        description: verticale.description,
      },
      select: {
        id: true,
      },
    });

    verticaleByName.set(verticale.name, savedVerticale);
  }

  for (const weakSignal of weakSignals) {
    const savedWeakSignal = await prisma.weakSignal.upsert({
      where: {
        code: weakSignal.code,
      },
      update: {
        label: weakSignal.label,
        description: weakSignal.description,
        category: weakSignal.category,
        defaultWeight: weakSignal.defaultWeight,
      },
      create: {
        code: weakSignal.code,
        label: weakSignal.label,
        description: weakSignal.description,
        category: weakSignal.category,
        defaultWeight: weakSignal.defaultWeight,
      },
      select: {
        id: true,
      },
    });

    weakSignalByCode.set(weakSignal.code, savedWeakSignal);
  }

  const customWeights = [
    {
      verticaleName: "Agence marketing",
      weakSignalCode: "WEBSITE_NO_SOCIAL_LINKS",
      weight: 9,
      notes: "Un manque de présence sociale est très pénalisant pour une agence marketing.",
    },
    {
      verticaleName: "Restaurant",
      weakSignalCode: "WEBSITE_NO_CLEAR_CTA",
      weight: 9,
      notes: "Un restaurant doit faciliter rapidement la réservation ou le contact.",
    },
    {
      verticaleName: "E-commerce",
      weakSignalCode: "WEBSITE_NO_TRACKING_DETECTED",
      weight: 8,
      notes: "Le tracking est critique pour piloter l’acquisition et les conversions e-commerce.",
    },
    {
      verticaleName: "Immobilier",
      weakSignalCode: "WEBSITE_NO_FORM_DETECTED",
      weight: 8,
      notes: "Un formulaire est essentiel pour capter les demandes vendeurs, acheteurs et estimations.",
    },
  ];

  for (const customWeight of customWeights) {
    const verticale = verticaleByName.get(customWeight.verticaleName);
    const weakSignal = weakSignalByCode.get(customWeight.weakSignalCode);

    if (!verticale || !weakSignal) {
      continue;
    }

    await prisma.verticalSignalWeight.upsert({
      where: {
        verticaleId_weakSignalId: {
          verticaleId: verticale.id,
          weakSignalId: weakSignal.id,
        },
      },
      update: {
        weight: customWeight.weight,
        isActive: true,
        notes: customWeight.notes,
      },
      create: {
        verticaleId: verticale.id,
        weakSignalId: weakSignal.id,
        weight: customWeight.weight,
        isActive: true,
        notes: customWeight.notes,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });