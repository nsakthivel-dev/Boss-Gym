import React from 'react';

export const Skeleton = ({ className = '', ...props }) => (
  <div
    className={`animate-shimmer rounded-md bg-[#ede8dc]/60 ${className}`}
    {...props}
  />
);

export const CardSkeleton = () => (
  <div className="bg-white border border-border rounded-xl p-5 space-y-4 shadow-subtle">
    <div className="flex items-center justify-between">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-8 w-8 rounded-lg" />
    </div>
    <Skeleton className="h-8 w-20" />
    <Skeleton className="h-3 w-40" />
  </div>
);

export const TableSkeleton = ({ rows = 5, cols = 4 }) => (
  <div className="bg-white border border-border rounded-xl p-4 space-y-3 shadow-subtle overflow-hidden">
    <div className="flex gap-4 pb-3 border-b border-border-light">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className="h-4 flex-1" />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, r) => (
      <div key={r} className="flex gap-4 py-2 border-b border-border-light/60 last:border-0 items-center">
        {Array.from({ length: cols }).map((_, c) => (
          <Skeleton key={c} className="h-4 flex-1" />
        ))}
      </div>
    ))}
  </div>
);

export default Skeleton;
