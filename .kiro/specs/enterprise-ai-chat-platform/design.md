# Enterprise AI Development Platform - Design Document

## Overview

This design document outlines the architecture and implementation strategy for building an enterprise-grade AI-powered development platform where specialized AI agents collaborate with teams to build actual applications. This is a hybrid platform combining chat communication, multi-agent orchestration, real-time collaborative coding, and code execution/deployment capabilities.

### Current State Analysis

**Existing Infrastructure:**
- Next.js 15 with App Router
- Vercel Postgres (Drizzle ORM)
- Redis support (resumable streams)
- NextAuth authentication
- AI SDK with custom provider (`myProvider`)
- Basic chat functionality with streaming
- Document artifacts (text, code, image, sheet)
- File upload support
- Basic user/chat/message schema

**What Needs to Be Built:**
- Multi-agent AI orchestration system
- Code generation & execution engine
- Collaborative coding rooms with real-time sync
- Integrated code editor (Monaco/CodeMirror)
- Terminal & preview system
- Deployment pipeline
- Enhanced rate limiting with Redis
- Subscription/billing system (Razorpay)
- Vibe theme system enhancements
- Development analytics dashboard
- Premium UX features
- Mobile optimizations

---

## Architecture

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer (Next.js)                   │
├─────────────────────────────────────────────────────────────┤
│  • React Components (UI)                                     │
│  • Framer Motion (Animations)                                │
│  • Radix UI (Components)                                     │
│  • Tailwind CSS v4 (Styling)                                 │
│  • Socket.io Client (Real-time)                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   API Layer (Next.js Routes)                 │
├─────────────────────────────────────────────────────────────┤
│  • /api/chat - Chat streaming                                │
│  • /api/models - Model management                            │
│  • /api/rooms - Room operations                              │
│  • /api/billing - Subscription management                    │
│  • /api/analytics - Usage tracking                           │
│  • /api/rate-limit - Rate limit checks                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                             │
├─────────────────────────────────────────────────────────────┤
│  • AI Provider Manager (Multi-model routing)                 │
│  • Rate Limiter (Redis-based)                                │
│  • Billing Service (Stripe)                                  │
│  • Analytics Service (Usage tracking)                        │
│  • Room Manager (Real-time coordination)                     │
│  • Theme Manager (Vibe system)                               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer                                │
├─────────────────────────────────────────────────────────────┤
│  • Vercel Postgres (Primary DB)                              │
│  • Vercel KV/Redis (Cache, Rate Limits, Sessions)           │
│  • Vercel Blob (File Storage)                                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  External Services                           │
├─────────────────────────────────────────────────────────────┤
│  • OpenAI API (GPT models)                                   │
│  • Anthropic API (Claude models)                             │
│  • Google AI API (Gemini models)                             │
│  • Razorpay API (Payments - UPI, Cards, Netbanking)         │
│  • Socket.io Server (Real-time)                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Components and Interfaces

### 1. Multi-Agent Orchestration System

#### Agent Coordinator

**Purpose:** Orchestrate multiple specialized AI agents to work together on development tasks.

**Interface:**
```typescript
interface AgentCoordinator {
  initializeAgents: (projectId: string) => Promise<AgentTeam>;
  assignTask: (task: DevelopmentTask) => Promise<AgentAssignment>;
  coordinateAgents: (agents: Agent[], task: DevelopmentTask) => Promise<void>;
  handleAgentConflict: (conflict: AgentConflict) => Promise<Resolution>;
  getAgentStatus: (agentId: string) => Promise<AgentStatus>;
}

interface Agent {
  id: string;
  role: AgentRole;
  model: AIModel;
  status: 'idle' | 'thinking' | 'coding' | 'reviewing' | 'blocked';
  currentTask?: DevelopmentTask;
  capabilities: string[];
}

enum AgentRole {
  ARCHITECT = 'architect',
  CODER = 'coder',
  FRONTEND = 'frontend',
  BACKEND = 'backend',
  DEBUGGER = 'debugger',
  REVIEWER = 'reviewer',
  DEVOPS = 'devops',
  TESTER = 'tester',
  DOCUMENTATION = 'documentation',
  OPTIMIZER = 'optimizer',
}

interface DevelopmentTask {
  id: string;
  type: 'design' | 'implement' | 'debug' | 'review' | 'deploy' | 'optimize';
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedAgents: string[];
  dependencies: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
}

interface AgentAssignment {
  taskId: string;
  primaryAgent: Agent;
  supportingAgents: Agent[];
  estimatedTime: number;
  reasoning: string;
}
```

