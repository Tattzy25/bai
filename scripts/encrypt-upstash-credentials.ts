#!/usr/bin/env tsx
/**
 * Encrypt Upstash credentials for database storage
 * Usage: tsx scripts/encrypt-upstash-credentials.ts
 */

import { encrypt } from '../lib/crypto.server'

async function main() {
  console.log('🔐 Encrypting Upstash Search Credentials\n')
  
  const upstashUrl = process.env.UPSTASH_SEARCH_REST_URL
  const upstashToken = process.env.UPSTASH_SEARCH_REST_TOKEN
  
  if (!upstashUrl || !upstashToken) {
    console.error('❌ Missing environment variables:')
    console.error('   UPSTASH_SEARCH_REST_URL')
    console.error('   UPSTASH_SEARCH_REST_TOKEN')
    process.exit(1)
  }
  
  console.log('Upstash URL (first 30 chars):', upstashUrl.substring(0, 30) + '...')
  console.log('Upstash Token (first 20 chars):', upstashToken.substring(0, 20) + '...\n')
  
  const encryptedUrl = encrypt(upstashUrl)
  const encryptedToken = encrypt(upstashToken)
  
  console.log('✅ Encrypted URL:', encryptedUrl)
  console.log('✅ Encrypted Token:', encryptedToken)
  console.log('\n📋 Copy these values into SETUP_TEST_USER.sql:')
  console.log('\nINSERT INTO search_indexes (...) VALUES (')
  console.log(`  ...,`)
  console.log(`  '${encryptedUrl}',  -- upstashSearchUrl`)
  console.log(`  '${encryptedToken}'  -- upstashSearchToken`)
  console.log(`);\n`)
}

main().catch(console.error)
