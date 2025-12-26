/**
 * Twilio Integration Service
 * 
 * This service handles Twilio phone number provisioning for the MicroAgency-AI platform.
 * 
 * IMPORTANT: For production, Twilio API calls should be made from a backend/serverless
 * function to protect your auth token. This client-side code is designed for demo
 * purposes and to define the interface for backend implementation.
 * 
 * Production deployment would use:
 * 1. Supabase Edge Function for secure API calls
 * 2. Environment variables for credentials (never exposed in client)
 */

export interface TwilioConfig {
    accountSid: string;
    authToken: string;
}

export interface AvailableNumber {
    phoneNumber: string;
    friendlyName: string;
    locality: string;
    region: string;
    isoCountry: string;
    capabilities: {
        voice: boolean;
        sms: boolean;
        mms: boolean;
    };
}

export interface ProvisionedNumber {
    sid: string;
    phoneNumber: string;
    friendlyName: string;
    dateCreated: string;
    status: 'active' | 'pending' | 'failed';
}

/**
 * Get Twilio configuration from localStorage
 */
export const getTwilioConfig = (): TwilioConfig | null => {
    const saved = localStorage.getItem('agency_settings');
    if (!saved) return null;

    const settings = JSON.parse(saved);
    if (!settings.twilioSid || !settings.twilioAuthToken) return null;

    return {
        accountSid: settings.twilioSid,
        authToken: settings.twilioAuthToken
    };
};

/**
 * Check if Twilio is configured
 */
export const isTwilioConfigured = (): boolean => {
    const config = getTwilioConfig();
    return config !== null &&
        config.accountSid.startsWith('AC') &&
        config.authToken.length > 10;
};

/**
 * Search for available phone numbers by area code
 * 
 * In production: Call backend endpoint
 * POST /api/twilio/available-numbers { areaCode, country }
 */
export const searchAvailableNumbers = async (
    areaCode?: string,
    country: string = 'US'
): Promise<AvailableNumber[]> => {
    const config = getTwilioConfig();

    if (!config) {
        console.warn('[Twilio] Not configured - returning demo numbers');
        return generateDemoNumbers(areaCode);
    }

    // In production, this would call your backend
    console.log('[Twilio] Would search for numbers:', { areaCode, country });

    // Return demo numbers for now
    return generateDemoNumbers(areaCode);
};

/**
 * Provision a phone number
 * 
 * In production: Call backend endpoint
 * POST /api/twilio/provision-number { phoneNumber, friendlyName, voiceUrl, smsUrl }
 */
export const provisionNumber = async (
    phoneNumber: string,
    friendlyName: string,
    webhookBaseUrl?: string
): Promise<ProvisionedNumber | null> => {
    const config = getTwilioConfig();

    if (!config) {
        console.warn('[Twilio] Not configured - simulating provisioning');
        return simulateProvisioning(phoneNumber, friendlyName);
    }

    // In production, this would call your backend which would:
    // 1. Purchase the number via Twilio API
    // 2. Configure voice/SMS webhooks
    // 3. Store in database
    console.log('[Twilio] Would provision number:', {
        phoneNumber,
        friendlyName,
        voiceUrl: `${webhookBaseUrl}/api/voice/incoming`,
        smsUrl: `${webhookBaseUrl}/api/sms/incoming`
    });

    // Simulate success
    return simulateProvisioning(phoneNumber, friendlyName);
};

/**
 * Release a phone number
 * 
 * In production: Call backend endpoint
 * DELETE /api/twilio/numbers/:sid
 */
export const releaseNumber = async (numberSid: string): Promise<boolean> => {
    const config = getTwilioConfig();

    if (!config) {
        console.warn('[Twilio] Not configured');
        return false;
    }

    console.log('[Twilio] Would release number:', numberSid);

    // In production, this would call Twilio API to release the number
    return true;
};

/**
 * Get all provisioned numbers for the account
 * 
 * In production: Call backend endpoint
 * GET /api/twilio/numbers
 */
export const listProvisionedNumbers = async (): Promise<ProvisionedNumber[]> => {
    const config = getTwilioConfig();

    if (!config) {
        console.warn('[Twilio] Not configured');
        return [];
    }

    console.log('[Twilio] Would list provisioned numbers');

    // Return empty for now - in production would query Twilio
    return [];
};

/**
 * Format a phone number for display
 */
export const formatPhoneNumber = (phone: string): string => {
    // Handle E.164 format (+1XXXXXXXXXX)
    const cleaned = phone.replace(/\D/g, '');

    if (cleaned.length === 11 && cleaned.startsWith('1')) {
        return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }

    if (cleaned.length === 10) {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }

    return phone;
};

// --- Demo/Simulation Functions ---

/**
 * Generate demo phone numbers for testing
 */
const generateDemoNumbers = (areaCode?: string): AvailableNumber[] => {
    const area = areaCode || '555';
    const numbers: AvailableNumber[] = [];

    for (let i = 0; i < 5; i++) {
        const suffix = String(Math.floor(1000 + Math.random() * 9000));
        const prefix = String(Math.floor(100 + Math.random() * 900));

        numbers.push({
            phoneNumber: `+1${area}${prefix}${suffix}`,
            friendlyName: `(${area}) ${prefix}-${suffix}`,
            locality: 'Demo City',
            region: 'FL',
            isoCountry: 'US',
            capabilities: {
                voice: true,
                sms: true,
                mms: true
            }
        });
    }

    return numbers;
};

/**
 * Simulate number provisioning for demo mode
 */
const simulateProvisioning = (
    phoneNumber: string,
    friendlyName: string
): ProvisionedNumber => {
    return {
        sid: `PN_demo_${Date.now()}`,
        phoneNumber,
        friendlyName,
        dateCreated: new Date().toISOString(),
        status: 'active'
    };
};

/**
 * Webhook URL helpers for Twilio configuration
 */
export const WEBHOOK_ENDPOINTS = {
    voice: '/api/voice/incoming',
    voiceFallback: '/api/voice/fallback',
    voiceStatus: '/api/voice/status',
    sms: '/api/sms/incoming',
    smsFallback: '/api/sms/fallback',
    smsStatus: '/api/sms/status'
} as const;

/**
 * TwiML response generators for voice/SMS handling
 * These would be used in your backend webhook handlers
 */
export const TWIML_EXAMPLES = {
    greeting: (businessName: string) => `
    <?xml version="1.0" encoding="UTF-8"?>
    <Response>
      <Say voice="Polly.Joanna">
        Thank you for calling ${businessName}. 
        Our AI assistant will be with you shortly.
      </Say>
      <Pause length="1"/>
      <Connect>
        <Stream url="wss://your-ai-server.com/websocket" />
      </Connect>
    </Response>
  `,

    smsAutoReply: (message: string) => `
    <?xml version="1.0" encoding="UTF-8"?>
    <Response>
      <Message>${message}</Message>
    </Response>
  `
};
