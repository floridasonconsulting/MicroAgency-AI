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
CREATE INDEX idx_number_requests_status ON number_requests(status);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE number_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_settings ENABLE ROW LEVEL SECURITY;

-- Permissive policies for development
CREATE POLICY "Allow all for clients" ON clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for leads" ON leads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for prospects" ON prospects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for number_requests" ON number_requests FOR ALL USING (true) WITH CHECK (true);
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
