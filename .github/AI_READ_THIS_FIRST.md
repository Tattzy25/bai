# ⚠️ CRITICAL: READ THIS BEFORE MAKING ANY CHANGES ⚠️

## 🚨 AUTHENTICATION: NEON AUTH ONLY - NO STACK AUTH 🚨

**THIS PROJECT USES NEON AUTH. PERIOD.**

### What This Means:

1. **DO NOT ADD STACK AUTH** (`@stackframe/stack`) - It is NOT used in this project
2. **DO NOT ADD AUTH0, CLERK, SUPABASE AUTH** - None of these are used
3. **DO NOT CREATE** `stackApp`, `useUser()`, `StackProvider` - These don't exist here
4. **DO NOT WRITE** authentication code - Neon handles it ALL

### How Authentication Actually Works:

```
┌─────────────────────────────────────────────────────────────┐
│  NEON AUTH handles EVERYTHING:                              │
│  • User sign-up/sign-in (Google, GitHub, Resend email)     │
│  • JWT token generation with user_id                        │
│  • JWT validation at database level                         │
│  • Row-Level Security (RLS) enforcement                     │
│  • The neon_auth schema (system-managed, read-only)         │
└─────────────────────────────────────────────────────────────┘
```

### The Authentication Flow:

1. **User authenticates** → Via Neon-hosted UI (Google/GitHub/email)
2. **Neon issues JWT** → Contains `user_id` claim
3. **Client includes JWT** → In `Authorization: Bearer <token>` header
4. **Neon validates JWT** → Automatically at database level
5. **RLS enforces isolation** → Via `auth.user_id()` function in Postgres

### What You Should NOT Do:

❌ Install `@stackframe/stack` package
❌ Create `lib/stack.ts` file
❌ Add Stack Auth environment variables
❌ Import `stackApp` or `useUser` from anywhere
❌ Create `StackProvider` components
❌ Add any authentication middleware that "gets the user"
❌ Manually validate JWTs in application code

### What You SHOULD Do:

✅ Use Neon Data API for all authenticated operations
✅ Let RLS policies handle user isolation automatically
✅ Trust that `auth.user_id()` function works in Postgres
✅ Include JWT in `Authorization: Bearer <token>` header
✅ Define RLS policies using Drizzle ORM in `lib/db/schema.ts`

### Example: Correct Pattern

```typescript
// API Route - app/api/sites/route.ts
import { db } from '@/lib/db'

export async function GET() {
  // JWT validated by Neon Data API automatically
  // RLS policy filters to current user via auth.user_id()
  const sites = await db.query.sites.findMany()
  return Response.json({ sites })
}
```

### Example: RLS Policy (Drizzle)

```typescript
// lib/db/schema.ts
export const sites = pgTable('sites', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  // ... other fields
}, (table) => ({
  // RLS policy - only show sites where userId matches JWT's user_id
  rls: crudPolicy({
    role: authenticatedRole,
    read: authUid(table.userId),    // Checks: userId = auth.user_id()
    modify: authUid(table.userId),
  })
}))
```

## 🔥 Why This Matters

**Previous attempts to add Stack Auth have:**
- Created authentication conflicts
- Broken existing RLS policies  
- Added unnecessary dependencies
- Wasted hours of development time
- Required complete rollbacks

**The neon_auth schema is:**
- System-managed by Neon platform
- **READ ONLY** - Do not touch it
- Automatically syncs user data
- Handles JWT validation internally

## 📚 Key Documentation References

**Read these Neon docs to understand the architecture:**
- [Neon Auth Overview](https://neon.tech/docs/neon-auth/overview)
- [Neon Data API + Auth Tutorial](https://neon.tech/docs/guides/rls-tutorial)
- [Row-Level Security with Neon](https://neon.tech/docs/guides/row-level-security)

## 🎯 The Bottom Line

**Neon Auth is NOT a library you install.**  
**Neon Auth is NOT code you write.**  
**Neon Auth is a PLATFORM FEATURE that just works.**

When you see authentication mentioned in this project:
- It means Neon Auth (the platform feature)
- NOT Stack Auth (the npm package)
- NOT any other third-party auth provider

## ✋ If You're About to Add Authentication

**STOP. YOU DON'T NEED TO.**

The authentication system is already complete and working. If something seems "missing":

1. The feature is handled by Neon platform
2. Check the Neon Console configuration
3. Verify JWT is being passed correctly
4. Review RLS policies in schema

**DO NOT "fix" authentication by adding Stack Auth or any other provider.**

---

## 📋 Quick Verification Checklist

Before making auth-related changes, verify:

- [ ] Is Neon Auth enabled in Neon Console?
- [ ] Are RLS policies defined in `lib/db/schema.ts`?
- [ ] Is JWT being passed in `Authorization` header?
- [ ] Does `auth.user_id()` function work in SQL?

If YES to all → Authentication is working correctly. Don't change it.

---

**Last Updated:** December 3, 2025  
**Reason for This File:** To prevent repeated attempts to add Stack Auth or other authentication providers that conflict with Neon Auth.

**Remember:** Neon is our client. Neon handles auth. We trust Neon. We don't add competing auth systems.
