// Rate Limiting Types

export type SubscriptionTier = "free" | "pro" | "team" | "enterprise";

export interface RateLimitConfig {
  userId: string;
  tier: SubscriptionTier;
  window: number; // seconds
  maxRequests: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfter?: number;
}

export interface UsageStats {
  current: number;
  limit: number;
  resetAt: Date;
  percentage: number;
}

export interface TierLimits {
  messagesPerDay: number;
  messagesPerHour: number;
  projectsPerMonth: number;
  concurrentRooms: number;
  storageGB: number;
  uploadsPerDay: number;
}

export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  free: {
    messagesPerDay: 50,
    messagesPerHour: 10,
    projectsPerMonth: 3,
    concurrentRooms: 1,
    storageGB: 0.1, // 100 MB
    uploadsPerDay: 5,
  },
  pro: {
    messagesPerDay: 1000,
    messagesPerHour: 100,
    projectsPerMonth: 50,
    concurrentRooms: 5,
    storageGB: 10,
    uploadsPerDay: 100,
  },
  team: {
    messagesPerDay: -1, // unlimited
    messagesPerHour: 500,
    projectsPerMonth: -1, // unlimited
    concurrentRooms: -1, // unlimited
    storageGB: 100,
    uploadsPerDay: 500,
  },
  enterprise: {
    messagesPerDay: -1, // unlimited
    messagesPerHour: -1, // unlimited
    projectsPerMonth: -1, // unlimited
    concurrentRooms: -1, // unlimited
    storageGB: -1, // unlimited
    uploadsPerDay: -1, // unlimited
  },
};
