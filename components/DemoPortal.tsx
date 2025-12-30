/**
 * DemoPortal
 * 
 * Interactive demo portal for prospects. Clones the SubscriberPortal experience
 * with fully populated mock data based on niche (e.g., HVAC).
 * 
 * Access: recpticom.com/demo/hvac
 */

import React, { useState } from 'react';
import {
    LayoutDashboard, Calendar, Phone, MessageSquare, Settings,
    LogOut, Bell, User, TrendingUp,
    CheckCircle, Mic, CreditCard, BarChart3,
    PhoneIncoming, PhoneOutgoing, X, Sparkles
} from 'lucide-react';
import VoiceDemoModal from './VoiceDemoModal';

// ============================================================================
// MOCK HVAC DATA
// ============================================================================

const HVAC_MOCK_CLIENT = {
    id: 'demo-hvac-001',
    businessName: 'Comfort Pro HVAC',
    niche: 'hvac',
    contactEmail: 'demo@comfortprohvac.com',
    contactPhone: '+1 (555) 123-4567',
    aiPhoneNumber: '+1 (555) 982-1102',
    status: 'Active' as const,
    config: {
        aiVoice: 'alloy',
        greeting: 'Thanks for calling Comfort Pro HVAC! How can I help you today?',
        businessHours: '7am - 8pm',
        emergencyKeywords: ['no heat', 'no AC', 'gas leak', 'carbon monoxide'],
    },
    leads: [
        {
            id: 'lead-1',
            name: 'Sarah Johnson',
            phone: '+1 (555) 234-5678',
            email: 'sarah.j@email.com',
            serviceType: 'AC Repair',
            urgency: 'Emergency' as const,
            status: 'Booked' as const,
            dateCaptured: new Date(Date.now() - 2 * 3600000).toISOString(),
            bookingDate: new Date(Date.now() + 24 * 3600000).toISOString(),
            notes: 'AC stopped working completely, house is 95 degrees',
        },
        {
            id: 'lead-2',
            name: 'Mike Thompson',
            phone: '+1 (555) 345-6789',
            email: 'mike.t@email.com',
            serviceType: 'Furnace Tune-Up',
            urgency: 'Medium' as const,
            status: 'Booked' as const,
            dateCaptured: new Date(Date.now() - 5 * 3600000).toISOString(),
            bookingDate: new Date(Date.now() + 48 * 3600000).toISOString(),
            notes: 'Annual maintenance appointment',
        },
        {
            id: 'lead-3',
            name: 'Jennifer Davis',
            phone: '+1 (555) 456-7890',
            email: 'jen.d@email.com',
            serviceType: 'New AC Installation',
            urgency: 'Low' as const,
            status: 'Qualified' as const,
            dateCaptured: new Date(Date.now() - 8 * 3600000).toISOString(),
            notes: 'Interested in upgrading to energy-efficient unit',
        },
        {
            id: 'lead-4',
            name: 'Robert Wilson',
            phone: '+1 (555) 567-8901',
            email: 'robert.w@email.com',
            serviceType: 'Heat Pump Repair',
            urgency: 'Medium' as const,
            status: 'New' as const,
            dateCaptured: new Date(Date.now() - 1 * 3600000).toISOString(),
            notes: 'Heat pump making strange noise',
        },
        {
            id: 'lead-5',
            name: 'Lisa Martinez',
            phone: '+1 (555) 678-9012',
            email: 'lisa.m@email.com',
            serviceType: 'Duct Cleaning',
            urgency: 'Low' as const,
            status: 'New' as const,
            dateCaptured: new Date(Date.now() - 30 * 60000).toISOString(),
            notes: 'Allergy concerns, wants full duct cleaning',
        },
    ],
    dateOnboarded: new Date(Date.now() - 30 * 24 * 3600000).toISOString(),
    mrr: 247,
};

