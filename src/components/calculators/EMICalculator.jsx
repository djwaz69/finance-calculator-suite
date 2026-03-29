import React, { useState, useMemo, useRef } from 'react';
import logo from '../../assets/logo.jpg';
import { calculateEMIParams, generateAmortizationSchedule } from '../../utils/financeUtils';
import { exportElementToPDF, exportDataToExcel, exportDataToPDF } from '../../utils/exportUtils';

export default function EMICalculator({ theme }) {
    const [amount, setAmount] = useState('');
    const [roi, setRoi] = useState('8.70');
    const [tenure, setTenure] = useState('');
    const [emi, setEmi] = useState(null);
    const [amortizationSchedule, setAmortizationSchedule] = useState([]);
    const [exporting, setExporting] = useState(false);

    const exportRef = useRef(null);

    function calculateEMI() {
        const { emi: emiVal, R } = calculateEMIParams(amount, tenure, roi);
        setEmi(emiVal);

        if (emiVal) {
            const schedule = generateAmortizationSchedule(amount, tenure, roi, emiVal);
            setAmortizationSchedule(schedule);
        } else {
            setAmortizationSchedule([]);
        }
    }

    async function exportToPDF() {
        if (!emi) return;
        setExporting(true);
        try {
            const capturedTotalInterest = totalInterest;
            const capturedTotalPayable = totalPayable;

            const summary = [
                ['Loan Amount', `Rs. ${parseFloat(amount).toLocaleString('en-IN')}`],
                ['Interest Rate', `${parseFloat(roi)}% p.a.`],
                ['Tenure', `${parseInt(tenure)} months (${(parseInt(tenure) / 12).toFixed(1)} years)`],
                ['Monthly EMI', `Rs. ${Math.round(emi).toLocaleString('en-IN')}`],
                ['Total Interest', `Rs. ${Math.round(capturedTotalInterest).toLocaleString('en-IN')}`],
                ['Total Payable', `Rs. ${Math.round(capturedTotalPayable).toLocaleString('en-IN')}`],
            ];

            const columns = ['Month', 'Opening Balance (Rs.)', 'EMI (Rs.)', 'Principal (Rs.)', 'Interest (Rs.)', 'Closing Balance (Rs.)'];
            const rows = amortizationSchedule.map(({ month, principal, interest, balance }) => {
                const closing = Math.round(balance);
                const princ = Math.round(principal);
                const opening = closing + princ;
                return [
                    month,
                    opening.toLocaleString('en-IN'),
                    Math.round(emi).toLocaleString('en-IN'),
                    princ.toLocaleString('en-IN'),
                    Math.round(interest).toLocaleString('en-IN'),
                    closing.toLocaleString('en-IN')
                ];
            });

            await exportDataToPDF(columns, rows, 'EMI_Loan_Summary.pdf', 'Loan EMI Summary', summary);
        } finally {
            setExporting(false);
        }
    }

    async function exportToExcel() {
        if (!emi) return;
        
        // Formatted top summary
        const wsData = [
            ['Loan Amount', parseFloat(amount)],
            ['Interest Rate (% p.a.)', parseFloat(roi)],
            ['Tenure (Months)', parseInt(tenure)],
            ['Monthly EMI', Math.round(emi)],
            ['Total Interest', Math.round(totalInterest)],
            ['Total Payable', Math.round(totalPayable)],
            [], // empty row for spacing
            ['Month', 'Opening Balance (Rs.)', 'EMI (Rs.)', 'Principal (Rs.)', 'Interest (Rs.)', 'Closing Balance (Rs.)'],
            ...amortizationSchedule.map(({ month, principal, interest, balance }) => {
                const closing = Math.round(balance);
                const princ = Math.round(principal);
                const opening = closing + princ;
                return [
                    month,
                    opening,
                    Math.round(emi),
                    princ,
                    Math.round(interest),
                    closing
                ];
            }),
            [],
            ['Disclaimer', 'This is for personal use only.']
        ];
        
        await exportDataToExcel(wsData, 'EMI_Amortization_Schedule.xlsx', 'Schedule', 'aoa');
    }

    const { totalPrincipal, totalInterest, totalPayable, interestPct } = useMemo(() => {
        const tp = amortizationSchedule.reduce((acc, cur) => acc + cur.principal, 0);
        const ti = amortizationSchedule.reduce((acc, cur) => acc + cur.interest, 0);
        const tpb = tp + ti;
        const ip = tpb > 0 ? ((ti / tpb) * 100).toFixed(1) : 0;
        return { totalPrincipal: tp, totalInterest: ti, totalPayable: tpb, interestPct: ip };
    }, [amortizationSchedule]);

    const inputStyle = {
        width: '100%', padding: '0.75rem 1rem',
        borderRadius: 12, border: theme.border,
        background: theme.card, color: theme.text,
        fontSize: 16, outline: 'none',
        boxSizing: 'border-box',
    };

    return (
        <div style={{ textAlign: 'center', color: theme.text }}>
            <h2 style={{ fontWeight: 800, fontSize: 28, marginBottom: 8 }}>EMI Calculator</h2>
            <p style={{ fontSize: 15, marginBottom: 28, opacity: 0.7 }}>
                Calculate your monthly loan EMI, total interest, and full amortization schedule.
            </p>

            <form onSubmit={e => { e.preventDefault(); calculateEMI(); }}
                style={{ maxWidth: 440, margin: '0 auto 8px auto' }}>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                    <div style={{ textAlign: 'left' }}>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, fontSize: 14 }}>Loan Amount (₹)</label>
                        <input type="number" min="0" step="1000" value={amount}
                            onChange={e => setAmount(e.target.value)}
                            style={inputStyle} required placeholder="e.g. 5000000" />
                    </div>
                    <div style={{ textAlign: 'left' }}>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, fontSize: 14 }}>Interest Rate (% p.a.)</label>
                        <input type="number" min="0" step="0.01" value={roi}
                            onChange={e => setRoi(e.target.value)}
                            style={inputStyle} required />
                    </div>
                </div>

                <div style={{ textAlign: 'left', marginBottom: 24 }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, fontSize: 14 }}>Tenure (Months)</label>
                    <input type="number" min="1" step="1" value={tenure}
                        onChange={e => setTenure(e.target.value)}
                        style={inputStyle} required placeholder="e.g. 240 (20 years)" />
                </div>

                <button type="submit" style={{
                    width: '100%', padding: '0.9rem',
                    borderRadius: 14, border: 'none',
                    fontWeight: 700, fontSize: 18,
                    background: theme.navActive, color: '#fff',
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(0,122,255,0.3)',
                }}>
                    Calculate EMI
                </button>
            </form>

            {emi !== null && (
                <div ref={exportRef} style={{ animation: 'fadeIn 0.4s ease-out' }}>
                    {/* Summary cards */}
                    <div style={{ marginTop: 32, marginBottom: 24 }}>
                        <h3 style={{ fontWeight: 700, fontSize: 20, marginBottom: 16 }}>Loan Summary</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
                            <div style={{ background: theme.glass, padding: 16, borderRadius: 16, border: theme.border }}>
                                <div style={{ fontSize: 12, opacity: 0.6, fontWeight: 600, textTransform: 'uppercase' }}>Monthly EMI</div>
                                <div style={{ fontSize: 22, fontWeight: 800, color: theme.accent, marginTop: 4 }}>
                                    ₹{Math.round(emi).toLocaleString('en-IN')}
                                </div>
                            </div>
                            <div style={{ background: theme.glass, padding: 16, borderRadius: 16, border: theme.border }}>
                                <div style={{ fontSize: 12, opacity: 0.6, fontWeight: 600, textTransform: 'uppercase' }}>Principal</div>
                                <div style={{ fontSize: 20, fontWeight: 700, color: theme.text, marginTop: 4 }}>
                                    ₹{Math.round(totalPrincipal).toLocaleString('en-IN')}
                                </div>
                            </div>
                            <div style={{ background: theme.glass, padding: 16, borderRadius: 16, border: `1px solid ${theme.accent2}` }}>
                                <div style={{ fontSize: 12, opacity: 0.6, fontWeight: 600, textTransform: 'uppercase' }}>Total Interest</div>
                                <div style={{ fontSize: 20, fontWeight: 700, color: theme.accent2, marginTop: 4 }}>
                                    ₹{Math.round(totalInterest).toLocaleString('en-IN')}
                                </div>
                            </div>
                            <div style={{ background: theme.glass, padding: 16, borderRadius: 16, border: theme.border }}>
                                <div style={{ fontSize: 12, opacity: 0.6, fontWeight: 600, textTransform: 'uppercase' }}>Total Payable</div>
                                <div style={{ fontSize: 20, fontWeight: 700, color: theme.text, marginTop: 4 }}>
                                    ₹{Math.round(totalPayable).toLocaleString('en-IN')}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Donut Chart (CSS) */}
                    <div style={{ margin: '8px auto 32px auto', maxWidth: 300 }}>
                        <div style={{
                            position: 'relative', width: 200, height: 200,
                            margin: '0 auto 16px auto',
                        }}>
                            {/* Shadow */}
                            <div style={{
                                position: 'absolute', inset: 0,
                                borderRadius: '50%',
                                boxShadow: `0 12px 32px ${theme.accent2}44`,
                                filter: 'blur(3px)',
                            }} />
                            {/* Pie */}
                            <div style={{
                                width: 190, height: 190,
                                margin: '5px',
                                borderRadius: '50%',
                                background: `conic-gradient(${theme.accent} ${(totalPrincipal / totalPayable) * 360}deg, ${theme.accent2} 0deg)`,
                                transform: 'rotateX(16deg)',
                                boxShadow: `0 6px 20px ${theme.accent2}44`,
                                position: 'relative', zIndex: 1,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                {/* Center hole */}
                                <div style={{
                                    width: 96, height: 96,
                                    borderRadius: '50%',
                                    background: theme.card,
                                    display: 'flex', flexDirection: 'column',
                                    alignItems: 'center', justifyContent: 'center',
                                    fontSize: 11, fontWeight: 700,
                                    color: theme.text, gap: 2,
                                }}>
                                    <div style={{ color: theme.accent2, fontSize: 12 }}>{interestPct}%</div>
                                    <div style={{ opacity: 0.6, fontSize: 10 }}>interest</div>
                                </div>
                            </div>
                        </div>
                        {/* Legend */}
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, fontSize: 13 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={{ width: 12, height: 12, borderRadius: 3, background: theme.accent }} />
                                <span>Principal ({(100 - parseFloat(interestPct)).toFixed(1)}%)</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={{ width: 12, height: 12, borderRadius: 3, background: theme.accent2 }} />
                                <span>Interest ({interestPct}%)</span>
                            </div>
                        </div>
                    </div>

                    {/* Amortization Schedule Table */}
                    <div style={{ marginTop: 8, maxHeight: 320, overflowY: 'auto', textAlign: 'left', borderRadius: 12, border: theme.border }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
                            <thead style={{ position: 'sticky', top: 0, background: theme.card, zIndex: 1 }}>
                                <tr style={{ borderBottom: `2px solid ${theme.accent}` }}>
                                    <th style={{ padding: '10px 10px', textAlign: 'center', fontWeight: 700 }}>Month</th>
                                    <th style={{ padding: '10px 10px', textAlign: 'right', fontWeight: 700 }}>Opening (₹)</th>
                                    <th style={{ padding: '10px 10px', textAlign: 'right', fontWeight: 700 }}>EMI (₹)</th>
                                    <th style={{ padding: '10px 10px', textAlign: 'right', fontWeight: 700 }}>Principal (₹)</th>
                                    <th style={{ padding: '10px 10px', textAlign: 'right', fontWeight: 700 }}>Interest (₹)</th>
                                    <th style={{ padding: '10px 10px', textAlign: 'right', fontWeight: 700 }}>Closing (₹)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {amortizationSchedule.map(({ month, principal, interest, balance }, idx) => {
                                    const closing = Math.round(balance);
                                    const princ = Math.round(principal);
                                    const opening = closing + princ;
                                    return (
                                        <tr key={month} style={{
                                            borderBottom: `1px solid rgba(128,128,128,0.1)`,
                                            background: idx % 2 === 0 ? 'transparent' : 'rgba(128,128,128,0.04)',
                                        }}>
                                            <td style={{ padding: '8px 10px', textAlign: 'center' }}>{month}</td>
                                            <td style={{ padding: '8px 10px', textAlign: 'right' }}>{opening.toLocaleString('en-IN')}</td>
                                            <td style={{ padding: '8px 10px', textAlign: 'right' }}>{Math.round(emi).toLocaleString('en-IN')}</td>
                                            <td style={{ padding: '8px 10px', textAlign: 'right', color: theme.accent }}>{princ.toLocaleString('en-IN')}</td>
                                            <td style={{ padding: '8px 10px', textAlign: 'right', color: theme.accent2 }}>{Math.round(interest).toLocaleString('en-IN')}</td>
                                            <td style={{ padding: '8px 10px', textAlign: 'right' }}>{closing.toLocaleString('en-IN')}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Export Buttons */}
            {emi !== null && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 12, margin: '24px 0 8px 0', flexWrap: 'wrap' }}>
                    <button
                        onClick={exportToExcel}
                        style={{
                            padding: '0.7rem 1.6rem', borderRadius: 12,
                            border: 'none', fontWeight: 700, fontSize: 15,
                            background: theme.accent2, color: '#fff',
                            cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,198,174,0.3)',
                        }}
                    >
                        📊 Export Excel
                    </button>
                    <button
                        onClick={exportToPDF}
                        disabled={exporting}
                        style={{
                            padding: '0.7rem 1.6rem', borderRadius: 12,
                            border: 'none', fontWeight: 700, fontSize: 15,
                            background: exporting ? 'rgba(128,128,128,0.3)' : theme.accent,
                            color: '#fff', cursor: exporting ? 'not-allowed' : 'pointer',
                            boxShadow: exporting ? 'none' : '0 2px 10px rgba(0,122,255,0.3)',
                        }}
                    >
                        {exporting ? '⏳ Generating...' : '📄 Export PDF'}
                    </button>
                </div>
            )}
    </div>
  );
} // Ensure valid closure if messed up, but replace is safe