/**
 * Demo Data Generator
 * Creates realistic mock data for demo environments
 */

// ============================================================================
// TYPES
// ============================================================================

export interface DemoLead {
    id: string;
    name: string;
    phone: string;
    serviceType: string;
    urgency: 'Low' | 'Medium' | 'Emergency';
    status: 'New' | 'Qualified' | 'Booked' | 'Closed';
    dateCaptured: string;
    bookingDate?: string;
    conversationHistory: Array<{
        role: 'user' | 'assistant' | 'system';
        content: string;
        timestamp: string;
    }>;
}

export interface DemoCall {
    id: string;
    callerName: string;
    callerPhone: string;
    duration: string;
    outcome: 'Booked' | 'Callback' | 'Information' | 'Missed';
    timestamp: string;
    transcript?: string[];
}

export interface DemoMetrics {
    callsHandled: number;
    callsThisMonth: number;
    leadsCapture: number;
    appointmentsBooked: number;
    conversionRate: number;
    avgResponseTime: string;
    missedCallsRecovered: number;
    revenueInfluenced: number;
}

export interface DemoClient {
    id: string;
    businessName: string;
    ownerName: string;
    email: string;
    phone: string;
    niche: string;
    status: 'active';
    subscriptionTier: string;
    mrr: number;
    aiPhoneNumber: string;
    forwardingStatus: 'Verified';
    joinedDate: string;
    leads: DemoLead[];
}

export interface DemoData {
    client: DemoClient;
    leads: DemoLead[];
    calls: DemoCall[];
    metrics: DemoMetrics;
}

// ============================================================================
// PLUMBING DEMO DATA
// ============================================================================

const PLUMBING_SERVICE_TYPES = [
    'Leak Repair',
    'Drain Cleaning',
    'Water Heater Installation',
    'Pipe Replacement',
    'Toilet Repair',
    'Faucet Installation',
    'Sewer Line Inspection',
    'Emergency Plumbing',
    'Garbage Disposal Repair',
    'Bathroom Remodel'
];

const PLUMBING_NAMES = [
    'John Mitchell', 'Sarah Johnson', 'Mike Garcia', 'Emily Davis',
    'Robert Wilson', 'Jennifer Martinez', 'David Brown', 'Lisa Anderson',
    'James Taylor', 'Maria Rodriguez', 'Chris Thompson', 'Amanda White',
    'Kevin Lee', 'Rachel Scott', 'Brian Harris', 'Michelle Clark'
];

const PLUMBING_CONVERSATIONS = [
    // Emergency call
    [
        { role: 'assistant' as const, content: "Thank you for calling Joe's Plumbing! This is our AI assistant. How can I help you today?" },
        { role: 'user' as const, content: "Hi, I have a major leak under my kitchen sink and water is everywhere!" },
        { role: 'assistant' as const, content: "I understand this is urgent. Let me get someone out to you right away. Can I get your name and address?" },
        { role: 'user' as const, content: "I'm Sarah Johnson, 1234 Oak Street." },
        { role: 'assistant' as const, content: "Thank you Sarah. I'm dispatching a technician to 1234 Oak Street immediately. They should arrive within 45 minutes. Can I confirm your phone number for the tech to call when they're nearby?" },
        { role: 'user' as const, content: "Yes, it's 555-0123." },
        { role: 'assistant' as const, content: "Perfect. I've booked emergency service for you. Our tech Mike will call you at 555-0123 when he's 10 minutes away. In the meantime, if possible, turn off the water supply valve under the sink. Is there anything else I can help with?" }
    ],
    // Standard inquiry
    [
        { role: 'assistant' as const, content: "Thanks for calling Joe's Plumbing! How can I assist you?" },
        { role: 'user' as const, content: "I need to get my water heater replaced. Mine is about 15 years old." },
        { role: 'assistant' as const, content: "I can definitely help with that! A 15-year-old water heater is due for replacement. Would you like to schedule a free estimate? We can assess your current unit and discuss your options." },
        { role: 'user' as const, content: "Yeah, that sounds good. What times do you have?" },
        { role: 'assistant' as const, content: "I have availability tomorrow between 2-4 PM, or Wednesday morning 9-11 AM. Which works better for you?" }
    ],
    // Drain cleaning
    [
        { role: 'assistant' as const, content: "Joe's Plumbing, how can I help?" },
        { role: 'user' as const, content: "My bathroom drain is really slow. It's been getting worse." },
        { role: 'assistant' as const, content: "I understand - a slow drain can be frustrating! This is usually caused by hair and soap buildup. We offer professional drain cleaning that clears the entire line. Would you like to schedule service?" }
    ]
];

function generateRandomPhone(): string {
    const area = Math.floor(Math.random() * 900) + 100;
    const exchange = Math.floor(Math.random() * 900) + 100;
    const subscriber = Math.floor(Math.random() * 9000) + 1000;
    return `(${area}) ${exchange}-${subscriber}`;
}

