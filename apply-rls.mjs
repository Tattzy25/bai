#!/usr/bin/env node
import { config } from 'dotenv';
import { sql } from 'drizzle-orm';
import { neon } from '@neondatabase/serverless';
import fs from 'fs';

config();

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('❌ DATABASE_URL not found in .env');
  process.exit(1);
}

const client = neon(dbUrl);

async function applyRLS() {
  try {
    console.log('📦 Reading RLS migration...');
    const rls = fs.readFileSync('./migrations/enable_rls.sql', 'utf-8');

    console.log('🔧 Applying RLS to Neon...');
    const result = await client(rls);

    console.log('✅ RLS applied successfully!');
    console.log(result);

    // Verify RLS is enabled
    console.log('\n📋 Verifying RLS status...');
    const verify = await client(`
      SELECT tablename, rowsecurity
      FROM pg_tables
      WHERE tablename IN ('sites', 'crawl_jobs', 'quotas', 'analytics_query_events')
      AND schemaname = 'public'
      ORDER BY tablename;
    `);

    console.log('\n✅ RLS Status:');
    verify.forEach((row) => {
      console.log(`  ${row.tablename}: RLS=${row.rowsecurity}`);
    });

    // Check policies
    console.log('\n📋 Checking policies...');
    const policies = await client(`
      SELECT schemaname, tablename, policyname
      FROM pg_policies
      WHERE schemaname = 'public'
      AND tablename IN ('sites', 'crawl_jobs', 'quotas', 'analytics_query_events')
      ORDER BY tablename, policyname;
    `);

    console.log('\n✅ Policies Created:');
    policies.forEach((row) => {
      console.log(`  ${row.tablename}: ${row.policyname}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error applying RLS:');
    console.error(error.message);
    process.exit(1);
  }
}

applyRLS();
