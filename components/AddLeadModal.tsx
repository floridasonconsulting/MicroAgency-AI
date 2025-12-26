import React, { useState } from 'react';
import { X, User, Phone, Wrench, AlertCircle, MessageSquare, Loader2, CheckCircle } from 'lucide-react';
import { Lead } from '../types';

interface AddLeadModalProps {
    clientId: string;
    clientNiche: string;
    onClose: () => void;
    onAddLead: (lead: Omit<Lead, 'id'>) => Promise<void>;
}

const AddLeadModal: React.FC<AddLeadModalProps> = ({
    clientId,
    clientNiche,
    onClose,
    onAddLead
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        serviceType: '',
        urgency: 'Medium' as Lead['urgency'],
        notes: '',
        initialMessage: ''
    });

    const serviceTypes = getServiceTypesForNiche(clientNiche);

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            setError('Name is required');
            return;
        }
        if (!formData.phone.trim()) {
            setError('Phone number is required');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const newLead: Omit<Lead, 'id'> = {
                name: formData.name.trim(),
                phone: formData.phone.trim(),
                serviceType: formData.serviceType || clientNiche,
                urgency: formData.urgency,
                status: 'New',
                dateCaptured: new Date().toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                conversationHistory: formData.initialMessage ? [{
                    role: 'user',
                    content: formData.initialMessage,
                    timestamp: new Date().toISOString()
                }] : []
            };

            await onAddLead(newLead);
            setSuccess(true);

            // Auto-close after success
            setTimeout(() => {
                onClose();
            }, 1500);
        } catch (err) {
            console.error('Error adding lead:', err);
            setError('Failed to add lead. Please try again.');
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
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Lead Added!</h3>
                    <p className="text-slate-600">{formData.name} has been added to the lead list.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                {/* Header */}
                <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-slate-900">Add New Lead</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Name <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <User className="absolute left-3 top-3 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="John Smith"
                                className="w-full border border-slate-300 rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                value={formData.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Phone */}
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

                    {/* Service Type & Urgency */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Service Type</label>
                            <div className="relative">
                                <Wrench className="absolute left-3 top-3 text-slate-400" size={18} />
                                <select
                                    className="w-full border border-slate-300 rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none appearance-none bg-white"
                                    value={formData.serviceType}
                                    onChange={(e) => handleChange('serviceType', e.target.value)}
                                >
                                    <option value="">Select...</option>
                                    {serviceTypes.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Urgency</label>
                            <select
                                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                value={formData.urgency}
                                onChange={(e) => handleChange('urgency', e.target.value as Lead['urgency'])}
                            >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="Emergency">Emergency</option>
                            </select>
                        </div>
                    </div>

                    {/* Initial Message */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Initial Message (Optional)
                        </label>
                        <div className="relative">
                            <MessageSquare className="absolute left-3 top-3 text-slate-400" size={18} />
                            <textarea
                                placeholder="What did they say when they called?"
                                className="w-full border border-slate-300 rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
                                rows={3}
                                value={formData.initialMessage}
                                onChange={(e) => handleChange('initialMessage', e.target.value)}
                            />
                        </div>
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
                                'Add Lead'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Helper function to get service types based on niche
function getServiceTypesForNiche(niche: string): string[] {
    const nicheServices: Record<string, string[]> = {
        'Plumbing': ['Pipe Repair', 'Drain Cleaning', 'Water Heater', 'Fixture Install', 'Emergency'],
        'HVAC': ['AC Repair', 'Heating', 'Maintenance', 'Install', 'Emergency'],
        'Roofing': ['Inspection', 'Repair', 'Replacement', 'Gutter', 'Emergency'],
        'Electrical': ['Wiring', 'Panel Upgrade', 'Outlet Install', 'Lighting', 'Emergency'],
        'Landscaping': ['Lawn Care', 'Tree Service', 'Hardscape', 'Design', 'Maintenance'],
        'Pool Service': ['Cleaning', 'Repair', 'Equipment', 'Renovation', 'Emergency'],
        'Pest Control': ['General Pest', 'Termite', 'Rodent', 'Wildlife', 'Inspection'],
        'General Contractor': ['Remodel', 'Addition', 'Repair', 'Custom Build', 'Consultation']
    };

    return nicheServices[niche] || ['General Inquiry', 'Quote Request', 'Service Call', 'Emergency'];
}

export default AddLeadModal;
