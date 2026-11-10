import { createFileRoute } from "@tanstack/react-router";

import { SettingsPage } from "@/features/settings/SettingsPage";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — StudySync" },
      { name: "description", content: "Update your display name, switch themes and manage your saved StudySync data." },
      { property: "og:title", content: "Settings — StudySync" },
      { property: "og:description", content: "Update your display name, switch themes and manage your saved StudySync data." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});
