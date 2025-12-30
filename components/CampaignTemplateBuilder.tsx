import React, { useState } from 'react';
import {
    Plus, Trash2, Save, Mail, MessageCircle, Phone, Clock,
    GripVertical, Wand2, ChevronDown, ChevronUp, X
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

type StepType = 'email' | 'sms' | 'voice' | 'wait';

interface CampaignStep {
    id: string;
    type: StepType;
    delayHours: number;
    subject?: string;
    template: string;
    aiPersonalize: boolean;
}

interface CampaignTemplate {
    id: string;
    name: string;
    niche: string;
    description: string;
    steps: CampaignStep[];
}

interface CampaignTemplateBuilderProps {
    template?: CampaignTemplate;
    onSave: (template: CampaignTemplate) => void;
    onClose: () => void;
    niches?: string[];
}

// ============================================================================
// STEP PRESETS
// ============================================================================

const STEP_PRESETS: Record<StepType, Partial<CampaignStep>> = {
    email: {
        type: 'email',
        delayHours: 0,
        subject: 'Quick question about {{businessName}}',
        template: `Hi,

I noticed {{businessName}} might be missing calls after hours.

We help businesses like yours capture 100% of leads with an AI receptionist.

Would you be interested in a quick demo?

Best,
{{senderName}}`,
        aiPersonalize: true
    },
    sms: {
        type: 'sms',
        delayHours: 0,
        template: `Hey, this is {{senderName}}. I sent an email about helping {{businessName}} capture more leads. Did you get it? Reply YES for a demo link.`,
        aiPersonalize: true
    },
    voice: {
        type: 'voice',
        delayHours: 0,
        template: 'AI will call and discuss the benefits of automated lead capture.',
        aiPersonalize: false
    },
    wait: {
        type: 'wait',
        delayHours: 24,
        template: '',
        aiPersonalize: false
    }
};

// ============================================================================
// COMPONENT
// ============================================================================

const CampaignTemplateBuilder: React.FC<CampaignTemplateBuilderProps> = ({
    template,
    onSave,
    onClose,
    niches = ['Plumbing', 'HVAC', 'Roofing', 'Electrical', 'Landscaping', 'General']
}) => {
    const generateId = () => `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const [formData, setFormData] = useState<CampaignTemplate>(
        template || {
            id: generateId(),
            name: '',
            niche: 'Plumbing',
            description: '',
            steps: []
        }
    );

    const [expandedStep, setExpandedStep] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const addStep = (type: StepType) => {
        const preset = STEP_PRESETS[type];
        const newStep: CampaignStep = {
            id: generateId(),
            type,
            delayHours: preset.delayHours || 0,
            subject: preset.subject,
            template: preset.template || '',
            aiPersonalize: preset.aiPersonalize || false
        };
        setFormData(prev => ({
            ...prev,
            steps: [...prev.steps, newStep]
        }));
        setExpandedStep(newStep.id);
    };

    const removeStep = (stepId: string) => {
        setFormData(prev => ({
            ...prev,
            steps: prev.steps.filter(s => s.id !== stepId)
        }));
    };

    const updateStep = (stepId: string, updates: Partial<CampaignStep>) => {
        setFormData(prev => ({
            ...prev,
            steps: prev.steps.map(s => s.id === stepId ? { ...s, ...updates } : s)
        }));
    };

    const moveStep = (index: number, direction: 'up' | 'down') => {
        const newSteps = [...formData.steps];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newSteps.length) return;
        [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
        setFormData(prev => ({ ...prev, steps: newSteps }));
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            alert('Please enter a template name');
            return;
        }
        if (formData.steps.length === 0) {
            alert('Please add at least one step');
            return;
        }
        setIsSaving(true);
        try {
            await onSave(formData);
        } finally {
            setIsSaving(false);
        }
    };

    const getStepIcon = (type: StepType) => {
        switch (type) {
            case 'email': return <Mail size={16} />;
            case 'sms': return <MessageCircle size={16} />;
            case 'voice': return <Phone size={16} />;
            case 'wait': return <Clock size={16} />;
        }
    };

    const getStepColor = (type: StepType) => {
        switch (type) {
            case 'email': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'sms': return 'bg-green-100 text-green-700 border-green-200';
            case 'voice': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'wait': return 'bg-amber-100 text-amber-700 border-amber-200';
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-bold">
                            {template ? 'Edit Campaign Template' : 'Create Campaign Template'}
                        </h2>
                        <p className="text-sm opacity-90">Design your automated outreach sequence</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Template Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="e.g., Plumbing Outreach v1"
                                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Industry/Niche
                            </label>
                            <select
                                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                value={formData.niche}
                                onChange={(e) => setFormData(prev => ({ ...prev, niche: e.target.value }))}
                            >
                                {niches.map(n => (
                                    <option key={n} value={n}>{n}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Description
                        </label>
                        <input
                            type="text"
                            placeholder="Brief description of this campaign..."
                            className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        />
                    </div>

                    {/* Steps */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="block text-sm font-medium text-slate-700">
                                Campaign Steps ({formData.steps.length})
                            </label>
                        </div>

                        {/* Add Step Buttons */}
                        <div className="flex flex-wrap gap-2 mb-4">
                            <button
                                onClick={() => addStep('email')}
                                className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
                            >
                                <Mail size={14} /> + Email
                            </button>
                            <button
                                onClick={() => addStep('sms')}
                                className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors"
                            >
                                <MessageCircle size={14} /> + SMS
                            </button>
                            <button
                                onClick={() => addStep('voice')}
                                className="flex items-center gap-1 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors"
                            >
                                <Phone size={14} /> + Voice
                            </button>
                            <button
                                onClick={() => addStep('wait')}
                                className="flex items-center gap-1 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-200 transition-colors"
                            >
                                <Clock size={14} /> + Wait
                            </button>
                        </div>

                        {/* Steps List */}
                        {formData.steps.length === 0 ? (
                            <div className="text-center py-8 text-slate-500 border-2 border-dashed border-slate-200 rounded-xl">
                                <Clock size={40} className="mx-auto mb-2 opacity-30" />
                                <p>No steps yet</p>
                                <p className="text-sm">Add steps using the buttons above</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {formData.steps.map((step, index) => (
                                    <div
                                        key={step.id}
                                        className={`border rounded-xl overflow-hidden ${getStepColor(step.type)}`}
                                    >
                                        {/* Step Header */}
                                        <div className="flex items-center gap-3 p-3">
                                            <div className="flex items-center gap-1 text-slate-400">
                                                <GripVertical size={16} />
                                                <span className="text-xs font-bold">{index + 1}</span>
                                            </div>
                                            <div className="flex items-center gap-2 flex-1">
                                                {getStepIcon(step.type)}
                                                <span className="font-medium text-sm">
                                                    {step.type === 'wait'
                                                        ? `Wait ${step.delayHours} hours`
                                                        : step.type.toUpperCase()
                                                    }
                                                </span>
                                                {step.aiPersonalize && step.type !== 'wait' && (
                                                    <span className="flex items-center gap-1 text-xs bg-white/50 px-2 py-0.5 rounded-full">
                                                        <Wand2 size={10} /> AI
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {index > 0 && (
                                                    <button
                                                        onClick={() => moveStep(index, 'up')}
                                                        className="p-1 hover:bg-white/50 rounded transition-colors"
                                                    >
                                                        <ChevronUp size={14} />
                                                    </button>
                                                )}
                                                {index < formData.steps.length - 1 && (
                                                    <button
                                                        onClick={() => moveStep(index, 'down')}
                                                        className="p-1 hover:bg-white/50 rounded transition-colors"
                                                    >
                                                        <ChevronDown size={14} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
                                                    className="p-1 hover:bg-white/50 rounded transition-colors"
                                                >
                                                    {expandedStep === step.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                </button>
                                                <button
                                                    onClick={() => removeStep(step.id)}
                                                    className="p-1 hover:bg-red-100 text-red-600 rounded transition-colors"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Step Details (Expanded) */}
                                        {expandedStep === step.id && (
                                            <div className="p-4 bg-white border-t space-y-3">
                                                {step.type === 'wait' ? (
                                                    <div>
                                                        <label className="block text-xs font-medium text-slate-600 mb-1">
                                                            Wait Duration (hours)
                                                        </label>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            className="w-32 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                                            value={step.delayHours}
                                                            onChange={(e) => updateStep(step.id, { delayHours: parseInt(e.target.value) || 0 })}
                                                        />
                                                    </div>
                                                ) : (
                                                    <>
                                                        {step.type === 'email' && (
                                                            <div>
                                                                <label className="block text-xs font-medium text-slate-600 mb-1">
                                                                    Email Subject
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                                                    value={step.subject || ''}
                                                                    onChange={(e) => updateStep(step.id, { subject: e.target.value })}
                                                                    placeholder="Quick question about {{businessName}}"
                                                                />
                                                            </div>
                                                        )}
                                                        <div>
                                                            <label className="block text-xs font-medium text-slate-600 mb-1">
                                                                Message Template
                                                            </label>
                                                            <textarea
                                                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
                                                                rows={4}
                                                                value={step.template}
                                                                onChange={(e) => updateStep(step.id, { template: e.target.value })}
                                                                placeholder="Write your message..."
                                                            />
                                                            <p className="text-[10px] text-slate-400 mt-1">
                                                                Variables: {'{{businessName}}'}, {'{{senderName}}'}, {'{{address}}'}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="checkbox"
                                                                id={`ai-${step.id}`}
                                                                checked={step.aiPersonalize}
                                                                onChange={(e) => updateStep(step.id, { aiPersonalize: e.target.checked })}
                                                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                            />
                                                            <label htmlFor={`ai-${step.id}`} className="text-sm text-slate-600 flex items-center gap-1">
                                                                <Wand2 size={12} /> AI Personalize (uses Gemini to enhance message)
                                                            </label>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                    >
                        <Save size={16} />
                        {isSaving ? 'Saving...' : 'Save Template'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CampaignTemplateBuilder;
