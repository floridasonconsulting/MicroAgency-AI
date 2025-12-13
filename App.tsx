
import React, { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ClientList from './components/ClientList';
import ClientDetail from './components/ClientDetail';
import LeadFinder from './components/LeadFinder';
import Settings from './components/Settings';
import ClientPortal from './components/ClientPortal';
import { MOCK_CLIENTS } from './constants';
import { Client, ViewState, Prospect } from './types';

function App() {
  const [activeView, setActiveView] = useState<ViewState>('dashboard');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  
  // Lifted state for clients to support editing/archiving
  const [clients, setClients] = useState<Client[]>(MOCK_CLIENTS);

  // --- LEAD FINDER STATE PERSISTENCE ---
  const [prospectNiche, setProspectNiche] = useState('');
  const [prospectLocation, setProspectLocation] = useState('');
  const [searchResults, setSearchResults] = useState<Prospect[]>([]);
  const [savedProspects, setSavedProspects] = useState<Prospect[]>([]);

  // Navigation handlers
  const handleNavigate = (view: ViewState) => {
    setActiveView(view);
    if (view !== 'clients' && view !== 'client-portal') {
      setSelectedClient(null); // Reset selection if leaving client view context
    }
  };

  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    setActiveView('clients'); // Ensure we are in the clients view context
  };

  const handleBackToDirectory = () => {
    setSelectedClient(null);
  };

  const handleUpdateClient = (updatedClient: Client) => {
    setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
    // If we are currently viewing this client, update the selectedClient state as well
    if (selectedClient && selectedClient.id === updatedClient.id) {
      setSelectedClient(updatedClient);
    }
  };

  const handleViewPortal = (client: Client) => {
    setSelectedClient(client);
    setActiveView('client-portal');
  };

  const handleClosePortal = () => {
    setActiveView('clients');
  };

  // View Router
  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard clients={clients} />;
      
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
          />
        );

      case 'settings':
        return <Settings />;
        
      case 'client-portal':
        if (selectedClient) {
            return <ClientPortal client={selectedClient} onClose={handleClosePortal} />;
        }
        return <Dashboard clients={clients} />; // Fallback
      
      default:
        return <Dashboard clients={clients} />;
    }
  };

  // Special case: If viewing portal, we render it full screen without the dashboard layout
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
