import React, { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ClientList from './components/ClientList';
import ClientDetail from './components/ClientDetail';
import LeadFinder from './components/LeadFinder';
import Settings from './components/Settings';
import ClientPortal from './components/ClientPortal';
import ClientSignup from './components/ClientSignup';
import PricingPage from './components/PricingPage';
import { useClients, useProspects } from './hooks/useData';
import { Client, ViewState, Prospect } from './types';

function App() {
  const [activeView, setActiveView] = useState<ViewState>('dashboard');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  // Use database-backed hooks with automatic mock data fallback
  const {
    clients,
    loading: clientsLoading,
    usingMockData,
    updateClient: updateClientInDB,
    removeClient,
  } = useClients();

  // Get selected client from the clients array
  const selectedClient = selectedClientId
    ? clients.find(c => c.id === selectedClientId) || null
    : null;

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
    if (view !== 'clients' && view !== 'client-portal') {
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

  const handleViewPortal = (client: Client) => {
    setSelectedClientId(client.id);
    setActiveView('client-portal');
  };

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
        return <Dashboard clients={clients} usingMockData={usingMockData} />;

      case 'clients':
        if (selectedClient) {
          return (
            <ClientDetail
              client={selectedClient}
              onBack={handleBackToDirectory}
              onUpdateClient={handleUpdateClient}
              onViewPortal={handleViewPortal}
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
          />
        );

      case 'settings':
        return <Settings />;

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

      case 'client-portal':
        if (selectedClient) {
          return <ClientPortal client={selectedClient} onClose={handleClosePortal} />;
        }
        return <Dashboard clients={clients} usingMockData={usingMockData} />;

      default:
        return <Dashboard clients={clients} usingMockData={usingMockData} />;
    }
  };

  // Full-screen portal view without dashboard layout
  if (activeView === 'client-portal' && selectedClient) {
    return <ClientPortal client={selectedClient} onClose={handleClosePortal} />;
  }

  return (
    <Layout activeView={activeView} onNavigate={handleNavigate}>
      {renderContent()}
    </Layout>
  );
}

export default App;
