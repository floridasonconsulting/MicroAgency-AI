import React, { useState, useEffect } from 'react';
import { Phone, CheckCircle, X, Clock, AlertCircle, Loader2, User, Building, RefreshCw, Search } from 'lucide-react';
import { fetchPendingNumberRequests, processNumberRequest, fetchClientById, NumberRequest, updateClient } from '../services/supabase';
import { Client } from '../types';
import { searchAvailableNumbers, provisionNumber, isTwilioConfigured, formatPhoneNumber, AvailableNumber } from '../services/twilioService';

interface RequestWithClient extends NumberRequest {
    client?: Client;
}

const AdminApprovalQueue: React.FC = () => {
    const [requests, setRequests] = useState<RequestWithClient[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const loadRequests = async () => {
        setLoading(true);
        setError(null);
        try {
            const pendingRequests = await fetchPendingNumberRequests();

            // Enrich with client data
            const enrichedRequests = await Promise.all(
                pendingRequests.map(async (req) => {
                    const client = await fetchClientById(req.clientId);
                    return { ...req, client: client || undefined };
                })
            );

            setRequests(enrichedRequests);
        } catch (err) {
            console.error('Error loading requests:', err);
            setError('Failed to load pending requests');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRequests();
    }, []);

    const handleApprove = async (requestId: string, selectedNumber?: string) => {
        const request = requests.find(r => r.id === requestId);
        if (!request) return;

        setProcessing(requestId);
        try {
            // Search for available numbers if not provided
            let phoneNumber = selectedNumber;
            if (!phoneNumber) {
                const availableNumbers = await searchAvailableNumbers(request.requestedAreaCode || undefined);
                if (availableNumbers.length > 0) {
                    phoneNumber = availableNumbers[0].phoneNumber;
                }
            }

            if (!phoneNumber) {
                setError('No numbers available for the requested area code');
                setProcessing(null);
                return;
            }

            // Provision the number via Twilio
            const clientName = request.client?.businessName || 'Client';
            const provisioned = await provisionNumber(
                phoneNumber,
                `AI Line - ${clientName}`
            );

            if (!provisioned) {
                setError('Failed to provision number');
                setProcessing(null);
                return;
            }

            // Update the number request status
            const success = await processNumberRequest(
                requestId,
                'provisioned',
                `Number provisioned: ${formatPhoneNumber(provisioned.phoneNumber)}`,
                provisioned.phoneNumber
            );

            // Update the client record with their new AI number
            if (success && request.clientId) {
                await updateClient(request.clientId, {
                    aiPhoneNumber: provisioned.phoneNumber,
                    forwardingStatus: 'Pending Setup',
                    status: 'Active'
                });
            }

            if (success) {
                // Remove from list
                setRequests(prev => prev.filter(r => r.id !== requestId));
            }
        } catch (err) {
            console.error('Error approving request:', err);
            setError('Failed to provision number. Please try again.');
        } finally {
            setProcessing(null);
        }
    };

    const handleReject = async (requestId: string) => {
        const reason = prompt('Reason for rejection (optional):');

        setProcessing(requestId);
        try {
            const success = await processNumberRequest(
                requestId,
                'rejected',
                reason || 'Request rejected by admin'
            );

            if (success) {
                setRequests(prev => prev.filter(r => r.id !== requestId));
            }
        } catch (err) {
            console.error('Error rejecting request:', err);
        } finally {
            setProcessing(null);
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8">
                <div className="flex items-center justify-center gap-3 text-slate-500">
                    <Loader2 className="animate-spin" size={20} />
                    Loading pending requests...
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            {/* Header */}
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center">
                        <Clock size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900">Number Provisioning Queue</h3>
                        <p className="text-xs text-slate-500">
                            {requests.length} pending request{requests.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>
                <button
                    onClick={loadRequests}
                    className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                    title="Refresh"
                >
                    <RefreshCw size={18} className="text-slate-500" />
                </button>
            </div>

            {/* Error State */}
            {error && (
                <div className="p-4 bg-red-50 border-b border-red-100 text-red-700 flex items-center gap-2">
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}

            {/* Empty State */}
            {requests.length === 0 && !error && (
                <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle size={32} />
                    </div>
                    <h4 className="font-bold text-slate-900 mb-1">All Caught Up!</h4>
                    <p className="text-sm text-slate-500">No pending number requests.</p>
                </div>
            )}

            {/* Request List */}
            {requests.length > 0 && (
                <div className="divide-y divide-slate-100">
                    {requests.map((request) => (
                        <div key={request.id} className="p-4 hover:bg-slate-50 transition-colors">
                            <div className="flex items-start justify-between gap-4">
                                {/* Client Info */}
                                <div className="flex items-start gap-3 flex-1">
                                    <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center shrink-0">
                                        {request.client?.businessName?.charAt(0) || <User size={18} />}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h4 className="font-bold text-slate-900 truncate">
                                            {request.client?.businessName || 'Unknown Client'}
                                        </h4>
                                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                                            <Building size={12} />
                                            {request.client?.niche || 'N/A'}
                                            <span className="text-slate-300">•</span>
                                            {request.client?.email || 'No email'}
                                        </div>

                                        {/* Request Details */}
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {request.requestedAreaCode && (
                                                <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-full">
                                                    Area Code: {request.requestedAreaCode}
                                                </span>
                                            )}
                                            <span className="bg-amber-50 text-amber-700 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                                <Clock size={10} />
                                                {new Date(request.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>

                                        {request.notes && (
                                            <p className="text-xs text-slate-500 mt-2 italic">
                                                "{request.notes}"
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 shrink-0">
                                    <button
                                        onClick={() => handleReject(request.id)}
                                        disabled={processing === request.id}
                                        className="p-2 border border-slate-200 rounded-lg hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors disabled:opacity-50"
                                        title="Reject"
                                    >
                                        <X size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleApprove(request.id)}
                                        disabled={processing === request.id}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 font-medium text-sm disabled:opacity-50"
                                    >
                                        {processing === request.id ? (
                                            <Loader2 className="animate-spin" size={16} />
                                        ) : (
                                            <Phone size={16} />
                                        )}
                                        Provision
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminApprovalQueue;
