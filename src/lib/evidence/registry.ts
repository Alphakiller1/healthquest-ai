export type EvidenceStatus = "active" | "pending_review";

export type EvidenceSource = {
  id: string;
  organization: string;
  title: string;
  url: string;
  publicationDate: string | null;
  lastReviewedAt: string;
  jurisdiction: "US" | "INT";
  status: EvidenceStatus;
  /** How this URL was checked on 2026-09-24. Bot-blocked pages are not citable yet. */
  verification: "http_200" | "bot_blocked";
};

export const EVIDENCE_SOURCES: readonly EvidenceSource[] = [
  {
    id: "medlineplus-cholesterol",
    organization: "NIH MedlinePlus",
    title: "Cholesterol",
    url: "https://medlineplus.gov/cholesterol.html",
    publicationDate: null,
    lastReviewedAt: "2026-09-24",
    jurisdiction: "US",
    status: "active",
    verification: "http_200",
  },
  {
    id: "nhlbi-blood-cholesterol",
    organization: "NHLBI",
    title: "What Is Blood Cholesterol?",
    url: "https://www.nhlbi.nih.gov/health/blood-cholesterol",
    publicationDate: null,
    lastReviewedAt: "2026-09-24",
    jurisdiction: "US",
    status: "active",
    verification: "http_200",
  },
  {
    id: "nhlbi-sleep",
    organization: "NHLBI",
    title: "Sleep Health",
    url: "https://www.nhlbi.nih.gov/health/sleep",
    publicationDate: null,
    lastReviewedAt: "2026-09-24",
    jurisdiction: "US",
    status: "active",
    verification: "http_200",
  },
  {
    id: "fda-nutrition-facts",
    organization: "FDA",
    title: "How to Understand and Use the Nutrition Facts Label",
    url: "https://www.fda.gov/food/nutrition-facts-label/how-understand-and-use-nutrition-facts-label",
    publicationDate: null,
    lastReviewedAt: "2026-09-24",
    jurisdiction: "US",
    status: "active",
    verification: "http_200",
  },
  {
    id: "odphp-physical-activity",
    organization: "HHS ODPHP",
    title: "Physical Activity Guidelines",
    url: "https://odphp.health.gov/our-work/nutrition-physical-activity/physical-activity-guidelines",
    publicationDate: null,
    lastReviewedAt: "2026-09-24",
    jurisdiction: "US",
    status: "active",
    verification: "http_200",
  },
  {
    id: "myplate",
    organization: "USDA",
    title: "MyPlate",
    url: "https://www.myplate.gov/",
    publicationDate: null,
    lastReviewedAt: "2026-09-24",
    jurisdiction: "US",
    status: "active",
    verification: "http_200",
  },
  {
    id: "samhsa-988",
    organization: "SAMHSA",
    title: "988 Suicide & Crisis Lifeline",
    url: "https://www.samhsa.gov/mental-health/988",
    publicationDate: null,
    lastReviewedAt: "2026-09-24",
    jurisdiction: "US",
    status: "active",
    verification: "http_200",
  },
  {
    id: "988-lifeline",
    organization: "988 Lifeline",
    title: "988 Suicide & Crisis Lifeline",
    url: "https://988lifeline.org/",
    publicationDate: null,
    lastReviewedAt: "2026-09-24",
    jurisdiction: "US",
    status: "active",
    verification: "http_200",
  },
  {
    id: "ada-home",
    organization: "American Diabetes Association",
    title: "American Diabetes Association",
    url: "https://diabetes.org/",
    publicationDate: null,
    lastReviewedAt: "2026-09-24",
    jurisdiction: "US",
    status: "active",
    verification: "http_200",
  },
  {
    id: "medlineplus-family-history",
    organization: "NIH MedlinePlus",
    title: "Family History",
    url: "https://medlineplus.gov/familyhistory.html",
    publicationDate: null,
    lastReviewedAt: "2026-09-24",
    jurisdiction: "US",
    status: "active",
    verification: "http_200",
  },
  {
    id: "nhlbi-high-blood-pressure",
    organization: "NHLBI",
    title: "What Is High Blood Pressure?",
    url: "https://www.nhlbi.nih.gov/health/high-blood-pressure",
    publicationDate: null,
    lastReviewedAt: "2026-09-24",
    jurisdiction: "US",
    status: "active",
    verification: "http_200",
  },
  {
    id: "medlineplus-sodium",
    organization: "NIH MedlinePlus",
    title: "Sodium",
    url: "https://medlineplus.gov/sodium.html",
    publicationDate: null,
    lastReviewedAt: "2026-09-24",
    jurisdiction: "US",
    status: "active",
    verification: "http_200",
  },
  {
    id: "medlineplus-fiber",
    organization: "NIH MedlinePlus",
    title: "Dietary Fiber",
    url: "https://medlineplus.gov/dietaryfiber.html",
    publicationDate: null,
    lastReviewedAt: "2026-09-24",
    jurisdiction: "US",
    status: "active",
    verification: "http_200",
  },
  {
    id: "nimh-stress",
    organization: "NIMH",
    title: "I’m So Stressed Out! Fact Sheet",
    url: "https://www.nimh.nih.gov/health/publications/so-stressed-out-fact-sheet",
    publicationDate: null,
    lastReviewedAt: "2026-09-24",
    jurisdiction: "US",
    status: "active",
    verification: "http_200",
  },
  {
    id: "who-healthy-diet",
    organization: "WHO",
    title: "Healthy diet",
    url: "https://www.who.int/news-room/fact-sheets/detail/healthy-diet",
    publicationDate: null,
    lastReviewedAt: "2026-09-24",
    jurisdiction: "INT",
    status: "active",
    verification: "http_200",
  },
  {
    id: "cdc-heart-attack",
    organization: "CDC",
    title: "About Heart Attack",
    url: "https://www.cdc.gov/heart-disease/about/heart-attack.html",
    publicationDate: null,
    lastReviewedAt: "2026-09-24",
    jurisdiction: "US",
    status: "pending_review",
    verification: "bot_blocked",
  },
  {
    id: "cdc-stroke-signs",
    organization: "CDC",
    title: "Signs and Symptoms of Stroke",
    url: "https://www.cdc.gov/stroke/signs-symptoms/index.html",
    publicationDate: null,
    lastReviewedAt: "2026-09-24",
    jurisdiction: "US",
    status: "pending_review",
    verification: "bot_blocked",
  },
];

export function activeSourceIds(): Set<string> {
  return new Set(
    EVIDENCE_SOURCES.filter((source) => source.status === "active").map(
      (source) => source.id,
    ),
  );
}

export function getActiveSource(id: string): EvidenceSource | undefined {
  return EVIDENCE_SOURCES.find(
    (source) => source.id === id && source.status === "active",
  );
}
