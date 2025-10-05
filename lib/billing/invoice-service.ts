// Invoice Generation Service with GST

import { db } from "@/lib/db";
import { subscription, usageLog } from "@/lib/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { calculateGST, getPlanDetails } from "./razorpay-config";

export interface Invoice {
  id: string;
  invoiceNumber: string;
  userId: string;
  subscriptionId: string;
  tier: string;
  billingPeriodStart: Date;
  billingPeriodEnd: Date;
  baseAmount: number;
  gstAmount: number;
  totalAmount: number;
  currency: string;
  status: "paid" | "pending" | "failed";
  paidAt?: Date;
  createdAt: Date;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export class InvoiceService {
  /**
   * Generate invoice for a subscription period
   */
  async generateInvoice(params: {
    userId: string;
    subscriptionId: string;
    tier: string;
    billingPeriodStart: Date;
    billingPeriodEnd: Date;
  }): Promise<Invoice> {
    try {
      // Get plan details
      const planDetails = getPlanDetails(params.tier);

      // Generate invoice number
      const invoiceNumber = this.generateInvoiceNumber();

      // Get usage for the period
      const usage = await this.getUsageForPeriod(
        params.userId,
        params.billingPeriodStart,
        params.billingPeriodEnd
      );

      // Calculate amounts
      const baseAmount = planDetails.baseAmount;
      const gstAmount = planDetails.gstAmount;
      const totalAmount = planDetails.totalAmount;

      const invoice: Invoice = {
        id: crypto.randomUUID(),
        invoiceNumber,
        userId: params.userId,
        subscriptionId: params.subscriptionId,
        tier: params.tier,
        billingPeriodStart: params.billingPeriodStart,
        billingPeriodEnd: params.billingPeriodEnd,
        baseAmount,
        gstAmount,
        totalAmount,
        currency: "INR",
        status: "paid",
        paidAt: new Date(),
        createdAt: new Date(),
      };

      // TODO: Store invoice in database (add invoice table)

      return invoice;
    } catch (error) {
      console.error("Generate invoice error:", error);
      throw new Error("Failed to generate invoice");
    }
  }

  /**
   * Get invoice line items
   */
  getInvoiceLineItems(tier: string): InvoiceLineItem[] {
    const planDetails = getPlanDetails(tier);

    return [
      {
        description: `${planDetails.name} Plan - Monthly Subscription`,
        quantity: 1,
        unitPrice: planDetails.baseAmount,
        amount: planDetails.baseAmount,
      },
      {
        description: "GST (18%)",
        quantity: 1,
        unitPrice: planDetails.gstAmount,
        amount: planDetails.gstAmount,
      },
    ];
  }

  /**
   * Generate invoice PDF (placeholder)
   */
  async generateInvoicePDF(invoice: Invoice): Promise<Buffer> {
    // TODO: Implement PDF generation using a library like pdfkit or puppeteer
    // For now, return empty buffer
    return Buffer.from("");
  }

  /**
   * Get invoices for a user
   */
  async getUserInvoices(userId: string): Promise<Invoice[]> {
    // TODO: Implement when invoice table is added
    return [];
  }

  // Private helper methods

  private generateInvoiceNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");

    return `INV-${year}${month}-${random}`;
  }

  private async getUsageForPeriod(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalTokens: number;
    totalCost: number;
    requestCount: number;
  }> {
    try {
      const logs = await db
        .select()
        .from(usageLog)
        .where(
          and(
            eq(usageLog.userId, userId),
            gte(usageLog.createdAt, startDate),
            lte(usageLog.createdAt, endDate)
          )
        );

      let totalTokens = 0;
      let totalCost = 0;

      for (const log of logs) {
        totalTokens += log.totalTokens;
        totalCost += Number.parseFloat(log.cost || "0");
      }

      return {
        totalTokens,
        totalCost,
        requestCount: logs.length,
      };
    } catch (error) {
      console.error("Get usage for period error:", error);
      return {
        totalTokens: 0,
        totalCost: 0,
        requestCount: 0,
      };
    }
  }
}

// Singleton instance
let invoiceServiceInstance: InvoiceService | null = null;

export function getInvoiceService(): InvoiceService {
  if (!invoiceServiceInstance) {
    invoiceServiceInstance = new InvoiceService();
  }
  return invoiceServiceInstance;
}
