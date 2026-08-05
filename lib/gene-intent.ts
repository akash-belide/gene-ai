/**
 * Deterministic query-intent router for Gene.
 *
 * Maps a natural-language question to zero or more likely knowledge source
 * types using keyword rules. This is intentionally rule-based (no extra OpenAI
 * call) so classification is fast, free, and predictable. It is a pure module
 * with no I/O, so it is easily unit tested.
 */

export const SUPPORTED_SOURCE_TYPES = [
  "profile",
  "education",
  "skills",
  "experience",
  "academic-experience",
  "leadership",
  "project",
  "freelance-project",
  "independent-experience",
] as const;

export type SourceType = (typeof SUPPORTED_SOURCE_TYPES)[number];

// Canonical output order so results are deterministic regardless of rule order.
const CANONICAL_ORDER: SourceType[] = [...SUPPORTED_SOURCE_TYPES];

type IntentRule = {
  types: SourceType[];
  keywords: string[];
};

// A specific technology implies it is best answered from where it was applied:
// professional experience, projects, and the skills summary.
const TECH_BUNDLE: SourceType[] = ["experience", "project", "skills"];

const RULES: IntentRule[] = [
  {
    types: ["education"],
    keywords: [
      "degree",
      "degrees",
      "education",
      "educational",
      "university",
      "college",
      "gpa",
      "bachelor",
      "bachelors",
      "master",
      "masters",
      "phd",
      "doctorate",
      "graduate",
      "undergraduate",
      "major",
      "coursework",
      "school",
      "studied",
      "alma mater",
    ],
  },
  {
    types: ["academic-experience"],
    keywords: [
      "teaching",
      "teach",
      "taught",
      "grader",
      "tutor",
      "tutoring",
      "professor",
      "lecturer",
      "course assistant",
      "teaching assistant",
      "teaching fellow",
      "research assistant",
      "academic experience",
    ],
  },
  {
    types: ["experience"],
    keywords: [
      "employer",
      "employers",
      "company",
      "companies",
      "job",
      "jobs",
      "internship",
      "intern",
      "worked at",
      "work experience",
      "professional experience",
      "career",
      "employment",
      "full-time",
      "fulltime",
    ],
  },
  {
    types: ["project"],
    keywords: [
      "project",
      "projects",
      "built",
      "build",
      "building",
      "application",
      "applications",
      "app",
      "system",
      "systems",
      "architecture",
      "developed",
      "designed",
      "implemented",
      "created",
    ],
  },
  {
    types: ["freelance-project"],
    keywords: ["freelance", "contract", "client", "clients", "consulting", "contractor"],
  },
  {
    types: ["independent-experience"],
    keywords: [
      "independent",
      "self-employed",
      "self employed",
      "entrepreneur",
      "personal venture",
    ],
  },
  {
    types: ["leadership"],
    keywords: [
      "leadership",
      "leader",
      "president",
      "vice president",
      "student organization",
      "club",
      "committee",
      "organizer",
      "captain",
      "mentored",
      "led a team",
    ],
  },
  {
    // Generic "skills" wording -> just the skills summary.
    types: ["skills"],
    keywords: ["skill", "skills", "technology", "technologies", "tooling", "tech stack"],
  },
  {
    // Specific technologies -> experience + project + skills.
    types: TECH_BUNDLE,
    keywords: [
      "aws",
      "azure",
      "gcp",
      "cloud",
      "kubernetes",
      "docker",
      "python",
      "java",
      "typescript",
      "javascript",
      "react",
      "node",
      "nodejs",
      "sql",
      "postgres",
      "postgresql",
      "backend",
      "back-end",
      "frontend",
      "front-end",
      "full-stack",
      "fullstack",
      "devops",
      "microservices",
      "api",
      "apis",
      "ml",
      "machine learning",
    ],
  },
  {
    types: ["profile"],
    keywords: [
      "background",
      "overview",
      "about akash",
      "who is akash",
      "tell me about",
      "summary",
      "profile",
      "bio",
    ],
  },
];

/**
 * Analyzes a user question and returns the likely source types, in canonical
 * order and de-duplicated. Returns an empty array when nothing is confidently
 * inferred (callers should then run an unfiltered search).
 */
export function inferSourceTypes(message: string): SourceType[] {
  const normalized = message.toLowerCase();
  const tokens = new Set(
    normalized.split(/[^a-z0-9+#.]+/).filter((token) => token.length > 0),
  );

  const hasKeyword = (keyword: string): boolean =>
    keyword.includes(" ") ? normalized.includes(keyword) : tokens.has(keyword);

  const matched = new Set<SourceType>();

  for (const rule of RULES) {
    if (rule.keywords.some(hasKeyword)) {
      for (const type of rule.types) {
        matched.add(type);
      }
    }
  }

  return CANONICAL_ORDER.filter((type) => matched.has(type));
}
