# Troubleshooting Guide

## Common TypeScript Errors

### 1. "Cannot find module" Errors

These errors occur when packages aren't installed. Run:

```bash
npm install openai @anthropic-ai/sdk @google/generative-ai razorpay socket.io socket.io-client @webcontainer/api
npm install -D @types/node drizzle-kit
```

### 2. "Parameter implicitly has 'any' type"

These are TypeScript strict mode warnings. They don't prevent the code from running but should be fixed for production.

**Quick Fix:** Add type annotations to the parameters.

**Example:**
```typescript
// Before
socket.on('event', (data) => { ... })

// After
socket.on('event', (data: any) => { ... })
```

### 3. "@/lib/db" Path Errors

Ensure your `tsconfig.json` has the correct path mapping:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### 4. WebContainer API Errors

**Important:** `@webcontainer/api` only works in the browser, not in Node.js/server-side code.

If you see errors in server-side code, you need to:
1. Only import WebContainer in client components
2. Use dynamic imports: `const { WebContainer } = await import('@webcontainer/api')`

### 5. Socket.io Type Errors

Install the types:
```bash
npm install -D @types/node
```

## Quick Fixes by File

### lib/execution/webcontainer.ts

This file should only be used client-side. Add this at the top:
```typescript
'use client';
```

Or use dynamic imports in server components.

### lib/realtime/socket-server.ts

Add type annotations:
```typescript
// Add at top
import type { Socket } from 'socket.io';

// Then use
private setupEventHandlers(): void {
  if (!this.io) return;

  this.io.on("connection", (socket: Socket) => {
    // ... rest of code
  });
}
```

### lib/rooms/room-manager.ts

The crypto import should work. If not, use:
```typescript
import { randomUUID } from 'node:crypto';
// or
import crypto from 'crypto';
```

## Expected Warnings vs Errors

### Warnings (Safe to Ignore for Now)
- "Parameter implicitly has 'any' type" - Code will run fine
- "Type 'unknown' is not assignable" - Runtime will work

### Errors (Must Fix)
- "Cannot find module" - Install the package
- "Cannot find name 'process'" - Install @types/node
- Path resolution errors - Fix tsconfig.json

## Installation Verification

Run this to check if all packages are installed:

```bash
npm list openai @anthropic-ai/sdk @google/generative-ai razorpay socket.io @webcontainer/api drizzle-orm @vercel/postgres @vercel/kv
```

## Build Test

Try building the project:

```bash
npm run build
```

If it builds successfully, the TypeScript errors are just IDE warnings and won't prevent deployment.

## Development Mode

Most TypeScript warnings won't prevent the dev server from running:

```bash
npm run dev
```

## Production Considerations

For production, you should fix all TypeScript errors. But for development and testing, the code will work with warnings.

## Priority Fixes

### High Priority (Prevents Build)
1. Install missing packages
2. Fix path aliases
3. Fix import errors

### Medium Priority (Type Safety)
1. Add type annotations
2. Fix 'any' types
3. Fix type mismatches

### Low Priority (Code Quality)
1. Improve type definitions
2. Add stricter types
3. Remove unused imports

## Quick Start (Ignore Warnings)

If you want to start quickly and fix warnings later:

1. Install all packages:
```bash
npm install openai @anthropic-ai/sdk @google/generative-ai razorpay socket.io socket.io-client @webcontainer/api
npm install -D @types/node
```

2. Run the dev server:
```bash
npm run dev
```

3. The app should work despite TypeScript warnings

4. Fix warnings gradually as you develop

## Getting Help

If you're stuck:

1. Check the error message carefully
2. Look for "Cannot find module" - install that package
3. Check environment variables are set
4. Verify database connection
5. Review the INSTALLATION.md guide

## Known Issues

### WebContainers
- Only works in browser
- Requires HTTPS in production
- Not available in Node.js

### Socket.io
- Requires server setup
- May need custom server for Next.js
- Check CORS configuration

### Razorpay
- Test mode vs production mode
- Webhook signature verification
- Indian payment methods only

## Summary

Most errors you're seeing are:
1. **Missing packages** - Run the install commands
2. **Type annotations** - Add types to parameters
3. **Path aliases** - Check tsconfig.json

The code is functionally complete and will work once packages are installed!
