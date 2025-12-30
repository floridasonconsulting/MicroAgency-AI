/**
 * AI Receptionist Service
 * Handles inbound calls and SMS via Twilio with Gemini-powered responses
 */

import {
    getAIReceptionistPrompt,
    getQualificationFlow,
    shouldEscalate,
    generateOwnerAlert,
    getNicheConfig,
} from './nicheConfigService';

// ============================================================================
// TYPES
// ============================================================================

export interface CallSession {
    id: string;
    clientId: string;
    callerPhone: string;
    callerName?: string;
    startTime: string;
    endTime?: string;
    duration?: number;
    status: 'active' | 'completed' | 'missed' | 'voicemail';
    transcript: TranscriptEntry[];
    outcome?: 'booked' | 'callback' | 'information' | 'no_answer';
    leadCaptured: boolean;
    appointmentBooked?: string;
}

export interface TranscriptEntry {
    role: 'caller' | 'ai' | 'system';
    content: string;
    timestamp: string;
}

export interface SMSConversation {
    id: string;
    clientId: string;
    customerPhone: string;
    customerName?: string;
    messages: SMSMessage[];
    status: 'active' | 'resolved' | 'escalated';
    createdAt: string;
    updatedAt: string;
}

export interface SMSMessage {
    id: string;
    direction: 'inbound' | 'outbound';
    content: string;
    timestamp: string;
    aiGenerated: boolean;
}

export interface ClientContext {
    businessName: string;
    niche: string;
    greeting: string;
    services: string[];
    operatingHours?: string;
    bookingUrl?: string;
    emergencyProtocol?: string;
}

