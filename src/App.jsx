import React, { useState } from 'react';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import EMICalculator from './components/calculators/EMICalculator';
import EMIAdvancedCalculator from './components/calculators/EMIAdvancedCalculator';
import PrepaymentCalculator from './components/calculators/PrepaymentCalculator';
import TenureCalculator from './components/calculators/TenureCalculator';
import FDvsLoan from './components/calculators/FDvsLoan';
import MutualFundCalculator from './components/calculators/MutualFundCalculator';
import GratuityCalculator from './components/calculators/GratuityCalculator';
import IncomeTaxCalculator from './components/calculators/IncomeTaxCalculator';
import CompoundInterestCalculator from './components/calculators/CompoundInterestCalculator';
import InflationCalculator from './components/calculators/InflationCalculator';
import FinancialAdvisor from './components/advisor/FinancialAdvisor';

const COLORS = {
  light: {
    background: 'linear-gradient(135deg, #f0f4ff 0%, #e8f5ff 50%, #f0fff4 100%)',
    card: 'rgba(255,255,255,0.92)',
    glass: 'rgba(255,255,255,0.65)',
    border: '1.5px solid rgba(0, 122, 255, 0.12)',
    dividerColor: 'rgba(0, 122, 255, 0.12)',
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
    dividerColor: 'rgba(0, 198, 174, 0.15)',
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

// Categories with their tools
const CATEGORIES = [
  {
    key: 'loans',
    label: 'Loan Calculators',
    icon: '🏦',
    color: '#007AFF',
    tools: [
      {
        key: 'emi',
        label: 'EMI Calculator',
        icon: '🏦',
        desc: 'Calculate monthly EMI, total interest payable, and full month-by-month amortization schedule.',
        gradient: 'linear-gradient(135deg, #007AFF 0%, #00C6AE 100%)',
        tag: 'Loans',
      },
      {
        key: 'emi-advanced',
        label: 'EMI Advanced',
        icon: '🔢',
        desc: 'Advanced EMI with prepayments, floating rate changes, moratorium period, and detailed amortization.',
        gradient: 'linear-gradient(135deg, #0052cc 0%, #007AFF 100%)',
        tag: 'Loans',
      },
      {
        key: 'prepayment',
        label: 'Interest Calculator',
        icon: '📅',
        desc: 'Track daily and monthly interest accumulation on your outstanding loan balance.',
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
        desc: 'Compare whether prepaying your loan or investing in a Fixed Deposit gives you more.',
        gradient: 'linear-gradient(135deg, #a29bfe 0%, #6c5ce7 100%)',
        tag: 'Comparison',
      },
      {
        key: 'gratuity',
        label: 'Gratuity Calculator',
        icon: '🎁',
        desc: 'Calculate your gratuity amount based on last drawn salary and years of service.',
        gradient: 'linear-gradient(135deg, #fd79a8 0%, #e84393 100%)',
        tag: 'Loans',
      },
    ]
  },
  {
    key: 'investment',
    label: 'Investment & Planning',
    icon: '📈',
    color: '#fdcb6e',
    tools: [
      {
        key: 'mutualfund',
        label: 'Investment Planner',
        icon: '📈',
        desc: 'Plan SIP with step-up, Lumpsum, SWP (withdrawal), FIRE corpus, and retirement income.',
        gradient: 'linear-gradient(135deg, #fdcb6e 0%, #e17055 100%)',
        tag: 'Investment',
      },
      {
        key: 'compound',
        label: 'Compound Interest',
        icon: '💹',
        desc: 'Calculate future value of lumpsum + regular deposits with any compounding frequency.',
        gradient: 'linear-gradient(135deg, #00b894 0%, #00cec9 100%)',
        tag: 'Investment',
      },
      {
        key: 'inflation',
        label: 'Inflation Calculator',
        icon: '📊',
        desc: 'See how inflation erodes purchasing power and the future cost of goods over time.',
        gradient: 'linear-gradient(135deg, #e17055 0%, #d63031 100%)',
        tag: 'General',
      },
      {
        key: 'advisor',
        label: 'Financial Advisor',
        icon: '🧑‍💼',
        desc: 'Get a personalized plan: insurance coverage, SIP allocation, emergency fund & 10-year projection.',
        gradient: 'linear-gradient(135deg, #00b894 0%, #00cec9 100%)',
        tag: 'Planning',
      },
    ]
  },
  {
    key: 'tax',
    label: 'Tax & Compliance',
    icon: '🧾',
    color: '#6c5ce7',
    tools: [
      {
        key: 'incometax',
        label: 'Income Tax Calculator',
        icon: '🧾',
        desc: 'AY 26-27 & 27-28 tax calculator with New & Old regime, all deductions, and tax-saving suggestions.',
        gradient: 'linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)',
        tag: 'Tax',
      },
    ]
  },
];

// Flat list of all tools for nav sections
const sections = [
  { key: 'emi', label: 'EMI' },
  { key: 'emi-advanced', label: 'EMI+' },
  { key: 'prepayment', label: 'Interest' },
  { key: 'tenure', label: 'Tenure' },
  { key: 'fdloan', label: 'FD vs Loan' },
  { key: 'gratuity', label: 'Gratuity' },
  { key: 'mutualfund', label: 'Investments' },
  { key: 'compound', label: 'Compound' },
  { key: 'inflation', label: 'Inflation' },
  { key: 'incometax', label: 'Income Tax' },
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
        padding: '24px 20px',
        cursor: 'pointer',
        boxShadow: hovered ? '0 20px 48px rgba(0,0,0,0.18)' : theme.shadow,
        transform: hovered ? 'translateY(-6px)' : 'translateY(0)',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
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
        position: 'absolute', top: 14, right: 14,
        fontSize: 10, fontWeight: 700,
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
        width: 52, height: 52,
        borderRadius: 16,
        background: tool.gradient,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 26,
        boxShadow: '0 6px 16px rgba(0,0,0,0.18)',
        flexShrink: 0,
      }}>
        {tool.icon}
      </div>

      {/* Content */}
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 16, color: theme.text, marginBottom: 6, lineHeight: 1.3 }}>
          {tool.label}
        </div>
        <div style={{ fontSize: 13, color: theme.subtleText, lineHeight: 1.6 }}>
          {tool.desc}
        </div>
      </div>

      {/* CTA */}
      <div style={{
        padding: '8px 16px',
        borderRadius: 10,
        background: hovered ? tool.gradient : 'transparent',
        border: hovered ? 'none' : `1.5px solid rgba(128,128,128,0.2)`,
        color: hovered ? '#fff' : theme.subtleText,
        fontWeight: 600,
        fontSize: 13,
        textAlign: 'center',
        transition: 'all 0.25s ease',
      }}>
        {hovered ? 'Open Calculator →' : 'Launch →'}
      </div>
    </div>
  );
}

