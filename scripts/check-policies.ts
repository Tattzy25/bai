import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

async function checkPolicies() {
  try {
    console.log('🔍 Detailed RLS Policy Check\n');

    // Check pg_policies directly
    console.log('1. Checking pg_policies table...');
    const pgPolicies = await db.execute(sql`
      SELECT schemaname, tablename, policyname, cmd, qual, with_check
      FROM pg_policies
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname;
    `);

    if (pgPolicies.rows && pgPolicies.rows.length > 0) {
      console.log(`   ✅ Found ${pgPolicies.rows.length} policies:\n`);
      pgPolicies.rows.forEach((row: any) => {
        console.log(`   Table: ${row.tablename}`);
        console.log(`   Policy: ${row.policyname}`);
        console.log(`   Command: ${row.cmd}`);
        console.log(`   USING: ${row.qual ? row.qual.substring(0, 80) : 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('   ❌ No policies found in pg_policies\n');
    }

    // Check information_schema.table_constraints
    console.log('2. Checking for constraint information...');
    const constraints = await db.execute(sql`
      SELECT table_name, constraint_name, constraint_type
      FROM information_schema.table_constraints
      WHERE table_schema = 'public'
      AND table_name IN ('sites', 'crawl_jobs', 'quotas', 'analytics_query_events')
      ORDER BY table_name;
    `);

    if (constraints.rows && constraints.rows.length > 0) {
      console.log(`   Found constraints:\n`);
      constraints.rows.forEach((row: any) => {
        console.log(`   ${row.table_name}: ${row.constraint_name} (${row.constraint_type})`);
      });
    }
    console.log();

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkPolicies();
