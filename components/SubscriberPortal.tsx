/**
 * SubscriberPortal
 * 
 * Dedicated portal for authenticated subscribers (business owners).
 * Shows ONLY their company data - no visibility into other subscribers.
 * 
 * Access: recpticom.com/portal → Login → This portal
 */

import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard, Calendar, Phone, MessageSquare, Settings,
    LogOut, Bell, User, ChevronDown, TrendingUp, Clock,
    CheckCircle, AlertCircle, Mic, CreditCard, BarChart3,
    PhoneIncoming, PhoneOutgoing, Users, ArrowUpRight
} from 'lucide-react';
import { Lead, Client } from '../types';
import { signOut, AuthUser } from '../services/authService';
import {
    getUpcomingAppointments,
    Appointment,
    generateGoogleCalendarUrl,
    generateOutlookCalendarUrl,
    getCalendarSettings,
    ClientCalendarSettings
} from '../services/appointmentService';
import VoiceDemoModal from './VoiceDemoModal';

// ============================================================================
// TYPES
// ============================================================================

type PortalTab = 'dashboard' | 'calls' | 'sms' | 'calendar' | 'analytics' | 'settings' | 'billing';

interface SubscriberPortalProps {
    user: AuthUser;
    client: Client;
    onLogout: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

const SubscriberPortal: React.FC<SubscriberPortalProps> = ({ user, client, onLogout }) => {
    const [activeTab, setActiveTab] = useState<PortalTab>('dashboard');
    const [showVoiceDemo, setShowVoiceDemo] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);

    // Derived metrics
    const totalLeads = client.leads.length;
    const newLeads = client.leads.filter(l => l.status === 'New').length;
    const bookedLeads = client.leads.filter(l => l.status === 'Booked');
    const todayCalls = Math.floor(Math.random() * 5) + 3; // Demo data
    const missedCalls = Math.floor(Math.random() * 2); // Demo data

    // Handle logout
    const handleLogout = async () => {
        await signOut();
        onLogout();
    };

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
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
                {/* Logo & Business */}
                <div className="p-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                            {client.businessName.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="font-bold text-slate-900 truncate">{client.businessName}</h2>
                            <p className="text-xs text-slate-500">Subscriber Portal</p>
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
                        <p className="text-xs text-green-700">{client.aiPhoneNumber || '+1 (555) 982-1102'}</p>
                    </div>
                </div>

