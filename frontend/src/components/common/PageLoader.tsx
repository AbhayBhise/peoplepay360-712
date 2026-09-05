import React from 'react';
import { Loader2 } from 'lucide-react';

export const PageLoader: React.FC<{ label?: string }> = ({
  label = 'Loading workforce intelligence...',
}) => {
  return (
    <div className="min-h-[65vh] flex flex-col items-center justify-center p-8 space-y-5 animate-fade-in">
      <div className="relative flex items-center justify-center">
        {/* Glowing breathing rings */}
        <div className="absolute w-20 h-20 bg-indigo-500/20 rounded-full animate-pulse-glow" />
        <div className="absolute w-14 h-14 bg-teal-400/20 rounded-full animate-ping opacity-30" />
        <div className="w-14 h-14 rounded-2xl bg-linear-to-tr from-indigo-600 via-indigo-500 to-teal-400 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25 border border-white/30 z-10">
          <span className="font-black text-2xl tracking-tighter">P</span>
        </div>
      </div>

      <div className="text-center space-y-2 max-w-xs">
        <p className="text-sm font-bold text-slate-800 tracking-tight flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
          <span>{label}</span>
        </p>
        
        {/* Animated Loading Bar */}
        <div className="w-48 h-1.5 bg-slate-200/80 rounded-full overflow-hidden mx-auto">
          <div className="w-full h-full bg-linear-to-r from-indigo-600 via-teal-400 to-indigo-600 rounded-full skeleton-shimmer" />
        </div>

        <p className="text-2xs text-slate-400 font-medium tracking-wide uppercase">PeoplePay360 Operations</p>
      </div>
    </div>
  );
};

export const RouteFallbackLoader: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 space-y-5 animate-fade-in text-white">
      <div className="relative flex items-center justify-center">
        <div className="absolute w-24 h-24 bg-indigo-500/25 rounded-full animate-pulse-glow" />
        <div className="w-16 h-16 rounded-2xl bg-linear-to-tr from-indigo-600 via-indigo-500 to-teal-400 flex items-center justify-center shadow-2xl border border-white/25 z-10">
          <span className="font-black text-2xl text-white">P</span>
        </div>
      </div>

      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-2 text-sm text-indigo-200">
          <Loader2 className="w-4 h-4 text-teal-400 animate-spin" />
          <span className="font-medium">Initializing secure session...</span>
        </div>
        <div className="w-40 h-1 bg-slate-800 rounded-full overflow-hidden">
          <div className="w-full h-full bg-linear-to-r from-indigo-500 to-teal-400 rounded-full skeleton-shimmer" />
        </div>
      </div>
    </div>
  );
};
