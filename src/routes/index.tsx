import { createFileRoute } from "@tanstack/react-router";
import HomePage from "@/components/site/HomePage";

export const Route = createFileRoute("/")({
  component: HomePage,
});
