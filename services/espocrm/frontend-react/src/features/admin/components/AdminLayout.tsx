/**
 * Admin Layout - Layout wrapper for admin pages
 */
import React, { Suspense } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { useAdminStore } from '../store';
import { cn } from '@/lib/utils/cn';

export function AdminLayout(): React.ReactElement {
  const { sidebarCollapsed } = useAdminStore();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin top bar */}
      <div className="sticky top-0 z-40 bg-slate-800 text-white">
        <div className="flex items-center h-12 px-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm hover:text-slate-300 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Application</span>
          </Link>
          <div className="ml-auto flex items-center gap-4">
            <span className="text-sm text-slate-400">Administration</span>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Admin Sidebar */}
        <AdminSidebar />

        {/* Main content area */}
        <main
          className={cn(
            'flex-1 min-h-[calc(100vh-3rem)] transition-all duration-200',
            sidebarCollapsed ? 'ml-16' : 'ml-64'
          )}
        >
          {/* Breadcrumb header */}
          <AdminHeader />

          {/* Page content */}
          <div className="p-6">
            <Suspense
              fallback={
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              }
            >
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
