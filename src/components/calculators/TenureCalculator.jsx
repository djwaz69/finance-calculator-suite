import React, { useState } from 'react';
import { exportDataToExcel } from '../../utils/exportUtils';
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
    
    // Term Change Feature State
    const [rcdDate, setRcdDate] = useState('');
    const [sanctionedTenure, setSanctionedTenure] = useState('');
    const [balanceTenure, setBalanceTenure] = useState('');
    const [borrowerAge, setBorrowerAge] = useState('');
    const [employmentType, setEmploymentType] = useState('Employed');
    const [termChangeResult, setTermChangeResult] = useState(null);

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
            setError('Interest is not getting covered, please increase EMI. (Min required: ₹' + Math.ceil(monthlyInterest + 1) + ')');
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

        for (let i = 1; i <= months && i <= maxMonths; i++) {
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

        const rows = schedule.map(row => ({
            Month: row.month,
            'Principal (₹)': Math.round(row.principal),
            'Interest (₹)': Math.round(row.interest),
            'Balance (₹)': Math.round(row.balance)
        }));

        rows.push({});
        rows.push({ Month: 'Disclaimer', 'Principal (₹)': 'This is for personal use only.' });

        await exportDataToExcel(rows, 'Loan_Tenure_Schedule.xlsx', 'Tenure_Schedule', 'json');
    }

    const calculateTermChange = () => {
        if (!rcdDate || !sanctionedTenure || !balanceTenure || !borrowerAge) return;
        
        const currentDate = new Date();
        const rcd = new Date(rcdDate);
        
        // 1. Calculate time passed and remaining original limits
        let Loan_Amortized = (currentDate.getFullYear() - rcd.getFullYear()) * 12 + (currentDate.getMonth() - rcd.getMonth());
        if (Loan_Amortized < 0) Loan_Amortized = 0;
        
        const Remaining_Sanction = parseInt(sanctionedTenure) - Loan_Amortized;

        // 2. Calculate the age-based maximum in months
        const Retirement_Age = employmentType === 'Self-Employed' ? 70 : 60;
        const Age_Ceiling_Months = (Retirement_Age - parseInt(borrowerAge)) * 12;

        // 3. Determine proposed tenure based on your rule
        const balTenure = parseInt(balanceTenure);
        let Target_Tenure;
        if (balTenure < Remaining_Sanction) {
            Target_Tenure = Remaining_Sanction;
        } else {
            Target_Tenure = balTenure;
        }

        // 4. Apply the final age cap
        const Final_Max_Tenure = Math.min(Target_Tenure, Age_Ceiling_Months);

        setTermChangeResult({
            Loan_Amortized,
            Remaining_Sanction,
            Target_Tenure,
            Age_Ceiling_Months,
            Final_Max_Tenure,
            Retirement_Age
        });
    };

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

            <hr style={{ margin: '48px 0', borderTop: `1px solid rgba(128,128,128,0.2)`, borderBottom: 'none' }} />

            {/* Term Change Possibility Feature */}
            <h3 style={{ fontWeight: 700, fontSize: 24, marginBottom: 12 }}>Term Change Possibility</h3>
            <p style={{ fontSize: 16, marginBottom: 32, opacity: 0.8 }}>Calculate the maximum possible tenure extension based on age and existing loan duration.</p>

            <form onSubmit={e => { e.preventDefault(); calculateTermChange(); }} style={{ maxWidth: 500, margin: '0 auto 16px auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16, marginBottom: 20 }}>
                    <div style={{ textAlign: 'left' }}>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>RCD Date (EMI Start Month)</label>
                        <input type="month" value={rcdDate} onChange={e => setRcdDate(e.target.value)}
                            style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: 12, border: theme.border, background: theme.card, color: theme.text, fontSize: 16, outline: 'none', boxShadow: theme.shadow }} required />
                    </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                    <div style={{ textAlign: 'left' }}>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>Borrower Age (Years)</label>
                        <input type="number" min="18" max="100" value={borrowerAge} onChange={e => setBorrowerAge(e.target.value)}
                            style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: 12, border: theme.border, background: theme.card, color: theme.text, fontSize: 16, outline: 'none', boxShadow: theme.shadow, boxSizing: 'border-box' }} required />
                    </div>
                    <div style={{ textAlign: 'left' }}>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>Employment Type</label>
                        <select value={employmentType} onChange={e => setEmploymentType(e.target.value)}
                            style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: 12, border: theme.border, background: theme.card, color: theme.text, fontSize: 16, outline: 'none', boxShadow: theme.shadow, boxSizing: 'border-box' }} required>
                            <option value="Employed">Employed</option>
                            <option value="Self-Employed">Self-Employed</option>
                        </select>
                    </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                    <div style={{ textAlign: 'left' }}>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>Sanctioned Tenure</label>
                        <input type="number" min="1" value={sanctionedTenure} onChange={e => setSanctionedTenure(e.target.value)} placeholder="Months"
                            style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: 12, border: theme.border, background: theme.card, color: theme.text, fontSize: 16, outline: 'none', boxShadow: theme.shadow, boxSizing: 'border-box' }} required />
                    </div>
                    <div style={{ textAlign: 'left' }}>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>Balance Tenure</label>
                        <input type="number" min="0" value={balanceTenure} onChange={e => setBalanceTenure(e.target.value)} placeholder="Months"
                            style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: 12, border: theme.border, background: theme.card, color: theme.text, fontSize: 16, outline: 'none', boxShadow: theme.shadow, boxSizing: 'border-box' }} required />
                    </div>
                </div>
                <button type="submit" style={{
                    width: '100%', padding: '0.9rem', borderRadius: 12, border: 'none', fontWeight: 700, fontSize: 18,
                    background: theme.navActive, color: '#fff', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,198,174,0.3)',
                    transition: 'transform 0.2s',
                }}>
                    Check Term Possibility
                </button>
            </form>

            {termChangeResult && (
                <div style={{ animation: 'fadeIn 0.5s ease-out', maxWidth: 500, margin: '0 auto 32px auto' }}>
                    <div style={{ background: theme.glass, padding: 24, borderRadius: 16, border: theme.border, textAlign: 'center' }}>
                        <div style={{ fontSize: 15, opacity: 0.8, marginBottom: 8, fontWeight: 600 }}>Final Max Tenure Possible</div>
                        <div style={{ fontSize: 36, fontWeight: 800, color: theme.accent2, marginBottom: 12 }}>{termChangeResult.Final_Max_Tenure} Months</div>
                        <div style={{ fontSize: 14, opacity: 0.9, lineHeight: 1.5 }}>
                            <strong>Logic breakdown:</strong><br />
                            Loan Amortized: {termChangeResult.Loan_Amortized} months<br />
                            Remaining Sanction: {termChangeResult.Remaining_Sanction} months<br />
                            Target Tenure: {termChangeResult.Target_Tenure} months<br />
                            Age Ceiling limits max to: {termChangeResult.Age_Ceiling_Months} months (Retires at {termChangeResult.Retirement_Age})<br />
                        </div>
                    </div>
                </div>
            )}
            
            <div style={{ fontSize: 12, opacity: 0.6, maxWidth: 500, margin: '0 auto', fontStyle: 'italic', lineHeight: 1.5 }}>
                Disclaimer - This takes into account the {employmentType === 'Self-Employed' ? 'Self-Employed retirement age of 70' : 'standard retirement age of 60'}.
            </div>
    </div>
  );
} // Ensure valid closure if messed up, but replace is safe