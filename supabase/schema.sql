-- MicroAgency-AI Database Schema
-- Run this in Supabase SQL Editor to initialize the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- DROP EXISTING TABLES (CASCADE handles policies, triggers, indexes)
-- ============================================
DROP TABLE IF EXISTS number_requests CASCADE;
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS prospects CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS agency_settings CASCADE;

-- Drop trigger function if exists
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- ============================================
-- CLIENTS TABLE
-- Stores customer businesses using the AI service
-- ============================================
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID UNIQUE, -- Link to Supabase auth.users
  business_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  niche TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'onboarding' CHECK (status IN ('active', 'onboarding', 'churned')),
  subscription_tier TEXT DEFAULT '$197/mo' CHECK (subscription_tier IN ('$197/mo', '$297/mo', '$497/mo')),
  mrr INTEGER DEFAULT 197,
  avatar TEXT,
  ai_phone_number TEXT,
  forwarding_status TEXT DEFAULT 'pending' CHECK (forwarding_status IN ('verified', 'pending', 'failed')),
  config JSONB DEFAULT '{
    "enabled": false,
    "businessName": "",
    "niche": "",
    "customGreeting": "",
    "qualificationQuestions": [],
    "voiceEnabled": false,
    "voiceId": "alloy",
    "voiceGreeting": ""
  }'::jsonb,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- LEADS TABLE
-- Stores captured leads for each client
-- ============================================
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT DEFAULT 'Unknown',
  phone TEXT NOT NULL,
  service_type TEXT,
  urgency TEXT DEFAULT 'medium' CHECK (urgency IN ('low', 'medium', 'emergency')),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'qualified', 'booked', 'closed')),
  booking_date TIMESTAMPTZ,
  conversation_history JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PROSPECTS TABLE
-- Stores outbound sales targets discovered by Lead Finder
-- ============================================
CREATE TABLE prospects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  rating NUMERIC DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  has_website BOOLEAN DEFAULT false,
  pain_points TEXT[] DEFAULT '{}',
  outreach_status TEXT DEFAULT 'new' CHECK (outreach_status IN ('new', 'contacted')),
  map_url TEXT,
  notes TEXT,
  campaign_status TEXT DEFAULT 'idle' CHECK (campaign_status IN ('idle', 'active', 'waiting_reply', 'replied', 'converted', 'cold')),
  campaign_step TEXT,
  campaign_logs JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- NUMBER REQUESTS TABLE
-- Admin approval queue for Twilio number provisioning
-- ============================================
CREATE TABLE number_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'provisioned')),
  requested_area_code TEXT,
  notes TEXT,
  admin_notes TEXT,
  provisioned_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- ============================================
-- CAMPAIGN TEMPLATES TABLE
-- Stores reusable campaign sequences
-- ============================================
CREATE TABLE campaign_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  niche TEXT NOT NULL,
  description TEXT,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CAMPAIGN RUNS TABLE
-- Tracks active campaigns for each prospect
-- ============================================
CREATE TABLE campaign_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prospect_id UUID NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
  template_id UUID REFERENCES campaign_templates(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'converted', 'cold')),
  current_step INTEGER DEFAULT 0,
  next_action_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  logs JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PROSPECT MESSAGES TABLE
-- Stores all inbound/outbound messages for prospects
-- ============================================
CREATE TABLE prospect_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prospect_id UUID NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'voice')),
  content TEXT NOT NULL,
  ai_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AGENCY SETTINGS TABLE
-- Stores agency-wide configuration
-- ============================================
CREATE TABLE agency_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_leads_client_id ON leads(client_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_prospects_campaign_status ON prospects(campaign_status);
CREATE INDEX idx_prospects_email ON prospects(email);
CREATE INDEX idx_number_requests_status ON number_requests(status);
CREATE INDEX idx_campaign_runs_prospect_id ON campaign_runs(prospect_id);
CREATE INDEX idx_campaign_runs_status ON campaign_runs(status);
CREATE INDEX idx_campaign_runs_next_action ON campaign_runs(next_action_at);
CREATE INDEX idx_prospect_messages_prospect_id ON prospect_messages(prospect_id);

-- ============================================
-- CALL TRANSCRIPTS TABLE
-- Stores AI receptionist call sessions and transcripts
-- ============================================
CREATE TABLE call_transcripts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  caller_phone TEXT NOT NULL,
  caller_name TEXT,
  call_sid TEXT, -- Twilio Call SID
  start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  duration INTEGER, -- in seconds
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'missed', 'voicemail')),
  outcome TEXT CHECK (outcome IN ('booked', 'callback', 'information', 'no_answer')),
  lead_captured BOOLEAN DEFAULT false,
  appointment_booked TIMESTAMPTZ,
  transcript JSONB DEFAULT '[]', -- Array of {role, content, timestamp}
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SMS CONVERSATIONS TABLE
-- Stores AI receptionist SMS conversations
-- ============================================
CREATE TABLE sms_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  customer_phone TEXT NOT NULL,
  customer_name TEXT,
  messages JSONB DEFAULT '[]', -- Array of {id, direction, content, timestamp, aiGenerated}
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'escalated')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for new tables
CREATE INDEX idx_call_transcripts_client_id ON call_transcripts(client_id);
CREATE INDEX idx_call_transcripts_caller_phone ON call_transcripts(caller_phone);
CREATE INDEX idx_call_transcripts_status ON call_transcripts(status);
CREATE INDEX idx_sms_conversations_client_id ON sms_conversations(client_id);
CREATE INDEX idx_sms_conversations_customer_phone ON sms_conversations(customer_phone);

