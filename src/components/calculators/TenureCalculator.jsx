import React, { useState } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

export default function TenureCalculator({ theme }) {
    const [amount, setAmount] = useState('');
    const [rate, setRate] = useState('8.70');
    const [emi, setEmi] = useState('');
    const [result, setResult] = useState(null);
    const [chartData, setChartData] = useState(null);
    const [schedule, setSchedule] = useState([]);
    const [error, setError] = useState('');

    const calculateTenure = () => {
        setError('');
        const P = parseFloat(amount);
        const R_annual = parseFloat(rate);
        const E = parseFloat(emi);

        if (!P || !R_annual || !E) return;

        const R = R_annual / 12 / 100;

        // Check if EMI covers interest
        const monthlyInterest = P * R;
        if (E <= monthlyInterest) {
            setError('EMI must be greater than monthly interest (' + monthlyInterest.toFixed(2) + ') to reduce principal.');
            setResult(null);
            setChartData(null);
            return;
        }

        // Formula: N = log(E / (E - P*R)) / log(1+R)
        const numerator = E / (E - P * R);
        const N = Math.log(numerator) / Math.log(1 + R);
        const months = Math.ceil(N);
        const years = (months / 12).toFixed(1);

        setResult({ months, years });

        // Generate Schedule & Chart
        let balance = P;
        const labels = [];
        const balances = [];
        const chartSchedule = [];

        // Limit iteration to avoid browser hang on very long tenure errors
        const maxMonths = 360 * 2; // 60 years cap

        // Group by Year for the chart to avoid clutter
        let yearlyData = [];

        for (let i = 1; i <= months; i++) {
            const intComp = balance * R;
            let princComp = E - intComp;
            if (balance < princComp) {
                princComp = balance; // pay off remainder
            }
            balance -= princComp;
            if (balance < 0) balance = 0;

            chartSchedule.push({
                month: i,
                principal: princComp,
                interest: intComp,
                balance: balance
            });

            if (i % 12 === 0 || i === months) {
                labels.push(`Year ${(i / 12).toFixed(1)}`);
                balances.push(balance);
                yearlyData.push({ year: (i / 12).toFixed(1), balance });
            }
        }
        setSchedule(chartSchedule);

        setChartData({
            labels: labels,
            datasets: [
                {
                    label: 'Loan Balance',
                    data: balances,
                    backgroundColor: theme.accent,
                    borderRadius: 4,
                }
            ]
        });
    };

    async function exportToExcel() {
        if (schedule.length === 0) return;
        const XLSX = await import('xlsx');

        const rows = schedule.map(row => ({
            Month: row.month,
            'Principal (₹)': Math.round(row.principal),
            'Interest (₹)': Math.round(row.interest),
            'Balance (₹)': Math.round(row.balance)
        }));

        rows.push({});
        rows.push({ Month: 'Disclaimer', 'Principal (₹)': 'This is for personal use only.' });

        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Tenure_Schedule');
        XLSX.writeFile(wb, 'Loan_Tenure_Schedule.xlsx');
    }

    const options = {
        responsive: true,
        plugins: {
            legend: { position: 'top', labels: { color: theme.text } },
            title: { display: true, text: 'Balance Over Time (Yearly)', color: theme.text },
        },
        scales: {
            x: { ticks: { color: theme.text }, grid: { color: theme.border } },
            y: { ticks: { color: theme.text }, grid: { color: theme.border } }
        }
    };

    return (
        <div style={{ textAlign: 'center', color: theme.text }}>
            <h2 style={{ fontWeight: 700, fontSize: 28, marginBottom: 12 }}>Tenure Calculator</h2>
            <p style={{ fontSize: 16, marginBottom: 32, opacity: 0.8 }}>Enter loan details and EMI to find out how long it takes to repay.</p>

            <form onSubmit={e => { e.preventDefault(); calculateTenure(); }} style={{ maxWidth: 400, margin: '0 auto 32px auto' }}>
                <div style={{ marginBottom: 20, textAlign: 'left' }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>Loan Amount (₹)</label>
                    <input type="number" min="0" step="1000" value={amount} onChange={e => setAmount(e.target.value)}
                        style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: 12, border: theme.border, background: theme.card, color: theme.text, fontSize: 16, outline: 'none', boxShadow: theme.shadow }} required />
                </div>
                <div style={{ marginBottom: 20, textAlign: 'left' }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>Interest Rate (p.a. %)</label>
                    <input type="number" min="0" step="0.01" value={rate} onChange={e => setRate(e.target.value)}
                        style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: 12, border: theme.border, background: theme.card, color: theme.text, fontSize: 16, outline: 'none', boxShadow: theme.shadow }} required />
                </div>
                <div style={{ marginBottom: 24, textAlign: 'left' }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>Desired EMI (₹)</label>
                    <input type="number" min="0" step="100" value={emi} onChange={e => setEmi(e.target.value)}
                        style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: 12, border: theme.border, background: theme.card, color: theme.text, fontSize: 16, outline: 'none', boxShadow: theme.shadow }} required />
                </div>

                {error && <div style={{ color: '#ff4d4f', marginBottom: 16, fontWeight: 600 }}>{error}</div>}

                <button type="submit" style={{
                    width: '100%', padding: '0.9rem', borderRadius: 12, border: 'none', fontWeight: 700, fontSize: 18,
                    background: theme.navActive, color: '#fff', cursor: 'pointer', boxShadow: '0 4px 12px #00c6ae44',
                    transition: 'transform 0.2s',
                }}>
                    Calculate Tenure
                </button>
            </form>

            {result && (
                <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 32 }}>
                        <div style={{ background: theme.glass, padding: '20px 32px', borderRadius: 16, border: theme.border }}>
                            <div style={{ fontSize: 14, opacity: 0.8, marginBottom: 4 }}>Total Months</div>
                            <div style={{ fontSize: 32, fontWeight: 800, color: theme.accent }}>{result.months}</div>
                        </div>
                        <div style={{ background: theme.glass, padding: '20px 32px', borderRadius: 16, border: `1px solid ${theme.accent2}` }}>
                            <div style={{ fontSize: 14, opacity: 0.8, marginBottom: 4 }}>Years</div>
                            <div style={{ fontSize: 32, fontWeight: 800, color: theme.accent2 }}>{result.years}</div>
                        </div>
                    </div>

                    {chartData && (
                        <div style={{ background: theme.card, padding: 16, borderRadius: 16, marginBottom: 24, boxShadow: theme.shadow }}>
                            <Bar options={options} data={chartData} />
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
                        Export Schedule Excel
                    </button>
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
