import React, { useState } from 'react';

export default function FIRECalculator({ theme }) {
    const [monthlyExpense, setMonthlyExpense] = useState('');
    const [result, setResult] = useState(null);

    const calculate = () => {
        const exp = parseFloat(monthlyExpense);
        if (!exp) return;

        const annualExpense = exp * 12;
        const corpus = annualExpense * 25; // 4% Rule -> 100/4 = 25

        setResult({
            annualExpense,
            corpus
        });
    };

    return (
        <div style={{ textAlign: 'center', color: theme.text }}>
            <h2 style={{ fontWeight: 700, fontSize: 28, marginBottom: 12 }}>FIRE Calculator</h2>
            <p style={{ fontSize: 16, marginBottom: 32, opacity: 0.8 }}>Financial Independence, Retire Early - Calculate your target corpus.</p>

            <form onSubmit={e => { e.preventDefault(); calculate(); }} style={{ maxWidth: 400, margin: '0 auto 32px auto' }}>
                <div style={{ marginBottom: 20, textAlign: 'left' }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>Desired Monthly Income / Expense (₹)</label>
                    <input type="number" min="0" step="500" value={monthlyExpense} onChange={e => setMonthlyExpense(e.target.value)}
                        style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: 12, border: theme.border, background: theme.card, color: theme.text, fontSize: 16, outline: 'none', boxShadow: theme.shadow }} required />
                </div>

                <button type="submit" style={{
                    width: '100%', padding: '0.9rem', borderRadius: 12, border: 'none', fontWeight: 700, fontSize: 18,
                    background: theme.navActive, color: '#fff', cursor: 'pointer', boxShadow: '0 4px 12px #00c6ae44',
                    transition: 'transform 0.2s',
                }}>
                    Calculate FIRE Number
                </button>
            </form>

            {result && (
                <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
                    <div style={{ marginBottom: 24, padding: 24, borderRadius: 16, background: theme.glass, border: theme.border }}>
                        <div style={{ fontSize: 16, opacity: 0.8, marginBottom: 8 }}>Required FIRE Corpus</div>
                        <div style={{ fontSize: 36, fontWeight: 800, color: theme.accent }}>₹{Math.round(result.corpus).toLocaleString()}</div>
                        <div style={{ fontSize: 14, opacity: 0.6, marginTop: 12, maxWidth: 300, margin: '12px auto 0' }}>
                            Based on the 4% withdrawal rule (25x Annual Expenses).
                        </div>
                    </div>
                    <div style={{ fontSize: 12, marginTop: 16, opacity: 0.6 }}>This is for personal use only.</div>
                </div>
            )}
    </div>
  );
} // Ensure valid closure if messed up, but replace is safe