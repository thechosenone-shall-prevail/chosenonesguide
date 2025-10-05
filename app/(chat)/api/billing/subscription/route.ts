// GET /api/billing/subscription - Get user's subscription
// PUT /api/billing/subscription - Update subscription
// DELETE /api/billing/subscription - Cancel subscription

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { getSubscriptionService } from "@/lib/billing/subscription-service";
import { z } from "zod";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscriptionService = getSubscriptionService();
    const subscription = await subscriptionService.getSubscription(
      session.user.id
    );

    if (!subscription) {
      return NextResponse.json(
        { error: "No subscription found" },
        { status: 404 }
      );
    }

    // Get usage stats
    const usageStats = await subscriptionService.getUsageStats(session.user.id);

    return NextResponse.json({
      subscription,
      usage: usageStats,
    });
  } catch (error) {
    console.error("Get subscription API error:", error);
    return NextResponse.json(
      { error: "Failed to get subscription" },
      { status: 500 }
    );
  }
}

const updateSchema = z.object({
  tier: z.enum(["free", "pro", "team", "enterprise"]),
  immediate: z.boolean().optional().default(true),
});

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = updateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { tier, immediate } = validation.data;

    const subscriptionService = getSubscriptionService();
    const updatedSubscription = await subscriptionService.updateSubscription(
      session.user.id,
      tier,
      immediate
    );

    return NextResponse.json({
      success: true,
      subscription: updatedSubscription,
    });
  } catch (error) {
    console.error("Update subscription API error:", error);
    return NextResponse.json(
      { error: "Failed to update subscription" },
      { status: 500 }
    );
  }
}

const cancelSchema = z.object({
  cancelAtPeriodEnd: z.boolean().optional().default(true),
});

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = cancelSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { cancelAtPeriodEnd } = validation.data;

    const subscriptionService = getSubscriptionService();
    await subscriptionService.cancelSubscription(
      session.user.id,
      cancelAtPeriodEnd
    );

    return NextResponse.json({
      success: true,
      message: cancelAtPeriodEnd
        ? "Subscription will be cancelled at the end of the billing period"
        : "Subscription cancelled immediately",
    });
  } catch (error) {
    console.error("Cancel subscription API error:", error);
    return NextResponse.json(
      { error: "Failed to cancel subscription" },
      { status: 500 }
    );
  }
}
