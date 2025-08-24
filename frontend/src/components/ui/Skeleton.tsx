import React from 'react';
import { cn } from '../../utils/cn';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className, ...props }) => {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-gray-200", className)}
      {...props}
    />
  );
};

export const SkeletonText: React.FC<SkeletonProps> = ({ className, ...props }) => {
  return <Skeleton className={cn("h-4 w-full", className)} {...props} />;
};

export const SkeletonTitle: React.FC<SkeletonProps> = ({ className, ...props }) => {
  return <Skeleton className={cn("h-6 w-3/4", className)} {...props} />;
};

export const SkeletonAvatar: React.FC<SkeletonProps> = ({ className, ...props }) => {
  return (
    <Skeleton
      className={cn("h-10 w-10 rounded-full", className)}
      {...props}
    />
  );
};

export const SkeletonButton: React.FC<SkeletonProps> = ({ className, ...props }) => {
  return (
    <Skeleton
      className={cn("h-10 w-24 rounded-md", className)}
      {...props}
    />
  );
};

export const SkeletonCard: React.FC<SkeletonProps> = ({ className, ...props }) => {
  return (
    <div className={cn("rounded-lg border bg-white p-4 shadow-sm", className)} {...props}>
      <div className="space-y-3">
        <SkeletonTitle />
        <SkeletonText />
        <SkeletonText className="w-2/3" />
        <div className="flex space-x-2">
          <SkeletonButton />
          <SkeletonButton />
        </div>
      </div>
    </div>
  );
};

export const ServiceCardSkeleton: React.FC = () => {
  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <div className="flex items-center space-x-4">
        <SkeletonAvatar className="h-12 w-12" />
        <div className="space-y-2 flex-1">
          <SkeletonTitle className="h-5 w-1/3" />
          <SkeletonText className="h-4 w-1/2" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <div className="mt-4 space-y-2">
        <SkeletonText />
        <SkeletonText className="w-4/5" />
      </div>
    </div>
  );
};

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <SkeletonTitle className="h-8 w-1/3" />
        <SkeletonText className="w-1/2" />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="flex items-center">
              <SkeletonAvatar className="h-8 w-8" />
              <div className="ml-4 space-y-1">
                <SkeletonText className="h-4 w-16" />
                <SkeletonTitle className="h-6 w-12" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Service Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <ServiceCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
};

export default Skeleton;