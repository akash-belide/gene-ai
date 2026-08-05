import type { Metadata } from "next";

import { GeneHome } from "@/components/gene/GeneHome";

export const metadata: Metadata = {
  title: "Gene AI",
  description:
    "Ask questions about Akash's experience, projects, skills, education, and academic work.",
};

/**
 * Application homepage. Renders the Gene AI interface directly at `/`.
 */
export default function Home() {
  return <GeneHome />;
}
