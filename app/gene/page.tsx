import type { Metadata } from "next";

import { GeneHome } from "@/components/gene/GeneHome";

export const metadata: Metadata = {
  title: "Gene AI",
  description:
    "Ask questions about Akash's experience, projects, skills, education, and academic work.",
};

/**
 * Gene AI at `/gene`. Renders the same interface as the homepage so existing
 * links (portfolio button, deployment docs) keep working.
 */
export default function GenePage() {
  return <GeneHome />;
}
