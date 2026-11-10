import { createFileRoute } from "@tanstack/react-router";

import { DashboardPage } from "@/features/dashboard/DashboardPage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — StudySync" },
      { name: "description", content: "Your day at a glance: today's study schedule, upcoming deadlines and exams, task progress and weekly study hours." },
      { property: "og:title", content: "Dashboard — StudySync" },
      { property: "og:description", content: "Your day at a glance: today's study schedule, upcoming deadlines and exams, task progress and weekly study hours." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});
