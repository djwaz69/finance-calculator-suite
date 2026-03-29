import React, { useState, useEffect } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
    BarElement
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { calculateSIP, calculateLumpsum, calculateSWP, calculateRetirement, calculateFIRE } from '../../utils/financeUtils';
import { exportDataToExcel } from '../../utils/exportUtils';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const MODES = {
    SIP: 'SIP',
    LUMPSUM: 'Lumpsum',
    SWP: 'SWP',
    RETIREMENT: 'Retirement Check',
    FIRE: 'FIRE'
};

export default function MutualFundCalculator({ theme }) {
    const [mode, setMode] = useState(MODES.SIP);

    // Global inputs
    const [amount, setAmount] = useState('');
    const [rate, setRate] = useState('14'); // Default 14%
    const [years, setYears] = useState('');

    // Mode specific
    const [withdrawal, setWithdrawal] = useState(''); // SWP & FIRE Reverse
    const [stepUp, setStepUp] = useState(''); // SIP Step Up
    const [initialLumpsum, setInitialLumpsum] = useState(''); // SIP Lumpsum
    const [currentAge, setCurrentAge] = useState(''); // Retirement
    const [fireCorpusOnly, setFireCorpusOnly] = useState(true); // FIRE Toggle (Target vs Income)

    const [result, setResult] = useState(null);
    const [chartData, setChartData] = useState(null);
    const [schedule, setSchedule] = useState([]);

    useEffect(() => {
        setResult(null);
        setChartData(null);
        setAmount('');
        setYears('');
        setWithdrawal('');
        setStepUp('');
        setInitialLumpsum('');
        setCurrentAge('');
        // Keep default rate 14
        setRate('14');
    }, [mode]);

    const calculate = () => {
        const R = parseFloat(rate);
        if (!R && mode !== MODES.FIRE) return;

        let res = null;

        if (mode === MODES.SIP) {
            const P = parseFloat(amount);
            const T = parseFloat(years);
            if (!P || !T) return;
            const stepUpRate = parseFloat(stepUp) || 0;
            const lumpsum = parseFloat(initialLumpsum) || 0;
            res = calculateSIP(P, T, R, stepUpRate, lumpsum);

        } else if (mode === MODES.LUMPSUM) {
            const P = parseFloat(amount);
            const T = parseFloat(years);
            if (!P || !T) return;
            res = calculateLumpsum(P, T, R);

        } else if (mode === MODES.SWP) {
            const P = parseFloat(amount); // Corpus
            const T = parseFloat(years);
            const W = parseFloat(withdrawal);
            if (!P || !T || !W) return;
            res = calculateSWP(P, T, R, W);

        } else if (mode === MODES.RETIREMENT) {
            const age = parseInt(currentAge);
            const P = parseFloat(amount); // Existing Corpus
            const T = 100 - age;
            if (!age || !P || T <= 0) return;
            res = calculateRetirement(age, P, T, R);
            res.extraText = `Safe Monthly Withdrawal for ${T} years`;

        } else if (mode === MODES.FIRE) {
            const expOrCorpus = parseFloat(amount);
            if (!expOrCorpus) return;
            res = calculateFIRE(expOrCorpus, fireCorpusOnly);
            res.labels = [];
            res.dataPoints = [];
            res.scheduleData = [];
        }

        if (!res) return;

        setResult({
            totalInv: res.totalInv,
            finalValue: res.finalValue,
            profit: res.profit,
            totalWithdrawn: res.totalWithdrawn || 0,
            extraText: res.extraText || ''
        });
        
        setSchedule(res.scheduleData || []);

        const { labels = [], dataPoints = [] } = res;

        // Filter chart setup
        if (mode !== MODES.FIRE) {
            setChartData({
                labels,
                datasets: [
                    {
                        label: (mode === MODES.SWP || mode === MODES.RETIREMENT) ? 'Balance' : 'Value',
                        data: dataPoints.map(d => d.value),
                        backgroundColor: theme.accent,
                        borderColor: theme.accent,
                        type: (mode === MODES.SWP || mode === MODES.RETIREMENT) ? 'line' : 'bar',
                        fill: (mode === MODES.SWP || mode === MODES.RETIREMENT)
                    },
                    (mode === MODES.SIP || mode === MODES.LUMPSUM || mode === MODES.SWP) ? {
                        label: mode === MODES.SWP ? 'Total Withdrawn' : 'Invested',
                        data: dataPoints.map(d => mode === MODES.SWP ? d.withdrawn : d.invested),
                        backgroundColor: theme.accent2,
                        borderColor: theme.accent2,
                        type: 'line'
                    } : null
                ].filter(Boolean)
            });
        }
    };

    async function exportToExcel() {
        if (schedule.length === 0 && mode !== MODES.FIRE && mode !== MODES.RETIREMENT) return;

        let rows = [];
        if (schedule.length > 0) {
            rows = schedule.map(d => ({ ...d }));
        } else {
            const exportValue = mode === MODES.RETIREMENT ? result.profit : result.finalValue;
            rows = [{ Metric: 'Result', Value: exportValue }];
        }

        rows.push({});
        rows.push({ Note: 'Disclaimer', Value: 'This is for personal use only.' });

        await exportDataToExcel(rows, `Financial_Calc_${mode.replace(' ', '')}.xlsx`, 'Report', 'json');
    }

    const options = React.useMemo(() => ({
        responsive: true,
        plugins: {
            legend: { position: 'top', labels: { color: theme.text } },
            title: { display: true, text: 'Projection', color: theme.text },
        },
        scales: {
            x: { ticks: { color: theme.text }, grid: { color: theme.border } },
            y: { ticks: { color: theme.text }, grid: { color: theme.border } }
        }
    }), [theme.text, theme.border]);

    return (
        <div style={{ textAlign: 'center', color: theme.text }}>
            <h2 style={{ fontWeight: 700, fontSize: 28, marginBottom: 12 }}>Mutual Funds & FA</h2>

            {/* Mode Tabs */}
            <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 32 }}>
                {Object.values(MODES).map(m => (
                    <button
                        key={m}
                        onClick={() => setMode(m)}
                        style={{
                            padding: '8px 16px', borderRadius: 20, border: 'none', fontWeight: 600, cursor: 'pointer',
                            background: mode === m ? theme.accent : theme.glass,
                            color: mode === m ? '#fff' : theme.text,
                            boxShadow: mode === m ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
                            fontSize: 14
                        }}
                    >
                        {m}
                    </button>
                ))}
            </div>

            <form onSubmit={e => { e.preventDefault(); calculate(); }} style={{ maxWidth: 500, margin: '0 auto 32px auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

                    {/* Dynamic Amount Input */}
                    <div style={{ marginBottom: 16, textAlign: 'left', gridColumn: (mode === MODES.RETIREMENT || mode === MODES.FIRE) ? 'span 2' : 'span 1' }}>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>
                            {mode === MODES.SIP ? 'Monthly Investment (₹)' :
                                mode === MODES.SWP || mode === MODES.RETIREMENT ? 'Current Corpus (₹)' :
                                    mode === MODES.FIRE ? (fireCorpusOnly ? 'Desired Monthly Exp (₹)' : 'Current Corpus (₹)') :
                                        'Total Investment (₹)'}
                        </label>
                        <input type="number" min="0" value={amount} onChange={e => setAmount(e.target.value)}
                            style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: 12, border: theme.border, background: theme.card, color: theme.text, fontSize: 16, outline: 'none', boxShadow: theme.shadow }} required />
                    </div>

                    {mode === MODES.SIP && (
                        <div style={{ marginBottom: 16, textAlign: 'left' }}>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>Initial Lumpsum (₹)</label>
                            <input type="number" min="0" value={initialLumpsum} onChange={e => setInitialLumpsum(e.target.value)}
                                style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: 12, border: theme.border, background: theme.card, color: theme.text, fontSize: 16, outline: 'none', boxShadow: theme.shadow }} />
                        </div>
                    )}

                    {/* Rate Input (Hide for FIRE Target) */}
                    {(mode !== MODES.FIRE) && (
                        <div style={{ marginBottom: 16, textAlign: 'left' }}>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>Return Rate (p.a. %)</label>
                            <input type="number" min="0" step="0.1" value={rate} onChange={e => setRate(e.target.value)}
                                style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: 12, border: theme.border, background: theme.card, color: theme.text, fontSize: 16, outline: 'none', boxShadow: theme.shadow }} required />
                        </div>
                    )}

                    {/* Time Input */}
                    {(mode === MODES.SIP || mode === MODES.LUMPSUM || mode === MODES.SWP) && (
                        <div style={{ marginBottom: 16, textAlign: 'left' }}>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>Time (Years)</label>
                            <input type="number" min="1" step="1" value={years} onChange={e => setYears(e.target.value)}
                                style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: 12, border: theme.border, background: theme.card, color: theme.text, fontSize: 16, outline: 'none', boxShadow: theme.shadow }} required />
                        </div>
                    )}

                    {/* Age Input for Retirement */}
                    {mode === MODES.RETIREMENT && (
                        <div style={{ marginBottom: 16, textAlign: 'left' }}>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>Current Age</label>
                            <input type="number" min="1" max="99" value={currentAge} onChange={e => setCurrentAge(e.target.value)}
                                style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: 12, border: theme.border, background: theme.card, color: theme.text, fontSize: 16, outline: 'none', boxShadow: theme.shadow }} required />
                        </div>
                    )}
                </div>

                {/* Second Row Inputs */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    {mode === MODES.SIP && (
                        <div style={{ marginBottom: 16, textAlign: 'left' }}>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>Annual Step Up (%)</label>
                            <input type="number" min="0" max="100" value={stepUp} onChange={e => setStepUp(e.target.value)}
                                style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: 12, border: theme.border, background: theme.card, color: theme.text, fontSize: 16, outline: 'none', boxShadow: theme.shadow }} />
                        </div>
                    )}

                    {mode === MODES.SWP && (
                        <div style={{ marginBottom: 16, textAlign: 'left' }}>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>Monthly Withdrawal (₹)</label>
                            <input type="number" min="0" value={withdrawal} onChange={e => setWithdrawal(e.target.value)}
                                style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: 12, border: theme.border, background: theme.card, color: theme.text, fontSize: 16, outline: 'none', boxShadow: theme.shadow }} required />
                        </div>
                    )}
                </div>

                {/* FIRE Specific Toggles */}
                {mode === MODES.FIRE && (
                    <div style={{ display: 'flex', gap: 16, marginBottom: 16, justifyContent: 'center' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                            <input type="radio" checked={fireCorpusOnly} onChange={() => setFireCorpusOnly(true)} />
                            <span>Calculate Goal Corpus</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                            <input type="radio" checked={!fireCorpusOnly} onChange={() => setFireCorpusOnly(false)} />
                            <span>Calculate Safe Income</span>
                        </label>
                    </div>
                )}
                {mode === MODES.FIRE && !fireCorpusOnly && (
                    <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 16 }}>
                        *Assuming portfolio growth {'>'} 4% inflation (Standard 4% Rule).
                    </div>
                )}


                <button type="submit" style={{
                    width: '100%', padding: '0.9rem', borderRadius: 12, border: 'none', fontWeight: 700, fontSize: 18,
                    background: theme.navActive, color: '#fff', cursor: 'pointer', boxShadow: '0 4px 12px #00c6ae44',
                    transition: 'transform 0.2s', marginTop: 10
                }}>
                    Calculate
                </button>
            </form>

            {result && (
                <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
                    {/* Result Cards */}
                    {mode === MODES.FIRE ? (
                        <div style={{ marginBottom: 32, padding: 24, borderRadius: 16, background: theme.glass, border: theme.border }}>
                            <div style={{ fontSize: 16, opacity: 0.8, marginBottom: 8 }}>{result.extraText}</div>
                            <div style={{ fontSize: 36, fontWeight: 800, color: theme.accent }}>₹{Math.round(result.finalValue).toLocaleString()}</div>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 16, marginBottom: 32 }}>
                            {mode === MODES.RETIREMENT ? (
                                <div style={{ gridColumn: 'span 3', padding: 20, background: theme.glass, borderRadius: 16, border: theme.border }}>
                                    <div style={{ fontSize: 16, opacity: 0.8 }}>{result.extraText}</div>
                                    <div style={{ fontSize: 32, fontWeight: 800, color: theme.accent }}>₹{Math.floor(result.profit).toLocaleString()}</div>
                                </div>
                            ) : (
                                <>
                                    <div style={{ background: theme.glass, padding: 16, borderRadius: 16, border: theme.border }}>
                                        <div style={{ fontSize: 14, opacity: 0.8 }}>Invested</div>
                                        <div style={{ fontSize: 18, fontWeight: 700, color: theme.text }}>₹{Math.round(result.totalInv).toLocaleString()}</div>
                                    </div>
                                    <div style={{ background: theme.glass, padding: 16, borderRadius: 16, border: `1px solid ${theme.accent}` }}>
                                        <div style={{ fontSize: 14, opacity: 0.8 }}>{mode === MODES.SWP ? 'Balance' : 'Profit'}</div>
                                        <div style={{ fontSize: 18, fontWeight: 700, color: theme.accent }}>
                                            ₹{Math.round(mode === MODES.SWP ? result.finalValue : result.profit).toLocaleString()}
                                        </div>
                                    </div>
                                    <div style={{ background: theme.glass, padding: 16, borderRadius: 16, border: `1px solid ${theme.accent2}` }}>
                                        <div style={{ fontSize: 14, opacity: 0.8 }}>{mode === MODES.SWP ? 'Withdrawn' : 'Total Value'}</div>
                                        <div style={{ fontSize: 22, fontWeight: 800, color: theme.accent2 }}>
                                            ₹{Math.round(mode === MODES.SWP ? result.totalWithdrawn : result.finalValue).toLocaleString()}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* SWP Endurance Note */}
                    {mode === MODES.SWP && (
                        <div style={{ marginBottom: 24, fontWeight: 600, color: result.extraText.includes('Full') ? theme.accent2 : '#ff4d4f' }}>
                            {result.extraText}
                        </div>
                    )}

                    {/* Chart */}
                    {chartData && (
                        <div style={{ background: theme.card, padding: 16, borderRadius: 16, marginBottom: 24, boxShadow: theme.shadow }}>
                            <Line options={options} data={chartData} />
                        </div>
                    )}

                    <button onClick={exportToExcel} style={{ padding: '0.7rem 1.5rem', borderRadius: 12, border: 'none', fontWeight: 700, fontSize: 16, background: theme.accent, color: '#fff', cursor: 'pointer', boxShadow: '0 2px 8px #00c6ae33' }}>
                        Export Schedule
                    </button>
                    <div style={{ fontSize: 12, marginTop: 16, opacity: 0.6 }}>This is for personal use only.</div>
                </div>
            )}
    </div>
  );
} // Ensure valid closure if messed up, but replace is safe