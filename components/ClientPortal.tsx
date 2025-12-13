
import React, { useState, useEffect } from 'react';
import { Client, Lead } from '../types';
import { LayoutDashboard, Calendar as CalIcon, MessageSquare, Phone, ArrowUpRight, ChevronDown, ChevronUp, Clock, Calendar, Video, MapPin, Settings, User, CheckCircle, CreditCard, Sparkles, X, ArrowRight, Mic } from 'lucide-react';
import VoiceDemoModal from './VoiceDemoModal';

interface ClientPortalProps {
  client: Client;
  onClose: () => void; 
}

const ClientPortal: React.FC<ClientPortalProps> = ({ client, onClose }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'activity' | 'calendar'>('dashboard');
  const [showVoiceDemo, setShowVoiceDemo] = useState(false);
  
  // Sales Flow State
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [newClientData, setNewClientData] = useState({
    businessName: '',
    phone: '',
    niche: ''
  });

  // Metrics (Derived from Client Data)
  const totalLeads = client.leads.length;
  const bookedLeads = client.leads.filter(l => l.status === 'Booked');
  const potentialRevenue = bookedLeads.length * 500; 
  const activityLogs = [...client.leads].sort((a, b) => new Date(b.dateCaptured).getTime() - new Date(a.dateCaptured).getTime());
  const upcomingBookings = client.leads
      .filter(l => l.bookingDate)
      .sort((a, b) => new Date(a.bookingDate!).getTime() - new Date(b.bookingDate!).getTime());

  // Effect: Trigger "Sell" modal after 5 seconds if in Demo mode
  useEffect(() => {
    if (client.id === 'demo') {
      const timer = setTimeout(() => {
        setShowOfferModal(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [client.id]);

  const generateGoogleCalLink = (lead: Lead) => {
    if (!lead.bookingDate) return '#';
    const startDate = new Date(lead.bookingDate);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour duration
    const formatTime = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, "");
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Appt+with+${encodeURIComponent(lead.name)}&dates=${formatTime(startDate)}/${formatTime(endDate)}&details=Service:+${encodeURIComponent(lead.serviceType)}&location=Phone/Virtual`;
  };

  const handleSubscribe = () => {
    setShowOfferModal(false);
    setIsOnboarding(true);
  };

  // --- ONBOARDING WIZARD COMPONENT ---
  const renderOnboarding = () => {
    return (
      <div className="fixed inset-0 bg-slate-900 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
          
          {/* Wizard Header */}
          <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {onboardingStep === 1 && "Create Your Account"}
                {onboardingStep === 2 && "Configure AI Receptionist"}
                {onboardingStep === 3 && "Setup Call Forwarding"}
              </h2>
              <p className="text-sm text-slate-500">Step {onboardingStep} of 3</p>
            </div>
            {onboardingStep === 3 && <CheckCircle className="text-green-500" size={32} />}
          </div>

          {/* Wizard Body */}
          <div className="p-8 overflow-y-auto">
            {onboardingStep === 1 && (
              <div className="space-y-4">
                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 mb-6 flex items-start gap-3">
                  <CreditCard className="text-indigo-600 mt-1" />
                  <div>
                    <h4 className="font-bold text-indigo-900">Secure Payment Successful</h4>
                    <p className="text-sm text-indigo-700">Welcome to the $197/mo plan. Let's set up your AI.</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Business Name</label>
                  <input type="text" className="w-full border p-3 rounded-lg" placeholder="e.g. Joe's Plumbing" 
                    value={newClientData.businessName} onChange={e => setNewClientData({...newClientData, businessName: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Industry / Niche</label>
                  <input type="text" className="w-full border p-3 rounded-lg" placeholder="e.g. Plumbing, HVAC"
                    value={newClientData.niche} onChange={e => setNewClientData({...newClientData, niche: e.target.value})} />
                </div>
                <button onClick={() => setOnboardingStep(2)} disabled={!newClientData.businessName}
                  className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 mt-4">
                  Next: Configure AI
                </button>
              </div>
            )}

            {onboardingStep === 2 && (
              <div className="space-y-6">
                 <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Select AI Voice</label>
                    <div className="grid grid-cols-3 gap-3">
                       {['Alloy', 'Echo', 'Shimmer'].map(voice => (
                         <div key={voice} className="border p-3 rounded-lg text-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50">
                            <div className="w-8 h-8 bg-slate-100 rounded-full mx-auto mb-2 flex items-center justify-center"><Phone size={14}/></div>
                            <span className="text-sm font-medium">{voice}</span>
                         </div>
                       ))}
                    </div>
                 </div>
                 <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Greeting Message</label>
                    <textarea className="w-full border p-3 rounded-lg text-sm" rows={3} defaultValue={`Thanks for calling ${newClientData.businessName}. How can I help you today?`} />
                 </div>
                 <button onClick={() => setOnboardingStep(3)}
                  className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700">
                  Provision AI Number
                </button>
              </div>
            )}

            {onboardingStep === 3 && (
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                   <CheckCircle size={32} />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">You are Live!</h3>
                <p className="text-slate-600">We have provisioned your dedicated AI reception line.</p>
                
                <div className="bg-slate-100 p-6 rounded-xl border border-slate-200">
                   <p className="text-xs font-bold text-slate-500 uppercase">Your AI Number</p>
                   <p className="text-3xl font-mono font-bold text-slate-800 my-2">+1 (555) 982-1102</p>
                   <p className="text-xs text-red-500 font-medium mt-2">Action Required: Forward your missed calls to this number.</p>
                </div>

                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 border border-slate-300 py-3 rounded-lg font-medium hover:bg-slate-50">
                        Go to Dashboard
                    </button>
                    <button onClick={() => alert("Notification sent to Admin!")} className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700">
                        Finish Setup
                    </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // --- RENDER MAIN PORTAL ---
  if (isOnboarding) return renderOnboarding();

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 relative">
      
      {/* Top Navigation - Client Branding */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
                  {client.businessName.charAt(0)}
               </div>
               <div>
                  <h1 className="font-bold text-slate-900 leading-tight">{client.businessName}</h1>
                  <p className="text-xs text-slate-500">Client Portal</p>
               </div>
            </div>
            
            <div className="flex items-center gap-4">
               {/* VOICE DEMO BUTTON */}
               <button
                  onClick={() => setShowVoiceDemo(true)}
                  className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                   <Mic size={14} /> Call AI Receptionist
                </button>

               {client.id === 'demo' ? (
                   <button 
                     onClick={() => setShowOfferModal(true)}
                     className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-sm animate-pulse"
                   >
                     Start Free Trial
                   </button>
               ) : (
                   <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium border border-green-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                      AI Receptionist Active
                   </span>
               )}
               <button onClick={onClose} className="text-xs text-slate-400 hover:text-slate-600 underline">
                  Exit Demo
               </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Mobile Tabs */}
        <div className="md:hidden flex space-x-1 bg-white p-1 rounded-xl shadow-sm border border-slate-200 mb-6">
            {['dashboard', 'activity', 'calendar'].map((tab: any) => (
                <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 capitalize py-2 text-sm font-medium rounded-lg ${activeTab === tab ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500'}`}
                >
                    {tab}
                </button>
            ))}
        </div>

        {/* Dashboard View */}
        {(activeTab === 'dashboard') && (
            <div className="space-y-6 animate-in fade-in duration-500">
                
                {/* Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <ArrowUpRight size={48} className="text-green-500" />
                        </div>
                        <p className="text-sm font-medium text-slate-500 mb-1">Total Leads Captured</p>
                        <h3 className="text-3xl font-bold text-slate-900">{totalLeads}</h3>
                        <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
                            <ArrowUpRight size={14} /> +12% this week
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <p className="text-sm font-medium text-slate-500 mb-1">Appointments Set</p>
                        <h3 className="text-3xl font-bold text-slate-900">{bookedLeads.length}</h3>
                        <div className="mt-2 text-xs text-indigo-600 font-medium">
                            {bookedLeads.length > 0 ? 'Upcoming on calendar' : 'No bookings yet'}
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <p className="text-sm font-medium text-slate-500 mb-1">Pipeline Value (Est)</p>
                        <h3 className="text-3xl font-bold text-slate-900">${potentialRevenue.toLocaleString()}</h3>
                        <div className="mt-2 text-xs text-slate-400">
                            Based on $500 avg ticket
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Activity Feed Preview */}
                    <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900">Recent Activity</h3>
                            <button onClick={() => setActiveTab('activity')} className="text-indigo-600 text-sm font-medium hover:underline">View All</button>
                        </div>
                        <div className="flex-1 overflow-y-auto max-h-[400px]">
                            {activityLogs.length > 0 ? (
                                <div className="divide-y divide-slate-50">
                                    {activityLogs.slice(0, 5).map(lead => (
                                        <div key={lead.id} className="p-4 hover:bg-slate-50 transition-colors">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                                                        <MessageSquare size={14} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900">{lead.name}</p>
                                                        <p className="text-xs text-slate-500">{lead.serviceType} Inquiry</p>
                                                    </div>
                                                </div>
                                                <span className="text-xs text-slate-400">{lead.dateCaptured}</span>
                                            </div>
                                            <div className="ml-11 p-3 bg-slate-50 rounded-lg rounded-tl-none text-xs text-slate-600 border border-slate-100 italic">
                                                "{lead.conversationHistory[lead.conversationHistory.length - 1]?.content || 'Started conversation...'}"
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center text-slate-400 text-sm">No activity yet.</div>
                            )}
                        </div>
                    </div>

                    {/* Upcoming Calendar Preview */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-slate-50">
                             <h3 className="font-bold text-slate-900">Upcoming Bookings</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto max-h-[400px] p-4 space-y-3">
                            {upcomingBookings.length > 0 ? (
                                upcomingBookings.map(lead => (
                                    <div key={lead.id} className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="bg-white p-2 rounded-lg border border-slate-200 text-center min-w-[50px]">
                                                <div className="text-[10px] text-red-500 font-bold uppercase">
                                                    {new Date(lead.bookingDate!).toLocaleDateString('en-US', {month: 'short'})}
                                                </div>
                                                <div className="text-lg font-bold text-slate-900 leading-none">
                                                    {new Date(lead.bookingDate!).getDate()}
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">{lead.name}</p>
                                                <p className="text-xs text-slate-500">{new Date(lead.bookingDate!).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                            </div>
                                        </div>
                                        <a 
                                            href={generateGoogleCalLink(lead)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block w-full text-center py-1.5 bg-white border border-slate-200 rounded text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                                        >
                                            Add to Calendar
                                        </a>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8">
                                    <Calendar className="mx-auto text-slate-300 mb-2" size={32} />
                                    <p className="text-xs text-slate-400">No upcoming bookings.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Activity Full View */}
        {activeTab === 'activity' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden min-h-[600px]">
                 <div className="p-6 border-b border-slate-100">
                    <h2 className="text-lg font-bold text-slate-900">Interaction Log</h2>
                    <p className="text-sm text-slate-500">Real-time log of AI conversations and call outcomes.</p>
                 </div>
                 <div className="divide-y divide-slate-100">
                    {activityLogs.map(lead => (
                        <ActivityItem key={lead.id} lead={lead} />
                    ))}
                 </div>
            </div>
        )}

        {/* Calendar Full View */}
        {activeTab === 'calendar' && (
             <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden min-h-[600px]">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                   <div>
                       <h2 className="text-lg font-bold text-slate-900">Booking Calendar</h2>
                       <p className="text-sm text-slate-500">Appointments scheduled by your AI.</p>
                   </div>
                   <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
                       Sync Calendar
                   </button>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {upcomingBookings.length > 0 ? (
                        upcomingBookings.map(lead => (
                            <div key={lead.id} className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-indigo-50 text-indigo-600 p-3 rounded-xl">
                                            <Calendar size={20} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900">{lead.name}</p>
                                            <p className="text-xs text-slate-500">{lead.serviceType}</p>
                                        </div>
                                    </div>
                                    <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase">Confirmed</span>
                                </div>
                                
                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                        <Clock size={16} className="text-slate-400" />
                                        {new Date(lead.bookingDate!).toLocaleString([], {weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'})}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                        <Phone size={16} className="text-slate-400" />
                                        {lead.phone}
                                    </div>
                                </div>

                                <a 
                                    href={generateGoogleCalLink(lead)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block w-full text-center py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-colors"
                                >
                                    Add to Google Calendar
                                </a>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-3 text-center py-20 text-slate-400">
                             <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CalIcon size={32} className="opacity-50" />
                             </div>
                             <p>No upcoming appointments found.</p>
                        </div>
                    )}
                </div>
           </div>
        )}
      </main>

      {/* --- OFFER MODAL --- */}
      {showOfferModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative">
             <button onClick={() => setShowOfferModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 z-10">
                <X size={24} />
             </button>
             
             <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-center text-white relative overflow-hidden">
                <Sparkles className="absolute top-4 left-4 text-white/20 w-16 h-16" />
                <h2 className="text-3xl font-bold relative z-10">Stop Losing Leads</h2>
                <p className="text-indigo-100 mt-2 relative z-10">This dashboard could be yours in 2 minutes.</p>
             </div>
             
             <div className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                     <div className="bg-green-100 p-2 rounded-full text-green-600"><CheckCircle size={20} /></div>
                     <div>
                       <h4 className="font-bold text-slate-900">24/7 AI Receptionist</h4>
                       <p className="text-xs text-slate-500">Never miss a call, even when you sleep.</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-4">
                     <div className="bg-blue-100 p-2 rounded-full text-blue-600"><Calendar size={20} /></div>
                     <div>
                       <h4 className="font-bold text-slate-900">Auto-Booking Engine</h4>
                       <p className="text-xs text-slate-500">Wake up to new appointments on your calendar.</p>
                     </div>
                  </div>
                </div>
                
                <div className="bg-slate-50 p-4 rounded-xl text-center border border-slate-100">
                   <p className="text-sm text-slate-500 mb-1">Standard Plan</p>
                   <p className="text-4xl font-bold text-slate-900">$197<span className="text-base font-normal text-slate-500">/mo</span></p>
                   <p className="text-xs text-green-600 font-medium mt-2">7-Day Money Back Guarantee</p>
                </div>

                <button 
                  onClick={handleSubscribe}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 group"
                >
                  Start My Free Trial <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                </button>
                <p className="text-xs text-center text-slate-400">No contracts. Cancel anytime.</p>
             </div>
          </div>
        </div>
      )}

      {/* --- VOICE DEMO MODAL --- */}
      {showVoiceDemo && (
        <VoiceDemoModal client={client} onClose={() => setShowVoiceDemo(false)} />
      )}

    </div>
  );
};

const ActivityItem: React.FC<{ lead: Lead }> = ({ lead }) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="p-4 hover:bg-slate-50 transition-colors">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
                <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${lead.status === 'Booked' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                         {lead.status === 'Booked' ? <Calendar size={18} /> : <MessageSquare size={18} />}
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900">{lead.name} <span className="font-normal text-slate-500 text-sm">via SMS</span></h4>
                        <p className="text-xs text-slate-500">Status: <span className="font-medium text-slate-700">{lead.status}</span> • {lead.dateCaptured}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-xs text-slate-400 hidden sm:block">{lead.conversationHistory.length} messages</span>
                    {expanded ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                </div>
            </div>
            
            {expanded && (
                <div className="mt-4 ml-14 bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                    {lead.conversationHistory.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                            <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                                msg.role === 'user' 
                                ? 'bg-white border border-slate-200 text-slate-700' 
                                : 'bg-indigo-100 text-indigo-900'
                            }`}>
                                <p className="text-[10px] opacity-50 mb-1 font-bold uppercase">{msg.role === 'user' ? 'Lead' : 'AI Assistant'}</p>
                                {msg.content}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default ClientPortal;
