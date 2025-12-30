/**
 * Niche Configuration Service
 * Loads and provides niche-specific settings for AI, outreach, and pricing
 */

import hvacConfig from '../hvac_niche_config.json';

// ============================================================================
// TYPES
// ============================================================================

export interface NicheConfig {
    niche: {
        id: string;
        display_name: string;
        target_company_size: string;
        service_area: string;
        decision_maker: string;
        urgency_level: string;
        seasonality: string[];
        average_job_value_usd: { min: number; max: number };
        primary_pain_points: string[];
    };
    ai_receptionist: {
        role: string;
        system_prompt: string;
        tone: string;
        answer_speed: string;
        goals: string[];
    };
    qualification_flow: QualificationStep[];
    escalation_rules: {
        trigger_conditions: Array<{ field: string; value: string }>;
        notify_owner_via: string[];
        owner_alert_template: string;
    };
    outreach: {
        lead_finder_filters: {
            industry_keywords: string[];
            exclude_keywords: string[];
            business_size: string;
            location_scope: string;
        };
        messages: {
            initial: string;
            follow_up: string;
            close: string;
        };
    };
    pricing: {
        [planName: string]: {
            price_usd_monthly: number;
            features: string[];
        };
    };
    retention: {
        monthly_value_message: string;
    };
    referral: {
        message: string;
    };
    agency_expansion: {
        enabled: boolean;
        positioning: string;
        suggested_pricing_usd_monthly: number[];
    };
}

export interface QualificationStep {
    field: string;
    question: string;
    options?: string[];
}

// ============================================================================
// NICHE REGISTRY
// ============================================================================

const nicheConfigs: Map<string, NicheConfig> = new Map();

// Load HVAC config by default
nicheConfigs.set('hvac', hvacConfig as NicheConfig);
nicheConfigs.set('hvac_small_business', hvacConfig as NicheConfig);

// Alias for common searches
nicheConfigs.set('heating', hvacConfig as NicheConfig);
nicheConfigs.set('air conditioning', hvacConfig as NicheConfig);
nicheConfigs.set('ac repair', hvacConfig as NicheConfig);

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Get niche configuration by niche ID or name
 */
export function getNicheConfig(nicheId: string): NicheConfig | null {
    const normalizedId = nicheId.toLowerCase().replace(/[^a-z0-9]/g, '_');
    return nicheConfigs.get(normalizedId) || nicheConfigs.get('hvac') || null;
}

/**
 * Get all available niche IDs
 */
export function getAvailableNiches(): string[] {
    return Array.from(new Set(
        Array.from(nicheConfigs.entries())
            .map(([_, config]) => config.niche.id)
    ));
}

/**
 * Get AI receptionist system prompt for a niche
 */
export function getAIReceptionistPrompt(nicheId: string): string {
    const config = getNicheConfig(nicheId);
    if (!config) {
        return 'You are a professional AI receptionist. Help callers with their inquiries.';
    }
    return config.ai_receptionist.system_prompt;
}

/**
 * Get qualification flow for a niche
 */
export function getQualificationFlow(nicheId: string): QualificationStep[] {
    const config = getNicheConfig(nicheId);
    return config?.qualification_flow || [];
}

/**
 * Get escalation rules for a niche
 */
export function getEscalationRules(nicheId: string) {
    const config = getNicheConfig(nicheId);
    return config?.escalation_rules || null;
}

/**
 * Get outreach messages for a niche
 */
export function getOutreachMessages(nicheId: string) {
    const config = getNicheConfig(nicheId);
    return config?.outreach.messages || {
        initial: '',
        follow_up: '',
        close: '',
    };
}

/**
 * Get lead finder filters for a niche
 */
export function getLeadFinderFilters(nicheId: string) {
    const config = getNicheConfig(nicheId);
    return config?.outreach.lead_finder_filters || {
        industry_keywords: [],
        exclude_keywords: [],
        business_size: 'small',
        location_scope: 'local',
    };
}

/**
 * Get pricing for a niche
 */
export function getNichePricing(nicheId: string) {
    const config = getNicheConfig(nicheId);
    if (!config) return null;

    const plans = Object.entries(config.pricing).map(([name, details]) => ({
        name,
        priceMonthly: details.price_usd_monthly,
        features: details.features,
    }));

    return plans;
}

/**
 * Check if a lead should trigger escalation based on responses
 */
export function shouldEscalate(nicheId: string, responses: Record<string, string>): boolean {
    const rules = getEscalationRules(nicheId);
    if (!rules) return false;

    return rules.trigger_conditions.some(condition =>
        responses[condition.field]?.toLowerCase() === condition.value.toLowerCase()
    );
}

/**
 * Generate owner alert message from template
 */
export function generateOwnerAlert(nicheId: string, leadData: Record<string, string>): string {
    const rules = getEscalationRules(nicheId);
    if (!rules) return '';

    let message = rules.owner_alert_template;
    for (const [key, value] of Object.entries(leadData)) {
        message = message.replace(new RegExp(`{{${key}}}`, 'g'), value || 'N/A');
    }
    return message;
}

/**
 * Get retention message template
 */
export function getRetentionMessage(nicheId: string): string {
    const config = getNicheConfig(nicheId);
    return config?.retention.monthly_value_message || '';
}

/**
 * Get referral message
 */
export function getReferralMessage(nicheId: string): string {
    const config = getNicheConfig(nicheId);
    return config?.referral.message || '';
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
    getNicheConfig,
    getAvailableNiches,
    getAIReceptionistPrompt,
    getQualificationFlow,
    getEscalationRules,
    getOutreachMessages,
    getLeadFinderFilters,
    getNichePricing,
    shouldEscalate,
    generateOwnerAlert,
    getRetentionMessage,
    getReferralMessage,
};
