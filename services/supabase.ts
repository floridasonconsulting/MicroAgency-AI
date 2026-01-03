import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Client, Lead, Prospect, Message } from '../types';

// ============================================
// SUPABASE CLIENT INITIALIZATION
// ============================================

let supabaseInstance: SupabaseClient | null = null;

/**
 * Get or create Supabase client instance
 * Reads credentials from localStorage (set in Settings) or .env fallback
 */
export const getSupabase = (): SupabaseClient | null => {
  // First try localStorage (UI-configured settings)
  const saved = localStorage.getItem('agency_settings');
  let supabaseUrl = '';
  let supabaseKey = '';

  if (saved) {
    const settings = JSON.parse(saved);
    supabaseUrl = settings.supabaseUrl || '';
    supabaseKey = settings.supabaseKey || '';
  }

  // Fallback to environment variables if localStorage is empty
  if (!supabaseUrl) {
    supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    console.log('📦 Using env VITE_SUPABASE_URL:', supabaseUrl ? '✓ Found' : '✗ Not set');
  }
  if (!supabaseKey) {
    supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
    console.log('📦 Using env VITE_SUPABASE_ANON_KEY:', supabaseKey ? '✓ Found' : '✗ Not set');
  }

  if (!supabaseUrl || !supabaseKey) {
    console.log('⚠️ Supabase not configured - running in demo mode');
    return null;
  }

  // Validate key format - Supabase anon keys are JWTs starting with 'eyJ'
  if (!supabaseKey.startsWith('eyJ')) {
    console.error(
      '❌ Invalid Supabase API Key format. The key should be a JWT starting with "eyJ...".\n' +
      '   Go to Supabase Dashboard > Project Settings > API and copy the "anon public" key.'
    );
    return null;
  }

  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(supabaseUrl, supabaseKey);
    } catch (err) {
      console.error('Failed to create Supabase client:', err);
      return null;
    }
  }
  return supabaseInstance;
};

/**
 * Check if Supabase is configured and available
 */
export const isSupabaseConfigured = (): boolean => {
  return getSupabase() !== null;
};

// ============================================
// CLIENT OPERATIONS
// ============================================

/**
 * Fetch all clients from database
 */
export const fetchClients = async (): Promise<Client[]> => {
  const sb = getSupabase();
  if (!sb) return [];

  const { data, error } = await sb
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Supabase fetchClients error:', error);
    return [];
  }

  return data.map(mapDbClientToClient);
};

/**
 * Fetch a single client by ID
 */
export const fetchClientById = async (id: string): Promise<Client | null> => {
  const sb = getSupabase();
  if (!sb) return null;

  const { data, error } = await sb
    .from('clients')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Supabase fetchClientById error:', error);
    return null;
  }

  return mapDbClientToClient(data);
};

/**
 * Create a new client
 */
export const createClientRecord = async (client: Omit<Client, 'id' | 'leads'>): Promise<Client | null> => {
  const sb = getSupabase();
  if (!sb) return null;

  const dbClient = {
    business_name: client.businessName,
    owner_name: client.ownerName,
    email: client.email,
    phone: client.phone,
    niche: client.niche,
    status: client.status.toLowerCase(),
    subscription_tier: client.subscriptionTier,
    mrr: client.mrr,
    avatar: client.avatar,
    ai_phone_number: client.aiPhoneNumber,
    forwarding_status: client.forwardingStatus?.toLowerCase().replace(' ', '_'),
    config: client.config,
  };

  const { data, error } = await sb
    .from('clients')
    .insert(dbClient)
    .select()
    .single();

  if (error) {
    console.error('Supabase createClient error:', error);
    return null;
  }

  return mapDbClientToClient(data);
};

/**
 * Update an existing client
 */
