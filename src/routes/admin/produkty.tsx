import { createFileRoute } from "@tanstack/react-router";
import { GlassPanel, SectionHeading } from "@/components/admin/AdminShell";

export const Route = createFileRoute("/admin/produkty")({
  component: () => (
    <div>
      <SectionHeading title="Produkty" subtitle="Shopify produkty + AI optimalizácia. Aktivuje sa vo Fáze 2." />
      <GlassPanel className="p-6 text-sm text-gm-text-muted">
        Po dokončení Fázy 1 (Shopify pripojenie v Nastaveniach) sa tu zobrazí live tabuľka produktov s AI drawerom.
      </GlassPanel>
    </div>
  ),
});