**Agent-Model Mapping:**
```typescript
const AGENT_MODEL_MAP = {
  architect: 'gpt-4' | 'claude-opus',      // High-level design
  coder: 'claude-sonnet' | 'gpt-4',        // Code implementation
  frontend: 'claude-sonnet',                // UI/UX implementation
  backend: 'gpt-4',                         // API/Database
  debugger: 'gpt-4',                        // Error analysis
  reviewer: 'gpt-4',                        // Code review
  devops: 'gpt-4',                          // Infrastructure
  tester: 'claude-sonnet',                  // Test generation
  documentation: 'gpt-4',                   // Documentation
  optimizer: 'claude-sonnet',               // Performance
};
```

**Implementation Strategy:**
- Create agent coordinator service
- Implement task routing algorithm
- Add agent communication protocol
- Build conflict resolution system
- Track agent performance metrics
- Implement agent handoff logic

### 2. Multi-Model AI System

#### AI Provider Manager

**Purpose:** Abstract layer for managing multiple AI providers and models for different agents.

**Interface:**
```typescript
interface AIProvider {
  id: string;
  name: string;
  models: AIModel[];
  createClient: (apiKey: string) => ProviderClient;
}

interface AIModel {
  id: string;
  providerId: string;
  name: string;
  description: string;
  capabilities: ModelCapability[];
  pricing: ModelPricing;
  contextWindow: number;
  maxOutputTokens: number;
  supportsStreaming: boolean;
  supportsVision: boolean;
  supportsFunctionCalling: boolean;
}

interface ModelCapability {
  type: 'text' | 'vision' | 'function-calling' | 'reasoning';
  enabled: boolean;
}

interface ModelPricing {
  inputCostPer1kTokens: number;
  outputCostPer1kTokens: number;
  currency: 'INR' | 'USD';
}

interface ProviderClient {
  streamText: (params: StreamTextParams) => Promise<StreamResponse>;
  generateText: (params: GenerateTextParams) => Promise<TextResponse>;
}
```

**Implementation Strategy:**
- Create unified provider interface
- Implement adapters for OpenAI, Anthropic, Google AI
- Add model fallback logic (if primary fails, try secondary)
- Track usage per model for billing
- Cache model metadata in Redis

**File Structure:**
```
lib/ai/
├── providers/
│   ├── index.ts              # Provider registry
│   ├── openai.ts             # OpenAI adapter
│   ├── anthropic.ts          # Anthropic adapter
│   ├── google.ts             # Google AI adapter
│   └── types.ts              # Shared types
├── models.ts                 # Model catalog (enhanced)
├── model-selector.ts         # Model selection logic
└── fallback.ts               # Fallback strategy
```

### 3. Code Generation & Execution Engine

#### Code Generator

**Purpose:** Generate actual working code based on user requirements and agent collaboration.

**Interface:**
```typescript
interface CodeGenerator {
  generateProject: (spec: ProjectSpec) => Promise<GeneratedProject>;
  generateFile: (fileSpec: FileSpec) => Promise<GeneratedFile>;
  modifyCode: (file: string, changes: CodeChange[]) => Promise<string>;
  refactorCode: (code: string, instructions: string) => Promise<string>;
  fixErrors: (code: string, errors: Error[]) => Promise<string>;
}

interface ProjectSpec {
  name: string;
  description: string;
  framework: 'nextjs' | 'react' | 'vue' | 'express' | 'fastapi' | 'django';
  features: string[];
  database?: 'postgres' | 'mysql' | 'mongodb' | 'sqlite';
  styling?: 'tailwind' | 'css' | 'styled-components';
}

interface GeneratedProject {
  files: GeneratedFile[];
  structure: FileTree;
  dependencies: Record<string, string>;
  scripts: Record<string, string>;
  envVars: string[];
}

interface GeneratedFile {
  path: string;
  content: string;
  language: string;
  description: string;
}
```

#### Code Executor

**Purpose:** Execute code in sandboxed environments with proper isolation.

**Interface:**
```typescript
interface CodeExecutor {
  createSandbox: (projectId: string) => Promise<Sandbox>;
  executeCode: (sandbox: Sandbox, command: string) => Promise<ExecutionResult>;
  installDependencies: (sandbox: Sandbox, deps: string[]) => Promise<void>;
  runTests: (sandbox: Sandbox) => Promise<TestResult>;
  buildProject: (sandbox: Sandbox) => Promise<BuildResult>;
}

interface Sandbox {
  id: string;
  projectId: string;
  runtime: 'node' | 'python' | 'go' | 'rust';
  status: 'initializing' | 'ready' | 'running' | 'stopped';
  port?: number;
  url?: string;
}

interface ExecutionResult {
  success: boolean;
  output: string;
  errors?: string;
  exitCode: number;
  duration: number;
}
```

**Implementation Strategy:**
- Use WebContainers for Node.js execution
- Use Pyodide for Python execution
- Implement file system abstraction
- Add dependency installation
- Create preview server
- Implement hot reload

### 4. Rate Limiting System

#### Redis-Based Rate Limiter

**Purpose:** Enforce tier-based rate limits using Redis for distributed counting.