export const updateClient = async (id: string, updates: Partial<Client>): Promise<Client | null> => {
  const sb = getSupabase();
  if (!sb) return null;

  const dbUpdates: Record<string, unknown> = {};
  if (updates.businessName !== undefined) dbUpdates.business_name = updates.businessName;
  if (updates.ownerName !== undefined) dbUpdates.owner_name = updates.ownerName;
  if (updates.email !== undefined) dbUpdates.email = updates.email;
  if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
  if (updates.niche !== undefined) dbUpdates.niche = updates.niche;
  if (updates.status !== undefined) dbUpdates.status = updates.status.toLowerCase();
  if (updates.subscriptionTier !== undefined) dbUpdates.subscription_tier = updates.subscriptionTier;
  if (updates.mrr !== undefined) dbUpdates.mrr = updates.mrr;
  if (updates.avatar !== undefined) dbUpdates.avatar = updates.avatar;
  if (updates.aiPhoneNumber !== undefined) dbUpdates.ai_phone_number = updates.aiPhoneNumber;
  if (updates.forwardingStatus !== undefined) dbUpdates.forwarding_status = updates.forwardingStatus?.toLowerCase().replace(' ', '_');
  if (updates.config !== undefined) dbUpdates.config = updates.config;

  const { data, error } = await sb
    .from('clients')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Supabase updateClient error:', error);
    return null;
  }

  return mapDbClientToClient(data);
};

/**
 * Delete a client (and all associated leads via cascade)
 */
export const deleteClient = async (id: string): Promise<boolean> => {
  const sb = getSupabase();
  if (!sb) return false;

  const { error } = await sb.from('clients').delete().eq('id', id);

  if (error) {
    console.error('Supabase deleteClient error:', error);
    return false;
  }

  return true;
};

// ============================================
// LEAD OPERATIONS
// ============================================

/**
 * Fetch all leads for a specific client
 */
export const fetchLeadsByClientId = async (clientId: string): Promise<Lead[]> => {
  const sb = getSupabase();
  if (!sb) return [];

  const { data, error } = await sb
    .from('leads')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Supabase fetchLeadsByClientId error:', error);
    return [];
  }

  return data.map(mapDbLeadToLead);
};

/**
 * Create a new lead
 */
export const createLead = async (clientId: string, lead: Omit<Lead, 'id'>): Promise<Lead | null> => {
  const sb = getSupabase();
  if (!sb) return null;

  const dbLead = {
    client_id: clientId,
    name: lead.name,
    phone: lead.phone,
    service_type: lead.serviceType,
    urgency: lead.urgency.toLowerCase(),
    status: lead.status.toLowerCase(),
    booking_date: lead.bookingDate,
    conversation_history: lead.conversationHistory,
  };

  const { data, error } = await sb
    .from('leads')
    .insert(dbLead)
    .select()
    .single();

  if (error) {
    console.error('Supabase createLead error:', error);
    return null;
  }

  return mapDbLeadToLead(data);
};

/**
 * Update an existing lead
 */
export const updateLead = async (id: string, updates: Partial<Lead>): Promise<Lead | null> => {
  const sb = getSupabase();
  if (!sb) return null;

  const dbUpdates: Record<string, unknown> = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
  if (updates.serviceType !== undefined) dbUpdates.service_type = updates.serviceType;
  if (updates.urgency !== undefined) dbUpdates.urgency = updates.urgency.toLowerCase();
  if (updates.status !== undefined) dbUpdates.status = updates.status.toLowerCase();
  if (updates.bookingDate !== undefined) dbUpdates.booking_date = updates.bookingDate;
  if (updates.conversationHistory !== undefined) dbUpdates.conversation_history = updates.conversationHistory;

  const { data, error } = await sb
    .from('leads')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Supabase updateLead error:', error);
    return null;
  }

  return mapDbLeadToLead(data);
};

/**
 * Delete a lead
 */
export const deleteLead = async (id: string): Promise<boolean> => {
  const sb = getSupabase();
  if (!sb) return false;

  const { error } = await sb.from('leads').delete().eq('id', id);

  if (error) {
    console.error('Supabase deleteLead error:', error);
    return false;
  }

  return true;
};

/**
 * Add a message to lead's conversation history
 */
