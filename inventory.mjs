import { neon } from '@neondatabase/serverless';

const dbUrl = 'postgresql://neondb_owner:npg_za8ZCq4iQJPg@ep-delicate-grass-adh2uctb-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require';
const sql = neon(dbUrl);

try {
  console.log('🔍 DATABASE INVENTORY');
  console.log('='.repeat(60));
  
  // Check all tables
  const tables = [
    'users',
    'accounts', 
    'sessions',
    'verification_tokens',
    'sites',
    'search_indexes',
    'crawl_jobs',
    'analytics_query_events',
    'quotas'
  ];
  
  for (const table of tables) {
    try {
      const result = await sql.query(`SELECT COUNT(*) as count FROM "${table}"`);
      const count = result[0].count;
      console.log(`\n📊 ${table.toUpperCase()}`);
      console.log(`   Records: ${count}`);
      
      if (count > 0 && table === 'users') {
        const users = await sql.query(`SELECT id, email, name FROM users`);
        users.forEach(u => {
          console.log(`   - ${u.email} (${u.id})`);
        });
      }
      if (count > 0 && table === 'sites') {
        const sites = await sql.query(`SELECT id, name, domain, user_id FROM sites LIMIT 3`);
        sites.forEach(s => {
          console.log(`   - ${s.name} (user: ${s.user_id})`);
        });
      }
    } catch (e) {
      console.log(`   Error checking table (may not exist)`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  
} catch (error) {
  console.error('❌ Connection Error:', error.message);
  process.exit(1);
}