**Interface:**
```typescript
interface RateLimitConfig {
  userId: string;
  tier: SubscriptionTier;
  window: number; // seconds
  maxRequests: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfter?: number;
}

interface RateLimiter {
  checkLimit: (config: RateLimitConfig) => Promise<RateLimitResult>;
  incrementUsage: (userId: string) => Promise<void>;
  resetUsage: (userId: string) => Promise<void>;
  getUsage: (userId: string) => Promise<UsageStats>;
}
```

**Implementation Strategy:**
- Use Redis sliding window algorithm
- Store counters: `ratelimit:{userId}:messages:daily`
- Track concurrent chats: `ratelimit:{userId}:concurrent`
- Implement warning thresholds (80%, 90%)
- Add admin override capability

**Redis Keys:**
```
ratelimit:{userId}:messages:daily     # Daily message count
ratelimit:{userId}:messages:hourly    # Hourly message count
ratelimit:{userId}:concurrent         # Active chat sessions
ratelimit:{userId}:uploads:daily      # File upload count
ratelimit:{userId}:tier               # Cached tier info
```

### 3. Subscription & Billing System

#### Database Schema Extensions

```typescript
// New tables to add to schema.ts

export const subscription = pgTable("Subscription", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  userId: uuid("userId").notNull().references(() => user.id),
  tier: varchar("tier", { 
    enum: ["free", "pro", "team", "enterprise"] 
  }).notNull().default("free"),
  status: varchar("status", {
    enum: ["active", "canceled", "past_due", "trialing"]
  }).notNull(),
  razorpayCustomerId: varchar("razorpayCustomerId", { length: 255 }),
  razorpaySubscriptionId: varchar("razorpaySubscriptionId", { length: 255 }),
  razorpayPlanId: varchar("razorpayPlanId", { length: 255 }),
  currentPeriodStart: timestamp("currentPeriodStart"),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  cancelAtPeriodEnd: boolean("cancelAtPeriodEnd").default(false),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const usageLog = pgTable("UsageLog", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  userId: uuid("userId").notNull().references(() => user.id),
  chatId: uuid("chatId").references(() => chat.id),
  modelId: varchar("modelId", { length: 100 }).notNull(),
  promptTokens: integer("promptTokens").notNull(),
  completionTokens: integer("completionTokens").notNull(),
  totalTokens: integer("totalTokens").notNull(),
  cost: decimal("cost", { precision: 10, scale: 6 }),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export const team = pgTable("Team", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  ownerId: uuid("ownerId").notNull().references(() => user.id),
  subscriptionId: uuid("subscriptionId").references(() => subscription.id),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const teamMember = pgTable("TeamMember", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  teamId: uuid("teamId").notNull().references(() => team.id),
  userId: uuid("userId").notNull().references(() => user.id),
  role: varchar("role", { enum: ["owner", "admin", "member"] }).notNull(),
  joinedAt: timestamp("joinedAt").notNull().defaultNow(),
});

export const project = pgTable("Project", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  creatorId: uuid("creatorId").notNull().references(() => user.id),
  teamId: uuid("teamId").references(() => team.id),
  framework: varchar("framework", { length: 50 }),
  status: varchar("status", {
    enum: ["planning", "in_progress", "completed", "deployed", "archived"]
  }).notNull().default("planning"),
  visibility: varchar("visibility", {
    enum: ["public", "private", "team"]
  }).notNull().default("private"),
  fileTree: jsonb("fileTree"),
  deploymentUrl: text("deploymentUrl"),
  repositoryUrl: text("repositoryUrl"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const projectFile = pgTable("ProjectFile", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  projectId: uuid("projectId").notNull().references(() => project.id),
  path: text("path").notNull(),
  content: text("content"),
  language: varchar("language", { length: 50 }),
  size: integer("size"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const room = pgTable("Room", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  projectId: uuid("projectId").references(() => project.id),
  creatorId: uuid("creatorId").notNull().references(() => user.id),
  teamId: uuid("teamId").references(() => team.id),
  visibility: varchar("visibility", {
    enum: ["public", "private", "team"]
  }).notNull().default("private"),
  maxParticipants: integer("maxParticipants").notNull().default(10),
  currentTheme: varchar("currentTheme", { length: 100 }),
  password: varchar("password", { length: 255 }), // hashed
  isLocked: boolean("isLocked").default(false),
  isArchived: boolean("isArchived").default(false),
  sandboxId: varchar("sandboxId", { length: 255 }),
  lastActivityAt: timestamp("lastActivityAt").notNull().defaultNow(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export const agentInstance = pgTable("AgentInstance", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  roomId: uuid("roomId").notNull().references(() => room.id),
  projectId: uuid("projectId").notNull().references(() => project.id),
  role: varchar("role", {
    enum: ["architect", "coder", "frontend", "backend", "debugger", "reviewer", "devops", "tester", "documentation", "optimizer"]
  }).notNull(),
  modelId: varchar("modelId", { length: 100 }).notNull(),
  status: varchar("status", {
    enum: ["idle", "thinking", "coding", "reviewing", "blocked"]
  }).notNull().default("idle"),
  currentTask: text("currentTask"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export const agentTask = pgTable("AgentTask", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  projectId: uuid("projectId").notNull().references(() => project.id),
  agentId: uuid("agentId").references(() => agentInstance.id),
  type: varchar("type", {
    enum: ["design", "implement", "debug", "review", "deploy", "optimize"]
  }).notNull(),
  description: text("description").notNull(),
  priority: varchar("priority", {
    enum: ["low", "medium", "high", "critical"]
  }).notNull().default("medium"),
  status: varchar("status", {
    enum: ["pending", "in_progress", "completed", "blocked"]
  }).notNull().default("pending"),
  result: text("result"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  completedAt: timestamp("completedAt"),
});

export const deployment = pgTable("Deployment", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  projectId: uuid("projectId").notNull().references(() => project.id),
  platform: varchar("platform", {
    enum: ["vercel", "netlify", "railway", "render"]
  }).notNull(),
  url: text("url"),
  status: varchar("status", {
    enum: ["pending", "building", "deployed", "failed"]
  }).notNull().default("pending"),
  buildLog: text("buildLog"),
  deployedBy: uuid("deployedBy").notNull().references(() => user.id),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export const roomParticipant = pgTable("RoomParticipant", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  roomId: uuid("roomId").notNull().references(() => room.id),
  userId: uuid("userId").notNull().references(() => user.id),
  role: varchar("role", { enum: ["host", "moderator", "participant"] }).notNull(),
  joinedAt: timestamp("joinedAt").notNull().defaultNow(),
  leftAt: timestamp("leftAt"),
  isActive: boolean("isActive").default(true),
});

export const theme = pgTable("Theme", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  userId: uuid("userId").references(() => user.id), // null for system themes
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  isSystem: boolean("isSystem").default(false),
  isPremium: boolean("isPremium").default(false),
  config: jsonb("config").notNull(), // Theme configuration
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export const analyticsEvent = pgTable("AnalyticsEvent", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  userId: uuid("userId").notNull().references(() => user.id),
  eventType: varchar("eventType", { length: 100 }).notNull(),
  eventData: jsonb("eventData"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});
```

