import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { BetaBanner } from '@/components/common/DevBanner';
import { cn } from '@/lib/utils/cn';

// Height of the beta banner for layout offset
const BETA_BANNER_HEIGHT = 40;

export function MainLayout(): React.ReactElement {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gray-50">
      <BetaBanner />
      {/* Offset for fixed banner */}
      <div style={{ height: BETA_BANNER_HEIGHT }} />
      <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex">
        <Sidebar isOpen={sidebarOpen} />

        <main
          className={cn(
            'flex-1 p-6 transition-all duration-200 min-h-[calc(100vh-6.5rem)]',
            sidebarOpen ? 'ml-64' : 'ml-0'
          )}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
