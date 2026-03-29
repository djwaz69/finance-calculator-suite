import React, { useState, useEffect, useRef } from 'react';

const SEARCH_DATA = [
    { title: 'EMI Calculator', keywords: ['loan', 'home', 'car', 'monthly', 'installment', 'mortgage', 'amortization', 'disbursement'], route: 'emi', icon: '🏦' },
    { title: 'Interest Calculator', keywords: ['prepayment', 'simple', 'daily', 'monthly', 'snapshot', 'accumulation', 'pre emi', 'pre-emi'], route: 'prepayment', icon: '📅' },
    { title: 'Tenure Calculator', keywords: ['time', 'duration', 'months', 'years', 'repay', 'term', 'extension'], route: 'tenure', icon: '⏱️' },
    { title: 'FD vs Loan Prepayment', keywords: ['compare', 'fixed deposit', 'investment', 'save', 'better'], route: 'fdloan', icon: '⚖️' },
    { title: 'Investment Planner', keywords: ['mutual fund', 'sip', 'lumpsum', 'swp', 'fire', 'retirement', 'wealth'], route: 'mutualfund', icon: '📈' },
    { title: 'Financial Advisor', keywords: ['plan', 'insurance', 'emergency', 'projection', 'allocation', 'portfolio'], route: 'advisor', icon: '🧑‍💼' },
];

export default function GlobalSearch({ theme, isOpen, onClose, onSelect }) {
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [results, setResults] = useState([]);
    const inputRef = useRef(null);

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current.focus(), 50); // Small delay for rendering
        }
        if (!isOpen) {
            setQuery('');
            setDebouncedQuery('');
            setResults([]);
        }
    }, [isOpen]);

    // Debounce Logic (150ms for lower-end processors)
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedQuery(query);
        }, 150);
        return () => clearTimeout(handler);
    }, [query]);

    // Search & Scoring Logic
    useEffect(() => {
        if (!debouncedQuery.trim()) {
            setResults([]);
            return;
        }

        const normalizedQuery = debouncedQuery.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
        if (!normalizedQuery) {
            setResults([]);
            return;
        }

        const scoredResults = SEARCH_DATA.map(item => {
            let score = 0;
            const normalizedTitle = item.title.toLowerCase().replace(/[^a-z0-9 ]/g, '');
            
            // 10 points for title match
            if (normalizedTitle.includes(normalizedQuery)) {
                score += 10;
            }

            // 5 points for keyword match
            const keywordMatch = item.keywords.some(kw => kw.toLowerCase().includes(normalizedQuery));
            if (keywordMatch) {
                score += 5;
            }

            return { ...item, score };
        }).filter(item => item.score > 0)
          .sort((a, b) => b.score - a.score);

        setResults(scoredResults);
    }, [debouncedQuery]);

    // Highlight matching text visually
    const highlightText = (text, highlight) => {
        if (!highlight.trim()) return text;
        const regex = new RegExp(`(${highlight.replace(/[^a-zA-Z0-9 ]/g, '')})`, 'gi');
        const parts = text.split(regex);
        
        return parts.map((part, i) => 
            regex.test(part) ? <span key={i} style={{ color: theme.accent, fontWeight: 800 }}>{part}</span> : part
        );
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)', zIndex: 9999,
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            paddingTop: 'clamp(20px, 10vh, 100px)', paddingLeft: 16, paddingRight: 16,
            animation: 'fadeIn 0.2s ease-out'
        }} onClick={onClose}>
            
            <div style={{
                background: theme.card, width: '100%', maxWidth: 600,
                borderRadius: 20, boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
                overflow: 'hidden', display: 'flex', flexDirection: 'column',
                border: theme.border, 
                maxHeight: '80vh'
            }} onClick={e => e.stopPropagation()}>
                
                {/* Search Header/Input */}
                <div style={{
                    display: 'flex', alignItems: 'center', padding: '16px 20px',
                    borderBottom: `1px solid ${theme.border.split(' ').slice(-1)[0]}`,
                    background: theme.glass
                }}>
                    <span style={{ fontSize: 20, marginRight: 12, opacity: 0.6 }}>🔍</span>
                    <input 
                        ref={inputRef}
                        type="text" 
                        placeholder="Search for your calculator or Utility" 
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        style={{
                            flex: 1, background: 'transparent', border: 'none',
                            color: theme.text, fontSize: 18, outline: 'none',
                            fontWeight: 500
                        }}
                    />
                    {query && (
                        <button 
                            onClick={() => { setQuery(''); inputRef.current?.focus(); }}
                            style={{
                                background: 'rgba(128,128,128,0.2)', border: 'none',
                                color: theme.text, borderRadius: '50%', width: 28, height: 28,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', fontSize: 14, marginLeft: 12
                            }}
                            aria-label="Clear Search"
                        >
                            ✕
                        </button>
                    )}
                    <button 
                        onClick={onClose}
                        style={{
                            background: 'transparent', border: 'none',
                            color: theme.subtleText, cursor: 'pointer',
                            fontSize: 14, fontWeight: 600, marginLeft: 16,
                            padding: '6px 10px', borderRadius: 8
                        }}
                    >
                        ESC
                    </button>
                </div>

                {/* Search Results Area */}
                <div style={{ overflowY: 'auto', padding: 20 }}>
                    {query.trim() === '' ? (
                        <div style={{ textAlign: 'center', padding: '20px 0', opacity: 0.7 }}>
                            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>Common Searches</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
                                {['Loan', 'EMI', 'Investment', 'SIP', 'Retirement', 'Tax'].map(tag => (
                                    <button 
                                        key={tag} 
                                        onClick={() => setQuery(tag)}
                                        style={{
                                            background: theme.glass, border: theme.border,
                                            color: theme.text, padding: '6px 14px', borderRadius: 20,
                                            fontSize: 14, cursor: 'pointer', transition: 'background 0.2s'
                                        }}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : results.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {results.map((res, i) => (
                                <button
                                    key={res.route}
                                    onClick={() => {
                                        onSelect(res.route);
                                        onClose();
                                    }}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 16,
                                        width: '100%', padding: '16px', borderRadius: 12,
                                        background: theme.glass, border: 'none',
                                        color: theme.text, cursor: 'pointer', textAlign: 'left',
                                        transition: 'background 0.2s',
                                        borderBottom: `1px solid rgba(128,128,128,0.05)`
                                    }}
                                    onMouseOver={e => e.currentTarget.style.background = 'rgba(128,128,128,0.1)'}
                                    onMouseOut={e => e.currentTarget.style.background = theme.glass}
                                >
                                    <div style={{ fontSize: 24 }}>{res.icon}</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
                                            {highlightText(res.title, debouncedQuery)}
                                        </div>
                                        <div style={{ fontSize: 12, opacity: 0.6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                            {res.keywords.slice(0, 3).map(kw => (
                                                <span key={kw} style={{ background: 'rgba(128,128,128,0.15)', padding: '2px 6px', borderRadius: 4 }}>
                                                    {highlightText(kw, debouncedQuery)}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div style={{ opacity: 0.4 }}>→</div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '40px 0', opacity: 0.6 }}>
                            <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
                            <div style={{ fontSize: 16, fontWeight: 600 }}>No results found for "{query}"</div>
                            <div style={{ fontSize: 14, marginTop: 4 }}>Try using different keywords like "loan" or "invest".</div>
                        </div>
                    )}
                </div>
            </div>
    </div>
  );
} // Ensure valid closure if messed up, but replace is safe