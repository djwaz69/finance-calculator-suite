import React, { useState } from 'react';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import EMICalculator from './components/calculators/EMICalculator';
import PrepaymentCalculator from './components/calculators/PrepaymentCalculator';
import TenureCalculator from './components/calculators/TenureCalculator';
import FDvsLoan from './components/calculators/FDvsLoan';
import MutualFundCalculator from './components/calculators/MutualFundCalculator';
import FinancialAdvisor from './components/advisor/FinancialAdvisor';

const COLORS = {
  light: {
    background: 'linear-gradient(135deg, #f0f4ff 0%, #e8f5ff 50%, #f0fff4 100%)',
    card: 'rgba(255,255,255,0.92)',
    glass: 'rgba(255,255,255,0.65)',
    border: '1.5px solid rgba(0, 122, 255, 0.12)',
    text: '#1a1a2e',
    accent: '#007AFF',
    accent2: '#00C6AE',
    shadow: '0 8px 32px 0 rgba(31, 38, 135, 0.10)',
    footer: '#555',
    navActive: 'linear-gradient(90deg, #007AFF 0%, #00C6AE 100%)',
    navInactive: 'transparent',
    navText: '#444',
    glassBlur: 'blur(20px)',
    subtleText: '#666',
  },
  dark: {
    background: 'linear-gradient(135deg, #0f0f17 0%, #1a1a2e 50%, #16213e 100%)',
    card: 'rgba(26,26,46,0.92)',
    glass: 'rgba(26,26,46,0.65)',
    border: '1.5px solid rgba(0, 198, 174, 0.15)',
    text: '#e8e8f0',
    accent: '#00C6AE',
    accent2: '#4da6ff',
    shadow: '0 8px 32px 0 rgba(0,0,0,0.35)',
    footer: '#aaa',
    navActive: 'linear-gradient(90deg, #00C6AE 0%, #4da6ff 100%)',
    navInactive: 'transparent',
    navText: '#bbb',
    glassBlur: 'blur(20px)',
    subtleText: '#999',
  }
};

const TOOLS = [
  {
    key: 'emi',
    label: 'EMI Calculator',
    icon: '🏦',
    desc: 'Calculate monthly EMI, total interest payable, and get the full month-by-month amortization schedule.',
    gradient: 'linear-gradient(135deg, #007AFF 0%, #00C6AE 100%)',
    tag: 'Loans',
  },
  {
    key: 'prepayment',
    label: 'Interest Calculator',
    icon: '📅',
    desc: 'Track daily and monthly interest accumulation on your outstanding loan balance with a visual timeline.',
    gradient: 'linear-gradient(135deg, #00C6AE 0%, #00b894 100%)',
    tag: 'Loans',
  },
  {
    key: 'tenure',
    label: 'Tenure Calculator',
    icon: '⏱️',
    desc: 'Enter your desired EMI to find how many months it takes to fully repay your loan.',
    gradient: 'linear-gradient(135deg, #FF6B6B 0%, #ee5a24 100%)',
    tag: 'Loans',
  },
  {
    key: 'fdloan',
    label: 'FD vs Loan Prepayment',
    icon: '⚖️',
    desc: 'Compare whether prepaying your loan or investing the same amount in a Fixed Deposit gives you more.',
    gradient: 'linear-gradient(135deg, #a29bfe 0%, #6c5ce7 100%)',
    tag: 'Comparison',
  },
  {
    key: 'mutualfund',
    label: 'Investment Planner',
    icon: '📈',
    desc: 'Plan SIP with step-up, Lumpsum, SWP (withdrawal), FIRE corpus, and retirement income—all in one.',
    gradient: 'linear-gradient(135deg, #fdcb6e 0%, #e17055 100%)',
    tag: 'Investment',
  },
  {
    key: 'advisor',
    label: 'Financial Advisor',
    icon: '🧑‍💼',
    desc: 'Get a personalized plan: insurance coverage, SIP allocation, emergency fund, 10-year projection & more.',
    gradient: 'linear-gradient(135deg, #00b894 0%, #00cec9 100%)',
    tag: 'Planning',
  },
];

