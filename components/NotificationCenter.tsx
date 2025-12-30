import React, { useState } from 'react';
import {
    Bell,
    MessageSquare,
    Phone,
    Calendar,
    AlertTriangle,
    PhoneMissed,
    X,
    Check,
    ChevronRight,
    Clock
} from 'lucide-react';
import { OwnerNotification, NotificationType } from '../services/communicationHub';

// ============================================================================
// TYPES
// ============================================================================

interface NotificationCenterProps {
    notifications: OwnerNotification[];
    onMarkRead: (id: string) => void;
    onMarkAllRead: () => void;
    onViewDetails: (notification: OwnerNotification) => void;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getNotificationIcon(type: NotificationType) {
    switch (type) {
        case 'new_lead':
            return <MessageSquare className="text-green-500" size={18} />;
        case 'reply':
            return <MessageSquare className="text-blue-500" size={18} />;
        case 'booking':
            return <Calendar className="text-purple-500" size={18} />;
        case 'escalation':
            return <AlertTriangle className="text-orange-500" size={18} />;
        case 'missed_call':
            return <PhoneMissed className="text-red-500" size={18} />;
        default:
            return <Bell className="text-slate-500" size={18} />;
    }
}

function getNotificationColor(type: NotificationType): string {
    switch (type) {
        case 'new_lead':
            return 'border-l-green-500';
        case 'reply':
            return 'border-l-blue-500';
        case 'booking':
            return 'border-l-purple-500';
        case 'escalation':
            return 'border-l-orange-500';
        case 'missed_call':
            return 'border-l-red-500';
        default:
            return 'border-l-slate-400';
    }
}

function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
}

// ============================================================================
// NOTIFICATION BELL BUTTON
// ============================================================================

interface NotificationBellProps {
    unreadCount: number;
    onClick: () => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ unreadCount, onClick }) => {
    return (
        <button
            onClick={onClick}
            className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
        >
            <Bell size={20} />
            {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                </span>
            )}
        </button>
    );
};

// ============================================================================
// NOTIFICATION CENTER PANEL
// ============================================================================

const NotificationCenter: React.FC<NotificationCenterProps> = ({
    notifications,
    onMarkRead,
    onMarkAllRead,
    onViewDetails,
}) => {
    const unreadNotifications = notifications.filter(n => !n.read);
    const readNotifications = notifications.filter(n => n.read).slice(0, 10);

    return (
        <div className="w-96 max-h-[500px] bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Bell className="text-slate-600" size={18} />
                    <h3 className="font-semibold text-slate-900">Notifications</h3>
                    {unreadNotifications.length > 0 && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                            {unreadNotifications.length} new
                        </span>
                    )}
                </div>
                {unreadNotifications.length > 0 && (
                    <button
                        onClick={onMarkAllRead}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                        Mark all read
                    </button>
                )}
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto max-h-[400px]">
                {notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                        <Bell className="mx-auto mb-2 text-slate-300" size={32} />
                        <p className="text-sm">No notifications yet</p>
                    </div>
                ) : (
                    <>
                        {/* Unread Section */}
                        {unreadNotifications.length > 0 && (
                            <div>
                                <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">
                                    New
                                </div>
                                {unreadNotifications.map((notification) => (
                                    <NotificationItem
                                        key={notification.id}
                                        notification={notification}
                                        onMarkRead={onMarkRead}
                                        onViewDetails={onViewDetails}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Read Section */}
                        {readNotifications.length > 0 && (
                            <div>
                                <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">
                                    Earlier
                                </div>
                                {readNotifications.map((notification) => (
                                    <NotificationItem
                                        key={notification.id}
                                        notification={notification}
                                        onMarkRead={onMarkRead}
                                        onViewDetails={onViewDetails}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

// ============================================================================
// NOTIFICATION ITEM
// ============================================================================

interface NotificationItemProps {
    notification: OwnerNotification;
    onMarkRead: (id: string) => void;
    onViewDetails: (notification: OwnerNotification) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
    notification,
    onMarkRead,
    onViewDetails,
}) => {
    return (
        <div
            className={`px-4 py-3 border-l-4 ${getNotificationColor(notification.type)} ${!notification.read ? 'bg-indigo-50/50' : 'bg-white'
                } hover:bg-slate-50 cursor-pointer transition-colors border-b border-slate-100`}
            onClick={() => {
                if (!notification.read) {
                    onMarkRead(notification.id);
                }
                onViewDetails(notification);
            }}
        >
            <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">
                    {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <p className={`text-sm ${!notification.read ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'} truncate`}>
                            {notification.title}
                        </p>
                        {!notification.read && (
                            <span className="w-2 h-2 bg-indigo-500 rounded-full shrink-0" />
                        )}
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-2">
                        {notification.message}
                    </p>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                        <Clock size={12} />
                        {formatTimeAgo(notification.createdAt)}
                    </p>
                </div>
                <ChevronRight className="text-slate-300 shrink-0" size={18} />
            </div>
        </div>
    );
};

// ============================================================================
// NOTIFICATION TOAST
// ============================================================================

interface NotificationToastProps {
    notification: OwnerNotification;
    onDismiss: () => void;
    onView: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
    notification,
    onDismiss,
    onView,
}) => {
    return (
        <div className="fixed bottom-4 right-4 w-80 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-4 z-50">
            <div className={`h-1 ${notification.type === 'escalation' ? 'bg-orange-500' :
                    notification.type === 'new_lead' ? 'bg-green-500' :
                        notification.type === 'booking' ? 'bg-purple-500' :
                            'bg-blue-500'
                }`} />
            <div className="p-4">
                <div className="flex items-start gap-3">
                    <div className="shrink-0">
                        {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 text-sm mb-1">
                            {notification.title}
                        </p>
                        <p className="text-sm text-slate-600 line-clamp-2">
                            {notification.message}
                        </p>
                    </div>
                    <button
                        onClick={onDismiss}
                        className="text-slate-400 hover:text-slate-600 shrink-0"
                    >
                        <X size={18} />
                    </button>
                </div>
                <div className="flex gap-2 mt-3">
                    <button
                        onClick={onView}
                        className="flex-1 px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        View Details
                    </button>
                    <button
                        onClick={onDismiss}
                        className="px-3 py-1.5 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors"
                    >
                        Dismiss
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotificationCenter;
