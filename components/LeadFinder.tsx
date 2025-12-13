import React, { useState, useEffect } from 'react';
import { Search, MapPin, Globe, Star, AlertCircle, Send, Loader2, Copy, Bookmark, CheckCircle, Trash2, Info, RefreshCw, Mail, Smartphone, Zap, Clock, MousePointerClick, MessageCircle } from 'lucide-react';
import { Prospect, CampaignStatus } from '../types';
import { findProspects, generateOutreachScript } from '../services/geminiService';
import { saveProspectToDB, fetchSavedProspects, deleteProspectFromDB, triggerMakeWebhook } from '../services/supabase';

interface ProspectCardProps {
  prospect: Prospect;
  isSavedView?: boolean;
  isSaved: boolean;
  isSelected: boolean;
  onToggleSave: (p: Prospect) => void;
  onGeneratePitch: (p: Prospect) => void;
  onLaunchCampaign: (p: Prospect) => void;
}

const ProspectCard: React.FC<ProspectCardProps> = ({ 
  prospect, 
  isSavedView, 
  isSaved, 
  isSelected, 
  onToggleSave, 
  onGeneratePitch,
  onLaunchCampaign
}) => {
  
  const isCampaignActive = prospect.campaignStatus && prospect.campaignStatus !== 'Idle';

  // --- CAMPAIGN VIEW RENDERER ---
  if (isCampaignActive) {
    return (
        <div className={`w-full border rounded-lg p-4 transition-all bg-white shadow-sm mb-3 ${
            prospect.campaignStatus === 'Converted' ? 'border-green-500 ring-1 ring-green-500 bg-green-50/20' : 'border-indigo-200 bg-indigo-50/10'
        }`}>
            <div className="flex justify-between items-start mb-3">
                <h4 className="font-bold text-slate-900 line-clamp-1">{prospect.businessName}</h4>
                <div className={`text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1
                    ${prospect.campaignStatus === 'Active' ? 'bg-indigo-100 text-indigo-700' : ''}
                    ${prospect.campaignStatus === 'Waiting_Reply' ? 'bg-amber-100 text-amber-700' : ''}
                    ${prospect.campaignStatus === 'Converted' ? 'bg-green-100 text-green-700' : ''}
                    ${prospect.campaignStatus === 'Cold' ? 'bg-slate-100 text-slate-500' : ''}
                `}>
                    {prospect.campaignStatus === 'Active' && <Loader2 size={12} className="animate-spin" />}
                    {prospect.campaignStatus === 'Waiting_Reply' && <Clock size={12} />}
                    {prospect.campaignStatus === 'Converted' && <CheckCircle size={12} />}
                    {prospect.campaignStatus?.replace('_', ' ')}
                </div>
            </div>

            {/* Automation Timeline */}
            <div className="space-y-3 mb-4">
                <div className="text-xs text-slate-500 font-mono bg-white p-2 rounded border border-slate-200 h-24 overflow-y-auto custom-scrollbar">
                    {prospect.campaignLogs?.map((log, i) => (
                        <div key={i} className="mb-1 flex items-center gap-2">
                            <span className="text-slate-300">•</span>
                            {log}
                        </div>
                    ))}
                    {prospect.campaignStatus === 'Active' && (
                        <div className="flex items-center gap-2 text-indigo-500 animate-pulse">
                            <span className="text-slate-300">•</span>
                            Processing next step...
                        </div>
                    )}
                </div>
            </div>

            {/* Current Step Visualizer */}
            <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-200 pt-3">
                 <div className={`flex flex-col items-center ${prospect.campaignStep?.includes('Email') ? 'text-indigo-600 font-bold' : ''}`}>
                    <Mail size={16} className="mb-1" />
                    <span>Email</span>
                 </div>
                 <div className="h-[1px] w-8 bg-slate-200"></div>
                 <div className={`flex flex-col items-center ${prospect.campaignStep?.includes('SMS') ? 'text-indigo-600 font-bold' : ''}`}>
                    <Smartphone size={16} className="mb-1" />
                    <span>SMS</span>
                 </div>
                 <div className="h-[1px] w-8 bg-slate-200"></div>
                 <div className={`flex flex-col items-center ${prospect.campaignStatus === 'Converted' ? 'text-green-600 font-bold' : ''}`}>
                    <Zap size={16} className="mb-1" />
                    <span>Close</span>
                 </div>
            </div>
        </div>
    );
  }

  // --- STANDARD CARD RENDERER ---
  return (
    <div className={`w-full border rounded-lg p-4 transition-all bg-white shadow-sm mb-3 ${
        isSelected ? 'border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50/10' : 'border-slate-200 hover:border-indigo-300'
    }`}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="font-bold text-slate-900 text-lg line-clamp-1">{prospect.businessName}</h4>
          {prospect.mapUrl ? (
             <a href={prospect.mapUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-500 hover:underline flex items-center gap-1 mt-1">
                <MapPin size={12} /> {prospect.address}
            </a>
          ) : (
            <span className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                <MapPin size={12} /> {prospect.address}
            </span>
          )}
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0 ml-2">
          <div className="flex items-center bg-yellow-50 px-2 py-1 rounded border border-yellow-100">
            <Star size={14} className="text-yellow-500 fill-yellow-500 mr-1" />
            <span className="text-xs font-bold text-slate-700">{prospect.rating}</span>
            <span className="text-xs text-slate-400 ml-1">({prospect.reviewCount})</span>
          </div>
          <button 
              onClick={(e) => { e.stopPropagation(); onToggleSave(prospect); }}
              className={`p-1.5 rounded-md transition-colors ${
                  isSaved 
                  ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200' 
                  : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600'
              }`}
              title={isSaved ? "Remove from Saved" : "Save Prospect"}
          >
              {isSavedView ? <Trash2 size={16} /> : (isSaved ? <CheckCircle size={16} /> : <Bookmark size={16} />)}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {!prospect.hasWebsite && (
          <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1">
            <Globe size={12} /> No Website
          </span>
        )}
        {prospect.painPoints.map((point, i) => (
          <span key={i} className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1">
            <AlertCircle size={12} /> {point}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button 
            onClick={() => onGeneratePitch(prospect)}
            className="py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-50 transition-colors flex items-center justify-center gap-1"
        >
            <Send size={14} /> Manual Pitch
        </button>
        <button 
            onClick={() => onLaunchCampaign(prospect)}
            className="py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg text-xs font-bold hover:shadow-md transition-all flex items-center justify-center gap-1"
        >
            <Zap size={14} /> Auto-Pilot
        </button>
      </div>
    </div>
  );
};

interface LeadFinderProps {
  niche: string;
  setNiche: (val: string) => void;
  location: string;
  setLocation: (val: string) => void;
  results: Prospect[];
  setResults: React.Dispatch<React.SetStateAction<Prospect[]>>;
  savedProspects: Prospect[];
  setSavedProspects: React.Dispatch<React.SetStateAction<Prospect[]>>;
}

const LeadFinder: React.FC<LeadFinderProps> = ({
  niche, setNiche,
  location, setLocation,
  results, setResults,
  savedProspects, setSavedProspects
}) => {
  const [activeTab, setActiveTab] = useState<'search' | 'saved'>('search');
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [generatedPitch, setGeneratedPitch] = useState('');
  const [isPitchLoading, setIsPitchLoading] = useState(false);
  const [debugMsg, setDebugMsg] = useState('');

  // --- INITIAL DATA LOAD ---
  useEffect(() => {
    // Attempt to load from Supabase on mount
    const loadData = async () => {
        try {
            const data = await fetchSavedProspects();
            if (data.length > 0) {
                setSavedProspects(data);
                console.log("Loaded prospects from Supabase");
            }
        } catch (e) {
            console.warn("Could not load from DB", e);
        }
    };
    loadData();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!niche || !location) return;

    setIsLoading(true);
    setHasSearched(true);
    setResults([]); 
    setSelectedProspect(null);
    setGeneratedPitch('');
    setDebugMsg('Starting search...');
    
    try {
      const newResults = await findProspects(niche, location);
      setDebugMsg(`Found ${newResults.length} results.`);
      setResults(newResults);
    } catch (error) {
      console.error("Search failed", error);
      setDebugMsg('Search failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratePitch = async (prospect: Prospect) => {
    setSelectedProspect(prospect);
    setIsPitchLoading(true);
    const primaryPainPoint = prospect.painPoints[0] || "General";
    const targetNiche = niche || "Local Business"; 
    const script = await generateOutreachScript(targetNiche, "SMS/Email", primaryPainPoint);
    setGeneratedPitch(script);
    setIsPitchLoading(false);
  };

  const toggleSaveProspect = async (prospect: Prospect) => {
    const isSaved = savedProspects.some(p => p.id === prospect.id);
    if (isSaved) {
      // Remove
      setSavedProspects(savedProspects.filter(p => p.id !== prospect.id));
      await deleteProspectFromDB(prospect.id);
    } else {
      // Add
      const newSaved = [...savedProspects, prospect];
      setSavedProspects(newSaved);
      // Persist to DB
      try {
        await saveProspectToDB(prospect);
      } catch (e) {
        console.warn("Failed to save to Supabase. Check credentials in Settings.");
      }
    }
  };

  // --- TOUCHLESS SALE SIMULATOR & AUTOMATION ---
  const handleLaunchCampaign = async (prospect: Prospect) => {
    // 1. Move to Saved & Update State immediately
    const campaignLogs = ['Campaign Initialized'];
    const updatedProspect = { 
        ...prospect, 
        campaignStatus: 'Active' as CampaignStatus, 
        campaignLogs, 
        campaignStep: 'Initializing' 
    };

    // Update UI lists
    const updateList = (list: Prospect[]) => {
        const exists = list.some(p => p.id === prospect.id);
        if (exists) return list.map(p => p.id === prospect.id ? updatedProspect : p);
        return [...list, updatedProspect];
    };
    setSavedProspects(updateList(savedProspects));
    setResults(prev => prev.map(p => p.id === prospect.id ? updatedProspect : p));

    // 2. Persist to DB
    saveProspectToDB(updatedProspect).catch(console.warn);

    // 3. Trigger Real Automation (Make.com)
    const webhookSent = await triggerMakeWebhook(updatedProspect);
    
    if (webhookSent) {
        // If webhook worked, we just update logs to say "Handed off"
        setTimeout(() => {
            updateProspectStatus(prospect.id, 'Active', 'Handover', ['Data sent to Make.com', 'Automation sequence started externally.']);
        }, 1000);
    } else {
        // If NO webhook, run the simulation for visual effect
        runSimulation(prospect.id, prospect.businessName);
    }
  };

  const runSimulation = (id: string, name: string) => {
    // Step 1: Email
    setTimeout(() => {
        updateProspectStatus(id, 'Active', 'Email', ['AI generated personalized pitch', 'Finding verified email address...']);
    }, 1500);

    setTimeout(() => {
        updateProspectStatus(id, 'Waiting_Reply', 'Email', ['Email Sent: "Question about ' + name + '"', 'Magic Demo Link included', 'Waiting for open...']);
    }, 3500);

    // Step 2: SMS (Simulate 24h later)
    setTimeout(() => {
        updateProspectStatus(id, 'Active', 'SMS', ['No email reply detected (24h simulated)', 'Switching to SMS channel...', 'SMS Sent: "Hey, did you see my email?"']);
    }, 6500);

    // Step 3: Click/Convert
    setTimeout(() => {
        const success = Math.random() > 0.3; // 70% chance of success in demo
        if (success) {
             updateProspectStatus(id, 'Converted', 'Close', ['Lead clicked "demo.microagency.ai"', 'Lead viewing Client Portal', 'Subscription Captured! ($197/mo)']);
        } else {
             updateProspectStatus(id, 'Cold', 'Close', ['Lead did not respond to SMS', 'Campaign Paused']);
        }
    }, 9500);
  };

  const updateProspectStatus = (id: string, status: CampaignStatus, step: string, newLogs: string[]) => {
      const updateFn = (list: Prospect[]) => list.map(p => {
          if (p.id !== id) return p;
          const updated = {
              ...p,
              campaignStatus: status,
              campaignStep: step,
              campaignLogs: [...(p.campaignLogs || []), ...newLogs]
          };
          // Persist the update
          saveProspectToDB(updated).catch(() => {});
          return updated;
      });

      setResults(updateFn);
      setSavedProspects(updateFn);
  };

  // --- ACTIONS ---
  const handleSendEmail = () => {
    if (!selectedProspect) return;
    const subject = `Question about ${selectedProspect.businessName}`;
    const body = generatedPitch;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  const handleSendSMS = () => {
    if (!generatedPitch) return;
    window.open(`sms:?&body=${encodeURIComponent(generatedPitch)}`);
  };

  // Safe render list helper
  const renderList = () => {
    const list = activeTab === 'search' ? results : savedProspects;
    
    if (list.length === 0) return null;

    return list.map((p, i) => (
      <ProspectCard 
        key={p.id || `fallback-${i}`} 
        prospect={p}
        isSavedView={activeTab === 'saved'}
        isSaved={savedProspects.some(sp => sp.id === p.id)}
        isSelected={selectedProspect?.id === p.id}
        onToggleSave={toggleSaveProspect}
        onGeneratePitch={handleGeneratePitch}
        onLaunchCampaign={handleLaunchCampaign}
      />
    ));
  };

  return (
    // REMOVED fixed h-full to allow natural scrolling of the page
    <div className="flex flex-col space-y-4 pb-12">
      
      {/* Header & Controls */}
      <div>
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4">
            <div>
                <h2 className="text-2xl font-bold text-slate-900">Agency Prospector</h2>
                <p className="text-sm text-slate-500">Find businesses with missing websites or bad response times.</p>
            </div>
            
            <div className="flex bg-slate-100 p-1 rounded-lg self-start">
                <button 
                    onClick={() => setActiveTab('search')}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'search' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Find New
                </button>
                <button 
                    onClick={() => setActiveTab('saved')}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${activeTab === 'saved' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Saved List 
                    {savedProspects.length > 0 && <span className="bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full text-[10px]">{savedProspects.length}</span>}
                </button>
            </div>
        </div>

        {/* Search Bar */}
        {activeTab === 'search' && (
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Target Niche</label>
                    <input 
                    type="text" 
                    placeholder="e.g. Plumbers, Roofers"
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    value={niche}
                    onChange={(e) => setNiche(e.target.value)}
                    />
                </div>
                <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Location</label>
                    <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Zip Code or City, State"
                        className="w-full border border-slate-300 rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                    />
                    </div>
                </div>
                <div className="flex items-end">
                    <button 
                    type="submit"
                    disabled={isLoading || !niche || !location}
                    className="w-full md:w-auto bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                    {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
                    {isLoading ? 'Scanning Maps...' : 'Find Leads'}
                    </button>
                </div>
                </form>
            </div>
        )}
      </div>

      {/* Main Content - No nested scrolling constraints */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* Results Column - Flexible height, no fixed height */}
        <div className="flex-1 w-full bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
            <h3 className="font-bold text-slate-700 flex items-center gap-2">
                {activeTab === 'search' ? 'Discovered Prospects' : 'Saved Prospects'}
                {activeTab === 'search' && (
                    <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-xs">
                        {results.length} found
                    </span>
                )}
            </h3>
            {activeTab === 'saved' && (
                <button 
                    onClick={() => setSavedProspects([])}
                    className="text-xs text-red-400 hover:text-red-600 hover:underline"
                    disabled={savedProspects.length === 0}
                >
                    Clear List
                </button>
            )}
          </div>
          
          <div className="p-4 bg-slate-50/50 min-h-[200px]">
            {/* Loading State */}
            {activeTab === 'search' && isLoading && (
              <div className="text-center py-12 flex flex-col items-center">
                <Loader2 className="animate-spin text-indigo-500 mb-4" size={40} />
                <p className="text-slate-600 font-medium">AI is scanning Google Maps...</p>
                <p className="text-xs text-slate-400 mt-2">Analyzing websites and reviews for {niche}</p>
              </div>
            )}

            {/* Empty State: Initial */}
            {activeTab === 'search' && !isLoading && !hasSearched && results.length === 0 && (
              <div className="text-center py-16 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl m-4">
                <Search className="mx-auto mb-4 opacity-20" size={48} />
                <p className="font-medium">Ready to prospect</p>
                <p className="text-sm">Enter a niche and location to begin.</p>
              </div>
            )}

            {/* Empty State: No Results */}
            {activeTab === 'search' && !isLoading && hasSearched && results.length === 0 && (
               <div className="text-center py-12 bg-white border border-slate-200 rounded-xl shadow-sm m-4">
                  <Info className="mx-auto mb-3 text-amber-500" size={32} />
                  <p className="font-bold text-slate-800">No prospects found</p>
                  <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">
                    We couldn't find any businesses matching your criteria. Try a larger city or broader niche.
                  </p>
                  <div className="text-xs text-slate-400 mt-4 font-mono">
                    Debug: {debugMsg}
                  </div>
               </div>
            )}

            {/* Empty State: Saved */}
            {activeTab === 'saved' && savedProspects.length === 0 && (
              <div className="text-center py-16 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl m-4">
                <Bookmark className="mx-auto mb-4 opacity-20" size={48} />
                <p>No saved prospects yet.</p>
                <button onClick={() => setActiveTab('search')} className="text-indigo-500 text-sm font-medium hover:underline mt-2">
                    Go find some!
                </button>
              </div>
            )}

            {/* THE LIST */}
            <div className="space-y-3">
               {renderList()}
            </div>
          </div>
        </div>

        {/* Pitch Generator Sidebar - Sticky */}
        <div className="w-full lg:w-96 bg-slate-900 text-white rounded-xl shadow-lg flex flex-col p-6 shrink-0 lg:sticky lg:top-4 h-fit">
          <div className="mb-6 shrink-0">
            <h3 className="text-xl font-bold bg-gradient-to-r from-primary-400 to-indigo-400 bg-clip-text text-transparent">Pitch Architect</h3>
            <p className="text-slate-400 text-sm mt-1">
              {selectedProspect 
                ? `Drafting for ${selectedProspect.businessName}...` 
                : "Select a prospect to generate a custom outreach message."}
            </p>
          </div>

          <div className="flex-1 bg-slate-800 rounded-lg p-4 relative border border-slate-700 min-h-[300px]">
            {isPitchLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="animate-spin text-indigo-400" size={32} />
              </div>
            ) : generatedPitch ? (
              <>
                <textarea 
                  className="w-full h-full bg-transparent text-slate-200 text-sm font-mono resize-none focus:outline-none min-h-[200px]"
                  value={generatedPitch}
                  readOnly
                />
                <button 
                   onClick={() => navigator.clipboard.writeText(generatedPitch)}
                   className="absolute bottom-4 right-4 bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-full shadow-lg transition-colors"
                   title="Copy to Clipboard"
                >
                  <Copy size={18} />
                </button>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 text-sm text-center px-4 space-y-4 py-12">
                <RefreshCw size={32} className="opacity-20" />
                <p>AI will analyze the prospect's weaknesses (no website, bad reviews) and write a perfect hook.</p>
              </div>
            )}
          </div>
          
          {/* ACTIONS */}
          {generatedPitch && !isPitchLoading && (
            <div className="mt-4 grid grid-cols-2 gap-3 shrink-0">
                <button 
                  onClick={handleSendSMS}
                  className="bg-slate-800 hover:bg-slate-700 text-white py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-slate-700"
                >
                   <Smartphone size={14} /> Send SMS
                </button>
                <button 
                  onClick={handleSendEmail}
                  className="bg-slate-800 hover:bg-slate-700 text-white py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-slate-700"
                >
                   <Mail size={14} /> Send Email
                </button>
            </div>
          )}

          <div className="mt-4 text-xs text-slate-500 text-center shrink-0">
            Tip: Sending a video of yourself auditing their missing website converts 3x higher.
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadFinder;