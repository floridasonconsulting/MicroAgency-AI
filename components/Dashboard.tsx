
import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { Client } from '../types';
import { TrendingUp, DollarSign, Users, MessageSquare, Phone, Check, X, Smartphone, ArrowRight, Play } from 'lucide-react';
import AdminApprovalQueue from './AdminApprovalQueue';

interface DashboardProps {
  clients: Client[];
  usingMockData?: boolean;
  onViewDemo?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ clients, usingMockData = false, onViewDemo }) => {
  // Modal State
  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);
  const [provisionStep, setProvisionStep] = useState(1);
  const [selectedClientForProvision, setSelectedClientForProvision] = useState('');
  const [generatedNumber, setGeneratedNumber] = useState('');

  // Compute metrics
  const totalMRR = clients.reduce((acc, c) => acc + (c.status === 'Active' ? c.mrr : 0), 0);
  const activeSubscribers = clients.filter(c => c.status === 'Active').length;
  const totalLeads = clients.reduce((acc, c) => acc + c.leads.length, 0);
  const onboardingClients = clients.filter(c => c.status === 'Onboarding').length;

  // Chart Data Preparation - Mocking MRR Growth
  const mrrData = [
    { month: 'Jun', value: 0 },
    { month: 'Jul', value: 197 },
    { month: 'Aug', value: 394 },
    { month: 'Sep', value: 591 },
    { month: 'Oct', value: totalMRR },
  ];

  const nicheData = [
    { name: 'Roofing', value: 1, leads: 45 },
    { name: 'Pools', value: 1, leads: 32 },
    { name: 'HVAC', value: 1, leads: 12 },
    { name: 'Landscaping', value: 1, leads: 28 },
  ];

  const StatCard = ({ title, value, subtext, icon: Icon, color }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-slate-900">{value}</h3>
        {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
    </div>
  );

  const handleGenerateNumber = () => {
    // Fake number generation delay
    setTimeout(() => {
      setGeneratedNumber(`+1 (555) ${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}`);
      setProvisionStep(3);
    }, 1000);
    setProvisionStep(2);
  };

  const resetModal = () => {
    setIsProvisionModalOpen(false);
    setProvisionStep(1);
    setSelectedClientForProvision('');
    setGeneratedNumber('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Agency Command Center</h2>
          <p className="text-sm text-slate-500">Your $197/mo empire overview</p>
        </div>
        <div className="flex gap-2">
          {onViewDemo && (
            <button
              onClick={onViewDemo}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-indigo-700 hover:to-purple-700 transition-colors flex items-center gap-2"
            >
              <Play size={16} /> Try Demo
            </button>
          )}
          <button
            onClick={() => setIsProvisionModalOpen(true)}
            className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors flex items-center gap-2"
          >
            <Phone size={16} /> + Provision New Number
          </button>
        </div>
      </div>

      {/* Mock Data Warning Banner */}
      {usingMockData && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-amber-600 text-lg">⚠️</span>
          </div>
          <div>
            <h4 className="font-medium text-amber-900">Demo Mode - Data Not Persisted</h4>
            <p className="text-sm text-amber-700 mt-1">
              Supabase is not configured. Go to <strong>Settings</strong> to connect your database and enable persistent storage.
            </p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Monthly Recurring Rev"
          value={`$${totalMRR.toLocaleString()}`}
          subtext="Goal: $5,000/mo"
          icon={DollarSign}
          color="bg-emerald-500"
        />
        <StatCard
          title="Active Subscribers"
          value={activeSubscribers}
          subtext={`${onboardingClients} currently onboarding`}
          icon={Users}
          color="bg-blue-500"
        />
        <StatCard
          title="Total Leads Captured"
          value={totalLeads}
          subtext="Across all clients"
          icon={MessageSquare}
          color="bg-purple-500"
        />
        <StatCard
          title="System Uptime"
          value="100%"
          subtext="24/7 Autopilot Active"
          icon={TrendingUp}
          color="bg-amber-500"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* MRR Growth Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-80">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Revenue Growth (MRR)</h3>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mrrData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <Tooltip />
              <Area type="monotone" dataKey="value" stroke="#10b981" fillOpacity={1} fill="url(#colorMrr)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Niche Performance */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-80">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Leads by Niche</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={nicheData} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
              <Tooltip
                cursor={{ fill: 'transparent' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="leads" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Admin Approval Queue */}
      <AdminApprovalQueue />

      {/* PROVISIONING MODAL */}
      {isProvisionModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900">Provision AI Number</h3>
              <button onClick={resetModal} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>

            <div className="p-6">
              {/* STEP 1: Select Client */}
              {provisionStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Assign to Client</label>
                    <select
                      className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500"
                      value={selectedClientForProvision}
                      onChange={(e) => setSelectedClientForProvision(e.target.value)}
                    >
                      <option value="">Select a client...</option>
                      {clients.filter(c => !c.aiPhoneNumber).map(c => (
                        <option key={c.id} value={c.id}>{c.businessName} ({c.niche})</option>
                      ))}
                    </select>
                    <p className="text-xs text-slate-500 mt-2">Only showing clients without active AI numbers.</p>
                  </div>
                  <button
                    onClick={handleGenerateNumber}
                    disabled={!selectedClientForProvision}
                    className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-slate-800 disabled:opacity-50 transition-colors"
                  >
                    Search & Provision Number
                  </button>
                </div>
              )}

              {/* STEP 2: Loading */}
              {provisionStep === 2 && (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                  <p className="text-slate-600 font-medium">Communicating with Twilio API...</p>
                  <p className="text-xs text-slate-400">Acquiring local area code capability</p>
                </div>
              )}

              {/* STEP 3: Success & Instructions */}
              {provisionStep === 3 && (
                <div className="space-y-4 text-center">
                  <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Check size={24} />
                  </div>
                  <h4 className="text-xl font-bold text-slate-900">Number Secured!</h4>
                  <p className="text-sm text-slate-500">You have successfully provisioned a dedicated AI line.</p>

                  <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 my-4">
                    <p className="text-xs uppercase font-bold text-slate-500 mb-1">Assigned Virtual Number</p>
                    <p className="text-2xl font-mono font-bold text-slate-800">{generatedNumber}</p>
                  </div>

                  <div className="text-left bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <div className="flex items-start gap-3">
                      <Smartphone className="text-blue-600 shrink-0 mt-1" size={20} />
                      <div>
                        <h5 className="font-bold text-blue-900 text-sm">Action Required: Call Forwarding</h5>
                        <p className="text-xs text-blue-800 mt-1 leading-relaxed">
                          To let the AI answer missed calls, the client must enable <strong>Conditional Call Forwarding</strong> on their main business line.
                        </p>
                        <div className="mt-3 bg-white/60 p-2 rounded text-xs font-mono text-blue-900">
                          Dial <span className="font-bold">*71 {generatedNumber}</span> (Verizon)
                          <br />
                          Dial <span className="font-bold">*67 {generatedNumber}</span> (T-Mobile/AT&T)
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={resetModal}
                    className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors mt-2"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
