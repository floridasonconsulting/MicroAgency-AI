import React, { useState, useEffect } from 'react';
import { Save, CreditCard, Globe, Bell, Shield, CheckCircle } from 'lucide-react';

interface AgencySettings {
  agencyName: string;
  ownerName: string;
  supportEmail: string;
  currency: string;
  baseMonthlyPrice: number;
  setupFee: number;
  enableEmailNotifications: boolean;
}

const DEFAULT_SETTINGS: AgencySettings = {
  agencyName: 'MicroAgency AI',
  ownerName: '',
  supportEmail: '',
  currency: 'USD',
  baseMonthlyPrice: 197,
  setupFee: 997,
  enableEmailNotifications: true,
};

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'pricing'>('general');
  const [settings, setSettings] = useState<AgencySettings>(DEFAULT_SETTINGS);
  const [isSaved, setIsSaved] = useState(false);

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('agency_settings');
    if (saved) {
      try {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
      } catch (e) {
        console.error("Failed to load settings", e);
      }
    }
  }, []);

  const handleChange = (field: keyof AgencySettings, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    setIsSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem('agency_settings', JSON.stringify(settings));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">System Configuration</h2>
          <p className="text-sm text-slate-500">Manage your agency settings and pricing models.</p>
        </div>
        <button
          onClick={handleSave}
          className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm"
        >
          {isSaved ? <CheckCircle size={20} /> : <Save size={20} />}
          {isSaved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px] flex flex-col md:flex-row">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200 p-2">
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('general')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'general' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-600 hover:bg-slate-100'
                }`}
            >
              <Globe size={18} /> General & Profile
            </button>
            <button
              onClick={() => setActiveTab('pricing')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'pricing' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-600 hover:bg-slate-100'
                }`}
            >
              <CreditCard size={18} /> Pricing & Plans
            </button>
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-8">

          {/* --- GENERAL TAB --- */}
          {activeTab === 'general' && (
            <div className="space-y-6 max-w-lg">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4">Agency Profile</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Agency Name</label>
                    <input
                      type="text"
                      value={settings.agencyName}
                      onChange={(e) => handleChange('agencyName', e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Owner Name</label>
                      <input
                        type="text"
                        value={settings.ownerName}
                        onChange={(e) => handleChange('ownerName', e.target.value)}
                        placeholder="e.g. John Doe"
                        className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Support Email</label>
                      <input
                        type="email"
                        value={settings.supportEmail}
                        onChange={(e) => handleChange('supportEmail', e.target.value)}
                        placeholder="help@agency.com"
                        className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Notifications</h3>
                <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-md border border-slate-200 text-slate-500">
                      <Bell size={20} />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Email Alerts</p>
                      <p className="text-xs text-slate-500">Receive digests when leads are captured</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.enableEmailNotifications}
                      onChange={(e) => handleChange('enableEmailNotifications', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* --- PRICING TAB --- */}
          {activeTab === 'pricing' && (
            <div className="space-y-6 max-w-lg">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">Service Pricing</h3>
                <p className="text-sm text-slate-500 mb-6">Set your default offering prices. You can override these per client.</p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Currency</label>
                    <select
                      value={settings.currency}
                      onChange={(e) => handleChange('currency', e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="CAD">CAD ($)</option>
                      <option value="AUD">AUD ($)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Monthly Recurring</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-slate-400">$</span>
                        <input
                          type="number"
                          value={settings.baseMonthlyPrice}
                          onChange={(e) => handleChange('baseMonthlyPrice', Number(e.target.value))}
                          className="w-full border border-slate-300 rounded-lg pl-8 pr-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">One-time Setup Fee</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-slate-400">$</span>
                        <input
                          type="number"
                          value={settings.setupFee}
                          onChange={(e) => handleChange('setupFee', Number(e.target.value))}
                          className="w-full border border-slate-300 rounded-lg pl-8 pr-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex gap-3">
                <Shield className="text-indigo-600 shrink-0 mt-0.5" size={20} />
                <div>
                  <h4 className="text-sm font-bold text-indigo-900">Profit Projection</h4>
                  <p className="text-xs text-indigo-700 mt-1">
                    At <strong>{settings.currency} {settings.baseMonthlyPrice}/mo</strong>, you only need <strong>26 clients</strong> to reach $5,000 MRR.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;