#### Billing Service Interface

```typescript
interface BillingService {
  createSubscription: (params: SubscriptionParams) => Promise<RazorpaySubscription>;
  createPaymentLink: (params: PaymentLinkParams) => Promise<PaymentLink>;
  handleWebhook: (event: RazorpayEvent) => Promise<void>;
  getSubscription: (userId: string) => Promise<Subscription | null>;
  cancelSubscription: (subscriptionId: string) => Promise<void>;
  updateSubscription: (params: UpdateParams) => Promise<Subscription>;
  verifyPayment: (params: VerifyParams) => boolean;
}

interface SubscriptionParams {
  userId: string;
  planId: string;
  totalCount: number; // billing cycles
  customerNotify: boolean;
}

interface PaymentLinkParams {
  amount: number;
  currency: 'INR' | 'USD';
  description: string;
  customerId: string;
  callbackUrl: string;
}

interface VerifyParams {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}
```

### 6. Collaborative Coding Room System

#### Real-Time Coding Room Manager

**Purpose:** Manage collaborative coding rooms with real-time code synchronization, AI agents, and execution.

**Interface:**
```typescript
interface CodingRoomManager {
  createRoom: (params: CreateRoomParams) => Promise<CodingRoom>;
  joinRoom: (roomId: string, userId: string) => Promise<RoomSession>;
  leaveRoom: (roomId: string, userId: string) => Promise<void>;
  syncCode: (roomId: string, changes: CodeChange[]) => Promise<void>;
  broadcastMessage: (roomId: string, message: RoomMessage) => Promise<void>;
  syncTheme: (roomId: string, themeId: string) => Promise<void>;
  assignAgent: (roomId: string, agentRole: AgentRole) => Promise<void>;
  executeCode: (roomId: string, command: string) => Promise<ExecutionResult>;
  deployProject: (roomId: string, platform: DeploymentPlatform) => Promise<Deployment>;
}

interface CodingRoom extends Room {
  projectId: string;
  fileTree: FileTree;
  activeFile: string;
  sandbox: Sandbox;
  agents: Agent[];
  terminal: TerminalSession;
  preview: PreviewSession;
}

interface CodeChange {
  fileId: string;
  userId: string;
  changes: TextChange[];
  timestamp: number;
}

interface TextChange {
  range: Range;
  text: string;
  rangeLength: number;
}

interface RoomMessage {
  id: string;
  roomId: string;
  userId: string;
  agentId?: string;
  content: string;
  type: 'chat' | 'system' | 'ai-response' | 'agent-communication' | 'code-suggestion';
  createdAt: Date;
}

interface RoomSession {
  roomId: string;
  userId: string;
  socketId: string;
  joinedAt: Date;
  role: 'host' | 'moderator' | 'participant';
  cursor?: CursorPosition;
}
```

