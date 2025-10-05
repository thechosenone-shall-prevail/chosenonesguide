# Enterprise AI Development Platform - Documentation

## Overview

Welcome to the Enterprise AI Development Platform documentation! This platform combines multi-agent AI orchestration, collaborative coding, and enterprise features to revolutionize AI-powered development.

## Project Status

| Phase | Status | Description |
|-------|--------|-------------|
| **Phase 1** | ✅ Complete | Foundation & Multi-Agent System |
| **Phase 2** | ✅ Complete | Billing & Subscriptions |
| **Phase 3** | 🔄 Next | Code Generation & Execution |
| **Phase 4** | 📋 Planned | Collaborative Coding Rooms |
| **Phase 5** | 📋 Planned | Premium Features |
| **Phase 6** | 📋 Planned | Polish & Launch |

## Phase Documentation

### ✅ Phase 1: Foundation & Multi-Agent System
**Status**: Complete | **[View Docs](./phase1/)**

**What Was Built**:
- 10 specialized AI agents (Architect, Coder, Frontend, Backend, etc.)
- Multi-model AI support (OpenAI, Anthropic, Google AI)
- Enterprise rate limiting (4 subscription tiers)
- Enhanced database schema (14 new tables)
- Updated branding

**Key Features**:
- Agent orchestration and coordination
- Automatic model fallback
- Redis-based rate limiting
- Usage tracking

**Quick Links**:
- [Phase 1 README](./phase1/README_PHASE1.md)
- [Installation Guide](./phase1/PHASE1_INSTALLATION.md)
- [Quick Start](./phase1/PHASE1_QUICK_START.md)
- [Completion Report](./phase1/PHASE1_COMPLETION.md)

---

### ✅ Phase 2: Billing & Subscriptions
**Status**: Complete | **[View Docs](./phase2/)**

**What Was Built**:
- Complete Razorpay integration
- Subscription management (create, upgrade, cancel)
- Payment processing (UPI, Cards, NetBanking)
- Webhook automation (7 events)
- Usage tracking and analytics
- Invoice generation with GST

**Key Features**:
- 4 subscription tiers with GST
- Multiple payment methods
- Automatic webhook handling
- Usage-based billing

**Quick Links**:
- [Phase 2 README](./phase2/README.md)
- [Quick Start](./phase2/PHASE2_QUICK_START.md)
- [Completion Report](./phase2/PHASE2_COMPLETION.md)

---

### 🔄 Phase 3: Code Generation & Execution
**Status**: Next | **Coming Soon**

**What Will Be Built**:
- Project generator service
- WebContainers integration
- Code execution sandbox
- File system management
- Terminal integration
- Preview server
- Deployment pipeline

---

### 📋 Phase 4: Collaborative Coding Rooms
**Status**: Planned

**What Will Be Built**:
- Real-time code synchronization
- Monaco editor integration
- Socket.io setup
- Multi-user collaboration
- Room management
- Agent integration in rooms

---

### 📋 Phase 5: Premium Features
**Status**: Planned

**What Will Be Built**:
- 12 vibe themes
- Development analytics dashboard
- Premium UX features
- Custom theme builder
- Advanced metrics

---

### 📋 Phase 6: Polish & Launch
**Status**: Planned

**What Will Be Built**:
- Comprehensive testing
- Documentation
- Performance optimization
- Beta launch preparation

---

## Quick Start

### 1. Installation

```bash
# Install Phase 1 dependencies
npm install openai @anthropic-ai/sdk @google/generative-ai

# Install Phase 2 dependencies
npm install razorpay
```

### 2. Environment Setup

```env
# AI Providers (Phase 1)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_AI_API_KEY=...

# Database (Phase 1)
POSTGRES_URL=...
KV_URL=...

# Razorpay (Phase 2)
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
```

### 3. Database Migration

```bash
npx drizzle-kit push
```

### 4. Start Using

```typescript
// Phase 1: Agent Orchestration
import { getAgentCoordinator } from '@/lib/ai/agents/coordinator';
const coordinator = getAgentCoordinator();
const team = await coordinator.initializeAgents('project-id');

// Phase 2: Subscription Management
import { getSubscriptionService } from '@/lib/billing/subscription-service';
const service = getSubscriptionService();
const subscription = await service.createSubscription({...});
```

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                   Client Layer (Next.js)                 │
│  React Components + Framer Motion + Radix UI            │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│              API Layer (Next.js Routes)                  │
│  /api/chat, /api/billing, /api/rooms, /api/projects    │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                    Service Layer                         │
│  • Agent Coordinator (Phase 1)                          │
│  • AI Provider Manager (Phase 1)                        │
│  • Rate Limiter (Phase 1)                               │
│  • Subscription Service (Phase 2)                       │
│  • Invoice Service (Phase 2)                            │
│  • Code Generator (Phase 3)                             │
│  • Room Manager (Phase 4)                               │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                     Data Layer                           │
│  • Vercel Postgres (Primary DB)                         │
│  • Vercel KV (Redis - Rate Limits, Sessions)           │
│  • Vercel Blob (File Storage)                           │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                  External Services                       │
│  • OpenAI, Anthropic, Google AI (Phase 1)              │
│  • Razorpay (Phase 2)                                   │
│  • Vercel, Netlify, Railway (Phase 3)                  │
└─────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: Radix UI
- **Animations**: Framer Motion