export const addMessageToLead = async (leadId: string, message: Message): Promise<boolean> => {
  const sb = getSupabase();
  if (!sb) return false;

  // First fetch existing history
  const { data: lead, error: fetchError } = await sb
    .from('leads')
    .select('conversation_history')
    .eq('id', leadId)
    .single();

  if (fetchError) {
    console.error('Supabase fetch lead history error:', fetchError);
    return false;
  }

  const history = lead.conversation_history || [];
  history.push(message);

  const { error } = await sb
    .from('leads')
    .update({ conversation_history: history })
    .eq('id', leadId);

  if (error) {
    console.error('Supabase addMessageToLead error:', error);
    return false;
  }

  return true;
};

// ============================================
// PROSPECT OPERATIONS
// ============================================

/**
 * Fetch all prospects with optional status filter
 */
export const fetchProspects = async (campaignStatus?: string): Promise<Prospect[]> => {
  const sb = getSupabase();
  if (!sb) return [];

  let query = sb.from('prospects').select('*').order('created_at', { ascending: false });

  if (campaignStatus) {
    query = query.eq('campaign_status', campaignStatus);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Supabase fetchProspects error:', error);
    return [];
  }

  return data.map(mapDbProspectToProspect);
};

/**
 * Save a prospect to database (upsert by business name and address)
 */
export const saveProspectToDB = async (prospect: Prospect): Promise<Prospect | null> => {
  const sb = getSupabase();
  if (!sb) return null;

  const dbProspect = {
    id: prospect.id.startsWith('p-') ? undefined : prospect.id, // Let DB generate if temp ID
    business_name: prospect.businessName,
    address: prospect.address,
    rating: prospect.rating,
    review_count: prospect.reviewCount,
    has_website: prospect.hasWebsite,
    pain_points: prospect.painPoints,
    outreach_status: prospect.outreachStatus.toLowerCase(),
    map_url: prospect.mapUrl,
    notes: prospect.notes,
    campaign_status: prospect.campaignStatus?.toLowerCase() || 'idle',
    campaign_step: prospect.campaignStep,
    campaign_logs: prospect.campaignLogs || [],
  };

  // Remove undefined id for insert
  if (!dbProspect.id) delete dbProspect.id;

  const { data, error } = await sb
    .from('prospects')
    .upsert(dbProspect, {
      onConflict: 'id',
      ignoreDuplicates: false
    })
    .select()
    .single();

  if (error) {
    console.error('Supabase saveProspectToDB error:', error);
    return null;
  }

  return mapDbProspectToProspect(data);
};

/**
 * Fetch all saved prospects (alias for fetchProspects for backwards compatibility)
 */
export const fetchSavedProspects = async (): Promise<Prospect[]> => {
  return fetchProspects();
};

/**
 * Delete a prospect
 */
export const deleteProspectFromDB = async (id: string): Promise<boolean> => {
  const sb = getSupabase();
  if (!sb) return false;

  const { error } = await sb.from('prospects').delete().eq('id', id);

  if (error) {
    console.error('Supabase deleteProspectFromDB error:', error);
    return false;
  }

  return true;
};

/**
 * Update prospect campaign status
 */
export const updateProspectCampaign = async (
  id: string,
  status: string,
  step: string,
  logs: string[]
): Promise<boolean> => {
  const sb = getSupabase();
  if (!sb) return false;

  const { error } = await sb
    .from('prospects')
    .update({
      campaign_status: status.toLowerCase(),
      campaign_step: step,
      campaign_logs: logs,
    })
    .eq('id', id);

  if (error) {
    console.error('Supabase updateProspectCampaign error:', error);
    return false;
  }

  return true;
};

// ============================================
// NUMBER REQUEST OPERATIONS
// ============================================

export interface NumberRequest {
  id: string;
  clientId: string;
  status: 'pending' | 'approved' | 'rejected' | 'provisioned';
  requestedAreaCode?: string;
  notes?: string;
  adminNotes?: string;
  provisionedNumber?: string;
  createdAt: string;
  processedAt?: string;
}

/**
 * Create a number provisioning request
 */
