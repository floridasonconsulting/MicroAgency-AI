import React, { useState, useRef, useEffect } from 'react';
import { Client, Message, Lead } from '../types';
import { ArrowLeft, MessageSquare, Settings, Users, Play, Send, Bot, Smartphone, Copy, Check, X, Calendar, Phone, Activity, Mic, Volume2, Edit, Trash2, Save, ExternalLink, Plus, BarChart3, PhoneCall, ChevronDown } from 'lucide-react';
import { simulateAutoResponder, generateOutreachScript } from '../services/geminiService';
import AddLeadModal from './AddLeadModal';
import DemoMode from './DemoMode';
import AICallSimulator from './AICallSimulator';

interface ClientDetailProps {
    client: Client;
    onBack: () => void;
    onUpdateClient: (client: Client) => void;
    onAddLead: (lead: Omit<Lead, 'id'>) => Promise<Lead | null>;
    onBookAppointment: (leadId: string, date: string) => Promise<void>;
}

const ClientDetail: React.FC<ClientDetailProps> = ({ client, onBack, onUpdateClient, onAddLead, onBookAppointment }) => {
    // Admin view: simulator for testing, leads for overview, config for settings, growth for outreach
    const [activeTab, setActiveTab] = useState<'leads' | 'simulator' | 'config' | 'growth'>('leads');

    // Local Leads State to handle manual updates
    const [localLeads, setLocalLeads] = useState(client.leads);
    const [bookingLeadId, setBookingLeadId] = useState<string | null>(null);
    const [bookingDate, setBookingDate] = useState('');

    // Local Config State
    const [config, setConfig] = useState(client.config);

    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editForm, setEditForm] = useState<Client>(client);

    // Add Lead Modal State
    const [showAddLeadModal, setShowAddLeadModal] = useState(false);

    // Demo Mode and AI Call Simulator State
    const [showDemoMode, setShowDemoMode] = useState(false);
    const [showAICallSimulator, setShowAICallSimulator] = useState(false);
    const [showPortalMenu, setShowPortalMenu] = useState(false);

    // Sync leads & config when client prop changes (e.g. navigation)
    useEffect(() => {
        setLocalLeads(client.leads);
        setConfig(client.config);
        setEditForm(client);
        setBookingLeadId(null);
    }, [client]);

    const handleConfigChange = (field: string, value: any) => {
        const newConfig = { ...config, [field]: value };
        setConfig(newConfig);
        // Auto-save config changes to parent
        onUpdateClient({ ...client, config: newConfig });
    };

    // Booking Handlers
    const handleStartBooking = (leadId: string) => {
        setBookingLeadId(leadId);
        // Default to tomorrow at 9 AM
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0);
        // Format for datetime-local input: YYYY-MM-DDTHH:mm
        const dateString = tomorrow.toISOString().slice(0, 16);
        setBookingDate(dateString);
    };

    const handleConfirmBooking = async (leadId: string) => {
        await onBookAppointment(leadId, bookingDate);
        setBookingLeadId(null);
        setBookingDate('');
    };

    const handleCancelBooking = () => {
        setBookingLeadId(null);
        setBookingDate('');
    };

    // Edit Profile Handlers
    const handleSaveProfile = () => {
        onUpdateClient(editForm);
        setIsEditModalOpen(false);
    };

    const handleArchiveClient = () => {
        if (window.confirm("Are you sure you want to unsubscribe this client? Their status will be set to 'Churned'.")) {
            const archivedClient = { ...editForm, status: 'Churned' as const };
            onUpdateClient(archivedClient);
            setEditForm(archivedClient);
            setIsEditModalOpen(false);
        }
    };

    // Simulator State
    const [simHistory, setSimHistory] = useState<Message[]>([
        { role: 'system', content: 'SYSTEM: Inbound Lead Detected via SMS.', timestamp: 'Now' }
    ]);
    const [simInput, setSimInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Outreach State
    const [outreachScript, setOutreachScript] = useState<string | null>(null);
    const [generatingScript, setGeneratingScript] = useState(false);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [simHistory]);

    const handleSendMessage = async () => {
        if (!simInput.trim()) return;

        const userMsg: Message = { role: 'user', content: simInput, timestamp: new Date().toLocaleTimeString() };
        setSimHistory(prev => [...prev, userMsg]);
        setSimInput('');
        setIsTyping(true);

        // Call Gemini
        const aiResponseText = await simulateAutoResponder(client, userMsg.content, simHistory);

        setIsTyping(false);
        const aiMsg: Message = { role: 'assistant', content: aiResponseText, timestamp: new Date().toLocaleTimeString() };
        setSimHistory(prev => [...prev, aiMsg]);
    };

    const handleGenerateOutreach = async () => {
        setGeneratingScript(true);
        const script = await generateOutreachScript(client.niche, "Facebook Groups");
        setOutreachScript(script);
        setGeneratingScript(false);
    };

    return (
        <div className="animate-in fade-in slide-in-from-right-8 duration-500 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={onBack}
                    className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
                >
                    <ArrowLeft size={20} />
                </button>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-bold text-slate-900">{client.businessName}</h2>
                        <span className={`text-xs px-2 py-1 rounded-full font-bold border
                ${client.status === 'Active' ? 'bg-green-100 text-green-700 border-green-200' :
                                client.status === 'Churned' ? 'bg-red-100 text-red-700 border-red-200' :
                                    'bg-blue-100 text-blue-700 border-blue-200'}
             `}>
                            {client.status}
                        </span>
                    </div>
                    <p className="text-sm text-slate-500">{client.niche} • Owned by {client.ownerName}</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            // Open the subscriber portal for this client
                            // Store the client ID and navigate to portal view
                            window.open(`${window.location.origin}/#portal/${client.id}`, '_blank');
                        }}
                        className="bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-2 shadow-sm"
                    >
                        <ExternalLink size={16} /> Open Client Portal
                    </button>
                    <button
                        onClick={() => setIsEditModalOpen(true)}
                        className="bg-white border border-slate-300 text-slate-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 flex items-center gap-2"
                    >
                        <Edit size={16} /> Edit
                    </button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">

                {/* Navigation Sidebar (Tabs) */}
                <div className="w-full lg:w-64 flex flex-col gap-4">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-2">
                        <button
                            onClick={() => setActiveTab('leads')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'leads' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            <Users size={18} /> Captured Leads
                        </button>
                    </div>

                    {/* Connection Status Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Connection Status</h4>

                        {client.aiPhoneNumber ? (
                            <>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className={`w-2 h-2 rounded-full ${client.forwardingStatus === 'Verified' ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`}></div>
                                    <span className="text-sm font-medium text-slate-700">{client.forwardingStatus || 'Unknown'}</span>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mb-3">
                                    <p className="text-xs text-slate-500 mb-1">AI Virtual Number</p>
                                    <p className="font-mono text-sm font-bold text-slate-800">{client.aiPhoneNumber}</p>
                                </div>
                                {client.forwardingStatus !== 'Verified' && (
                                    <div className="text-xs text-slate-500">
                                        <p className="mb-1">Waiting for call forwarding...</p>
                                        <code className="bg-slate-100 px-1 py-0.5 rounded">*71 {client.aiPhoneNumber}</code>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-4">
                                <div className="bg-slate-100 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 text-slate-400">
                                    <Phone size={18} />
                                </div>
                                <p className="text-xs text-slate-500 mb-2">No AI Number Provisioned</p>
                                <button className="text-xs text-indigo-600 font-bold hover:underline">
                                    Provision Now
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">



                    {/* --- LEADS TAB --- */}
                    {activeTab === 'leads' && (
                        <div className="p-6 h-full overflow-y-auto">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-slate-900">Captured Leads ({localLeads.length})</h3>
                                <button
                                    onClick={() => setShowAddLeadModal(true)}
                                    className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-1 shadow-sm"
                                >
                                    <Plus size={14} /> Add Lead
                                </button>
                            </div>
                            {localLeads.length === 0 ? (
                                <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                    <Users className="mx-auto text-slate-300 mb-2" size={48} />
                                    <p className="text-slate-500">No leads captured yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {localLeads.map(lead => (
                                        <div key={lead.id} className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center shadow-sm gap-4">
                                            <div className="flex items-start gap-3">
                                                <div className="bg-blue-100 p-2 rounded-full">
                                                    <Smartphone size={20} className="text-blue-600" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-900">{lead.name || 'Unknown Lead'}</h4>
                                                    <p className="text-sm text-slate-500">{lead.phone}</p>
                                                    <div className="flex gap-2 mt-1">
                                                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                                                            {lead.serviceType}
                                                        </span>
                                                        {lead.urgency === 'Emergency' && (
                                                            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded font-medium">
                                                                Emergency
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right flex flex-col items-end gap-2 w-full sm:w-auto">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-xs text-slate-400">{lead.dateCaptured}</p>
                                                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold
                                                ${lead.status === 'Booked' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}
                                            `}>
                                                        {lead.status}
                                                    </span>
                                                </div>

                                                {/* Action Button Area */}
                                                {lead.status !== 'Booked' && lead.status !== 'Closed' && (
                                                    <div>
                                                        {bookingLeadId === lead.id ? (
                                                            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded border border-slate-200 animate-in fade-in">
                                                                <input
                                                                    type="datetime-local"
                                                                    className="text-xs border border-slate-300 rounded px-1 py-1 w-32"
                                                                    value={bookingDate}
                                                                    onChange={(e) => setBookingDate(e.target.value)}
                                                                />
                                                                <button
                                                                    onClick={() => handleConfirmBooking(lead.id)}
                                                                    className="p-1 bg-green-100 text-green-600 hover:bg-green-200 rounded transition-colors"
                                                                    title="Confirm Booking"
                                                                >
                                                                    <Check size={14} />
                                                                </button>
                                                                <button
                                                                    onClick={handleCancelBooking}
                                                                    className="p-1 bg-slate-100 text-slate-400 hover:bg-slate-200 rounded transition-colors"
                                                                    title="Cancel"
                                                                >
                                                                    <X size={14} />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleStartBooking(lead.id)}
                                                                className="flex items-center gap-1 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-md transition-colors shadow-sm"
                                                            >
                                                                <Calendar size={12} /> Book Demo
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                                {lead.status === 'Booked' && lead.bookingDate && (
                                                    <p className="text-[10px] text-slate-400">
                                                        {new Date(lead.bookingDate).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}


                </div>
            </div>

            {/* --- EDIT SUBSCRIBER MODAL --- */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-900">Edit Subscriber</h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Business Name</label>
                                <input
                                    type="text"
                                    value={editForm.businessName}
                                    onChange={e => setEditForm({ ...editForm, businessName: e.target.value })}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Owner Name</label>
                                    <input
                                        type="text"
                                        value={editForm.ownerName}
                                        onChange={e => setEditForm({ ...editForm, ownerName: e.target.value })}
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status</label>
                                    <select
                                        value={editForm.status}
                                        onChange={e => setEditForm({ ...editForm, status: e.target.value as any })}
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Onboarding">Onboarding</option>
                                        <option value="Churned">Churned</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email Address</label>
                                <input
                                    type="email"
                                    value={editForm.email}
                                    onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone Number</label>
                                <input
                                    type="text"
                                    value={editForm.phone}
                                    onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                                />
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex justify-between items-center mt-4">
                                <button
                                    onClick={handleArchiveClient}
                                    className="text-red-600 text-sm font-medium hover:text-red-700 flex items-center gap-2 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
                                >
                                    <Trash2 size={16} /> Unsubscribe Client
                                </button>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setIsEditModalOpen(false)}
                                        className="px-4 py-2 text-slate-600 text-sm font-medium hover:bg-slate-100 rounded-lg"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveProfile}
                                        className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 rounded-lg shadow-sm"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Lead Modal */}
            {showAddLeadModal && (
                <AddLeadModal
                    clientId={client.id}
                    clientNiche={client.niche}
                    onClose={() => setShowAddLeadModal(false)}
                    onAddLead={async (leadData) => {
                        await onAddLead(leadData);
                        setShowAddLeadModal(false);
                    }}
                />
            )}

            {/* Demo Mode */}
            {showDemoMode && (
                <DemoMode
                    niche={client.niche.toLowerCase()}
                    onExit={() => setShowDemoMode(false)}
                />
            )}

            {/* AI Call Simulator */}
            {showAICallSimulator && (
                <AICallSimulator
                    clientContext={{
                        businessName: client.businessName,
                        niche: client.niche,
                        greeting: client.config.customGreeting || `Thanks for calling ${client.businessName}. How can I help you today?`,
                        services: [client.niche, 'General Inquiry', 'Emergency Service'],
                    }}
                    onClose={() => setShowAICallSimulator(false)}
                    onLeadCaptured={async (lead) => {
                        const newLead = await onAddLead({
                            name: lead.name,
                            phone: lead.phone,
                            serviceType: 'AI Call Inquiry',
                            urgency: 'Medium',
                            status: 'New',
                            dateCaptured: new Date().toISOString().split('T')[0],
                            conversationHistory: [{ role: 'system', content: lead.notes, timestamp: new Date().toISOString() }]
                        });
                    }}
                />
            )}

            {/* Click outside to close portal menu */}
            {showPortalMenu && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowPortalMenu(false)}
                />
            )}
        </div>
    );
};

export default ClientDetail;
