import { Prospect } from '../types';
import { getOutreachMessages, getNichePricing, getNicheConfig } from './nicheConfigService';

// ============================================================================
// TYPES
// ============================================================================

export type CampaignChannel = 'email' | 'sms' | 'voice';
export type CampaignStepType = 'email' | 'sms' | 'voice' | 'wait';
export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'converted' | 'cold';

export interface CampaignStep {
    id: string;
    type: CampaignStepType;
    delayHours: number;
    subject?: string; // For email
    template: string;
    aiPersonalize: boolean;
}

export interface CampaignTemplate {
    id: string;
    name: string;
    niche: string;
    description: string;
    steps: CampaignStep[];
    createdAt: string;
}

export interface CampaignRun {
    id: string;
    prospectId: string;
    templateId: string;
    status: CampaignStatus;
    currentStep: number;
    nextActionAt: string | null;
    startedAt: string;
    completedAt: string | null;
    logs: CampaignLogEntry[];
}

export interface CampaignLogEntry {
    timestamp: string;
    action: string;
    channel?: CampaignChannel;
    message?: string;
    success: boolean;
    error?: string;
}

export interface ProspectMessage {
    id: string;
    prospectId: string;
    direction: 'inbound' | 'outbound';
    channel: CampaignChannel;
    content: string;
    aiGenerated: boolean;
    createdAt: string;
}

// ============================================================================
// HVAC CAMPAIGN TEMPLATE (Primary Focus)
// ============================================================================

const hvacMessages = getOutreachMessages('hvac');

export const DEFAULT_HVAC_TEMPLATE: CampaignTemplate = {
    id: 'default-hvac-v1',
    name: 'HVAC Outreach - Emergency Focus',
    niche: 'HVAC',
    description: 'High-urgency outreach for HVAC companies with after-hours pain points',
    steps: [
        {
            id: 'step-1',
            type: 'sms',
            delayHours: 0,
            template: hvacMessages.initial || 'Quick question — what usually happens when someone calls your HVAC business after hours and no one answers?',
            aiPersonalize: false
        },
        {
            id: 'step-2',
            type: 'wait',
            delayHours: 4,
            template: '',
            aiPersonalize: false
        },
        {
            id: 'step-3',
            type: 'sms',
            delayHours: 0,
            template: hvacMessages.follow_up || 'We built an AI receptionist that answers HVAC calls 24/7, texts missed callers instantly, and alerts you only when it\'s an emergency. It\'s already live — no setup calls. Want the activation link?',
            aiPersonalize: false
        },
        {
            id: 'step-4',
            type: 'wait',
            delayHours: 24,
            template: '',
            aiPersonalize: false
        },
        {
            id: 'step-5',
            type: 'sms',
            delayHours: 0,
            template: hvacMessages.close?.replace('{{activation_link}}', 'https://demo.microagency.ai/hvac') || 'Here\'s the activation page: https://demo.microagency.ai/hvac — Your AI receptionist is live the same day you sign up.',
            aiPersonalize: false
        }
    ],
    createdAt: new Date().toISOString()
};

// ============================================================================
// DEFAULT CAMPAIGN TEMPLATES
// ============================================================================