**Implementation Strategy:**
- Use Socket.io for real-time communication
- Implement Operational Transformation (OT) or CRDT for code sync
- Store active sessions in Redis: `room:{roomId}:participants`
- Store file state in Redis: `room:{roomId}:files:{fileId}`
- Implement presence detection (heartbeat)
- Auto-archive inactive rooms (24h cron job)
- Sync theme changes via WebSocket events
- Broadcast agent actions to all participants

**Socket.io Events:**
```typescript
// Client → Server
'room:join'
'room:leave'
'room:message'
'room:code-change'
'room:file-create'
'room:file-delete'
'room:file-rename'
'room:theme-change'
'room:cursor-move'
'room:execute-code'
'room:assign-agent'
'room:deploy'

// Server → Client
'room:participant-joined'
'room:participant-left'
'room:message-received'
'room:code-synced'
'room:file-tree-updated'
'room:theme-synced'
'room:cursor-updated'
'room:execution-result'
'room:agent-assigned'
'room:agent-status-changed'
'room:deployment-status'
```

### 5. Vibe Theme System

#### Theme Configuration

```typescript
interface ThemeConfig {
  id: string;
  name: string;
  description: string;
  isPremium: boolean;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    foreground: string;
    accent: string;
    muted: string;
  };
  gradients: {
    hero: string;
    card: string;
    button: string;
  };
  particles: {
    enabled: boolean;
    density: number;
    color: string;
    speed: number;
  };
  soundscape: {
    enabled: boolean;
    url: string;
    volume: number;
  };
  animations: {
    enabled: boolean;
    intensity: 'low' | 'medium' | 'high';
  };
}

interface ThemeManager {
  getTheme: (themeId: string) => Promise<ThemeConfig>;
  getUserThemes: (userId: string) => Promise<ThemeConfig[]>;
  createCustomTheme: (userId: string, config: ThemeConfig) => Promise<ThemeConfig>;
  applyTheme: (themeId: string) => void;
  preloadAssets: (themeId: string) => Promise<void>;
}
```

**System Themes:**
1. Midnight Hacker Den
2. Sunset Beach Studio
3. Cyberpunk Rush
4. Forest Sanctuary
5. Coffee Shop Co-work
6. Space Station Lab
7. Tokyo Night
8. Nordic Minimal
9. Corporate Professional
10. Deep Focus
11. Creative Studio
12. Night Owl

### 6. Analytics System

#### Analytics Service

```typescript
interface AnalyticsService {
  trackEvent: (event: AnalyticsEvent) => Promise<void>;
  getUserStats: (userId: string, period: TimePeriod) => Promise<UserStats>;
  getTeamStats: (teamId: string, period: TimePeriod) => Promise<TeamStats>;
  exportData: (userId: string, format: 'csv' | 'json') => Promise<Blob>;
}

interface UserStats {
  messageCount: number;
  tokenUsage: TokenUsage;
  modelDistribution: Record<string, number>;
  peakUsageTimes: TimeDistribution[];
  averageResponseTime: number;
  conversationLengths: number[];
  productivityScore: number;
}

interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number;
}
```

---

## Data Models

### Enhanced User Model

```typescript
// Extend existing user table
export const userProfile = pgTable("UserProfile", {
  userId: uuid("userId").primaryKey().references(() => user.id),
  displayName: varchar("displayName", { length: 100 }),
  avatar: text("avatar"),
  bio: text("bio"),
  preferences: jsonb("preferences").$type<UserPreferences>(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

interface UserPreferences {
  defaultModel: string;
  defaultTheme: string;
  soundEnabled: boolean;
  particlesEnabled: boolean;
  reducedMotion: boolean;
  notificationsEnabled: boolean;
  language: string;
}
```

### Enhanced Chat Model

```typescript
// Extend existing chat table with new fields
ALTER TABLE "Chat" ADD COLUMN "modelId" VARCHAR(100);
ALTER TABLE "Chat" ADD COLUMN "roomId" UUID REFERENCES "Room"("id");
ALTER TABLE "Chat" ADD COLUMN "themeId" UUID REFERENCES "Theme"("id");
ALTER TABLE "Chat" ADD COLUMN "tokenUsage" JSONB;
```

---

## Error Handling

### Error Types

