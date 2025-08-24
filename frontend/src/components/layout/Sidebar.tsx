import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useIsMobile } from '@/utils/responsive';
import { cn } from '@/utils/cn';
import {
  Home,
  Settings,
  Server,
  X,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const isMobile = useIsMobile();

  const navigationItems = [
    { path: '/', label: 'Dashboard', icon: Home },
    { path: '/services', label: 'Services', icon: Server },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  const sidebarClasses = cn(
    "fixed left-0 top-16 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-lg transition-transform duration-300 ease-in-out z-50",
    isMobile
      ? cn(
          "w-64",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )
      : cn(
          "w-64",
          "translate-x-0" // Always visible on desktop
        )
  );

  return (
    <>
      {/* Desktop Sidebar - Always visible */}
      {!isMobile && (
        <aside className={sidebarClasses}>
          <nav className="p-4 space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors group",
                    isActive
                      ? "bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300"
                      : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span>{item.label}</span>
                  {isActive && (
                    <ChevronRight className="h-4 w-4 ml-auto opacity-50" />
                  )}
                </Link>
              );
            })}
          </nav>
        </aside>
      )}

      {/* Mobile Sidebar - Overlay */}
      {isMobile && (
        <aside className={sidebarClasses}>
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Navigation</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="p-4 space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300"
                      : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span>{item.label}</span>
                  {isActive && (
                    <ChevronRight className="h-4 w-4 ml-auto opacity-50" />
                  )}
                </Link>
              );
            })}
          </nav>
        </aside>
      )}
    </>
  );
};

export default Sidebar;