export interface AIReceptionistConfig {
    voiceName: 'alloy' | 'echo' | 'shimmer' | 'onyx' | 'nova' | 'fable';
    language: string;
    maxTurns: number;
    escalationKeywords: string[];
    bookingEnabled: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_CONFIG: AIReceptionistConfig = {
    voiceName: 'alloy',
    language: 'en-US',
    maxTurns: 10,
    escalationKeywords: ['emergency', 'urgent', 'manager', 'owner', 'human', 'person'],
    bookingEnabled: true,
};

const NICHE_PROMPTS: Record<string, string> = {
    Plumbing: `You are an AI receptionist for a plumbing company. You help callers with:
- Scheduling plumbing service appointments
- Providing estimates for common issues (leaks, clogs, water heater, etc.)
- Handling emergency plumbing situations by prioritizing and dispatching
- Answering questions about services offered`,

    HVAC: getAIReceptionistPrompt('hvac'),

    Roofing: `You are an AI receptionist for a roofing company. You help callers with:
- Scheduling roof inspections and estimates
- Handling storm damage and emergency roof repairs
- Providing information about roofing materials and warranties
- Answering questions about insurance claims and timelines`,

    default: `You are a professional AI receptionist. You help callers with:
- Scheduling appointments
- Answering questions about services
- Capturing lead information
- Handling urgent requests appropriately`,
};

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

function buildSystemPrompt(context: ClientContext, config: AIReceptionistConfig): string {
    // Try to get niche-specific prompt from config first
    const nicheConfig = getNicheConfig(context.niche);
    let nichePrompt: string;

    if (nicheConfig) {
        nichePrompt = nicheConfig.ai_receptionist.system_prompt;
    } else {
        nichePrompt = NICHE_PROMPTS[context.niche] || NICHE_PROMPTS.default;
    }

    // Get qualification flow for HVAC
    const qualificationFlow = getQualificationFlow(context.niche);
    const qualificationQuestions = qualificationFlow.length > 0
        ? `\n\nQUALIFICATION QUESTIONS:\n${qualificationFlow.map((q, i) => `${i + 1}. ${q.question}`).join('\n')}`
        : '';

    return `${nichePrompt}

BUSINESS DETAILS:
- Business Name: ${context.businessName}
- Industry: ${context.niche}
- Services: ${context.services.join(', ')}
${context.operatingHours ? `- Operating Hours: ${context.operatingHours}` : ''}
${context.bookingUrl ? `- Online Booking: ${context.bookingUrl}` : ''}

GREETING: "${context.greeting}"${qualificationQuestions}

GUIDELINES:
1. Be friendly, professional, and helpful
2. Always identify yourself as an AI assistant for ${context.businessName}
3. Collect caller's name and phone number for callback
4. For appointments, ask for preferred date/time and service needed
5. For emergencies, express urgency and assure quick response
6. Keep responses concise (2-3 sentences max for voice)
7. If asked something you don't know, offer to have someone call back
8. Never make up information about pricing or availability

${config.bookingEnabled ? 'You CAN book appointments directly.' : 'Inform callers that someone will call them back to schedule.'}

ESCALATION: If the caller mentions ${config.escalationKeywords.join(', ')}, offer to connect them with a human or take a message for immediate callback.`;
}

// ============================================================================
// CALL HANDLING
// ============================================================================

const activeCalls: Map<string, CallSession> = new Map();
const smsConversations: Map<string, SMSConversation> = new Map();

/**
 * Handle incoming call webhook from Twilio
 */
export async function handleIncomingCall(
    clientId: string,
    callerPhone: string,
    context: ClientContext,
    config: AIReceptionistConfig = DEFAULT_CONFIG
): Promise<{ sessionId: string; greeting: string; twimlResponse: string }> {
    const sessionId = generateUUID();

    // Create call session
    const session: CallSession = {
        id: sessionId,
        clientId,
        callerPhone,
        startTime: new Date().toISOString(),
        status: 'active',
        transcript: [],
        leadCaptured: false,
    };

    activeCalls.set(sessionId, session);

    // Generate greeting
    const greeting = context.greeting || `Thank you for calling ${context.businessName}. How may I help you today?`;

    // Add to transcript
    session.transcript.push({
        role: 'ai',
        content: greeting,
        timestamp: new Date().toISOString(),
    });

    // Generate TwiML response for Twilio
    const twimlResponse = generateTwiML(greeting, sessionId, config);

    console.log(`[AI Receptionist] New call from ${callerPhone} - Session ${sessionId}`);

    return { sessionId, greeting, twimlResponse };
}

/**
 * Process speech input from caller
 */
export async function processCallerSpeech(
    sessionId: string,
    speechText: string,
    context: ClientContext,
    config: AIReceptionistConfig = DEFAULT_CONFIG
): Promise<{ response: string; twimlResponse: string; shouldEnd: boolean }> {
    const session = activeCalls.get(sessionId);
    if (!session) {
        throw new Error(`Session ${sessionId} not found`);
    }

    // Add caller speech to transcript
    session.transcript.push({
        role: 'caller',
        content: speechText,
        timestamp: new Date().toISOString(),
    });

    // Check for escalation keywords
    const shouldEscalate = config.escalationKeywords.some(
        keyword => speechText.toLowerCase().includes(keyword.toLowerCase())
    );

    if (shouldEscalate) {
        const escalationResponse = `I understand this is urgent. Let me take down your information so someone can call you back immediately. Can you confirm your phone number?`;
        session.transcript.push({
            role: 'ai',
            content: escalationResponse,
            timestamp: new Date().toISOString(),
        });

        return {
            response: escalationResponse,
            twimlResponse: generateTwiML(escalationResponse, sessionId, config),
            shouldEnd: false,
        };
    }

    // Generate AI response using Gemini
    const aiResponse = await generateVoiceResponse(session, context, config);

    // Add AI response to transcript
    session.transcript.push({
        role: 'ai',
        content: aiResponse,
        timestamp: new Date().toISOString(),
    });

    // Check if conversation should end
    const shouldEnd = session.transcript.length > config.maxTurns * 2 ||
        aiResponse.toLowerCase().includes('goodbye') ||
        aiResponse.toLowerCase().includes('have a great day');

    if (shouldEnd) {
        session.status = 'completed';
        session.endTime = new Date().toISOString();
        session.duration = Math.floor(
            (new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 1000
        );
    }

    return {
        response: aiResponse,
        twimlResponse: generateTwiML(aiResponse, sessionId, config, shouldEnd),
        shouldEnd,
    };
}

/**
 * Generate TwiML response for Twilio
 */
function generateTwiML(
    text: string,
    sessionId: string,
    config: AIReceptionistConfig,
    endCall: boolean = false
): string {
    const voiceConfig = `voice="${config.voiceName}" language="${config.language}"`;

    if (endCall) {
        return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say ${voiceConfig}>${escapeXml(text)}</Say>
  <Hangup/>
</Response>`;
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say ${voiceConfig}>${escapeXml(text)}</Say>
  <Gather input="speech" action="/api/twilio/voice/respond?sessionId=${sessionId}" method="POST" speechTimeout="auto" speechModel="phone_call">
    <Say ${voiceConfig}>I'm listening.</Say>
  </Gather>
</Response>`;
}

function escapeXml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

// ============================================================================
// SMS HANDLING
// ============================================================================

/**
 * Handle incoming SMS webhook from Twilio
 */
export async function handleIncomingSMS(
    clientId: string,
    fromPhone: string,
    messageBody: string,
    context: ClientContext
): Promise<{ response: string; conversationId: string }> {
    // Find or create conversation
    let conversationId = Array.from(smsConversations.entries())
        .find(([_, conv]) => conv.clientId === clientId && conv.customerPhone === fromPhone)?.[0];

    let conversation: SMSConversation;

    if (conversationId) {
        conversation = smsConversations.get(conversationId)!;
    } else {
        conversationId = generateUUID();
        conversation = {
            id: conversationId,
            clientId,
            customerPhone: fromPhone,
            messages: [],
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        smsConversations.set(conversationId, conversation);
    }

    // Add inbound message
    conversation.messages.push({
        id: generateUUID(),
        direction: 'inbound',
        content: messageBody,
        timestamp: new Date().toISOString(),
        aiGenerated: false,
    });

    // Generate AI response
    const aiResponse = await generateSMSResponse(conversation, context);

    // Add outbound message
    conversation.messages.push({
        id: generateUUID(),
        direction: 'outbound',
        content: aiResponse,
        timestamp: new Date().toISOString(),
        aiGenerated: true,
    });

    conversation.updatedAt = new Date().toISOString();

    console.log(`[AI Receptionist] SMS from ${fromPhone}: "${messageBody}" -> "${aiResponse}"`);

    return { response: aiResponse, conversationId };
}

// ============================================================================
// AI RESPONSE GENERATION
// ============================================================================

/**
 * Generate voice response using Gemini
 */
async function generateVoiceResponse(
    session: CallSession,
    context: ClientContext,
    config: AIReceptionistConfig
): Promise<string> {
    const systemPrompt = buildSystemPrompt(context, config);

    // Build conversation history
    const conversationHistory = session.transcript.map(entry => ({
        role: entry.role === 'caller' ? 'user' : 'model',
        parts: [{ text: entry.content }],
    }));

    // Check for Gemini API key
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
        console.warn('[AI Receptionist] Gemini API key not configured - using fallback response');
        return generateFallbackVoiceResponse(session, context);
    }

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: conversationHistory,
                    systemInstruction: { parts: [{ text: systemPrompt }] },
                    generationConfig: {
                        maxOutputTokens: 150,
                        temperature: 0.7,
                    },
                }),
            }
        );

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (text) {
            return text.trim();
        }

        return generateFallbackVoiceResponse(session, context);
    } catch (error) {
        console.error('[AI Receptionist] Gemini API error:', error);
        return generateFallbackVoiceResponse(session, context);
    }
}