export const createNumberRequest = async (
  clientId: string,
  areaCode?: string,
  notes?: string
): Promise<NumberRequest | null> => {
  const sb = getSupabase();
  if (!sb) return null;

  const { data, error } = await sb
    .from('number_requests')
    .insert({
      client_id: clientId,
      requested_area_code: areaCode,
      notes: notes,
    })
    .select()
    .single();

  if (error) {
    console.error('Supabase createNumberRequest error:', error);
    return null;
  }

  return mapDbNumberRequest(data);
};

/**
 * Fetch pending number requests (for admin)
 */
export const fetchPendingNumberRequests = async (): Promise<NumberRequest[]> => {
  const sb = getSupabase();
  if (!sb) return [];

  const { data, error } = await sb
    .from('number_requests')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Supabase fetchPendingNumberRequests error:', error);
    return [];
  }

  return data.map(mapDbNumberRequest);
};

/**
 * Process a number request (approve/reject/provision)
 */
export const processNumberRequest = async (
  id: string,
  status: 'approved' | 'rejected' | 'provisioned',
  adminNotes?: string,
  provisionedNumber?: string
): Promise<boolean> => {
  const sb = getSupabase();
  if (!sb) return false;

  const updates: Record<string, unknown> = {
    status,
    admin_notes: adminNotes,
    processed_at: new Date().toISOString(),
  };

  if (provisionedNumber) {
    updates.provisioned_number = provisionedNumber;
  }

  const { error } = await sb
    .from('number_requests')
    .update(updates)
    .eq('id', id);

  if (error) {
    console.error('Supabase processNumberRequest error:', error);
    return false;
  }

  return true;
};

// ============================================
// MAKE.COM WEBHOOK INTEGRATION
// ============================================

/**
 * Trigger Make.com webhook for automation workflows
 */
export const triggerMakeWebhook = async (prospect: Prospect): Promise<boolean> => {
  const saved = localStorage.getItem('agency_settings');
  if (!saved) {
    console.log('[Make.com Webhook] No agency settings found in localStorage. Skipping webhook.');
    return false;
  }

  const settings = JSON.parse(saved);
  if (!settings.makeWebhookUrl) {
    console.log('[Make.com Webhook] No webhook URL configured in Settings > Integrations. Skipping automation trigger.');
    return false;
  }

  console.log('[Make.com Webhook] Triggering webhook for:', prospect.businessName);
  console.log('[Make.com Webhook] Webhook URL:', settings.makeWebhookUrl);

  try {
    const payload = {
      ...prospect,
      timestamp: new Date().toISOString(),
      source: 'Recepticom_LeadFinder',
    };
    console.log('[Make.com Webhook] Payload:', JSON.stringify(payload, null, 2));

    const response = await fetch(settings.makeWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      console.log('[Make.com Webhook] Successfully sent! Status:', response.status);
    } else {
      console.warn('[Make.com Webhook] Response not OK:', response.status, response.statusText);
    }

    return true;
  } catch (error) {
    console.error('[Make.com Webhook] Error:', error);
    return false;
  }
};

// ============================================
// DATA MAPPING HELPERS
// ============================================

function mapDbClientToClient(dbClient: Record<string, unknown>): Client {
  return {
    id: dbClient.id as string,
    businessName: dbClient.business_name as string,
    ownerName: dbClient.owner_name as string,
    email: dbClient.email as string,
    phone: dbClient.phone as string,
    niche: dbClient.niche as string,
    status: capitalizeFirst(dbClient.status as string) as Client['status'],
    subscriptionTier: dbClient.subscription_tier as Client['subscriptionTier'],
    mrr: dbClient.mrr as number,
    avatar: dbClient.avatar as string || `https://picsum.photos/seed/${dbClient.id}/200`,
    joinedDate: (dbClient.created_at as string).split('T')[0],
    aiPhoneNumber: dbClient.ai_phone_number as string | undefined,
    forwardingStatus: dbClient.forwarding_status
      ? capitalizeFirst((dbClient.forwarding_status as string).replace('_', ' ')) as Client['forwardingStatus']
      : undefined,
    config: dbClient.config as Client['config'],
    leads: [], // Leads are fetched separately
  };
}

