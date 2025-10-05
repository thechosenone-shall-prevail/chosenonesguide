// POST /api/billing/webhook - Handle Razorpay webhooks

import { NextRequest, NextResponse } from "next/server";
import { getRazorpayClient } from "@/lib/billing/razorpay-client";
import { db } from "@/lib/db";
import { subscription } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    // Get webhook signature
    const signature = request.headers.get("x-razorpay-signature");
    if (!signature) {
      return NextResponse.json(
        { error: "Missing signature" },
        { status: 400 }
      );
    }

    // Get raw body
    const body = await request.text();

    // Verify webhook signature
    const razorpay = getRazorpayClient();
    const isValid = razorpay.verifyWebhookSignature(body, signature);

    if (!isValid) {
      console.error("Invalid webhook signature");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    // Parse webhook event
    const event = JSON.parse(body);
    console.log("Razorpay webhook event:", event.event);

    // Handle different event types
    switch (event.event) {
      case "subscription.activated":
        await handleSubscriptionActivated(event.payload.subscription.entity);
        break;

      case "subscription.charged":
        await handleSubscriptionCharged(event.payload.subscription.entity);
        break;

      case "subscription.cancelled":
        await handleSubscriptionCancelled(event.payload.subscription.entity);
        break;

      case "subscription.completed":
        await handleSubscriptionCompleted(event.payload.subscription.entity);
        break;

      case "subscription.paused":
        await handleSubscriptionPaused(event.payload.subscription.entity);
        break;

      case "subscription.resumed":
        await handleSubscriptionResumed(event.payload.subscription.entity);
        break;

      case "payment.failed":
        await handlePaymentFailed(event.payload.payment.entity);
        break;

      default:
        console.log("Unhandled webhook event:", event.event);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

// Webhook event handlers

async function handleSubscriptionActivated(subscriptionData: any) {
  try {
    await db
      .update(subscription)
      .set({
        status: "active",
        currentPeriodStart: new Date(subscriptionData.start_at * 1000),
        currentPeriodEnd: new Date(subscriptionData.end_at * 1000),
        updatedAt: new Date(),
      })
      .where(eq(subscription.razorpaySubscriptionId, subscriptionData.id));

    console.log("Subscription activated:", subscriptionData.id);
  } catch (error) {
    console.error("Handle subscription activated error:", error);
  }
}

async function handleSubscriptionCharged(subscriptionData: any) {
  try {
    await db
      .update(subscription)
      .set({
        status: "active",
        currentPeriodStart: new Date(subscriptionData.current_start * 1000),
        currentPeriodEnd: new Date(subscriptionData.current_end * 1000),
        updatedAt: new Date(),
      })
      .where(eq(subscription.razorpaySubscriptionId, subscriptionData.id));

    console.log("Subscription charged:", subscriptionData.id);

    // TODO: Send payment success email
  } catch (error) {
    console.error("Handle subscription charged error:", error);
  }
}

async function handleSubscriptionCancelled(subscriptionData: any) {
  try {
    await db
      .update(subscription)
      .set({
        status: "canceled",
        cancelAtPeriodEnd: false,
        updatedAt: new Date(),
      })
      .where(eq(subscription.razorpaySubscriptionId, subscriptionData.id));

    console.log("Subscription cancelled:", subscriptionData.id);

    // TODO: Send cancellation email
  } catch (error) {
    console.error("Handle subscription cancelled error:", error);
  }
}

async function handleSubscriptionCompleted(subscriptionData: any) {
  try {
    await db
      .update(subscription)
      .set({
        status: "canceled",
        updatedAt: new Date(),
      })
      .where(eq(subscription.razorpaySubscriptionId, subscriptionData.id));

    console.log("Subscription completed:", subscriptionData.id);
  } catch (error) {
    console.error("Handle subscription completed error:", error);
  }
}

async function handleSubscriptionPaused(subscriptionData: any) {
  try {
    await db
      .update(subscription)
      .set({
        status: "past_due",
        updatedAt: new Date(),
      })
      .where(eq(subscription.razorpaySubscriptionId, subscriptionData.id));

    console.log("Subscription paused:", subscriptionData.id);
  } catch (error) {
    console.error("Handle subscription paused error:", error);
  }
}

async function handleSubscriptionResumed(subscriptionData: any) {
  try {
    await db
      .update(subscription)
      .set({
        status: "active",
        updatedAt: new Date(),
      })
      .where(eq(subscription.razorpaySubscriptionId, subscriptionData.id));

    console.log("Subscription resumed:", subscriptionData.id);
  } catch (error) {
    console.error("Handle subscription resumed error:", error);
  }
}

async function handlePaymentFailed(paymentData: any) {
  try {
    // Find subscription by payment details
    console.log("Payment failed:", paymentData.id);

    // TODO: Send payment failure email
    // TODO: Update subscription status if needed
  } catch (error) {
    console.error("Handle payment failed error:", error);
  }
}