                {/* User & Logout */}
                <div className="p-4 border-t border-slate-100">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                            <User size={16} className="text-slate-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">{user.email}</p>
                            <p className="text-xs text-slate-500">Owner</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <LogOut size={16} />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                {/* Header */}
                <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
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
                    client={client}
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
                    <StatCard
                        title="Total Leads"
                        value={totalLeads}
                        icon={Users}
                        trend="+12% this week"
                        color="indigo"
                    />
                    <StatCard
                        title="Calls Today"
                        value={todayCalls}
                        icon={PhoneIncoming}
                        trend={`${missedCalls} missed`}
                        color="green"
                    />
                    <StatCard
                        title="Appointments"
                        value={bookedLeads.length}
                        icon={Calendar}
                        trend="This week"
                        color="purple"
                    />
                    <StatCard
                        title="Response Rate"
                        value="98%"
                        icon={TrendingUp}
                        trend="AI answering"
                        color="amber"
                    />
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
                            {bookedLeads.slice(0, 5).map(lead => (
                                <div key={lead.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                                    <div className="bg-purple-100 text-purple-600 w-12 h-12 rounded-lg flex flex-col items-center justify-center">
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
                            {bookedLeads.length === 0 && (
                                <p className="text-center text-slate-400 py-8">No upcoming appointments</p>
                            )}
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
        // Generate sample call data from leads
        const callHistory = client.leads.map((lead, idx) => ({
            id: `call-${lead.id}`,
            caller: lead.name,
            phone: lead.phone,
            timestamp: lead.dateCaptured,
            duration: `${Math.floor(Math.random() * 5) + 1}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
            type: idx % 3 === 0 ? 'missed' : 'answered',
            urgency: lead.urgency,
            serviceType: lead.serviceType,
            transcription: `Customer called about ${lead.serviceType?.toLowerCase() || 'service'}. ${lead.urgency === 'Emergency' ? 'This was flagged as an emergency call.' : 'Standard inquiry.'}`,
            aiActions: ['Lead captured', 'Sent to calendar', 'SMS confirmation sent']
        }));

        return (
            <div className="space-y-4">
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-slate-900">Call History</h3>
                        <span className="text-sm text-slate-500">{callHistory.length} calls</span>
                    </div>
                </div>

                {/* Timeline */}
                <div className="space-y-3">
                    {callHistory.map((call, idx) => (
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
                                        {call.serviceType && (
                                            <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600">{call.serviceType}</span>
                                        )}
                                    </div>

                                    {/* Transcription */}
                                    <div className="bg-slate-50 rounded-lg p-3 mb-3">
                                        <p className="text-xs font-medium text-slate-500 mb-1">AI Transcription</p>
                                        <p className="text-sm text-slate-700">{call.transcription}</p>
                                    </div>

                                    {/* AI Actions */}
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
        // Generate sample SMS conversations
        const smsConversations = client.leads.slice(0, 5).map((lead, idx) => ({
            id: `sms-${lead.id}`,
            contact: lead.name,
            phone: lead.phone,
            lastMessage: new Date(Date.now() - idx * 3600000).toISOString(),
            messages: [
                { from: 'customer', text: `Hi, I need help with ${lead.serviceType?.toLowerCase() || 'my system'}`, time: '10:30 AM' },
                { from: 'ai', text: `Hi ${lead.name.split(' ')[0]}! Thanks for reaching out. I'd be happy to help you with that. Can you tell me more about the issue?`, time: '10:31 AM' },
                { from: 'customer', text: 'It stopped working this morning', time: '10:33 AM' },
                { from: 'ai', text: `I understand how frustrating that can be. We have availability today. Would you like me to book a technician visit?`, time: '10:34 AM' },
                { from: 'customer', text: 'Yes please, afternoon works best', time: '10:36 AM' },
                { from: 'ai', text: `Perfect! I've scheduled a technician for today between 2-4 PM. You'll receive a confirmation shortly. Is there anything else I can help with?`, time: '10:37 AM' },
            ]
        }));

        return (
            <div className="space-y-4">
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-slate-900">SMS Conversations</h3>
                        <span className="text-sm text-slate-500">{smsConversations.length} conversations</span>
                    </div>
                </div>

                {/* Conversation List */}
                <div className="space-y-3">
                    {smsConversations.map(convo => (
                        <div key={convo.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                            {/* Header */}
                            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
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

                            {/* Messages */}
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
    // ANALYTICS TAB
    // ============================================================================
    function renderAnalytics() {
        return (
            <div className="space-y-6">
                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl border border-slate-200 p-5">
                        <p className="text-sm text-slate-500 mb-1">Total Calls</p>
                        <p className="text-3xl font-bold text-slate-900">{client.leads.length * 3}</p>
                        <p className="text-xs text-green-600 mt-1">↑ 12% from last week</p>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 p-5">
                        <p className="text-sm text-slate-500 mb-1">AI Answer Rate</p>
                        <p className="text-3xl font-bold text-slate-900">98%</p>
                        <p className="text-xs text-green-600 mt-1">↑ 3% from last week</p>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 p-5">
                        <p className="text-sm text-slate-500 mb-1">Leads Captured</p>
                        <p className="text-3xl font-bold text-slate-900">{client.leads.length}</p>
                        <p className="text-xs text-green-600 mt-1">↑ 8% from last week</p>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 p-5">
                        <p className="text-sm text-slate-500 mb-1">Bookings</p>
                        <p className="text-3xl font-bold text-slate-900">{bookedLeads.length}</p>
                        <p className="text-xs text-green-600 mt-1">↑ 15% from last week</p>
                    </div>
                </div>

                {/* Call Volume Chart Placeholder */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h3 className="font-bold text-slate-900 mb-4">Call Volume (Last 7 Days)</h3>
                    <div className="h-48 flex items-end gap-2">
                        {[45, 62, 38, 71, 55, 48, 60].map((value, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center">
                                <div
                                    className="w-full bg-indigo-500 rounded-t-sm"
                                    style={{ height: `${value}%` }}
                                />
                                <p className="text-xs text-slate-500 mt-2">
                                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Lead Sources */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl border border-slate-200 p-6">
                        <h3 className="font-bold text-slate-900 mb-4">Calls by Type</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-600">Service Calls</span>
                                <span className="font-medium text-slate-900">65%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2">
                                <div className="bg-indigo-500 h-2 rounded-full" style={{ width: '65%' }} />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-600">Emergency</span>
                                <span className="font-medium text-slate-900">20%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2">
                                <div className="bg-red-500 h-2 rounded-full" style={{ width: '20%' }} />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-600">Inquiries</span>
                                <span className="font-medium text-slate-900">15%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2">
                                <div className="bg-amber-500 h-2 rounded-full" style={{ width: '15%' }} />
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
    // CALENDAR TAB
    // ============================================================================
    function renderCalendar() {
        const upcomingBookings = client.leads
            .filter(l => l.bookingDate)
            .sort((a, b) => new Date(a.bookingDate!).getTime() - new Date(b.bookingDate!).getTime());

        return (
            <div className="space-y-6">
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h3 className="font-bold text-slate-900 mb-4">Booking Calendar</h3>

                    {upcomingBookings.length > 0 ? (
                        <div className="space-y-4">
                            {upcomingBookings.map(lead => (
                                <div key={lead.id} className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
                                    <div className="bg-indigo-100 text-indigo-600 w-16 h-16 rounded-lg flex flex-col items-center justify-center shrink-0">
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
                                    </div>
                                    <div className="flex gap-2">
                                        <a
                                            href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(lead.serviceType || 'Appointment')}&dates=${new Date(lead.bookingDate!).toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${new Date(new Date(lead.bookingDate!).getTime() + 3600000).toISOString().replace(/[-:]/g, '').split('.')[0]}Z`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                                        >
                                            + Google
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <Calendar className="mx-auto text-slate-300 mb-4" size={48} />
                            <p className="text-slate-500">No upcoming appointments</p>
                        </div>
                    )}
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
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">AI Greeting</label>
                            <textarea
                                defaultValue={`Thanks for calling ${client.businessName}. How can I help you today?`}
                                className="w-full border border-slate-300 rounded-lg px-3 py-2"
                                rows={3}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Voice</label>
                            <select className="w-full border border-slate-300 rounded-lg px-3 py-2">
                                <option>Alloy (Default)</option>
                                <option>Echo</option>
                                <option>Shimmer</option>
                            </select>
                        </div>

                        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700">
                            Save Changes
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h3 className="font-bold text-slate-900 mb-4">Notification Preferences</h3>

                    <div className="space-y-3">
                        <label className="flex items-center gap-3">
                            <input type="checkbox" defaultChecked className="w-5 h-5 text-indigo-600 rounded" />
                            <span>Email me when a new lead is captured</span>
                        </label>
                        <label className="flex items-center gap-3">
                            <input type="checkbox" defaultChecked className="w-5 h-5 text-indigo-600 rounded" />
                            <span>SMS alert for emergency calls</span>
                        </label>
                        <label className="flex items-center gap-3">
                            <input type="checkbox" defaultChecked className="w-5 h-5 text-indigo-600 rounded" />
                            <span>Daily summary email</span>
                        </label>
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
                            <h3 className="font-bold text-slate-900">Current Plan</h3>
                            <p className="text-sm text-slate-500">HVAC Solo Plan</p>
                        </div>
                        <div className="text-right">
                            <p className="text-3xl font-bold text-slate-900">$247<span className="text-sm font-normal text-slate-500">/mo</span></p>
                        </div>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="text-green-600" size={20} />
                            <span className="font-medium text-green-800">Active Subscription</span>
                        </div>
                        <p className="text-sm text-green-700 mt-1">Next billing: January 15, 2025</p>
                    </div>

                    <h4 className="font-medium text-slate-900 mb-3">Plan Features:</h4>
                    <ul className="space-y-2 text-sm text-slate-600">
                        <li className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500" /> 24/7 AI Receptionist</li>
                        <li className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500" /> Unlimited Calls</li>
                        <li className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500" /> Lead Capture & Qualification</li>
                        <li className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500" /> Appointment Booking</li>
                        <li className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500" /> Emergency Escalation</li>
                        <li className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500" /> Email & SMS Notifications</li>
                    </ul>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h3 className="font-bold text-slate-900 mb-4">Payment Method</h3>
                    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                        <CreditCard className="text-slate-400" size={24} />
                        <div>
                            <p className="font-medium text-slate-900">•••• •••• •••• 4242</p>
                            <p className="text-sm text-slate-500">Expires 12/26</p>
                        </div>
                        <button className="ml-auto text-indigo-600 text-sm font-medium hover:underline">Update</button>
                    </div>
                </div>
            </div>
        );
    }
};

// ============================================================================
// STAT CARD COMPONENT
// ============================================================================
interface StatCardProps {
    title: string;
    value: number | string;
    icon: any; // LucideIcon type
    trend: string;
    color: 'indigo' | 'green' | 'purple' | 'amber';
}

function StatCard({ title, value, icon: Icon, trend, color }: StatCardProps) {
    const colors = {
        indigo: 'bg-indigo-100 text-indigo-600',
        green: 'bg-green-100 text-green-600',
        purple: 'bg-purple-100 text-purple-600',
        amber: 'bg-amber-100 text-amber-600',
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-slate-500">{title}</span>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}>
                    <Icon size={20} />
                </div>
            </div>
            <p className="text-3xl font-bold text-slate-900">{value}</p>
            <p className="text-xs text-slate-500 mt-1">{trend}</p>
        </div>
    );
}

export default SubscriberPortal;
