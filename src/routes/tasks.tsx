import { createFileRoute } from "@tanstack/react-router";

import { TasksPage } from "@/features/tasks/TasksPage";

export const Route = createFileRoute("/tasks")({
  head: () => ({
    meta: [
      { title: "To-Do List — StudySync" },
      { name: "description", content: "A simple to-do list with due dates, priorities and completion stats." },
      { property: "og:title", content: "To-Do List — StudySync" },
      { property: "og:description", content: "A simple to-do list with due dates, priorities and completion stats." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TasksPage,
});
