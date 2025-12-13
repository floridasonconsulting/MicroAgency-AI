
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Prospect } from '../types';

// Helper to get settings from local storage
const getSettings = () => {
  const saved = localStorage.getItem('agency_settings');
  return saved ? JSON.parse(saved) : {};
};

let supabase: SupabaseClient | null = null;

export const getSupabase = () => {
  const settings = getSettings();
  if (!supabase && settings.supabaseUrl && settings.supabaseKey) {
    supabase = createClient(settings.supabaseUrl, settings.supabaseKey);
  }
  return supabase;
};

// --- DB OPERATIONS ---

export const saveProspectToDB = async (prospect: Prospect) => {
  const sb = getSupabase();
  if (!sb) return null;

  // We store the full prospect object in a JSONB column named 'data'
  // Ensure your Supabase table 'prospects' has: id (text), business_name (text), niche (text), data (jsonb)
  const { data, error } = await sb
    .from('prospects')
    .upsert({
      id: prospect.id,
      business_name: prospect.businessName,
      data: prospect,
      updated_at: new Date().toISOString()
    });

  if (error) {
    console.error("Supabase Save Error:", error);
    throw error;
  }
  return data;
};

export const fetchSavedProspects = async (): Promise<Prospect[]> => {
  const sb = getSupabase();
  if (!sb) return [];

  const { data, error } = await sb
    .from('prospects')
    .select('data');

  if (error) {
    console.error("Supabase Fetch Error:", error);
    return [];
  }

  return data.map((row: any) => row.data as Prospect);
};

export const deleteProspectFromDB = async (id: string) => {
  const sb = getSupabase();
  if (!sb) return;

  await sb.from('prospects').delete().eq('id', id);
};

// --- AUTOMATION OPERATIONS ---

export const triggerMakeWebhook = async (prospect: Prospect) => {
  const settings = getSettings();
  if (!settings.makeWebhookUrl) {
    console.log("No Make.com webhook configured. Skipping automation trigger.");
    return false;
  }

  try {
    // Fire and forget
    fetch(settings.makeWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...prospect,
        timestamp: new Date().toISOString(),
        source: 'MicroAgency_LeadFinder'
      })
    });
    return true;
  } catch (error) {
    console.error("Webhook Trigger Error:", error);
    return false;
  }
};
