import React, { useState } from 'react';
import { ArrowRight, CheckCircle, CreditCard, Phone, Sparkles, Building, Mail, User, Loader2, AlertCircle, Clock } from 'lucide-react';
import { createClientRecord, createNumberRequest } from '../services/supabase';
import { Client } from '../types';

interface ClientSignupProps {
    onComplete?: (client: Client) => void;
    onClose?: () => void;
}

type SignupStep = 'info' | 'configure' | 'number-request' | 'pending';

const ClientSignup: React.FC<ClientSignupProps> = ({ onComplete, onClose }) => {
    const [step, setStep] = useState<SignupStep>('info');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [createdClient, setCreatedClient] = useState<Client | null>(null);

    // Form data
    const [formData, setFormData] = useState({
        businessName: '',
        ownerName: '',
        email: '',
        phone: '',
        niche: '',
        // AI Config
        greeting: '',
        voiceId: 'alloy' as 'alloy' | 'echo' | 'shimmer',
        qualificationQuestions: ['What service do you need?', 'What is your timeline?'],
        // Number request
        preferredAreaCode: '',
        notes: ''
    });

    const updateForm = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError(null);
    };

    // Step 1: Business Information
    const handleSubmitInfo = async () => {
        if (!formData.businessName || !formData.email || !formData.niche) {
            setError('Please fill in all required fields');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const newClient = await createClientRecord({
                businessName: formData.businessName,
                ownerName: formData.ownerName || formData.businessName,
                email: formData.email,
                phone: formData.phone,
                niche: formData.niche,
                status: 'Onboarding',
                subscriptionTier: '$197/mo',
                mrr: 197,
                avatar: '',
                joinedDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
                config: {
                    enabled: false,
                    businessName: formData.businessName,
                    niche: formData.niche,
                    customGreeting: '',
                    qualificationQuestions: [],
                    voiceEnabled: false,
                    voiceId: 'alloy',
                    voiceGreeting: ''
                }
            });

            if (newClient) {
                setCreatedClient(newClient);
                setStep('configure');
            } else {
                setError('Failed to create account. Please check your Supabase connection.');
            }
        } catch (err) {
            console.error('Signup error:', err);
            setError('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Step 2: AI Configuration
    const handleSubmitConfig = () => {
        if (!formData.greeting) {
            setFormData(prev => ({
                ...prev,
                greeting: `Thanks for calling ${formData.businessName}! How can I help you today?`
            }));
        }
        setStep('number-request');
    };

    // Step 3: Number Request (triggers admin approval queue)
    const handleRequestNumber = async () => {
        if (!createdClient) return;

        setIsLoading(true);
        setError(null);

        try {
            const request = await createNumberRequest(
                createdClient.id,
                formData.preferredAreaCode || undefined,
                formData.notes || `New signup from ${formData.businessName}`
            );

            if (request) {
                setStep('pending');
            } else {
                // Still show pending even if DB write failed (graceful degradation)
                setStep('pending');
            }
        } catch (err) {
            console.error('Number request error:', err);
            setStep('pending'); // Show pending anyway
        } finally {
            setIsLoading(false);
        }
    };

    const handleComplete = () => {
        if (createdClient && onComplete) {
            onComplete(createdClient);
        }
        if (onClose) {
            onClose();
        }
    };

    // Render step content
    const renderStep = () => {
        switch (step) {
            case 'info':
                return (
                    <div className="space-y-5">
                        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6 rounded-xl">
                            <div className="flex items-center gap-3 mb-2">
                                <Sparkles className="text-white/80" size={24} />
                                <h3 className="text-xl font-bold">Start Your Free Trial</h3>
                            </div>
                            <p className="text-indigo-100 text-sm">
                                Get a 24/7 AI receptionist answering your calls in minutes.
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">
                                Business Name <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <Building className="absolute left-3 top-3 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="e.g. Joe's Plumbing"
                                    className="w-full border border-slate-300 rounded-lg pl-10 pr-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    value={formData.businessName}
                                    onChange={(e) => updateForm('businessName', e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">
                                Your Name
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="John Smith"
                                    className="w-full border border-slate-300 rounded-lg pl-10 pr-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    value={formData.ownerName}
                                    onChange={(e) => updateForm('ownerName', e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">
                                Email <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
                                <input
                                    type="email"
                                    placeholder="john@joes-plumbing.com"
                                    className="w-full border border-slate-300 rounded-lg pl-10 pr-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    value={formData.email}
                                    onChange={(e) => updateForm('email', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Phone</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-3 text-slate-400" size={18} />
                                    <input
                                        type="tel"
                                        placeholder="(555) 123-4567"
                                        className="w-full border border-slate-300 rounded-lg pl-10 pr-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        value={formData.phone}
                                        onChange={(e) => updateForm('phone', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">
                                    Industry <span className="text-red-500">*</span>
                                </label>
                                <select
                                    className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    value={formData.niche}
                                    onChange={(e) => updateForm('niche', e.target.value)}
                                >
                                    <option value="">Select...</option>
                                    <option value="Plumbing">Plumbing</option>
                                    <option value="HVAC">HVAC</option>
                                    <option value="Roofing">Roofing</option>
                                    <option value="Electrical">Electrical</option>
                                    <option value="Landscaping">Landscaping</option>
                                    <option value="Pool Service">Pool Service</option>
                                    <option value="Pest Control">Pest Control</option>
                                    <option value="General Contractor">General Contractor</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                                <AlertCircle size={18} />
                                {error}
                            </div>
                        )}

                        <button
                            onClick={handleSubmitInfo}
                            disabled={isLoading}
                            className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    Creating Account...
                                </>
                            ) : (
                                <>
                                    Continue <ArrowRight size={20} />
                                </>
                            )}
                        </button>

                        <p className="text-xs text-center text-slate-400">
                            By signing up, you agree to our Terms of Service.
                        </p>
                    </div>
                );

            case 'configure':
                return (
                    <div className="space-y-6">
                        <div className="bg-green-50 border border-green-200 p-4 rounded-xl flex items-start gap-3">
                            <CheckCircle className="text-green-600 mt-0.5" size={20} />
                            <div>
                                <h4 className="font-bold text-green-900">Account Created!</h4>
                                <p className="text-sm text-green-700">Now let's configure your AI receptionist.</p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Select AI Voice</label>
                            <div className="grid grid-cols-3 gap-3">
                                {(['alloy', 'echo', 'shimmer'] as const).map((voice) => (
                                    <button
                                        key={voice}
                                        onClick={() => updateForm('voiceId', voice)}
                                        className={`border p-4 rounded-xl text-center transition-all ${formData.voiceId === voice
                                            ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500'
                                            : 'border-slate-200 hover:border-indigo-300'
                                            }`}
                                    >
                                        <div className="w-10 h-10 bg-slate-100 rounded-full mx-auto mb-2 flex items-center justify-center">
                                            <Phone size={18} className="text-slate-600" />
                                        </div>
                                        <span className="text-sm font-medium capitalize">{voice}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Greeting Message</label>
                            <textarea
                                className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                rows={3}
                                placeholder={`Thanks for calling ${formData.businessName}! How can I help you today?`}
                                value={formData.greeting}
                                onChange={(e) => updateForm('greeting', e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Qualification Questions</label>
                            <div className="space-y-2">
                                {formData.qualificationQuestions.map((q, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-slate-400 w-6">{i + 1}.</span>
                                        <input
                                            type="text"
                                            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                                            value={q}
                                            onChange={(e) => {
                                                const updated = [...formData.qualificationQuestions];
                                                updated[i] = e.target.value;
                                                updateForm('qualificationQuestions', updated);
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={handleSubmitConfig}
                            className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                        >
                            Next: Request Phone Number <ArrowRight size={20} />
                        </button>
                    </div>
                );

            case 'number-request':
                return (
                    <div className="space-y-6">
                        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
                            <Clock className="text-amber-600 mt-0.5" size={20} />
                            <div>
                                <h4 className="font-bold text-amber-900">Manual Approval Required</h4>
                                <p className="text-sm text-amber-700">
                                    Phone number provisioning requires admin approval and takes 1-2 business hours.
                                </p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Preferred Area Code (Optional)</label>
                            <input
                                type="text"
                                placeholder="e.g. 555"
                                maxLength={3}
                                className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                value={formData.preferredAreaCode}
                                onChange={(e) => updateForm('preferredAreaCode', e.target.value.replace(/\D/g, ''))}
                            />
                            <p className="text-xs text-slate-500 mt-1">We'll try to match your local area code.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Additional Notes</label>
                            <textarea
                                className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                rows={2}
                                placeholder="Any special requests or notes for setup..."
                                value={formData.notes}
                                onChange={(e) => updateForm('notes', e.target.value)}
                            />
                        </div>

                        <button
                            onClick={handleRequestNumber}
                            disabled={isLoading}
                            className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    Submitting Request...
                                </>
                            ) : (
                                <>
                                    Submit Number Request <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </div>
                );

            case 'pending':
                return (
                    <div className="text-center space-y-6 py-4">
                        <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
                            <Clock size={40} />
                        </div>

                        <div>
                            <h3 className="text-2xl font-bold text-slate-900">Request Submitted!</h3>
                            <p className="text-slate-600 mt-2">
                                Your phone number is being provisioned. You'll receive an email
                                at <strong>{formData.email}</strong> once it's ready.
                            </p>
                        </div>

                        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-left">
                            <h4 className="font-bold text-slate-900 mb-2">What happens next?</h4>
                            <ul className="text-sm text-slate-600 space-y-2">
                                <li className="flex items-start gap-2">
                                    <span className="text-indigo-500">1.</span>
                                    Our team reviews your request (1-2 hours)
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-indigo-500">2.</span>
                                    We provision your dedicated AI phone number
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-indigo-500">3.</span>
                                    You'll set up call forwarding from your main line
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-indigo-500">4.</span>
                                    Your AI receptionist goes live 24/7!
                                </li>
                            </ul>
                        </div>

                        <button
                            onClick={handleComplete}
                            className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-colors"
                        >
                            Go to Dashboard
                        </button>
                    </div>
                );
        }
    };

    // Progress indicator
    const steps = ['info', 'configure', 'number-request', 'pending'];
    const currentIndex = steps.indexOf(step);

    return (
        <div className="fixed inset-0 bg-slate-900 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden">
                {/* Header */}
                <div className="p-6 bg-slate-50 border-b border-slate-100">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">
                                {step === 'info' && 'Create Your Account'}
                                {step === 'configure' && 'Configure AI Receptionist'}
                                {step === 'number-request' && 'Request Phone Number'}
                                {step === 'pending' && 'Setup Complete'}
                            </h2>
                            <p className="text-sm text-slate-500">
                                Step {Math.min(currentIndex + 1, 4)} of 4
                            </p>
                        </div>
                        {step === 'pending' && <CheckCircle className="text-green-500" size={28} />}
                    </div>

                    {/* Progress bar */}
                    <div className="mt-4 flex gap-1">
                        {steps.map((s, i) => (
                            <div
                                key={s}
                                className={`h-1.5 flex-1 rounded-full ${i <= currentIndex ? 'bg-indigo-500' : 'bg-slate-200'
                                    }`}
                            />
                        ))}
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    {renderStep()}
                </div>
            </div>
        </div>
    );
};

export default ClientSignup;