function mapDbLeadToLead(dbLead: Record<string, unknown>): Lead {
  return {
    id: dbLead.id as string,
    name: dbLead.name as string,
    phone: dbLead.phone as string,
    serviceType: dbLead.service_type as string,
    urgency: capitalizeFirst(dbLead.urgency as string) as Lead['urgency'],
    status: capitalizeFirst(dbLead.status as string) as Lead['status'],
    dateCaptured: (dbLead.created_at as string).split('T')[0],
    bookingDate: dbLead.booking_date as string | undefined,
    conversationHistory: dbLead.conversation_history as Message[] || [],
  };
}

function mapDbProspectToProspect(dbProspect: Record<string, unknown>): Prospect {
  return {
    id: dbProspect.id as string,
    businessName: dbProspect.business_name as string,
    address: dbProspect.address as string,
    rating: dbProspect.rating as number,
    reviewCount: dbProspect.review_count as number,
    hasWebsite: dbProspect.has_website as boolean,
    painPoints: dbProspect.pain_points as string[],
    outreachStatus: capitalizeFirst(dbProspect.outreach_status as string) as Prospect['outreachStatus'],
    mapUrl: dbProspect.map_url as string | undefined,
    notes: dbProspect.notes as string | undefined,
    campaignStatus: dbProspect.campaign_status
      ? capitalizeFirst(dbProspect.campaign_status as string) as Prospect['campaignStatus']
      : undefined,
    campaignStep: dbProspect.campaign_step as string | undefined,
    campaignLogs: dbProspect.campaign_logs as string[] | undefined,
  };
}

function mapDbNumberRequest(dbReq: Record<string, unknown>): NumberRequest {
  return {
    id: dbReq.id as string,
    clientId: dbReq.client_id as string,
    status: dbReq.status as NumberRequest['status'],
    requestedAreaCode: dbReq.requested_area_code as string | undefined,
    notes: dbReq.notes as string | undefined,
    adminNotes: dbReq.admin_notes as string | undefined,
    provisionedNumber: dbReq.provisioned_number as string | undefined,
    createdAt: dbReq.created_at as string,
    processedAt: dbReq.processed_at as string | undefined,
  };
}

function capitalizeFirst(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ============================================
// COMMUNICATION EVENT OPERATIONS
// ============================================

export interface DbCommunicationEvent {
  id: string;
  prospect_id: string | null;
  client_id: string;
  customer_id: string | null;
  direction: 'inbound' | 'outbound';
  channel: 'email' | 'sms' | 'voice';
  content: string;
  subject: string | null;
  metadata: Record<string, any>;
  ai_handled: boolean;
  escalated: boolean;
  created_at: string;
}

export interface DbOwnerNotification {
  id: string;
  client_id: string;
  type: 'new_lead' | 'reply' | 'booking' | 'escalation' | 'missed_call';
  title: string;
  message: string;
  read: boolean;
  action_url: string | null;
  related_event_id: string | null;
  created_at: string;
}

/**
 * Save a communication event to database
 */
export async function saveCommunicationEvent(event: DbCommunicationEvent): Promise<DbCommunicationEvent | null> {
  const supabase = getSupabase();
  if (!supabase) {
    console.log('[Supabase] Not configured - skipping event save');
    return null;
  }

  const { data, error } = await supabase
    .from('communication_events')
    .insert([event])
    .select()
    .single();

  if (error) {
    console.error('[Supabase] Error saving communication event:', error);
    return null;
  }

  return data as DbCommunicationEvent;
}

/**
 * Get communication events for a client
 */
export async function getClientCommunicationEvents(
  clientId: string,
  limit: number = 50
): Promise<DbCommunicationEvent[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('communication_events')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[Supabase] Error fetching communication events:', error);
    return [];
  }

  return data as DbCommunicationEvent[];
}

/**
 * Get conversation history for a specific customer
 */