```typescript
enum ErrorCode {
  // Rate Limiting
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  CONCURRENT_LIMIT_EXCEEDED = 'concurrent_limit_exceeded',
  
  // Billing
  PAYMENT_REQUIRED = 'payment_required',
  SUBSCRIPTION_EXPIRED = 'subscription_expired',
  INSUFFICIENT_CREDITS = 'insufficient_credits',
  
  // Rooms
  ROOM_FULL = 'room_full',
  ROOM_LOCKED = 'room_locked',
  ROOM_NOT_FOUND = 'room_not_found',
  UNAUTHORIZED_ROOM_ACCESS = 'unauthorized_room_access',
  
  // AI
  MODEL_NOT_AVAILABLE = 'model_not_available',
  MODEL_FALLBACK_FAILED = 'model_fallback_failed',
  PROVIDER_ERROR = 'provider_error',
  
  // General
  UNAUTHORIZED = 'unauthorized',
  FORBIDDEN = 'forbidden',
  NOT_FOUND = 'not_found',
  INTERNAL_ERROR = 'internal_error',
}

class AppError extends Error {
  constructor(
    public code: ErrorCode,
    public message: string,
    public statusCode: number,
    public metadata?: Record<string, any>
  ) {
    super(message);
  }

  toResponse(): Response {
    return Response.json(
      {
        error: {
          code: this.code,
          message: this.message,
          ...this.metadata,
        },
      },
      { status: this.statusCode }
    );
  }
}
```

### Error Recovery Strategies

1. **Model Fallback:** If primary model fails, automatically try secondary model
2. **Rate Limit Grace:** Allow 5% overage before hard blocking
3. **Payment Retry:** Retry failed payments 3 times over 7 days
4. **Room Reconnection:** Auto-reconnect to rooms on network issues
5. **Offline Queue:** Queue messages when offline, send when online

---

## Testing Strategy

### Unit Tests

**Coverage Areas:**
- Rate limiter logic
- Model selection algorithm
- Billing calculations
- Theme configuration validation
- Analytics aggregation

**Tools:**
- Jest for unit tests
- React Testing Library for components

### Integration Tests

**Coverage Areas:**
- API endpoints
- Database operations
- Stripe webhook handling
- Socket.io events
- Redis operations

**Tools:**
- Playwright for E2E tests
- Supertest for API testing

### Performance Tests

**Metrics:**
- API response time < 500ms (p95)
- WebSocket latency < 100ms
- Page load time < 2s
- Concurrent users: 10,000

**Tools:**
- k6 for load testing
- Lighthouse for performance audits

---

## Security Considerations

### Authentication & Authorization

1. **NextAuth Configuration:**
   - Email/password authentication
   - OAuth providers (Google, GitHub)
   - Session management with JWT
   - CSRF protection

2. **Role-Based Access Control (RBAC):**
   ```typescript
   enum Role {
     USER = 'user',
     TEAM_MEMBER = 'team_member',
     TEAM_ADMIN = 'team_admin',
     TEAM_OWNER = 'team_owner',
     PLATFORM_ADMIN = 'platform_admin',
   }
   
   interface Permission {
     resource: string;
     action: 'create' | 'read' | 'update' | 'delete';
     condition?: (context: Context) => boolean;
   }
   ```

3. **API Key Management:**
   - Encrypted storage of provider API keys
   - Key rotation policy
   - Audit logging for key usage

### Data Protection

1. **Encryption:**
   - TLS 1.3 for data in transit
   - AES-256 for sensitive data at rest
   - Encrypted backups

2. **Privacy:**
   - GDPR compliance (data export, deletion)
   - Private mode (no logging)
   - Data retention policies

3. **Input Validation:**
   - Zod schemas for all API inputs
   - SQL injection prevention (Drizzle ORM)
   - XSS protection (React escaping)

### Rate Limiting & DDoS Protection

1. **Multi-Layer Rate Limiting:**
   - IP-based rate limiting (Vercel)
   - User-based rate limiting (Redis)
   - API key rate limiting

2. **Abuse Detection:**
   - Anomaly detection for unusual patterns
   - Automatic throttling
   - Admin alerts

---

## Deployment Strategy

### Environment Configuration

```env
# Database
POSTGRES_URL=
POSTGRES_PRISMA_URL=
POSTGRES_URL_NON_POOLING=

# Redis
REDIS_URL=

# AI Providers
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_AI_API_KEY=

# Billing
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

# Storage
BLOB_READ_WRITE_TOKEN=

# Auth
AUTH_SECRET=
AUTH_URL=

# Feature Flags
ENABLE_ROOMS=true
ENABLE_VOICE=false
ENABLE_ANALYTICS=true
```

### Vercel Deployment

1. **Build Configuration:**
   ```json
   {
     "buildCommand": "pnpm build",
     "outputDirectory": ".next",
     "installCommand": "pnpm install",
     "framework": "nextjs"
   }
   ```

2. **Environment Variables:**
   - Production secrets in Vercel dashboard
   - Preview deployments use test keys
   - Development uses `.env.local`

3. **Database Migrations:**
   - Run migrations in build step
   - Use Drizzle Kit for schema management
   - Backup before migrations

### Monitoring & Observability

1. **Logging:**
   - Structured logging with Winston
   - Error tracking with Sentry
   - Performance monitoring with Vercel Analytics