const HVAC_CALL_HISTORY = [
    {
        id: 'call-1',
        caller: 'Sarah Johnson',
        phone: '+1 (555) 234-5678',
        timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
        duration: '4:23',
        type: 'answered' as const,
        urgency: 'Emergency',
        serviceType: 'AC Repair',
        transcription: 'Customer: Hi, my AC just stopped working and it\'s really hot in here. AI: I\'m sorry to hear that! I can help you get that fixed right away. This sounds like an emergency. What\'s the current temperature in your home? Customer: It\'s showing 95 degrees on my thermostat. AI: That definitely needs immediate attention. I have a technician available tomorrow morning between 8-10 AM. Would that work for you? Customer: Yes, please, that would be great. AI: Perfect, I\'ve scheduled you for tomorrow morning. You\'ll receive a confirmation text shortly.',
        aiActions: ['Lead captured', 'Emergency flagged', 'Appointment booked', 'SMS confirmation sent'],
    },
    {
        id: 'call-2',
        caller: 'Mike Thompson',
        phone: '+1 (555) 345-6789',
        timestamp: new Date(Date.now() - 5 * 3600000).toISOString(),
        duration: '2:45',
        type: 'answered' as const,
        urgency: 'Medium',
        serviceType: 'Furnace Tune-Up',
        transcription: 'Customer: I\'d like to schedule my annual furnace maintenance. AI: Absolutely, I can help you with that! We recommend tune-ups before the heating season starts. When works best for you? Customer: How about this weekend? AI: I have Saturday afternoon available, between 1-3 PM. Does that work? Customer: Perfect.',
        aiActions: ['Lead captured', 'Appointment booked', 'Calendar invite sent'],
    },
    {
        id: 'call-3',
        caller: 'Unknown Caller',
        phone: '+1 (555) 999-8888',
        timestamp: new Date(Date.now() - 12 * 3600000).toISOString(),
        duration: '0:00',
        type: 'missed' as const,
        urgency: 'Low',
        serviceType: 'Unknown',
        transcription: 'Missed call - voicemail left',
        aiActions: ['Callback reminder set'],
    },
    {
        id: 'call-4',
        caller: 'Jennifer Davis',
        phone: '+1 (555) 456-7890',
        timestamp: new Date(Date.now() - 8 * 3600000).toISOString(),
        duration: '6:12',
        type: 'answered' as const,
        urgency: 'Low',
        serviceType: 'New AC Installation',
        transcription: 'Customer: I\'m thinking about replacing my old AC unit. Can you tell me about your options? AI: Of course! We offer several energy-efficient options that could reduce your energy bills by up to 30%. What\'s the size of your home? Customer: About 2,400 square feet. AI: For a home that size, I\'d recommend a 3-ton unit. We have great financing options available. Would you like me to schedule a free estimate? Customer: Yes, I\'d like to see my options.',
        aiActions: ['Lead captured', 'Qualified as new installation', 'Estimate scheduled'],
    },
    {
        id: 'call-5',
        caller: 'Robert Wilson',
        phone: '+1 (555) 567-8901',
        timestamp: new Date(Date.now() - 1 * 3600000).toISOString(),
        duration: '3:08',
        type: 'answered' as const,
        urgency: 'Medium',
        serviceType: 'Heat Pump Repair',
        transcription: 'Customer: My heat pump has been making a weird grinding noise. AI: That definitely sounds like something we should look at. Is it still heating your home? Customer: Yes, but the noise is getting worse. AI: I understand. Let me get a technician out to diagnose that. We have availability tomorrow or Wednesday. Customer: Tomorrow works.',
        aiActions: ['Lead captured', 'Diagnostic scheduled', 'SMS confirmation sent'],
    },
];

