// POST /api/billing/payment-link - Generate payment link

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { getRazorpayClient } from "@/lib/billing/razorpay-client";
import { getPlanDetails } from "@/lib/billing/razorpay-config";
import { z } from "zod";

const paymentLinkSchema = z.object({
  tier: z.enum(["pro", "team", "enterprise"]),
  callbackUrl: z.string().url().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = paymentLinkSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { tier, callbackUrl } = validation.data;

    // Get plan details with GST
    const planDetails = getPlanDetails(tier);

    // Create payment link
    const razorpay = getRazorpayClient();
    const paymentLink = await razorpay.createPaymentLink({
      amount: planDetails.totalAmount,
      currency: planDetails.currency,
      description: `${planDetails.name} Plan Subscription`,
      callbackUrl:
        callbackUrl || `${process.env.NEXT_PUBLIC_APP_URL}/billing/success`,
      callbackMethod: "get",
    });

    return NextResponse.json({
      success: true,
      paymentLink: {
        id: (paymentLink as any).id,
        shortUrl: (paymentLink as any).short_url,
        amount: planDetails.totalAmount,
        baseAmount: planDetails.baseAmount,
        gstAmount: planDetails.gstAmount,
      },
    });
  } catch (error) {
    console.error("Payment link API error:", error);
    return NextResponse.json(
      { error: "Failed to create payment link" },
      { status: 500 }
    );
  }
}
