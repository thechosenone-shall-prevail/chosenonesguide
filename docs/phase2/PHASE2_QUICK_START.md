# Phase 2 Quick Start Guide

## Overview
This guide helps you quickly integrate Razorpay billing and subscription management into your application.

## Installation

```bash
npm install razorpay
```

## Environment Setup

Add to `.env.local`:

```env
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 1. Create a Subscription

### For Free Tier

```typescript
import { getSubscriptionService } from '@/lib/billing/subscription-service';

const service = getSubscriptionService();

const subscription = await service.createSubscription({
  userId: 'user-123',
  tier: 'free',
  userName: 'John Doe',
  userEmail: 'john@example.com',
});

console.log('Free subscription created:', subscription.id);
```

### For Paid Tiers

```typescript
const subscription = await service.createSubscription({
  userId: 'user-123',
  tier: 'pro', // or 'team', 'enterprise'
  userName: 'John Doe',
  userEmail: 'john@example.com',
});

// This creates a Razorpay subscription and returns subscription details
console.log('Razorpay subscription ID:', subscription.razorpaySubscriptionId);
```

## 2. Generate Payment Link

```typescript
import { getRazorpayClient } from '@/lib/billing/razorpay-client';
import { getPlanDetails } from '@/lib/billing/razorpay-config';

const razorpay = getRazorpayClient();

// Get plan details with GST
const planDetails = getPlanDetails('pro');
console.log('Base amount:', planDetails.baseAmount); // ₹24.00
console.log('GST (18%):', planDetails.gstAmount);    // ₹4.32
console.log('Total:', planDetails.totalAmount);       // ₹28.32

// Create payment link
const paymentLink = await razorpay.createPaymentLink({
  amount: planDetails.totalAmount,
  currency: 'INR',
  description: 'Pro Plan Subscription',
  callbackUrl: 'https://yourapp.com/billing/success',
  callbackMethod: 'get',
});

console.log('Payment link:', paymentLink.short_url);
// User can pay via: https://rzp.io/l/abc123
```

## 3. Verify Payment

After user completes payment, verify it:

```typescript
import { getRazorpayClient } from '@/lib/billing/razorpay-client';

const razorpay = getRazorpayClient();

// Get these from payment callback
const orderId = 'order_123';
const paymentId = 'pay_123';
const signature = 'signature_123';

const isValid = razorpay.verifyPaymentSignature({
  orderId,
  paymentId,
  signature,
});

if (isValid) {
  console.log('Payment verified successfully!');
  // Activate subscription
} else {
  console.log('Invalid payment signature');
}
```

## 4. Get User's Subscription

```typescript
import { getSubscriptionService } from '@/lib/billing/subscription-service';

const service = getSubscriptionService();
const subscription = await service.getSubscription('user-123');

if (subscription) {
  console.log('Tier:', subscription.tier);
  console.log('Status:', subscription.status);
  console.log('Period:', subscription.currentPeriodStart, 'to', subscription.currentPeriodEnd);
  console.log('Cancel at end?', subscription.cancelAtPeriodEnd);
}
```

## 5. Get Usage Statistics

```typescript
const service = getSubscriptionService();

const stats = await service.getUsageStats('user-123');

console.log('Total tokens used:', stats.totalTokens);
console.log('Total cost: $', stats.totalCost);
console.log('Total requests:', stats.requestCount);

// Model breakdown
Object.entries(stats.modelBreakdown).forEach(([model, data]) => {
  console.log(`${model}:`, data.tokens, 'tokens,', data.count, 'requests, $', data.cost);
});
```

## 6. Log Usage

Track AI model usage for billing:

```typescript
const service = getSubscriptionService();

await service.logUsage({
  userId: 'user-123',
  chatId: 'chat-456',
  modelId: 'gpt-4',
  promptTokens: 100,
  completionTokens: 50,
  totalTokens: 150,
  cost: '0.0045', // $0.0045
});
```

## 7. Upgrade/Downgrade Subscription

### Immediate Upgrade

```typescript
const service = getSubscriptionService();

