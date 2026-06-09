import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { GlassPanel, SectionHeading } from "@/components/admin/AdminShell";
import { useAuth } from "@/components/admin/AuthProvider";
import {
  listIntegrations,
  upsertIntegrationConfig,
  listRecentWebhookEvents,
} from "@/lib/admin.functions";
import { testShopifyConnection } from "@/lib/shopify.functions";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Plug,
  Database,
  Cloud,
  Flame,
  Sparkles,
  Server,
  Globe,
  Webhook,
  Copy,
} from "lucide-react";

export const Route = createFileRoute("/admin/nastavenia")({
  component: SettingsPage,
});

const PROVIDERS = [
  { id: "shopify", label: "Shopify", icon: Plug },
  { id: "lovable_cloud", label: "Lovable Cloud", icon: Database },
  { id: "vercel", label: "Vercel", icon: Cloud },
  { id: "firebase", label: "Firebase", icon: Flame },
  { id: "google_ai", label: "Google AI / Gemini", icon: Sparkles },
  { id: "gcp", label: "Google Cloud", icon: Server },
  { id: "wordpress", label: "WordPress", icon: Globe },
  { id: "custom", label: "Custom Webhook", icon: Webhook },
] as const;

type Tab = (typeof PROVIDERS)[number]["id"];

type IntegrationRow = {
  provider: string;
  status: string;
  last_error: string | null;
  last_tested_at: string | null;
};