### Backend
- **Runtime**: Node.js
- **API**: Next.js API Routes
- **Real-time**: Socket.io (Phase 4)

### Database
- **Primary DB**: Vercel Postgres
- **ORM**: Drizzle ORM
- **Cache**: Vercel KV (Redis)
- **File Storage**: Vercel Blob

### AI & ML
- **Providers**: OpenAI, Anthropic, Google AI
- **Models**: GPT-4, Claude, Gemini
- **Orchestration**: Custom multi-agent system

### Payments
- **Gateway**: Razorpay
- **Methods**: UPI, Cards, NetBanking, Wallets
- **Compliance**: GST (18%)

### Code Execution (Phase 3)
- **Node.js**: WebContainers
- **Python**: Pyodide
- **Sandbox**: Isolated environments

## Features by Phase

### Phase 1 Features
✅ 10 specialized AI agents
✅ 6 AI models across 3 providers
✅ Automatic model fallback
✅ 4 subscription tiers
✅ Redis-based rate limiting
✅ Usage tracking
✅ 14 database tables

### Phase 2 Features
✅ Razorpay integration
✅ Subscription management
✅ Payment processing
✅ Webhook automation
✅ Invoice generation
✅ GST compliance
✅ Usage analytics

### Phase 3 Features (Coming)
🔄 Project generation
🔄 Code execution
🔄 File management
🔄 Terminal access
🔄 Live preview
🔄 Deployment

### Phase 4 Features (Planned)
📋 Real-time collaboration
📋 Code synchronization
📋 Monaco editor
📋 Room management
📋 Voice chat
📋 Screen sharing

### Phase 5 Features (Planned)
📋 12 vibe themes
📋 Analytics dashboard
📋 Custom themes
📋 Premium UX
📋 Advanced metrics

### Phase 6 Features (Planned)
📋 Testing & QA
📋 Documentation
📋 Performance optimization
📋 Beta launch

## Subscription Tiers

| Feature | Free | Pro | Team | Enterprise |
|---------|------|-----|------|------------|
| **Price** | ₹0 | ₹28.32/mo | ₹76.70/user/mo | Custom |
| **Messages/Day** | 50 | 1,000 | Unlimited* | Unlimited |
| **Projects/Month** | 3 | 50 | Unlimited | Unlimited |
| **Concurrent Rooms** | 1 | 5 | Unlimited | Unlimited |
| **Storage** | 100 MB | 10 GB | 100 GB | Unlimited |
| **AI Models** | Basic | All | All + Priority | All + Custom |
| **Support** | Community | Email | Dedicated | 24/7 + SLA |

*Team tier has 500 messages/hour limit

## API Reference

### Phase 1 APIs
- Agent orchestration
- AI provider management
- Rate limiting
- Usage tracking

### Phase 2 APIs
- `POST /api/billing/subscribe` - Create subscription
- `POST /api/billing/payment-link` - Generate payment link
- `POST /api/billing/verify` - Verify payment
- `POST /api/billing/webhook` - Handle webhooks
- `GET /api/billing/subscription` - Get subscription
- `PUT /api/billing/subscription` - Update subscription
- `DELETE /api/billing/subscription` - Cancel subscription

### Phase 3 APIs (Coming)
- Project generation
- Code execution
- File operations
- Deployment

## Development

### Prerequisites
- Node.js 18+
- PostgreSQL (Vercel Postgres)
- Redis (Vercel KV)
- Razorpay account

### Setup

```bash
# Clone repository
git clone <repo-url>

# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Add your API keys

# Run migrations
npx drizzle-kit push

# Start development server
npm run dev
```

### Testing

```bash
# Run tests
npm test

# Run type check
npm run type-check

# Run linter
npm run lint
```

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

### Environment Variables

Set these in Vercel dashboard:
- All Phase 1 variables
- All Phase 2 variables
- Database URLs
- API keys

## Support & Resources

### Documentation
- [Phase 1 Docs](./phase1/)
- [Phase 2 Docs](./phase2/)
- [API Reference](#api-reference)

### External Resources
- [Next.js Docs](https://nextjs.org/docs)
- [Razorpay Docs](https://razorpay.com/docs/)
- [Drizzle ORM Docs](https://orm.drizzle.team/)

### Community
- GitHub Issues
- Discord (coming soon)
- Email Support

## Contributing

We welcome contributions! Please see:
- Task list in `.kiro/specs/enterprise-ai-chat-platform/tasks.md`
- Design document for architecture
- Phase completion reports for implementation details

## License

[Your License Here]

## Changelog

### Phase 2 (January 2025)
- ✅ Razorpay integration
- ✅ Subscription management
- ✅ Payment processing
- ✅ Webhook automation
- ✅ Invoice generation

### Phase 1 (January 2025)
- ✅ Multi-agent orchestration
- ✅ Multi-model AI support
- ✅ Rate limiting system
- ✅ Database schema
- ✅ Branding updates

---

**Current Status**: Phase 2 Complete ✅

**Next Up**: Phase 3 - Code Generation & Execution 🔄

**Ready to build the future of AI-powered development!**
