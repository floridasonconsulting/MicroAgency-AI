import React, { useState, useEffect } from 'react';
import {
    ArrowLeft, Phone, Users, TrendingUp, Clock, CheckCircle,
    MessageCircle, DollarSign, Zap, Star, Play, X, ChevronRight,
    PhoneIncoming, Calendar, Target, BarChart3
} from 'lucide-react';
import { generateDemoData, DemoData, DemoLead, DemoCall } from '../services/demoDataService';

// ============================================================================
// TYPES
// ============================================================================

interface DemoModeProps {
    niche?: string;
    onExit: () => void;
}

interface TourStep {
    id: string;
    title: string;
    content: string;
    target: string; // CSS selector or element ID
    position: 'top' | 'bottom' | 'left' | 'right';
}

// ============================================================================
// TOUR STEPS
// ============================================================================

const TOUR_STEPS: TourStep[] = [
    {
        id: 'welcome',
        title: 'Welcome to Your AI Dashboard',
        content: 'This is how your business will look with our AI receptionist handling your calls 24/7. Let me show you around!',
        target: '#demo-header',
        position: 'bottom'
    },
    {
        id: 'metrics',
        title: 'Real-Time Metrics',
        content: 'See exactly how many calls were handled, leads captured, and appointments booked. All in real-time.',
        target: '#demo-metrics',
        position: 'bottom'
    },
    {
        id: 'calls',
        title: 'Call History',
        content: 'Every call is logged with full transcripts. You can see exactly what the AI said and how it helped your customers.',
        target: '#demo-calls',
        position: 'left'
    },
    {
        id: 'leads',
        title: 'Captured Leads',
        content: 'Leads are automatically captured, qualified, and organized. No more lost opportunities!',
        target: '#demo-leads',
        position: 'right'
    },
    {
        id: 'revenue',
        title: 'Revenue Impact',
        content: 'See the direct revenue impact from missed calls recovered and leads converted.',
        target: '#demo-revenue',
        position: 'top'
    },
    {
        id: 'cta',
        title: 'Ready to Get Started?',
        content: 'Click below to activate your AI receptionist today. Setup takes less than 10 minutes!',
        target: '#demo-cta',
        position: 'top'
    }
];

// ============================================================================
// COMPONENT
// ============================================================================

