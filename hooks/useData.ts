import { useState, useEffect, useCallback } from 'react';
import { Client, Lead, Prospect } from '../types';
import {
    fetchClients,
    fetchClientById,
    createClientRecord as createClientDB,
    updateClient as updateClientDB,
    deleteClient as deleteClientDB,
    fetchLeadsByClientId,
    createLead as createLeadDB,
    updateLead as updateLeadDB,
    deleteLead as deleteLeadDB,
    fetchProspects,
    saveProspectToDB,
    deleteProspectFromDB,
    isSupabaseConfigured,
    NumberRequest,
    fetchPendingNumberRequests,
    createNumberRequest,
    processNumberRequest
} from '../services/supabase';
import { MOCK_CLIENTS } from '../constants';

// ============================================
// CLIENT HOOKS
// ============================================

/**
 * Hook to manage clients with automatic database sync
 * Falls back to mock data if Supabase is not configured
 */
export function useClients() {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [usingMockData, setUsingMockData] = useState(false);

    const loadClients = useCallback(async () => {
        setLoading(true);
        setError(null);

        if (!isSupabaseConfigured()) {
            console.log('Supabase not configured, using mock data');
            setClients(MOCK_CLIENTS);
            setUsingMockData(true);
            setLoading(false);
            return;
        }

        try {
            const dbClients = await fetchClients();

            // Load leads for each client
            const clientsWithLeads = await Promise.all(
                dbClients.map(async (client) => {
                    const leads = await fetchLeadsByClientId(client.id);
                    return { ...client, leads };
                })
            );

            setClients(clientsWithLeads);
            setUsingMockData(false);
        } catch (err) {
            console.error('Error loading clients:', err);
            setError('Failed to load clients from database');
            setClients(MOCK_CLIENTS);
            setUsingMockData(true);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadClients();
    }, [loadClients]);

    const addClient = useCallback(async (client: Omit<Client, 'id' | 'leads'>) => {
        if (usingMockData) {
            const newClient: Client = {
                ...client,
                id: `mock-${Date.now()}`,
                leads: [],
            };
            setClients(prev => [newClient, ...prev]);
            return newClient;
        }

        const newClient = await createClientDB(client);
        if (newClient) {
            setClients(prev => [{ ...newClient, leads: [] }, ...prev]);
        }
        return newClient;
    }, [usingMockData]);

    const updateClientState = useCallback(async (id: string, updates: Partial<Client>) => {
        // Always update local state immediately for responsiveness
        setClients(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));

        if (!usingMockData) {
            const result = await updateClientDB(id, updates);
            if (!result) {
                // Revert on failure
                setError('Failed to update client');
            }
        }
    }, [usingMockData]);

    const removeClient = useCallback(async (id: string) => {
        if (!usingMockData) {
            const success = await deleteClientDB(id);
            if (!success) {
                setError('Failed to delete client');
                return false;
            }
        }
        setClients(prev => prev.filter(c => c.id !== id));
        return true;
    }, [usingMockData]);

    return {
        clients,
        loading,
        error,
        usingMockData,
        reload: loadClients,
        addClient,
        updateClient: updateClientState,
        removeClient,
    };
}

/**
 * Hook to manage a single client with their leads
 */
