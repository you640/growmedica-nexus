import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/admin/AuthProvider";
import { LogIn } from "lucide-react";

type Search = { next?: string };

export const Route = createFileRoute("/admin/prihlasenie")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    next: typeof s.next === "string" ? s.next : undefined,
  }),
  component: LoginPage,
});

function LoginPage() {
  const { user, loading, signIn } = useAuth();
  const navigate = useNavigate();
  const search = useSearch({ from: "/admin/prihlasenie" });
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      const next = search.next ? decodeURIComponent(search.next) : "/admin";
      navigate({ to: next });
    }
  }, [user, loading, search.next, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] p-4">
      <div className="w-full max-w-md rounded-gm-lg border border-gm-border bg-white/70 backdrop-blur-md p-8 shadow-sm">
        <div className="text-2xl font-semibold tracking-tight">
          Grow<span className="text-gm-primary">Medica</span>{" "}
          <span className="text-gm-text-muted text-base">Admin</span>
        </div>
        <p className="text-sm text-gm-text-muted mt-2">
          Prihláste sa cez Google. Prístup je obmedzený na e-maily z whitelistu.
        </p>

        <button
          disabled={busy}
          onClick={async () => {
            setErr(null);
            setBusy(true);
            try {
              await signIn();
            } catch (e) {
              setErr((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
          className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-full bg-gm-primary text-white px-5 py-3 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition"
        >
          <LogIn className="w-4 h-4" />
          {busy ? "Otvára sa Google…" : "Prihlásiť sa cez Google"}
        </button>
        {err && <div className="mt-4 text-sm text-red-600">{err}</div>}
      </div>
    </div>
  );
}