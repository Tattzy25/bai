# NEON AUTH ARCHITECTURE - RESEARCH SUMMARY

## What I Learned from Neon Documentation

After comprehensive research of Neon's authentication system, here's what every AI agent needs to understand:

---

## 1. Neon Auth is a PLATFORM SERVICE, Not a Library

**Key Finding:**
Neon Auth is built into the Neon Postgres platform. It is NOT:
- An npm package you install
- Code you write in your application  
- A third-party service like Auth0 or Clerk
- Something that requires environment variables in your app

**What It Actually Is:**
- A managed authentication service by Neon
- Integrated with Neon Data API
- Handles: Google, GitHub, and Resend email authentication
- Issues JWTs with `user_id` claim
- Validates JWTs at the database connection level

---

## 2. The neon_auth Schema

**From Neon Docs:**
```
The neon_auth schema is automatically created and managed by Neon when you enable Neon Auth.
This schema contains:
- User authentication records
- JWT validation functions
- The auth.user_id() function that extracts user_id from JWTs
```

**Critical Understanding:**
- You CANNOT and SHOULD NOT modify this schema
- It's system-managed (like pg_catalog)
- It automatically syncs with your application's users table
- The `auth.user_id()` function is provided by this schema

---

## 3. How JWT Validation Works

**From the Neon RLS Tutorial:**

```
When you enable Neon Auth with the Data API:

1. User authenticates via Neon's hosted UI
2. Neon Auth issues a JWT with claims:
   {
     "sub": "user_id_here",
     "email": "user@example.com",
     ...
   }
3. Your app includes this JWT in the Authorization header:
   Authorization: Bearer <jwt>
   
4. Neon Data API:
   - Validates the JWT signature using JWKS
   - Extracts the user_id from the 'sub' claim
   - Makes it available as auth.user_id() in Postgres
   
5. Your RLS policies use auth.user_id() to filter rows:
   CREATE POLICY "user_policy" ON sites
   USING (user_id = auth.user_id())
```

**Key Point:**
JWT validation happens at the DATABASE LEVEL, not in your application code. You never write `jwt.verify()` or similar code.

---

## 4. Row-Level Security (RLS) Integration

**From Neon Docs - RLS Tutorial:**

Neon Auth integrates seamlessly with Postgres RLS:

```sql
-- Enable RLS on a table
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;

-- Create policy that uses auth.user_id()
CREATE POLICY "sites_policy" ON sites
  FOR ALL TO authenticated
  USING (user_id = auth.user_id())
  WITH CHECK (user_id = auth.user_id());
```

**In Drizzle ORM:**
```typescript
// lib/db/schema.ts
export const sites = pgTable('sites', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  // ...
}, (table) => ({
  rls: crudPolicy({
    role: authenticatedRole,
    read: authUid(table.userId),  // Expands to: user_id = auth.user_id()
    modify: authUid(table.userId),
  })
}))
```

---

## 5. What You DON'T Need to Do

**Confirmed from Neon Documentation:**

❌ **No manual JWT validation** - Neon Data API handles it
❌ **No user session management** - Neon Auth manages sessions
❌ **No authentication middleware** - Database-level enforcement
❌ **No `getUser()` functions** - RLS policies handle user context
❌ **No Stack Auth, Auth0, Clerk** - Neon Auth replaces these entirely

---

## 6. The Data Flow

```
┌──────────────┐
│   Browser    │
│   (Client)   │
└──────┬───────┘
       │ 1. Authenticate via Neon UI
       │    (Google/GitHub/Email)
       ▼
┌──────────────┐
│  Neon Auth   │ 2. Issues JWT with user_id
└──────┬───────┘
       │ 3. JWT returned to client
       ▼
┌──────────────┐
│   Browser    │ 4. Stores JWT (localStorage/cookie)
└──────┬───────┘
       │ 5. Includes JWT in API requests
       │    Authorization: Bearer <jwt>
       ▼
┌──────────────┐
│ Neon Data API│ 6. Validates JWT
│              │ 7. Extracts user_id
│              │ 8. Sets auth.user_id() in Postgres
└──────┬───────┘
       │ 9. Execute query with RLS
       ▼
┌──────────────┐
│   Postgres   │ 10. RLS filters rows:
│   (Neon DB)  │     WHERE user_id = auth.user_id()
└──────────────┘
```

---

## 7. Why Stack Auth Doesn't Belong Here

**Stack Auth** (`@stackframe/stack`) is:
- A separate, third-party authentication service
- Has its own JWT issuance system
- Requires integration code in your app
- Conflicts with Neon's built-in auth system