const DemoMode: React.FC<DemoModeProps> = ({ niche = 'plumbing', onExit }) => {
    const [demoData, setDemoData] = useState<DemoData | null>(null);
    const [currentTourStep, setCurrentTourStep] = useState(0);
    const [showTour, setShowTour] = useState(true);
    const [selectedLead, setSelectedLead] = useState<DemoLead | null>(null);
    const [selectedCall, setSelectedCall] = useState<DemoCall | null>(null);

    useEffect(() => {
        // Generate demo data on mount
        const data = generateDemoData(niche);
        setDemoData(data);
    }, [niche]);

    const nextTourStep = () => {
        if (currentTourStep < TOUR_STEPS.length - 1) {
            setCurrentTourStep(currentTourStep + 1);
        } else {
            setShowTour(false);
        }
    };

    const skipTour = () => {
        setShowTour(false);
    };

    if (!demoData) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-white text-center">
                    <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-4" />
                    <p>Loading demo...</p>
                </div>
            </div>
        );
    }

    const { client, leads, calls, metrics } = demoData;
    const currentStep = TOUR_STEPS[currentTourStep];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900">
            {/* Demo Banner */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white py-2 px-4 text-center text-sm font-medium">
                🎯 DEMO MODE - This is a simulation of your future dashboard. Data is for demonstration only.
                <button onClick={onExit} className="ml-4 underline hover:no-underline">
                    Exit Demo
                </button>
            </div>

            {/* Tour Overlay */}
            {showTour && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md mx-4 overflow-hidden">
                        {/* Tour Header */}
                        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm opacity-80">Step {currentTourStep + 1} of {TOUR_STEPS.length}</span>
                                <button onClick={skipTour} className="text-white/70 hover:text-white">
                                    <X size={18} />
                                </button>
                            </div>
                            <h3 className="text-xl font-bold">{currentStep.title}</h3>
                        </div>

                        {/* Tour Content */}
                        <div className="p-6">
                            <p className="text-slate-600 mb-6">{currentStep.content}</p>

                            {/* Progress Dots */}
                            <div className="flex items-center justify-center gap-2 mb-6">
                                {TOUR_STEPS.map((_, idx) => (
                                    <div
                                        key={idx}
                                        className={`w-2 h-2 rounded-full transition-colors ${idx === currentTourStep ? 'bg-indigo-600' :
                                                idx < currentTourStep ? 'bg-indigo-300' : 'bg-slate-200'
                                            }`}
                                    />
                                ))}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button
                                    onClick={skipTour}
                                    className="flex-1 py-2 text-slate-500 hover:text-slate-700 font-medium"
                                >
                                    Skip Tour
                                </button>
                                <button
                                    onClick={nextTourStep}
                                    className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 flex items-center justify-center gap-1"
                                >
                                    {currentTourStep === TOUR_STEPS.length - 1 ? 'Get Started' : 'Next'}
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Header */}
                <div id="demo-header" className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onExit}
                            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-white">{client.businessName}</h1>
                            <p className="text-white/60">AI Receptionist Dashboard</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="bg-green-500/20 text-green-400 px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                            AI Active
                        </div>
                        <div className="bg-white/10 text-white px-3 py-1.5 rounded-lg text-sm">
                            <Phone size={14} className="inline mr-1" />
                            {client.aiPhoneNumber}
                        </div>
                    </div>
                </div>

                {/* Metrics Grid */}
                <div id="demo-metrics" className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/10">
                        <div className="flex items-center justify-between mb-3">
                            <PhoneIncoming className="text-indigo-400" size={24} />
                            <span className="text-green-400 text-sm font-medium">+12%</span>
                        </div>
                        <p className="text-3xl font-bold text-white mb-1">{metrics.callsHandled}</p>
                        <p className="text-white/60 text-sm">Calls Handled</p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/10">
                        <div className="flex items-center justify-between mb-3">
                            <Users className="text-green-400" size={24} />
                            <span className="text-green-400 text-sm font-medium">+8%</span>
                        </div>
                        <p className="text-3xl font-bold text-white mb-1">{metrics.leadsCapture}</p>
                        <p className="text-white/60 text-sm">Leads Captured</p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/10">
                        <div className="flex items-center justify-between mb-3">
                            <Calendar className="text-amber-400" size={24} />
                            <span className="text-green-400 text-sm font-medium">+15%</span>
                        </div>
                        <p className="text-3xl font-bold text-white mb-1">{metrics.appointmentsBooked}</p>
                        <p className="text-white/60 text-sm">Appointments Booked</p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/10">
                        <div className="flex items-center justify-between mb-3">
                            <Target className="text-purple-400" size={24} />
                        </div>
                        <p className="text-3xl font-bold text-white mb-1">{metrics.conversionRate}%</p>
                        <p className="text-white/60 text-sm">Conversion Rate</p>
                    </div>
                </div>

                {/* Two Column Layout */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                    {/* Recent Calls */}
                    <div id="demo-calls" className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
                        <div className="p-4 border-b border-white/10 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <Phone size={18} /> Recent Calls
                            </h2>
                            <span className="text-white/60 text-sm">{calls.length} today</span>
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                            {calls.slice(0, 8).map((call) => (
                                <div
                                    key={call.id}
                                    onClick={() => setSelectedCall(call)}
                                    className="p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-white font-medium">{call.callerName}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${call.outcome === 'Booked' ? 'bg-green-500/20 text-green-400' :
                                                call.outcome === 'Callback' ? 'bg-amber-500/20 text-amber-400' :
                                                    call.outcome === 'Missed' ? 'bg-red-500/20 text-red-400' :
                                                        'bg-blue-500/20 text-blue-400'
                                            }`}>
                                            {call.outcome}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-white/60">
                                        <span>{call.callerPhone}</span>
                                        <span>•</span>
                                        <span>{call.duration}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Leads */}
                    <div id="demo-leads" className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
                        <div className="p-4 border-b border-white/10 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <Users size={18} /> Captured Leads
                            </h2>
                            <span className="text-white/60 text-sm">{leads.length} total</span>
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                            {leads.slice(0, 8).map((lead) => (
                                <div
                                    key={lead.id}
                                    onClick={() => setSelectedLead(lead)}
                                    className="p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-white font-medium">{lead.name}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${lead.status === 'Booked' ? 'bg-green-500/20 text-green-400' :
                                                lead.status === 'Qualified' ? 'bg-blue-500/20 text-blue-400' :
                                                    lead.status === 'Closed' ? 'bg-purple-500/20 text-purple-400' :
                                                        'bg-amber-500/20 text-amber-400'
                                            }`}>
                                            {lead.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-white/60">
                                        <span>{lead.serviceType}</span>
                                        <span>•</span>
                                        <span className={
                                            lead.urgency === 'Emergency' ? 'text-red-400' :
                                                lead.urgency === 'Medium' ? 'text-amber-400' :
                                                    'text-green-400'
                                        }>
                                            {lead.urgency}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Revenue Impact */}
                <div id="demo-revenue" className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm rounded-xl border border-green-500/30 p-6 mb-8">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-green-500/30 rounded-xl flex items-center justify-center">
                            <DollarSign className="text-green-400" size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Revenue Impact This Month</h2>
                            <p className="text-white/60">Based on captured leads and appointments</p>
                        </div>
                    </div>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div>
                            <p className="text-4xl font-bold text-green-400">${metrics.revenueInfluenced.toLocaleString()}</p>
                            <p className="text-white/60 text-sm">Potential Revenue</p>
                        </div>
                        <div>
                            <p className="text-4xl font-bold text-white">{metrics.missedCallsRecovered}</p>
                            <p className="text-white/60 text-sm">Missed Calls Recovered</p>
                        </div>
                        <div>
                            <p className="text-4xl font-bold text-white">{metrics.avgResponseTime}</p>
                            <p className="text-white/60 text-sm">Avg. Response Time</p>
                        </div>
                    </div>
                </div>

                {/* CTA */}
                <div id="demo-cta" className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-center">
                    <h2 className="text-2xl font-bold text-white mb-2">Ready to Capture Every Lead?</h2>
                    <p className="text-white/80 mb-6 max-w-xl mx-auto">
                        Stop losing customers to missed calls. Get your AI receptionist set up in under 10 minutes.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button className="bg-white text-indigo-600 px-8 py-3 rounded-xl font-bold hover:bg-indigo-50 transition-colors flex items-center gap-2">
                            <Zap size={20} /> Start Free Trial
                        </button>
                        <button className="text-white/80 hover:text-white px-6 py-3 font-medium flex items-center gap-2">
                            <Play size={18} /> Watch Video
                        </button>
                    </div>
                    <p className="text-white/60 text-sm mt-4">
                        $197/month after trial • Cancel anytime • Setup in 10 minutes
                    </p>
                </div>
            </div>

            {/* Lead Detail Modal */}
            {selectedLead && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-800 rounded-2xl max-w-lg w-full max-h-[80vh] overflow-hidden border border-white/10">
                        <div className="p-4 border-b border-white/10 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-white">{selectedLead.name}</h3>
                            <button onClick={() => setSelectedLead(null)} className="text-white/60 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-white/60 text-sm">Phone</p>
                                    <p className="text-white font-medium">{selectedLead.phone}</p>
                                </div>
                                <div>
                                    <p className="text-white/60 text-sm">Service</p>
                                    <p className="text-white font-medium">{selectedLead.serviceType}</p>
                                </div>
                                <div>
                                    <p className="text-white/60 text-sm">Urgency</p>
                                    <p className={`font-medium ${selectedLead.urgency === 'Emergency' ? 'text-red-400' :
                                            selectedLead.urgency === 'Medium' ? 'text-amber-400' : 'text-green-400'
                                        }`}>{selectedLead.urgency}</p>
                                </div>
                                <div>
                                    <p className="text-white/60 text-sm">Status</p>
                                    <p className="text-white font-medium">{selectedLead.status}</p>
                                </div>
                            </div>

                            <div>
                                <p className="text-white/60 text-sm mb-2">AI Conversation</p>
                                <div className="bg-slate-900/50 rounded-lg p-3 space-y-3 max-h-60 overflow-y-auto">
                                    {selectedLead.conversationHistory.map((msg, idx) => (
                                        <div key={idx} className={`flex ${msg.role === 'assistant' ? 'justify-start' : 'justify-end'}`}>
                                            <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${msg.role === 'assistant'
                                                    ? 'bg-indigo-600/30 text-indigo-200'
                                                    : 'bg-white/10 text-white'
                                                }`}>
                                                {msg.content}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Call Detail Modal */}
            {selectedCall && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-800 rounded-2xl max-w-lg w-full overflow-hidden border border-white/10">
                        <div className="p-4 border-b border-white/10 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-white">Call Details</h3>
                            <button onClick={() => setSelectedCall(null)} className="text-white/60 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-white/60 text-sm">Caller</p>
                                    <p className="text-white font-medium">{selectedCall.callerName}</p>
                                </div>
                                <div>
                                    <p className="text-white/60 text-sm">Phone</p>
                                    <p className="text-white font-medium">{selectedCall.callerPhone}</p>
                                </div>
                                <div>
                                    <p className="text-white/60 text-sm">Duration</p>
                                    <p className="text-white font-medium">{selectedCall.duration}</p>
                                </div>
                                <div>
                                    <p className="text-white/60 text-sm">Outcome</p>
                                    <p className={`font-medium ${selectedCall.outcome === 'Booked' ? 'text-green-400' :
                                            selectedCall.outcome === 'Missed' ? 'text-red-400' : 'text-white'
                                        }`}>{selectedCall.outcome}</p>
                                </div>
                            </div>

                            {selectedCall.transcript && (
                                <div>
                                    <p className="text-white/60 text-sm mb-2">Transcript</p>
                                    <div className="bg-slate-900/50 rounded-lg p-3 space-y-2">
                                        {selectedCall.transcript.map((line, idx) => (
                                            <p key={idx} className="text-white/80 text-sm">{line}</p>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DemoMode;