export const DEFAULT_PLUMBING_TEMPLATE: CampaignTemplate = {
    id: 'default-plumbing-v1',
    name: 'Plumbing Outreach - Standard',
    niche: 'Plumbing',
    description: 'Email → Wait → SMS → Wait → Follow-up sequence',
    steps: [
        {
            id: 'step-1',
            type: 'email',
            delayHours: 0,
            subject: 'Quick question about {{businessName}}',
            template: `Hi,

I noticed {{businessName}} doesn't have an after-hours answering system. 

Are you currently missing calls when you're on a job site or after hours?

I help plumbers capture 100% of their leads with an AI receptionist that:
✓ Answers calls 24/7
✓ Captures customer info
✓ Books appointments
✓ Sends instant text confirmations

👉 See it in action: https://demo.microagency.ai/plumbing

The demo is pre-loaded with realistic plumbing calls so you can see exactly how it works.

Reply to schedule a personalized walkthrough, or just check out the demo!

Best,
{{senderName}}

—
Reply to this email or text (555) 123-4567
To opt out, reply STOP`,
            aiPersonalize: true
        },
        {
            id: 'step-2',
            type: 'wait',
            delayHours: 24,
            template: '',
            aiPersonalize: false
        },
        {
            id: 'step-3',
            type: 'sms',
            delayHours: 0,
            template: `Hey, this is {{senderName}}. Sent an email about helping {{businessName}} capture more leads. Did you check out the demo? 👉 demo.microagency.ai/plumbing`,
            aiPersonalize: true
        },
        {
            id: 'step-4',
            type: 'wait',
            delayHours: 48,
            template: '',
            aiPersonalize: false
        },
        {
            id: 'step-5',
            type: 'sms',
            delayHours: 0,
            template: `Last follow-up for {{businessName}} - plumbers using our AI are capturing 30-40% more leads/month. Check out the demo: demo.microagency.ai/plumbing or reply STOP to opt out.`,
            aiPersonalize: false
        }
    ],
    createdAt: new Date().toISOString()
};

// ============================================================================
// CAMPAIGN SERVICE
// ============================================================================

/**
 * Launch a new campaign for a prospect
 */
export async function launchCampaign(
    prospect: Prospect,
    templateId: string = 'default-plumbing-v1'
): Promise<CampaignRun | null> {
    console.log(`[Campaign] Launching campaign for ${prospect.businessName} with template ${templateId}`);

    const campaignRun: CampaignRun = {
        id: generateUUID(),
        prospectId: prospect.id,
        templateId: templateId,
        status: 'active',
        currentStep: 0,
        nextActionAt: new Date().toISOString(),
        startedAt: new Date().toISOString(),
        completedAt: null,
        logs: [{
            timestamp: new Date().toISOString(),
            action: 'Campaign started',
            success: true
        }]
    };

    // TODO: Save to Supabase
    // await saveCampaignRun(campaignRun);

    // Execute first step immediately
    await executeNextStep(campaignRun, prospect);

    return campaignRun;
}

/**
 * Execute the next step in a campaign
 */
async function executeNextStep(run: CampaignRun, prospect: Prospect): Promise<void> {
    const template = getTemplate(run.templateId);
    if (!template) {
        console.error(`[Campaign] Template not found: ${run.templateId}`);
        return;
    }

    const step = template.steps[run.currentStep];
    if (!step) {
        // Campaign complete
        run.status = 'completed';
        run.completedAt = new Date().toISOString();
        run.logs.push({
            timestamp: new Date().toISOString(),
            action: 'Campaign completed - all steps executed',
            success: true
        });
        console.log(`[Campaign] Completed for ${prospect.businessName}`);
        return;
    }

    console.log(`[Campaign] Executing step ${run.currentStep + 1}: ${step.type}`);

    switch (step.type) {
        case 'wait':
            // Schedule next step
            const nextTime = new Date();
            nextTime.setHours(nextTime.getHours() + step.delayHours);
            run.nextActionAt = nextTime.toISOString();
            run.logs.push({
                timestamp: new Date().toISOString(),
                action: `Waiting ${step.delayHours} hours`,
                success: true
            });
            run.currentStep++;
            break;

        case 'email':
            await sendCampaignEmail(run, step, prospect);
            run.currentStep++;
            // Check for next step
            const nextStep = template.steps[run.currentStep];
            if (nextStep?.type !== 'wait') {
                await executeNextStep(run, prospect);
            }
            break;

        case 'sms':
            await sendCampaignSMS(run, step, prospect);
            run.currentStep++;
            // Check for next step
            const nextSmsStep = template.steps[run.currentStep];
            if (nextSmsStep?.type !== 'wait') {
                await executeNextStep(run, prospect);
            }
            break;

        case 'voice':
            // TODO: Implement voice outreach
            console.log(`[Campaign] Voice step - not yet implemented`);
            run.currentStep++;
            break;
    }
}