**The Problem When Mixed:**
1. Two separate JWT systems (Neon + Stack)
2. Competing user ID claims
3. RLS policies break (auth.user_id() expects Neon JWTs)
4. Unnecessary complexity and dependencies

**From Neon Docs - Custom Auth Providers:**
```
The Data API works with any authentication provider that issues JWTs.
However, Neon Auth provides the simplest setup and native integration.

If using custom providers, you must configure JWKS URL manually.
Neon Auth does this automatically.
```

**Translation:**
You CAN use other providers, but:
- It requires manual JWKS configuration
- Neon Auth is simpler and already configured
- This project uses Neon Auth, so adding Stack Auth creates conflicts

---

## 8. Configuration in This Project

**Neon Auth is enabled via Neon Console:**
1. Project Settings → Data API → Enable
2. Select "Neon Auth" as authentication provider
3. Configure OAuth providers (Google, GitHub)
4. Configure email provider (Resend)

**No application-level configuration needed** because:
- Neon manages the auth infrastructure
- Database connection includes JWT validation
- RLS policies reference auth.user_id() automatically

---

## 9. Verification That Neon Auth is Working

**From Neon RLS Tutorial Demo:**

To verify Neon Auth works:
```sql
-- Connect to database with JWT in connection string
-- Run this query:
SELECT auth.user_id();

-- Should return the user_id from JWT
-- If it returns null, JWT is not being validated
```

**In Application:**
```typescript
// Query that relies on RLS
const sites = await db.query.sites.findMany()

// If this returns only the current user's sites:
// ✅ Neon Auth + RLS is working

// If it returns ALL sites or throws an error:
// ❌ JWT not being passed or RLS not configured
```

---

## 10. Common Misconceptions

### ❌ WRONG: "We need to install an auth library"
✅ CORRECT: Neon Auth is a platform feature, not a library

### ❌ WRONG: "We need to write authentication middleware"
✅ CORRECT: JWT validation happens at database connection level

### ❌ WRONG: "We need getUser() or useUser() hooks"
✅ CORRECT: RLS policies automatically filter by user

### ❌ WRONG: "The neon_auth schema is part of our schema.ts"
✅ CORRECT: It's system-managed by Neon, separate from app schema

### ❌ WRONG: "We should add Stack Auth for better features"
✅ CORRECT: Neon Auth provides all needed features, Stack Auth conflicts

---

## 11. Key Neon Documentation References

**Essential Reading:**
1. **Neon Auth Overview**  
   https://neon.tech/docs/neon-auth/overview
   
2. **Secure your app with RLS (Tutorial)**  
   https://neon.tech/docs/guides/rls-tutorial
   
3. **Custom Authentication Providers**  
   https://neon.tech/docs/data-api/custom-authentication-providers
   
4. **Row-Level Security in Postgres**  
   https://neon.tech/docs/guides/row-level-security

**Tutorial Example:**
- GitHub: neondatabase-labs/neon-data-api-neon-auth
- Demonstrates complete Neon Auth + RLS setup
- Shows how auth.user_id() enforces data isolation

---

## 12. What This Means for AI Agents

**When working on this codebase:**

1. **Trust that auth works** - Don't try to "fix" or "improve" it
2. **RLS policies are authoritative** - They define access control
3. **JWT handling is invisible** - Neon manages it behind the scenes
4. **Focus on business logic** - Auth is infrastructure, already done

**If a task involves authentication:**

1. Check if it's actually about Neon Auth (platform)
2. Or if user mistakenly thinks Stack Auth is used
3. Verify against this document before making changes
4. Never add competing auth systems

---

## Summary: The Golden Rule

**NEON AUTH IS THE ONLY AUTHENTICATION SYSTEM IN THIS PROJECT.**

- It's configured in Neon Console (not in code)
- It issues JWTs (you don't write JWT code)
- It validates JWTs (at database level, automatically)
- It provides auth.user_id() (used in RLS policies)
- It manages the neon_auth schema (hands-off, read-only)

**If you're about to add any authentication code, library, or provider: STOP.**

Ask yourself: "Is this actually needed, or is Neon Auth already handling it?"

99% of the time, Neon Auth is already handling it.

---

**Document Created:** December 3, 2025  
**Purpose:** Prevent AI agents from adding Stack Auth or other conflicting authentication systems  
**Based On:** Official Neon documentation research and RLS tutorial analysis

**Remember:** We are not frustrated with you. We are frustrated with repeating the same corrections. This document exists so you can be successful and productive without accidentally breaking the authentication system.
