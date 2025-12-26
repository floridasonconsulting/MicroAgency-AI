import React, { useState } from 'react';
import { Check, Sparkles, Loader2, CreditCard, AlertCircle, ExternalLink } from 'lucide-react';
import { PRICING_TIERS, PricingTier, isStripeConfigured, simulateSuccessfulCheckout } from '../services/stripeService';

interface PricingCardProps {
    tier: PricingTier;
    isPopular?: boolean;
    clientId?: string;
    clientEmail?: string;
    onSelectTier?: (tier: PricingTier) => void;
}

const PricingCard: React.FC<PricingCardProps> = ({
    tier,
    isPopular = false,
    clientId,
    clientEmail,
    onSelectTier
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const tierInfo = PRICING_TIERS[tier];

    const handleSelect = async () => {
        setIsLoading(true);

        if (onSelectTier) {
            onSelectTier(tier);
        }

        // For demo: simulate checkout
        if (clientId) {
            const result = await simulateSuccessfulCheckout(clientId, tier);
            console.log('Checkout result:', result);
        }

        setIsLoading(false);
    };

    return (
        <div
            className={`relative bg-white rounded-2xl border-2 p-6 flex flex-col transition-all hover:shadow-lg ${isPopular
                    ? 'border-indigo-500 shadow-md'
                    : 'border-slate-200 hover:border-indigo-300'
                }`}
        >
            {/* Popular Badge */}
            {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold px-4 py-1 rounded-full flex items-center gap-1">
                        <Sparkles size={12} />
                        Most Popular
                    </span>
                </div>
            )}

            {/* Tier Name */}
            <h3 className="text-xl font-bold text-slate-900 mb-2">{tierInfo.name}</h3>

            {/* Price */}
            <div className="mb-6">
                <span className="text-4xl font-bold text-slate-900">${tierInfo.price}</span>
                <span className="text-slate-500 text-sm">/month</span>
            </div>

            {/* Features */}
            <ul className="space-y-3 mb-8 flex-1">
                {tierInfo.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                        <Check className="text-green-500 shrink-0 mt-0.5" size={16} />
                        {feature}
                    </li>
                ))}
            </ul>

            {/* CTA Button */}
            <button
                onClick={handleSelect}
                disabled={isLoading}
                className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${isPopular
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-md'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    } disabled:opacity-50`}
            >
                {isLoading ? (
                    <>
                        <Loader2 className="animate-spin" size={18} />
                        Processing...
                    </>
                ) : (
                    <>
                        <CreditCard size={18} />
                        Get Started
                    </>
                )}
            </button>
        </div>
    );
};

interface PricingPageProps {
    clientId?: string;
    clientEmail?: string;
    onSelectTier?: (tier: PricingTier) => void;
    onClose?: () => void;
}

const PricingPage: React.FC<PricingPageProps> = ({
    clientId,
    clientEmail,
    onSelectTier,
    onClose
}) => {
    const stripeConfigured = isStripeConfigured();

    return (
        <div className="bg-slate-50 min-h-screen py-12 px-4">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-slate-900 mb-4">
                        Simple, Transparent Pricing
                    </h1>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                        Get a 24/7 AI receptionist that never misses a call.
                        Start with a 7-day free trial, cancel anytime.
                    </p>
                </div>

                {/* Stripe Warning */}
                {!stripeConfigured && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 flex items-start gap-3 max-w-xl mx-auto">
                        <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={20} />
                        <div>
                            <h4 className="font-bold text-amber-900">Demo Mode</h4>
                            <p className="text-sm text-amber-700">
                                Stripe is not configured. Checkout will simulate a successful subscription.
                                Configure Stripe keys in Settings to enable real payments.
                            </p>
                        </div>
                    </div>
                )}

                {/* Pricing Cards */}
                <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
                    <PricingCard
                        tier="starter"
                        clientId={clientId}
                        clientEmail={clientEmail}
                        onSelectTier={onSelectTier}
                    />
                    <PricingCard
                        tier="professional"
                        isPopular
                        clientId={clientId}
                        clientEmail={clientEmail}
                        onSelectTier={onSelectTier}
                    />
                    <PricingCard
                        tier="enterprise"
                        clientId={clientId}
                        clientEmail={clientEmail}
                        onSelectTier={onSelectTier}
                    />
                </div>

                {/* Trust Badges */}
                <div className="mt-12 text-center">
                    <div className="flex justify-center items-center gap-8 text-slate-400 text-sm">
                        <span className="flex items-center gap-1">
                            <Check className="text-green-500" size={16} />
                            7-Day Free Trial
                        </span>
                        <span className="flex items-center gap-1">
                            <Check className="text-green-500" size={16} />
                            No Setup Fees
                        </span>
                        <span className="flex items-center gap-1">
                            <Check className="text-green-500" size={16} />
                            Cancel Anytime
                        </span>
                    </div>
                </div>

                {/* Back Button */}
                {onClose && (
                    <div className="mt-8 text-center">
                        <button
                            onClick={onClose}
                            className="text-slate-500 hover:text-slate-700 text-sm underline"
                        >
                            Go Back
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// Billing Portal Button - for existing subscribers
export const BillingPortalButton: React.FC<{ customerId?: string }> = ({ customerId }) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleClick = async () => {
        if (!customerId) {
            alert('No subscription found. Please contact support.');
            return;
        }

        setIsLoading(true);

        // In production: redirect to Stripe Customer Portal
        // For demo: show a message
        setTimeout(() => {
            alert('Demo Mode: Would redirect to Stripe Customer Portal for billing management.');
            setIsLoading(false);
        }, 1000);
    };

    return (
        <button
            onClick={handleClick}
            disabled={isLoading}
            className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
            {isLoading ? (
                <Loader2 className="animate-spin" size={16} />
            ) : (
                <ExternalLink size={16} />
            )}
            Manage Billing
        </button>
    );
};

export { PricingCard, PricingPage };
export default PricingPage;
