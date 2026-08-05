/**
 * Development seed script for the `knowledge_chunks` table.
 *
 * This is only a small retrieval smoke test. It is not the final résumé and
 * portfolio ingestion pipeline.
 *
 * It generates OpenAI embeddings and inserts three verified knowledge chunks.
 * Existing chunks are matched by source title, source type, and section.
 *
 * Run only after reviewing the content and configuring environment variables:
 *
 *   npm run db:seed
 *
 * Requires:
 *   OPENAI_API_KEY
 *   OPENAI_EMBEDDING_MODEL
 *   DATABASE_URL
 */

import "dotenv/config";

import { Prisma } from "@/app/generated/prisma/client";
import { generateEmbedding } from "@/lib/openai";
import { createKnowledgeChunk } from "@/lib/knowledge";
import { prisma } from "@/lib/prisma";

type SeedChunk = {
  sourceTitle: string;
  sourceType: string;
  section: string | null;
  content: string;
  metadata: Prisma.InputJsonValue | null;
};

const SEED_CHUNKS: SeedChunk[] = [
  {
    sourceTitle: "Akash Belide",
    sourceType: "profile",
    section: "Professional Summary",
    content:
      "Akash Belide is a software engineer with experience building backend, full-stack, cloud, and data-oriented applications. " +
      "He has worked with Java, Python, JavaScript, TypeScript, REST APIs, relational and NoSQL databases, cloud infrastructure, " +
      "automated testing, and CI/CD systems. He completed a Master of Science in Information Systems at New York University and " +
      "is seeking early-career and full-time software engineering opportunities where he can contribute to production systems, " +
      "take ownership, and continue growing as an engineer.",
    metadata: {
      tags: ["software-engineering", "backend", "full-stack", "cloud"],
      visibility: "public",
      sourceOrigin: "resume-and-linkedin",
      seed: true,
    },
  },

  {
    sourceTitle: "New York University",
    sourceType: "education",
    section: "Master of Science in Information Systems",
    content:
      "Akash completed a Master of Science in Information Systems at New York University, with coursework through NYU Courant " +
      "and NYU Stern. His program ran from January 2024 through January 2026, and his resume reports a GPA of 3.7 out of 4. " +
      "The program supported his development in software engineering, databases, information systems, cloud technologies, " +
      "DevOps, and business-oriented technology applications.",
    metadata: {
      institution: "New York University",
      degree: "Master of Science in Information Systems",
      startDate: "2024-01",
      endDate: "2026-01",
      gpa: "3.7/4",
      location: "New York, USA",
      tags: ["information-systems", "software-engineering", "databases"],
      visibility: "public",
      sourceOrigin: "resume",
      seed: true,
    },
  },

  {
    sourceTitle: "Mahatma Gandhi Institute of Technology",
    sourceType: "education",
    section: "Bachelor of Technology in Computer Science and Engineering",
    content:
      "Akash earned a Bachelor of Technology in Computer Science and Engineering from Mahatma Gandhi Institute of Technology " +
      "in Hyderabad, India. He attended from July 2019 through July 2023. His undergraduate education established his foundation " +
      "in programming, algorithms, software development, databases, computer systems, and engineering problem solving.",
    metadata: {
      institution: "Mahatma Gandhi Institute of Technology",
      degree: "Bachelor of Technology in Computer Science and Engineering",
      startDate: "2019-07",
      endDate: "2023-07",
      location: "Hyderabad, India",
      tags: ["computer-science", "software-engineering"],
      visibility: "public",
      sourceOrigin: "resume",
      seed: true,
    },
  },

  {
    sourceTitle: "Technical Skills",
    sourceType: "skills",
    section: "Engineering Technologies",
    content:
      "Akash's programming languages include Java, Python, JavaScript, TypeScript, SQL, C, and C++. His frontend experience " +
      "includes React, Next.js, Angular, HTML, CSS, and jQuery. His backend experience includes Spring Boot, FastAPI, Flask, " +
      "Node.js, Hibernate, REST APIs, GraphQL, JSP, and Servlets. He has worked with AWS services including Lambda, ECS, EC2, " +
      "S3, and SQS, as well as GCP, OpenShift, Docker, Kubernetes, and Linux. His database and messaging experience includes " +
      "PostgreSQL, MySQL, MongoDB, Oracle, Redis, DynamoDB, RDS, and Apache Kafka. His AI experience includes OpenAI APIs, " +
      "LangChain, large language models, retrieval-augmented generation, embeddings, vector search, prompt engineering, and caching.",
    metadata: {
      languages: [
        "Java",
        "Python",
        "JavaScript",
        "TypeScript",
        "SQL",
        "C",
        "C++",
      ],
      frontend: ["React", "Next.js", "Angular", "HTML", "CSS", "jQuery"],
      backend: [
        "Spring Boot",
        "FastAPI",
        "Flask",
        "Node.js",
        "Hibernate",
        "REST APIs",
        "GraphQL",
      ],
      cloud: [
        "AWS Lambda",
        "AWS ECS",
        "AWS EC2",
        "AWS S3",
        "AWS SQS",
        "GCP",
        "OpenShift",
      ],
      infrastructure: ["Docker", "Kubernetes", "Linux"],
      databases: [
        "PostgreSQL",
        "MySQL",
        "MongoDB",
        "Oracle",
        "Redis",
        "DynamoDB",
        "RDS",
      ],
      ai: [
        "OpenAI API",
        "LangChain",
        "LLMs",
        "RAG",
        "Embeddings",
        "Vector Search",
        "Prompt Engineering",
      ],
      visibility: "public",
      sourceOrigin: "resume",
      seed: true,
    },
  },

  {
    sourceTitle: "Translation Commons",
    sourceType: "experience",
    section: "Language Navigator Engineering",
    content:
      "Akash joined Translation Commons as a Software Engineer in June 2026. He contributes to Language Navigator, an open-source " +
      "React and TypeScript platform that supports exploration of more than 30,000 languages across multiple interactive data views. " +
      "He implemented persistent pinned map cards across more than six modules using URL-synchronized state, pinned-first behavior, " +
      "and filter-bypass logic. This work improved language discovery, filtering, navigation, and comparison across multiple cards.",
    metadata: {
      company: "Translation Commons",
      role: "Software Engineer",
      startDate: "2026-06",
      technologies: ["React", "TypeScript", "URL state management"],
      tags: ["open-source", "frontend", "language-data"],
      visibility: "public",
      sourceOrigin: "resume",
      seed: true,
    },
  },

  {
    sourceTitle: "Vervon Technologies",
    sourceType: "experience",
    section: "Software Engineer",
    content:
      "Akash worked as a Software Engineer at Vervon Technologies from August 2023 through December 2023. He designed backend " +
      "microservices for a business-to-business CRM platform using Java, Spring Boot, AWS ECS, and DynamoDB, contributing to a " +
      "25 percent improvement in workflow efficiency. He also developed a financial customer onboarding service using Spring Boot, " +
      "AWS Lambda, and Amazon S3 to automate KYC workflows and reduce manual intake effort by 30 percent. He implemented CI/CD " +
      "pipelines using GitHub Actions, Docker, and Jenkins, reducing deployment time by 40 percent. He collaborated with UI/UX, " +
      "DevOps, product, and engineering stakeholders through Agile sprints, code reviews, and release activities.",
    metadata: {
      company: "Vervon Technologies",
      role: "Software Engineer",
      startDate: "2023-08",
      endDate: "2023-12",
      technologies: [
        "Java",
        "Spring Boot",
        "AWS ECS",
        "DynamoDB",
        "AWS Lambda",
        "Amazon S3",
        "GitHub Actions",
        "Docker",
        "Jenkins",
      ],
      tags: ["backend", "microservices", "aws", "ci-cd"],
      visibility: "public",
      sourceOrigin: "resume",
      seed: true,
    },
  },

  {
    sourceTitle: "Vervon Technologies",
    sourceType: "experience",
    section: "Software Engineer Intern",
    content:
      "Akash worked as a Software Engineer Intern at Vervon Technologies from January 2023 through July 2023. He contributed to " +
      "full-stack client dashboard features using React for the frontend and Spring Boot for backend services, improving user task " +
      "completion by 18 percent. He wrote unit and integration tests using JUnit and Mockito, containerized services using Docker, " +
      "and supported AWS deployments. His testing and deployment work contributed to a 30 percent reduction in post-release defects.",
    metadata: {
      company: "Vervon Technologies",
      role: "Software Engineer Intern",
      startDate: "2023-01",
      endDate: "2023-07",
      technologies: [
        "React",
        "Spring Boot",
        "JUnit",
        "Mockito",
        "Docker",
        "AWS",
      ],
      tags: ["full-stack", "testing", "cloud-deployment"],
      visibility: "public",
      sourceOrigin: "resume",
      seed: true,
    },
  },

  {
    sourceTitle: "NYU Courant Institute of Mathematical Sciences",
    sourceType: "academic-experience",
    section: "Agile Software Development and Computer Programming",
    content:
      "From September 2025 through January 2026, Akash served as a Course Assistant at NYU Courant. He supported Agile Software " +
      "Development and DevOps coursework involving Agile practices, DevOps workflows, and full-stack JavaScript development using " +
      "the MERN stack. He also supported an introductory Computer Programming course focused on Python fundamentals. His work " +
      "included grading, assignment support, in-class workshops, technical guidance, and student mentorship.",
    metadata: {
      institution: "NYU Courant Institute of Mathematical Sciences",
      role: "Course Assistant",
      startDate: "2025-09",
      endDate: "2026-01",
      subjects: [
        "Agile Software Development",
        "DevOps",
        "MERN",
        "Python",
      ],
      visibility: "public",
      sourceOrigin: "linkedin-profile",
      seed: true,
    },
  },

  {
    sourceTitle: "NYU Courant Institute of Mathematical Sciences",
    sourceType: "academic-experience",
    section: "Database Systems Course Assistant",
    content:
      "From May 2025 through August 2025, Akash served as a Course Assistant for the graduate Database Systems course at NYU Courant. " +
      "The course covered relational databases, SQL, data modeling, normalization, transactions, query optimization, concurrency, " +
      "recovery, data warehousing, NoSQL, NewSQL, and cloud data management. Akash supported coursework, practical exercises, " +
      "projects, grading, database design, query formulation, and modern data-management best practices.",
    metadata: {
      institution: "NYU Courant Institute of Mathematical Sciences",
      role: "Course Assistant",
      course: "Database Systems",
      startDate: "2025-05",
      endDate: "2025-08",
      topics: [
        "SQL",
        "Data Modeling",
        "Normalization",
        "Transactions",
        "Query Optimization",
        "NoSQL",
        "Cloud Data Management",
      ],
      visibility: "public",
      sourceOrigin: "linkedin-profile",
      seed: true,
    },
  },

  {
    sourceTitle: "NYU Stern School of Business",
    sourceType: "academic-experience",
    section: "Teaching Fellow for Firms and Markets",
    content:
      "From June 2025 through August 2025, Akash served as a Teaching Fellow for Firms and Markets, a core MBA economics course at " +
      "NYU Stern taught by Professor Joseph Foudy. He supported instruction involving supply and demand, elasticity, cost analysis, " +
      "industry dynamics, game theory, market power, pricing strategies, externalities, and information economics. His responsibilities " +
      "included grading, exam review, student engagement, and instructional support.",
    metadata: {
      institution: "NYU Stern School of Business",
      role: "Teaching Fellow",
      course: "Firms and Markets",
      startDate: "2025-06",
      endDate: "2025-08",
      visibility: "public",
      sourceOrigin: "linkedin-profile",
      seed: true,
    },
  },

  {
    sourceTitle: "Design for America at NYU",
    sourceType: "leadership",
    section: "Vice President",
    content:
      "Akash served as Vice President of Design for America at NYU from September 2025 through January 2026. This role is part of " +
      "his university leadership experience and complements his software engineering, teaching, collaboration, and student-support work.",
    metadata: {
      organization: "Design for America at NYU",
      role: "Vice President",
      startDate: "2025-09",
      endDate: "2026-01",
      tags: ["leadership", "student-organization"],
      visibility: "public",
      sourceOrigin: "linkedin-profile",
      seed: true,
    },
  },

  {
    sourceTitle: "Distributed Chat Application",
    sourceType: "project",
    section: "Architecture and Scalability",
    content:
      "Akash built a horizontally scalable real-time chat application using JavaScript, Node.js, Socket.io, Redis, MongoDB, HAProxy, " +
      "and Docker. The system supports unicast, multicast, and broadcast communication. Redis pub/sub coordinates messaging across " +
      "application instances, MongoDB provides persistence, HAProxy distributes traffic, and Docker Compose supports repeatable " +
      "deployment. The architecture was designed for low-latency communication and support for more than 10,000 concurrent users.",
    metadata: {
      technologies: [
        "JavaScript",
        "Node.js",
        "Socket.io",
        "Redis",
        "MongoDB",
        "HAProxy",
        "Docker",
      ],
      tags: ["distributed-systems", "real-time", "scalability"],
      visibility: "public",
      sourceOrigin: "resume",
      seed: true,
    },
  },

  {
    sourceTitle: "Cloud-Native Inventory Service",
    sourceType: "project",
    section: "Implementation and DevOps",
    content:
      "Akash built a cloud-native inventory service using Python, Flask, PostgreSQL, Docker, Kubernetes, Tekton, GitHub Actions, " +
      "and PyTest. The service provides CRUD REST APIs for managing inventory records and includes Swagger and OpenAPI documentation. " +
      "Automated unit and integration testing achieved more than 95 percent code coverage. The project includes continuous integration " +
      "and deployment workflows using GitHub Actions and Tekton, with deployments targeting K3s and OpenShift environments.",
    metadata: {
      technologies: [
        "Python",
        "Flask",
        "PostgreSQL",
        "Docker",
        "Kubernetes",
        "Tekton",
        "GitHub Actions",
        "PyTest",
        "OpenAPI",
      ],
      testCoverage: "95%+",
      tags: ["microservices", "devops", "testing", "kubernetes"],
      visibility: "public",
      sourceOrigin: "resume",
      seed: true,
    },
  },

  {
    sourceTitle: "AI Knowledge Assistant",
    sourceType: "project",
    section: "Retrieval-Augmented Generation",
    content:
      "Akash developed an AI knowledge assistant using Python, FastAPI, LangChain, the OpenAI API, vector search, embeddings, Docker, " +
      "and AWS. The application ingests documents, divides them into searchable chunks, generates embeddings, retrieves context relevant " +
      "to a user's question, and provides that context to a language model to generate grounded answers. Akash worked on ingestion, " +
      "retrieval, prompt orchestration, API design, caching, evaluation, and containerized deployment.",
    metadata: {
      technologies: [
        "Python",
        "FastAPI",
        "LangChain",
        "OpenAI API",
        "Vector Search",
        "Embeddings",
        "Docker",
        "AWS",
      ],
      tags: ["generative-ai", "rag", "backend", "llm"],
      visibility: "public",
      sourceOrigin: "prior-project-notes",
      reviewBeforeProduction: true,
      seed: true,
    },
  },

  {
    sourceTitle: "Gene AI",
    sourceType: "project",
    section: "Current Architecture",
    content:
      "Gene AI is a portfolio-focused retrieval-augmented generation application being built by Akash. It uses Next.js and TypeScript " +
      "for the application, Prisma for database access, Supabase PostgreSQL with pgvector for storing and searching embeddings, and " +
      "the OpenAI API for embedding and response generation. The retrieval layer stores 1536-dimensional embeddings and uses cosine " +
      "distance to retrieve professional information from Akash's resume, portfolio, experience, education, and project records. " +
      "Gene is intended to answer recruiter and visitor questions using verified context and visible sources instead of unsupported model memory.",
    metadata: {
      technologies: [
        "Next.js",
        "TypeScript",
        "Prisma",
        "Supabase",
        "PostgreSQL",
        "pgvector",
        "OpenAI API",
      ],
      tags: ["rag", "portfolio", "semantic-search", "generative-ai"],
      status: "in-development",
      visibility: "public",
      sourceOrigin: "current-project",
      seed: true,
    },
  },

  {
    sourceTitle: "Joan Jonas Knowledge Base Static Migration",
    sourceType: "freelance-project",
    section: "UCLA Artist Archives Initiative",
    content:
      "Akash completed a contracted website-migration project associated with the UCLA Artist Archives Initiative. The work involved " +
      "converting the Joan Jonas Knowledge Base from a WordPress-driven website into a static HTML, CSS, and JavaScript site. He crawled " +
      "and exported the existing pages and assets, preserved relative and absolute media paths where required, tested the static copy " +
      "locally, and prepared it to be hosted under the existing UCLA site path. The goal was to preserve the archive's public content " +
      "while reducing its dependence on the original WordPress runtime.",
    metadata: {
      clientContext: "UCLA Artist Archives Initiative",
      technologies: ["HTML", "CSS", "JavaScript", "WordPress", "wget"],
      tags: ["freelance", "static-site", "website-migration", "digital-archive"],
      visibility: "public",
      sourceOrigin: "prior-conversation",
      reviewBeforeProduction: true,
      seed: true,
    },
  },

  {
    sourceTitle: "4_wheelsdrive",
    sourceType: "independent-experience",
    section: "Creative Lead for Digital Design and Branding",
    content:
      "Akash worked as Creative Lead for Digital Design and Branding at 4_wheelsdrive from August 2020 through August 2021 in Hyderabad. " +
      "This experience reflects his earlier work with digital media, visual communication, branding, and automotive-oriented content.",
    metadata: {
      organization: "4_wheelsdrive",
      role: "Creative Lead – Digital Design and Branding",
      startDate: "2020-08",
      endDate: "2021-08",
      tags: ["branding", "digital-design", "automotive"],
      visibility: "public",
      sourceOrigin: "linkedin-profile",
      seed: true,
    },
  },
];

