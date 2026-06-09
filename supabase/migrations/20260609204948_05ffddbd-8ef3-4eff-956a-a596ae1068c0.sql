
-- updated_at trigger helper
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 1) integrations
CREATE TABLE public.integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'disconnected',
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_tested_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, name)
);
GRANT ALL ON public.integrations TO service_role;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny all integrations" ON public.integrations FOR ALL TO authenticated, anon USING (false) WITH CHECK (false);
CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON public.integrations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) webhook_endpoints
CREATE TABLE public.webhook_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  target_url TEXT NOT NULL,
  secret_hash TEXT,
  events TEXT[] NOT NULL,
  framework TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.webhook_endpoints TO service_role;
ALTER TABLE public.webhook_endpoints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny all webhook_endpoints" ON public.webhook_endpoints FOR ALL TO authenticated, anon USING (false) WITH CHECK (false);

-- 3) webhook_events
CREATE TABLE public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  topic TEXT NOT NULL,
  payload JSONB,
  status TEXT NOT NULL DEFAULT 'received',
  error TEXT,
  relayed_to UUID[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX webhook_events_created_at_idx ON public.webhook_events (created_at DESC);
CREATE INDEX webhook_events_topic_idx ON public.webhook_events (topic);
GRANT ALL ON public.webhook_events TO service_role;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny all webhook_events" ON public.webhook_events FOR ALL TO authenticated, anon USING (false) WITH CHECK (false);

-- 4) sync_jobs
CREATE TABLE public.sync_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type TEXT NOT NULL,
  provider TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  progress INT NOT NULL DEFAULT 0,
  total INT NOT NULL DEFAULT 0,
  result JSONB,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX sync_jobs_created_at_idx ON public.sync_jobs (created_at DESC);
GRANT ALL ON public.sync_jobs TO service_role;
ALTER TABLE public.sync_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny all sync_jobs" ON public.sync_jobs FOR ALL TO authenticated, anon USING (false) WITH CHECK (false);

-- 5) shopify_product_cache
CREATE TABLE public.shopify_product_cache (
  shopify_id TEXT PRIMARY KEY,
  handle TEXT UNIQUE,
  title TEXT,
  status TEXT,
  price_amount NUMERIC,
  currency TEXT,
  image_url TEXT,
  metafields JSONB,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.shopify_product_cache TO service_role;
ALTER TABLE public.shopify_product_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny all shopify_product_cache" ON public.shopify_product_cache FOR ALL TO authenticated, anon USING (false) WITH CHECK (false);
