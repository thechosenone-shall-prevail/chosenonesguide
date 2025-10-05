import type { InferSelectModel } from "drizzle-orm";
import {
  boolean,
  decimal,
  foreignKey,
  integer,
  json,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import type { AppUsage } from "../usage";

export const user = pgTable("User", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  email: varchar("email", { length: 64 }).notNull(),
  password: varchar("password", { length: 64 }),
});

export type User = InferSelectModel<typeof user>;

export const chat = pgTable("Chat", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  createdAt: timestamp("createdAt").notNull(),
  title: text("title").notNull(),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id),
  visibility: varchar("visibility", { enum: ["public", "private"] })
    .notNull()
    .default("private"),
  lastContext: jsonb("lastContext").$type<AppUsage | null>(),
});

export type Chat = InferSelectModel<typeof chat>;

// DEPRECATED: The following schema is deprecated and will be removed in the future.
// Read the migration guide at https://chat-sdk.dev/docs/migration-guides/message-parts
export const messageDeprecated = pgTable("Message", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  chatId: uuid("chatId")
    .notNull()
    .references(() => chat.id),
  role: varchar("role").notNull(),
  content: json("content").notNull(),
  createdAt: timestamp("createdAt").notNull(),
});

export type MessageDeprecated = InferSelectModel<typeof messageDeprecated>;

export const message = pgTable("Message_v2", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  chatId: uuid("chatId")
    .notNull()
    .references(() => chat.id),
  role: varchar("role").notNull(),
  parts: json("parts").notNull(),
  attachments: json("attachments").notNull(),
  createdAt: timestamp("createdAt").notNull(),
});

export type DBMessage = InferSelectModel<typeof message>;

// DEPRECATED: The following schema is deprecated and will be removed in the future.
// Read the migration guide at https://chat-sdk.dev/docs/migration-guides/message-parts
export const voteDeprecated = pgTable(
  "Vote",
  {
    chatId: uuid("chatId")
      .notNull()
      .references(() => chat.id),
    messageId: uuid("messageId")
      .notNull()
      .references(() => messageDeprecated.id),
    isUpvoted: boolean("isUpvoted").notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.chatId, table.messageId] }),
    };
  }
);

export type VoteDeprecated = InferSelectModel<typeof voteDeprecated>;

export const vote = pgTable(
  "Vote_v2",
  {
    chatId: uuid("chatId")
      .notNull()
      .references(() => chat.id),
    messageId: uuid("messageId")
      .notNull()
      .references(() => message.id),
    isUpvoted: boolean("isUpvoted").notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.chatId, table.messageId] }),
    };
  }
);

export type Vote = InferSelectModel<typeof vote>;

export const document = pgTable(
  "Document",
  {
    id: uuid("id").notNull().defaultRandom(),
    createdAt: timestamp("createdAt").notNull(),
    title: text("title").notNull(),
    content: text("content"),
    kind: varchar("text", { enum: ["text", "code", "image", "sheet"] })
      .notNull()
      .default("text"),
    userId: uuid("userId")
      .notNull()
      .references(() => user.id),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.id, table.createdAt] }),
    };
  }
);

export type Document = InferSelectModel<typeof document>;

export const suggestion = pgTable(
  "Suggestion",
  {
    id: uuid("id").notNull().defaultRandom(),
    documentId: uuid("documentId").notNull(),
    documentCreatedAt: timestamp("documentCreatedAt").notNull(),
    originalText: text("originalText").notNull(),
    suggestedText: text("suggestedText").notNull(),
    description: text("description"),
    isResolved: boolean("isResolved").notNull().default(false),
    userId: uuid("userId")
      .notNull()
      .references(() => user.id),
    createdAt: timestamp("createdAt").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    documentRef: foreignKey({
      columns: [table.documentId, table.documentCreatedAt],
      foreignColumns: [document.id, document.createdAt],
    }),
  })
);

export type Suggestion = InferSelectModel<typeof suggestion>;

export const stream = pgTable(
  "Stream",
  {
    id: uuid("id").notNull().defaultRandom(),
    chatId: uuid("chatId").notNull(),
    createdAt: timestamp("createdAt").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    chatRef: foreignKey({
      columns: [table.chatId],
      foreignColumns: [chat.id],
    }),
  })
);

export type Stream = InferSelectModel<typeof stream>;

// ============================================================================
// Phase 1: Enterprise AI Development Platform - New Tables
// ============================================================================

