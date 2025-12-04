-- Enable RLS on all user-owned tables
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crawl_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_query_events ENABLE ROW LEVEL SECURITY;

-- RLS policy for sites table: users can only access their own sites
CREATE POLICY "sites_policy_authenticated" ON public.sites
  FOR ALL
  TO authenticated
  USING (user_id = auth.user_id())
  WITH CHECK (user_id = auth.user_id());

-- RLS policy for crawl_jobs: access via site ownership
CREATE POLICY "crawl_jobs_policy_authenticated" ON public.crawl_jobs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.sites
      WHERE sites.id = crawl_jobs.site_id
      AND sites.user_id = auth.user_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sites
      WHERE sites.id = crawl_jobs.site_id
      AND sites.user_id = auth.user_id()
    )
  );

-- RLS policy for quotas: access via site ownership
CREATE POLICY "quotas_policy_authenticated" ON public.quotas
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.sites
      WHERE sites.id = quotas.site_id
      AND sites.user_id = auth.user_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sites
      WHERE sites.id = quotas.site_id
      AND sites.user_id = auth.user_id()
    )
  );

-- RLS policy for analytics_query_events: access via site ownership
CREATE POLICY "analytics_query_events_policy_authenticated" ON public.analytics_query_events
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.sites
      WHERE sites.id = analytics_query_events.site_id
      AND sites.user_id = auth.user_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sites
      WHERE sites.id = analytics_query_events.site_id
      AND sites.user_id = auth.user_id()
    )
  );

-- Grant usage on auth schema to authenticated role
GRANT USAGE ON SCHEMA auth TO authenticated;
