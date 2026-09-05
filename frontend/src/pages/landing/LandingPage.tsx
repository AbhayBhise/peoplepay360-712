import React from 'react';
import { LandingNavbar } from './components/LandingNavbar';
import { HeroSection } from './components/HeroSection';
import { ValueStrip } from './components/ValueStrip';
import { FeaturesSection } from './components/FeaturesSection';
import { WorkflowSection } from './components/WorkflowSection';
import { RolesSection } from './components/RolesSection';
import { SecuritySection } from './components/SecuritySection';
import { EcosystemSection } from './components/EcosystemSection';
import { CTASection } from './components/CTASection';
import { LandingFooter } from './components/LandingFooter';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Dynamic Background Ambient Gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-indigo-900/15 rounded-full blur-3xl" />
      </div>

      {/* Top Navigation */}
      <LandingNavbar />

      {/* Page Sections */}
      <main className="relative z-10 flex-1">
        <HeroSection />
        <ValueStrip />
        <FeaturesSection />
        <WorkflowSection />
        <RolesSection />
        <EcosystemSection />
        <SecuritySection />
        <CTASection />
      </main>

      {/* Semantic Footer */}
      <LandingFooter />
    </div>
  );
};

export default LandingPage;
