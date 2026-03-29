import React, { useState } from 'react';
import {
    Chart as ChartJS,
    CategoryScale, LinearScale,
    BarElement, Title, Tooltip, Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function fmt(n) {
    return Math.round(n).toLocaleString('en-IN');
}

function fmtShort(n) {
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
    if (n >= 100000)   return `₹${(n / 100000).toFixed(2)} L`;
    return `₹${fmt(n)}`;
}

// Map deposit frequency to periods per year
const DEPOSIT_FREQ = {
    Monthly:     12,
    Quarterly:   4,
    'Half-yearly': 2,
    Yearly:      1,
};

// Map compounding frequency to periods per year
const COMPOUND_FREQ = {
    Daily:       365,
    Weekly:      52,
    Monthly:     12,
    Quarterly:   4,
    'Half-yearly': 2,
    Yearly:      1,
};

// Term unit to years conversion
function termToYears(value, unit) {
    if (unit === 'Years')  return value;
    if (unit === 'Months') return value / 12;
    if (unit === 'Days')   return value / 365;
    return value;
}

export default function CompoundInterestCalculator({ theme }) {
    const [principal, setPrincipal] = useState('');
    const [regularDeposit, setRegularDeposit] = useState('');
    const [depositFreq, setDepositFreq] = useState('Monthly');
    const [rate, setRate] = useState('');
    const [termValue, setTermValue] = useState('');
    const [termUnit, setTermUnit] = useState('Years');
    const [compoundFreq, setCompoundFreq] = useState('Yearly');

    const [result, setResult] = useState(null);
    const [schedule, setSchedule] = useState([]);

    const inputStyle = {
        width: '100%', padding: '0.8rem 1rem',
        borderRadius: 12, border: theme.border,
        background: theme.card, color: theme.text,
        fontSize: 16, outline: 'none', boxSizing: 'border-box',
    };

    const selectStyle = {
        ...inputStyle,
        cursor: 'pointer',
    };

    const labelStyle = {
        display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14,
    };

    function calculate(e) {
        e.preventDefault();

        const P = parseFloat(principal) || 0;
        const dep = parseFloat(regularDeposit) || 0;
        const r = parseFloat(rate) / 100;
        const t = termToYears(parseFloat(termValue) || 0, termUnit);
        const n = COMPOUND_FREQ[compoundFreq];    // compounding periods/year
        const depFreq = DEPOSIT_FREQ[depositFreq]; // deposit periods/year

        if (t <= 0 || r <= 0) return;

        // Future value of lump sum
        const fvLumpSum = P * Math.pow(1 + r / n, n * t);

        // Future value of regular deposits (annuity due / ordinary annuity)
        // Rate per compounding period
        const rPerPeriod = r / n;
        // Number of compounding periods per deposit interval
        const periodsPerDeposit = n / depFreq;
        // Effective rate per deposit period
        const rEff = Math.pow(1 + rPerPeriod, periodsPerDeposit) - 1;
        const numDeposits = Math.floor(depFreq * t);

        let fvDeposits = 0;
        if (dep > 0 && rEff > 0) {
            fvDeposits = dep * ((Math.pow(1 + rEff, numDeposits) - 1) / rEff);
        } else if (dep > 0) {
            fvDeposits = dep * numDeposits;
        }

        const totalDeposited = dep * numDeposits;
        const finalValue = fvLumpSum + fvDeposits;
        const totalInvested = P + totalDeposited;
        const totalInterest = finalValue - totalInvested;

        // Effective Annual Rate
        const ear = (Math.pow(1 + r / n, n) - 1) * 100;

        // Year-by-year schedule
        const yearlySchedule = [];
        const wholeYears = Math.ceil(t);
        for (let yr = 1; yr <= wholeYears; yr++) {
            const tYr = Math.min(yr, t);
            const fvLS = P * Math.pow(1 + r / n, n * tYr);
            const nDep = Math.floor(depFreq * tYr);
            let fvDep = 0;
            if (dep > 0 && rEff > 0) {
                fvDep = dep * ((Math.pow(1 + rEff, nDep) - 1) / rEff);
            } else if (dep > 0) {
                fvDep = dep * nDep;
            }
            const bal = fvLS + fvDep;
            const invested = P + dep * nDep;
            yearlySchedule.push({
                year: yr,
                totalInvested: invested,
                interest: bal - invested,
                balance: bal,
            });
        }

        setResult({ P, dep, totalDeposited, numDeposits, finalValue, totalInvested, totalInterest, ear });
        setSchedule(yearlySchedule);
    }

    async function exportToExcel() {
        if (!result || !schedule.length) return;
        const XLSX = await import('xlsx');
        const wb = XLSX.utils.book_new();

        const summaryData = [
            ['COMPOUND INTEREST SUMMARY', ''],
            ['Principal Amount', result.P],
            ['Regular Deposit', result.dep],
            ['Deposit Frequency', depositFreq],
            ['Annual Interest Rate (%)', parseFloat(rate)],
            ['Term', `${termValue} ${termUnit}`],
            ['Compounding Frequency', compoundFreq],
            [''],
            ['Total Invested', result.totalInvested],
            ['Total Interest Earned', result.totalInterest],
            ['Final Value', result.finalValue],
            ['Effective Annual Rate (%)', result.ear.toFixed(4)],
        ];
        const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, ws1, 'Summary');

        const schedData = [
            ['Year', 'Total Invested (₹)', 'Interest Earned (₹)', 'Balance (₹)'],
            ...schedule.map(r => [r.year, Math.round(r.totalInvested), Math.round(r.interest), Math.round(r.balance)]),
        ];
        const ws2 = XLSX.utils.aoa_to_sheet(schedData);
        XLSX.utils.book_append_sheet(wb, ws2, 'Year-wise Schedule');

        XLSX.writeFile(wb, 'CompoundInterest_Schedule.xlsx');
    }

    // Chart data
    const chartData = schedule.length > 0 ? {
        labels: schedule.map(r => `Yr ${r.year}`),
        datasets: [
            {
                label: 'Total Invested',
                data: schedule.map(r => Math.round(r.totalInvested)),
                backgroundColor: `${theme.accent}cc`,
                borderRadius: 6,
            },
            {
                label: 'Balance (Value)',
                data: schedule.map(r => Math.round(r.balance)),
                backgroundColor: `${theme.accent2}cc`,
                borderRadius: 6,
            },
        ],
    } : null;

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: { position: 'top', labels: { color: theme.text, font: { size: 12 } } },
            title: { display: false },
            tooltip: {
                callbacks: {
                    label: ctx => ` ₹${ctx.raw.toLocaleString('en-IN')}`,
                },
            },
        },
        scales: {
            x: { ticks: { color: theme.text }, grid: { color: 'rgba(128,128,128,0.15)' } },
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
                Compound Interest Calculator
            </h2>
            <p style={{ fontSize: 14, opacity: 0.65, textAlign: 'center', marginBottom: 28 }}>
                Calculate future value with lump sum + regular deposits, any compounding frequency
            </p>

            {/* ── FORM ── */}
            <form onSubmit={calculate} style={{ maxWidth: 600, margin: '0 auto 32px auto' }}>

                <div style={{ background: theme.glass, borderRadius: 16, border: theme.border, padding: 24, marginBottom: 18 }}>
                    <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 18 }}>Investment Details</h3>

                    <div style={{ marginBottom: 14 }}>
                        <label style={labelStyle}>Principal / Lump Sum Deposit (₹)</label>
                        <input type="number" min="0" value={principal}
                            onChange={e => setPrincipal(e.target.value)}
                            placeholder="e.g. 100000" style={inputStyle} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                        <div>
                            <label style={labelStyle}>Regular Deposit Amount (₹)</label>
                            <input type="number" min="0" value={regularDeposit}
                                onChange={e => setRegularDeposit(e.target.value)}
                                placeholder="e.g. 5000 (optional)" style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Deposit Frequency</label>
                            <select value={depositFreq} onChange={e => setDepositFreq(e.target.value)} style={selectStyle}>
                                {Object.keys(DEPOSIT_FREQ).map(f => <option key={f}>{f}</option>)}
                            </select>
                        </div>
                    </div>

                    <div style={{ marginBottom: 14 }}>
                        <label style={labelStyle}>Annual Interest Rate (%)</label>
                        <input type="number" min="0" max="100" step="0.01" required value={rate}
                            onChange={e => setRate(e.target.value)}
                            placeholder="e.g. 12" style={inputStyle} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, marginBottom: 14 }}>
                        <div>
                            <label style={labelStyle}>Term</label>
                            <input type="number" min="0" step="0.5" required value={termValue}
                                onChange={e => setTermValue(e.target.value)}
                                placeholder="e.g. 10" style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Unit</label>
                            <select value={termUnit} onChange={e => setTermUnit(e.target.value)} style={selectStyle}>
                                <option>Years</option>
                                <option>Months</option>
                                <option>Days</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label style={labelStyle}>Compounding Frequency</label>
                        <select value={compoundFreq} onChange={e => setCompoundFreq(e.target.value)} style={selectStyle}>
                            {Object.keys(COMPOUND_FREQ).map(f => <option key={f}>{f}</option>)}
                        </select>
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
                <div style={{ maxWidth: 720, margin: '0 auto', animation: 'fadeIn 0.4s ease-out' }}>

                    {/* Summary Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 24 }}>
                        {[
                            { label: 'Principal Amount', val: result.P, color: theme.text },
                            { label: 'Total Deposits', val: result.totalDeposited, color: theme.text },
                            { label: 'Total Invested', val: result.totalInvested, color: theme.accent },
                            { label: 'Total Interest', val: result.totalInterest, color: '#22c55e' },
                        ].map(item => (
                            <div key={item.label} style={{ background: theme.glass, padding: 16, borderRadius: 14, border: theme.border, textAlign: 'center' }}>
                                <div style={{ fontSize: 11, opacity: 0.6, fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>{item.label}</div>
                                <div style={{ fontSize: 18, fontWeight: 700, color: item.color }}>₹{fmt(item.val)}</div>
                            </div>
                        ))}
                    </div>

                    {/* Final Value Hero */}
                    <div style={{
                        background: `linear-gradient(135deg, ${theme.navActive}22, ${theme.accent}22)`,
                        border: `2px solid ${theme.navActive}`,
                        borderRadius: 18, padding: 28, textAlign: 'center', marginBottom: 24,
                    }}>
                        <div style={{ fontSize: 14, fontWeight: 600, opacity: 0.7, marginBottom: 6 }}>Final Value</div>
                        <div style={{ fontSize: 48, fontWeight: 900, color: theme.navActive }}>
                            ₹{fmt(result.finalValue)}
                        </div>
                        <div style={{ fontSize: 13, opacity: 0.65, marginTop: 8 }}>
                            Effective Annual Rate (EAR): <strong>{result.ear.toFixed(3)}%</strong>
                            {compoundFreq !== 'Yearly' && ` (compounded ${compoundFreq.toLowerCase()})`}
                        </div>
                    </div>

                    {/* Bar Chart */}
                    {chartData && schedule.length > 0 && (
                        <div style={{ background: theme.glass, borderRadius: 16, border: theme.border, padding: 20, marginBottom: 24 }}>
                            <h3 style={{ fontWeight: 700, fontSize: 17, marginBottom: 16 }}>Growth Over Time</h3>
                            <Bar data={chartData} options={chartOptions} />
                        </div>
                    )}

                    {/* Schedule Table */}
                    <div style={{ background: theme.glass, borderRadius: 16, border: theme.border, padding: 20, marginBottom: 24 }}>
                        <h3 style={{ fontWeight: 700, fontSize: 17, marginBottom: 14 }}>Year-wise Schedule</h3>
                        <div style={{ maxHeight: 360, overflowY: 'auto', borderRadius: 10, border: theme.border }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
                                <thead style={{ position: 'sticky', top: 0, background: theme.card, zIndex: 1 }}>
                                    <tr style={{ borderBottom: `2px solid ${theme.navActive}` }}>
                                        <th style={{ padding: '9px 12px', textAlign: 'center' }}>Year</th>
                                        <th style={{ padding: '9px 12px', textAlign: 'right' }}>Total Invested (₹)</th>
                                        <th style={{ padding: '9px 12px', textAlign: 'right' }}>Interest Earned (₹)</th>
                                        <th style={{ padding: '9px 12px', textAlign: 'right' }}>Balance (₹)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {schedule.map((row, i) => (
                                        <tr key={row.year} style={{
                                            borderBottom: '1px solid rgba(128,128,128,0.1)',
                                            background: i % 2 === 0 ? 'transparent' : 'rgba(128,128,128,0.04)',
                                        }}>
                                            <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 600 }}>{row.year}</td>
                                            <td style={{ padding: '8px 12px', textAlign: 'right' }}>₹{fmt(row.totalInvested)}</td>
                                            <td style={{ padding: '8px 12px', textAlign: 'right', color: '#22c55e', fontWeight: 600 }}>₹{fmt(row.interest)}</td>
                                            <td style={{ padding: '8px 12px', textAlign: 'right', color: theme.accent, fontWeight: 700 }}>₹{fmt(row.balance)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Export Button */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                        <button onClick={exportToExcel} style={{
                            padding: '0.75rem 2rem', borderRadius: 12,
                            border: 'none', fontWeight: 700, fontSize: 15,
                            background: theme.accent2, color: '#fff',
                            cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,198,174,0.3)',
                        }}>
                            Export to Excel
                        </button>
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
