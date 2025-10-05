// POST /api/billing/subscribe - Create subscription

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { getSubscriptionService } from "@/lib/billing/subscription-service";
import { z } from "zod";

const subscribeSchema = z.object({
  tier: z.enum(["free", "pro", "team", "enterprise"]),
  userName: z.string().min(1),
  userEmail: z.string().email(),
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = subscribeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { tier, userName, userEmail } = validation.data;

    // Create subscription
    const subscriptionService = getSubscriptionService();
    const subscription = await subscriptionService.createSubscription({
      userId: session.user.id,
      tier,
      userName,
      userEmail,
    });

    return NextResponse.json({
      success: true,
      subscription,
    });
  } catch (error) {
    console.error("Subscribe API error:", error);
    return NextResponse.json(
      { error: "Failed to create subscription" },
      { status: 500 }
    );
  }
}
