import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

async function test() {
  try {
    console.log('Checking for auth.user_id() function...');
    const result = await db.execute(sql`
      SELECT routine_name, routine_type
      FROM information_schema.routines
      WHERE routine_schema = 'auth'
      ORDER BY routine_name;
    `);

    if (result.rows && result.rows.length > 0) {
      console.log('✅ Found auth schema functions:');
      result.rows.forEach((row: any) => {
        console.log(`  ${row.routine_schema}.${row.routine_name}() (${row.routine_type})`);
      });
    } else {
      console.log('❌ No auth schema functions found');
    }

    console.log('\nChecking for current_user() or session functions...');
    const result2 = await db.execute(sql`
      SELECT routine_name, routine_type
      FROM information_schema.routines
      WHERE routine_type = 'FUNCTION'
      AND (routine_name LIKE '%user%' OR routine_name LIKE '%session%' OR routine_name LIKE '%auth%')
      LIMIT 20;
    `);

    if (result2.rows && result2.rows.length > 0) {
      console.log('Found functions:');
      result2.rows.forEach((row: any) => {
        console.log(`  ${row.routine_schema}.${row.routine_name}()`);
      });
    } else {
      console.log('No user/session/auth functions found');
    }

    console.log('\nTesting current_user()...');
    const result3 = await db.execute(sql`SELECT current_user;`);
    console.log('Current user:', result3.rows?.[0]);

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message || error);
    process.exit(1);
  }
}

test();
