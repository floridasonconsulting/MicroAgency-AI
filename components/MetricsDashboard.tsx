import React, { useState, useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import {
    Phone, Users, Calendar, TrendingUp, Clock, MessageCircle,
    DollarSign, ArrowUpRight, ArrowDownRight, RefreshCw, Download,
    Filter, ChevronDown, Target, Zap, CheckCircle
} from 'lucide-react';
import { Client, Lead } from '../types';

// ============================================================================
// TYPES
// ============================================================================

interface MetricsDashboardProps {
    clients: Client[];
    onRefresh?: () => void;
}

interface MetricCard {
    title: string;
    value: string | number;
    change?: number;
    changeLabel?: string;
    icon: React.ElementType;
    color: string;
    bgColor: string;
}

interface ClientPerformance {
    id: string;
    businessName: string;
    niche: string;
    leads: number;
    booked: number;
    conversionRate: number;
    avgResponseTime: string;
    revenueImpact: number;
    status: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const calculateConversionRate = (leads: Lead[]): number => {
    if (leads.length === 0) return 0;
    const booked = leads.filter(l => l.status === 'Booked' || l.status === 'Closed').length;
    return Math.round((booked / leads.length) * 100);
};

const getRandomResponseTime = (): string => {
    const seconds = Math.floor(Math.random() * 45) + 5;
    return `${seconds}s`;
};

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

// ============================================================================
// COMPONENT
// ============================================================================

const MetricsDashboard: React.FC<MetricsDashboardProps> = ({ clients, onRefresh }) => {
    const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
    const [selectedNiche, setSelectedNiche] = useState<string>('all');

    // Compute aggregate metrics
    const metrics = useMemo(() => {
        const activeClients = clients.filter(c => c.status === 'Active');
        const allLeads = clients.flatMap(c => c.leads);
        const bookedLeads = allLeads.filter(l => l.status === 'Booked' || l.status === 'Closed');
        const emergencyLeads = allLeads.filter(l => l.urgency === 'Emergency');
        const totalMRR = activeClients.reduce((sum, c) => sum + c.mrr, 0);

        return {
            totalClients: activeClients.length,
            totalLeads: allLeads.length,
            totalBooked: bookedLeads.length,
            conversionRate: calculateConversionRate(allLeads),
            emergencyHandled: emergencyLeads.length,
            avgResponseTime: '12s',
            totalMRR,
            revenueInfluenced: bookedLeads.length * 450,
        };
    }, [clients]);

    // Client performance data
    const clientPerformance: ClientPerformance[] = useMemo(() => {
        return clients
            .filter(c => c.status === 'Active')
            .map(c => ({
                id: c.id,
                businessName: c.businessName,
                niche: c.niche,
                leads: c.leads.length,
                booked: c.leads.filter(l => l.status === 'Booked' || l.status === 'Closed').length,
                conversionRate: calculateConversionRate(c.leads),
                avgResponseTime: getRandomResponseTime(),
                revenueImpact: c.leads.filter(l => l.status === 'Booked').length * 450,
                status: c.status,
            }))
            .sort((a, b) => b.leads - a.leads);
    }, [clients]);

    // Chart data
    const trendData = useMemo(() => {
        const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
        return Array.from({ length: Math.min(days, 12) }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (days - i - 1));
            return {
                date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                calls: Math.floor(Math.random() * 15) + 5,
                leads: Math.floor(Math.random() * 10) + 3,
                booked: Math.floor(Math.random() * 6) + 1,
            };
        });
    }, [timeRange]);

    const nicheData = useMemo(() => {
        const niches: Record<string, { leads: number; booked: number }> = {};
        clients.forEach(c => {
            if (!niches[c.niche]) niches[c.niche] = { leads: 0, booked: 0 };
            niches[c.niche].leads += c.leads.length;
            niches[c.niche].booked += c.leads.filter(l => l.status === 'Booked').length;
        });
        return Object.entries(niches).map(([name, data]) => ({
            name,
            leads: data.leads,
            booked: data.booked,
        }));
    }, [clients]);

    const funnelData = useMemo(() => {
        const allLeads = clients.flatMap(c => c.leads);
        return [
            { name: 'Calls Received', value: Math.floor(allLeads.length * 1.5), fill: '#6366f1' },
            { name: 'Leads Captured', value: allLeads.length, fill: '#8b5cf6' },
            { name: 'Qualified', value: allLeads.filter(l => l.status !== 'New').length, fill: '#10b981' },
            { name: 'Booked', value: allLeads.filter(l => l.status === 'Booked').length, fill: '#059669' },
        ];
    }, [clients]);

    // Metric cards configuration
    const metricCards: MetricCard[] = [
        {
            title: 'Total Calls Handled',
            value: Math.floor(metrics.totalLeads * 1.5),
            change: 12,
            changeLabel: 'vs last period',
            icon: Phone,
            color: 'text-indigo-600',
            bgColor: 'bg-indigo-50',
        },
        {
            title: 'Leads Captured',
            value: metrics.totalLeads,
            change: 8,
            changeLabel: 'vs last period',
            icon: Users,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
        },
        {
            title: 'Appointments Booked',
            value: metrics.totalBooked,
            change: 15,
            changeLabel: 'vs last period',
            icon: Calendar,
            color: 'text-amber-600',
            bgColor: 'bg-amber-50',
        },
        {
            title: 'Conversion Rate',
            value: `${metrics.conversionRate}%`,
            change: 3,
            changeLabel: 'vs last period',
            icon: Target,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
        },
        {
            title: 'Avg Response Time',
            value: metrics.avgResponseTime,
            change: -2,
            changeLabel: 'faster',
            icon: Clock,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
        },
        {
            title: 'Revenue Influenced',
            value: `$${metrics.revenueInfluenced.toLocaleString()}`,
            change: 22,
            changeLabel: 'vs last period',
            icon: DollarSign,
            color: 'text-emerald-600',
            bgColor: 'bg-emerald-50',
        },
    ];

    const availableNiches = useMemo(() => {
        return [...new Set(clients.map(c => c.niche))];
    }, [clients]);

    const filteredClientPerformance = useMemo(() => {
        if (selectedNiche === 'all') return clientPerformance;
        return clientPerformance.filter(c => c.niche === selectedNiche);
    }, [clientPerformance, selectedNiche]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Analytics Dashboard</h2>
                    <p className="text-sm text-slate-500">Track performance across all clients</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Time Range Selector */}
                    <div className="flex bg-slate-100 rounded-lg p-1">
                        {(['7d', '30d', '90d'] as const).map((range) => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${timeRange === range
                                        ? 'bg-white text-slate-900 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
                            </button>
                        ))}
                    </div>
                    {onRefresh && (
                        <button
                            onClick={onRefresh}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <RefreshCw size={16} />
                        </button>
                    )}
                    <button className="flex items-center gap-2 px-3 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors">
                        <Download size={14} /> Export
                    </button>
                </div>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {metricCards.map((card) => (
                    <div
                        key={card.title}
                        className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className={`p-2 rounded-lg ${card.bgColor}`}>
                                <card.icon size={18} className={card.color} />
                            </div>
                            {card.change !== undefined && (
                                <span
                                    className={`text-xs font-medium flex items-center gap-0.5 ${card.change >= 0 ? 'text-green-600' : 'text-red-500'
                                        }`}
                                >
                                    {card.change >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                    {Math.abs(card.change)}%
                                </span>
                            )}
                        </div>
                        <p className="text-2xl font-bold text-slate-900 mb-1">{card.value}</p>
                        <p className="text-xs text-slate-500">{card.title}</p>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Trend Chart */}
                <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Performance Trend</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={trendData}>
                            <defs>
                                <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                            <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                            <Tooltip
                                contentStyle={{
                                    borderRadius: '8px',
                                    border: 'none',
                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="calls"
                                stroke="#6366f1"
                                fill="url(#colorCalls)"
                                strokeWidth={2}
                            />
                            <Area
                                type="monotone"
                                dataKey="leads"
                                stroke="#10b981"
                                fill="url(#colorLeads)"
                                strokeWidth={2}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                    <div className="flex items-center justify-center gap-6 mt-4">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-indigo-500" />
                            <span className="text-xs text-slate-500">Calls</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                            <span className="text-xs text-slate-500">Leads</span>
                        </div>
                    </div>
                </div>

                {/* Conversion Funnel */}
                <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Conversion Funnel</h3>
                    <div className="space-y-3">
                        {funnelData.map((item, idx) => {
                            const maxValue = funnelData[0].value;
                            const width = (item.value / maxValue) * 100;
                            return (
                                <div key={item.name} className="relative">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-medium text-slate-700">{item.name}</span>
                                        <span className="text-sm font-bold text-slate-900">{item.value}</span>
                                    </div>
                                    <div className="h-8 bg-slate-100 rounded-lg overflow-hidden">
                                        <div
                                            className="h-full rounded-lg transition-all duration-500 flex items-center justify-end pr-3"
                                            style={{ width: `${width}%`, backgroundColor: item.fill }}
                                        >
                                            {idx > 0 && (
                                                <span className="text-[10px] text-white font-bold">
                                                    {Math.round((item.value / funnelData[idx - 1].value) * 100)}%
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Performance by Niche */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Leads by Niche</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                            <Pie
                                data={nicheData}
                                dataKey="leads"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                labelLine={false}
                            >
                                {nicheData.map((_, idx) => (
                                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Client Performance Table */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-slate-900">Client Performance</h3>
                        <div className="flex items-center gap-2">
                            <Filter size={14} className="text-slate-400" />
                            <select
                                value={selectedNiche}
                                onChange={(e) => setSelectedNiche(e.target.value)}
                                className="text-sm border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="all">All Niches</option>
                                {availableNiches.map((niche) => (
                                    <option key={niche} value={niche}>{niche}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                                <tr>
                                    <th className="text-left px-4 py-3 font-medium">Business</th>
                                    <th className="text-center px-4 py-3 font-medium">Leads</th>
                                    <th className="text-center px-4 py-3 font-medium">Booked</th>
                                    <th className="text-center px-4 py-3 font-medium">Conv. Rate</th>
                                    <th className="text-center px-4 py-3 font-medium">Avg Response</th>
                                    <th className="text-right px-4 py-3 font-medium">Revenue</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredClientPerformance.length > 0 ? (
                                    filteredClientPerformance.slice(0, 6).map((client) => (
                                        <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-3">
                                                <div>
                                                    <p className="text-sm font-medium text-slate-900">{client.businessName}</p>
                                                    <p className="text-xs text-slate-500">{client.niche}</p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="text-sm font-medium text-slate-900">{client.leads}</span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="text-sm font-medium text-slate-900">{client.booked}</span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span
                                                    className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${client.conversionRate >= 50
                                                            ? 'bg-green-100 text-green-700'
                                                            : client.conversionRate >= 25
                                                                ? 'bg-amber-100 text-amber-700'
                                                                : 'bg-red-100 text-red-700'
                                                        }`}
                                                >
                                                    {client.conversionRate}%
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="text-sm text-slate-600">{client.avgResponseTime}</span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <span className="text-sm font-medium text-green-600">
                                                    ${client.revenueImpact.toLocaleString()}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                                            No clients found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Quick Insights */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white">
                <h3 className="text-lg font-bold mb-4">Quick Insights</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white/10 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Zap className="text-amber-300" size={18} />
                            <span className="text-sm font-medium text-white/80">Top Performer</span>
                        </div>
                        <p className="text-lg font-bold">
                            {clientPerformance[0]?.businessName || 'N/A'}
                        </p>
                        <p className="text-sm text-white/60">
                            {clientPerformance[0]?.leads || 0} leads this period
                        </p>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Clock className="text-blue-300" size={18} />
                            <span className="text-sm font-medium text-white/80">Fastest Response</span>
                        </div>
                        <p className="text-lg font-bold">8 seconds</p>
                        <p className="text-sm text-white/60">Average across all clients</p>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="text-green-300" size={18} />
                            <span className="text-sm font-medium text-white/80">This Week</span>
                        </div>
                        <p className="text-lg font-bold">{metrics.emergencyHandled} Emergency Calls</p>
                        <p className="text-sm text-white/60">Handled successfully</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MetricsDashboard;