const sections = [
  { key: 'emi', label: 'EMI' },
  { key: 'prepayment', label: 'Interest' },
  { key: 'tenure', label: 'Tenure' },
  { key: 'fdloan', label: 'FD vs Loan' },
  { key: 'mutualfund', label: 'Investments' },
  { key: 'advisor', label: 'Advisor' },
];

function ToolCard({ tool, theme, onSelect }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={() => onSelect(tool.key)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: theme.card,
        border: theme.border,
        borderRadius: 20,
        padding: '28px 24px',
        cursor: 'pointer',
        boxShadow: hovered
          ? '0 20px 48px rgba(0,0,0,0.18)'
          : theme.shadow,
        transform: hovered ? 'translateY(-6px)' : 'translateY(0)',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle background glow */}
      <div style={{
        position: 'absolute', top: -30, right: -30,
        width: 100, height: 100,
        background: tool.gradient,
        opacity: 0.08,
        borderRadius: '50%',
        filter: 'blur(20px)',
      }} />

      {/* Tag */}
      <div style={{
        position: 'absolute', top: 16, right: 16,
        fontSize: 11, fontWeight: 700,
        background: tool.gradient,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
      }}>
        {tool.tag}
      </div>

      {/* Icon */}
      <div style={{
        width: 60, height: 60,
        borderRadius: 18,
        background: tool.gradient,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 30,
        boxShadow: '0 6px 16px rgba(0,0,0,0.18)',
        flexShrink: 0,
      }}>
        {tool.icon}
      </div>

      {/* Content */}
      <div style={{ flex: 1 }}>
        <div style={{
          fontWeight: 700, fontSize: 18,
          color: theme.text, marginBottom: 8,
          lineHeight: 1.3,
        }}>
          {tool.label}
        </div>
        <div style={{
          fontSize: 13.5, color: theme.subtleText,
          lineHeight: 1.6,
        }}>
          {tool.desc}
        </div>
      </div>

      {/* CTA */}
      <div style={{
        padding: '10px 18px',
        borderRadius: 12,
        background: hovered ? tool.gradient : 'transparent',
        border: hovered ? 'none' : `1.5px solid rgba(128,128,128,0.2)`,
        color: hovered ? '#fff' : theme.subtleText,
        fontWeight: 600,
        fontSize: 14,
        textAlign: 'center',
        transition: 'all 0.25s ease',
        letterSpacing: 0.3,
      }}>
        {hovered ? 'Open Calculator →' : 'Launch →'}
      </div>
    </div>
  );
}

function HomePage({ theme, setSection }) {
  return (
    <div>
      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '24px 0 48px 0' }}>
        <div style={{
          display: 'inline-block',
          padding: '6px 18px',
          borderRadius: 20,
          background: theme.navActive,
          color: '#fff',
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: 1,
          textTransform: 'uppercase',
          marginBottom: 20,
        }}>
          Smart Financial Tools
        </div>
        <h1 style={{
          fontWeight: 800, fontSize: 'clamp(28px, 4vw, 44px)',
          background: theme.navActive,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: 16, lineHeight: 1.2,
        }}>
          Your Complete Financial Toolkit
        </h1>
        <p style={{
          fontSize: 16, color: theme.subtleText,
          maxWidth: 520, margin: '0 auto',
          lineHeight: 1.7,
        }}>
          Plan loans, calculate EMIs, compare investments, and build your personalized financial roadmap — all offline, all instant.
        </p>

        {/* Stats row */}
        <div style={{
          display: 'flex', justifyContent: 'center',
          gap: 32, marginTop: 32,
          flexWrap: 'wrap',
        }}>
          {[
            { value: '6', label: 'Calculators' },
            { value: '100%', label: 'Offline' },
            { value: '₹', label: 'INR Focused' },
          ].map(stat => (
            <div key={stat.label} style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: 28, fontWeight: 800,
                background: theme.navActive,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                {stat.value}
              </div>
              <div style={{ fontSize: 12, color: theme.subtleText, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32,
      }}>
        <div style={{ flex: 1, height: 1, background: theme.border.split(' ').slice(2).join(' ') }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: theme.subtleText, whiteSpace: 'nowrap' }}>Choose a Calculator</span>
        <div style={{ flex: 1, height: 1, background: theme.border.split(' ').slice(2).join(' ') }} />
      </div>

      {/* Tool Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 20,
      }}>
        {TOOLS.map(tool => (
          <ToolCard key={tool.key} tool={tool} theme={theme} onSelect={setSection} />
        ))}
      </div>

      {/* Footer note */}
      <div style={{
        textAlign: 'center', marginTop: 44,
        fontSize: 12, color: theme.subtleText,
        lineHeight: 1.8,
      }}>
        🔒 All calculations run locally on your device. No data leaves your browser.
      </div>
    </div>
  );
}

