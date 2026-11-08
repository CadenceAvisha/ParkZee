import React from 'react';

export const LoadingSkeleton: React.FC<{ count?: number; className?: string }> = ({
  count = 3,
  className = 'h-24 w-full',
}) => {
  return (
    <div className="space-y-4 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`animate-pulse bg-slate-200/70 rounded-xl ${className}`}
        />
      ))}
    </div>
  );
};
