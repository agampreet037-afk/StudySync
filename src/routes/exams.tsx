import { createFileRoute } from "@tanstack/react-router";

import { ExamsPage } from "@/features/exams/ExamsPage";

export const Route = createFileRoute("/exams")({
  head: () => ({
    meta: [
      { title: "Exams — StudySync" },
      { name: "description", content: "Keep every exam date, time and location in one place with countdowns." },
      { property: "og:title", content: "Exams — StudySync" },
      { property: "og:description", content: "Keep every exam date, time and location in one place with countdowns." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ExamsPage,
});
