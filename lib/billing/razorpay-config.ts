// Razorpay Configuration

export const RAZORPAY_CONFIG = {
  keyId: process.env.RAZORPAY_KEY_ID!,
  keySecret: process.env.RAZORPAY_KEY_SECRET!,
  webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,
};

// Razorpay Plan IDs (create these in Razorpay dashboard)
export const RAZORPAY_PLANS = {
  free: {
    id: process.env.RAZORPAY_PLAN_FREE || "plan_free",
    name: "Free",
    amount: 0,
    currency: "INR",
    period: "monthly",
    interval: 1,
  },
  pro: {
    id: process.env.RAZORPAY_PLAN_PRO || "plan_pro",
    name: "Pro",
    amount: 2400, // ₹24 * 100 (Razorpay uses paise)
    currency: "INR",
    period: "monthly",
    interval: 1,
  },
  team: {
    id: process.env.RAZORPAY_PLAN_TEAM || "plan_team",
    name: "Team",
    amount: 6500, // ₹65 per user * 100
    currency: "INR",
    period: "monthly",
    interval: 1,
  },
  enterprise: {
    id: process.env.RAZORPAY_PLAN_ENTERPRISE || "plan_enterprise",
    name: "Enterprise",
    amount: 0, // Custom pricing
    currency: "INR",
    period: "monthly",
    interval: 1,
  },
};

// GST Configuration (India)
export const GST_RATE = 0.18; // 18% GST

export function calculateGST(amount: number): {
  baseAmount: number;
  gstAmount: number;
  totalAmount: number;
} {
  const baseAmount = amount;
  const gstAmount = Math.round(amount * GST_RATE);
  const totalAmount = baseAmount + gstAmount;

  return {
    baseAmount,
    gstAmount,
    totalAmount,
  };
}

export function getPlanDetails(tier: string) {
  const plan = RAZORPAY_PLANS[tier as keyof typeof RAZORPAY_PLANS];
  if (!plan) {
    throw new Error(`Invalid plan tier: ${tier}`);
  }

  const pricing = calculateGST(plan.amount);

  return {
    ...plan,
    ...pricing,
  };
}
