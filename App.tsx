import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ClientList from './components/ClientList';
import ClientDetail from './components/ClientDetail';
import LeadFinder from './components/LeadFinder';
import Settings from './components/Settings';
import SubscriberPortal from './components/SubscriberPortal';
import ClientSignup from './components/ClientSignup';
import PricingPage from './components/PricingPage';
import DemoMode from './components/DemoMode';
import DemoPortal from './components/DemoPortal';
import MetricsDashboard from './components/MetricsDashboard';
import LoginPage from './components/LoginPage';
import { useClients, useProspects } from './hooks/useData';
import { Client, ViewState, Prospect } from './types';
import { OwnerNotification } from './services/communicationHub';
import { AuthUser, getCurrentUser, onAuthStateChange } from './services/authService';

function App() {
  const [activeView, setActiveView] = useState<ViewState>('dashboard');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [showDemo, setShowDemo] = useState(false);
  const [showDemoPortal, setShowDemoPortal] = useState(false);
  const [demoNiche, setDemoNiche] = useState('hvac');

  // Auth state
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);


  // Check auth on mount
  useEffect(() => {
    getCurrentUser().then(user => {
      setAuthUser(user);
      setAuthLoading(false);
    });

    // Listen for auth changes
    const { unsubscribe } = onAuthStateChange((user) => {
      setAuthUser(user);
    });

    return () => unsubscribe();
  }, []);

  // Check URL for demo portal route (e.g., #demo/hvac) or login route (#login)
  useEffect(() => {
    const hash = window.location.hash;

    // Handle demo portal route
    if (hash.startsWith('#demo/')) {
      const niche = hash.replace('#demo/', '');
      if (niche) {
        setDemoNiche(niche);
        setShowDemoPortal(true);
      }
    }

    // Handle login route
    if (hash === '#login' || hash === '#/login') {
      setActiveView('login');
    }

    // Handle portal direct route (admin walkthrough)
    if (hash.startsWith('#portal/')) {
      const clientId = hash.replace('#portal/', '');
      if (clientId) {
        setSelectedClientId(clientId);
        setActiveView('subscriber-portal');
      }
    }

    // Listen for hash changes
    const handleHashChange = () => {
      const newHash = window.location.hash;

      // Demo portal routes
      if (newHash.startsWith('#demo/')) {
        const niche = newHash.replace('#demo/', '');
        if (niche) {
          setDemoNiche(niche);
          setShowDemoPortal(true);
        }
      } else if (newHash === '' && showDemoPortal) {
        setShowDemoPortal(false);
      }

      // Login route
      if (newHash === '#login' || newHash === '#/login') {
        setActiveView('login');
      }

      // Portal direct route
      if (newHash.startsWith('#portal/')) {
        const clientId = newHash.replace('#portal/', '');
        if (clientId) {
          setSelectedClientId(clientId);
          setActiveView('subscriber-portal');
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [showDemoPortal]);

  // Notification state
  const [notifications, setNotifications] = useState<OwnerNotification[]>([
    // Sample notifications for demo
    {
      id: 'notif-1',
      clientId: 'demo-client',
      type: 'new_lead',
      title: 'New Lead Captured',
      message: 'John Smith called about emergency plumbing - water heater leak',
      read: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 min ago
    },
    {
      id: 'notif-2',
      clientId: 'demo-client',
      type: 'reply',
      title: 'SMS Reply Received',
      message: 'Customer replied: "Yes, tomorrow at 2pm works great!"',
      read: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
    },
    {
      id: 'notif-3',
      clientId: 'demo-client',
      type: 'booking',
      title: 'Appointment Booked',
      message: 'Sarah Johnson booked for Dec 28 at 10:00 AM',
      read: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    },
  ]);

  // Notification handlers
  const handleMarkNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // Use database-backed hooks with automatic mock data fallback
  const {
    clients,
    loading: clientsLoading,
    usingMockData,
    addClient,
    updateClient: updateClientInDB,
    removeClient,
    addLeadToClient,
    bookAppointmentForLead,
    convertToClient,
  } = useClients();

  // Get selected client from the clients array
  const selectedClient = selectedClientId
    ? clients.find(c => c.id === selectedClientId) || null
    : null;

  // Handle /portal path redirect after magic link authentication
  useEffect(() => {
    if (authUser && clients.length > 0 && window.location.pathname === '/portal') {
      // Find the client for this user based on email
      const matchingClient = clients.find(c => c.email === authUser.email);
      if (matchingClient) {
        setSelectedClientId(matchingClient.id);
        setActiveView('subscriber-portal');
      }
      // Clear the /portal path to avoid URL confusion
      window.history.replaceState({}, '', '/');
    }
  }, [authUser, clients]);

  // Prospect management with database persistence
  const {
    prospects: savedProspects,
    saveProspect,
    removeProspect,
    setProspects: setSavedProspects,
  } = useProspects();

  // Lead Finder search state (ephemeral, not persisted)
  const [prospectNiche, setProspectNiche] = useState('');
  const [prospectLocation, setProspectLocation] = useState('');
  const [searchResults, setSearchResults] = useState<Prospect[]>([]);

  // Navigation handlers
  const handleNavigate = (view: ViewState) => {
    setActiveView(view);
    if (view !== 'clients' && view !== 'subscriber-portal') {
      setSelectedClientId(null);
    }
  };

  const handleSelectClient = (client: Client) => {
    setSelectedClientId(client.id);
    setActiveView('clients');
  };

  const handleBackToDirectory = () => {
    setSelectedClientId(null);
  };

  const handleUpdateClient = (updatedClient: Client) => {
    updateClientInDB(updatedClient.id, updatedClient);
  };

  // handleViewPortal removed - subscribers use SubscriberPortal via login

  const handleClosePortal = () => {
    setActiveView('clients');
  };

  // Handle saving prospects from search results to database
  const handleSaveProspect = async (prospect: Prospect): Promise<Prospect> => {
    const saved = await saveProspect(prospect);
    return saved || prospect; // Return original if save failed
  };

  // View Router
  const renderContent = () => {
    // Show loading state while fetching clients
    if (clientsLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600">Loading data...</p>
          </div>
        </div>
      );
    }

    switch (activeView) {
      case 'dashboard':
        return <Dashboard clients={clients} usingMockData={usingMockData} onViewDemo={() => setShowDemo(true)} />;

      case 'clients':
        if (selectedClient) {
          return (
            <ClientDetail
              client={selectedClient}
              onBack={handleBackToDirectory}
              onUpdateClient={handleUpdateClient}
              onAddLead={(lead) => addLeadToClient(selectedClient.id, lead)}
              onBookAppointment={(leadId, date) => bookAppointmentForLead(selectedClient.id, leadId, date)}
            />
          );
        }
        return <ClientList clients={clients} onSelectClient={handleSelectClient} />;

      case 'prospector':
        return (
          <LeadFinder
            niche={prospectNiche}
            setNiche={setProspectNiche}
            location={prospectLocation}
            setLocation={setProspectLocation}
            results={searchResults}
            setResults={setSearchResults}
            savedProspects={savedProspects}
            setSavedProspects={setSavedProspects}
            onSaveProspect={handleSaveProspect}
            onRemoveProspect={removeProspect}
            onConvertToClient={convertToClient}
            usingMockData={usingMockData}
          />
        );

      case 'settings':
        return <Settings />;

      case 'analytics':
        return <MetricsDashboard clients={clients} />;

      case 'signup':
        return (
          <ClientSignup
            onComplete={(newClient) => {
              // Refresh clients and go to dashboard
              setActiveView('dashboard');
            }}
            onClose={() => setActiveView('dashboard')}
          />
        );

      case 'pricing':
        return (
          <PricingPage
            onSelectTier={(tier) => {
              console.log('Selected tier:', tier);
              setActiveView('signup');
            }}
            onClose={() => setActiveView('dashboard')}
          />
        );

      default:
        return <Dashboard clients={clients} usingMockData={usingMockData} />;
    }
  };

  // Full-screen demo portal (prospect demo)
  if (showDemoPortal) {
    return (
      <DemoPortal
        niche={demoNiche}
        onExit={() => {
          setShowDemoPortal(false);
          window.location.hash = '';
        }}
      />
    );
  }

  // Full-screen demo mode (old simulator)
  if (showDemo) {
    return <DemoMode niche={demoNiche} onExit={() => setShowDemo(false)} />;
  }

  // Login page (full screen)
  if (activeView === 'login') {
    return (
      <LoginPage
        onLoginSuccess={(clientId) => {
          setSelectedClientId(clientId);
          setActiveView('subscriber-portal');
        }}
        onNavigateToDemo={() => setShowDemo(true)}
      />
    );
  }

  // Subscriber Portal (full screen, auth-protected or admin walkthrough)
  if (activeView === 'subscriber-portal' && selectedClient) {
    return (
      <SubscriberPortal
        user={authUser}
        client={selectedClient}
        onLogout={() => {
          setAuthUser(null);
          setSelectedClientId(null);
          setActiveView('dashboard');
        }}
        onUpdateClient={handleUpdateClient}
      />
    );
  }

  return (
    <Layout
      activeView={activeView}
      onNavigate={handleNavigate}
      notifications={notifications}
      onMarkNotificationRead={handleMarkNotificationRead}
      onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
    >
      {renderContent()}
    </Layout>
  );
}

export default App;
