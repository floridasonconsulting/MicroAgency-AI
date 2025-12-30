<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# MicroAgency AI

**AI-Powered Sales Automation Platform for Local Service Businesses**

[![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?logo=vite)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?logo=supabase)](https://supabase.com/)

</div>

---

## 📋 Overview

MicroAgency AI is a comprehensive SaaS platform that enables agencies to offer AI-powered receptionist and lead capture services to local service businesses (plumbers, HVAC, roofers, etc.). The platform handles:

- 🤖 **AI Voice Receptionist** - 24/7 call answering with natural conversation
- 💬 **AI SMS Responder** - Automated text message handling
- 📧 **Email Campaign Automation** - Multi-step outreach sequences
- 📊 **Analytics Dashboard** - Real-time metrics and conversion tracking
- 🔔 **Owner Notifications** - Instant alerts for leads and escalations

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (React + Vite)                        │
├─────────────────────────────────────────────────────────────────────────┤
│  Dashboard │ Clients │ Lead Finder │ Analytics │ Settings │ Notifications│
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    ▼                              ▼
         ┌─────────────────────┐       ┌─────────────────────┐
         │   Services Layer    │       │   External APIs     │
         ├─────────────────────┤       ├─────────────────────┤
         │ • campaignService   │       │ • Gemini AI         │
         │ • aiReceptionist    │       │ • Twilio Voice/SMS  │
         │ • communicationHub  │       │ • Resend Email      │
         │ • resendService     │       │ • Supabase DB       │
         │ • supabase          │       │ • Stripe Payments   │
         └─────────────────────┘       └─────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (optional, falls back to mock data)
- Gemini API key (for AI features)

### Installation

```bash
# Clone the repository
git clone https://github.com/floridasonconsulting/MicroAgency-AI.git
cd MicroAgency-AI

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Start development server
npm run dev
```

### Environment Variables

Create a `.env.local` file:

```env
# Required for AI features
VITE_GEMINI_API_KEY=your_gemini_api_key

# Optional - Supabase (falls back to mock data if not set)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# Optional - Email
VITE_RESEND_API_KEY=your_resend_api_key

# Optional - Payments
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

---

## 📁 Project Structure

```
MicroAgency-AI/
├── components/              # React components
│   ├── Layout.tsx          # Main layout with navigation
│   ├── Dashboard.tsx       # Agency overview
│   ├── ClientList.tsx      # Subscriber management
│   ├── ClientDetail.tsx    # Individual client view
│   ├── LeadFinder.tsx      # Prospect search tool
│   ├── MetricsDashboard.tsx# Analytics & reporting
│   ├── DemoMode.tsx        # Interactive demo
│   ├── AICallSimulator.tsx # Test AI receptionist
│   └── NotificationCenter.tsx # Owner alerts
│
├── services/                # Business logic
│   ├── supabase.ts         # Database operations
│   ├── geminiService.ts    # AI generation
│   ├── campaignService.ts  # Email/SMS campaigns
│   ├── aiReceptionistService.ts # Voice/SMS AI
│   ├── communicationHub.ts # Message routing
│   └── resendService.ts    # Email delivery
│
├── hooks/                   # React hooks
│   └── useData.ts          # Data fetching hooks
│
├── types.ts                 # TypeScript definitions
├── App.tsx                  # Main app component
└── supabase/
    └── schema.sql          # Database schema
```

---

## 🔄 Core Workflows

### 1. Client Onboarding Flow

```
Prospect signs up → Stripe payment → Phone number provisioned → AI activated
                           │
                           ▼
              ┌─────────────────────────┐
              │   Onboarding Wizard     │
              │  • Business details     │
              │  • Niche selection      │
              │  • Greeting config      │
              │  • Number forwarding    │
              └─────────────────────────┘
```

### 2. AI Receptionist Flow

```
Customer Call ──► Twilio ──► TwiML Webhook ──► AI Receptionist Service
                                                       │
                    ┌──────────────────────────────────┴─────────┐
                    ▼                                             ▼
           ┌───────────────┐                            ┌─────────────────┐
           │ Gemini AI     │                            │ Fallback        │
           │ Response      │                            │ Response        │
           └───────────────┘                            └─────────────────┘
                    │
                    ▼
           ┌───────────────┐
           │ TwiML Say +   │──► Customer hears response
           │ Gather Speech │
           └───────────────┘
                    │
                    ▼
           ┌───────────────┐
           │ Lead Captured │──► Owner Notification
           │ Transcript    │──► Database
           └───────────────┘
```

### 3. Campaign Automation Flow

```
Prospect Added ──► Campaign Launched ──► Step Executor
                                              │
                    ┌─────────────────────────┼─────────────────────┐
                    ▼                         ▼                     ▼
             ┌──────────┐              ┌──────────┐          ┌──────────┐
             │  Email   │              │   SMS    │          │   Wait   │
             │  Step    │              │   Step   │          │   Step   │
             └──────────┘              └──────────┘          └──────────┘
                    │                         │
                    ▼                         ▼
             ┌──────────────────────────────────────┐
             │        Communication Hub             │
             │  • Store message                     │
             │  • Track prospect status             │
             │  • Handle replies                    │
             └──────────────────────────────────────┘
```

### 4. Communication Middleware Flow

```
OUTBOUND:
  Campaign/System ──► sendSystemEmail() ──► Customer
                      (Reply-To: reply+{id}@mail.microagency.ai)

INBOUND:
  Customer Reply ──► Webhook ──► handleInboundEmail/SMS()
        │
        ├──► Parse prospect ID
        ├──► Store in communication_events
        ├──► Check escalation keywords
        │         │
        │    Yes ─┴──► escalateToOwner() ──► owner_notifications
        │
        └──► No ─────► generateAIResponse() ──► Send reply
```

---

## 🗄️ Database Schema

### Core Tables

| Table | Purpose |
|-------|---------|
| `clients` | Subscriber businesses |
| `leads` | Captured customer inquiries |
| `prospects` | Outreach targets |
| `campaign_templates` | Email/SMS sequence templates |
| `campaign_runs` | Active campaign instances |
| `prospect_messages` | Campaign message history |

### AI Receptionist Tables

| Table | Purpose |
|-------|---------|
| `call_transcripts` | Voice call sessions & transcripts |
| `sms_conversations` | SMS conversation threads |

### Communication Hub Tables

| Table | Purpose |
|-------|---------|
| `communication_events` | All inbound/outbound messages |
| `owner_notifications` | Business owner alert queue |

---

## 🔌 External Integrations

### Gemini AI

Used for:
- AI receptionist voice/SMS responses
- Campaign message personalization
- Outreach script generation

```typescript
// services/aiReceptionistService.ts
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
  { method: 'POST', body: JSON.stringify({ contents, systemInstruction }) }
);
```

### Twilio

Used for:
- Phone number provisioning
- Inbound/outbound voice calls
- SMS messaging

Webhook endpoints:
- Voice: `/api/twilio/voice/incoming`
- SMS: `/api/twilio/sms/incoming`

### Resend

Used for:
- Campaign email sending
- Demo/welcome emails
- System notifications

### Stripe

Used for:
- Subscription payments ($197/mo plan)
- Payment method management

---

## 🎯 Key Features by View

### Dashboard (`/dashboard`)
- MRR tracking
- Active client count
- Lead capture metrics
- Revenue growth chart
- Try Demo button

### Subscribers (`/clients`)
- Client directory
- Status filters (Active/Trial/Churned)
- Click into client detail view

### Client Detail
- AI Simulator (test conversations)
- Captured leads list
- AI configuration
- Growth tools (outreach scripts)
- Portal dropdown:
  - View Demo Dashboard
  - Test AI Receptionist
  - Legacy Portal

### Lead Finder (`/prospector`)
- Google Maps integration
- Pain point detection
- Campaign automation launch
- Conversation history

### Analytics (`/analytics`)
- 6 metric cards
- Performance trend chart
- Conversion funnel
- Niche breakdown pie chart
- Client performance table

### Notifications (Header Bell)
- Real-time alerts
- New leads
- Customer replies
- Escalations
- Missed calls

---

## 🧪 Testing

### Run Tests
```bash
npm run test
```

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

---

## 🚢 Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Docker
```bash
docker build -t microagency-ai .
docker run -p 3000:3000 microagency-ai
```

---

## 📝 Configuration

### Agency Settings (In-App)
Navigate to **System Config** to set:
- Supabase URL & API Key
- Make.com Webhook URL
- Twilio Account SID & Auth Token
- Stripe Keys
- Resend API Key

### Niche-Specific Prompts
Edit `services/aiReceptionistService.ts` to customize AI behavior per niche:
- Plumbing
- HVAC
- Roofing
- Custom

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

---

## 📄 License

Proprietary - Florida Son Consulting LLC

---

## 🆘 Support

For support, email support@floridasonconsulting.com or open an issue on GitHub.
