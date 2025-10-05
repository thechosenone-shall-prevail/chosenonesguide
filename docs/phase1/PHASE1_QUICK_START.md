# Phase 1 Quick Start Guide

## Overview
This guide helps you quickly start using the Phase 1 features of the Enterprise AI Development Platform.

## 1. Agent Orchestration

### Initialize Agents for a Project

```typescript
import { getAgentCoordinator } from '@/lib/ai/agents/coordinator';

// Get the coordinator instance
const coordinator = getAgentCoordinator();

// Initialize a team of agents for your project
const team = await coordinator.initializeAgents('your-project-id');

console.log(`Initialized ${team.agents.length} agents`);
// Output: Initialized 10 agents
```

### Assign a Task to Agents

```typescript
import { getAgentCoordinator } from '@/lib/ai/agents/coordinator';
import type { DevelopmentTask } from '@/lib/ai/agents/types';

const coordinator = getAgentCoordinator();

// Define a task
const task: DevelopmentTask = {
  id: 'task-1',
  type: 'implement',
  description: 'Create a user authentication system',
  priority: 'high',
  assignedAgents: [],
  dependencies: [],
  status: 'pending',
};

// Assign the task
const assignment = await coordinator.assignTask(task);

console.log(`Task assigned to: ${assignment.primaryAgent.role}`);
console.log(`Using model: ${assignment.primaryAgent.model}`);
console.log(`Estimated time: ${assignment.estimatedTime} minutes`);
```

### Get Agent Status

```typescript
const agent = await coordinator.getAgentStatus('agent-id');

if (agent) {
  console.log(`Agent: ${agent.role}`);
  console.log(`Status: ${agent.status}`);
  console.log(`Model: ${agent.model}`);
  console.log(`Capabilities: ${agent.capabilities.join(', ')}`);
}
```

## 2. Multi-Model AI Providers

### Using OpenAI

```typescript
import { createProviderClient } from '@/lib/ai/providers';

const client = createProviderClient('openai', process.env.OPENAI_API_KEY!);

// Generate text
const response = await client.generateText({
  model: 'gpt-4',
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Explain quantum computing in simple terms.' },
  ],
  temperature: 0.7,
  maxTokens: 500,
});

console.log(response.text);
console.log(`Tokens used: ${response.usage.totalTokens}`);
```

### Using Anthropic (Claude)

```typescript
import { createProviderClient } from '@/lib/ai/providers';

const client = createProviderClient('anthropic', process.env.ANTHROPIC_API_KEY!);

const response = await client.generateText({
  model: 'claude-sonnet',
  messages: [
    { role: 'user', content: 'Write a Python function to calculate fibonacci numbers.' },
  ],
});

console.log(response.text);
```

### Using Google AI (Gemini)

```typescript
import { createProviderClient } from '@/lib/ai/providers';

const client = createProviderClient('google', process.env.GOOGLE_AI_API_KEY!);

const response = await client.generateText({
  model: 'gemini-pro',
  messages: [
    { role: 'user', content: 'What are the benefits of TypeScript?' },
  ],
});

console.log(response.text);
```

### Model Fallback Strategy

```typescript
import { getFallbackHandler } from '@/lib/ai/providers/fallback';

const fallbackHandler = getFallbackHandler({
  maxRetries: 3,
  retryDelay: 1000,
  fallbackModels: ['claude-sonnet', 'gemini-pro'],
});

const apiKeys = {
  openai: process.env.OPENAI_API_KEY!,
  anthropic: process.env.ANTHROPIC_API_KEY!,
  google: process.env.GOOGLE_AI_API_KEY!,
};

// Try GPT-4 first, fallback to Claude Sonnet, then Gemini Pro
const response = await fallbackHandler.generateWithFallback(
  {
    model: 'gpt-4',
    messages: [{ role: 'user', content: 'Hello!' }],
  },
  apiKeys
);

console.log(response.text);
```

### Get Model Information

