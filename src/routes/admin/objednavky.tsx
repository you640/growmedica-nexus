import { createFileRoute } from "@tanstack/react-router";
import { PhaseStub } from "@/components/admin/PhaseStub";
import { ShoppingCart } from "lucide-react";

export const Route = createFileRoute("/admin/objednavky")({
  component: () => (
    <PhaseStub
      title="Objednávky"
      subtitle="Live feed objednávok zo Shopify s fulfilment akciami."
      phase="Fáza 2"
      icon={<ShoppingCart className="w-5 h-5" />}
      bullets={[
        "Real-time stream cez Shopify orders/* webhook",
        "Filter podľa statusu, dátumu a sumy",
        "Quick view zákazníka a položiek",
        "AI sumarizácia a riziko fraud detection",
      ]}
      cta={{ label: "Pripojiť Shopify v Nastaveniach", to: "/admin/nastavenia" }}
    />
  ),
});