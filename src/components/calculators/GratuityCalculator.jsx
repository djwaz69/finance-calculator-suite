import React, { useState } from 'react';

function fmt(n) {
    return Math.round(n).toLocaleString('en-IN');
}

export default function GratuityCalculator({ theme }) {
    const [basicPay, setBasicPay] = useState('');
    const [da, setDa] = useState('');
    const [years, setYears] = useState('');
    const [months, setMonths] = useState('');
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

        const basic = parseFloat(basicPay) || 0;
        const daAmt = parseFloat(da) || 0;
        const yrs = parseInt(years) || 0;
        const mos = parseInt(months) || 0;

        // Round up if months >= 6
        const completedYears = mos >= 6 ? yrs + 1 : yrs;

        // Gratuity = (n × (Basic + DA) × 15) / 26
        const gratuity = (completedYears * (basic + daAmt) * 15) / 26;

        setResult({
            basic,
            da: daAmt,
            basicPlusDa: basic + daAmt,
            inputYears: yrs,
            inputMonths: mos,
            completedYears,
            gratuity,
            taxFreePrivate: 2000000,
            taxFreeGovt: 2500000,
            taxableAmountPrivate: Math.max(0, gratuity - 2000000),
            taxableAmountGovt: Math.max(0, gratuity - 2500000),
        });
    }

    const infoCardStyle = {
        background: theme.card,
        borderRadius: 12,
        border: theme.border,
        padding: '12px 16px',
        marginBottom: 12,
    };

    return (
        <div style={{ color: theme.text }}>
            <h2 style={{ fontWeight: 800, fontSize: 28, marginBottom: 6, textAlign: 'center' }}>
                Gratuity Calculator
            </h2>
            <p style={{ fontSize: 14, opacity: 0.65, textAlign: 'center', marginBottom: 28 }}>
                Calculate gratuity as per the Payment of Gratuity Act — Formula: (n × (Basic + DA) × 15) / 26
            </p>

            {/* ── FORM ── */}
            <form onSubmit={calculate} style={{ maxWidth: 500, margin: '0 auto 32px auto' }}>

                <div style={{ background: theme.glass, borderRadius: 16, border: theme.border, padding: 24, marginBottom: 18 }}>
                    <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 18 }}>Salary Details (Monthly)</h3>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                        <div>
                            <label style={labelStyle}>Last Drawn Basic Pay (₹/month)</label>
                            <input
                                type="number" min="0" step="100" required
                                value={basicPay} onChange={e => setBasicPay(e.target.value)}
                                placeholder="e.g. 50000" style={inputStyle}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Dearness Allowance — DA (₹/month)</label>
                            <input
                                type="number" min="0" step="100"
                                value={da} onChange={e => setDa(e.target.value)}
                                placeholder="e.g. 5000 (0 if none)" style={inputStyle}
                            />
                        </div>
                    </div>

                    <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 14 }}>Employment Duration</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                        <div>
                            <label style={labelStyle}>Years of Service</label>
                            <input
                                type="number" min="0" max="60" step="1" required
                                value={years} onChange={e => setYears(e.target.value)}
                                placeholder="e.g. 10" style={inputStyle}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Additional Months (0–11)</label>
                            <input
                                type="number" min="0" max="11" step="1"
                                value={months} onChange={e => setMonths(e.target.value)}
                                placeholder="e.g. 7" style={inputStyle}
                            />
                        </div>
                    </div>
                    <p style={{ fontSize: 12, opacity: 0.6, marginTop: 8 }}>
                        If additional months ≥ 6, tenure rounds up to the next full year.
                    </p>
                </div>

                <button type="submit" style={{
                    width: '100%', padding: '0.9rem',
                    borderRadius: 12, border: 'none',
                    fontWeight: 700, fontSize: 18,
                    background: theme.navActive, color: '#fff',
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(0,122,255,0.3)',
                }}>
                    Calculate Gratuity
                </button>
            </form>

            {/* ── RESULT ── */}
            {result && (
                <div style={{ maxWidth: 560, margin: '0 auto', animation: 'fadeIn 0.4s ease-out' }}>

                    {/* Gratuity Amount — Hero */}
                    <div style={{
                        background: `linear-gradient(135deg, ${theme.navActive}22, ${theme.accent}22)`,
                        border: `2px solid ${theme.navActive}`,
                        borderRadius: 18, padding: 28, textAlign: 'center', marginBottom: 20,
                    }}>
                        <div style={{ fontSize: 14, fontWeight: 600, opacity: 0.7, marginBottom: 6 }}>Gratuity Amount</div>
                        <div style={{ fontSize: 42, fontWeight: 900, color: theme.navActive }}>
                            ₹{fmt(result.gratuity)}
                        </div>
                        <div style={{ fontSize: 13, opacity: 0.6, marginTop: 8 }}>
                            {result.inputYears} years {result.inputMonths} months → effective tenure: <strong>{result.completedYears} years</strong>
                            {result.inputMonths >= 6 && result.inputMonths > 0
                                ? ` (rounded up from ${result.inputYears}y ${result.inputMonths}m)`
                                : ''}
                        </div>
                    </div>

                    {/* Formula Card */}
                    <div style={{ background: theme.glass, borderRadius: 16, border: theme.border, padding: 20, marginBottom: 20 }}>
                        <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 14 }}>Formula Applied</h3>
                        <div style={{
                            background: theme.card, borderRadius: 12, padding: 16,
                            fontFamily: 'monospace', fontSize: 14, lineHeight: 1.8,
                            border: theme.border,
                        }}>
                            <div style={{ color: theme.accent }}>Gratuity = (n × (Basic + DA) × 15) / 26</div>
                            <div style={{ marginTop: 8, opacity: 0.85 }}>
                                = ({result.completedYears} × (₹{fmt(result.basic)} + ₹{fmt(result.da)}) × 15) / 26
                            </div>
                            <div style={{ marginTop: 4, opacity: 0.85 }}>
                                = ({result.completedYears} × ₹{fmt(result.basicPlusDa)} × 15) / 26
                            </div>
                            <div style={{ marginTop: 4, fontWeight: 700, color: theme.navActive }}>
                                = <strong>₹{fmt(result.gratuity)}</strong>
                            </div>
                        </div>
                        <p style={{ fontSize: 12, opacity: 0.6, marginTop: 10 }}>
                            The divisor 26 represents average working days per month (4 weeks × 6.5 days). 15 represents 15 days of wages per year.
                        </p>
                    </div>

                    {/* Breakdown Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                        {[
                            { label: 'Basic Pay (Monthly)', val: `₹${fmt(result.basic)}` },
                            { label: 'DA (Monthly)', val: `₹${fmt(result.da)}` },
                            { label: 'Basic + DA', val: `₹${fmt(result.basicPlusDa)}` },
                            { label: 'Effective Tenure', val: `${result.completedYears} years` },
                        ].map(item => (
                            <div key={item.label} style={{ background: theme.glass, padding: 14, borderRadius: 12, border: theme.border, textAlign: 'center' }}>
                                <div style={{ fontSize: 11, opacity: 0.6, fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>{item.label}</div>
                                <div style={{ fontSize: 18, fontWeight: 700, color: theme.accent }}>{item.val}</div>
                            </div>
                        ))}
                    </div>

                    {/* Tax Information */}
                    <div style={{ background: theme.glass, borderRadius: 16, border: theme.border, padding: 20, marginBottom: 20 }}>
                        <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 14 }}>Tax Treatment</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div style={{ background: theme.card, borderRadius: 12, padding: 14, border: theme.border }}>
                                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>Private Sector</div>
                                <div style={{ fontSize: 12, opacity: 0.65, marginBottom: 8 }}>Tax-Free Limit: ₹20,00,000</div>
                                <div style={{ fontSize: 14 }}>
                                    Tax-Free: <strong style={{ color: '#22c55e' }}>₹{fmt(Math.min(result.gratuity, result.taxFreePrivate))}</strong>
                                </div>
                                {result.taxableAmountPrivate > 0 && (
                                    <div style={{ fontSize: 14, marginTop: 4 }}>
                                        Taxable: <strong style={{ color: theme.accent2 }}>₹{fmt(result.taxableAmountPrivate)}</strong>
                                    </div>
                                )}
                                {result.taxableAmountPrivate <= 0 && (
                                    <div style={{ fontSize: 13, color: '#22c55e', marginTop: 4 }}>Fully tax-exempt</div>
                                )}
                            </div>
                            <div style={{ background: theme.card, borderRadius: 12, padding: 14, border: theme.border }}>
                                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>Central Government</div>
                                <div style={{ fontSize: 12, opacity: 0.65, marginBottom: 8 }}>Tax-Free Limit: ₹25,00,000</div>
                                <div style={{ fontSize: 14 }}>
                                    Tax-Free: <strong style={{ color: '#22c55e' }}>₹{fmt(Math.min(result.gratuity, result.taxFreeGovt))}</strong>
                                </div>
                                {result.taxableAmountGovt > 0 && (
                                    <div style={{ fontSize: 14, marginTop: 4 }}>
                                        Taxable: <strong style={{ color: theme.accent2 }}>₹{fmt(result.taxableAmountGovt)}</strong>
                                    </div>
                                )}
                                {result.taxableAmountGovt <= 0 && (
                                    <div style={{ fontSize: 13, color: '#22c55e', marginTop: 4 }}>Fully tax-exempt</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Important Notes */}
                    <div style={{ background: theme.glass, borderRadius: 16, border: `1px solid ${theme.accent2}55`, padding: 22 }}>
                        <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 14 }}>Important Notes</h3>
                        {[
                            {
                                icon: '🏛️',
                                title: 'Tax-Free Limits',
                                text: 'Private sector employees: ₹20 Lakhs tax-free. Central Government employees: ₹25 Lakhs tax-free (as of 2024). Amounts exceeding these limits are added to gross salary and taxed at applicable slab rates.',
                            },
                            {
                                icon: '✅',
                                title: 'Eligibility',
                                text: 'Applicable to employees in organisations with 10 or more workers. Minimum 5 years of continuous service required (except in case of death or disablement).',
                            },
                            {
                                icon: '📅',
                                title: 'Tenure Rounding Rule',
                                text: 'If the last year includes 6 or more months, it counts as a full year. Example: 4 years and 7 months → rounded to 5 years. 4 years and 4 months → counted as 4 years.',
                            },
                            {
                                icon: '💼',
                                title: 'DA Inclusion',
                                text: 'Dearness Allowance is included in the gratuity calculation. If your employer does not provide DA, enter 0.',
                            },
                            {
                                icon: '📝',
                                title: 'Statutory Maximum',
                                text: 'Under the Payment of Gratuity Act 1972, the maximum gratuity payable is ₹20 Lakhs. However, employers may pay more as ex-gratia.',
                            },
                        ].map((note, i) => (
                            <div key={i} style={i < 4 ? { ...infoCardStyle } : { background: theme.card, borderRadius: 12, border: theme.border, padding: '12px 16px' }}>
                                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
                                    {note.icon} {note.title}
                                </div>
                                <div style={{ fontSize: 13, opacity: 0.75, lineHeight: 1.6 }}>{note.text}</div>
                            </div>
                        ))}
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
