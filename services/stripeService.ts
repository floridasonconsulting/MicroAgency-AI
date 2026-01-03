/**
 * Stripe Integration Service
 * 
 * This service handles Stripe payment integration for the Recepticom platform.
 * 
 * IMPORTANT: For production, Stripe operations that require the secret key 
 * (like creating checkout sessions) should be done via a backend/serverless function.
 * This client-side code is designed to work with Stripe.js and redirect to Checkout.
 * 
 * For a full implementation, you would:
 * 1. Create a Supabase Edge Function or API route for secure operations
 * 2. Use environment variables for keys (never expose secret key in client)
 */

// Pricing tiers for the AI Receptionist service
export const PRICING_TIERS = {
    starter: {
        name: 'Starter',
        price: 197,
        priceId: '', // Stripe Price ID - set from settings
        features: [
            '24/7 AI Receptionist',
            'SMS Auto-Response',
            'Up to 500 calls/month',
            'Basic Analytics',
            'Email Support'
        ]
    },
    professional: {
        name: 'Professional',
        price: 297,
        priceId: '', // Stripe Price ID - set from settings
        features: [
            'Everything in Starter',
            'Unlimited calls',
            'Voice AI (Custom Voice)',
            'Calendar Integration',
            'Priority Support'
        ]
    },
    enterprise: {
        name: 'Enterprise',
        price: 497,
        priceId: '', // Stripe Price ID - set from settings
        features: [
            'Everything in Professional',
            'Multiple Phone Numbers',
            'Custom AI Training',
            'White-Label Options',
            'Dedicated Account Manager'
        ]
    }
};

export type PricingTier = keyof typeof PRICING_TIERS;

/**
 * Get Stripe configuration from localStorage
 */
export const getStripeConfig = (): { publishableKey: string; priceIds: Record<string, string> } | null => {
    const saved = localStorage.getItem('agency_settings');
    if (!saved) return null;

    const settings = JSON.parse(saved);
    if (!settings.stripePublicKey) return null;

    return {
        publishableKey: settings.stripePublicKey,
        priceIds: {
            starter: settings.stripePriceIdStarter || '',
            professional: settings.stripePriceIdProfessional || '',
            enterprise: settings.stripePriceIdEnterprise || ''
        }
    };
};

/**
 * Check if Stripe is configured
 */
export const isStripeConfigured = (): boolean => {
    const config = getStripeConfig();
    return config !== null && config.publishableKey.startsWith('pk_');
};

/**
 * Create a checkout session redirect URL
 * 
 * In production, this would call a backend endpoint that creates the session.
 * For demo purposes, we use Stripe Payment Links or direct checkout.
 */
export const createCheckoutUrl = (
    tier: PricingTier,
    clientEmail: string,
    clientId: string,
    successUrl?: string,
    cancelUrl?: string
): string | null => {
    const config = getStripeConfig();
    if (!config) return null;

    const priceId = config.priceIds[tier];
    if (!priceId) {
        console.warn(`No price ID configured for tier: ${tier}`);
        return null;
    }

    // Build Stripe Checkout URL with prefilled email and metadata
    // Note: This requires a Payment Link or backend session creation
    const baseUrl = successUrl || window.location.origin;

    // For production: Call your backend to create a session
    // For demo: Return a placeholder that shows where to integrate
    console.log(`[Stripe] Would create checkout for:`, {
        tier,
        priceId,
        clientEmail,
        clientId,
        successUrl: `${baseUrl}/success?client_id=${clientId}`,
        cancelUrl: cancelUrl || `${baseUrl}/cancel`
    });

    return null; // Replace with actual checkout URL from backend
};

/**
 * Redirect to Stripe Customer Portal
 * 
 * The customer portal allows clients to:
 * - Update payment methods
 * - View invoices
 * - Cancel subscriptions
 * - Change plans
 */
export const redirectToCustomerPortal = async (customerId: string): Promise<boolean> => {
    const config = getStripeConfig();
    if (!config) {
        console.error('Stripe not configured');
        return false;
    }

    // In production: Call backend to create portal session
    // POST /api/stripe/create-portal-session { customerId }
    console.log(`[Stripe] Would redirect customer ${customerId} to billing portal`);

    // Placeholder - return false until backend is implemented
    return false;
};

/**
 * Get subscription status for a client
 * This would typically query Supabase for stored subscription data
 */
export interface SubscriptionStatus {
    active: boolean;
    tier: PricingTier | null;
    currentPeriodEnd: Date | null;
    cancelAtPeriodEnd: boolean;
    stripeSubscriptionId: string | null;
    stripeCustomerId: string | null;
}

export const getSubscriptionStatus = async (clientId: string): Promise<SubscriptionStatus> => {
    // Query Supabase for client's subscription info
    // For now, return a default status
    return {
        active: false,
        tier: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        stripeSubscriptionId: null,
        stripeCustomerId: null
    };
};

/**
 * Handle webhook events from Stripe
 * 
 * This would be implemented in a Supabase Edge Function:
 * 
 * Webhook events to handle:
 * - checkout.session.completed -> Create/update client subscription
 * - customer.subscription.updated -> Update subscription status
 * - customer.subscription.deleted -> Mark subscription as cancelled
 * - invoice.paid -> Record payment
 * - invoice.payment_failed -> Alert admin
 */
export const WEBHOOK_EVENTS = [
    'checkout.session.completed',
    'customer.subscription.created',
    'customer.subscription.updated',
    'customer.subscription.deleted',
    'invoice.paid',
    'invoice.payment_failed'
] as const;

/**
 * Simulate a successful checkout for demo purposes
 * This creates a mock subscription in the database
 */
export const simulateSuccessfulCheckout = async (
    clientId: string,
    tier: PricingTier
): Promise<{ success: boolean; message: string }> => {
    try {
        // Import Supabase service dynamically to avoid circular deps
        const { updateClient } = await import('./supabase');

        const tierInfo = PRICING_TIERS[tier];
        const mockSubscriptionId = `sub_demo_${Date.now()}`;
        const mockCustomerId = `cus_demo_${Date.now()}`;

        // Update client with subscription info
        // Map tier prices to valid subscription tier strings
        const tierMap: Record<PricingTier, '$197/mo' | '$297/mo' | '$497/mo'> = {
            starter: '$197/mo',
            professional: '$297/mo',
            enterprise: '$497/mo'
        };

        await updateClient(clientId, {
            subscriptionTier: tierMap[tier],
            mrr: tierInfo.price,
            status: 'Active',
            stripeCustomerId: mockCustomerId,
            stripeSubscriptionId: mockSubscriptionId
        });

        return {
            success: true,
            message: `Demo subscription created for ${tierInfo.name} tier`
        };
    } catch (error) {
        console.error('Error simulating checkout:', error);
        return {
            success: false,
            message: 'Failed to create demo subscription'
        };
    }
};

/**
 * Calculate MRR from active clients
 */
export const calculateMRR = (clients: Array<{ mrr?: number; status?: string }>): number => {
    return clients
        .filter(c => c.status === 'Active' || c.status === 'active')
        .reduce((sum, c) => sum + (c.mrr || 0), 0);
};
