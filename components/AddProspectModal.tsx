import React, { useState } from 'react';
import { X, Building, Phone, Globe, MapPin, AlertCircle, Loader2, CheckCircle, Rocket, Star, Mail } from 'lucide-react';
import { Prospect } from '../types';
import { triggerMakeWebhook } from '../services/supabase';

interface AddProspectModalProps {
    onClose: () => void;
    onAddProspect: (prospect: Prospect, launchCampaign: boolean) => void;
}

const AddProspectModal: React.FC<AddProspectModalProps> = ({
    onClose,
    onAddProspect
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [launchAfterAdd, setLaunchAfterAdd] = useState(true);

    const [formData, setFormData] = useState({
        businessName: '',
        email: '',
        phone: '',
        website: '',
        address: '',
        rating: '',
        reviewCount: '',
        notes: ''
    });

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.businessName.trim()) {
            setError('Business name is required');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Generate proper UUID for Supabase compatibility
            const generateUUID = () => {
                return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                    const r = Math.random() * 16 | 0;
                    const v = c === 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                });
            };

            const newProspect: Prospect = {
                id: generateUUID(),
                businessName: formData.businessName.trim(),
                email: formData.email.trim() || undefined,
                phone: formData.phone.trim() || undefined,
                address: formData.address.trim() || 'Address not provided',
                rating: formData.rating ? parseFloat(formData.rating) : 0,
                reviewCount: formData.reviewCount ? parseInt(formData.reviewCount) : 0,
                hasWebsite: formData.website.trim().length > 0,
                painPoints: generatePainPoints(formData),
                outreachStatus: 'New',
                notes: formData.notes.trim() || undefined,
                mapUrl: formData.website.trim() || undefined,
                campaignStatus: launchAfterAdd ? 'Active' : 'Idle'
            };

            // If launching campaign, trigger Make.com webhook
            if (launchAfterAdd) {
                await triggerMakeWebhook(newProspect);
            }

            onAddProspect(newProspect, launchAfterAdd);
            setSuccess(true);

            // Auto-close after success
            setTimeout(() => {
                onClose();
            }, 1500);
        } catch (err) {
            console.error('Error adding prospect:', err);
            setError('Failed to add prospect. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl p-8 text-center max-w-sm">
                    <div className={`w-16 h-16 ${launchAfterAdd ? 'bg-green-100 text-green-600' : 'bg-indigo-100 text-indigo-600'} rounded-full flex items-center justify-center mx-auto mb-4`}>
                        {launchAfterAdd ? <Rocket size={32} /> : <CheckCircle size={32} />}
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">
                        {launchAfterAdd ? 'Campaign Launched!' : 'Prospect Added!'}
                    </h3>
                    <p className="text-slate-600">
                        {formData.businessName} has been added
                        {launchAfterAdd && ' and the outreach campaign has started'}.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                {/* Header */}
                <div className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-bold">Add Prospect Manually</h2>
                        <p className="text-sm opacity-90">Enter business info to start outreach</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
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
                                placeholder="Joe's Plumbing"
                                className="w-full border border-slate-300 rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                value={formData.businessName}
                                onChange={(e) => handleChange('businessName', e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
                            <input
                                type="email"
                                placeholder="owner@business.com"
                                className="w-full border border-slate-300 rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                value={formData.email}
                                onChange={(e) => handleChange('email', e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Phone & Website */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
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
                            <label className="block text-sm font-medium text-slate-700 mb-1">Website</label>
                            <div className="relative">
                                <Globe className="absolute left-3 top-3 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="example.com"
                                    className="w-full border border-slate-300 rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    value={formData.website}
                                    onChange={(e) => handleChange('website', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Address */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Address/Location</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-3 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="123 Main St, Tampa, FL"
                                className="w-full border border-slate-300 rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                value={formData.address}
                                onChange={(e) => handleChange('address', e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Rating & Review Count */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Rating (0-5)</label>
                            <div className="relative">
                                <Star className="absolute left-3 top-3 text-slate-400" size={18} />
                                <input
                                    type="number"
                                    min="0"
                                    max="5"
                                    step="0.1"
                                    placeholder="3.5"
                                    className="w-full border border-slate-300 rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    value={formData.rating}
                                    onChange={(e) => handleChange('rating', e.target.value)}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Review Count</label>
                            <input
                                type="number"
                                min="0"
                                placeholder="15"
                                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                value={formData.reviewCount}
                                onChange={(e) => handleChange('reviewCount', e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Notes (Optional)</label>
                        <textarea
                            placeholder="Met at trade show, interested in AI answering..."
                            className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
                            rows={2}
                            value={formData.notes}
                            onChange={(e) => handleChange('notes', e.target.value)}
                        />
                    </div>

                    {/* Launch Campaign Toggle */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
                                    <Rocket size={20} />
                                </div>
                                <div>
                                    <p className="font-medium text-slate-900 text-sm">Launch Campaign Immediately</p>
                                    <p className="text-xs text-slate-600">Trigger Make.com automation now</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={launchAfterAdd}
                                    onChange={(e) => setLaunchAfterAdd(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                            </label>
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
                            className={`flex-1 px-4 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50 ${launchAfterAdd
                                ? 'bg-green-600 text-white hover:bg-green-700'
                                : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                } transition-colors`}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="animate-spin" size={18} />
                                    {launchAfterAdd ? 'Launching...' : 'Adding...'}
                                </>
                            ) : (
                                <>
                                    {launchAfterAdd && <Rocket size={18} />}
                                    {launchAfterAdd ? 'Add & Launch' : 'Add Prospect'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Helper to generate pain points based on form data
function generatePainPoints(data: {
    website: string;
    rating: string;
    reviewCount: string;
    phone: string;
}): string[] {
    const painPoints: string[] = [];

    if (!data.website.trim()) {
        painPoints.push('No Website Found');
    }

    if (data.rating && parseFloat(data.rating) < 4) {
        painPoints.push('Low Reviews');
    }

    if (data.reviewCount && parseInt(data.reviewCount) < 20) {
        painPoints.push('Few Reviews');
    }

    if (!data.phone.trim()) {
        painPoints.push('No Phone Listed');
    }

    // If no specific pain points, add general ones
    if (painPoints.length === 0) {
        painPoints.push('Potential Missed Calls');
        painPoints.push('No AI Automation');
    }

    return painPoints;
}

export default AddProspectModal;
