import React from 'react';

const Loading = () => {
  return (
    <div className="glass-strong rounded-2xl p-5 md:p-6 animate-pulse">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6">
        {/* Airline Info Skeleton */}
        <div className="flex items-center gap-4 lg:w-40">
          <div className="w-12 h-12 rounded-xl bg-secondary/80"></div>
          <div className="space-y-2">
            <div className="h-4 w-20 rounded bg-secondary/80"></div>
            <div className="h-3 w-16 rounded bg-secondary/60"></div>
          </div>
        </div>

        {/* Flight Timeline Skeleton */}
        <div className="flex-1 flex items-center gap-4">
          <div className="text-center min-w-[70px] space-y-2">
            <div className="h-6 w-14 mx-auto rounded bg-secondary/80"></div>
            <div className="h-3 w-10 mx-auto rounded bg-secondary/60"></div>
          </div>

          <div className="flex-1 flex flex-col items-center gap-1 px-2">
            <div className="flex items-center w-full gap-2">
              <div className="w-2 h-2 rounded-full bg-secondary/80"></div>
              <div className="flex-1 h-[2px] bg-secondary/60"></div>
              <div className="w-4 h-4 rounded bg-secondary/80"></div>
              <div className="flex-1 h-[2px] bg-secondary/60"></div>
              <div className="w-2 h-2 rounded-full bg-secondary/80"></div>
            </div>
            <div className="h-3 w-16 rounded bg-secondary/60 mt-1"></div>
          </div>

          <div className="text-center min-w-[70px] space-y-2">
            <div className="h-6 w-14 mx-auto rounded bg-secondary/80"></div>
            <div className="h-3 w-10 mx-auto rounded bg-secondary/60"></div>
          </div>
        </div>

        {/* Price & Action Skeleton */}
        <div className="flex items-center justify-between lg:flex-col lg:items-end gap-3 lg:gap-2 pt-4 lg:pt-0 border-t lg:border-t-0 border-border/30">
          <div className="space-y-2 text-right">
            <div className="h-7 w-28 rounded bg-secondary/80"></div>
            <div className="h-3 w-16 rounded bg-secondary/60"></div>
          </div>
          <div className="h-11 w-24 rounded-xl bg-secondary/80"></div>
        </div>
      </div>
    </div>
  );
};

export default Loading;
