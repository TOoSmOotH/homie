import React from 'react';
import { cn } from '@/utils/cn';

export interface ControlButton {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  loading?: boolean;
}

export interface ServiceControlsProps {
  controls: ControlButton[];
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  orientation?: 'horizontal' | 'vertical';
}

const variantStyles = {
  primary: 'bg-blue-500 hover:bg-blue-600 text-white',
  secondary: 'bg-gray-500 hover:bg-gray-600 text-white',
  danger: 'bg-red-500 hover:bg-red-600 text-white',
  success: 'bg-green-500 hover:bg-green-600 text-white'
};

const sizeStyles = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-2 text-sm',
  lg: 'px-4 py-2 text-base'
};

export const ServiceControls: React.FC<ServiceControlsProps> = ({
  controls,
  className,
  size = 'md',
  orientation = 'horizontal'
}) => {
  const containerClasses = cn(
    'flex gap-2',
    orientation === 'vertical' ? 'flex-col' : 'flex-row flex-wrap',
    className
  );

  const buttonClasses = cn(
    'rounded-md font-medium transition-colors duration-200',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
    sizeStyles[size]
  );

  return (
    <div className={containerClasses}>
      {controls.map((control) => {
        const variantClass = variantStyles[control.variant || 'secondary'];
        const buttonClass = cn(buttonClasses, variantClass);

        return (
          <button
            key={control.id}
            onClick={control.onClick}
            disabled={control.disabled || control.loading}
            className={buttonClass}
            title={control.label}
          >
            <div className="flex items-center justify-center space-x-1">
              {control.loading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                control.icon
              )}
              {size !== 'sm' && <span>{control.label}</span>}
            </div>
          </button>
        );
      })}
    </div>
  );
};