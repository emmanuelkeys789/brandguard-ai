import React, { useState, useEffect } from 'react';
import { ShieldCheck, Menu, X, ArrowUpRight } from 'lucide-react';

interface NavbarProps {
  onNavigateToApp: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigateToApp }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (e: React.MouseEvent, hash: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const element = document.querySelector(hash);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleOpenWorkspace = (e: React.MouseEvent) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    onNavigateToApp();
  };

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        transition: 'padding var(--transition-normal)',
        padding: isScrolled ? '12px 0' : '18px 0'
      }}
    >
      <div className="container">
        <nav
          aria-label="Main Navigation"
          className="liquid-nav-surface"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 22px',
            borderRadius: 'var(--radius-full)',
            background: isScrolled
              ? 'linear-gradient(135deg, rgba(14, 18, 28, 0.68) 0%, rgba(9, 12, 19, 0.76) 100%)'
              : 'linear-gradient(135deg, rgba(18, 24, 38, 0.48) 0%, rgba(10, 14, 23, 0.58) 100%)',
            backdropFilter: 'blur(28px) saturate(190%)',
            WebkitBackdropFilter: 'blur(28px) saturate(190%)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderTopColor: 'rgba(255, 255, 255, 0.26)',
            borderBottomColor: 'rgba(255, 255, 255, 0.06)',
            boxShadow: isScrolled
              ? 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.22), 0 20px 48px -8px rgba(0, 0, 0, 0.7)'
              : 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.20), 0 16px 36px -10px rgba(0, 0, 0, 0.55)',
            position: 'relative'
          }}
        >
          {/* Subtle top edge liquid reflection highlight */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '12%',
              right: '12%',
              height: '1px',
              background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.32), transparent)',
              pointerEvents: 'none'
            }}
          />

          {/* Ambient Lime Accent Shimmer near Brand Mark */}
          <div
            style={{
              position: 'absolute',
              top: '-4px',
              left: '20px',
              width: '80px',
              height: '36px',
              background: 'radial-gradient(ellipse at center, rgba(214, 255, 112, 0.16) 0%, transparent 70%)',
              filter: 'blur(12px)',
              pointerEvents: 'none'
            }}
          />

          {/* Brand Wordmark */}
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              textDecoration: 'none',
              position: 'relative',
              zIndex: 2
            }}
            aria-label="BrandGuard AI Home"
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, rgba(30, 38, 56, 0.7) 0%, rgba(13, 17, 26, 0.9) 100%)',
                border: '1px solid var(--accent-lime-border)',
                borderTopColor: 'rgba(214, 255, 112, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 14px rgba(214, 255, 112, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
              }}
            >
              <ShieldCheck size={18} color="var(--accent-lime)" strokeWidth={2.2} />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span
                style={{
                  fontWeight: 700,
                  fontSize: '17px',
                  letterSpacing: '-0.03em',
                  color: 'var(--text-primary)'
                }}
              >
                BrandGuard
              </span>
              <span
                style={{
                  fontWeight: 600,
                  fontSize: '11px',
                  letterSpacing: '0.06em',
                  color: 'var(--accent-lime)',
                  background: 'var(--accent-lime-dim)',
                  padding: '1px 6px',
                  borderRadius: '4px',
                  border: '1px solid var(--accent-lime-border)'
                }}
              >
                AI
              </span>
            </div>
          </a>

          {/* Desktop Nav Links */}
          <div
            className="navbar-desktop-links"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '30px',
              position: 'relative',
              zIndex: 2
            }}
          >
            <a
              href="#product"
              onClick={(e) => handleNavClick(e, '#product')}
              className="navbar-link"
              style={{
                fontSize: '14px',
                fontWeight: 500,
                color: 'var(--text-secondary)',
                transition: 'color var(--transition-fast)'
              }}
            >
              Product
            </a>
            <a
              href="#workflow"
              onClick={(e) => handleNavClick(e, '#workflow')}
              className="navbar-link"
              style={{
                fontSize: '14px',
                fontWeight: 500,
                color: 'var(--text-secondary)',
                transition: 'color var(--transition-fast)'
              }}
            >
              Workflow
            </a>
            <a
              href="#trust"
              onClick={(e) => handleNavClick(e, '#trust')}
              className="navbar-link"
              style={{
                fontSize: '14px',
                fontWeight: 500,
                color: 'var(--text-secondary)',
                transition: 'color var(--transition-fast)'
              }}
            >
              Trust & Responsibility
            </a>
          </div>

          {/* Action CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative', zIndex: 2 }}>
            {/* Desktop Open Workspace Button */}
            <a
              href="/app"
              onClick={handleOpenWorkspace}
              className="btn btn-primary btn-sm navbar-desktop-cta"
              id="landing-open-workspace-btn"
            >
              <span>Open workspace</span>
              <ArrowUpRight size={15} />
            </a>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
              aria-expanded={mobileMenuOpen}
              className="navbar-mobile-toggle"
              style={{
                display: 'none',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)'
              }}
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </nav>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div
            className="liquid-glass"
            style={{
              marginTop: '10px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              boxShadow: 'var(--glass-shadow-elevated)'
            }}
          >
            <a
              href="#product"
              onClick={(e) => handleNavClick(e, '#product')}
              style={{
                textAlign: 'left',
                padding: '10px 0',
                borderBottom: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                fontWeight: 500,
                fontSize: '15px'
              }}
            >
              Product Capabilities
            </a>
            <a
              href="#workflow"
              onClick={(e) => handleNavClick(e, '#workflow')}
              style={{
                textAlign: 'left',
                padding: '10px 0',
                borderBottom: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                fontWeight: 500,
                fontSize: '15px'
              }}
            >
              Governance Workflow
            </a>
            <a
              href="#trust"
              onClick={(e) => handleNavClick(e, '#trust')}
              style={{
                textAlign: 'left',
                padding: '10px 0',
                borderBottom: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                fontWeight: 500,
                fontSize: '15px'
              }}
            >
              Trust & Responsible AI
            </a>
            <div style={{ paddingTop: '8px' }}>
              <a
                href="/app"
                onClick={handleOpenWorkspace}
                className="btn btn-primary"
                style={{ width: '100%' }}
                id="landing-mobile-open-workspace-btn"
              >
                <span>Open workspace</span>
                <ArrowUpRight size={16} />
              </a>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .navbar-desktop-links {
            display: none !important;
          }
          .navbar-desktop-cta {
            display: none !important;
          }
          .navbar-mobile-toggle {
            display: flex !important;
          }
        }
        .navbar-link:hover {
          color: var(--text-primary) !important;
        }
      `}</style>
    </header>
  );
};
