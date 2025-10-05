# Installation Guide - Enterprise AI Development Platform

## Prerequisites

- Node.js 18+ 
- npm or pnpm
- Vercel account (for Postgres and KV)
- Razorpay account (for payments)

## Step 1: Install Dependencies

### Core Dependencies (Already Installed)
These should already be in your package.json:
- next
- react
- react-dom
- drizzle-orm
- @vercel/postgres
- @vercel/kv
- zod

### New Dependencies to Install

```bash
# AI Provider SDKs
npm install openai @anthropic-ai/sdk @google/generative-ai

# Payment Processing
npm install razorpay

# Real-Time Communication
npm install socket.io socket.io-client

# Code Execution (Client-side only)
npm install @webcontainer/api

# Development Dependencies
npm install -D @types/node
```

## Step 2: Environment Variables

Create or update your `.env.local` file:

```env
# Database (Vercel Postgres)
POSTGRES_URL=postgresql://...
POSTGRES_PRISMA_URL=postgresql://...
POSTGRES_URL_NON_POOLING=postgresql://...

# Redis (Vercel KV)
KV_URL=redis://...
KV_REST_API_URL=https://...
KV_REST_API_TOKEN=...
KV_REST_API_READ_ONLY_TOKEN=...

# AI Provider API Keys
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_AI_API_KEY=...

# Razorpay (Payment Gateway)
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...

# Razorpay Plan IDs (Optional - will use defaults)
RAZORPAY_PLAN_FREE=plan_free
RAZORPAY_PLAN_PRO=plan_...
RAZORPAY_PLAN_TEAM=plan_...
RAZORPAY_PLAN_ENTERPRISE=plan_...

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# NextAuth (if using)
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000
```

## Step 3: Database Setup

Run database migrations:

```bash
# Generate migration files
npx drizzle-kit generate

# Push schema to database
npx drizzle-kit push
```

## Step 4: Verify Installation

Check that all packages are installed:

```bash
npm list openai @anthropic-ai/sdk @google/generative-ai razorpay socket.io @webcontainer/api
```

## Step 5: Build and Run

```bash
# Development
npm run dev

# Production build
npm run build
npm start
```

## Common Issues and Solutions

### Issue: "Cannot find module 'socket.io'"
**Solution:**
```bash
npm install socket.io socket.io-client
```

### Issue: "Cannot find module '@webcontainer/api'"
**Solution:**
```bash
npm install @webcontainer/api
```
**Note:** WebContainers only work in the browser, not server-side.

### Issue: "Cannot find module 'razorpay'"
**Solution:**
```bash
npm install razorpay
```

### Issue: "Cannot find module '@/lib/db'"
**Solution:** This is a path alias. Make sure your `tsconfig.json` has:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### Issue: Type errors with 'any'
**Solution:**
```bash
npm install -D @types/node
```

### Issue: Drizzle ORM errors
**Solution:** Make sure drizzle-orm is installed:
```bash
npm install drizzle-orm @vercel/postgres
npm install -D drizzle-kit
```

## Package Versions

Recommended versions:

```json
{
  "dependencies": {
    "openai": "^4.0.0",
    "@anthropic-ai/sdk": "^0.20.0",
    "@google/generative-ai": "^0.2.0",
    "razorpay": "^2.9.0",
    "socket.io": "^4.6.0",
    "socket.io-client": "^4.6.0",
    "@webcontainer/api": "^1.1.0",
    "drizzle-orm": "^0.34.0",
    "@vercel/postgres": "^0.10.0",
    "@vercel/kv": "^1.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "drizzle-kit": "^0.24.0"
  }
}
```

## Verification Checklist

- [ ] All npm packages installed
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] TypeScript compiles without errors
- [ ] Development server starts

## Next Steps

After installation:

1. Review the documentation in `docs/`
2. Check `docs/PROJECT_COMPLETE.md` for overview
3. Review phase-specific docs for detailed information
4. Start building!

## Support

If you encounter issues:
1. Check this installation guide
2. Review error messages carefully
3. Ensure all environment variables are set
4. Verify package versions
5. Check the phase-specific documentation

## Production Deployment

For production deployment to Vercel:

1. Set all environment variables in Vercel dashboard
2. Connect your GitHub repository
3. Deploy with `vercel --prod`
4. Configure custom domain
5. Enable monitoring

---

**Installation complete!** You're ready to use the Enterprise AI Development Platform.