/**
 * Send campaign email via Resend
 */
async function sendCampaignEmail(
    run: CampaignRun,
    step: CampaignStep,
    prospect: Prospect
): Promise<boolean> {
    if (!prospect.email) {
        run.logs.push({
            timestamp: new Date().toISOString(),
            action: 'Email step skipped - no email address',
            channel: 'email',
            success: false,
            error: 'No email address'
        });
        return false;
    }

    const personalizedContent = await personalizeContent(step.template, prospect, step.aiPersonalize);
    const personalizedSubject = step.subject ? personalizeSimple(step.subject, prospect) : 'Quick question';

    console.log(`[Campaign] Sending email to ${prospect.email}`);
    console.log(`[Campaign] Subject: ${personalizedSubject}`);
    console.log(`[Campaign] Content: ${personalizedContent.substring(0, 100)}...`);

    // TODO: Integrate with Resend
    // const result = await resendService.sendEmail({
    //   to: prospect.email,
    //   subject: personalizedSubject,
    //   text: personalizedContent
    // });

    run.logs.push({
        timestamp: new Date().toISOString(),
        action: `Email sent to ${prospect.email}`,
        channel: 'email',
        message: personalizedSubject,
        success: true
    });

    // Store outbound message
    await storeMessage({
        id: generateUUID(),
        prospectId: prospect.id,
        direction: 'outbound',
        channel: 'email',
        content: personalizedContent,
        aiGenerated: step.aiPersonalize,
        createdAt: new Date().toISOString()
    });

    return true;
}

/**
 * Send campaign SMS via Twilio
 */
async function sendCampaignSMS(
    run: CampaignRun,
    step: CampaignStep,
    prospect: Prospect
): Promise<boolean> {
    if (!prospect.phone) {
        run.logs.push({
            timestamp: new Date().toISOString(),
            action: 'SMS step skipped - no phone number',
            channel: 'sms',
            success: false,
            error: 'No phone number'
        });
        return false;
    }

    const personalizedContent = await personalizeContent(step.template, prospect, step.aiPersonalize);

    console.log(`[Campaign] Sending SMS to ${prospect.phone}`);
    console.log(`[Campaign] Content: ${personalizedContent}`);

    // TODO: Integrate with Twilio
    // const result = await twilioService.sendSMS({
    //   to: prospect.phone,
    //   body: personalizedContent
    // });

    run.logs.push({
        timestamp: new Date().toISOString(),
        action: `SMS sent to ${prospect.phone}`,
        channel: 'sms',
        message: personalizedContent.substring(0, 50) + '...',
        success: true
    });

    // Store outbound message
    await storeMessage({
        id: generateUUID(),
        prospectId: prospect.id,
        direction: 'outbound',
        channel: 'sms',
        content: personalizedContent,
        aiGenerated: step.aiPersonalize,
        createdAt: new Date().toISOString()
    });

    return true;
}

/**
 * Handle inbound reply from prospect
 */
export async function handleProspectReply(
    prospectId: string,
    message: string,
    channel: CampaignChannel
): Promise<string | null> {
    console.log(`[Campaign] Inbound ${channel} from prospect ${prospectId}: ${message}`);

    // Store inbound message
    await storeMessage({
        id: generateUUID(),
        prospectId: prospectId,
        direction: 'inbound',
        channel: channel,
        content: message,
        aiGenerated: false,
        createdAt: new Date().toISOString()
    });

    // Analyze intent
    const lowerMessage = message.toLowerCase().trim();

    // Check for positive intent
    if (['yes', 'demo', 'interested', 'sure', 'ok', 'send it', 'show me'].some(k => lowerMessage.includes(k))) {
        console.log(`[Campaign] Positive intent detected - escalating to demo`);
        return await escalateToDemo(prospectId);
    }

    // Check for negative intent
    if (['no', 'stop', 'unsubscribe', 'not interested', 'remove'].some(k => lowerMessage.includes(k))) {
        console.log(`[Campaign] Negative intent detected - marking cold`);
        // TODO: Update campaign status to 'cold'
        return "No problem! I've removed you from future messages. Have a great day!";
    }

    // Otherwise, generate AI response
    return await generateAIResponse(prospectId, message, channel);
}

