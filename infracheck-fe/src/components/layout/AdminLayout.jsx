import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu, Bell, User as UserIcon } from 'lucide-react';
import AdminSidebar from '../admin/AdminSidebar';
import useAuth from '../../hooks/useAuth';

const AdminLayout = ({ children, headerLeft, headerRight, headerContent, maxWidth = 'max-w-7xl', className = '' }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/admin' || path === '/admin/dashboard') return 'Dashboard';
    if (path === '/admin/map' || path.startsWith('/admin/map') || path.startsWith('/admin/reports-map')) return 'Reports Map';
    if (path.startsWith('/admin/reports') || path.startsWith('/admin/history')) return 'Audit History';
    if (path.startsWith('/admin/categories')) return 'Kategori Infrastruktur';
    if (path.startsWith('/admin/profile') || path.startsWith('/admin/settings')) return 'Settings & Profil';
    return 'Admin Panel';
  };

  return (
    <div id="admin-layout" className="min-h-screen bg-[#111416] text-slate-100 flex">
      {/* Sidebar Component */}
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        {/* Top Header */}
        <header
          id="admin-top-header"
          className="sticky top-0 z-20 bg-[#111416]/95 backdrop-blur-md border-b border-[#444652] h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 gap-4"
        >
          {headerContent ? (
            headerContent({ sidebarOpen, setSidebarOpen })
          ) : (
            <>
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <button
                  id="mobile-sidebar-toggle-btn"
                  type="button"
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none shrink-0"
                  aria-label="Buka menu navigasi"
                >
                  <Menu className="w-5 h-5" />
                </button>
                {headerLeft !== undefined ? (
                  headerLeft
                ) : (
                  <h1 id="admin-page-title" className="text-lg sm:text-xl font-bold text-white tracking-tight truncate">
                    {getPageTitle()}
                  </h1>
                )}
              </div>

              <div className="flex items-center gap-4 shrink-0">
                {headerRight !== undefined ? (
                  headerRight
                ) : (
                  <div className="flex items-center gap-3 pl-3 border-l border-[#444652]">
                    <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-semibold text-xs border border-blue-500/30">
                      {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
                    </div>
                    <div className="hidden sm:block text-left">
                      <p className="text-xs font-semibold text-slate-200 leading-tight">
                        {user?.name || 'Administrator'}
                      </p>
                      <p className="text-[11px] text-slate-400 leading-tight">
                        {user?.email || 'admin@infracheck.id'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </header>

        {/* Page Content Body */}
        <main id="admin-main-content" className={`flex-1 p-4 sm:p-6 lg:p-8 w-full mx-auto ${maxWidth} ${className}`}>
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