function CategorySection({ category, theme, setSection }) {
  return (
    <div style={{ marginBottom: 40 }}>
      {/* Category Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: `linear-gradient(135deg, ${category.color}cc, ${category.color}88)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18,
        }}>
          {category.icon}
        </div>
        <h2 style={{
          fontSize: 20, fontWeight: 800, margin: 0,
          color: theme.text,
        }}>
          {category.label}
        </h2>
        <div style={{
          flex: 1, height: 1,
          background: theme.dividerColor,
          marginLeft: 8,
        }} />
        <span style={{
          fontSize: 11, fontWeight: 600,
          color: theme.subtleText,
          textTransform: 'uppercase', letterSpacing: 0.5,
        }}>
          {category.tools.length} tool{category.tools.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Tool Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: 16,
      }}>
        {category.tools.map(tool => (
          <ToolCard key={tool.key} tool={tool} theme={theme} onSelect={setSection} />
        ))}
      </div>
    </div>
  );
}

function HomePage({ theme, setSection }) {
  const totalTools = CATEGORIES.reduce((acc, c) => acc + c.tools.length, 0);

  return (
    <div>
      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '24px 0 40px 0' }}>
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
          Plan loans, calculate taxes, compare investments, and build your personalized financial roadmap — all offline, all instant.
        </p>

        {/* Stats row */}
        <div style={{
          display: 'flex', justifyContent: 'center',
          gap: 32, marginTop: 32,
          flexWrap: 'wrap',
        }}>
          {[
            { value: String(totalTools), label: 'Calculators' },
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

      {/* Categorized tool sections */}
      {CATEGORIES.map(cat => (
        <CategorySection key={cat.key} category={cat} theme={theme} setSection={setSection} />
      ))}

      {/* Footer note */}
      <div style={{
        textAlign: 'center', marginTop: 32,
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
        maxWidth: isHome ? 1100 : 900,
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
          {section === 'emi-advanced' && <EMIAdvancedCalculator theme={theme} />}
          {section === 'prepayment' && <PrepaymentCalculator theme={theme} />}
          {section === 'tenure' && <TenureCalculator theme={theme} />}
          {section === 'fdloan' && <FDvsLoan theme={theme} />}
          {section === 'gratuity' && <GratuityCalculator theme={theme} />}
          {section === 'mutualfund' && <MutualFundCalculator theme={theme} />}
          {section === 'compound' && <CompoundInterestCalculator theme={theme} />}
          {section === 'inflation' && <InflationCalculator theme={theme} />}
          {section === 'incometax' && <IncomeTaxCalculator theme={theme} />}
          {section === 'advisor' && <FinancialAdvisor theme={theme} />}
        </div>
      </main>

      <Footer theme={theme} />
    </div>
  );
}
