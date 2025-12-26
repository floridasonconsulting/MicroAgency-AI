import React, { useState, useRef } from 'react';
import { X, Building, User, Mail, Phone, Briefcase, CreditCard, AlertCircle, Loader2, CheckCircle, Upload, FileSpreadsheet } from 'lucide-react';
import { Client } from '../types';
import { createClientRecord, createNumberRequest } from '../services/supabase';

interface AddClientModalProps {
    onClose: () => void;
    onAddClient: (client: Client) => void;
}

type ModalMode = 'single' | 'import';

const AddClientModal: React.FC<AddClientModalProps> = ({
    onClose,
    onAddClient
}) => {
    const [mode, setMode] = useState<ModalMode>('single');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [successCount, setSuccessCount] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        businessName: '',
        ownerName: '',
        email: '',
        phone: '',
        niche: '',
        subscriptionTier: '$197/mo' as Client['subscriptionTier'],
        status: 'Onboarding' as Client['status'],
        requestNumber: true
    });

    const niches = [
        'Plumbing', 'HVAC', 'Roofing', 'Electrical', 'Landscaping',
        'Pool Service', 'Pest Control', 'General Contractor', 'Solar',
        'Cleaning Services', 'Moving', 'Auto Repair', 'Real Estate', 'Other'
    ];

    const handleChange = (field: string, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.businessName.trim()) {
            setError('Business name is required');
            return;
        }
        if (!formData.email.trim()) {
            setError('Email is required');
            return;
        }
        if (!formData.phone.trim()) {
            setError('Phone number is required');
            return;
        }
        if (!formData.niche) {
            setError('Please select an industry');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Create client record
            const newClient = await createClientRecord({
                businessName: formData.businessName.trim(),
                ownerName: formData.ownerName.trim() || formData.businessName.trim(),
                email: formData.email.trim(),
                phone: formData.phone.trim(),
                niche: formData.niche,
                status: formData.status,
                subscriptionTier: formData.subscriptionTier,
                mrr: parseInt(formData.subscriptionTier.replace(/\D/g, '')),
                avatar: '',
                joinedDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
                config: {
                    enabled: false,
                    businessName: formData.businessName.trim(),
                    niche: formData.niche,
                    customGreeting: '',
                    qualificationQuestions: [],
                    voiceEnabled: false,
                    voiceId: 'alloy',
                    voiceGreeting: ''
                }
            });

            if (newClient) {
                // Create number request if option is checked
                if (formData.requestNumber) {
                    await createNumberRequest(newClient.id, undefined, 'Auto-created on manual client add');
                }

                onAddClient(newClient);
                setSuccessCount(1);
                setSuccess(true);

                // Auto-close after success
                setTimeout(() => {
                    onClose();
                }, 1500);
            } else {
                throw new Error('Failed to create client');
            }
        } catch (err) {
            console.error('Error adding client:', err);
            setError('Failed to add client. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        setError(null);

        try {
            const text = await file.text();
            const lines = text.split('\n').filter(line => line.trim());

            if (lines.length < 2) {
                throw new Error('CSV must have a header row and at least one data row');
            }

            const header = lines[0].toLowerCase();
            const hasRequiredColumns = header.includes('business') &&
                (header.includes('email') || header.includes('phone'));

            if (!hasRequiredColumns) {
                throw new Error('CSV must have columns for: business name, and either email or phone');
            }

            // Parse header to get column indices
            const columns = lines[0].split(',').map(c => c.trim().toLowerCase());
            const getIndex = (keywords: string[]) =>
                columns.findIndex(c => keywords.some(k => c.includes(k)));

            const indices = {
                business: getIndex(['business', 'company', 'name']),
                owner: getIndex(['owner', 'contact', 'first']),
                email: getIndex(['email', 'mail']),
                phone: getIndex(['phone', 'tel', 'mobile']),
                niche: getIndex(['niche', 'industry', 'category', 'type']),
                tier: getIndex(['tier', 'plan', 'subscription', 'price'])
            };

            let successfulImports = 0;
            const importedClients: Client[] = [];

            // Process each data row
            for (let i = 1; i < lines.length; i++) {
                const values = parseCSVLine(lines[i]);
                if (values.length < 2) continue;

                const businessName = values[indices.business] || values[0];
                const email = indices.email >= 0 ? values[indices.email] : '';
                const phone = indices.phone >= 0 ? values[indices.phone] : '';

                if (!businessName || (!email && !phone)) continue;

                try {
                    const client = await createClientRecord({
                        businessName: businessName.trim(),
                        ownerName: indices.owner >= 0 ? values[indices.owner]?.trim() || businessName : businessName,
                        email: email.trim(),
                        phone: phone.trim(),
                        niche: indices.niche >= 0 ? values[indices.niche]?.trim() || 'Other' : 'Other',
                        status: 'Onboarding',
                        subscriptionTier: '$197/mo',
                        mrr: 197,
                        avatar: '',
                        joinedDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
                        config: {
                            enabled: false,
                            businessName: businessName.trim(),
                            niche: 'Other',
                            customGreeting: '',
                            qualificationQuestions: [],
                            voiceEnabled: false,
                            voiceId: 'alloy',
                            voiceGreeting: ''
                        }
                    });

                    if (client) {
                        // Create number request for each imported client
                        await createNumberRequest(client.id, undefined, 'Imported via CSV');
                        importedClients.push(client);
                        successfulImports++;
                    }
                } catch (err) {
                    console.warn(`Failed to import row ${i}:`, err);
                }
            }

            if (successfulImports === 0) {
                throw new Error('No clients were imported. Check your CSV format.');
            }

            importedClients.forEach(client => onAddClient(client));
            setSuccessCount(successfulImports);
            setSuccess(true);

            setTimeout(() => {
                onClose();
            }, 2000);
        } catch (err) {
            console.error('CSV import error:', err);
            setError(err instanceof Error ? err.message : 'Failed to import CSV');
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl p-8 text-center max-w-sm">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">
                        {successCount === 1 ? 'Client Added!' : `${successCount} Clients Imported!`}
                    </h3>
                    <p className="text-slate-600">
                        {successCount === 1
                            ? `${formData.businessName} has been added.`
                            : 'Number requests created for each client.'
                        }
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                {/* Header */}
                <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-slate-900">Add New Client</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                {/* Mode Tabs */}
                <div className="flex border-b border-slate-100">
                    <button
                        onClick={() => setMode('single')}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${mode === 'single'
                                ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600'
                                : 'text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        <User size={16} className="inline mr-2" />
                        Single Entry
                    </button>
                    <button
                        onClick={() => setMode('import')}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${mode === 'import'
                                ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600'
                                : 'text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        <FileSpreadsheet size={16} className="inline mr-2" />
                        CSV Import
                    </button>
                </div>

                {mode === 'single' ? (
                    /* Single Entry Form */
                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        {/* Business Name */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Business Name <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <Building className="absolute left-3 top-3 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Acme Plumbing"
                                    className="w-full border border-slate-300 rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    value={formData.businessName}
                                    onChange={(e) => handleChange('businessName', e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Owner Name & Email */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Owner Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="John Smith"
                                        className="w-full border border-slate-300 rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        value={formData.ownerName}
                                        onChange={(e) => handleChange('ownerName', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Email <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
                                    <input
                                        type="email"
                                        placeholder="john@acme.com"
                                        className="w-full border border-slate-300 rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        value={formData.email}
                                        onChange={(e) => handleChange('email', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Phone & Niche */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Phone <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-3 text-slate-400" size={18} />
                                    <input
                                        type="tel"
                                        placeholder="(555) 123-4567"
                                        className="w-full border border-slate-300 rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        value={formData.phone}
                                        onChange={(e) => handleChange('phone', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Industry <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Briefcase className="absolute left-3 top-3 text-slate-400" size={18} />
                                    <select
                                        className="w-full border border-slate-300 rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none appearance-none bg-white"
                                        value={formData.niche}
                                        onChange={(e) => handleChange('niche', e.target.value)}
                                    >
                                        <option value="">Select...</option>
                                        {niches.map(niche => (
                                            <option key={niche} value={niche}>{niche}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Tier & Status */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Subscription Tier</label>
                                <div className="relative">
                                    <CreditCard className="absolute left-3 top-3 text-slate-400" size={18} />
                                    <select
                                        className="w-full border border-slate-300 rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none appearance-none bg-white"
                                        value={formData.subscriptionTier}
                                        onChange={(e) => handleChange('subscriptionTier', e.target.value)}
                                    >
                                        <option value="$197/mo">Starter - $197/mo</option>
                                        <option value="$297/mo">Professional - $297/mo</option>
                                        <option value="$497/mo">Enterprise - $497/mo</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                                <select
                                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    value={formData.status}
                                    onChange={(e) => handleChange('status', e.target.value)}
                                >
                                    <option value="Onboarding">Onboarding</option>
                                    <option value="Active">Active</option>
                                </select>
                            </div>
                        </div>

                        {/* Number Request Toggle */}
                        <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-lg flex items-center justify-between">
                            <div>
                                <p className="font-medium text-slate-900 text-sm">Request Phone Number</p>
                                <p className="text-xs text-slate-600">Create provisioning request for AI line</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.requestNumber}
                                    onChange={(e) => handleChange('requestNumber', e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                                <AlertCircle size={18} />
                                {error}
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="animate-spin" size={18} />
                                        Adding...
                                    </>
                                ) : (
                                    'Add Client'
                                )}
                            </button>
                        </div>
                    </form>
                ) : (
                    /* CSV Import */
                    <div className="p-6 space-y-4">
                        <div className="text-center">
                            <div
                                className="border-2 border-dashed border-slate-300 rounded-xl p-8 hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors cursor-pointer"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload className="mx-auto text-slate-400 mb-3" size={40} />
                                <p className="font-medium text-slate-700">Click to upload CSV</p>
                                <p className="text-sm text-slate-500 mt-1">or drag and drop</p>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv"
                                className="hidden"
                                onChange={handleFileUpload}
                            />
                        </div>

                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                            <h4 className="font-medium text-slate-700 mb-2 text-sm">CSV Format</h4>
                            <p className="text-xs text-slate-600 mb-2">Required columns:</p>
                            <code className="text-xs bg-white px-2 py-1 rounded border">
                                business_name, owner_name, email, phone, niche
                            </code>
                            <p className="text-xs text-slate-500 mt-2">
                                Number requests will be auto-created for each imported client.
                            </p>
                        </div>

                        {isLoading && (
                            <div className="flex items-center justify-center gap-3 py-4 text-slate-600">
                                <Loader2 className="animate-spin" size={20} />
                                Importing clients...
                            </div>
                        )}

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                                <AlertCircle size={18} />
                                {error}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// Helper to parse CSV line (handles quoted fields)
function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }

    result.push(current.trim());
    return result;
}

export default AddClientModal;
