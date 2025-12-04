import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

async function createPolicies() {
  try {
    console.log('Creating RLS policies...\n');

    console.log('1. Creating sites policy...');
    await db.execute(sql`
      CREATE POLICY "sites_policy_authenticated" ON public.sites
        FOR ALL
        TO authenticated
        USING (user_id = auth.user_id())
        WITH CHECK (user_id = auth.user_id());
    `);
    console.log('   ✅ sites policy created');

    console.log('2. Creating crawl_jobs policy...');
    await db.execute(sql`
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
    `);
    console.log('   ✅ crawl_jobs policy created');

    console.log('3. Creating quotas policy...');
    await db.execute(sql`
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
    `);
    console.log('   ✅ quotas policy created');

    console.log('4. Creating analytics_query_events policy...');
    await db.execute(sql`
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
    `);
    console.log('   ✅ analytics_query_events policy created');

    console.log('\n✅✅✅ All RLS policies created! ✅✅✅\n');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createPolicies();
