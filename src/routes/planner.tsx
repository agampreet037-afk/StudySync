import { createFileRoute } from "@tanstack/react-router";

import { PlannerPage } from "@/features/planner/PlannerPage";

export const Route = createFileRoute("/planner")({
  head: () => ({
    meta: [
      { title: "Study Planner — StudySync" },
      { name: "description", content: "Plan study sessions by subject in daily and weekly calendar views and tick them off as you go." },
      { property: "og:title", content: "Study Planner — StudySync" },
      { property: "og:description", content: "Plan study sessions by subject in daily and weekly calendar views and tick them off as you go." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PlannerPage,
});