export default function App() {
  const [dark, setDark] = useState(false);
  const [section, setSection] = useState('home');
  const theme = dark ? COLORS.dark : COLORS.light;

  React.useEffect(() => {
    document.body.style.background = dark ? '#0f0f17' : '#f0f4ff';
    document.body.style.color = theme.text;
    document.body.style.margin = '0';
  }, [dark, theme.text]);

  const isHome = section === 'home';

  return (
    <div style={{
      minHeight: '100vh',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Arial, sans-serif',
      background: theme.background,
      transition: 'background 0.4s ease',
    }}>
      <Header
        theme={theme}
        sections={sections}
        section={section}
        setSection={setSection}
        dark={dark}
        setDark={setDark}
      />

      <main style={{
        maxWidth: isHome ? 1100 : 860,
        margin: '2rem auto',
        padding: '2rem 1.5rem',
        borderRadius: 28,
        background: theme.card,
        boxShadow: theme.shadow,
        border: theme.border,
        backdropFilter: theme.glassBlur,
        WebkitBackdropFilter: theme.glassBlur,
        position: 'relative',
        overflow: 'hidden',
        transition: 'max-width 0.35s ease',
      }}>
        {/* Decorative blobs */}
        <div style={{
          position: 'absolute', top: '-60px', left: '-60px',
          width: 220, height: 220,
          background: `radial-gradient(circle at 40% 40%, ${theme.accent}44 0%, ${theme.accent}08 100%)`,
          filter: 'blur(40px)', zIndex: 0, pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '-60px', right: '-60px',
          width: 200, height: 200,
          background: `radial-gradient(circle at 60% 60%, ${theme.accent2}44 0%, ${theme.accent2}08 100%)`,
          filter: 'blur(40px)', zIndex: 0, pointerEvents: 'none',
        }} />

        {/* Back to Home button (shown on all non-home pages) */}
        {!isHome && (
          <div style={{ position: 'relative', zIndex: 1, marginBottom: 8 }}>
            <button
              onClick={() => setSection('home')}
              style={{
                background: 'none', border: 'none',
                color: theme.accent, cursor: 'pointer',
                fontWeight: 600, fontSize: 14,
                padding: '4px 0', display: 'flex',
                alignItems: 'center', gap: 6,
                opacity: 0.8,
              }}
            >
              ← All Tools
            </button>
          </div>
        )}

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          {isHome && <HomePage theme={theme} setSection={setSection} />}
          {section === 'emi' && <EMICalculator theme={theme} />}
          {section === 'prepayment' && <PrepaymentCalculator theme={theme} />}
          {section === 'tenure' && <TenureCalculator theme={theme} />}
          {section === 'fdloan' && <FDvsLoan theme={theme} />}
          {section === 'mutualfund' && <MutualFundCalculator theme={theme} />}
          {section === 'advisor' && <FinancialAdvisor theme={theme} />}
        </div>
      </main>

      <Footer theme={theme} />
    </div>
  );
}
