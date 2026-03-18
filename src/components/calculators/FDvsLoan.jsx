import React, { useState } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { getAmortizationStats, getInterestAccruedTillMonth } from '../../utils/financeUtils';
import { exportDataToExcel } from '../../utils/exportUtils';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

export default function FDvsLoan({ theme }) {
    const [prepayAmount, setPrepayAmount] = useState('');
    const [loanBalance, setLoanBalance] = useState('');
    const [loanRate, setLoanRate] = useState('8.70');
    const [currentEMI, setCurrentEMI] = useState('');
    const [fdRate, setFdRate] = useState('');

    const [result, setResult] = useState(null);
    const [chartData, setChartData] = useState(null);
    const [error, setError] = useState('');

    const calculateComparison = () => {
        setError('');
        const P_prepay = parseFloat(prepayAmount);
        const B_loan = parseFloat(loanBalance);
        const R_loan = parseFloat(loanRate);
        const E_emi = parseFloat(currentEMI);
        const R_fd = parseFloat(fdRate);

        if (!P_prepay || !B_loan || !R_loan || !E_emi || !R_fd) return;
        if (P_prepay >= B_loan) {
            setError("Prepayment amount cannot be greater than or equal to Loan Balance.");
            return;
        }

        // 1. Calculate Original Loan Details (No Prepayment)
        const rL_monthly = R_loan / 12 / 100;

        // Check if EMI is sufficient
        if (B_loan * rL_monthly >= E_emi) {
            setError("EMI is too low to cover interest. Loan will never be paid off.");
            return;
        }

        const { totalInterest: intOld, tenureMonths: tenureOld } = getAmortizationStats(B_loan, rL_monthly, E_emi);

        // 2. Calculate New Loan Details (With Prepayment)
        const newBalance = B_loan - P_prepay;
        // Assuming EMI stays same, tenure reduces
        const { totalInterest: intNew, tenureMonths: tenureNew } = getAmortizationStats(newBalance, rL_monthly, E_emi);

        const interestSaved = intOld - intNew;
        const timeSavedMonths = tenureOld - tenureNew;

        // 3. Calculate FD Returns (Monthly Compounding as per user request)
        // Tenure = tenureOld (Opportunity cost duration)
        const tenureMonths = tenureOld;
        // A = P(1 + r/12)^(months)
        const rF_monthly = R_fd / 12 / 100;
        const maturityFD = P_prepay * Math.pow(1 + rF_monthly, tenureMonths);
        const interestEarned = maturityFD - P_prepay;

        const diff = interestSaved - interestEarned;
        const recommendation = diff > 0 ? 'Prepay Loan' : 'Invest in FD';

        setResult({
            interestSaved,
            interestEarned,
            diff,
            recommendation,
            timeSavedMonths,
            tenureOld,
            originalInterest: intOld,
            newInterest: intNew
        });

        // 4. Generate Chart Data
        const labels = [];
        const loanSavingsData = [];
        const fdEarningsData = [];

        // Plot yearly points for readability
        const years = Math.ceil(tenureOld / 12);

        for (let y = 0; y <= years; y++) {
            const months = y * 12;
            labels.push(`Year ${y}`);

            // FD Growth at year Y (Monthly Compounding)
            if (months <= tenureOld) {
                const valFD = P_prepay * Math.pow(1 + rF_monthly, months) - P_prepay;
                fdEarningsData.push(valFD);
            } else {
                // Cap at maturity
                fdEarningsData.push(interestEarned);
            }

            // Loan Interest Saved at year Y
            // Saved = (Interest Accrued Old) - (Interest Accrued New)
            const intAccruedOld = getInterestAccruedTillMonth(B_loan, rL_monthly, E_emi, months);
            const intAccruedNew = getInterestAccruedTillMonth(newBalance, rL_monthly, E_emi, months);
            loanSavingsData.push(intAccruedOld - intAccruedNew);
        }

        setChartData({
            labels,
            datasets: [
                {
                    label: 'Loan Interest Saved',
                    data: loanSavingsData,
                    borderColor: theme.accent,
                    backgroundColor: theme.accent + '22',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'FD Interest Earned',
                    data: fdEarningsData,
                    borderColor: theme.accent2,
                    backgroundColor: theme.accent2 + '22',
                    fill: true,
                    tension: 0.4
                }
            ]
        });
    };

    async function exportToExcel() {
        if (!result) return;

        const rows = [
            { Metric: 'Loan Interest Saved', Value: Math.round(result.interestSaved) },
            { Metric: 'FD Interest Earned', Value: Math.round(result.interestEarned) },
            { Metric: 'Net Benefit', Value: Math.round(Math.abs(result.diff)) + (result.diff > 0 ? ' (Prepayment)' : ' (Invest)') },
            { Metric: 'Time Saved', Value: result.timeSavedMonths + ' months' },
            { Metric: '', Value: '' },
            { Metric: 'Disclaimer', Value: 'This is for personal use only.' }
        ];

        await exportDataToExcel(rows, 'Prepay_vs_FD_Analysis.xlsx', 'Prepay_vs_FD_Report', 'json');
    }

    const options = React.useMemo(() => ({
        responsive: true,
        interaction: {
            mode: 'index',
            intersect: false,
        },
        plugins: {
            legend: { position: 'top', labels: { color: theme.text } },
            title: { display: true, text: 'Cumulative Benefit Analysis', color: theme.text },
        },
        scales: {
            x: { ticks: { color: theme.text }, grid: { color: theme.border } },
            y: { ticks: { color: theme.text }, grid: { color: theme.border } }
        }
    }), [theme.text, theme.border]);

    return (
        <div style={{ textAlign: 'center', color: theme.text }}>
            <h2 style={{ fontWeight: 700, fontSize: 28, marginBottom: 12 }}>FD vs Loan Prepayment</h2>
            <p style={{ fontSize: 16, marginBottom: 32, opacity: 0.8 }}>Advanced comparison: Monthly Reducing Balance (Loan) vs Monthly Compounding (FD).</p>

            <form onSubmit={e => { e.preventDefault(); calculateComparison(); }} style={{ maxWidth: 600, margin: '0 auto 32px auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <div style={{ marginBottom: 20, textAlign: 'left' }}>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>Available for Prepayment (₹)</label>
                        <input type="number" min="0" step="1000" value={prepayAmount} onChange={e => setPrepayAmount(e.target.value)}
                            style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: 12, border: theme.border, background: theme.card, color: theme.text, fontSize: 16, outline: 'none', boxShadow: theme.shadow }} required />
                    </div>
                    <div style={{ marginBottom: 20, textAlign: 'left' }}>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>Current Loan Balance (₹)</label>
                        <input type="number" min="0" step="1000" value={loanBalance} onChange={e => setLoanBalance(e.target.value)}
                            style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: 12, border: theme.border, background: theme.card, color: theme.text, fontSize: 16, outline: 'none', boxShadow: theme.shadow }} required />
                    </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                    <div style={{ marginBottom: 20, textAlign: 'left' }}>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>Current EMI (₹)</label>
                        <input type="number" min="0" step="100" value={currentEMI} onChange={e => setCurrentEMI(e.target.value)}
                            style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: 12, border: theme.border, background: theme.card, color: theme.text, fontSize: 16, outline: 'none', boxShadow: theme.shadow }} required />
                    </div>
                    <div style={{ marginBottom: 20, textAlign: 'left' }}>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, color: theme.accent }}>Loan Rate (%)</label>
                        <input type="number" min="0" step="0.01" value={loanRate} onChange={e => setLoanRate(e.target.value)}
                            style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: 12, border: `1px solid ${theme.accent}`, background: theme.card, color: theme.text, fontSize: 16, outline: 'none', boxShadow: theme.shadow }} required />
                    </div>
                    <div style={{ marginBottom: 20, textAlign: 'left' }}>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, color: theme.accent2 }}>FD Rate (%)</label>
                        <input type="number" min="0" step="0.01" value={fdRate} onChange={e => setFdRate(e.target.value)}
                            style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: 12, border: `1px solid ${theme.accent2}`, background: theme.card, color: theme.text, fontSize: 16, outline: 'none', boxShadow: theme.shadow }} required />
                    </div>
                </div>

                {error && <div style={{ color: '#ff4d4f', marginBottom: 16, fontWeight: 600 }}>{error}</div>}

                <button type="submit" style={{
                    width: '100%', padding: '0.9rem', borderRadius: 12, border: 'none', fontWeight: 700, fontSize: 18,
                    background: theme.navActive, color: '#fff', cursor: 'pointer', boxShadow: '0 4px 12px #00c6ae44',
                    transition: 'transform 0.2s',
                }}>
                    Analyze
                </button>
            </form>

            {result && (
                <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
                    <div style={{ marginBottom: 32, padding: 24, borderRadius: 16, background: theme.glass, border: theme.border }}>
                        <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Recommendation: <span style={{ color: result.diff > 0 ? theme.accent : theme.accent2 }}>{result.recommendation}</span></h3>
                        <p style={{ fontSize: 16, opacity: 0.8 }}>
                            {result.diff > 0
                                ? `Prepaying saves you ₹${Math.abs(result.diff).toFixed(0)} more than investing in FD.`
                                : `Investing in FD earns you ₹${Math.abs(result.diff).toFixed(0)} more than prepaying.`}
                        </p>
                        <div style={{ marginTop: 12, fontSize: 15, fontWeight: 600, color: theme.text }}>
                            Also, prepaying finishes your loan {result.timeSavedMonths} months early!
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16, marginBottom: 32 }}>
                        <div style={{ background: theme.glass, padding: 16, borderRadius: 16, border: `1px solid ${theme.accent}` }}>
                            <div style={{ fontSize: 14, opacity: 0.8 }}>Loan Interest Saved</div>
                            <div style={{ fontSize: 20, fontWeight: 700, color: theme.accent }}>₹{result.interestSaved.toFixed(0)}</div>
                            <div style={{ fontSize: 12, opacity: 0.6 }}>(Reducing Balance)</div>
                        </div>
                        <div style={{ background: theme.glass, padding: 16, borderRadius: 16, border: `1px solid ${theme.accent2}` }}>
                            <div style={{ fontSize: 14, opacity: 0.8 }}>FD Interest Earned</div>
                            <div style={{ fontSize: 20, fontWeight: 700, color: theme.accent2 }}>₹{result.interestEarned.toFixed(0)}</div>
                            <div style={{ fontSize: 12, opacity: 0.6 }}>(Monthly Compounding)</div>
                        </div>
                    </div>

                    {chartData && (
                        <div style={{ background: theme.card, padding: 16, borderRadius: 16, marginBottom: 24, boxShadow: theme.shadow }}>
                            <Line options={options} data={chartData} />
                        </div>
                    )}

                    <button
                        onClick={exportToExcel}
                        style={{
                            padding: '0.7rem 1.5rem',
                            borderRadius: 12,
                            border: 'none',
                            fontWeight: 700,
                            fontSize: 16,
                            background: theme.accent,
                            color: '#fff',
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px #00c6ae33',
                        }}
                    >
                        Export Detailed Analysis
                    </button>
                    <div style={{ fontSize: 12, marginTop: 16, opacity: 0.6 }}>This is for personal use only.</div>
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