async function main(): Promise<void> {
  let inserted = 0;
  let skipped = 0;
  let failed = 0;

  console.log(`Seeding ${SEED_CHUNKS.length} knowledge chunks...\n`);

  for (const chunk of SEED_CHUNKS) {
    try {
      /*
       * Do not deduplicate by sourceTitle alone.
       *
       * A project or employer will eventually have multiple sections, such as:
       * Overview, Implementation, Challenges, Results, and Technologies.
       */
      const existing = await prisma.knowledgeChunk.findFirst({
        where: {
          sourceTitle: chunk.sourceTitle,
          sourceType: chunk.sourceType,
          section: chunk.section,
        },
        select: {
          id: true,
          content: true,
        },
      });

      if (existing) {
        skipped += 1;

        if (existing.content !== chunk.content) {
          console.warn(
            `- Skipped "${chunk.sourceTitle}" / "${chunk.section}" because a record already exists, but its content differs.`,
          );
          console.warn(
            "  Delete or update the existing development seed before reseeding.",
          );
        } else {
          console.log(
            `- Skipped "${chunk.sourceTitle}" / "${chunk.section}" ` +
              `(already exists: ${existing.id})`,
          );
        }

        continue;
      }

      console.log(
        `- Generating embedding for "${chunk.sourceTitle}" / "${chunk.section}"...`,
      );

      const embedding = await generateEmbedding(chunk.content);

      const record = await createKnowledgeChunk({
        sourceTitle: chunk.sourceTitle,
        sourceType: chunk.sourceType,
        section: chunk.section,
        content: chunk.content,
        metadata: chunk.metadata,
        embedding,
      });

      inserted += 1;
      console.log(`  Inserted ${record.id}`);
    } catch (error) {
      failed += 1;

      const message = error instanceof Error ? error.message : String(error);

      console.error(
        `- Failed "${chunk.sourceTitle}" / "${chunk.section}": ${message}`,
      );
    }
  }

  console.log("\nSeed summary");
  console.log(`Inserted: ${inserted}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Failed: ${failed}`);

  if (failed > 0) {
    process.exitCode = 1;
  }
}

main()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Seed script crashed: ${message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });