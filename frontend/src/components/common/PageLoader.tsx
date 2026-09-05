import React from 'react';
import { Loader2 } from 'lucide-react';

export const PageLoader: React.FC<{ label?: string }> = ({
  label = 'Loading workforce modules...',
}) => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 space-y-4 animate-fade-in">
      <div className="relative flex items-center justify-center">
        {/* Subtle breathing glow */}
        <div className="absolute w-16 h-16 bg-indigo-500/10 rounded-full animate-pulse-subtle" />
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shadow-xs">
          <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
        </div>
      </div>
      <div className="text-center space-y-1">
        <p className="text-xs font-bold text-slate-700 tracking-tight">{label}</p>
        <p className="text-2xs text-slate-400">PeoplePay360 Enterprise Platform</p>
      </div>
    </div>
  );
};

export const RouteFallbackLoader: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 space-y-4 animate-fade-in text-white">
      <div className="w-12 h-12 rounded-2xl bg-linear-to-tr from-indigo-600 to-teal-500 flex items-center justify-center shadow-xl border border-white/20 animate-pulse-subtle">
        <span className="font-black text-xl text-white">P</span>
      </div>
      <div className="flex items-center gap-2 text-xs text-indigo-200">
        <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
        <span className="font-medium">Initializing session...</span>
      </div>
    </div>
  );
};