export async function getCustomerConversation(
  clientId: string,
  customerId: string
): Promise<DbCommunicationEvent[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('communication_events')
    .select('*')
    .eq('client_id', clientId)
    .eq('customer_id', customerId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[Supabase] Error fetching conversation:', error);
    return [];
  }

  return data as DbCommunicationEvent[];
}

/**
 * Save an owner notification
 */
export async function saveOwnerNotification(notification: DbOwnerNotification): Promise<DbOwnerNotification | null> {
  const supabase = getSupabase();
  if (!supabase) {
    console.log('[Supabase] Not configured - skipping notification save');
    return null;
  }

  const { data, error } = await supabase
    .from('owner_notifications')
    .insert([notification])
    .select()
    .single();

  if (error) {
    console.error('[Supabase] Error saving notification:', error);
    return null;
  }

  return data as DbOwnerNotification;
}

/**
 * Get unread notifications for a client
 */
export async function getClientNotifications(
  clientId: string,
  unreadOnly: boolean = false
): Promise<DbOwnerNotification[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  let query = supabase
    .from('owner_notifications')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (unreadOnly) {
    query = query.eq('read', false);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[Supabase] Error fetching notifications:', error);
    return [];
  }

  return data as DbOwnerNotification[];
}

/**
 * Mark a notification as read
 */
export async function markNotificationRead(notificationId: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  const { error } = await supabase
    .from('owner_notifications')
    .update({ read: true })
    .eq('id', notificationId);

  if (error) {
    console.error('[Supabase] Error marking notification read:', error);
    return false;
  }

  return true;
}

/**
 * Mark all notifications as read for a client
 */
export async function markAllNotificationsRead(clientId: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  const { error } = await supabase
    .from('owner_notifications')
    .update({ read: true })
    .eq('client_id', clientId)
    .eq('read', false);

  if (error) {
    console.error('[Supabase] Error marking all notifications read:', error);
    return false;
  }

  return true;
}

/**
 * Convert a prospect to a full client/subscriber
 */
export const convertProspectToClient = async (prospectOrId: Prospect | string): Promise<Client | null> => {
  const sb = getSupabase();
  let prospect: Prospect | null = null;

  if (typeof prospectOrId === 'string') {
    if (sb) {
      const { data, error } = await sb
        .from('prospects')
        .select('*')
        .eq('id', prospectOrId)
        .single();
      if (!error && data) {
        prospect = mapDbProspectToProspect(data);
      }
    }
  } else {
    prospect = prospectOrId;
  }

  if (!prospect) {
    console.error('Error: Prospect not found for conversion');
    return null;
  }

  // 2. Map prospect to client data
  const newClientData: Omit<Client, 'id' | 'leads'> = {
    businessName: prospect.businessName,
    ownerName: 'Business Owner', // Prospect doesn't have ownerName
    email: prospect.email || `contact@${prospect.businessName.toLowerCase().replace(/\s+/g, '')}.com`,
    phone: prospect.phone || '',
    niche: 'Service Business', // Prospect doesn't have niche field
    status: 'Active',
    subscriptionTier: '$197/mo',
    mrr: 197,
    avatar: `https://picsum.photos/seed/${prospect.id}/200`,
    joinedDate: new Date().toISOString().split('T')[0],
    config: {
      enabled: true,
      businessName: prospect.businessName,
      niche: 'Service Business',
      customGreeting: `Thanks for contacting ${prospect.businessName}. How can we help you?`,
      qualificationQuestions: ['Service needed?', 'Location?', 'Urgency?'],
      voiceEnabled: false
    }
  };

  if (!sb) {
    // In demo mode, return a mocked client with a temp ID
    return {
      ...newClientData,
      id: `mock-client-${Date.now()}`,
      leads: []
    };
  }

  // 3. Create the client record
  const newClient = await createClientRecord(newClientData);
  if (!newClient) return null;

  // 4. Update prospect status to converted
  await sb
    .from('prospects')
    .update({ campaign_status: 'converted' })
    .eq('id', prospect.id);

  return newClient;
};
