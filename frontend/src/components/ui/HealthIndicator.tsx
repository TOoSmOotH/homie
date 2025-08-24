import React from 'react';
import { cn } from '@/utils/cn';

export interface HealthIndicatorProps {
  status: 'healthy' | 'warning' | 'error' | 'unknown';
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

const statusConfig = {
  healthy: {
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-200',
    icon: '❤️',
    text: 'Healthy'
  },
  warning: {
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-200',
    icon: '⚠️',
    text: 'Warning'
  },
  error: {
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-200',
    icon: '💔',
    text: 'Error'
  },
  unknown: {
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-200',
    icon: '❓',
    text: 'Unknown'
  }
};

const sizeConfig = {
  sm: 'text-xs px-2 py-1',
  md: 'text-sm px-3 py-1',
  lg: 'text-base px-4 py-2'
};

export const HealthIndicator: React.FC<HealthIndicatorProps> = ({
  status,
  message,
  size = 'md',
  showText = true,
  className
}) => {
  const config = statusConfig[status];
  const sizeClass = sizeConfig[size];

  return (
    <div className={cn(
      'inline-flex items-center rounded-full border',
      config.bgColor,
      config.borderColor,
      sizeClass,
      className
    )}>
      <span className="mr-1">{config.icon}</span>
      {showText && (
        <span className={cn('font-medium', config.color)}>
          {message || config.text}
        </span>
      )}
    </div>
  );
};