-- ============================================
-- COMMUNICATION EVENTS TABLE
-- Logs all inbound/outbound communications
-- ============================================
CREATE TABLE communication_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prospect_id UUID REFERENCES prospects(id) ON DELETE SET NULL,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  customer_id TEXT, -- Phone number or email of customer
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'voice')),
  content TEXT NOT NULL,
  subject TEXT, -- For emails
  metadata JSONB DEFAULT '{}',
  ai_handled BOOLEAN DEFAULT false,
  escalated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- OWNER NOTIFICATIONS TABLE
-- Alerts for business owners
-- ============================================
CREATE TABLE owner_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('new_lead', 'reply', 'booking', 'escalation', 'missed_call')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  action_url TEXT,
  related_event_id UUID REFERENCES communication_events(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for communication tables
CREATE INDEX idx_comm_events_client_id ON communication_events(client_id);
CREATE INDEX idx_comm_events_prospect_id ON communication_events(prospect_id);
CREATE INDEX idx_comm_events_customer_id ON communication_events(customer_id);
CREATE INDEX idx_comm_events_created_at ON communication_events(created_at);
CREATE INDEX idx_owner_notifications_client_id ON owner_notifications(client_id);
CREATE INDEX idx_owner_notifications_read ON owner_notifications(read);

-- ============================================
-- APPOINTMENTS TABLE
-- Booking appointments with calendar sync
-- ============================================
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  
  -- Customer info
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_email TEXT,
  
  -- Customer communication preference
  customer_contact_pref TEXT DEFAULT 'both' CHECK (customer_contact_pref IN ('email', 'sms', 'both', 'none')),
  
  -- Scheduling
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  service_type TEXT,
  location TEXT,
  notes TEXT,
  
  -- Status
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show', 'rescheduled')),
  
  -- Confirmation & Reminders sent flags
  confirmation_email_sent BOOLEAN DEFAULT false,
  confirmation_sms_sent BOOLEAN DEFAULT false,
  reminder_24h_email_sent BOOLEAN DEFAULT false,
  reminder_24h_sms_sent BOOLEAN DEFAULT false,
  reminder_1h_email_sent BOOLEAN DEFAULT false,
  reminder_1h_sms_sent BOOLEAN DEFAULT false,
  
  -- Calendar sync
  calendar_provider TEXT CHECK (calendar_provider IN ('google', 'outlook', 'apple', 'none')),
  google_event_id TEXT,
  outlook_event_id TEXT,
  ics_file_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- APPOINTMENT REMINDERS TABLE
-- Tracks scheduled reminders
-- ============================================
CREATE TABLE appointment_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('confirmation', '24h', '1h', 'follow_up')),
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms')),
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'skipped')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CLIENT CALENDAR SETTINGS TABLE
-- Subscriber booking preferences
-- ============================================
CREATE TABLE client_calendar_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE UNIQUE,
  
  -- Scheduling defaults
  default_duration_minutes INTEGER DEFAULT 60,
  buffer_minutes INTEGER DEFAULT 15,
  available_start_time TIME DEFAULT '08:00',
  available_end_time TIME DEFAULT '18:00',
  timezone TEXT DEFAULT 'America/New_York',
  
  -- Working days (array of 0-6, Sunday=0)
  working_days INTEGER[] DEFAULT '{1,2,3,4,5}',
  
  -- Confirmation & Reminder settings (subscriber configurable)
  send_customer_confirmation BOOLEAN DEFAULT true,
  send_customer_reminders BOOLEAN DEFAULT true,
  send_24h_reminder BOOLEAN DEFAULT true,
  send_1h_reminder BOOLEAN DEFAULT true,
  send_follow_up BOOLEAN DEFAULT false,
  
  -- Subscriber's preferred calendar
  calendar_provider TEXT DEFAULT 'none' CHECK (calendar_provider IN ('google', 'outlook', 'apple', 'none')),
  google_calendar_id TEXT,
  outlook_calendar_id TEXT,
  
  -- OAuth tokens (encrypted in production)
  google_refresh_token TEXT,
  outlook_refresh_token TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for appointment tables
CREATE INDEX idx_appointments_client_id ON appointments(client_id);
CREATE INDEX idx_appointments_scheduled_at ON appointments(scheduled_at);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointment_reminders_appointment_id ON appointment_reminders(appointment_id);
CREATE INDEX idx_appointment_reminders_scheduled_for ON appointment_reminders(scheduled_for);
CREATE INDEX idx_appointment_reminders_status ON appointment_reminders(status);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE number_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospect_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_settings ENABLE ROW LEVEL SECURITY;

-- Permissive policies for development
CREATE POLICY "Allow all for clients" ON clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for leads" ON leads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for prospects" ON prospects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for number_requests" ON number_requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for campaign_templates" ON campaign_templates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for campaign_runs" ON campaign_runs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for prospect_messages" ON prospect_messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for agency_settings" ON agency_settings FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prospects_updated_at
  BEFORE UPDATE ON prospects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_number_requests_updated_at
  BEFORE UPDATE ON number_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaign_templates_updated_at
  BEFORE UPDATE ON campaign_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaign_runs_updated_at
  BEFORE UPDATE ON campaign_runs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