const updated = await service.updateSubscription(
  'user-123',
  'team', // new tier
  true    // immediate
);

console.log('Upgraded to:', updated.tier);
```

### Scheduled Downgrade

```typescript
const updated = await service.updateSubscription(
  'user-123',
  'free',  // new tier
  false    // at period end
);

console.log('Will downgrade at:', updated.currentPeriodEnd);
```

## 8. Cancel Subscription

### Cancel at Period End

```typescript
const service = getSubscriptionService();

await service.cancelSubscription(
  'user-123',
  true // cancel at period end
);

console.log('Subscription will cancel at end of billing period');
```

### Cancel Immediately

```typescript
await service.cancelSubscription(
  'user-123',
  false // cancel immediately
);

console.log('Subscription cancelled immediately');
```

## 9. Generate Invoice

```typescript
import { getInvoiceService } from '@/lib/billing/invoice-service';

const invoiceService = getInvoiceService();

const invoice = await invoiceService.generateInvoice({
  userId: 'user-123',
  subscriptionId: 'sub-456',
  tier: 'pro',
  billingPeriodStart: new Date('2025-01-01'),
  billingPeriodEnd: new Date('2025-01-31'),
});

console.log('Invoice number:', invoice.invoiceNumber);
console.log('Base amount: ₹', invoice.baseAmount / 100);
console.log('GST (18%): ₹', invoice.gstAmount / 100);
console.log('Total: ₹', invoice.totalAmount / 100);
```

## 10. Using API Endpoints

### Create Subscription via API

```typescript
const response = await fetch('/api/billing/subscribe', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tier: 'pro',
    userName: 'John Doe',
    userEmail: 'john@example.com',
  }),
});

const data = await response.json();
console.log('Subscription:', data.subscription);
```

### Generate Payment Link via API

```typescript
const response = await fetch('/api/billing/payment-link', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tier: 'pro',
    callbackUrl: 'https://yourapp.com/success',
  }),
});

const data = await response.json();
console.log('Payment link:', data.paymentLink.shortUrl);
```

### Get Subscription via API

```typescript
const response = await fetch('/api/billing/subscription');
const data = await response.json();

console.log('Subscription:', data.subscription);
console.log('Usage:', data.usage);
```

### Update Subscription via API

```typescript
const response = await fetch('/api/billing/subscription', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tier: 'team',
    immediate: true,
  }),
});

const data = await response.json();
console.log('Updated:', data.subscription);
```

### Cancel Subscription via API

```typescript
const response = await fetch('/api/billing/subscription', {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    cancelAtPeriodEnd: true,
  }),
});

const data = await response.json();
console.log(data.message);
```

## 11. Handle Webhooks

Webhooks are automatically handled by `/api/billing/webhook`. Configure in Razorpay dashboard:

1. Go to Settings → Webhooks
2. Add URL: `https://yourdomain.com/api/billing/webhook`
3. Select events:
   - subscription.activated
   - subscription.charged
   - subscription.cancelled
   - subscription.completed
   - subscription.paused
   - subscription.resumed
   - payment.failed
4. Save webhook secret to `RAZORPAY_WEBHOOK_SECRET`

## 12. Complete Payment Flow Example

```typescript
// 1. User selects a plan
const tier = 'pro';

// 2. Generate payment link
const response = await fetch('/api/billing/payment-link', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tier,
    callbackUrl: `${window.location.origin}/billing/success`,
  }),
});

const { paymentLink } = await response.json();

// 3. Redirect user to payment
window.location.href = paymentLink.shortUrl;

// 4. After payment, user is redirected to /billing/success
// with query params: razorpay_payment_id, razorpay_order_id, razorpay_signature

// 5. Verify payment
const verifyResponse = await fetch('/api/billing/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    razorpayOrderId: params.get('razorpay_order_id'),
    razorpayPaymentId: params.get('razorpay_payment_id'),
    razorpaySignature: params.get('razorpay_signature'),
    tier,
  }),
});

const { verified, subscription } = await verifyResponse.json();

if (verified) {
  console.log('Payment successful! Subscription active:', subscription);
}
```

