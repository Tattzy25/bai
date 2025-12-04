import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import fs from 'fs';

async function applyRLS() {
  try {
    console.log('📦 Reading RLS migration...');
    const rlsContent = fs.readFileSync('./migrations/enable_rls.sql', 'utf-8');

    // Remove comments and split by semicolon, keeping multi-line statements intact
    const lines = rlsContent.split('\n').filter((line) => !line.trim().startsWith('--'));
    const fullContent = lines.join('\n');

    const statements = fullContent
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s && s.length > 0);

    console.log(`🔧 Applying ${statements.length} RLS statements to Neon...\n`);

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      const preview = stmt.replace(/\n/g, ' ').substring(0, 70);
      console.log(`[${i + 1}/${statements.length}] ${preview}...`);
      try {
        await db.execute(sql.raw(stmt));
        console.log(`✅ Success\n`);
      } catch (error: any) {
        console.error(`❌ Failed: ${error.message}\n`);
        throw error;
      }
    }

    console.log('\n✅ All RLS statements applied successfully!\n');

    // Verify RLS is enabled
    console.log('📋 Verifying RLS status...\n');
    const verify = await db.execute(sql`
      SELECT tablename, rowsecurity
      FROM pg_tables
      WHERE tablename IN ('sites', 'crawl_jobs', 'quotas', 'analytics_query_events')
      AND schemaname = 'public'
      ORDER BY tablename;
    `);

    if (verify.rows && verify.rows.length > 0) {
      console.log('✅ RLS Status:');
      verify.rows.forEach((row: any) => {
        console.log(`  ${row.tablename}: RLS=${row.rowsecurity ? 'ENABLED' : 'DISABLED'}`);
      });
    }

    // Check policies
    console.log('\n📋 Checking policies...\n');
    const policies = await db.execute(sql`
      SELECT schemaname, tablename, policyname
      FROM pg_policies
      WHERE schemaname = 'public'
      AND tablename IN ('sites', 'crawl_jobs', 'quotas', 'analytics_query_events')
      ORDER BY tablename, policyname;
    `);

    if (policies.rows && policies.rows.length > 0) {
      console.log('✅ Policies Created:');
      policies.rows.forEach((row: any) => {
        console.log(`  ${row.tablename}: ${row.policyname}`);
      });
    }

    console.log('\n✅✅✅ RLS Setup Complete! ✅✅✅\n');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Error applying RLS:');
    console.error(error.message || error);
    process.exit(1);
  }
}

applyRLS();
