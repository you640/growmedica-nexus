import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type ShopifyCfg = {
  store_domain?: string;
  api_version?: string;
  storefront_token?: string;
  admin_token?: string;
  webhook_secret?: string;
};

async function loadShopifyConfig(): Promise<ShopifyCfg> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("integrations")
    .select("config")
    .eq("provider", "shopify")
    .eq("name", "default")
    .maybeSingle();
  const cfg = (data?.config ?? {}) as ShopifyCfg;
  return {
    store_domain: cfg.store_domain || process.env.SHOPIFY_STORE_DOMAIN,
    api_version: cfg.api_version || process.env.SHOPIFY_API_VERSION || "2025-01",
    storefront_token:
      cfg.storefront_token || process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN,
    admin_token: cfg.admin_token || process.env.SHOPIFY_ADMIN_ACCESS_TOKEN,
    webhook_secret: cfg.webhook_secret || process.env.SHOPIFY_WEBHOOK_SECRET,
  };
}

async function gql(
  endpoint: string,
  token: string,
  tokenHeader: string,
  query: string
) {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      [tokenHeader]: token,
    },
    body: JSON.stringify({ query }),
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

export const testShopifyConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("./admin-guard.server");
    assertAdmin(context.claims);
    const cfg = await loadShopifyConfig();

    const result: {
      storefront: { ok: boolean; shop?: string; error?: string };
      admin: { ok: boolean; shop?: string; email?: string; error?: string };
      domain: string | null;
      apiVersion: string;
    } = {
      storefront: { ok: false },
      admin: { ok: false },
      domain: cfg.store_domain ?? null,
      apiVersion: cfg.api_version ?? "2025-01",
    };

    if (!cfg.store_domain) {
      result.storefront.error = "SHOPIFY_STORE_DOMAIN chýba";
      result.admin.error = "SHOPIFY_STORE_DOMAIN chýba";
      return result;
    }

    // Storefront
    if (cfg.storefront_token) {
      try {
        const r = await gql(
          `https://${cfg.store_domain}/api/${cfg.api_version}/graphql.json`,
          cfg.storefront_token,
          "X-Shopify-Storefront-Access-Token",
          `{ shop { name } }`
        );
        if (r.status === 200 && r.json?.data?.shop?.name) {
          result.storefront = { ok: true, shop: r.json.data.shop.name };
        } else {
          console.error("[shopify:storefront]", r.status, r.json);
          result.storefront.error = `HTTP ${r.status} — Storefront API odmietlo požiadavku.`;
        }
      } catch (e) {
        console.error("[shopify:storefront]", e);
        result.storefront.error = "Sieťová chyba pri pripojení na Storefront API.";
      }
    } else {
      result.storefront.error = "Storefront token chýba";
    }

    // Admin
    if (cfg.admin_token) {
      try {
        const r = await gql(
          `https://${cfg.store_domain}/admin/api/${cfg.api_version}/graphql.json`,
          cfg.admin_token,
          "X-Shopify-Access-Token",
          `{ shop { name email } }`
        );
        if (r.status === 200 && r.json?.data?.shop?.name) {
          result.admin = {
            ok: true,
            shop: r.json.data.shop.name,
            email: r.json.data.shop.email,
          };
        } else {
          console.error("[shopify:admin]", r.status, r.json);
          result.admin.error = `HTTP ${r.status} — Admin API odmietlo požiadavku.`;
        }
      } catch (e) {
        console.error("[shopify:admin]", e);
        result.admin.error = "Sieťová chyba pri pripojení na Admin API.";
      }
    } else {
      result.admin.error = "Admin token chýba";
    }

    // Save status
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const ok = result.storefront.ok && result.admin.ok;
    await supabaseAdmin.from("integrations").upsert(
      {
        provider: "shopify",
        name: "default",
        status: ok ? "connected" : "error",
        last_tested_at: new Date().toISOString(),
        last_error: ok
          ? null
          : `${result.storefront.error ?? ""} | ${result.admin.error ?? ""}`.trim(),
      },
      { onConflict: "provider,name" }
    );

    return result;
  });