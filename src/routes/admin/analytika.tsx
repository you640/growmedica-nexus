import { createFileRoute } from "@tanstack/react-router";
import { GlassPanel, SectionHeading } from "@/components/admin/AdminShell";

export const Route = createFileRoute("/admin/analytika")({
  component: () => (
    <div>
      <SectionHeading title="Analytika" subtitle="Fáza 3." />
      <GlassPanel className="p-6 text-sm text-gm-text-muted">Coming soon.</GlassPanel>
    </div>
  ),
});