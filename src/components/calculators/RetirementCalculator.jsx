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

export default function RetirementCalculator({ theme }) {
    const [currentAge, setCurrentAge] = useState('');
    const [corpus, setCorpus] = useState('');
    const [rate, setRate] = useState('');
    const [result, setResult] = useState(null);
    const [chartData, setChartData] = useState(null);

    const calculate = () => {
        const age = parseInt(currentAge);
        const P = parseFloat(corpus);
        const R = parseFloat(rate);

        if (!age || !P || !R) return;

        const maxAge = 100;
        const years = maxAge - age;
        const months = years * 12;
        const r_monthly = R / 12 / 100;

        // Formula for Max Withdrawal (Annuity):
        // P = PMT * [1 - (1+r)^-n] / r
        // PMT = P * r / [1 - (1+r)^-n]

        let monthlyWithdrawal = 0;
        if (R === 0) {
            monthlyWithdrawal = P / months;
        } else {
            monthlyWithdrawal = (P * r_monthly) / (1 - Math.pow(1 + r_monthly, -months));
        }

        setResult({
            monthlyWithdrawal,
            years,
            totalWithdrawn: monthlyWithdrawal * months
        });

        // Chart Data - Declining Balance
        const labels = [];
        const balances = [];
        let balance = P;

        for (let i = 0; i <= months; i++) {
            if (i % 12 === 0) {
                labels.push(age + i / 12);
                balances.push(balance);
            }
            const interest = balance * r_monthly;
            balance = balance + interest - monthlyWithdrawal;
            if (balance < 0) balance = 0;
        }

        setChartData({
            labels,
            datasets: [
                {
                    label: 'Corpus Balance',
                    data: balances,
                    borderColor: theme.accent,
                    backgroundColor: theme.accent + '33',
                    fill: true,
                    tension: 0.4
                }
            ]
        });
    };

    const options = {
        responsive: true,
        plugins: {
            legend: { position: 'top', labels: { color: theme.text } },
            title: { display: true, text: 'Corpus Depletion till Age 100', color: theme.text },
        },
        scales: {
            x: { title: { display: true, text: 'Age', color: theme.text }, ticks: { color: theme.text }, grid: { color: theme.border } },
            y: { ticks: { color: theme.text }, grid: { color: theme.border } }
        }
    };

    return (
        <div style={{ textAlign: 'center', color: theme.text }}>
            <h2 style={{ fontWeight: 700, fontSize: 28, marginBottom: 12 }}>Retirement Withdrawal</h2>
            <p style={{ fontSize: 16, marginBottom: 32, opacity: 0.8 }}>Calculate how much you can withdraw monthly till age 100.</p>

            <form onSubmit={e => { e.preventDefault(); calculate(); }} style={{ maxWidth: 400, margin: '0 auto 32px auto' }}>
                <div style={{ marginBottom: 20, textAlign: 'left' }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>Current Age</label>
                    <input type="number" min="1" max="99" value={currentAge} onChange={e => setCurrentAge(e.target.value)}
                        style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: 12, border: theme.border, background: theme.card, color: theme.text, fontSize: 16, outline: 'none', boxShadow: theme.shadow }} required />
                </div>
                <div style={{ marginBottom: 20, textAlign: 'left' }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>Current Corpus (₹)</label>
                    <input type="number" min="0" step="1000" value={corpus} onChange={e => setCorpus(e.target.value)}
                        style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: 12, border: theme.border, background: theme.card, color: theme.text, fontSize: 16, outline: 'none', boxShadow: theme.shadow }} required />
                </div>
                <div style={{ marginBottom: 20, textAlign: 'left' }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>Expected Return (p.a. %)</label>
                    <input type="number" min="0" step="0.1" value={rate} onChange={e => setRate(e.target.value)}
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
                    <div style={{ marginBottom: 24, padding: 24, borderRadius: 16, background: theme.glass, border: theme.border }}>
                        <div style={{ fontSize: 16, opacity: 0.8, marginBottom: 8 }}>Safe Monthly Withdrawal</div>
                        <div style={{ fontSize: 36, fontWeight: 800, color: theme.accent }}>₹{Math.floor(result.monthlyWithdrawal).toLocaleString()}</div>
                        <div style={{ fontSize: 12, opacity: 0.6, marginTop: 8 }}>For next {result.years} years</div>
                    </div>

                    {chartData && (
                        <div style={{ background: theme.card, padding: 16, borderRadius: 16, marginBottom: 24, boxShadow: theme.shadow }}>
                            <Line options={options} data={chartData} />
                        </div>
                    )}
                    <div style={{ fontSize: 12, marginTop: 16, opacity: 0.6 }}>This is for personal use only.</div>
                </div>
            )}
            <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
        </div>
    );
}
