
export enum InteractionType {
  SMS = 'SMS',
  CALL = 'CALL',
  SYSTEM = 'SYSTEM',
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  serviceType: string;
  urgency: 'Low' | 'Medium' | 'Emergency';
  status: 'New' | 'Qualified' | 'Booked' | 'Closed';
  dateCaptured: string;
  bookingDate?: string; // ISO String for appointments
  conversationHistory: Message[];
}

export interface AutoReplyConfig {
  enabled: boolean;
  businessName: string;
  niche: string; // e.g. "Roofing", "Plumbing"
  customGreeting: string; // SMS Greeting
  qualificationQuestions: string[];
  // New Voice Specific Config
  voiceEnabled: boolean;
  voiceId?: 'alloy' | 'echo' | 'shimmer'; // Mock voice IDs
  voiceSpeed?: number;
  voiceGreeting?: string; // Spoken Greeting
}

export interface Client {
  id: string;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  niche: string; // e.g. "HVAC", "Solar"
  status: 'Active' | 'Onboarding' | 'Churned';
  subscriptionTier: '$197/mo' | '$297/mo' | '$497/mo';
  mrr: number;
  avatar: string;
  joinedDate: string;
  config: AutoReplyConfig;
  leads: Lead[];
  // New fields for Number Provisioning
  aiPhoneNumber?: string; // The virtual number (Twilio)
  forwardingStatus?: 'Verified' | 'Pending Setup' | 'Failed';
  // Stripe fields
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

export type CampaignStatus = 'Idle' | 'Active' | 'Waiting_Reply' | 'Replied' | 'Converted' | 'Cold';

export interface Prospect {
  id: string;
  businessName: string;
  email?: string;
  phone?: string;
  address: string;
  rating: number;
  reviewCount: number;
  hasWebsite: boolean;
  painPoints: string[]; // e.g. "No Website", "Bad Response Time"
  outreachStatus: 'New' | 'Contacted';
  mapUrl?: string;
  notes?: string;

  // New Automation Fields
  campaignStatus?: CampaignStatus;
  campaignStep?: string; // e.g. "Email 1 Sent", "SMS 1 Sent"
  campaignLogs?: string[]; // Audit trail
}

export interface AIResponse {
  text: string;
  loading: boolean;
  error?: string;
}

export type ViewState = 'dashboard' | 'clients' | 'prospector' | 'analytics' | 'settings' | 'subscriber-portal' | 'signup' | 'pricing' | 'login';