2. **Metrics:**
   - API response times
   - Error rates
   - Token usage
   - Active users
   - Revenue metrics

3. **Alerts:**
   - High error rate (> 1%)
   - Slow response time (> 2s)
   - Failed payments
   - Rate limit violations

---

## Performance Optimization

### Frontend Optimization

1. **Code Splitting:**
   - Route-based splitting (Next.js automatic)
   - Component lazy loading
   - Dynamic imports for heavy features

2. **Asset Optimization:**
   - Image optimization (Next.js Image)
   - Font subsetting (Geist)
   - CSS purging (Tailwind)

3. **Caching:**
   - Static page caching
   - API response caching
   - CDN for static assets

### Backend Optimization

1. **Database:**
   - Connection pooling
   - Query optimization
   - Indexes on frequently queried fields
   - Read replicas for analytics

2. **Redis Caching:**
   - Cache user subscriptions
   - Cache model metadata
   - Cache theme configurations
   - Session storage

3. **API Optimization:**
   - Response compression
   - Streaming responses
   - Batch operations
   - Background jobs for heavy tasks

---

## Migration Plan

### Phase 1: Foundation (Weeks 1-4)

1. **Database Schema:**
   - Add new tables (project, projectFile, agentInstance, agentTask, deployment, etc.)
   - Run migrations
   - Seed system themes

2. **Multi-Agent System:**
   - Implement agent coordinator
   - Create agent-model mapping
   - Build task routing algorithm
   - Add agent communication protocol

3. **Multi-Model System:**
   - Implement provider adapters
   - Create model catalog
   - Add model selector for agents

4. **Rate Limiting:**
   - Implement Redis rate limiter
   - Add middleware
   - Create admin dashboard

### Phase 2: Billing & Subscriptions (Weeks 5-8)

1. **Razorpay Integration:**
   - Set up plans and pricing
   - Implement subscription flow
   - Add UPI, card, and netbanking support
   - Handle webhooks

2. **Subscription Management:**
   - User subscription dashboard
   - Upgrade/downgrade flows
   - Usage tracking
   - Invoice generation with GST

### Phase 3: Code Generation & Execution (Weeks 9-12)

1. **Code Generator:**
   - Implement project generation
   - Add file generation
   - Build code modification engine
   - Create refactoring system

2. **Code Executor:**
   - Integrate WebContainers
   - Add Pyodide for Python
   - Implement sandbox management
   - Build preview server

3. **Deployment Pipeline:**
   - Vercel integration
   - Netlify integration
   - Railway integration
   - Build log streaming

### Phase 4: Collaborative Coding Rooms (Weeks 13-16)

1. **Coding Room System:**
   - Create room management API
   - Implement Socket.io server
   - Build code synchronization (OT/CRDT)
   - Add file tree management

2. **Real-Time Features:**
   - Participant presence
   - Code sync
   - Cursor tracking
   - Message broadcasting
   - Theme synchronization
   - Agent status updates

3. **Integrated Editor:**
   - Monaco Editor integration
   - Syntax highlighting
   - IntelliSense
   - Multi-cursor support
   - Terminal integration

### Phase 5: Premium Features (Weeks 17-20)

1. **Enhanced Themes:**
   - Implement 12 system themes
   - Custom theme creator
   - Theme marketplace

2. **Development Analytics:**
   - Project tracking
   - Agent performance metrics
   - Code quality metrics
   - Dashboard UI
   - Export functionality

3. **Premium UX:**
   - Command palette
   - Keyboard shortcuts
   - Polished animations
   - Agent visualization

### Phase 6: Polish & Launch (Weeks 21-24)

1. **Testing:**
   - E2E tests
   - Load testing
   - Security audit

2. **Documentation:**
   - API documentation
   - User guides
   - Admin documentation

3. **Launch:**
   - Beta testing
   - Marketing site
   - Public launch

---

## API Endpoints

### New Endpoints to Implement