/**
 * Generate SMS response using Gemini
 */
async function generateSMSResponse(
    conversation: SMSConversation,
    context: ClientContext
): Promise<string> {
    const systemPrompt = `You are an AI assistant responding via SMS for ${context.businessName}.
Keep responses SHORT (under 160 characters when possible).
Be helpful and friendly. If the customer wants to book, ask for their preferred time.
Business: ${context.businessName} (${context.niche})`;

    // Build conversation history
    const conversationHistory = conversation.messages.map(msg => ({
        role: msg.direction === 'inbound' ? 'user' : 'model',
        parts: [{ text: msg.content }],
    }));

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
        console.warn('[AI Receptionist] Gemini API key not configured - using fallback response');
        return generateFallbackSMSResponse(conversation, context);
    }

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: conversationHistory,
                    systemInstruction: { parts: [{ text: systemPrompt }] },
                    generationConfig: {
                        maxOutputTokens: 100,
                        temperature: 0.7,
                    },
                }),
            }
        );

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (text) {
            return text.trim();
        }

        return generateFallbackSMSResponse(conversation, context);
    } catch (error) {
        console.error('[AI Receptionist] Gemini API error:', error);
        return generateFallbackSMSResponse(conversation, context);
    }
}

// ============================================================================
// FALLBACK RESPONSES
// ============================================================================