const HVAC_SMS_CONVERSATIONS = [
    {
        id: 'sms-1',
        contact: 'Sarah Johnson',
        phone: '+1 (555) 234-5678',
        lastMessage: new Date(Date.now() - 1 * 3600000).toISOString(),
        messages: [
            { from: 'customer', text: 'Is there any way to get someone out today? My AC is completely dead.', time: '2:15 PM' },
            { from: 'ai', text: 'Hi Sarah! I understand this is urgent. Let me check our emergency availability for you right now.', time: '2:16 PM' },
            { from: 'ai', text: 'Good news! I was able to find a technician who can come out tomorrow morning between 8-10 AM. This is our earliest emergency slot. Would that work?', time: '2:17 PM' },
            { from: 'customer', text: 'Yes, that would be great. Thank you!', time: '2:18 PM' },
            { from: 'ai', text: 'Perfect! ✓ I\'ve booked your emergency AC repair for tomorrow, December 30th, 8-10 AM. You\'ll receive a reminder text in the morning. Stay cool! 🌡️', time: '2:19 PM' },
        ]
    },
    {
        id: 'sms-2',
        contact: 'Mike Thompson',
        phone: '+1 (555) 345-6789',
        lastMessage: new Date(Date.now() - 4 * 3600000).toISOString(),
        messages: [
            { from: 'customer', text: 'Hi, I spoke to someone about a furnace tune-up. Can you confirm my appointment?', time: '10:30 AM' },
            { from: 'ai', text: 'Hi Mike! Yes, I can see your appointment. You\'re scheduled for Saturday, January 4th, between 1-3 PM for your annual furnace tune-up. Is that still good for you?', time: '10:31 AM' },
            { from: 'customer', text: 'Yes, perfect. What should I expect?', time: '10:33 AM' },
            { from: 'ai', text: 'Great! Our technician will: ✓ Inspect all furnace components ✓ Clean the burners and blower ✓ Check safety controls ✓ Test efficiency. The whole process takes about 45-60 minutes. Any questions?', time: '10:34 AM' },
            { from: 'customer', text: 'Sounds good, see you Saturday!', time: '10:35 AM' },
        ]
    },
    {
        id: 'sms-3',
        contact: 'Lisa Martinez',
        phone: '+1 (555) 678-9012',
        lastMessage: new Date(Date.now() - 30 * 60000).toISOString(),
        messages: [
            { from: 'customer', text: 'Hi, I\'m interested in getting my ducts cleaned. We have bad allergies.', time: '12:45 PM' },
            { from: 'ai', text: 'Hi Lisa! Duct cleaning is a great choice for allergy relief. We use HEPA-filtered equipment to remove dust, dander, and allergens. When would you like to schedule?', time: '12:46 PM' },
            { from: 'customer', text: 'How much does it cost?', time: '12:48 PM' },
            { from: 'ai', text: 'Our duct cleaning service starts at $299 for homes up to 2,000 sq ft. This includes all supply and return ducts, plus the main trunk lines. Would you like a free estimate for your home?', time: '12:49 PM' },
            { from: 'customer', text: 'Yes please, sometime next week', time: '12:51 PM' },
            { from: 'ai', text: 'I have Tuesday or Thursday available next week. Which works better for you?', time: '12:52 PM' },
        ]
    },
];

// ============================================================================
// TYPES
// ============================================================================

type PortalTab = 'dashboard' | 'calls' | 'sms' | 'calendar' | 'analytics' | 'settings' | 'billing';

interface DemoPortalProps {
    niche: string;
    onExit: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

const DemoPortal: React.FC<DemoPortalProps> = ({ niche, onExit }) => {
    const [activeTab, setActiveTab] = useState<PortalTab>('dashboard');
    const [showVoiceDemo, setShowVoiceDemo] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);

    // Use HVAC data (can be extended for other niches)
    const client = HVAC_MOCK_CLIENT;
    const callHistory = HVAC_CALL_HISTORY;
    const smsConversations = HVAC_SMS_CONVERSATIONS;

    // Derived metrics
    const totalLeads = client.leads.length;
    const newLeads = client.leads.filter(l => l.status === 'New').length;
    const bookedLeads = client.leads.filter(l => l.status === 'Booked');

