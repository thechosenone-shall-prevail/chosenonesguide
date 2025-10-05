// Subscription Management Service

import { db } from "@/lib/db";
import { subscription, usageLog } from "@/lib/db/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { getRazorpayClient } from "./razorpay-client";
import { getPlanDetails, RAZORPAY_PLANS } from "./razorpay-config";
import type { SubscriptionTier } from "@/lib/rate-limit/types";

export interface CreateSubscriptionParams {
  userId: string;
  tier: SubscriptionTier;
  userEmail: string;
  userName: string;
}

export interface SubscriptionDetails {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  status: string;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  razorpaySubscriptionId: string | null;
}

export class SubscriptionService {
  private razorpay = getRazorpayClient();

  /**
   * Create a new subscription
   */
  async createSubscription(
    params: CreateSubscriptionParams
  ): Promise<SubscriptionDetails> {
    try {
      // Get plan details
      const plan = RAZORPAY_PLANS[params.tier];

      // For free tier, just create database entry
      if (params.tier === "free") {
        const [newSubscription] = await db
          .insert(subscription)
          .values({
            userId: params.userId,
            tier: params.tier,
            status: "active",
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000
            ), // 30 days
            cancelAtPeriodEnd: false,
          })
          .returning();

        return this.mapToSubscriptionDetails(newSubscription);
      }

      // For paid tiers, create Razorpay customer and subscription
      const customer = await this.razorpay.createCustomer({
        name: params.userName,
        email: params.userEmail,
        notes: {
          userId: params.userId,
        },
      });

      const razorpaySubscription = await this.razorpay.createSubscription({
        planId: plan.id,
        customerId: customer.id,
        totalCount: 12, // 12 months
        customerNotify: true,
        notes: {
          userId: params.userId,
          tier: params.tier,
        },
      });

      // Store in database
      const [newSubscription] = await db
        .insert(subscription)
        .values({
          userId: params.userId,
          tier: params.tier,
          status: razorpaySubscription.status,
          razorpayCustomerId: customer.id,
          razorpaySubscriptionId: razorpaySubscription.id,
          razorpayPlanId: plan.id,
          currentPeriodStart: new Date(razorpaySubscription.start_at * 1000),
          currentPeriodEnd: new Date(razorpaySubscription.end_at * 1000),
          cancelAtPeriodEnd: false,
        })
        .returning();

      return this.mapToSubscriptionDetails(newSubscription);
    } catch (error) {
      console.error("Create subscription error:", error);
      throw new Error("Failed to create subscription");
    }
  }

  /**
   * Get user's subscription
   */
  async getSubscription(userId: string): Promise<SubscriptionDetails | null> {
    try {
      const [userSubscription] = await db
        .select()
        .from(subscription)
        .where(eq(subscription.userId, userId))
        .limit(1);

      if (!userSubscription) {
        return null;
      }

      return this.mapToSubscriptionDetails(userSubscription);
    } catch (error) {
      console.error("Get subscription error:", error);
      return null;
    }
  }

  /**
   * Update subscription tier (upgrade/downgrade)
   */
  async updateSubscription(
    userId: string,
    newTier: SubscriptionTier,
    immediate = true
  ): Promise<SubscriptionDetails> {
    try {
      const currentSubscription = await this.getSubscription(userId);

      if (!currentSubscription) {
        throw new Error("No subscription found");
      }

      // If downgrading, schedule for next billing cycle
      if (!immediate) {
        await db
          .update(subscription)
          .set({
            cancelAtPeriodEnd: true,
            updatedAt: new Date(),
          })
          .where(eq(subscription.userId, userId));

        return currentSubscription;
      }

      // For immediate changes, cancel old and create new
      if (currentSubscription.razorpaySubscriptionId) {
        await this.razorpay.cancelSubscription(
          currentSubscription.razorpaySubscriptionId,
          false
        );
      }

      // Create new subscription
      const newSubscription = await this.createSubscription({
        userId,
        tier: newTier,
        userEmail: "", // Get from user table
        userName: "", // Get from user table
      });

      return newSubscription;
    } catch (error) {
      console.error("Update subscription error:", error);
      throw new Error("Failed to update subscription");
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(
    userId: string,
    cancelAtPeriodEnd = true
  ): Promise<void> {
    try {
      const userSubscription = await this.getSubscription(userId);

      if (!userSubscription) {
        throw new Error("No subscription found");
      }

      if (userSubscription.razorpaySubscriptionId) {
        await this.razorpay.cancelSubscription(
          userSubscription.razorpaySubscriptionId,
          cancelAtPeriodEnd
        );
      }

      await db
        .update(subscription)
        .set({
          status: cancelAtPeriodEnd ? "active" : "canceled",
          cancelAtPeriodEnd,
          updatedAt: new Date(),
        })
        .where(eq(subscription.userId, userId));
    } catch (error) {
      console.error("Cancel subscription error:", error);
      throw new Error("Failed to cancel subscription");
    }
  }

  /**
   * Get usage statistics
   */
  async getUsageStats(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalTokens: number;
    totalCost: number;
    requestCount: number;
    modelBreakdown: Record<string, { tokens: number; cost: number; count: number }>;
  }> {
    try {
      const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate || new Date();

      const logs = await db
        .select()
        .from(usageLog)
        .where(
          and(
            eq(usageLog.userId, userId),
            gte(usageLog.createdAt, start),
            lte(usageLog.createdAt, end)
          )
        )
        .orderBy(desc(usageLog.createdAt));

      let totalTokens = 0;
      let totalCost = 0;
      const modelBreakdown: Record<
        string,
        { tokens: number; cost: number; count: number }
      > = {};

      for (const log of logs) {
        totalTokens += log.totalTokens;
        totalCost += Number.parseFloat(log.cost || "0");

        if (!modelBreakdown[log.modelId]) {
          modelBreakdown[log.modelId] = { tokens: 0, cost: 0, count: 0 };
        }

        modelBreakdown[log.modelId].tokens += log.totalTokens;
        modelBreakdown[log.modelId].cost += Number.parseFloat(log.cost || "0");
        modelBreakdown[log.modelId].count += 1;
      }

      return {
        totalTokens,
        totalCost,
        requestCount: logs.length,
        modelBreakdown,
      };
    } catch (error) {
      console.error("Get usage stats error:", error);
      throw new Error("Failed to get usage statistics");
    }
  }

  /**
   * Log usage
   */
  async logUsage(params: {
    userId: string;
    chatId?: string;
    modelId: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cost: string;
  }): Promise<void> {
    try {
      await db.insert(usageLog).values(params);
    } catch (error) {
      console.error("Log usage error:", error);
    }
  }

  // Private helper methods

  private mapToSubscriptionDetails(sub: any): SubscriptionDetails {
    return {
      id: sub.id,
      userId: sub.userId,
      tier: sub.tier,
      status: sub.status,
      currentPeriodStart: sub.currentPeriodStart,
      currentPeriodEnd: sub.currentPeriodEnd,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd || false,
      razorpaySubscriptionId: sub.razorpaySubscriptionId,
    };
  }
}

// Singleton instance
let subscriptionServiceInstance: SubscriptionService | null = null;

export function getSubscriptionService(): SubscriptionService {
  if (!subscriptionServiceInstance) {
    subscriptionServiceInstance = new SubscriptionService();
  }
  return subscriptionServiceInstance;
}
