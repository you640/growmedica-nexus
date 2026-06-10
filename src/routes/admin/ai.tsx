import { createFileRoute } from "@tanstack/react-router";
import { PhaseStub } from "@/components/admin/PhaseStub";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/admin/ai")({
  component: () => (
    <PhaseStub
      title="Agentic AI"
      subtitle="Command Bar — píšte príkazy a agenti vykonajú akcie naprieč integráciami."
      phase="Fáza 3"
      icon={<Sparkles className="w-5 h-5" />}
      bullets={[
        "Gemini ako primárny model, Mistral fallback",
        "Akcie: optimalizácia produktov, hromadné updaty, exporty",
        "Pamäť kontextu medzi turnami",
        "Audit log všetkých AI akcií",
      ]}
      cta={{ label: "Pripojiť Gemini v Nastaveniach", to: "/admin/nastavenia" }}
    />
  ),
});