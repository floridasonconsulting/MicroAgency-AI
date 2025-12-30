/**
 * Communication Hub Service
 * Central handler for all inbound/outbound communications
 * Acts as middleman between customers and business owners
 */

import { handleIncomingSMS, handleIncomingCall, ClientContext } from './aiReceptionistService';

// ============================================================================
// TYPES
// ============================================================================

export type CommunicationChannel = 'email' | 'sms' | 'voice';
export type CommunicationDirection = 'inbound' | 'outbound';
export type EventType = 'message' | 'call' | 'booking' | 'escalation';
export type NotificationType = 'new_lead' | 'reply' | 'booking' | 'escalation' | 'missed_call';

export interface CommunicationEvent {
    id: string;
    prospectId?: string;
    clientId: string;
    customerId?: string; // Phone or email of customer
    direction: CommunicationDirection;
    channel: CommunicationChannel;
    content: string;
    subject?: string; // For emails
    metadata: Record<string, any>;
    aiHandled: boolean;
    escalated: boolean;
    createdAt: string;
}

export interface OwnerNotification {
    id: string;
    clientId: string;
    type: NotificationType;
    title: string;
    message: string;
    read: boolean;
    actionUrl?: string;
    relatedEventId?: string;
    createdAt: string;
}

export interface InboundEmailPayload {
    from: string;
    to: string;
    subject: string;
    textBody: string;
    htmlBody?: string;
    headers?: Record<string, string>;
}

export interface InboundSMSPayload {
    from: string;
    to: string;
    body: string;
    messageSid: string;
}