// Subscription & Billing Tables
export const subscription = pgTable("Subscription", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id),
  tier: varchar("tier", {
    enum: ["free", "pro", "team", "enterprise"],
  })
    .notNull()
    .default("free"),
  status: varchar("status", {
    enum: ["active", "canceled", "past_due", "trialing"],
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

export type Subscription = InferSelectModel<typeof subscription>;

export const usageLog = pgTable("UsageLog", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id),
  chatId: uuid("chatId").references(() => chat.id),
  modelId: varchar("modelId", { length: 100 }).notNull(),
  promptTokens: integer("promptTokens").notNull(),
  completionTokens: integer("completionTokens").notNull(),
  totalTokens: integer("totalTokens").notNull(),
  cost: decimal("cost", { precision: 10, scale: 6 }),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export type UsageLog = InferSelectModel<typeof usageLog>;

// Team Tables
export const team = pgTable("Team", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  ownerId: uuid("ownerId")
    .notNull()
    .references(() => user.id),
  subscriptionId: uuid("subscriptionId").references(() => subscription.id),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export type Team = InferSelectModel<typeof team>;

export const teamMember = pgTable("TeamMember", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  teamId: uuid("teamId")
    .notNull()
    .references(() => team.id),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id),
  role: varchar("role", { enum: ["owner", "admin", "member"] }).notNull(),
  joinedAt: timestamp("joinedAt").notNull().defaultNow(),
});

export type TeamMember = InferSelectModel<typeof teamMember>;

// Project Tables
export const project = pgTable("Project", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  creatorId: uuid("creatorId")
    .notNull()
    .references(() => user.id),
  teamId: uuid("teamId").references(() => team.id),
  framework: varchar("framework", { length: 50 }),
  status: varchar("status", {
    enum: ["planning", "in_progress", "completed", "deployed", "archived"],
  })
    .notNull()
    .default("planning"),
  visibility: varchar("visibility", {
    enum: ["public", "private", "team"],
  })
    .notNull()
    .default("private"),
  fileTree: jsonb("fileTree"),
  deploymentUrl: text("deploymentUrl"),
  repositoryUrl: text("repositoryUrl"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export type Project = InferSelectModel<typeof project>;

export const projectFile = pgTable("ProjectFile", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  projectId: uuid("projectId")
    .notNull()
    .references(() => project.id),
  path: text("path").notNull(),
  content: text("content"),
  language: varchar("language", { length: 50 }),
  size: integer("size"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export type ProjectFile = InferSelectModel<typeof projectFile>;

// Room Tables
export const room = pgTable("Room", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  projectId: uuid("projectId").references(() => project.id),
  creatorId: uuid("creatorId")
    .notNull()
    .references(() => user.id),
  teamId: uuid("teamId").references(() => team.id),
  visibility: varchar("visibility", {
    enum: ["public", "private", "team"],
  })
    .notNull()
    .default("private"),
  maxParticipants: integer("maxParticipants").notNull().default(10),
  currentTheme: varchar("currentTheme", { length: 100 }),
  password: varchar("password", { length: 255 }), // hashed
  isLocked: boolean("isLocked").default(false),
  isArchived: boolean("isArchived").default(false),
  sandboxId: varchar("sandboxId", { length: 255 }),
  lastActivityAt: timestamp("lastActivityAt").notNull().defaultNow(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export type Room = InferSelectModel<typeof room>;

export const roomParticipant = pgTable("RoomParticipant", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  roomId: uuid("roomId")
    .notNull()
    .references(() => room.id),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id),
  role: varchar("role", { enum: ["host", "moderator", "participant"] }).notNull(),
  joinedAt: timestamp("joinedAt").notNull().defaultNow(),
  leftAt: timestamp("leftAt"),
  isActive: boolean("isActive").default(true),
});

export type RoomParticipant = InferSelectModel<typeof roomParticipant>;

// Agent Tables
export const agentInstance = pgTable("AgentInstance", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  roomId: uuid("roomId")
    .notNull()
    .references(() => room.id),
  projectId: uuid("projectId")
    .notNull()
    .references(() => project.id),
  role: varchar("role", {
    enum: [
      "architect",
      "coder",
      "frontend",
      "backend",
      "debugger",
      "reviewer",
      "devops",
      "tester",
      "documentation",
      "optimizer",
    ],
  }).notNull(),
  modelId: varchar("modelId", { length: 100 }).notNull(),
  status: varchar("status", {
    enum: ["idle", "thinking", "coding", "reviewing", "blocked"],
  })
    .notNull()
    .default("idle"),
  currentTask: text("currentTask"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export type AgentInstance = InferSelectModel<typeof agentInstance>;

export const agentTask = pgTable("AgentTask", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  projectId: uuid("projectId")
    .notNull()
    .references(() => project.id),
  agentId: uuid("agentId").references(() => agentInstance.id),
  type: varchar("type", {
    enum: ["design", "implement", "debug", "review", "deploy", "optimize"],
  }).notNull(),
  description: text("description").notNull(),
  priority: varchar("priority", {
    enum: ["low", "medium", "high", "critical"],
  })
    .notNull()
    .default("medium"),
  status: varchar("status", {
    enum: ["pending", "in_progress", "completed", "blocked"],
  })
    .notNull()
    .default("pending"),
  result: text("result"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  completedAt: timestamp("completedAt"),
});

export type AgentTask = InferSelectModel<typeof agentTask>;

// Deployment Tables
export const deployment = pgTable("Deployment", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  projectId: uuid("projectId")
    .notNull()
    .references(() => project.id),
  platform: varchar("platform", {
    enum: ["vercel", "netlify", "railway", "render"],
  }).notNull(),
  url: text("url"),
  status: varchar("status", {
    enum: ["pending", "building", "deployed", "failed"],
  })
    .notNull()
    .default("pending"),
  buildLog: text("buildLog"),
  deployedBy: uuid("deployedBy")
    .notNull()
    .references(() => user.id),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export type Deployment = InferSelectModel<typeof deployment>;

// Theme Tables
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

export type Theme = InferSelectModel<typeof theme>;

// Analytics Tables
export const analyticsEvent = pgTable("AnalyticsEvent", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id),
  eventType: varchar("eventType", { length: 100 }).notNull(),
  eventData: jsonb("eventData"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export type AnalyticsEvent = InferSelectModel<typeof analyticsEvent>;

// User Profile Extension
export const userProfile = pgTable("UserProfile", {
  userId: uuid("userId")
    .primaryKey()
    .references(() => user.id),
  displayName: varchar("displayName", { length: 100 }),
  avatar: text("avatar"),
  bio: text("bio"),
  preferences: jsonb("preferences"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export type UserProfile = InferSelectModel<typeof userProfile>;
