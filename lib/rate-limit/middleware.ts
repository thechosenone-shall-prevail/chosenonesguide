// Rate Limit Middleware for API Routes

import { NextRequest, NextResponse } from "next/server";
import { getRateLimiter } from "./index";
import type { SubscriptionTier } from "./types";
import { TIER_LIMITS } from "./types";

export interface RateLimitOptions {
  type?: "messages" | "uploads" | "projects";
  period?: "hourly" | "daily" | "monthly";
}

export async function rateLimitMiddleware(
  request: NextRequest,
  userId: string,
  tier: SubscriptionTier,
  options: RateLimitOptions = {}
): Promise<NextResponse | null> {
  const { type = "messages", period = "hourly" } = options;

  const rateLimiter = getRateLimiter();
  const limits = TIER_LIMITS[tier];

  // Get the limit for this tier and type
  let maxRequests: number;
  if (type === "messages") {
    maxRequests = period === "hourly" ? limits.messagesPerHour : limits.messagesPerDay;
  } else if (type === "uploads") {
    maxRequests = limits.uploadsPerDay;
  } else {
    maxRequests = limits.projectsPerMonth;
  }

  // Skip rate limiting for unlimited tiers
  if (maxRequests === -1) {
    return null;
  }

  // Check rate limit
  const result = await rateLimiter.checkLimit({
    userId,
    tier,
    window: getWindowSeconds(period),
    maxRequests,
  });

  // Add rate limit headers
  const headers = new Headers();
  headers.set("X-RateLimit-Limit", maxRequests.toString());
  headers.set("X-RateLimit-Remaining", result.remaining.toString());
  headers.set("X-RateLimit-Reset", result.resetAt.toISOString());

  // If rate limit exceeded, return error
  if (!result.allowed) {
    if (result.retryAfter) {
      headers.set("Retry-After", result.retryAfter.toString());
    }

    return NextResponse.json(
      {
        error: {
          code: "rate_limit_exceeded",
          message: `Rate limit exceeded. Please try again in ${result.retryAfter || "a few"} seconds.`,
          resetAt: result.resetAt.toISOString(),
          limit: maxRequests,
        },
      },
      {
        status: 429,
        headers,
      }
    );
  }

  // Check if user should receive a warning
  const warning = await rateLimiter.shouldWarn(userId, tier, type, period);
  if (warning.warn) {
    headers.set("X-RateLimit-Warning", "true");
    headers.set("X-RateLimit-Percentage", warning.percentage.toFixed(2));

    if (warning.critical) {
      headers.set("X-RateLimit-Critical", "true");
    }
  }

  // Increment usage
  await rateLimiter.incrementUsage(userId, type, period);

  // Return null to indicate success (no error response)
  // The headers will be added to the actual response
  return null;
}

function getWindowSeconds(period: "hourly" | "daily" | "monthly"): number {
  switch (period) {
    case "hourly":
      return 3600;
    case "daily":
      return 86400;
    case "monthly":
      return 2592000;
    default:
      return 3600;
  }
}

export function createRateLimitError(
  message: string,
  resetAt: Date,
  retryAfter?: number
): NextResponse {
  return NextResponse.json(
    {
      error: {
        code: "rate_limit_exceeded",
        message,
        resetAt: resetAt.toISOString(),
        retryAfter,
      },
    },
    { status: 429 }
  );
}
