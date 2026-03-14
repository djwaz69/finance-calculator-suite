import React, { useState } from 'react';
import logo from '../../assets/logo.jpg';

export default function Header({ theme, sections, section, setSection, dark, setDark }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <style>{`
        .nav-btn { transition: background 0.2s, color 0.2s; }
        .nav-btn:hover { opacity: 0.85; }
        @media (max-width: 768px) {
          .header-nav-desktop { display: none !important; }
          .header-hamburger { display: flex !important; }
        }
        @media (min-width: 769px) {
          .header-hamburger { display: none !important; }
          .mobile-menu { display: none !important; }
        }
      `}</style>

      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.85rem 1.5rem',
        boxShadow: theme.shadow,
        background: theme.glass,
        borderBottom: theme.border,
        position: 'sticky', top: 0, zIndex: 100,
        backdropFilter: theme.glassBlur,
        WebkitBackdropFilter: theme.glassBlur,
      }}>
        {/* Logo + Title */}
        <button
          onClick={() => { setSection('home'); setMenuOpen(false); }}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.7rem',
            background: 'none', border: 'none', cursor: 'pointer',
            padding: 0,
          }}
          aria-label="Go to home"
        >
          <img src={logo} alt="Logo" style={{
            height: 38, width: 38,
            borderRadius: 10,
            objectFit: 'cover',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
          }} />
          <div>
            <div style={{
              fontWeight: 800, fontSize: 18,
              background: theme.navActive,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              lineHeight: 1.2,
            }}>
              FinanceCalc
            </div>
            <div style={{ fontSize: 10, color: theme.subtleText || theme.navText, fontWeight: 500, letterSpacing: 0.5 }}>
              Smart Financial Tools
            </div>
          </div>
        </button>

        {/* Desktop Nav */}
        <div className="header-nav-desktop" style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {sections.map(s => (
            <button
              key={s.key}
              className="nav-btn"
              tabIndex={0}
              onClick={() => setSection(s.key)}
              onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setSection(s.key)}
              style={{
                background: section === s.key ? theme.navActive : theme.navInactive,
                color: section === s.key ? '#fff' : theme.navText,
                border: section === s.key ? 'none' : `1.5px solid rgba(128,128,128,0.15)`,
                borderRadius: 10, padding: '6px 14px',
                fontWeight: 600, fontSize: 13.5,
                cursor: 'pointer',
                boxShadow: section === s.key ? '0 2px 12px rgba(0,122,255,0.25)' : 'none',
                whiteSpace: 'nowrap',
              }}
            >
              {s.label}
            </button>
          ))}

          {/* Theme toggle */}
          <button
            aria-label="Toggle dark mode"
            onClick={() => setDark(d => !d)}
            style={{
              background: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
              border: theme.border,
              borderRadius: 10,
              width: 38, height: 38,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginLeft: 4, cursor: 'pointer', fontSize: 18,
              transition: 'background 0.2s',
            }}
          >
            {dark ? '🌙' : '☀️'}
          </button>

          {/* Install App */}
          <button
            onClick={() => alert('To install on iOS: Tap Share → Add to Home Screen.\nTo install on Android: Tap ⋮ → Add to Home Screen.')}
            style={{
              background: theme.navActive, color: '#fff',
              border: 'none', padding: '7px 14px',
              borderRadius: 10, fontWeight: 600,
              cursor: 'pointer', fontSize: 12.5,
              boxShadow: '0 2px 8px rgba(0,122,255,0.25)',
              whiteSpace: 'nowrap',
            }}
          >
            + Install
          </button>
        </div>

        {/* Mobile Right Controls */}
        <div className="header-hamburger" style={{ display: 'none', alignItems: 'center', gap: 8 }}>
          <button
            aria-label="Toggle dark mode"
            onClick={() => setDark(d => !d)}
            style={{
              background: 'none', border: theme.border, borderRadius: 8,
              width: 36, height: 36, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', fontSize: 16,
            }}
          >
            {dark ? '🌙' : '☀️'}
          </button>
          <button
            aria-label="Toggle menu"
            onClick={() => setMenuOpen(m => !m)}
            style={{
              background: menuOpen ? theme.navActive : 'none',
              border: theme.border, borderRadius: 8,
              width: 36, height: 36,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 4, cursor: 'pointer', padding: 0,
            }}
          >
            {menuOpen ? (
              <span style={{ color: '#fff', fontSize: 18, lineHeight: 1 }}>✕</span>
            ) : (
              <>
                <span style={{ width: 18, height: 2, background: theme.navText, borderRadius: 2, display: 'block' }} />
                <span style={{ width: 18, height: 2, background: theme.navText, borderRadius: 2, display: 'block' }} />
                <span style={{ width: 18, height: 2, background: theme.navText, borderRadius: 2, display: 'block' }} />
              </>
            )}
          </button>
        </div>
      </header>

      {/* Mobile Dropdown Menu */}
      {menuOpen && (
        <div className="mobile-menu" style={{
          background: theme.card,
          borderBottom: theme.border,
          backdropFilter: theme.glassBlur,
          WebkitBackdropFilter: theme.glassBlur,
          padding: '12px 16px',
          display: 'flex', flexDirection: 'column', gap: 6,
          boxShadow: theme.shadow,
          position: 'sticky', top: 62, zIndex: 99,
        }}>
          {sections.map(s => (
            <button
              key={s.key}
              onClick={() => { setSection(s.key); setMenuOpen(false); }}
              style={{
                background: section === s.key ? theme.navActive : theme.glass,
                color: section === s.key ? '#fff' : theme.navText,
                border: 'none', borderRadius: 10,
                padding: '10px 16px',
                fontWeight: 600, fontSize: 15,
                cursor: 'pointer', textAlign: 'left',
              }}
            >
              {s.label}
            </button>
          ))}
          <button
            onClick={() => alert('To install on iOS: Tap Share → Add to Home Screen.\nTo install on Android: Tap ⋮ → Add to Home Screen.')}
            style={{
              background: theme.navActive, color: '#fff',
              border: 'none', borderRadius: 10,
              padding: '10px 16px',
              fontWeight: 600, fontSize: 15,
              cursor: 'pointer', marginTop: 4,
            }}
          >
            + Install App
          </button>
        </div>
      )}
    </>
  );
}
