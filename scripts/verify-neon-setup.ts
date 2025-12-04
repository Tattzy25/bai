import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

async function verify() {
  try {
    console.log('🔍 Checking what Neon has already set up...\n');

    // Check auth schema exists
    console.log('1. Checking auth schema...');
    const schemas = await db.execute(sql`
      SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'auth';
    `);
    console.log(`   ${schemas.rows?.length ? '✅ auth schema exists' : '❌ auth schema missing'}\n`);

    // Check for auth functions
    console.log('2. Checking auth schema functions...');
    const functions = await db.execute(sql`
      SELECT routine_name
      FROM information_schema.routines
      WHERE routine_schema = 'auth'
      ORDER BY routine_name;
    `);

    if (functions.rows && functions.rows.length > 0) {
      console.log('   ✅ Found functions:');
      functions.rows.forEach((row: any) => {
        console.log(`      - auth.${row.routine_name}()`);
      });
    } else {
      console.log('   ❌ No functions in auth schema');
    }
    console.log();

    // Check neon_auth schema
    console.log('3. Checking neon_auth schema...');
    const neonAuth = await db.execute(sql`
      SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'neon_auth';
    `);
    console.log(`   ${neonAuth.rows?.length ? '✅ neon_auth schema exists' : '❌ neon_auth schema missing'}\n`);

    // Check users_sync table
    console.log('4. Checking neon_auth.users_sync table...');
    const userSync = await db.execute(sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'neon_auth' AND table_name = 'users_sync'
      ORDER BY ordinal_position;
    `);

    if (userSync.rows && userSync.rows.length > 0) {
      console.log('   ✅ users_sync table exists with columns:');
      userSync.rows.forEach((row: any) => {
        console.log(`      - ${row.column_name} (${row.data_type})`);
      });
    } else {
      console.log('   ❌ users_sync table not found');
    }
    console.log();

    // Check current RLS status
    console.log('5. Checking RLS status on app tables...');
    const rls = await db.execute(sql`
      SELECT tablename, rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename IN ('sites', 'crawl_jobs', 'quotas', 'analytics_query_events')
      ORDER BY tablename;
    `);

    if (rls.rows && rls.rows.length > 0) {
      console.log('   Tables:');
      rls.rows.forEach((row: any) => {
        console.log(
          `      - ${row.tablename}: RLS=${row.rowsecurity ? '✅ ENABLED' : '❌ disabled'}`,
        );
      });
    }
    console.log();

    // Check existing policies
    console.log('6. Checking existing RLS policies...');
    const policies = await db.execute(sql`
      SELECT tablename, policyname, cmd
      FROM pg_policies
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname;
    `);

    if (policies.rows && policies.rows.length > 0) {
      console.log('   ✅ Found policies:');
      policies.rows.forEach((row: any) => {
        console.log(`      - ${row.tablename}: ${row.policyname} (${row.cmd})`);
      });
    } else {
      console.log('   ❌ No RLS policies exist yet');
    }
    console.log();

    console.log('✅ Setup verification complete\n');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verify();