/**
 * Generate AI-powered response to prospect inquiry
 */
export async function generateAIResponse(
    prospectId: string,
    inboundMessage: string,
    channel: CampaignChannel
): Promise<string> {
    // TODO: Load conversation history from Supabase
    // const history = await loadConversationHistory(prospectId);

    const prompt = `You are an AI assistant helping sell an AI receptionist service to local plumbers.
The service costs $197/month and includes:
- 24/7 AI call answering
- Lead capture
- Appointment booking
- Missed call text-back

The prospect just replied to our outreach with: "${inboundMessage}"

Generate a helpful, conversational response that:
1. Answers any questions they might have
2. Moves them toward booking a demo
3. Is friendly and not pushy
4. Is appropriate for ${channel} (keep SMS short, email can be longer)

Response:`;

    // TODO: Call Gemini API
    // const response = await geminiService.generateText(prompt);

    // Placeholder response
    const response = `Thanks for your interest! I'd love to show you how the AI receptionist works. Would you like me to send you a link to our interactive demo? It takes about 5 minutes to see everything.`;

    return response;
}

/**
 * Escalate prospect to demo stage
 */
export async function escalateToDemo(prospectId: string, niche: string = 'plumbing'): Promise<string> {
    console.log(`[Campaign] Escalating prospect ${prospectId} to demo`);

    // TODO: Update campaign status to 'converted' or 'demo_sent'
    // TODO: Generate unique demo link with prospect tracking

    const demoLink = `https://demo.microagency.ai/${niche.toLowerCase()}?pid=${prospectId}`;

    const response = `Great! Here's your personalized demo:

👉 ${demoLink}

You'll see:
• Real AI-answered calls
• Captured leads with details
• Appointment booking in action
• ROI calculator with your numbers

It's 100% interactive - you can even test a simulated call!

Let me know what you think or if you'd like a live walkthrough.`;

    return response;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getTemplate(templateId: string): CampaignTemplate | null {
    // TODO: Load from Supabase
    if (templateId === 'default-hvac-v1') {
        return DEFAULT_HVAC_TEMPLATE;
    }
    if (templateId === 'default-plumbing-v1') {
        return DEFAULT_PLUMBING_TEMPLATE;
    }
    // Default to HVAC for primary niche focus
    return DEFAULT_HVAC_TEMPLATE;
}

function personalizeSimple(template: string, prospect: Prospect): string {
    return template
        .replace(/\{\{businessName\}\}/g, prospect.businessName)
        .replace(/\{\{senderName\}\}/g, 'Florida So Consulting') // TODO: Make configurable
        .replace(/\{\{address\}\}/g, prospect.address);
}

async function personalizeContent(
    template: string,
    prospect: Prospect,
    useAI: boolean
): Promise<string> {
    let content = personalizeSimple(template, prospect);

    if (useAI) {
        // TODO: Use Gemini to further personalize based on prospect pain points
        // For now, just add pain point mentions
        if (prospect.painPoints.length > 0) {
            const painPointMention = prospect.painPoints[0];
            content = content.replace(
                '{{painPoint}}',
                painPointMention.toLowerCase()
            );
        }
    }

    return content;
}

async function storeMessage(message: ProspectMessage): Promise<void> {
    console.log(`[Campaign] Storing message:`, message);
    // TODO: Save to Supabase prospect_messages table
}

function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// ============================================================================
// CAMPAIGN SCHEDULER (for processing waiting campaigns)
// ============================================================================

/**
 * Process campaigns that have pending actions
 * This would be called by a background job or Edge Function
 */
export async function processPendingCampaigns(): Promise<void> {
    console.log(`[Campaign] Processing pending campaigns...`);

    // TODO: Query Supabase for campaigns where:
    // - status = 'active'
    // - nextActionAt <= now

    // For each campaign, load the prospect and execute next step
}
