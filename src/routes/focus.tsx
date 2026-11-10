import { createFileRoute } from "@tanstack/react-router";

import { FocusPage } from "@/features/focus/FocusPage";

export const Route = createFileRoute("/focus")({
  head: () => ({
    meta: [
      { title: "Focus Timer — StudySync" },
      { name: "description", content: "A Pomodoro focus timer with 25-minute sessions, short and long breaks, and focus-time tracking." },
      { property: "og:title", content: "Focus Timer — StudySync" },
      { property: "og:description", content: "A Pomodoro focus timer with 25-minute sessions, short and long breaks, and focus-time tracking." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FocusPage,
});