    // Navigation items
    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'calls', label: 'Call History', icon: PhoneIncoming },
        { id: 'sms', label: 'SMS History', icon: MessageSquare },
        { id: 'calendar', label: 'Appointments', icon: Calendar },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
        { id: 'settings', label: 'AI Settings', icon: Settings },
        { id: 'billing', label: 'Billing', icon: CreditCard },
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Demo Banner */}
            <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 px-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Sparkles size={18} />
                    <span className="font-medium">Demo Mode</span>
                    <span className="text-indigo-200">• This is a preview of what your portal would look like</span>
                </div>
                <div className="flex items-center gap-4">
                    <button className="bg-white text-indigo-600 px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-indigo-50">
                        Start Free Trial
                    </button>
                    <button onClick={onExit} className="text-white/80 hover:text-white">
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-slate-200 flex flex-col pt-12">
                {/* Logo & Business */}
                <div className="p-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-bold text-lg">
                            C
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="font-bold text-slate-900 truncate">{client.businessName}</h2>
                            <p className="text-xs text-slate-500">HVAC Demo</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-3 space-y-1">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id as PortalTab)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === item.id
                                    ? 'bg-indigo-50 text-indigo-700'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                        >
                            <item.icon size={18} />
                            {item.label}
                        </button>
                    ))}
                </nav>

                {/* AI Status */}
                <div className="p-4 border-t border-slate-100">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-sm font-medium text-green-800">AI Active</span>
                        </div>
                        <p className="text-xs text-green-700">{client.aiPhoneNumber}</p>
                    </div>
                </div>

                {/* Demo User */}
                <div className="p-4 border-t border-slate-100">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                            <User size={16} className="text-slate-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">Demo User</p>
                            <p className="text-xs text-slate-500">Preview Mode</p>
                        </div>
                    </div>
                    <button
                        onClick={onExit}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <LogOut size={16} />
                        Exit Demo
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto pt-12">
                {/* Header */}
                <header className="bg-white border-b border-slate-200 sticky top-12 z-20">
                    <div className="flex items-center justify-between px-6 h-16">
                        <h1 className="text-xl font-bold text-slate-900">
                            {navItems.find(n => n.id === activeTab)?.label}
                        </h1>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setShowVoiceDemo(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                            >
                                <Mic size={16} />
                                Test AI Call
                            </button>
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                            >
                                <Bell size={20} />
                                {newLeads > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                        {newLeads}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <div className="p-6">
                    {activeTab === 'dashboard' && renderDashboard()}
                    {activeTab === 'calls' && renderCallHistory()}
                    {activeTab === 'sms' && renderSMSHistory()}
                    {activeTab === 'calendar' && renderCalendar()}
                    {activeTab === 'analytics' && renderAnalytics()}
                    {activeTab === 'settings' && renderSettings()}
                    {activeTab === 'billing' && renderBilling()}
                </div>
            </main>

            {/* Voice Demo Modal */}
            {showVoiceDemo && (
                <VoiceDemoModal
                    client={client as any}
                    onClose={() => setShowVoiceDemo(false)}
                />
            )}
        </div>
    );

    // ============================================================================
    // DASHBOARD TAB
    // ============================================================================
    function renderDashboard() {
        return (
            <div className="space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl border border-slate-200 p-5">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-slate-500">Total Leads</span>
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-indigo-100 text-indigo-600">
                                <User size={20} />
                            </div>
                        </div>
                        <p className="text-3xl font-bold text-slate-900">{totalLeads}</p>
                        <p className="text-xs text-green-600 mt-1">↑ 23% this week</p>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 p-5">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-slate-500">Calls Today</span>
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-green-100 text-green-600">
                                <PhoneIncoming size={20} />
                            </div>
                        </div>
                        <p className="text-3xl font-bold text-slate-900">12</p>
                        <p className="text-xs text-slate-500 mt-1">1 missed</p>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 p-5">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-slate-500">Appointments</span>
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-purple-100 text-purple-600">
                                <Calendar size={20} />
                            </div>
                        </div>
                        <p className="text-3xl font-bold text-slate-900">{bookedLeads.length}</p>
                        <p className="text-xs text-slate-500 mt-1">This week</p>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 p-5">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-slate-500">Response Rate</span>
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-amber-100 text-amber-600">
                                <TrendingUp size={20} />
                            </div>
                        </div>
                        <p className="text-3xl font-bold text-slate-900">98%</p>
                        <p className="text-xs text-green-600 mt-1">AI answering</p>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Leads */}
                    <div className="bg-white rounded-xl border border-slate-200 p-6">
                        <h3 className="font-bold text-slate-900 mb-4">Recent Leads</h3>
                        <div className="space-y-3">
                            {client.leads.slice(0, 5).map(lead => (
                                <div key={lead.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${lead.status === 'Booked' ? 'bg-green-100 text-green-600' :
                                            lead.status === 'New' ? 'bg-blue-100 text-blue-600' :
                                                'bg-slate-100 text-slate-600'
                                        }`}>
                                        {lead.status === 'Booked' ? <CheckCircle size={18} /> : <User size={18} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-slate-900 truncate">{lead.name}</p>
                                        <p className="text-xs text-slate-500">{lead.serviceType}</p>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded-full ${lead.status === 'Booked' ? 'bg-green-100 text-green-700' :
                                            lead.status === 'New' ? 'bg-blue-100 text-blue-700' :
                                                'bg-slate-100 text-slate-600'
                                        }`}>
                                        {lead.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Upcoming Appointments */}
                    <div className="bg-white rounded-xl border border-slate-200 p-6">
                        <h3 className="font-bold text-slate-900 mb-4">Upcoming Appointments</h3>
                        <div className="space-y-3">
                            {bookedLeads.map(lead => (
                                <div key={lead.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                                    <div className="bg-orange-100 text-orange-600 w-12 h-12 rounded-lg flex flex-col items-center justify-center">
                                        <span className="text-xs font-bold">
                                            {lead.bookingDate ? new Date(lead.bookingDate).toLocaleDateString('en-US', { month: 'short' }) : 'TBD'}
                                        </span>
                                        <span className="text-lg font-bold leading-none">
                                            {lead.bookingDate ? new Date(lead.bookingDate).getDate() : '-'}
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-slate-900">{lead.name}</p>
                                        <p className="text-xs text-slate-500">{lead.serviceType}</p>
                                    </div>
                                    <span className="text-xs text-slate-500">
                                        {lead.bookingDate ? new Date(lead.bookingDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TBD'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ============================================================================
    // CALL HISTORY TAB
    // ============================================================================
    function renderCallHistory() {
        return (
            <div className="space-y-4">
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-slate-900">Call History</h3>
                        <span className="text-sm text-slate-500">{callHistory.length} calls</span>
                    </div>
                </div>

                <div className="space-y-3">
                    {callHistory.map(call => (
                        <div key={call.id} className="bg-white rounded-xl border border-slate-200 p-5">
                            <div className="flex items-start gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${call.type === 'missed' ? 'bg-red-100 text-red-600' :
                                        call.urgency === 'Emergency' ? 'bg-amber-100 text-amber-600' :
                                            'bg-green-100 text-green-600'
                                    }`}>
                                    {call.type === 'missed' ? <PhoneOutgoing size={20} /> : <PhoneIncoming size={20} />}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-2">
                                        <div>
                                            <h4 className="font-medium text-slate-900">{call.caller}</h4>
                                            <p className="text-sm text-slate-500">{call.phone}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium text-slate-700">{call.duration}</p>
                                            <p className="text-xs text-slate-400">
                                                {new Date(call.timestamp).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 mb-3">
                                        <span className={`text-xs px-2 py-1 rounded-full ${call.type === 'missed' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                                            }`}>
                                            {call.type === 'missed' ? 'Missed' : 'Answered by AI'}
                                        </span>
                                        {call.urgency === 'Emergency' && (
                                            <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700">Emergency</span>
                                        )}
                                        {call.serviceType !== 'Unknown' && (
                                            <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600">{call.serviceType}</span>
                                        )}
                                    </div>

                                    <div className="bg-slate-50 rounded-lg p-3 mb-3">
                                        <p className="text-xs font-medium text-slate-500 mb-1">AI Transcription</p>
                                        <p className="text-sm text-slate-700">{call.transcription}</p>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        {call.aiActions.map((action, i) => (
                                            <span key={i} className="text-xs px-2 py-1 bg-indigo-50 text-indigo-700 rounded-full flex items-center gap-1">
                                                <CheckCircle size={12} /> {action}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // ============================================================================
    // SMS HISTORY TAB
    // ============================================================================
    function renderSMSHistory() {
        return (
            <div className="space-y-4">
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-slate-900">SMS Conversations</h3>
                        <span className="text-sm text-slate-500">{smsConversations.length} conversations</span>
                    </div>
                </div>

                <div className="space-y-3">
                    {smsConversations.map(convo => (
                        <div key={convo.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center">
                                        <MessageSquare size={18} />
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-slate-900">{convo.contact}</h4>
                                        <p className="text-xs text-slate-500">{convo.phone}</p>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-400">
                                    {new Date(convo.lastMessage).toLocaleDateString()}
                                </p>
                            </div>

                            <div className="p-4 bg-slate-50 space-y-3 max-h-64 overflow-y-auto">
                                {convo.messages.map((msg, i) => (
                                    <div key={i} className={`flex ${msg.from === 'ai' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${msg.from === 'ai'
                                                ? 'bg-indigo-600 text-white rounded-br-none'
                                                : 'bg-white border border-slate-200 rounded-bl-none'
                                            }`}>
                                            <p>{msg.text}</p>
                                            <p className={`text-xs mt-1 ${msg.from === 'ai' ? 'text-indigo-200' : 'text-slate-400'}`}>
                                                {msg.time} {msg.from === 'ai' && '• AI'}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // ============================================================================
    // CALENDAR TAB
    // ============================================================================
    function renderCalendar() {
        return (
            <div className="space-y-6">
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h3 className="font-bold text-slate-900 mb-4">Booking Calendar</h3>
                    <div className="space-y-4">
                        {bookedLeads.map(lead => (
                            <div key={lead.id} className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
                                <div className="bg-orange-100 text-orange-600 w-16 h-16 rounded-lg flex flex-col items-center justify-center shrink-0">
                                    <span className="text-xs font-bold uppercase">
                                        {new Date(lead.bookingDate!).toLocaleDateString('en-US', { month: 'short' })}
                                    </span>
                                    <span className="text-2xl font-bold leading-none">
                                        {new Date(lead.bookingDate!).getDate()}
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-medium text-slate-900">{lead.name}</h4>
                                    <p className="text-sm text-slate-500">{lead.serviceType}</p>
                                    <p className="text-sm text-slate-600 mt-1">
                                        {new Date(lead.bookingDate!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                    {lead.urgency === 'Emergency' && (
                                        <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full mt-2 inline-block">Emergency</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // ============================================================================
    // ANALYTICS TAB
    // ============================================================================
    function renderAnalytics() {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl border border-slate-200 p-5">
                        <p className="text-sm text-slate-500 mb-1">Total Calls</p>
                        <p className="text-3xl font-bold text-slate-900">47</p>
                        <p className="text-xs text-green-600 mt-1">↑ 18% from last week</p>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 p-5">
                        <p className="text-sm text-slate-500 mb-1">AI Answer Rate</p>
                        <p className="text-3xl font-bold text-slate-900">98%</p>
                        <p className="text-xs text-green-600 mt-1">↑ 3% from last week</p>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 p-5">
                        <p className="text-sm text-slate-500 mb-1">Leads Captured</p>
                        <p className="text-3xl font-bold text-slate-900">{client.leads.length}</p>
                        <p className="text-xs text-green-600 mt-1">↑ 23% from last week</p>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 p-5">
                        <p className="text-sm text-slate-500 mb-1">Bookings</p>
                        <p className="text-3xl font-bold text-slate-900">{bookedLeads.length}</p>
                        <p className="text-xs text-green-600 mt-1">↑ 40% from last week</p>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h3 className="font-bold text-slate-900 mb-4">Call Volume (Last 7 Days)</h3>
                    <div className="h-48 flex items-end gap-2">
                        {[8, 12, 6, 15, 9, 7, 10].map((value, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center">
                                <div
                                    className="w-full bg-orange-500 rounded-t-sm"
                                    style={{ height: `${(value / 15) * 100}%` }}
                                />
                                <p className="text-xs text-slate-500 mt-2">
                                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl border border-slate-200 p-6">
                        <h3 className="font-bold text-slate-900 mb-4">Calls by Type</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-600">AC Repair</span>
                                <span className="font-medium text-slate-900">40%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2">
                                <div className="bg-orange-500 h-2 rounded-full" style={{ width: '40%' }} />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-600">Furnace/Heating</span>
                                <span className="font-medium text-slate-900">30%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2">
                                <div className="bg-red-500 h-2 rounded-full" style={{ width: '30%' }} />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-600">Maintenance</span>
                                <span className="font-medium text-slate-900">20%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2">
                                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '20%' }} />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-600">Other</span>
                                <span className="font-medium text-slate-900">10%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2">
                                <div className="bg-slate-400 h-2 rounded-full" style={{ width: '10%' }} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 p-6">
                        <h3 className="font-bold text-slate-900 mb-4">Response Time</h3>
                        <div className="text-center py-6">
                            <p className="text-5xl font-bold text-green-600 mb-2">&lt;1s</p>
                            <p className="text-slate-600">Average AI response time</p>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-100">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500">Calls answered within 2 rings</span>
                                <span className="font-medium text-green-600">99.2%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ============================================================================
    // SETTINGS TAB
    // ============================================================================
    function renderSettings() {
        return (
            <div className="space-y-6">
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h3 className="font-bold text-slate-900 mb-4">AI Receptionist Settings</h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Business Name</label>
                            <input
                                type="text"
                                defaultValue={client.businessName}
                                className="w-full border border-slate-300 rounded-lg px-3 py-2"
                                disabled
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">AI Greeting</label>
                            <textarea
                                defaultValue={client.config.greeting}
                                className="w-full border border-slate-300 rounded-lg px-3 py-2"
                                rows={3}
                                disabled
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Voice</label>
                            <select className="w-full border border-slate-300 rounded-lg px-3 py-2" disabled>
                                <option>Alloy (Default)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Emergency Keywords</label>
                            <div className="flex flex-wrap gap-2">
                                {client.config.emergencyKeywords.map((kw, i) => (
                                    <span key={i} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">{kw}</span>
                                ))}
                            </div>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
                            <p className="text-amber-800 text-sm">
                                <strong>Demo Mode:</strong> Settings are read-only in the demo. Start a free trial to customize your AI receptionist.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ============================================================================
    // BILLING TAB
    // ============================================================================
    function renderBilling() {
        return (
            <div className="space-y-6">
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="font-bold text-slate-900">Recommended Plan</h3>
                            <p className="text-sm text-slate-500">HVAC Pro</p>
                        </div>
                        <div className="text-right">
                            <p className="text-3xl font-bold text-slate-900">$247<span className="text-sm font-normal text-slate-500">/mo</span></p>
                        </div>
                    </div>

                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center gap-2">
                            <Sparkles className="text-indigo-600" size={20} />
                            <span className="font-medium text-indigo-800">Start Your Free 14-Day Trial</span>
                        </div>
                        <p className="text-sm text-indigo-700 mt-1">No credit card required. Full access to all features.</p>
                    </div>

                    <h4 className="font-medium text-slate-900 mb-3">Plan Features:</h4>
                    <ul className="space-y-2 text-sm text-slate-600">
                        <li className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500" /> 24/7 AI Receptionist</li>
                        <li className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500" /> Unlimited Calls & SMS</li>
                        <li className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500" /> Lead Capture & Qualification</li>
                        <li className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500" /> Appointment Booking</li>
                        <li className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500" /> Emergency Escalation</li>
                        <li className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500" /> Real-time Transcriptions</li>
                        <li className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500" /> Email & SMS Notifications</li>
                        <li className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500" /> Analytics Dashboard</li>
                    </ul>

                    <button className="w-full mt-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700">
                        Start Free Trial
                    </button>
                </div>
            </div>
        );
    }
};

export default DemoPortal;
