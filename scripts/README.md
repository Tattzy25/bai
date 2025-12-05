# Build Scripts

## Font Management Scripts

### `disable-fonts.sh`
**Purpose**: Disable Google Fonts for CI/CD builds in network-restricted environments

**Usage**:
```bash
./scripts/disable-fonts.sh
```

**What it does**:
- Backs up `app/layout.tsx` to `app/layout.tsx.backup`
- Comments out Google Fonts imports (`Geist`, `Geist_Mono`)
- Removes font variable usage from className
- Allows build to succeed without network access to Google Fonts API

### `enable-fonts.sh`
**Purpose**: Restore Google Fonts after build

**Usage**:
```bash
./scripts/enable-fonts.sh
```

**What it does**:
- Restores `app/layout.tsx` from backup
- Re-enables Google Fonts for local development

## Typical CI/CD Workflow

```bash
# 1. Install dependencies
npm install -g pnpm
pnpm install

# 2. Setup environment
echo "DATABASE_URL=..." > .env.local
echo "ENCRYPTION_KEY=..." >> .env.local
# ... other env vars

# 3. Disable fonts for build
./scripts/disable-fonts.sh

# 4. Build
pnpm build

# 5. (Optional) Restore fonts
./scripts/enable-fonts.sh
```

## Other Scripts

### `encrypt-upstash-credentials.ts`
**Purpose**: Encrypt Upstash Search credentials for database storage

**Usage**:
```bash
tsx scripts/encrypt-upstash-credentials.ts
```

**Requirements**:
- `.env.local` with `UPSTASH_SEARCH_REST_URL` and `UPSTASH_SEARCH_REST_TOKEN`
- `ENCRYPTION_KEY` environment variable

**Output**: Encrypted URL and token for use in SQL inserts
