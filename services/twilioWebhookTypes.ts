/**
 * Twilio Webhook Types
 * Type definitions for Twilio webhook payloads
 */

// ============================================================================
// VOICE WEBHOOK TYPES
// ============================================================================

export interface TwilioVoiceWebhook {
    AccountSid: string;
    ApiVersion: string;
    CallSid: string;
    CallStatus: 'queued' | 'ringing' | 'in-progress' | 'completed' | 'busy' | 'failed' | 'no-answer';
    Called: string;
    CalledCity?: string;
    CalledCountry?: string;
    CalledState?: string;
    CalledZip?: string;
    Caller: string;
    CallerCity?: string;
    CallerCountry?: string;
    CallerState?: string;
    CallerZip?: string;
    Direction: 'inbound' | 'outbound-api' | 'outbound-dial';
    From: string;
    FromCity?: string;
    FromCountry?: string;
    FromState?: string;
    FromZip?: string;
    To: string;
    ToCity?: string;
    ToCountry?: string;
    ToState?: string;
    ToZip?: string;
}

export interface TwilioSpeechResult extends TwilioVoiceWebhook {
    SpeechResult: string;
    Confidence: string;
}

export interface TwilioGatherResult extends TwilioVoiceWebhook {
    Digits?: string;
    SpeechResult?: string;
    Confidence?: string;
}

// ============================================================================
// SMS WEBHOOK TYPES
// ============================================================================

export interface TwilioSMSWebhook {
    AccountSid: string;
    ApiVersion: string;
    Body: string;
    From: string;
    FromCity?: string;
    FromCountry?: string;
    FromState?: string;
    FromZip?: string;
    MessageSid: string;
    NumMedia: string;
    NumSegments: string;
    SmsMessageSid: string;
    SmsSid: string;
    SmsStatus: 'received' | 'sent' | 'delivered' | 'undelivered' | 'failed';
    To: string;
    ToCity?: string;
    ToCountry?: string;
    ToState?: string;
    ToZip?: string;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface TwilioCallResponse {
    success: boolean;
    sessionId?: string;
    twiml?: string;
    error?: string;
}

export interface TwilioSMSResponse {
    success: boolean;
    messageBody?: string;
    conversationId?: string;
    error?: string;
}

// ============================================================================
// WEBHOOK VALIDATION
// ============================================================================

/**
 * Validate Twilio webhook signature
 * In production, use twilio.validateRequest() with your auth token
 */
export function validateTwilioSignature(
    authToken: string,
    signature: string,
    url: string,
    params: Record<string, string>
): boolean {
    // TODO: Implement actual Twilio signature validation
    // This requires the twilio library on the server side
    console.log('[Twilio Webhook] Signature validation placeholder');
    return true;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Parse Twilio webhook form data
 */
export function parseTwilioWebhook<T extends TwilioVoiceWebhook | TwilioSMSWebhook>(
    formData: FormData
): T {
    const data: Record<string, string> = {};
    formData.forEach((value, key) => {
        data[key] = value.toString();
    });
    return data as unknown as T;
}

/**
 * Generate TwiML for missed call text-back
 */
export function generateMissedCallTextback(
    businessName: string,
    callerPhone: string
): string {
    return `Hi! This is ${businessName}. We missed your call. How can we help you? Reply to this message and we'll get back to you ASAP.`;
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
        return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
}

/**
 * Extract area code from phone number
 */
export function getAreaCode(phone: string): string | null {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length >= 10) {
        return cleaned.slice(cleaned.length === 11 ? 1 : 0, cleaned.length === 11 ? 4 : 3);
    }
    return null;
}
