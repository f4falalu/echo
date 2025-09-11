import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { AppPageLayout } from "@/components/ui/layouts/AppPageLayout";
import { HomePageController, HomePageHeader } from "@/controllers/HomePage";

const searchParamsSchema = z.object({
  q: z.string().optional(),
  submit: z
    .preprocess((val) => {
      if (typeof val === "string") {
        return val === "true";
      }
      return val;
    }, z.boolean())
    .optional(),
});

export const Route = createFileRoute("/app/_app/home")({
  head: () => {
    return {
      meta: [
        { title: "Home" },
        { name: "description", content: "Buster home dashboard" },
        { name: "og:title", content: "Home" },
        { name: "og:description", content: "Buster home dashboard" },
      ],
    };
  },
  validateSearch: searchParamsSchema,
  component: RouteComponent,
});

function RouteComponent() {
  const { q, submit } = Route.useSearch();

  return (
    <AppPageLayout headerSizeVariant="list" header={<HomePageHeader />}>
      <HomePageController initialValue={q} autoSubmit={submit} />
    </AppPageLayout>
  );
}