function StatusDot({ status }: { status?: string | null }) {
  const color =
    status === "connected"
      ? "bg-green-500"
      : status === "error"
      ? "bg-red-500"
      : status === "testing"
      ? "bg-yellow-500"
      : "bg-gray-300";
  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${color}`} />;
}

function SettingsPage() {
  const [tab, setTab] = useState<Tab>("shopify");
  const { getToken } = useAuth();
  const listFn = useServerFn(listIntegrations);
  const [integrations, setIntegrations] = useState<IntegrationRow[]>([]);

  async function refresh() {
    const token = await getToken();
    if (!token) return;
    const r = await listFn({ data: { token } });
    setIntegrations(r.integrations as IntegrationRow[]);
  }
  useEffect(() => {
    refresh().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusFor = (id: string) =>
    integrations.find((i) => i.provider === id)?.status ?? "disconnected";

  return (
    <div>
      <SectionHeading
        title="Integration Hub"
        subtitle="Pripojte Shopify, Lovable Cloud, Vercel, Firebase, Gemini, GCP, WordPress a vlastné webhooky. Všetky secrets sú v UI maskované a uložené v Cloude."
      />

      <div className="grid gap-6 md:grid-cols-[260px_1fr]">
        <GlassPanel className="p-2 h-fit">
          {PROVIDERS.map((p) => {
            const Icon = p.icon;
            const active = tab === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setTab(p.id)}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-md text-sm transition ${
                  active
                    ? "bg-[var(--gm-primary)]/10 text-gm-text"
                    : "text-gm-text-muted hover:bg-gm-bg-soft hover:text-gm-text"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  {p.label}
                </span>
                <StatusDot status={statusFor(p.id)} />
              </button>
            );
          })}
        </GlassPanel>

        <div>
          {tab === "shopify" && <ShopifyCard onSaved={refresh} />}
          {tab === "lovable_cloud" && <LovableCloudCard />}
          {tab !== "shopify" && tab !== "lovable_cloud" && (
            <PlaceholderCard label={PROVIDERS.find((p) => p.id === tab)!.label} />
          )}
        </div>
      </div>
    </div>
  );
}

function ShopifyCard({ onSaved }: { onSaved: () => void }) {
  const { getToken } = useAuth();
  const upsert = useServerFn(upsertIntegrationConfig);
  const test = useServerFn(testShopifyConnection);

  const [form, setForm] = useState({
    store_domain: "",
    api_version: "2025-01",
    storefront_token: "",
    admin_token: "",
    webhook_secret: "",
  });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  type TestResult = Awaited<ReturnType<typeof test>>;
  const [result, setResult] = useState<TestResult | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  async function save() {
    const token = await getToken();
    if (!token) return;
    setSaving(true);
    setSavedMsg(null);
    try {
      const config: Record<string, string> = { api_version: form.api_version };
      for (const k of [
        "store_domain",
        "storefront_token",
        "admin_token",
        "webhook_secret",
      ] as const) {
        if (form[k]) config[k] = form[k];
      }
      await upsert({
        data: { token, provider: "shopify", name: "default", config },
      });
      setSavedMsg("Uložené.");
      onSaved();
    } catch (e) {
      setSavedMsg(`Chyba: ${(e as Error).message}`);
    } finally {
      setSaving(false);
    }
  }

  async function runTest() {
    const token = await getToken();
    if (!token) return;
    setTesting(true);
    setResult(null);
    try {
      const r = await test({ data: { token } });
      setResult(r);
      onSaved();
    } catch (e) {
      setResult({
        storefront: { ok: false, error: (e as Error).message },
        admin: { ok: false, error: (e as Error).message },
        domain: null,
        apiVersion: "",
      } as TestResult);
    } finally {
      setTesting(false);
    }
  }

  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://your-app";

  return (
    <GlassPanel className="p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Shopify</h2>
        <p className="text-sm text-gm-text-muted mt-1">
          Storefront + Admin API 2025-01. Po uložení spustite test pripojenia.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Field
          label="Store domain"
          placeholder="moj-shop.myshopify.com"
          value={form.store_domain}
          onChange={(v) => setForm({ ...form, store_domain: v })}
        />
        <Field
          label="API verzia"
          value={form.api_version}
          onChange={(v) => setForm({ ...form, api_version: v })}
        />
        <Field
          label="Storefront access token"
          placeholder="shpat_…"
          secret
          value={form.storefront_token}
          onChange={(v) => setForm({ ...form, storefront_token: v })}
        />
        <Field
          label="Admin access token"
          placeholder="shpat_…"
          secret
          value={form.admin_token}
          onChange={(v) => setForm({ ...form, admin_token: v })}
        />
        <Field
          label="Webhook secret"
          secret
          value={form.webhook_secret}
          onChange={(v) => setForm({ ...form, webhook_secret: v })}
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-full bg-gm-primary text-white px-5 py-2 text-sm hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Ukladám…" : "Uložiť konfiguráciu"}
        </button>
        <button
          onClick={runTest}
          disabled={testing}
          className="rounded-full border border-gm-border bg-white px-5 py-2 text-sm hover:bg-gm-bg-soft disabled:opacity-50 inline-flex items-center gap-2"
        >
          {testing && <Loader2 className="w-4 h-4 animate-spin" />}
          Test pripojenia
        </button>
        {savedMsg && (
          <span className="text-sm text-gm-text-muted self-center">{savedMsg}</span>
        )}
      </div>

      {result && (
        <div className="grid gap-3 md:grid-cols-2 text-sm">
          <ResultRow
            label="Storefront API"
            ok={result.storefront.ok}
            detail={
              result.storefront.ok
                ? `Shop: ${result.storefront.shop}`
                : result.storefront.error
            }
          />
          <ResultRow
            label="Admin API"
            ok={result.admin.ok}
            detail={
              result.admin.ok
                ? `Shop: ${result.admin.shop} (${result.admin.email})`
                : result.admin.error
            }
          />
        </div>
      )}

      <div className="border-t border-gm-border pt-4">
        <div className="text-sm font-medium">Webhook URL pre Shopify Admin</div>
        <p className="text-xs text-gm-text-muted mt-1">
          Skopírujte túto URL do <i>Settings → Notifications → Webhooks</i> v Shopify.
          Topics: products/*, orders/*, customers/*, inventory_levels/update, collections/*.
        </p>
        <CopyRow value={`${origin}/api/public/webhooks/shopify`} />
      </div>
    </GlassPanel>
  );
}

function LovableCloudCard() {
  const { getToken } = useAuth();
  const fn = useServerFn(listRecentWebhookEvents);
  type EventRow = {
    id: string;
    source: string;
    topic: string;
    status: string;
    error: string | null;
    created_at: string;
  };
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const token = await getToken();
        if (!token) return;
        const r = await fn({ data: { token } });
        setEvents(r.events as EventRow[]);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <GlassPanel className="p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Lovable Cloud</h2>
        <p className="text-sm text-gm-text-muted mt-1">
          Postgres + edge runtime sú zapnuté automaticky. Tabuľky: integrations,
          webhook_endpoints, webhook_events, sync_jobs, shopify_product_cache.
        </p>
      </div>

      <div>
        <div className="text-sm font-medium mb-2">Posledné webhook eventy</div>
        {loading ? (
          <div className="text-sm text-gm-text-muted">Načítavam…</div>
        ) : events.length === 0 ? (
          <div className="text-sm text-gm-text-muted">
            Zatiaľ žiadne. Po nakonfigurovaní Shopify webhooku sa tu objavia.
          </div>
        ) : (
          <div className="overflow-auto rounded-md border border-gm-border">
            <table className="w-full text-xs">
              <thead className="bg-gm-bg-soft text-gm-text-muted">
                <tr>
                  <th className="text-left px-3 py-2">Čas</th>
                  <th className="text-left px-3 py-2">Source</th>
                  <th className="text-left px-3 py-2">Topic</th>
                  <th className="text-left px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e.id} className="border-t border-gm-border">
                    <td className="px-3 py-2 whitespace-nowrap">
                      {new Date(e.created_at).toLocaleString("sk-SK")}
                    </td>
                    <td className="px-3 py-2">{e.source}</td>
                    <td className="px-3 py-2 font-mono">{e.topic}</td>
                    <td className="px-3 py-2">
                      <span
                        className={
                          e.status === "failed"
                            ? "text-red-600"
                            : e.status === "relayed"
                            ? "text-green-600"
                            : "text-gm-text-muted"
                        }
                      >
                        {e.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </GlassPanel>
  );
}

function PlaceholderCard({ label }: { label: string }) {
  return (
    <GlassPanel className="p-6">
      <h2 className="text-lg font-semibold">{label}</h2>
      <p className="text-sm text-gm-text-muted mt-2">
        Karta bude aktivovaná vo Fáze 3/4 (test connection, manažment configu, log používania).
      </p>
    </GlassPanel>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  secret,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  secret?: boolean;
}) {
  const [reveal, setReveal] = useState(false);
  return (
    <label className="block text-sm">
      <span className="text-xs uppercase tracking-wider text-gm-text-muted">
        {label}
      </span>
      <div className="mt-1 flex">
        <input
          type={secret && !reveal ? "password" : "text"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? ""}
          className="flex-1 rounded-md border border-gm-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 ring-gm-primary/30"
        />
        {secret && (
          <button
            type="button"
            onClick={() => setReveal((r) => !r)}
            className="ml-2 text-xs px-2 rounded-md border border-gm-border bg-white hover:bg-gm-bg-soft"
          >
            {reveal ? "Skryť" : "Zobraziť"}
          </button>
        )}
      </div>
    </label>
  );
}

function ResultRow({
  label,
  ok,
  detail,
}: {
  label: string;
  ok: boolean;
  detail?: string;
}) {
  return (
    <div
      className={`rounded-md border px-3 py-2 ${
        ok
          ? "border-green-200 bg-green-50 text-green-800"
          : "border-red-200 bg-red-50 text-red-800"
      }`}
    >
      <div className="flex items-center gap-2 font-medium">
        {ok ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
        {label}
      </div>
      {detail && <div className="text-xs mt-1 break-all">{detail}</div>}
    </div>
  );
}

function CopyRow({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-2 flex items-center gap-2">
      <code className="flex-1 truncate rounded-md border border-gm-border bg-white px-3 py-2 text-xs">
        {value}
      </code>
      <button
        onClick={async () => {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="text-xs px-3 py-2 rounded-md border border-gm-border bg-white hover:bg-gm-bg-soft inline-flex items-center gap-1"
      >
        <Copy className="w-3.5 h-3.5" /> {copied ? "Skopírované" : "Kopírovať"}
      </button>
    </div>
  );
}