import { createFileRoute } from "@tanstack/react-router";

import { AssignmentsPage } from "@/features/assignments/AssignmentsPage";

export const Route = createFileRoute("/assignments")({
  head: () => ({
    meta: [
      { title: "Assignments — StudySync" },
      { name: "description", content: "Track assignment deadlines, priorities and progress with filters, sorting and overdue alerts." },
      { property: "og:title", content: "Assignments — StudySync" },
      { property: "og:description", content: "Track assignment deadlines, priorities and progress with filters, sorting and overdue alerts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AssignmentsPage,
});
