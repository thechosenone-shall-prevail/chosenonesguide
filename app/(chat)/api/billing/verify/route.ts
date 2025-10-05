// POST /api/billing/verify - Verify payment

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { getRazorpayClient } from "@/lib/billing/razorpay-client";
import { getSubscriptionService } from "@/lib/billing/subscription-service";
import { z } from "zod";

const verifySchema = z.object({
  razorpayOrderId: z.string(),
  razorpayPaymentId: z.string(),
  razorpaySignature: z.string(),
  tier: z.enum(["pro", "team", "enterprise"]),
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = verifySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, tier } =
      validation.data;

    // Verify signature
    const razorpay = getRazorpayClient();
    const isValid = razorpay.verifyPaymentSignature({
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
    });

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid payment signature" },
        { status: 400 }
      );
    }

    // Create or update subscription
    const subscriptionService = getSubscriptionService();
    const subscription = await subscriptionService.createSubscription({
      userId: session.user.id,
      tier,
      userName: session.user.name || session.user.email,
      userEmail: session.user.email,
    });

    return NextResponse.json({
      success: true,
      verified: true,
      subscription,
    });
  } catch (error) {
    console.error("Verify payment API error:", error);
    return NextResponse.json(
      { error: "Failed to verify payment" },
      { status: 500 }
    );
  }
}
