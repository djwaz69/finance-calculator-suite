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
    Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

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

export default function PrepaymentCalculator({ theme }) {
    const [amount, setAmount] = useState('');
    const [rate, setRate] = useState('8.70');
    const [result, setResult] = useState(null);
    const [chartData, setChartData] = useState(null);

    const calculateInterest = () => {
        const P = parseFloat(amount);
        const R = parseFloat(rate);

        if (!P || !R) return;

        const today = new Date();
        const currentDay = today.getDate();
        // Get total days in current month
        const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

        // Simple Interest Formula: SI = P * R * T / 100
        // Rate is per annum usually.
        // Daily Interest
        const dailyInterest = (P * R) / (100 * 365);
        const interestTillToday = dailyInterest * currentDay;
        const monthlyInterest = dailyInterest * daysInMonth; // Approx for this month

        setResult({
            dailyInterest,
            interestTillToday,
            monthlyInterest,
            currentDay,
            daysInMonth
        });

        // Prepare Chart Data (Cumulative Interest for the month)
        const labels = Array.from({ length: daysInMonth }, (_, i) => i + 1);
        const dataPoints = labels.map(day => dailyInterest * day);

        setChartData({
            labels,
            datasets: [
                {
                    label: 'Cumulative Interest (₹)',
                    data: dataPoints,
                    borderColor: theme.accent,
                    backgroundColor: theme.accent + '33', // Add transparency
                    fill: true,
                    tension: 0.4,
                    pointRadius: 2,
                    pointHoverRadius: 6,
                },
                {
                    label: 'Today',
                    data: labels.map(day => day === currentDay ? dailyInterest * day : null),
                    borderColor: theme.accent2,
                    backgroundColor: theme.accent2,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    showLine: false
                }
            ],
        });
    };

    async function exportToExcel() {
        if (!result) return;
        const XLSX = await import('xlsx');
        const P = parseFloat(amount);

        // Create daily breakdown
        const rows = chartData.labels.map((day, index) => ({
            Day: day,
            'Cumulative Interest (₹)': chartData.datasets[0].data[index].toFixed(2),
            'Status': day === result.currentDay ? 'TODAY' : (day < result.currentDay ? 'Passed' : 'Future')
        }));

        rows.push({});
        rows.push({ Day: 'Disclaimer', 'Cumulative Interest (₹)': 'This is for personal use only.' });

        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Interest_Breakdown');
        XLSX.writeFile(wb, 'Prepayment_Interest_Calc.xlsx');
    }

    // Chart options
    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
                labels: { color: theme.text }
            },
            title: {
                display: true,
                text: 'Interest Accumulation This Month',
                color: theme.text
            },
        },
        scales: {
            x: {
                ticks: { color: theme.text },
                grid: { color: theme.border }
            },
            y: {
                ticks: { color: theme.text },
                grid: { color: theme.border }
            }
        }
    };

    return (
        <div style={{ textAlign: 'center', color: theme.text }}>
            <h2 style={{ fontWeight: 700, fontSize: 28, marginBottom: 12 }}>Interest Calculator</h2>
            <p style={{ fontSize: 16, marginBottom: 32, opacity: 0.8 }}>Calculate simple interest accumulation for the current month.</p>

            <form onSubmit={e => { e.preventDefault(); calculateInterest(); }} style={{ maxWidth: 400, margin: '0 auto 32px auto' }}>
                <div style={{ marginBottom: 20, textAlign: 'left' }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>Principal Amount (₹)</label>
                    <input type="number" min="0" step="1000" value={amount} onChange={e => setAmount(e.target.value)}
                        style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: 12, border: theme.border, background: theme.card, color: theme.text, fontSize: 16, outline: 'none', boxShadow: theme.shadow }} required />
                </div>
                <div style={{ marginBottom: 24, textAlign: 'left' }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>Interest Rate (p.a. %)</label>
                    <input type="number" min="0" step="0.01" value={rate} onChange={e => setRate(e.target.value)}
                        style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: 12, border: theme.border, background: theme.card, color: theme.text, fontSize: 16, outline: 'none', boxShadow: theme.shadow }} required />
                </div>
                <button type="submit" style={{
                    width: '100%', padding: '0.9rem', borderRadius: 12, border: 'none', fontWeight: 700, fontSize: 18,
                    background: theme.navActive, color: '#fff', cursor: 'pointer', boxShadow: '0 4px 12px #00c6ae44',
                    transition: 'transform 0.2s',
                }}>
                    Calculate
                </button>
            </form>

            {result && (
                <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16, marginBottom: 32 }}>
                        <div style={{ background: theme.glass, padding: 16, borderRadius: 16, border: theme.border }}>
                            <div style={{ fontSize: 14, opacity: 0.8 }}>Interest Today</div>
                            <div style={{ fontSize: 20, fontWeight: 700, color: theme.accent }}>₹{result.dailyInterest.toFixed(2)}</div>
                        </div>
                        <div style={{ background: theme.glass, padding: 16, borderRadius: 16, border: `1px solid ${theme.accent2}` }}>
                            <div style={{ fontSize: 14, opacity: 0.8 }}>Till Date ({result.currentDay} Days)</div>
                            <div style={{ fontSize: 24, fontWeight: 800, color: theme.accent2 }}>₹{result.interestTillToday.toFixed(2)}</div>
                        </div>
                        <div style={{ background: theme.glass, padding: 16, borderRadius: 16, border: theme.border }}>
                            <div style={{ fontSize: 14, opacity: 0.8 }}>Proj. Monthly</div>
                            <div style={{ fontSize: 20, fontWeight: 700, color: theme.text }}>₹{result.monthlyInterest.toFixed(2)}</div>
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
                        Export Excel
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
