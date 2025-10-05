// Razorpay Client Wrapper

import Razorpay from "razorpay";
import crypto from "node:crypto";
import { RAZORPAY_CONFIG } from "./razorpay-config";

export class RazorpayClient {
  private client: Razorpay;

  constructor() {
    if (!RAZORPAY_CONFIG.keyId || !RAZORPAY_CONFIG.keySecret) {
      throw new Error("Razorpay credentials not configured");
    }

    this.client = new Razorpay({
      key_id: RAZORPAY_CONFIG.keyId,
      key_secret: RAZORPAY_CONFIG.keySecret,
    });
  }

  /**
   * Create a Razorpay subscription
   */
  async createSubscription(params: {
    planId: string;
    customerId?: string;
    totalCount: number;
    customerNotify: boolean;
    notes?: Record<string, string>;
  }) {
    try {
      const subscription = await this.client.subscriptions.create({
        plan_id: params.planId,
        customer_id: params.customerId,
        total_count: params.totalCount,
        customer_notify: params.customerNotify ? 1 : 0,
        notes: params.notes,
      });

      return subscription;
    } catch (error) {
      console.error("Razorpay subscription creation error:", error);
      throw new Error("Failed to create subscription");
    }
  }

  /**
   * Create a Razorpay customer
   */
  async createCustomer(params: {
    name: string;
    email: string;
    contact?: string;
    notes?: Record<string, string>;
  }) {
    try {
      const customer = await this.client.customers.create({
        name: params.name,
        email: params.email,
        contact: params.contact,
        notes: params.notes,
      });

      return customer;
    } catch (error) {
      console.error("Razorpay customer creation error:", error);
      throw new Error("Failed to create customer");
    }
  }

  /**
   * Create a payment link
   */
  async createPaymentLink(params: {
    amount: number;
    currency: string;
    description: string;
    customerId?: string;
    callbackUrl?: string;
    callbackMethod?: string;
  }) {
    try {
      const paymentLink = await this.client.paymentLink.create({
        amount: params.amount,
        currency: params.currency,
        description: params.description,
        customer: params.customerId
          ? {
              id: params.customerId,
            }
          : undefined,
        callback_url: params.callbackUrl,
        callback_method: params.callbackMethod,
      });

      return paymentLink;
    } catch (error) {
      console.error("Razorpay payment link creation error:", error);
      throw new Error("Failed to create payment link");
    }
  }

  /**
   * Fetch subscription details
   */
  async getSubscription(subscriptionId: string) {
    try {
      const subscription = await this.client.subscriptions.fetch(subscriptionId);
      return subscription;
    } catch (error) {
      console.error("Razorpay fetch subscription error:", error);
      throw new Error("Failed to fetch subscription");
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId: string, cancelAtCycleEnd = false) {
    try {
      const subscription = await this.client.subscriptions.cancel(
        subscriptionId,
        cancelAtCycleEnd
      );
      return subscription;
    } catch (error) {
      console.error("Razorpay cancel subscription error:", error);
      throw new Error("Failed to cancel subscription");
    }
  }

  /**
   * Verify payment signature
   */
  verifyPaymentSignature(params: {
    orderId: string;
    paymentId: string;
    signature: string;
  }): boolean {
    try {
      const text = `${params.orderId}|${params.paymentId}`;
      const expectedSignature = crypto
        .createHmac("sha256", RAZORPAY_CONFIG.keySecret)
        .update(text)
        .digest("hex");

      return expectedSignature === params.signature;
    } catch (error) {
      console.error("Signature verification error:", error);
      return false;
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(body: string, signature: string): boolean {
    try {
      if (!RAZORPAY_CONFIG.webhookSecret) {
        console.warn("Webhook secret not configured");
        return false;
      }

      const expectedSignature = crypto
        .createHmac("sha256", RAZORPAY_CONFIG.webhookSecret)
        .update(body)
        .digest("hex");

      return expectedSignature === signature;
    } catch (error) {
      console.error("Webhook signature verification error:", error);
      return false;
    }
  }

  /**
   * Fetch all invoices for a subscription
   */
  async getInvoices(subscriptionId: string) {
    try {
      const invoices = await this.client.invoices.all({
        subscription_id: subscriptionId,
      });
      return invoices;
    } catch (error) {
      console.error("Razorpay fetch invoices error:", error);
      throw new Error("Failed to fetch invoices");
    }
  }

  /**
   * Create an invoice
   */
  async createInvoice(params: {
    customerId: string;
    type: string;
    description: string;
    amount: number;
    currency: string;
  }) {
    try {
      const invoice = await this.client.invoices.create({
        customer_id: params.customerId,
        type: params.type,
        description: params.description,
        amount: params.amount,
        currency: params.currency,
      });
      return invoice;
    } catch (error) {
      console.error("Razorpay invoice creation error:", error);
      throw new Error("Failed to create invoice");
    }
  }
}

// Singleton instance
let razorpayClientInstance: RazorpayClient | null = null;

export function getRazorpayClient(): RazorpayClient {
  if (!razorpayClientInstance) {
    razorpayClientInstance = new RazorpayClient();
  }
  return razorpayClientInstance;
}
