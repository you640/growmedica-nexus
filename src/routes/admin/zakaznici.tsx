import { createFileRoute } from "@tanstack/react-router";
import { PhaseStub } from "@/components/admin/PhaseStub";
import { Users } from "lucide-react";

export const Route = createFileRoute("/admin/zakaznici")({
  component: () => (
    <PhaseStub
      title="Zákazníci"
      subtitle="CRM pohľad na zákazníkov zo Shopify a marketing platformy."
      phase="Fáza 2"
      icon={<Users className="w-5 h-5" />}
      bullets={[
        "Profily zákazníkov, LTV a segmenty",
        "Synchronizácia s customers/* webhookom",
        "Tagy a poznámky",
        "AI insights — kto kúpi opäť",
      ]}
      cta={{ label: "Pripojiť Shopify v Nastaveniach", to: "/admin/nastavenia" }}
    />
  ),
});