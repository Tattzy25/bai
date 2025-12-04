import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

async function createAuthFunction() {
  try {
    console.log('Creating auth.user_id() function for RLS...\n');

    // Create auth schema if it doesn't exist
    console.log('1. Creating auth schema...');
    await db.execute(sql`CREATE SCHEMA IF NOT EXISTS auth;`);
    console.log('   ✅ auth schema ready\n');

    // Create auth.user_id() function
    console.log('2. Creating auth.user_id() function...');
    await db.execute(sql`
      CREATE OR REPLACE FUNCTION auth.user_id() RETURNS text AS $$
        SELECT current_setting('auth.user_id', true)::text;
      $$ LANGUAGE SQL STABLE;
    `);
    console.log('   ✅ auth.user_id() function created\n');

    // Grant access
    console.log('3. Granting schema access...');
    await db.execute(sql`GRANT USAGE ON SCHEMA auth TO authenticated;`);
    console.log('   ✅ authenticated role granted access\n');

    // Now create the policies
    console.log('4. Creating RLS policies...\n');

    console.log('   Creating sites policy...');
    await db.execute(sql`
      CREATE POLICY "sites_policy_authenticated" ON public.sites
        FOR ALL
        TO authenticated
        USING (user_id = auth.user_id())
        WITH CHECK (user_id = auth.user_id());
    `);
    console.log('   ✅ sites policy created');

    console.log('   Creating crawl_jobs policy...');
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

    console.log('   Creating quotas policy...');
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

    console.log('   Creating analytics_query_events policy...');
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

    console.log('\n✅✅✅ All RLS policies successfully created! ✅✅✅\n');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createAuthFunction();