```
# Projects
POST   /api/projects                  # Create project
GET    /api/projects                  # List user projects
GET    /api/projects/:id              # Get project details
PUT    /api/projects/:id              # Update project
DELETE /api/projects/:id              # Delete project
POST   /api/projects/:id/files        # Create file
PUT    /api/projects/:id/files/:path  # Update file
DELETE /api/projects/:id/files/:path  # Delete file
POST   /api/projects/:id/generate     # Generate code
POST   /api/projects/:id/deploy       # Deploy project

# AI Agents
POST   /api/agents                    # Initialize agents for project
GET    /api/agents/:id                # Get agent status
POST   /api/agents/:id/assign         # Assign task to agent
POST   /api/agents/coordinate         # Coordinate multiple agents
GET    /api/agents/:id/history        # Get agent task history

# Code Execution
POST   /api/sandbox/create            # Create sandbox
POST   /api/sandbox/:id/execute       # Execute code
POST   /api/sandbox/:id/install       # Install dependencies
POST   /api/sandbox/:id/build         # Build project
DELETE /api/sandbox/:id               # Destroy sandbox

# Coding Rooms
POST   /api/rooms                     # Create coding room
GET    /api/rooms/:id                 # Get room details
PUT    /api/rooms/:id                 # Update room
DELETE /api/rooms/:id                 # Delete room
POST   /api/rooms/:id/join            # Join room
POST   /api/rooms/:id/leave           # Leave room
POST   /api/rooms/:id/agents          # Assign agent to room
POST   /api/rooms/:id/execute         # Execute code in room
POST   /api/rooms/:id/deploy          # Deploy from room

# Models
POST   /api/models                    # List available models
GET    /api/models/:id                # Get model details

# Billing
GET    /api/billing/subscription      # Get subscription
POST   /api/billing/subscribe         # Create subscription
POST   /api/billing/payment-link      # Create payment link
POST   /api/billing/verify            # Verify payment
POST   /api/billing/webhook           # Razorpay webhook
GET    /api/billing/invoices          # Get invoices

# Analytics
GET    /api/analytics/usage           # Get usage stats
GET    /api/analytics/projects        # Get project metrics
GET    /api/analytics/agents          # Get agent performance
GET    /api/analytics/export          # Export data

# Themes
GET    /api/themes                    # List themes
POST   /api/themes                    # Create custom theme
GET    /api/themes/:id                # Get theme details

# Teams
GET    /api/teams                     # List user teams
POST   /api/teams                     # Create team
GET    /api/teams/:id                 # Get team details
POST   /api/teams/:id/members         # Add team member
DELETE /api/teams/:id/members/:userId # Remove team member
```

---

## Design Decisions & Rationale

### 1. Why Multi-Provider Instead of AI SDK Gateway?

**Decision:** Implement custom provider adapters instead of relying on a single AI SDK.

**Rationale:**
- More control over model selection and fallback
- Better cost optimization
- Easier to add new providers
- No vendor lock-in

### 2. Why Redis for Rate Limiting?

**Decision:** Use Redis sliding window algorithm for rate limiting.

**Rationale:**
- Distributed rate limiting across serverless functions
- Atomic operations prevent race conditions
- Fast lookups (< 1ms)
- Built-in expiration

### 3. Why Socket.io for Rooms?

**Decision:** Use Socket.io for real-time room features.

**Rationale:**
- Mature, battle-tested library
- Automatic reconnection
- Room/namespace support
- Fallback to long-polling

### 4. Why Razorpay for Billing?

**Decision:** Use Razorpay for subscription and payment management.

**Rationale:**
- Best for Indian market (UPI, Cards, Netbanking, Wallets)
- Instant UPI payments
- Lower transaction fees for Indian payments
- Excellent developer experience
- Built-in tax handling (GST)
- Strong fraud protection
- Webhook reliability
- Supports international payments too

### 5. Why Vercel Postgres?

**Decision:** Continue using Vercel Postgres instead of migrating.

**Rationale:**
- Already integrated
- Serverless-friendly
- Connection pooling built-in
- Good performance for our scale

---

## Future Enhancements (Post-MVP)

1. **Voice Chat:**
   - WebRTC integration
   - Voice-to-text transcription
   - Text-to-speech output

2. **Mobile Apps:**
   - React Native apps
   - Push notifications
   - Offline sync

3. **Advanced Analytics:**
   - AI-powered insights
   - Predictive analytics
   - Custom reports

4. **Enterprise Features:**
   - SSO/SAML
   - Audit logs
   - Custom models
   - White-label

5. **Integrations:**
   - Slack bot
   - VS Code extension
   - Zapier
   - API webhooks

---

---

## Summary: Hybrid AI Development Platform

This platform uniquely combines:

1. **Multi-Agent Orchestration** - 10 specialized AI agents working together
2. **Collaborative Coding** - Real-time code collaboration like VS Code Live Share
3. **Code Generation** - AI agents generate actual working applications
4. **Execution & Preview** - Sandboxed code execution with live preview
5. **Deployment** - One-click deployment to Vercel/Netlify/Railway
6. **Chat Communication** - Team communication alongside development
7. **Vibe Themes** - Immersive development environments
8. **Enterprise Features** - Teams, billing, analytics, security

**Key Differentiators:**
- Not just a chat platform - it's a development platform
- Not just code suggestions - it generates complete applications
- Not single AI - multiple specialized agents collaborating
- Not just planning - actual code execution and deployment
- Not isolated - real-time team collaboration

**Target Users:**
- Individual developers building side projects
- Small teams prototyping quickly
- Startups building MVPs
- Enterprises accelerating development
- Students learning to code
- Non-technical founders building products

---

**Document Version:** 2.0  
**Last Updated:** January 2025  
**Status:** Ready for Implementation Planning
