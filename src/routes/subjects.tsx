import { createFileRoute } from "@tanstack/react-router";

import { SubjectsPage } from "@/features/subjects/SubjectsPage";

export const Route = createFileRoute("/subjects")({
  head: () => ({
    meta: [
      { title: "Subjects — StudySync" },
      { name: "description", content: "Track study hours for each subject against your targets with progress bars and charts." },
      { property: "og:title", content: "Subjects — StudySync" },
      { property: "og:description", content: "Track study hours for each subject against your targets with progress bars and charts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SubjectsPage,
});