## 13. Integrate with Rate Limiting

```typescript
import { getRateLimiter } from '@/lib/rate-limit';
import { getSubscriptionService } from '@/lib/billing/subscription-service';

// Get user's subscription tier
const subscriptionService = getSubscriptionService();
const subscription = await subscriptionService.getSubscription(userId);
const tier = subscription?.tier || 'free';

// Check rate limit based on tier
const limiter = getRateLimiter();
const result = await limiter.checkLimit({
  userId,
  tier,
  window: 3600,
  maxRequests: tier === 'free' ? 10 : tier === 'pro' ? 100 : -1,
});

if (!result.allowed) {
  // Show upgrade prompt
  console.log('Rate limit exceeded. Upgrade to continue!');
}
```

## 14. Track AI Usage for Billing

```typescript
import { getSubscriptionService } from '@/lib/billing/subscription-service';
import { calculateCost } from '@/lib/ai/providers';

// After AI request
const response = await aiProvider.generateText({...});

// Calculate cost
const cost = calculateCost(
  'gpt-4',
  response.usage.promptTokens,
  response.usage.completionTokens
);

// Log usage
const subscriptionService = getSubscriptionService();
await subscriptionService.logUsage({
  userId: session.user.id,
  chatId: chatId,
  modelId: 'gpt-4',
  promptTokens: response.usage.promptTokens,
  completionTokens: response.usage.completionTokens,
  totalTokens: response.usage.totalTokens,
  cost: cost.toFixed(6),
});
```

## Pricing Reference

| Plan | Monthly (INR) | GST (18%) | Total | USD Equivalent |
|------|---------------|-----------|-------|----------------|
| Free | ₹0 | ₹0 | ₹0 | $0 |
| Pro | ₹24 | ₹4.32 | ₹28.32 | ~$0.34 |
| Team | ₹65/user | ₹11.70 | ₹76.70 | ~$0.92 |
| Enterprise | Custom | Custom | Custom | Custom |

## Testing

### Test Mode

Razorpay provides test mode for development:

```env
# Test credentials
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
```

### Test Cards

Use these test cards in Razorpay test mode:

- **Success**: 4111 1111 1111 1111
- **Failure**: 4000 0000 0000 0002
- CVV: Any 3 digits
- Expiry: Any future date

### Test UPI

Use test UPI IDs:
- `success@razorpay`
- `failure@razorpay`

## Common Patterns

### Check if User Has Active Subscription

```typescript
const service = getSubscriptionService();
const subscription = await service.getSubscription(userId);

const hasActiveSubscription = 
  subscription && 
  subscription.status === 'active' &&
  subscription.tier !== 'free';

if (hasActiveSubscription) {
  // Allow premium features
}
```

### Show Upgrade Prompt

```typescript
const subscription = await service.getSubscription(userId);

if (!subscription || subscription.tier === 'free') {
  // Show upgrade modal
  showUpgradeModal({
    currentTier: 'free',
    recommendedTier: 'pro',
    benefits: ['1000 messages/day', '50 projects', 'Priority support'],
  });
}
```

## Troubleshooting

### "Razorpay credentials not configured"

Make sure you have set:
```env
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
```

### "Invalid signature"

Check that your webhook secret is correct:
```env
RAZORPAY_WEBHOOK_SECRET=...
```

### Webhook not receiving events

1. Check webhook URL is publicly accessible
2. Verify webhook is active in Razorpay dashboard
3. Check webhook secret matches
4. Use ngrok for local testing

## Next Steps

- Implement subscription dashboard UI
- Add email notifications
- Create invoice PDF generation
- Build usage analytics charts
- Add team billing features

## Support

For issues:
- Check Razorpay documentation: https://razorpay.com/docs/
- Review Phase 2 completion report
- Check API endpoint responses for error details
