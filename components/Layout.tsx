import React, { useState } from 'react';
import { LayoutDashboard, Store, Settings, LogOut, Menu, Briefcase, Search, BarChart3, Bell } from 'lucide-react';
import { ViewState } from '../types';
import NotificationCenter, { NotificationBell } from './NotificationCenter';
import { OwnerNotification } from '../services/communicationHub';

interface LayoutProps {
  children: React.ReactNode;
  activeView: ViewState;
  onNavigate: (view: ViewState) => void;
  notifications?: OwnerNotification[];
  onMarkNotificationRead?: (id: string) => void;
  onMarkAllNotificationsRead?: () => void;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  activeView,
  onNavigate,
  notifications = [],
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const NavItem = ({ view, icon: Icon, label }: { view: ViewState; icon: any; label: string }) => (
    <button
      onClick={() => {
        onNavigate(view);
        setIsMobileMenuOpen(false);
      }}
      className={`flex items-center w-full px-4 py-3 mb-2 rounded-lg transition-colors ${activeView === view
        ? 'bg-primary-500 text-white shadow-md'
        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
        }`}
    >
      <Icon size={20} className="mr-3" />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-200 ease-in-out
        md:relative md:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-slate-800">
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary-400 to-indigo-400 bg-clip-text text-transparent">
              Recepticom
            </h1>
            <p className="text-xs text-slate-500 mt-1">Autopilot Engine</p>
          </div>

          <nav className="flex-1 p-4">
            <NavItem view="dashboard" icon={LayoutDashboard} label="Agency Dashboard" />
            <NavItem view="clients" icon={Store} label="Subscribers" />
            <NavItem view="prospector" icon={Search} label="Lead Finder" />
            <NavItem view="analytics" icon={BarChart3} label="Analytics" />
            <NavItem view="settings" icon={Settings} label="System Config" />
          </nav>

          <div className="p-4 border-t border-slate-800">
            <div className="mb-4 px-4 py-3 bg-slate-800 rounded-lg">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">Your Offer</p>
              <p className="text-sm font-bold text-white">$197/mo Plan</p>
              <p className="text-xs text-slate-500">AI Call + Text Capture</p>
            </div>
            <button className="flex items-center w-full px-4 py-2 text-slate-400 hover:text-white transition-colors">
              <LogOut size={20} className="mr-3" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Desktop Header with Notifications */}
        <header className="hidden md:flex items-center justify-end bg-white border-b border-gray-200 px-6 py-3">
          <div className="relative">
            <NotificationBell
              unreadCount={unreadCount}
              onClick={() => setShowNotifications(!showNotifications)}
            />
            {showNotifications && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowNotifications(false)}
                />
                <div className="absolute right-0 top-full mt-2 z-50">
                  <NotificationCenter
                    notifications={notifications}
                    onMarkRead={(id) => {
                      onMarkNotificationRead?.(id);
                    }}
                    onMarkAllRead={() => {
                      onMarkAllNotificationsRead?.();
                    }}
                    onViewDetails={(notification) => {
                      console.log('View notification:', notification);
                      setShowNotifications(false);
                    }}
                  />
                </div>
              </>
            )}
          </div>
        </header>

        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between bg-white border-b border-gray-200 px-4 py-3">
          <span className="font-bold text-slate-900">Recepticom</span>
          <div className="flex items-center gap-2">
            <NotificationBell
              unreadCount={unreadCount}
              onClick={() => setShowNotifications(!showNotifications)}
            />
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-600">
              <Menu size={24} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8 relative">
          {children}
        </div>
      </main>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Notifications Panel */}
      {showNotifications && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setShowNotifications(false)}>
          <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-white" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="font-bold text-lg">Notifications</h2>
              <button onClick={() => setShowNotifications(false)} className="p-2 text-slate-500">×</button>
            </div>
            <div className="overflow-y-auto h-full pb-20">
              <NotificationCenter
                notifications={notifications}
                onMarkRead={(id) => onMarkNotificationRead?.(id)}
                onMarkAllRead={() => onMarkAllNotificationsRead?.()}
                onViewDetails={(notification) => {
                  console.log('View notification:', notification);
                  setShowNotifications(false);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;