export interface CommunicationConfig {
    systemEmailDomain: string;
    systemEmailPrefix: string;
    enableAIResponses: boolean;
    escalationKeywords: string[];
    notifyOwnerOnReply: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_CONFIG: CommunicationConfig = {
    systemEmailDomain: 'mail.microagency.ai',
    systemEmailPrefix: 'reply',
    enableAIResponses: true,
    escalationKeywords: ['human', 'person', 'manager', 'owner', 'call me', 'urgent', 'emergency'],
    notifyOwnerOnReply: true,
};

// In-memory stores (replace with Supabase in production)
const communicationEvents: Map<string, CommunicationEvent> = new Map();
const ownerNotifications: Map<string, OwnerNotification> = new Map();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Parse prospect ID from tagged email address
 * e.g., reply+abc123@mail.microagency.ai -> abc123
 */
function parseProspectIdFromEmail(email: string): string | null {
    const match = email.match(/reply\+([a-zA-Z0-9-]+)@/);
    return match ? match[1] : null;
}

/**
 * Look up client by their assigned Twilio number
 */
async function lookupClientByTwilioNumber(twilioNumber: string): Promise<string | null> {
    // TODO: Query Supabase clients table where aiPhoneNumber = twilioNumber
    console.log(`[CommunicationHub] Looking up client for Twilio number: ${twilioNumber}`);

    // Placeholder - in production, query database
    return 'client-placeholder-id';
}

/**
 * Look up prospect by phone number and client
 */
async function lookupProspectByPhone(phone: string, clientId: string): Promise<string | null> {
    // TODO: Query Supabase prospects table
    console.log(`[CommunicationHub] Looking up prospect for phone: ${phone}, client: ${clientId}`);
    return null;
}

/**
 * Get client context for AI responses
 */
async function getClientContext(clientId: string): Promise<ClientContext> {
    // TODO: Load from Supabase
    return {
        businessName: 'Demo Business',
        niche: 'Plumbing',
        greeting: 'Thanks for your message! How can we help you today?',
        services: ['Plumbing', 'Drain Cleaning', 'Water Heater Repair'],
    };
}

// ============================================================================
// INBOUND EMAIL HANDLING
// ============================================================================

/**
 * Handle inbound email from Resend/SendGrid webhook
 */
export async function handleInboundEmail(
    payload: InboundEmailPayload,
    config: CommunicationConfig = DEFAULT_CONFIG
): Promise<{ success: boolean; response?: string; eventId?: string }> {
    console.log(`[CommunicationHub] Inbound email from: ${payload.from}`);
    console.log(`[CommunicationHub] To: ${payload.to}`);
    console.log(`[CommunicationHub] Subject: ${payload.subject}`);

    // Parse prospect ID from reply address
    const prospectId = parseProspectIdFromEmail(payload.to);

    if (!prospectId) {
        console.warn('[CommunicationHub] Could not parse prospect ID from email address');
        return { success: false };
    }

    // Create communication event
    const event: CommunicationEvent = {
        id: generateUUID(),
        prospectId,
        clientId: 'pending-lookup', // TODO: Look up from prospect
        customerId: payload.from,
        direction: 'inbound',
        channel: 'email',
        content: payload.textBody,
        subject: payload.subject,
        metadata: {
            originalTo: payload.to,
            headers: payload.headers,
        },
        aiHandled: false,
        escalated: false,
        createdAt: new Date().toISOString(),
    };

    // Store event
    await storeEvent(event);

    // Check for escalation keywords
    const shouldEscalate = config.escalationKeywords.some(
        keyword => payload.textBody.toLowerCase().includes(keyword.toLowerCase())
    );

    if (shouldEscalate) {
        event.escalated = true;
        await escalateToOwner(event, 'Customer requested human contact');
        return {
            success: true,
            eventId: event.id,
            response: 'I understand you\'d like to speak with someone directly. I\'ve notified the team and someone will reach out to you shortly!'
        };
    }

    // Generate AI response if enabled
    let aiResponse: string | undefined;
    if (config.enableAIResponses) {
        aiResponse = await generateEmailResponse(event);
        event.aiHandled = true;

        // Store outbound response
        await storeEvent({
            id: generateUUID(),
            prospectId,
            clientId: event.clientId,
            customerId: payload.from,
            direction: 'outbound',
            channel: 'email',
            content: aiResponse,
            metadata: { replyToEventId: event.id },
            aiHandled: true,
            escalated: false,
            createdAt: new Date().toISOString(),
        });
    }

    // Notify owner if configured
    if (config.notifyOwnerOnReply) {
        await notifyOwner(event.clientId, {
            type: 'reply',
            title: 'New Email Reply',
            message: `${payload.from} replied: "${payload.textBody.substring(0, 100)}..."`,
            relatedEventId: event.id,
        });
    }

    return { success: true, response: aiResponse, eventId: event.id };
}

// ============================================================================
// INBOUND SMS HANDLING
// ============================================================================

/**
 * Handle inbound SMS from Twilio webhook
 */
export async function handleInboundSMSWebhook(
    payload: InboundSMSPayload,
    config: CommunicationConfig = DEFAULT_CONFIG
): Promise<{ success: boolean; response?: string; eventId?: string }> {
    console.log(`[CommunicationHub] Inbound SMS from: ${payload.from}`);
    console.log(`[CommunicationHub] To: ${payload.to}`);
    console.log(`[CommunicationHub] Body: ${payload.body}`);

    // Look up client by Twilio number
    const clientId = await lookupClientByTwilioNumber(payload.to);

    if (!clientId) {
        console.error('[CommunicationHub] Could not find client for Twilio number');
        return { success: false };
    }

    // Look up or create prospect
    const prospectId = await lookupProspectByPhone(payload.from, clientId);

    // Create communication event
    const event: CommunicationEvent = {
        id: generateUUID(),
        prospectId: prospectId || undefined,
        clientId,
        customerId: payload.from,
        direction: 'inbound',
        channel: 'sms',
        content: payload.body,
        metadata: {
            messageSid: payload.messageSid,
            twilioNumber: payload.to,
        },
        aiHandled: false,
        escalated: false,
        createdAt: new Date().toISOString(),
    };

    // Store event
    await storeEvent(event);

    // Check for escalation keywords
    const shouldEscalate = config.escalationKeywords.some(
        keyword => payload.body.toLowerCase().includes(keyword.toLowerCase())
    );

    if (shouldEscalate) {
        event.escalated = true;
        await escalateToOwner(event, 'Customer requested human contact via SMS');
        return {
            success: true,
            eventId: event.id,
            response: 'Got it! Someone from our team will call you shortly.'
        };
    }

    // Get client context and generate AI response
    let aiResponse: string | undefined;
    if (config.enableAIResponses) {
        const context = await getClientContext(clientId);
        const result = await handleIncomingSMS(clientId, payload.from, payload.body, context);
        aiResponse = result.response;
        event.aiHandled = true;

        // Store outbound response
        await storeEvent({
            id: generateUUID(),
            prospectId: prospectId || undefined,
            clientId,
            customerId: payload.from,
            direction: 'outbound',
            channel: 'sms',
            content: aiResponse,
            metadata: { replyToEventId: event.id },
            aiHandled: true,
            escalated: false,
            createdAt: new Date().toISOString(),
        });
    }

    // Notify owner
    if (config.notifyOwnerOnReply) {
        await notifyOwner(clientId, {
            type: 'reply',
            title: 'New SMS Reply',
            message: `${payload.from}: "${payload.body.substring(0, 100)}${payload.body.length > 100 ? '...' : ''}"`,
            relatedEventId: event.id,
        });
    }

    return { success: true, response: aiResponse, eventId: event.id };
}

// ============================================================================
// OUTBOUND COMMUNICATION
// ============================================================================

/**
 * Send outbound email through the system
 */
export async function sendSystemEmail(
    prospectId: string,
    clientId: string,
    to: string,
    subject: string,
    content: string,
    options?: { replyToTag?: boolean }
): Promise<{ success: boolean; eventId: string }> {
    const eventId = generateUUID();

    // Build reply-to address with tagged prospect ID
    const replyTo = options?.replyToTag
        ? `reply+${prospectId}@${DEFAULT_CONFIG.systemEmailDomain}`
        : undefined;

    console.log(`[CommunicationHub] Sending email to: ${to}`);
    console.log(`[CommunicationHub] Reply-To: ${replyTo}`);
    console.log(`[CommunicationHub] Subject: ${subject}`);

    // Store outbound event
    await storeEvent({
        id: eventId,
        prospectId,
        clientId,
        customerId: to,
        direction: 'outbound',
        channel: 'email',
        content,
        subject,
        metadata: { replyTo },
        aiHandled: false,
        escalated: false,
        createdAt: new Date().toISOString(),
    });

    // TODO: Actually send via Resend
    // await resendService.sendEmail({
    //   from: 'MicroAgency AI <leads@microagency.ai>',
    //   replyTo,
    //   to,
    //   subject,
    //   text: content,
    // });

    return { success: true, eventId };
}

/**
 * Send outbound SMS through the system
 */
export async function sendSystemSMS(
    prospectId: string | undefined,
    clientId: string,
    to: string,
    content: string,
    twilioNumber: string
): Promise<{ success: boolean; eventId: string }> {
    const eventId = generateUUID();

    console.log(`[CommunicationHub] Sending SMS to: ${to}`);
    console.log(`[CommunicationHub] From: ${twilioNumber}`);
    console.log(`[CommunicationHub] Content: ${content}`);

    // Store outbound event
    await storeEvent({
        id: eventId,
        prospectId,
        clientId,
        customerId: to,
        direction: 'outbound',
        channel: 'sms',
        content,
        metadata: { twilioNumber },
        aiHandled: false,
        escalated: false,
        createdAt: new Date().toISOString(),
    });

    // TODO: Actually send via Twilio
    // await twilioService.sendSMS({
    //   from: twilioNumber,
    //   to,
    //   body: content,
    // });

    return { success: true, eventId };
}

// ============================================================================
// AI RESPONSE GENERATION
// ============================================================================

/**
 * Generate AI response to email
 */
async function generateEmailResponse(event: CommunicationEvent): Promise<string> {
    // TODO: Use Gemini to generate contextual response
    const prompt = `Generate a helpful, professional email reply to a customer inquiry.
  
Customer message: "${event.content}"

Guidelines:
- Be friendly and helpful
- Keep it concise (2-3 paragraphs max)
- Offer to help further or schedule a call
- Don't make up specific information

Response:`;

    // Placeholder - integrate with Gemini
    return `Thank you for your message! I'd be happy to help you with that.

We can definitely assist with your inquiry. Would you like to schedule a quick call to discuss the details, or would you prefer I have someone reach out to you?

Let me know what works best for you!`;
}

// ============================================================================
// ESCALATION & NOTIFICATIONS
// ============================================================================

/**
 * Escalate a communication event to the business owner
 */
export async function escalateToOwner(
    event: CommunicationEvent,
    reason: string
): Promise<void> {
    console.log(`[CommunicationHub] Escalating event ${event.id}: ${reason}`);

    await notifyOwner(event.clientId, {
        type: 'escalation',
        title: '⚠️ Escalation Required',
        message: `${reason}. Customer ${event.customerId} via ${event.channel}: "${event.content.substring(0, 100)}..."`,
        relatedEventId: event.id,
    });
}

/**
 * Send notification to business owner
 */
export async function notifyOwner(
    clientId: string,
    notification: Omit<OwnerNotification, 'id' | 'clientId' | 'read' | 'createdAt'>
): Promise<void> {
    const fullNotification: OwnerNotification = {
        id: generateUUID(),
        clientId,
        ...notification,
        read: false,
        createdAt: new Date().toISOString(),
    };

    console.log(`[CommunicationHub] Owner notification:`, fullNotification);

    // Store notification
    ownerNotifications.set(fullNotification.id, fullNotification);

    // TODO: Save to Supabase
    // TODO: Send push notification, email alert, etc.
}

/**
 * Get unread notifications for a client
 */
export function getUnreadNotifications(clientId: string): OwnerNotification[] {
    return Array.from(ownerNotifications.values())
        .filter(n => n.clientId === clientId && !n.read)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Mark notification as read
 */
export function markNotificationRead(notificationId: string): boolean {
    const notification = ownerNotifications.get(notificationId);
    if (notification) {
        notification.read = true;
        return true;
    }
    return false;
}

// ============================================================================
// DATA ACCESS
// ============================================================================

/**
 * Store a communication event
 */
async function storeEvent(event: CommunicationEvent): Promise<void> {
    communicationEvents.set(event.id, event);
    console.log(`[CommunicationHub] Stored event:`, event.id);

    // TODO: Save to Supabase communication_events table
}

/**
 * Get conversation history for a customer
 */
export function getConversationHistory(
    clientId: string,
    customerId: string
): CommunicationEvent[] {
    return Array.from(communicationEvents.values())
        .filter(e => e.clientId === clientId && e.customerId === customerId)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

/**
 * Get all events for a prospect
 */
export function getProspectCommunications(prospectId: string): CommunicationEvent[] {
    return Array.from(communicationEvents.values())
        .filter(e => e.prospectId === prospectId)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

/**
 * Get recent events for a client
 */
export function getClientRecentEvents(
    clientId: string,
    limit: number = 50
): CommunicationEvent[] {
    return Array.from(communicationEvents.values())
        .filter(e => e.clientId === clientId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit);
}