export function useClient(clientId: string | null) {
    const [client, setClient] = useState<Client | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadClient = useCallback(async () => {
        if (!clientId) {
            setClient(null);
            return;
        }

        setLoading(true);
        setError(null);

        if (!isSupabaseConfigured()) {
            const mockClient = MOCK_CLIENTS.find(c => c.id === clientId);
            setClient(mockClient || null);
            setLoading(false);
            return;
        }

        try {
            const dbClient = await fetchClientById(clientId);
            if (dbClient) {
                const leads = await fetchLeadsByClientId(clientId);
                setClient({ ...dbClient, leads });
            } else {
                setClient(null);
            }
        } catch (err) {
            console.error('Error loading client:', err);
            setError('Failed to load client');
        } finally {
            setLoading(false);
        }
    }, [clientId]);

    useEffect(() => {
        loadClient();
    }, [loadClient]);

    const updateLead = useCallback(async (leadId: string, updates: Partial<Lead>) => {
        if (!client) return;

        // Update local state immediately
        setClient(prev => {
            if (!prev) return null;
            return {
                ...prev,
                leads: prev.leads.map(l => l.id === leadId ? { ...l, ...updates } : l),
            };
        });

        if (isSupabaseConfigured()) {
            await updateLeadDB(leadId, updates);
        }
    }, [client]);

    const addLead = useCallback(async (lead: Omit<Lead, 'id'>) => {
        if (!client) return null;

        if (!isSupabaseConfigured()) {
            const newLead: Lead = { ...lead, id: `mock-lead-${Date.now()}` };
            setClient(prev => {
                if (!prev) return null;
                return { ...prev, leads: [newLead, ...prev.leads] };
            });
            return newLead;
        }

        const newLead = await createLeadDB(client.id, lead);
        if (newLead) {
            setClient(prev => {
                if (!prev) return null;
                return { ...prev, leads: [newLead, ...prev.leads] };
            });
        }
        return newLead;
    }, [client]);

    const removeLead = useCallback(async (leadId: string) => {
        if (!client) return false;

        if (isSupabaseConfigured()) {
            const success = await deleteLeadDB(leadId);
            if (!success) return false;
        }

        setClient(prev => {
            if (!prev) return null;
            return { ...prev, leads: prev.leads.filter(l => l.id !== leadId) };
        });
        return true;
    }, [client]);

    return {
        client,
        loading,
        error,
        reload: loadClient,
        setClient,
        updateLead,
        addLead,
        removeLead,
    };
}

// ============================================
// PROSPECT HOOKS
// ============================================

/**
 * Hook to manage prospects with database sync
 */
export function useProspects() {
    const [prospects, setProspects] = useState<Prospect[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadProspects = useCallback(async () => {
        if (!isSupabaseConfigured()) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const dbProspects = await fetchProspects();
            setProspects(dbProspects);
        } catch (err) {
            console.error('Error loading prospects:', err);
            setError('Failed to load prospects');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadProspects();
    }, [loadProspects]);

    const saveProspect = useCallback(async (prospect: Prospect) => {
        if (!isSupabaseConfigured()) {
            setProspects(prev => {
                const exists = prev.find(p => p.id === prospect.id);
                if (exists) {
                    return prev.map(p => p.id === prospect.id ? prospect : p);
                }
                return [prospect, ...prev];
            });
            return prospect;
        }

        const saved = await saveProspectToDB(prospect);
        if (saved) {
            setProspects(prev => {
                const exists = prev.find(p => p.id === saved.id);
                if (exists) {
                    return prev.map(p => p.id === saved.id ? saved : p);
                }
                return [saved, ...prev];
            });
        }
        return saved;
    }, []);

    const removeProspect = useCallback(async (id: string) => {
        if (isSupabaseConfigured()) {
            const success = await deleteProspectFromDB(id);
            if (!success) return false;
        }
        setProspects(prev => prev.filter(p => p.id !== id));
        return true;
    }, []);

    const updateProspect = useCallback((id: string, updates: Partial<Prospect>) => {
        setProspects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    }, []);

    return {
        prospects,
        loading,
        error,
        reload: loadProspects,
        saveProspect,
        removeProspect,
        updateProspect,
        setProspects,
    };
}

// ============================================
// NUMBER REQUEST HOOKS
// ============================================

/**
 * Hook to manage number provisioning requests (admin)
 */
export function useNumberRequests() {
    const [requests, setRequests] = useState<NumberRequest[]>([]);
    const [loading, setLoading] = useState(true);

    const loadRequests = useCallback(async () => {
        if (!isSupabaseConfigured()) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const dbRequests = await fetchPendingNumberRequests();
            setRequests(dbRequests);
        } catch (err) {
            console.error('Error loading number requests:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadRequests();
    }, [loadRequests]);

    const submitRequest = useCallback(async (clientId: string, areaCode?: string, notes?: string) => {
        const request = await createNumberRequest(clientId, areaCode, notes);
        if (request) {
            setRequests(prev => [...prev, request]);
        }
        return request;
    }, []);

    const processRequest = useCallback(async (
        id: string,
        status: 'approved' | 'rejected' | 'provisioned',
        adminNotes?: string,
        provisionedNumber?: string
    ) => {
        const success = await processNumberRequest(id, status, adminNotes, provisionedNumber);
        if (success) {
            setRequests(prev => prev.filter(r => r.id !== id));
        }
        return success;
    }, []);

    return {
        requests,
        loading,
        reload: loadRequests,
        submitRequest,
        processRequest,
    };
}