function generateFallbackVoiceResponse(session: CallSession, context: ClientContext): string {
    const lastMessage = session.transcript[session.transcript.length - 1]?.content.toLowerCase() || '';

    if (lastMessage.includes('appointment') || lastMessage.includes('schedule') || lastMessage.includes('book')) {
        return `I'd be happy to help you schedule an appointment. What day and time works best for you?`;
    }

    if (lastMessage.includes('price') || lastMessage.includes('cost') || lastMessage.includes('quote')) {
        return `For accurate pricing, we'd need to assess your specific situation. Would you like to schedule a free estimate?`;
    }

    if (lastMessage.includes('emergency') || lastMessage.includes('urgent')) {
        return `I understand this is urgent. Let me get your information and have someone call you back within the next few minutes.`;
    }

    if (lastMessage.includes('thank') || lastMessage.includes('bye') || lastMessage.includes('that\'s all')) {
        return `Thank you for calling ${context.businessName}. Have a great day!`;
    }

    return `I'd be happy to help. Could you tell me a bit more about what you need?`;
}

function generateFallbackSMSResponse(conversation: SMSConversation, context: ClientContext): string {
    const lastMessage = conversation.messages[conversation.messages.length - 1]?.content.toLowerCase() || '';

    if (lastMessage.includes('appointment') || lastMessage.includes('schedule') || lastMessage.includes('book')) {
        return `Hi! I can help schedule that. What day works for you?`;
    }

    if (lastMessage.includes('price') || lastMessage.includes('cost')) {
        return `We'd love to give you a quote! Can we schedule a quick call?`;
    }

    if (lastMessage.includes('yes') || lastMessage.includes('sure') || lastMessage.includes('ok')) {
        return `Great! What time works best for you?`;
    }

    return `Thanks for reaching out to ${context.businessName}! How can we help you today?`;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get call session by ID
 */
export function getCallSession(sessionId: string): CallSession | undefined {
    return activeCalls.get(sessionId);
}

/**
 * Get SMS conversation by ID
 */
export function getSMSConversation(conversationId: string): SMSConversation | undefined {
    return smsConversations.get(conversationId);
}

/**
 * Get all active calls
 */
export function getActiveCalls(): CallSession[] {
    return Array.from(activeCalls.values()).filter(c => c.status === 'active');
}

/**
 * Get all SMS conversations for a client
 */
export function getClientConversations(clientId: string): SMSConversation[] {
    return Array.from(smsConversations.values()).filter(c => c.clientId === clientId);
}

/**
 * End a call session
 */
export function endCallSession(sessionId: string, outcome?: CallSession['outcome']): CallSession | undefined {
    const session = activeCalls.get(sessionId);
    if (session) {
        session.status = 'completed';
        session.endTime = new Date().toISOString();
        session.outcome = outcome;
        session.duration = Math.floor(
            (new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 1000
        );
    }
    return session;
}

/**
 * Mark lead as captured from call
 */
export function captureLeadFromCall(
    sessionId: string,
    leadInfo: { name: string; phone: string; serviceType?: string }
): boolean {
    const session = activeCalls.get(sessionId);
    if (session) {
        session.callerName = leadInfo.name;
        session.leadCaptured = true;
        console.log(`[AI Receptionist] Lead captured: ${leadInfo.name} (${leadInfo.phone})`);
        return true;
    }
    return false;
}
