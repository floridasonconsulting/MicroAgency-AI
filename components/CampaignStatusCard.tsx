import React, { useState } from 'react';
import {
    Play, Pause, Square, MessageCircle, Mail, Phone,
    Clock, CheckCircle, XCircle, Loader2, ChevronDown,
    ChevronUp, Zap, TrendingUp, AlertCircle
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'converted' | 'cold';

interface CampaignStep {
    type: 'email' | 'sms' | 'voice' | 'wait';
    status: 'pending' | 'active' | 'completed' | 'failed';
    scheduledAt?: string;
    completedAt?: string;
    error?: string;
}

interface CampaignStatusCardProps {
    prospectName: string;
    status: CampaignStatus;
    currentStep: number;
    totalSteps: number;
    steps: CampaignStep[];
    lastActivity?: string;
    messagesCount: number;
    onPause?: () => void;
    onResume?: () => void;
    onStop?: () => void;
    onViewConversation?: () => void;
    compact?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

const CampaignStatusCard: React.FC<CampaignStatusCardProps> = ({
    prospectName,
    status,
    currentStep,
    totalSteps,
    steps,
    lastActivity,
    messagesCount,
    onPause,
    onResume,
    onStop,
    onViewConversation,
    compact = false
}) => {
    const [expanded, setExpanded] = useState(false);

    const getStatusConfig = () => {
        switch (status) {
            case 'active':
                return {
                    bg: 'bg-indigo-50',
                    border: 'border-indigo-200',
                    badge: 'bg-indigo-100 text-indigo-700',
                    icon: <Loader2 size={14} className="animate-spin" />,
                    label: 'Active'
                };
            case 'paused':
                return {
                    bg: 'bg-amber-50',
                    border: 'border-amber-200',
                    badge: 'bg-amber-100 text-amber-700',
                    icon: <Pause size={14} />,
                    label: 'Paused'
                };
            case 'completed':
                return {
                    bg: 'bg-slate-50',
                    border: 'border-slate-200',
                    badge: 'bg-slate-100 text-slate-600',
                    icon: <CheckCircle size={14} />,
                    label: 'Completed'
                };
            case 'converted':
                return {
                    bg: 'bg-green-50',
                    border: 'border-green-200',
                    badge: 'bg-green-100 text-green-700',
                    icon: <TrendingUp size={14} />,
                    label: 'Converted!'
                };
            case 'cold':
                return {
                    bg: 'bg-slate-50',
                    border: 'border-slate-200',
                    badge: 'bg-slate-100 text-slate-500',
                    icon: <XCircle size={14} />,
                    label: 'Cold'
                };
            default:
                return {
                    bg: 'bg-white',
                    border: 'border-slate-200',
                    badge: 'bg-slate-100 text-slate-600',
                    icon: <Clock size={14} />,
                    label: 'Draft'
                };
        }
    };

    const getStepIcon = (type: string) => {
        switch (type) {
            case 'email': return <Mail size={12} />;
            case 'sms': return <MessageCircle size={12} />;
            case 'voice': return <Phone size={12} />;
            case 'wait': return <Clock size={12} />;
            default: return <Zap size={12} />;
        }
    };

    const getStepStatusColor = (stepStatus: string) => {
        switch (stepStatus) {
            case 'completed': return 'bg-green-500';
            case 'active': return 'bg-indigo-500 animate-pulse';
            case 'failed': return 'bg-red-500';
            default: return 'bg-slate-300';
        }
    };

    const config = getStatusConfig();
    const progressPercent = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0;

    if (compact) {
        return (
            <div className={`${config.bg} ${config.border} border rounded-lg p-3`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className={`${config.badge} px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1`}>
                            {config.icon}
                            {config.label}
                        </span>
                        <span className="text-xs text-slate-500">
                            Step {currentStep}/{totalSteps}
                        </span>
                    </div>
                    {onViewConversation && (
                        <button
                            onClick={onViewConversation}
                            className="text-xs text-indigo-600 hover:underline flex items-center gap-1"
                        >
                            <MessageCircle size={12} />
                            {messagesCount} msgs
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className={`${config.bg} ${config.border} border rounded-xl overflow-hidden`}>
            {/* Header */}
            <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <span className={`${config.badge} px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1`}>
                            {config.icon}
                            {config.label}
                        </span>
                        {status === 'converted' && (
                            <span className="text-green-600 text-xs font-medium">🎉</span>
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                        {status === 'active' && onPause && (
                            <button
                                onClick={onPause}
                                className="p-1.5 bg-amber-100 text-amber-600 rounded-lg hover:bg-amber-200 transition-colors"
                                title="Pause Campaign"
                            >
                                <Pause size={14} />
                            </button>
                        )}
                        {status === 'paused' && onResume && (
                            <button
                                onClick={onResume}
                                className="p-1.5 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                                title="Resume Campaign"
                            >
                                <Play size={14} />
                            </button>
                        )}
                        {(status === 'active' || status === 'paused') && onStop && (
                            <button
                                onClick={onStop}
                                className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                                title="Stop Campaign"
                            >
                                <Square size={14} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                        <span>Progress</span>
                        <span>{currentStep} of {totalSteps} steps</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-500 ${status === 'converted' ? 'bg-green-500' : 'bg-indigo-500'
                                }`}
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="flex items-center gap-4 text-xs text-slate-600">
                    {onViewConversation && (
                        <button
                            onClick={onViewConversation}
                            className="flex items-center gap-1 hover:text-indigo-600 transition-colors"
                        >
                            <MessageCircle size={12} />
                            {messagesCount} messages
                        </button>
                    )}
                    {lastActivity && (
                        <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {lastActivity}
                        </span>
                    )}
                </div>
            </div>

            {/* Expandable Steps */}
            {steps.length > 0 && (
                <>
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="w-full px-4 py-2 flex items-center justify-between text-xs text-slate-500 bg-white/50 hover:bg-white/80 transition-colors border-t border-slate-200"
                    >
                        <span>Campaign Steps</span>
                        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>

                    {expanded && (
                        <div className="px-4 pb-4 bg-white/50">
                            <div className="relative">
                                {/* Timeline line */}
                                <div className="absolute left-[9px] top-0 bottom-0 w-0.5 bg-slate-200" />

                                {steps.map((step, idx) => (
                                    <div key={idx} className="relative flex items-start gap-3 py-2">
                                        {/* Step indicator */}
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center z-10 ${getStepStatusColor(step.status)}`}>
                                            <span className="text-white">
                                                {getStepIcon(step.type)}
                                            </span>
                                        </div>

                                        {/* Step content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <span className={`text-xs font-medium ${step.status === 'active' ? 'text-indigo-700' :
                                                        step.status === 'completed' ? 'text-green-700' :
                                                            step.status === 'failed' ? 'text-red-700' :
                                                                'text-slate-600'
                                                    }`}>
                                                    {step.type === 'wait' ? 'Wait Period' : step.type.toUpperCase()}
                                                </span>
                                                {step.completedAt && (
                                                    <span className="text-[10px] text-slate-400">
                                                        {new Date(step.completedAt).toLocaleTimeString()}
                                                    </span>
                                                )}
                                            </div>
                                            {step.error && (
                                                <div className="flex items-center gap-1 text-[10px] text-red-500 mt-0.5">
                                                    <AlertCircle size={10} />
                                                    {step.error}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default CampaignStatusCard;