```typescript
import { getModel, MODEL_CATALOG, calculateCost } from '@/lib/ai/providers';

// Get specific model
const gpt4 = getModel('gpt-4');
console.log(`${gpt4?.name}: $${gpt4?.pricing.inputCostPer1kTokens}/1k input tokens`);

// List all models
MODEL_CATALOG.forEach(model => {
  console.log(`${model.name} (${model.providerId})`);
  console.log(`  Context: ${model.contextWindow} tokens`);
  console.log(`  Streaming: ${model.supportsStreaming}`);
});

// Calculate cost
const cost = calculateCost('gpt-4', 1000, 500);
console.log(`Cost for 1000 input + 500 output tokens: $${cost.toFixed(4)}`);
```

## 3. Rate Limiting

### Check Rate Limit

```typescript
import { getRateLimiter } from '@/lib/rate-limit';

const limiter = getRateLimiter();

const result = await limiter.checkLimit({
  userId: 'user-123',
  tier: 'free',
  window: 3600, // 1 hour
  maxRequests: 10,
});

if (result.allowed) {
  console.log(`Request allowed. ${result.remaining} remaining.`);
} else {
  console.log(`Rate limit exceeded. Retry after ${result.retryAfter} seconds.`);
}
```

### Track Usage

```typescript
import { getRateLimiter } from '@/lib/rate-limit';

const limiter = getRateLimiter();

// Increment message count
await limiter.incrementUsage('user-123', 'messages', 'hourly');

// Get current usage
const usage = await limiter.getUsage('user-123', 'free', 'messages', 'hourly');

console.log(`Usage: ${usage.current}/${usage.limit} (${usage.percentage.toFixed(1)}%)`);
console.log(`Resets at: ${usage.resetAt}`);
```

### Check for Warnings

```typescript
import { getRateLimiter } from '@/lib/rate-limit';

const limiter = getRateLimiter();

const warning = await limiter.shouldWarn('user-123', 'free', 'messages', 'hourly');

if (warning.critical) {
  console.log(`⚠️ CRITICAL: ${warning.percentage.toFixed(1)}% of limit used`);
} else if (warning.warn) {
  console.log(`⚠️ WARNING: ${warning.percentage.toFixed(1)}% of limit used`);
}
```

### Track Concurrent Sessions

```typescript
import { getRateLimiter } from '@/lib/rate-limit';

const limiter = getRateLimiter();

// Add session
const count = await limiter.trackConcurrent('user-123', 'session-abc', 'add');
console.log(`Active sessions: ${count}`);

// Remove session
await limiter.trackConcurrent('user-123', 'session-abc', 'remove');
```

### Use in API Routes

```typescript
// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { rateLimitMiddleware } from '@/lib/rate-limit/middleware';
import { auth } from '@/app/(auth)/auth';

export async function POST(request: NextRequest) {
  // Get user session
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check rate limit
  const rateLimitError = await rateLimitMiddleware(
    request,
    session.user.id,
    'free', // Get from user's subscription
    { type: 'messages', period: 'hourly' }
  );

  if (rateLimitError) {
    return rateLimitError; // Returns 429 with error details
  }

  // Process request...
  return NextResponse.json({ success: true });
}
```

## 4. Database Operations

### Create a Project

```typescript
import { db } from '@/lib/db';
import { project } from '@/lib/db/schema';

const newProject = await db.insert(project).values({
  name: 'My AI App',
  description: 'An AI-powered application',
  creatorId: 'user-123',
  framework: 'nextjs',
  status: 'planning',
  visibility: 'private',
}).returning();

console.log('Project created:', newProject[0].id);
```

### Create Agent Instance

```typescript
import { db } from '@/lib/db';
import { agentInstance } from '@/lib/db/schema';

const agent = await db.insert(agentInstance).values({
  roomId: 'room-123',
  projectId: 'project-123',
  role: 'coder',
  modelId: 'claude-sonnet',
  status: 'idle',
}).returning();

console.log('Agent created:', agent[0].id);
```

### Track Usage

```typescript
import { db } from '@/lib/db';
import { usageLog } from '@/lib/db/schema';

await db.insert(usageLog).values({
  userId: 'user-123',
  chatId: 'chat-123',
  modelId: 'gpt-4',
  promptTokens: 100,
  completionTokens: 50,
  totalTokens: 150,
  cost: '0.0045',
});
```

