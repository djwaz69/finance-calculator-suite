import React, { useState } from 'react';

export default function PrepaymentCalculator({ theme }) {
    const [amount, setAmount] = useState('');
    const [rate, setRate] = useState('8.70');
    const [emiDate, setEmiDate] = useState('5');
    const [result, setResult] = useState(null);

    const calculateInterest = () => {
        const P = parseFloat(amount);
        const R = parseFloat(rate);

        if (!P || !R) return;

        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth();
        const currentDate = today.getDate();

        const isLeapYear = (currentYear % 4 === 0 && currentYear % 100 !== 0) || (currentYear % 400 === 0);
        const daysInYear = isLeapYear ? 366 : 365;
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

        // 4) Daily Interest
        const dailyInterest = (P * R) / (100 * daysInYear);

        // 1) Prepayment - Interest from last EMI till date (including today)
        const emiDay = parseInt(emiDate) || 5;
        let daysTillDate = 0;
        let daysRemaining = daysInMonth - currentDate;

        if (currentDate >= emiDay) {
            daysTillDate = currentDate - emiDay + 1;
        } else {
            const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();
            daysTillDate = (daysInPrevMonth - emiDay) + currentDate + 1;
        }

        const prepaymentInterest = dailyInterest * daysTillDate;

        // 2) Pre EMI Interest - Simple interest from today till last day of the month
        // logic: total no of days in the month less yesterdays date
        const preEmiInterestPartial = dailyInterest * (daysRemaining + 1);

        // 3) Pre EMI for the month - total interest for the year divide by 12
        const annualInterest = (P * R) / 100;
        const preEmiForMonth = annualInterest / 12;

        setResult({
            dailyInterest,
            prepaymentInterest,
            preEmiInterestPartial,
            preEmiForMonth,
            daysTillDate,
            daysRemaining,
            isLeapYear,
            daysInYear,
            currentYear
        });
    };

    return (
        <div style={{ textAlign: 'center', color: theme.text }}>
            <h2 style={{ fontWeight: 700, fontSize: 28, marginBottom: 12 }}>Interest Calculator</h2>
            <p style={{ fontSize: 16, marginBottom: 32, opacity: 0.8 }}>View immediate simple interest snapshots.</p>

            <form onSubmit={e => { e.preventDefault(); calculateInterest(); }} style={{ maxWidth: 460, margin: '0 auto 32px auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr) minmax(0,1fr)', gap: 16, marginBottom: 24 }}>
                    <div style={{ textAlign: 'left' }}>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>Principal Amount (₹)</label>
                        <input type="number" min="0" step="1000" value={amount} onChange={e => setAmount(e.target.value)}
                            style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: 12, border: theme.border, background: theme.card, color: theme.text, fontSize: 16, outline: 'none', boxShadow: theme.shadow }} required />
                    </div>
                    <div style={{ textAlign: 'left' }}>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>Interest Rate (p.a. %)</label>
                        <input type="number" min="0" step="0.01" value={rate} onChange={e => setRate(e.target.value)}
                            style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: 12, border: theme.border, background: theme.card, color: theme.text, fontSize: 16, outline: 'none', boxShadow: theme.shadow }} required />
                    </div>
                    <div style={{ textAlign: 'left' }}>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>EMI Date (1-31)</label>
                        <input type="number" min="1" max="31" value={emiDate} onChange={e => setEmiDate(e.target.value)}
                            style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: 12, border: theme.border, background: theme.card, color: theme.text, fontSize: 16, outline: 'none', boxShadow: theme.shadow }} required />
                    </div>
                </div>
                <button type="submit" style={{
                    width: '100%', padding: '0.9rem', borderRadius: 12, border: 'none', fontWeight: 700, fontSize: 18,
                    background: theme.navActive, color: '#fff', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,198,174,0.3)',
                    transition: 'transform 0.2s',
                }}>
                    Calculate
                </button>
            </form>

            {result && (
                <div style={{ animation: 'fadeIn 0.5s ease-out', maxWidth: 660, margin: '0 auto' }}>
                    <div style={{ 
                        marginBottom: 24, padding: '12px 16px', borderRadius: 12, 
                        background: result.isLeapYear ? 'rgba(0,198,174,0.1)' : 'rgba(128,128,128,0.1)', 
                        border: result.isLeapYear ? `1px solid ${theme.accent2}` : theme.border,
                        fontSize: 14, fontWeight: 500
                    }}>
                        <strong>Leap Year Logic Applied:</strong> The year {result.currentYear} is {result.isLeapYear ? 'a leap year' : 'not a leap year'}, 
                        so the total number of days used for daily interest is {result.daysInYear}. 
                        Monthly interest remains unchanged, but daily calculations will reflect this.
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 32 }}>
                        
                        <div style={{ background: theme.glass, padding: 20, borderRadius: 16, border: theme.border, textAlign: 'left' }}>
                            <div style={{ fontSize: 15, opacity: 0.8, marginBottom: 4, fontWeight: 600 }}>1. Prepayment Interest</div>
                            <div style={{ fontSize: 13, opacity: 0.6, marginBottom: 8, minHeight: 40 }}>From 1st till date (incl. today: {result.daysTillDate} days)</div>
                            <div style={{ fontSize: 26, fontWeight: 800, color: theme.accent }}>+₹{Math.ceil(result.prepaymentInterest).toLocaleString('en-IN')}</div>
                        </div>

                        <div style={{ background: theme.glass, padding: 20, borderRadius: 16, border: theme.border, textAlign: 'left' }}>
                            <div style={{ fontSize: 15, opacity: 0.8, marginBottom: 4, fontWeight: 600 }}>2. Pre EMI Interest</div>
                            <div style={{ fontSize: 13, opacity: 0.6, marginBottom: 8, minHeight: 40 }}>From today till month end ({result.daysRemaining} days left)</div>
                            <div style={{ fontSize: 26, fontWeight: 800, color: theme.accent2 }}>+₹{Math.ceil(result.preEmiInterestPartial).toLocaleString('en-IN')}</div>
                        </div>

                        <div style={{ background: theme.glass, padding: 20, borderRadius: 16, border: theme.border, textAlign: 'left' }}>
                            <div style={{ fontSize: 15, opacity: 0.8, marginBottom: 4, fontWeight: 600 }}>3. Pre EMI For The Month</div>
                            <div style={{ fontSize: 13, opacity: 0.6, marginBottom: 8, minHeight: 40 }}>Total interest for full month (Annual / 12)</div>
                            <div style={{ fontSize: 26, fontWeight: 800, color: theme.text }}>₹{Math.ceil(result.preEmiForMonth).toLocaleString('en-IN')}</div>
                        </div>

                        <div style={{ background: theme.glass, padding: 20, borderRadius: 16, border: theme.border, textAlign: 'left' }}>
                            <div style={{ fontSize: 15, opacity: 0.8, marginBottom: 4, fontWeight: 600 }}>4. Daily Interest</div>
                            <div style={{ fontSize: 13, opacity: 0.6, marginBottom: 8, minHeight: 40 }}>Calculated per day (Annual / {result.daysInYear})</div>
                            <div style={{ fontSize: 26, fontWeight: 800, color: theme.text }}>₹{Math.ceil(result.dailyInterest).toLocaleString('en-IN')}</div>
                        </div>

                    </div>
                </div>
            )}
    </div>
  );
} // Ensure valid closure if messed up, but replace is safe