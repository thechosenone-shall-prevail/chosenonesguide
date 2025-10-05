# Phase 1 Installation Guide

## Required Package Installation

To use the Phase 1 features, you need to install the following packages:

### 1. Install AI Provider SDKs

```bash
# OpenAI SDK
npm install openai

# Anthropic SDK
npm install @anthropic-ai/sdk

# Google AI SDK
npm install @google/generative-ai
```

### 2. Verify Existing Packages

These should already be installed (verify in package.json):

```bash
# Vercel KV (Redis) - Already installed
# @vercel/kv

# Drizzle ORM - Already installed
# drizzle-orm
# @vercel/postgres

# Next.js and React - Already installed
# next
# react
# react-dom
```

### 3. Install Development Dependencies (Optional)

```bash
# For database migrations
npm install -D drizzle-kit

# For testing (if not already installed)
npm install -D @types/node
```

## Environment Variables

Create or update your `.env.local` file:

```env
# AI Provider API Keys
OPENAI_API_KEY=sk-proj-...
ANTHROPIC_API_KEY=sk-ant-api03-...
GOOGLE_AI_API_KEY=AIza...

# Vercel KV (Redis) - Should already be configured
KV_URL=redis://...
KV_REST_API_URL=https://...
KV_REST_API_TOKEN=...
KV_REST_API_READ_ONLY_TOKEN=...

# Database - Should already be configured
POSTGRES_URL=postgres://...
POSTGRES_PRISMA_URL=postgres://...
POSTGRES_URL_NON_POOLING=postgres://...

# Razorpay (for Phase 2)
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
```

## Database Migration

After installing packages, run the database migrations:

```bash
# Generate migration files
npx drizzle-kit generate

# Push changes to database
npx drizzle-kit push

# Or use the combined command
npx drizzle-kit push --force
```

## Verification

### 1. Check TypeScript Compilation

```bash
npm run build
```

### 2. Test Agent Coordinator

Create a test file `test-phase1.ts`:

```typescript
import { getAgentCoordinator } from './lib/ai/agents/coordinator';

async function test() {
  const coordinator = getAgentCoordinator();
  const team = await coordinator.initializeAgents('test-project');
  console.log(`✅ Initialized ${team.agents.length} agents`);
  
  team.agents.forEach(agent => {
    console.log(`  - ${agent.role}: ${agent.model}`);
  });
}

test().catch(console.error);
```

Run it:
```bash
npx tsx test-phase1.ts
```

### 3. Test Rate Limiter

```typescript
import { getRateLimiter } from './lib/rate-limit';

async function test() {
  const limiter = getRateLimiter();
  
  const result = await limiter.checkLimit({
    userId: 'test-user',
    tier: 'free',
    window: 3600,
    maxRequests: 10,
  });
  
  console.log('✅ Rate limiter working:', result);
}

test().catch(console.error);
```

### 4. Test AI Provider

```typescript
import { createProviderClient } from './lib/ai/providers';

async function test() {
  if (!process.env.OPENAI_API_KEY) {
    console.log('⚠️  OPENAI_API_KEY not set');
    return;
  }
  
  const client = createProviderClient('openai', process.env.OPENAI_API_KEY);
  
  const response = await client.generateText({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: 'Say hello!' }],
  });
  
  console.log('✅ AI Provider working:', response.text);
}

test().catch(console.error);
```

## Troubleshooting

### Issue: "Cannot find module 'openai'"

**Solution:**
```bash
npm install openai @anthropic-ai/sdk @google/generative-ai
```

### Issue: "Cannot find module '@vercel/kv'"

**Solution:**
This should already be installed. If not:
```bash
npm install @vercel/kv
```

### Issue: Database connection errors

**Solution:**
1. Verify your `POSTGRES_URL` is correct
2. Check if Vercel Postgres is set up
3. Run migrations: `npx drizzle-kit push`

### Issue: Redis/KV connection errors

**Solution:**
1. Verify your KV environment variables
2. Check if Vercel KV is set up in your project
3. Test connection in Vercel dashboard

### Issue: TypeScript errors about types

**Solution:**
```bash
npm install -D @types/node
```

## Package Versions

Recommended versions (add to package.json):

```json
{
  "dependencies": {
    "openai": "^4.0.0",
    "@anthropic-ai/sdk": "^0.20.0",
    "@google/generative-ai": "^0.2.0",
    "@vercel/kv": "^1.0.0",
    "@vercel/postgres": "^0.10.0",
    "drizzle-orm": "^0.34.0"
  },
  "devDependencies": {
    "drizzle-kit": "^0.24.0",
    "@types/node": "^20.0.0"
  }
}
```

## Post-Installation Checklist

- [ ] All packages installed
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] TypeScript compiles without errors
- [ ] Agent coordinator test passes
- [ ] Rate limiter test passes
- [ ] AI provider test passes (if API keys available)

## Next Steps

Once installation is complete:

1. Read `PHASE1_SUMMARY.md` for an overview
2. Check `docs/PHASE1_QUICK_START.md` for usage examples
3. Review `PHASE1_COMPLETION.md` for detailed implementation info
4. Start building with Phase 1 features!

## Support

If you encounter issues:

1. Check the error message carefully
2. Verify all environment variables are set
3. Ensure all packages are installed
4. Check Vercel dashboard for KV and Postgres status
5. Review the documentation files

## Ready to Go!

Once all checks pass, you're ready to use Phase 1 features:

```typescript
// Your code here
import { getAgentCoordinator } from '@/lib/ai/agents/coordinator';
import { createProviderClient } from '@/lib/ai/providers';
import { getRateLimiter } from '@/lib/rate-limit';

// Start building!
```

---

**Installation Status: Ready for Phase 1 Usage**