function generateRandomDate(daysAgo: number): string {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
    date.setHours(Math.floor(Math.random() * 12) + 7); // 7 AM to 7 PM
    date.setMinutes(Math.floor(Math.random() * 60));
    return date.toISOString();
}

function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// ============================================================================
// GENERATOR FUNCTIONS
// ============================================================================

export function generateDemoLeads(count: number = 12): DemoLead[] {
    const leads: DemoLead[] = [];
    const statuses: DemoLead['status'][] = ['New', 'Qualified', 'Booked', 'Closed'];
    const urgencies: DemoLead['urgency'][] = ['Low', 'Medium', 'Emergency'];

    for (let i = 0; i < count; i++) {
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const conversationIdx = Math.floor(Math.random() * PLUMBING_CONVERSATIONS.length);
        const conversation = PLUMBING_CONVERSATIONS[conversationIdx];

        leads.push({
            id: generateUUID(),
            name: PLUMBING_NAMES[Math.floor(Math.random() * PLUMBING_NAMES.length)],
            phone: generateRandomPhone(),
            serviceType: PLUMBING_SERVICE_TYPES[Math.floor(Math.random() * PLUMBING_SERVICE_TYPES.length)],
            urgency: urgencies[Math.floor(Math.random() * urgencies.length)],
            status,
            dateCaptured: generateRandomDate(14),
            bookingDate: status === 'Booked' ? generateRandomDate(7) : undefined,
            conversationHistory: conversation.map((msg, idx) => ({
                ...msg,
                timestamp: new Date(Date.now() - (conversation.length - idx) * 60000).toISOString()
            }))
        });
    }

    // Sort by date captured (newest first)
    return leads.sort((a, b) => new Date(b.dateCaptured).getTime() - new Date(a.dateCaptured).getTime());
}

export function generateDemoCalls(count: number = 20): DemoCall[] {
    const calls: DemoCall[] = [];
    const outcomes: DemoCall['outcome'][] = ['Booked', 'Callback', 'Information', 'Missed'];

    for (let i = 0; i < count; i++) {
        const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];
        const durationMins = outcome === 'Missed' ? 0 : Math.floor(Math.random() * 8) + 1;

        calls.push({
            id: generateUUID(),
            callerName: PLUMBING_NAMES[Math.floor(Math.random() * PLUMBING_NAMES.length)],
            callerPhone: generateRandomPhone(),
            duration: outcome === 'Missed' ? '0:00' : `${durationMins}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
            outcome,
            timestamp: generateRandomDate(7),
            transcript: outcome !== 'Missed' ? [
                "AI: Thank you for calling Joe's Plumbing!",
                "Caller: Hi, I need help with...",
                "AI: I'd be happy to help with that."
            ] : undefined
        });
    }

    return calls.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function generateDemoMetrics(): DemoMetrics {
    const callsHandled = Math.floor(Math.random() * 30) + 40; // 40-70
    const leadsCapture = Math.floor(callsHandled * 0.7);
    const appointmentsBooked = Math.floor(leadsCapture * 0.6);

    return {
        callsHandled,
        callsThisMonth: callsHandled,
        leadsCapture,
        appointmentsBooked,
        conversionRate: Math.round((appointmentsBooked / leadsCapture) * 100),
        avgResponseTime: `${Math.floor(Math.random() * 10) + 5} seconds`,
        missedCallsRecovered: Math.floor(Math.random() * 10) + 5,
        revenueInfluenced: appointmentsBooked * 450 // Avg job value
    };
}

export function generateDemoClient(): DemoClient {
    const leads = generateDemoLeads(12);

    return {
        id: 'demo-client-plumbing',
        businessName: "Joe's Plumbing & Heating",
        ownerName: 'Joe Martinez',
        email: 'joe@joesplumbing.com',
        phone: '(555) 123-4567',
        niche: 'Plumbing',
        status: 'active',
        subscriptionTier: '$197/mo',
        mrr: 197,
        aiPhoneNumber: '(555) 888-1234',
        forwardingStatus: 'Verified',
        joinedDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days ago
        leads
    };
}

// ============================================================================
// MAIN GENERATOR
// ============================================================================

export function generatePlumbingDemoData(): DemoData {
    const client = generateDemoClient();
    const leads = generateDemoLeads(15);
    const calls = generateDemoCalls(25);
    const metrics = generateDemoMetrics();

    return {
        client,
        leads,
        calls,
        metrics
    };
}

// Niche-specific generators (extend as needed)
export const DEMO_DATA_GENERATORS: Record<string, () => DemoData> = {
    plumbing: generatePlumbingDemoData,
    // TODO: Add more niches
    // hvac: generateHVACDemoData,
    // roofing: generateRoofingDemoData,
};

export function generateDemoData(niche: string = 'plumbing'): DemoData {
    const generator = DEMO_DATA_GENERATORS[niche.toLowerCase()];
    if (generator) {
        return generator();
    }
    // Default to plumbing
    return generatePlumbingDemoData();
}
