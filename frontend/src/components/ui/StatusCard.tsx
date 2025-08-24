import React from 'react';
import { Card } from './Card';
import { cn } from '@/utils/cn';

export interface StatusCardProps {
  title: string;
  status: 'active' | 'inactive' | 'error' | 'warning' | 'loading';
  children: React.ReactNode;
  className?: string;
  onRefresh?: () => void;
  isLoading?: boolean;
}

const statusConfig = {
  active: {
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800',
    icon: '🟢'
  },
  inactive: {
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-50 dark:bg-gray-800',
    borderColor: 'border-gray-200 dark:border-gray-700',
    icon: '⚫'
  },
  error: {
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
    icon: '🔴'
  },
  warning: {
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    icon: '🟡'
  },
  loading: {
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    icon: '⏳'
  }
};

export const StatusCard: React.FC<StatusCardProps> = ({
  title,
  status,
  children,
  className,
  onRefresh,
  isLoading = false
}) => {
  const config = statusConfig[status];

  return (
    <Card className={cn(
      'transition-all duration-200 hover:shadow-md',
      config.bgColor,
      config.borderColor,
      className
    )}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{config.icon}</span>
            <h3 className={cn('font-semibold text-lg', config.color)}>
              {title}
            </h3>
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className={cn(
                'p-2 rounded-full hover:bg-white/50 transition-colors',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
              title="Refresh"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0V9a8 8 0 1115.356 2m-15.356 0H9" />
                </svg>
              )}
            </button>
          )}
        </div>
        {children}
      </div>
    </Card>
  );
};