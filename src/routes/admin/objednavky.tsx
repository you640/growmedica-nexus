import { createFileRoute } from "@tanstack/react-router";
import { GlassPanel, SectionHeading } from "@/components/admin/AdminShell";

export const Route = createFileRoute("/admin/objednavky")({
  component: () => (
    <div>
      <SectionHeading title="Objednávky" subtitle="Fáza 2." />
      <GlassPanel className="p-6 text-sm text-gm-text-muted">Coming soon.</GlassPanel>
    </div>
  ),
});