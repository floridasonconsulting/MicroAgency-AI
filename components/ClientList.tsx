
import React, { useState } from 'react';
import { Client } from '../types';
import { Search, Filter, ChevronRight, Zap, ExternalLink, Plus } from 'lucide-react';
import { DEMO_CLIENT } from '../constants';
import AddClientModal from './AddClientModal';

interface ClientListProps {
  clients: Client[];
  onSelectClient: (client: Client) => void;
  onAddClient?: (client: Client) => void;
}

const ClientList: React.FC<ClientListProps> = ({ clients, onSelectClient, onAddClient }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.niche.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || client.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const StatusBadge = ({ status }: { status: string }) => {
    const colors: Record<string, string> = {
      'Active': 'bg-green-100 text-green-700',
      'Onboarding': 'bg-blue-100 text-blue-700',
      'Churned': 'bg-red-100 text-red-700',
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-700'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Subscribers</h2>
          <p className="text-sm text-slate-500">Manage your active revenue sources</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2"
          >
            <Plus size={18} /> Add Client
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4 bg-slate-50/50">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search business name or niche..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-slate-400" />
            <select
              className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 focus:outline-none focus:border-primary-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Onboarding">Onboarding</option>
              <option value="Churned">Churned</option>
            </select>
          </div>
        </div>

        {/* Table Header */}
        <div className="hidden md:grid grid-cols-12 gap-4 p-4 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <div className="col-span-5">Business</div>
          <div className="col-span-3">Niche</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1">Plan</div>
          <div className="col-span-1"></div>
        </div>

        {/* List */}
        <div className="divide-y divide-slate-100">
          {filteredClients.length > 0 ? (
            filteredClients.map((client) => (
              <div
                key={client.id}
                onClick={() => onSelectClient(client)}
                className="group md:grid grid-cols-12 gap-4 p-4 items-center hover:bg-blue-50/30 transition-colors cursor-pointer"
              >
                {/* Business Info */}
                <div className="col-span-12 md:col-span-5 flex items-center gap-3 mb-2 md:mb-0">
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg">
                    {client.businessName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 group-hover:text-primary-600 transition-colors">{client.businessName}</h3>
                    <p className="text-xs text-slate-500">{client.ownerName} • {client.phone}</p>
                  </div>
                </div>

                {/* Niche */}
                <div className="col-span-12 md:col-span-3 mb-2 md:mb-0">
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-600">
                    {client.niche}
                  </span>
                </div>

                {/* Status */}
                <div className="col-span-6 md:col-span-2">
                  <StatusBadge status={client.status} />
                </div>

                {/* Plan */}
                <div className="col-span-6 md:col-span-1">
                  <span className="text-sm font-medium text-slate-900">
                    {client.subscriptionTier}
                  </span>
                </div>

                {/* Action */}
                <div className="col-span-12 md:col-span-1 flex justify-end">
                  <ChevronRight size={18} className="text-slate-300 group-hover:text-primary-400" />
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-slate-400">
              <p>No subscribers found.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Client Modal */}
      {showAddModal && (
        <AddClientModal
          onClose={() => setShowAddModal(false)}
          onAddClient={(client) => {
            if (onAddClient) onAddClient(client);
            setShowAddModal(false);
          }}
        />
      )}
    </div>
  );
};

export default ClientList;
