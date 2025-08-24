import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useIsMobile } from '@/utils/responsive';
import { cn } from '@/utils/cn';
import Navigation from './Navigation';
import Sidebar from './Sidebar';
import NotificationContainer from '../ui/NotificationContainer';
import ConnectionStatusIndicator from '../ui/ConnectionStatusIndicator';

interface LayoutProps {
  children?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();
  const location = useLocation();

  // Don't show layout for login or setup pages
  const isAuthPage = location.pathname === '/login' || location.pathname === '/setup';

  if (isAuthPage) {
    return <>{children || <Outlet />}</>;
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation */}
      <Navigation onMenuClick={toggleSidebar} />

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <main
        className={cn(
          "transition-all duration-300 ease-in-out",
          isMobile
            ? "pt-16" // Account for mobile navigation height
            : "pt-16 pl-0 lg:pl-64" // Desktop: account for sidebar width
        )}
      >
        <div className="p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children || <Outlet />}
          </div>
        </div>
      </main>

      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black dark:bg-gray-900 bg-opacity-50 dark:bg-opacity-70 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Global Components */}
      <NotificationContainer />
      <div className="fixed bottom-4 left-4 z-50">
        <ConnectionStatusIndicator />
      </div>
    </div>
  );
};

export default Layout;