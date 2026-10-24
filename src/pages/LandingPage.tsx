import React from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { HeroSection } from '../components/landing/HeroSection';
import { LiquidCarousel } from '../components/landing/LiquidCarousel';
import { WorkflowSection } from '../components/landing/WorkflowSection';
import { TrustSection } from '../components/landing/TrustSection';
import { CtaBanner } from '../components/landing/CtaBanner';

interface LandingPageProps {
  onNavigateToApp: (initialTab?: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigateToApp }) => {
  const scrollToWorkflow = () => {
    const el = document.getElementById('workflow');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navigation Header */}
      <Navbar onNavigateToApp={() => onNavigateToApp('overview')} />

      {/* Main Page Sections */}
      <main style={{ flex: 1 }}>
        {/* Hero Section */}
        <HeroSection
          onStartReview={() => onNavigateToApp('review')}
          onExploreWorkflow={scrollToWorkflow}
        />

        {/* Liquid-glass Interactive Capabilities Carousel */}
        <LiquidCarousel />

        {/* 4-Stage Governance Workflow */}
        <WorkflowSection />

        {/* Trust & Responsible AI Principles */}
        <TrustSection />

        {/* Pre-footer Call to Action */}
        <CtaBanner onNavigateToApp={() => onNavigateToApp('overview')} />
      </main>

      {/* Footer */}
      <Footer onNavigateToApp={() => onNavigateToApp('overview')} />
    </div>
  );
};
