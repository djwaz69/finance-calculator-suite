import React, { useState } from 'react';
import {
    Chart as ChartJS,
    CategoryScale, LinearScale,
    LineElement, PointElement,
    Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend, Filler);

function fmt(n) {
    return n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

function fmtShort(n) {
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
    if (n >= 100000)   return `₹${(n / 100000).toFixed(2)} L`;
    return `₹${fmt(n)}`;
}

export default function InflationCalculator({ theme }) {
    const [currentCost, setCurrentCost] = useState('');
    const [inflationRate, setInflationRate] = useState('6');
    const [years, setYears] = useState('');
    const [result, setResult] = useState(null);

    const inputStyle = {
        width: '100%', padding: '0.8rem 1rem',
        borderRadius: 12, border: theme.border,
        background: theme.card, color: theme.text,
        fontSize: 16, outline: 'none', boxSizing: 'border-box',
    };

    const labelStyle = {
        display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14,
    };

    function calculate(e) {
        e.preventDefault();

        const cost = parseFloat(currentCost) || 0;
        const rate = parseFloat(inflationRate) || 0;
        const yrs = parseInt(years) || 0;

        if (cost <= 0 || yrs <= 0) return;

        // Future Value = Cost × (1 + rate/100)^years
        const futureValue = cost * Math.pow(1 + rate / 100, yrs);
        const additionalCost = futureValue - cost;

        // Purchasing power: ₹1 today = ?₹ in N years
        const purchasingPowerFactor = Math.pow(1 + rate / 100, yrs);

        // Year-by-year table
        const yearData = [];
        for (let y = 0; y <= yrs; y++) {
            yearData.push({
                year: y,
                value: cost * Math.pow(1 + rate / 100, y),
            });
        }

        setResult({ cost, rate, yrs, futureValue, additionalCost, purchasingPowerFactor, yearData });
    }

    // Chart data
    const chartData = result ? {
        labels: result.yearData.map(d => d.year === 0 ? 'Now' : `Year ${d.year}`),
        datasets: [
            {
                label: 'Value (₹)',
                data: result.yearData.map(d => parseFloat(d.value.toFixed(2))),
                borderColor: theme.navActive,
                backgroundColor: `${theme.navActive}22`,
                fill: true,
                tension: 0.4,
                pointRadius: result.yearData.length <= 21 ? 4 : 2,
                pointBackgroundColor: theme.navActive,
                borderWidth: 2,
            },
        ],
    } : null;

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: ctx => ` ₹${fmt(ctx.raw)}`,
                },
            },
        },
        scales: {
            x: {
                ticks: {
                    color: theme.text,
                    maxTicksLimit: 10,
                },
                grid: { color: 'rgba(128,128,128,0.15)' },
            },
            y: {
                ticks: {
                    color: theme.text,
                    callback: val => fmtShort(val),
                },
                grid: { color: 'rgba(128,128,128,0.15)' },
            },
        },
    };

    return (
        <div style={{ color: theme.text }}>
            <h2 style={{ fontWeight: 800, fontSize: 28, marginBottom: 6, textAlign: 'center' }}>
                Inflation Calculator
            </h2>
            <p style={{ fontSize: 14, opacity: 0.65, textAlign: 'center', marginBottom: 28 }}>
                See how inflation erodes purchasing power and the future cost of today's expenses
            </p>

            {/* ── FORM ── */}
            <form onSubmit={calculate} style={{ maxWidth: 480, margin: '0 auto 32px auto' }}>
                <div style={{ background: theme.glass, borderRadius: 16, border: theme.border, padding: 24, marginBottom: 18 }}>
                    <div style={{ marginBottom: 16 }}>
                        <label style={labelStyle}>Current Cost of Item (₹)</label>
                        <input
                            type="number" min="0" step="0.01" required
                            value={currentCost} onChange={e => setCurrentCost(e.target.value)}
                            placeholder="e.g. 100000" style={inputStyle}
                        />
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <label style={labelStyle}>Expected Annual Inflation Rate (%)</label>
                        <input
                            type="number" min="0" max="100" step="0.1" required
                            value={inflationRate} onChange={e => setInflationRate(e.target.value)}
                            placeholder="e.g. 6" style={inputStyle}
                        />
                        <p style={{ fontSize: 12, opacity: 0.6, marginTop: 6 }}>
                            India's average CPI inflation: ~5–7% p.a. Food inflation may be higher (~8–10%).
                        </p>
                    </div>

                    <div>
                        <label style={labelStyle}>Time Period (Years)</label>
                        <input
                            type="number" min="1" max="100" step="1" required
                            value={years} onChange={e => setYears(e.target.value)}
                            placeholder="e.g. 20" style={inputStyle}
                        />
                    </div>
                </div>

                <button type="submit" style={{
                    width: '100%', padding: '0.9rem',
                    borderRadius: 12, border: 'none',
                    fontWeight: 700, fontSize: 18,
                    background: theme.navActive, color: '#fff',
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(0,122,255,0.3)',
                }}>
                    Calculate
                </button>
            </form>

            {/* ── RESULTS ── */}
            {result && (
                <div style={{ maxWidth: 680, margin: '0 auto', animation: 'fadeIn 0.4s ease-out' }}>

                    {/* Hero Result */}
                    <div style={{
                        background: `linear-gradient(135deg, ${theme.navActive}22, ${theme.accent2}22)`,
                        border: `2px solid ${theme.navActive}`,
                        borderRadius: 18, padding: 28, textAlign: 'center', marginBottom: 20,
                    }}>
                        <div style={{ fontSize: 14, fontWeight: 600, opacity: 0.7, marginBottom: 4 }}>
                            What ₹{fmt(result.cost)} costs today will cost in {result.yrs} years
                        </div>
                        <div style={{ fontSize: 48, fontWeight: 900, color: theme.navActive }}>
                            ₹{fmt(result.futureValue)}
                        </div>
                        <div style={{ fontSize: 13, opacity: 0.65, marginTop: 8 }}>
                            at {result.rate}% annual inflation for {result.yrs} year{result.yrs !== 1 ? 's' : ''}
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 24 }}>
                        <div style={{ background: theme.glass, padding: 16, borderRadius: 14, border: theme.border, textAlign: 'center' }}>
                            <div style={{ fontSize: 11, opacity: 0.6, fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Current Value</div>
                            <div style={{ fontSize: 18, fontWeight: 700, color: theme.text }}>₹{fmt(result.cost)}</div>
                        </div>
                        <div style={{ background: theme.glass, padding: 16, borderRadius: 14, border: theme.border, textAlign: 'center' }}>
                            <div style={{ fontSize: 11, opacity: 0.6, fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Future Value</div>
                            <div style={{ fontSize: 18, fontWeight: 700, color: theme.navActive }}>₹{fmt(result.futureValue)}</div>
                        </div>
                        <div style={{ background: theme.glass, padding: 16, borderRadius: 14, border: `1px solid ${theme.accent2}55`, textAlign: 'center' }}>
                            <div style={{ fontSize: 11, opacity: 0.6, fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Additional Cost</div>
                            <div style={{ fontSize: 18, fontWeight: 700, color: theme.accent2 }}>₹{fmt(result.additionalCost)}</div>
                        </div>
                        <div style={{ background: theme.glass, padding: 16, borderRadius: 14, border: theme.border, textAlign: 'center' }}>
                            <div style={{ fontSize: 11, opacity: 0.6, fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>₹1 today = </div>
                            <div style={{ fontSize: 18, fontWeight: 700, color: '#f59e0b' }}>
                                ₹{result.purchasingPowerFactor.toFixed(2)}
                            </div>
                            <div style={{ fontSize: 11, opacity: 0.55 }}>in {result.yrs} yrs</div>
                        </div>
                    </div>

                    {/* Purchasing Power Insight */}
                    <div style={{ background: theme.glass, borderRadius: 16, border: theme.border, padding: 20, marginBottom: 24 }}>
                        <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 12 }}>Purchasing Power Erosion</h3>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                            <div>
                                <p style={{ fontSize: 14, lineHeight: 1.7, margin: 0 }}>
                                    Due to <strong>{result.rate}%</strong> annual inflation, what costs{' '}
                                    <strong>₹{fmt(result.cost)}</strong> today will require{' '}
                                    <strong style={{ color: theme.navActive }}>₹{fmt(result.futureValue)}</strong>{' '}
                                    after {result.yrs} years — an increase of{' '}
                                    <strong style={{ color: theme.accent2 }}>₹{fmt(result.additionalCost)}</strong>.
                                </p>
                                <p style={{ fontSize: 14, lineHeight: 1.7, marginTop: 8, marginBottom: 0 }}>
                                    Equivalently, <strong>₹1</strong> today will have the purchasing power of only{' '}
                                    <strong style={{ color: '#f59e0b' }}>
                                        ₹{(1 / result.purchasingPowerFactor).toFixed(4)}
                                    </strong>{' '}
                                    in {result.yrs} years.
                                </p>
                            </div>
                        </div>
                        {/* Visual power bar */}
                        <div style={{ marginTop: 16 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                                Purchasing Power Retained: {((1 / result.purchasingPowerFactor) * 100).toFixed(1)}%
                            </div>
                            <div style={{ background: theme.card, borderRadius: 8, height: 16, overflow: 'hidden', border: theme.border }}>
                                <div style={{
                                    height: '100%',
                                    width: `${Math.min(100, (1 / result.purchasingPowerFactor) * 100)}%`,
                                    background: `linear-gradient(90deg, #22c55e, #f59e0b)`,
                                    borderRadius: 8,
                                    transition: 'width 0.8s ease',
                                }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, opacity: 0.55, marginTop: 4 }}>
                                <span>0% retained</span>
                                <span>100% retained (no inflation)</span>
                            </div>
                        </div>
                    </div>

                    {/* Line Chart */}
                    <div style={{ background: theme.glass, borderRadius: 16, border: theme.border, padding: 20, marginBottom: 24 }}>
                        <h3 style={{ fontWeight: 700, fontSize: 17, marginBottom: 16 }}>Value Growth Over Time</h3>
                        <Line data={chartData} options={chartOptions} />
                    </div>

                    {/* Year-by-Year Table */}
                    <div style={{ background: theme.glass, borderRadius: 16, border: theme.border, padding: 20 }}>
                        <h3 style={{ fontWeight: 700, fontSize: 17, marginBottom: 14 }}>Year-by-Year Value</h3>
                        <div style={{ maxHeight: 380, overflowY: 'auto', borderRadius: 10, border: theme.border }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                                <thead style={{ position: 'sticky', top: 0, background: theme.card, zIndex: 1 }}>
                                    <tr style={{ borderBottom: `2px solid ${theme.navActive}` }}>
                                        <th style={{ padding: '9px 14px', textAlign: 'center' }}>Year</th>
                                        <th style={{ padding: '9px 14px', textAlign: 'right' }}>Value (₹)</th>
                                        <th style={{ padding: '9px 14px', textAlign: 'right' }}>Increase from Today (₹)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {result.yearData.map((row, i) => (
                                        <tr key={row.year} style={{
                                            borderBottom: '1px solid rgba(128,128,128,0.1)',
                                            background: i % 2 === 0 ? 'transparent' : 'rgba(128,128,128,0.04)',
                                        }}>
                                            <td style={{ padding: '8px 14px', textAlign: 'center', fontWeight: row.year === 0 ? 700 : 400 }}>
                                                {row.year === 0 ? 'Now' : `Year ${row.year}`}
                                            </td>
                                            <td style={{ padding: '8px 14px', textAlign: 'right', fontWeight: 600, color: theme.accent }}>
                                                ₹{fmt(row.value)}
                                            </td>
                                            <td style={{ padding: '8px 14px', textAlign: 'right', color: row.year === 0 ? theme.text : theme.accent2 }}>
                                                {row.year === 0 ? '—' : `₹${fmt(row.value - result.cost)}`}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