## 5. Tier Limits Reference

```typescript
import { TIER_LIMITS } from '@/lib/rate-limit/types';

// Free tier
console.log('Free tier limits:', TIER_LIMITS.free);
// {
//   messagesPerDay: 50,
//   messagesPerHour: 10,
//   projectsPerMonth: 3,
//   concurrentRooms: 1,
//   storageGB: 0.1,
//   uploadsPerDay: 5
// }

// Pro tier
console.log('Pro tier limits:', TIER_LIMITS.pro);

// Team tier
console.log('Team tier limits:', TIER_LIMITS.team);

// Enterprise tier (unlimited)
console.log('Enterprise tier limits:', TIER_LIMITS.enterprise);
```

## 6. Agent Roles Reference

```typescript
import { AgentRole } from '@/lib/ai/agents/types';
import { AGENT_MODEL_MAP, getAgentCapabilities } from '@/lib/ai/agents/model-mapping';

// List all agent roles
Object.values(AgentRole).forEach(role => {
  const mapping = AGENT_MODEL_MAP[role];
  const capabilities = getAgentCapabilities(role);
  
  console.log(`${role}:`);
  console.log(`  Primary Model: ${mapping.primary}`);
  console.log(`  Fallback Model: ${mapping.fallback}`);
  console.log(`  Capabilities: ${capabilities.join(', ')}`);
});
```

## Environment Setup

Make sure you have these environment variables set:

```env
# AI Provider API Keys
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_AI_API_KEY=...

# Vercel KV (Redis)
KV_URL=...
KV_REST_API_URL=...
KV_REST_API_TOKEN=...
KV_REST_API_READ_ONLY_TOKEN=...

# Database
POSTGRES_URL=...
```

## Common Patterns

### Complete AI Request Flow

```typescript
import { getAgentCoordinator } from '@/lib/ai/agents/coordinator';
import { createProviderClient } from '@/lib/ai/providers';
import { getRateLimiter } from '@/lib/rate-limit';

async function processAIRequest(userId: string, userTier: string, prompt: string) {
  // 1. Check rate limit
  const limiter = getRateLimiter();
  const rateLimit = await limiter.checkLimit({
    userId,
    tier: userTier as any,
    window: 3600,
    maxRequests: 10,
  });

  if (!rateLimit.allowed) {
    throw new Error('Rate limit exceeded');
  }

  // 2. Initialize agents
  const coordinator = getAgentCoordinator();
  const team = await coordinator.initializeAgents('project-id');

  // 3. Assign task
  const task = {
    id: 'task-1',
    type: 'implement' as const,
    description: prompt,
    priority: 'medium' as const,
    assignedAgents: [],
    dependencies: [],
    status: 'pending' as const,
  };

  const assignment = await coordinator.assignTask(task);

  // 4. Generate response with assigned model
  const client = createProviderClient(
    assignment.primaryAgent.model.includes('gpt') ? 'openai' : 'anthropic',
    process.env.OPENAI_API_KEY! // or ANTHROPIC_API_KEY
  );

  const response = await client.generateText({
    model: assignment.primaryAgent.model,
    messages: [{ role: 'user', content: prompt }],
  });

  // 5. Track usage
  await limiter.incrementUsage(userId, 'messages', 'hourly');

  return {
    text: response.text,
    agent: assignment.primaryAgent.role,
    model: assignment.primaryAgent.model,
    tokensUsed: response.usage.totalTokens,
  };
}
```

## Next Steps

- Proceed to Phase 2 for billing integration
- Implement code generation in Phase 3
- Set up collaborative rooms in Phase 4
- Add premium themes in Phase 5

## Support

For issues or questions, refer to:
- `PHASE1_COMPLETION.md` - Full implementation details
- `.kiro/specs/enterprise-ai-chat-platform/design.md` - Architecture design
- `.kiro/specs/enterprise-ai-chat-platform/requirements.md` - Requirements
