import React, { useState } from 'react';

// SIP Future Value: FV = P * [(1+r)^n - 1] / r * (1+r)
function sipFV(monthlyAmt, annualRate, years) {
    if (!monthlyAmt || monthlyAmt <= 0) return 0;
    const r = annualRate / 12 / 100;
    const n = years * 12;
    if (r === 0) return monthlyAmt * n;
    return monthlyAmt * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
}

function fmt(n) {
    return Math.round(n).toLocaleString('en-IN');
}

function fmtLakh(n) {
    if (n >= 10000000) return '₹' + (n / 10000000).toFixed(1) + ' Cr';
    if (n >= 100000) return '₹' + (n / 100000).toFixed(1) + ' L';
    return '₹' + Math.round(n).toLocaleString('en-IN');
}

export default function FinancialAdvisor({ theme }) {
    const [data, setData] = useState({
        age: '',
        income: '',
        expenses: '',
        risk: 'Moderate',
        dependents: '0'
    });
    const [plan, setPlan] = useState(null);

    const inputStyle = {
        width: '100%', padding: '0.85rem 1rem',
        borderRadius: 12, border: theme.border,
        background: theme.card, color: theme.text,
        fontSize: 16, outline: 'none',
        boxSizing: 'border-box',
    };

    const calculatePlan = () => {
        const age = parseInt(data.age);
        const income = parseFloat(data.income);
        const expenses = parseFloat(data.expenses) || income * 0.5;
        const dependents = parseInt(data.dependents) || 0;

        if (!age || !income) return;

        // ── Core Calculations ──────────────────────────────────────────────

        // 1. Emergency Fund: 6 months of expenses (keep in liquid/FD)
        const emergencyFund = expenses * 6;

        // 2. Term Insurance: 20× Annual Income (only if dependents exist)
        const annualIncome = income * 12;
        const termCover = dependents > 0 ? annualIncome * 20 : 0;

        // Rough term premium estimate (annual): ~0.15–0.4% of cover based on age
        const premiumPct = age < 30 ? 0.0015 : age < 35 ? 0.0020 : age < 40 ? 0.0028 : age < 45 ? 0.0038 : 0.0055;
        const termPremiumAnnual = termCover * premiumPct;
        const termPremiumMonthly = termPremiumAnnual / 12;

        // 3. Health Insurance: ₹5L base + ₹2L per dependent (family floater)
        const healthCover = 500000 + dependents * 200000;
        // Rough health premium: ₹500/month per ₹5L for age < 35, more beyond
        const healthPremiumMonthly = age < 35 ? 500 * (healthCover / 500000) : 750 * (healthCover / 500000);

        // 4. Asset Allocation: Equity = (100 - Age) ± risk adjustment
        let equityPct = 100 - age;
        if (data.risk === 'High') equityPct += 10;
        if (data.risk === 'Low') equityPct -= 10;
        equityPct = Math.max(10, Math.min(90, equityPct));
        const debtPct = 100 - equityPct;

        // 5. Investible Surplus (after expenses, premiums)
        const monthlyInsuranceCost = termPremiumMonthly + healthPremiumMonthly;
        const rawSurplus = income - expenses;
        const surplus = Math.max(0, rawSurplus - monthlyInsuranceCost);

        // Investment amounts from surplus
        const equityAmt = surplus * (equityPct / 100);
        const debtAmt = surplus * (debtPct / 100);

        // PPF recommendation (subset of debt): min(debtAmt, ₹12,500/mo = ₹1.5L/yr)
        const ppfMonthly = Math.min(debtAmt, 12500);
        const debtFundMonthly = debtAmt - ppfMonthly;

        // 6. ULIP Assessment
        const ulipRecommended = false;

        // 7. FD Allocation for emergency build-up (3 months target in FD)
        const fdEmergencyTarget = expenses * 3;
        const fdMonthlyToSave = rawSurplus > 0 ? Math.min(rawSurplus * 0.25, fdEmergencyTarget / 12) : 0;
        const fdBuildMonths = fdMonthlyToSave > 0 ? Math.ceil(emergencyFund / fdMonthlyToSave) : null;

        // 8. Equity fund recommendation based on risk
        let equityFunds, debtFunds;
        if (data.risk === 'High' || equityPct >= 70) {
            equityFunds = ['Flexi-Cap Funds (core 60%)', 'Mid & Small Cap Funds (30%)', 'International/Sectoral (10%)'];
        } else if (equityPct >= 50) {
            equityFunds = ['Large Cap Index Funds (50%)', 'Balanced Advantage Funds (30%)', 'Mid Cap Funds (20%)'];
        } else {
            equityFunds = ['Large Cap / Nifty 50 Index (60%)', 'Conservative Hybrid Funds (40%)'];
        }
        debtFunds = ['PPF (₹' + fmt(ppfMonthly) + '/mo — tax-free, 7.1%)', 'Short Duration Debt Funds', 'FD (up to ₹5L DICGC insured)'];

        // 9. 10-Year Wealth Projection
        const corpus10y_equity = sipFV(equityAmt, 12, 10);
        const corpus10y_debt = sipFV(debtAmt, 7, 10);
        const totalCorpus10y = corpus10y_equity + corpus10y_debt;
        const totalInvested10y = (equityAmt + debtAmt) * 120;
        const wealthGain10y = totalCorpus10y - totalInvested10y;

        // 5-year and 15-year projections
        const corpus5y = sipFV(equityAmt, 12, 5) + sipFV(debtAmt, 7, 5);
        const corpus15y = sipFV(equityAmt, 12, 15) + sipFV(debtAmt, 7, 15);

        // 10. FIRE corpus needed (25× annual expenses)
        const fireCorpus = expenses * 12 * 25;
        let fireYears = null;
        if (surplus > 0) {
            const rawYears = Math.log(1 + (fireCorpus * (0.12 / 12)) / (surplus * (equityPct / 100))) / (Math.log(1 + 0.12 / 12) / 12);
            if (isFinite(rawYears) && rawYears > 0) {
                fireYears = Math.ceil(rawYears);
            }
        }

        setPlan({
            age, income, expenses, dependents,
            emergencyFund, termCover, termPremiumAnnual, termPremiumMonthly,
            healthCover, healthPremiumMonthly,
            equityPct, debtPct, surplus, rawSurplus,
            equityAmt, debtAmt, ppfMonthly, debtFundMonthly,
            fdEmergencyTarget, fdMonthlyToSave, fdBuildMonths,
            equityFunds, debtFunds,
            monthlyInsuranceCost,
            totalCorpus10y, totalInvested10y, wealthGain10y,
            corpus5y, corpus15y,
            ulipRecommended,
            fireCorpus, fireYears,
        });
    };

    const Card = ({ icon, title, value, sub, accent, extra }) => (
        <div style={{
            background: theme.glass, padding: '18px 20px',
            borderRadius: 16, border: theme.border,
            display: 'flex', flexDirection: 'column', gap: 6,
        }}>
            <div style={{ fontSize: 12, opacity: 0.6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{icon} {title}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: accent || theme.accent }}>{value}</div>
            {sub && <div style={{ fontSize: 12, opacity: 0.65 }}>{sub}</div>}
            {extra && <div style={{ fontSize: 12, color: theme.accent2, fontWeight: 600 }}>{extra}</div>}
        </div>
    );

    const Section = ({ title, children }) => (
        <div style={{ marginBottom: 28 }}>
            <h3 style={{
                fontSize: 18, fontWeight: 700, marginBottom: 14,
                color: theme.text,
                paddingBottom: 8, borderBottom: `2px solid ${theme.accent2}`,
                display: 'inline-block',
            }}>
                {title}
            </h3>
            {children}
        </div>
    );

    return (
        <div style={{ color: theme.text }}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <h2 style={{ fontWeight: 800, fontSize: 28, marginBottom: 8 }}>Financial Advisor</h2>
                <p style={{ fontSize: 15, opacity: 0.7 }}>
                    Enter your profile to receive a personalized, math-backed financial plan.
                </p>
            </div>

            {!plan ? (
                <form onSubmit={e => { e.preventDefault(); calculatePlan(); }}
                    style={{ maxWidth: 540, margin: '0 auto' }}>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                        <div>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, fontSize: 14 }}>Age</label>
                            <input type="number" min="18" max="80" value={data.age}
                                onChange={e => setData({ ...data, age: e.target.value })}
                                style={inputStyle} required placeholder="e.g. 30" />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, fontSize: 14 }}>Dependents</label>
                            <input type="number" min="0" max="10" value={data.dependents}
                                onChange={e => setData({ ...data, dependents: e.target.value })}
                                style={inputStyle} required placeholder="e.g. 2" />
                        </div>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, fontSize: 14 }}>Monthly Income (₹)</label>
                        <input type="number" min="0" step="1000" value={data.income}
                            onChange={e => setData({ ...data, income: e.target.value })}
                            style={inputStyle} required placeholder="e.g. 80000" />
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, fontSize: 14 }}>Monthly Expenses (₹)</label>
                        <input type="number" min="0" step="1000" value={data.expenses}
                            onChange={e => setData({ ...data, expenses: e.target.value })}
                            style={inputStyle} placeholder="e.g. 50000 (optional)" />
                    </div>

                    <div style={{ marginBottom: 24 }}>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, fontSize: 14 }}>Risk Appetite</label>
                        <div style={{ display: 'flex', gap: 10 }}>
                            {['Low', 'Moderate', 'High'].map(r => (
                                <button
                                    key={r}
                                    type="button"
                                    onClick={() => setData({ ...data, risk: r })}
                                    style={{
                                        flex: 1, padding: '10px 0',
                                        borderRadius: 12,
                                        border: data.risk === r ? 'none' : theme.border,
                                        background: data.risk === r ? theme.navActive : theme.glass,
                                        color: data.risk === r ? '#fff' : theme.text,
                                        fontWeight: 700, fontSize: 14, cursor: 'pointer',
                                    }}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button type="submit" style={{
                        width: '100%', padding: '0.95rem', borderRadius: 14,
                        border: 'none', fontWeight: 700, fontSize: 17,
                        background: theme.navActive, color: '#fff',
                        cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,122,255,0.3)',
                    }}>
                        Generate My Financial Plan →
                    </button>
                </form>
            ) : (
                <div style={{ animation: 'fadeIn 0.4s ease-out', maxWidth: 700, margin: '0 auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                        <button onClick={() => setPlan(null)} style={{
                            background: 'none', border: 'none',
                            color: theme.accent, cursor: 'pointer',
                            fontWeight: 600, fontSize: 14,
                        }}>
                            ← Edit Profile
                        </button>
                        <div style={{ fontSize: 13, opacity: 0.6 }}>
                            Age {plan.age} · ₹{fmt(plan.income)}/mo income · {plan.dependents} dependent{plan.dependents !== 1 ? 's' : ''} · {data.risk} risk
                        </div>
                    </div>

                    {/* ── INCOME SNAPSHOT ── */}
                    <Section title="💰 Income Snapshot">
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
                            <Card icon="📥" title="Monthly Income" value={`₹${fmt(plan.income)}`} accent={theme.accent} />
                            <Card icon="📤" title="Monthly Expenses" value={`₹${fmt(plan.expenses)}`} accent="#e17055" />
                            <Card icon="🔒" title="Insurance Cost" value={`₹${fmt(plan.monthlyInsuranceCost)}/mo`} sub="Term + Health premiums" accent="#a29bfe" />
                            <Card
                                icon="💸"
                                title="Investible Surplus"
                                value={`₹${fmt(plan.surplus)}/mo`}
                                sub="After expenses & premiums"
                                accent={theme.accent2}
                                extra={plan.surplus <= 0 ? '⚠️ Reduce expenses to free up surplus' : ''}
                            />
                        </div>
                    </Section>

                    {/* ── PROTECTION ── */}
                    <Section title="🛡️ Protection Plan">
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                            {plan.termCover > 0 ? (
                                <div style={{ background: theme.glass, padding: 18, borderRadius: 16, border: theme.border }}>
                                    <div style={{ fontSize: 12, opacity: 0.6, fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>🏥 Term Life Insurance</div>
                                    <div style={{ fontSize: 24, fontWeight: 800, color: theme.accent, marginBottom: 4 }}>{fmtLakh(plan.termCover)}</div>
                                    <div style={{ fontSize: 13, marginBottom: 8 }}>
                                        Cover = 20× Annual Income (₹{fmt(plan.income * 12)})
                                    </div>
                                    <div style={{ fontSize: 13, background: theme.card, borderRadius: 8, padding: '8px 12px' }}>
                                        <div>Approx. Annual Premium: <strong>₹{fmt(plan.termPremiumAnnual)}</strong></div>
                                        <div style={{ opacity: 0.7, fontSize: 12 }}>= ₹{fmt(plan.termPremiumMonthly)}/month</div>
                                        <div style={{ opacity: 0.6, fontSize: 11, marginTop: 4 }}>*Based on {data.age}-yr-old. Get actual quotes at insurer website.</div>
                                    </div>
                                    <div style={{ marginTop: 10, fontSize: 12, color: theme.accent2 }}>
                                        ✓ Choose pure term plan (not ULIP/endowment)
                                    </div>
                                </div>
                            ) : (
                                <div style={{ background: theme.glass, padding: 18, borderRadius: 16, border: theme.border }}>
                                    <div style={{ fontSize: 12, opacity: 0.6, fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>🏥 Term Life Insurance</div>
                                    <div style={{ fontSize: 16, fontWeight: 700, color: theme.text }}>Not required (no dependents)</div>
                                    <div style={{ fontSize: 12, opacity: 0.6, marginTop: 6 }}>Consider if dependents increase in future.</div>
                                </div>
                            )}

                            <div style={{ background: theme.glass, padding: 18, borderRadius: 16, border: theme.border }}>
                                <div style={{ fontSize: 12, opacity: 0.6, fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>🏨 Health Insurance</div>
                                <div style={{ fontSize: 24, fontWeight: 800, color: '#00b894', marginBottom: 4 }}>{fmtLakh(plan.healthCover)}</div>
                                <div style={{ fontSize: 13, marginBottom: 8 }}>
                                    Cover = ₹5L base + ₹2L × {plan.dependents} dependent{plan.dependents !== 1 ? 's' : ''}
                                </div>
                                <div style={{ fontSize: 13, background: theme.card, borderRadius: 8, padding: '8px 12px' }}>
                                    <div>Approx. Monthly Premium: <strong>₹{fmt(plan.healthPremiumMonthly)}</strong></div>
                                    <div style={{ opacity: 0.6, fontSize: 11, marginTop: 4 }}>*Family floater plan estimate</div>
                                </div>
                                <div style={{ marginTop: 10, fontSize: 12, color: theme.accent2 }}>
                                    ✓ Take a family floater policy
                                </div>
                            </div>
                        </div>
                    </Section>

                    {/* ── EMERGENCY FUND ── */}
                    <Section title="🏦 Emergency Fund">
                        <div style={{ background: theme.glass, padding: 20, borderRadius: 16, border: theme.border }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 12 }}>
                                <div>
                                    <div style={{ fontSize: 12, opacity: 0.6, fontWeight: 600 }}>TARGET AMOUNT</div>
                                    <div style={{ fontSize: 26, fontWeight: 800, color: theme.accent }}>{fmtLakh(plan.emergencyFund)}</div>
                                    <div style={{ fontSize: 12, opacity: 0.6 }}>6 months of expenses</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 12, opacity: 0.6, fontWeight: 600 }}>INITIAL SAFETY NET</div>
                                    <div style={{ fontSize: 26, fontWeight: 800, color: theme.accent2 }}>{fmtLakh(plan.fdEmergencyTarget)}</div>
                                    <div style={{ fontSize: 12, opacity: 0.6 }}>3 months in FD (Step 1)</div>
                                </div>
                            </div>
                            <div style={{ fontSize: 13, background: theme.card, borderRadius: 10, padding: '10px 14px', lineHeight: 1.7 }}>
                                <strong>Action Plan:</strong> Save ₹{fmt(plan.fdMonthlyToSave)}/month towards emergency fund.
                                {plan.fdBuildMonths && ` Fully funded in ~${plan.fdBuildMonths} months.`}
                                <br />
                                <span style={{ opacity: 0.7 }}>Keep in: Liquid Mutual Funds (best), Savings Account + FD ladder (safe)</span>
                            </div>
                        </div>
                    </Section>

                    {/* ── INVESTMENT ALLOCATION ── */}
                    <Section title="📊 Monthly Investment Allocation">
                        {plan.surplus > 0 ? (
                            <>
                                <div style={{ background: theme.glass, padding: 20, borderRadius: 16, border: theme.border, marginBottom: 12 }}>
                                    {/* Bar chart */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden' }}>
                                                <div style={{ width: `${plan.equityPct}%`, background: theme.accent, transition: 'width 0.5s' }} />
                                                <div style={{ width: `${plan.debtPct}%`, background: theme.accent2, transition: 'width 0.5s' }} />
                                            </div>
                                        </div>
                                        <span style={{ fontSize: 12, whiteSpace: 'nowrap', fontWeight: 600 }}>
                                            {plan.equityPct}% : {plan.debtPct}%
                                        </span>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                        <div style={{ background: theme.card, borderRadius: 12, padding: 14 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                                                <div style={{ width: 10, height: 10, borderRadius: '50%', background: theme.accent }} />
                                                <span style={{ fontSize: 12, fontWeight: 700, opacity: 0.7 }}>EQUITY — {plan.equityPct}%</span>
                                            </div>
                                            <div style={{ fontSize: 22, fontWeight: 800, color: theme.accent }}>₹{fmt(plan.equityAmt)}/mo</div>
                                            <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>Mutual Funds / Stocks</div>
                                            <div style={{ marginTop: 10 }}>
                                                {plan.equityFunds.map((f, i) => (
                                                    <div key={i} style={{ fontSize: 12, marginBottom: 4, opacity: 0.85 }}>→ {f}</div>
                                                ))}
                                            </div>
                                        </div>

                                        <div style={{ background: theme.card, borderRadius: 12, padding: 14 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                                                <div style={{ width: 10, height: 10, borderRadius: '50%', background: theme.accent2 }} />
                                                <span style={{ fontSize: 12, fontWeight: 700, opacity: 0.7 }}>DEBT — {plan.debtPct}%</span>
                                            </div>
                                            <div style={{ fontSize: 22, fontWeight: 800, color: theme.accent2 }}>₹{fmt(plan.debtAmt)}/mo</div>
                                            <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>FD / PPF / Debt Funds</div>
                                            <div style={{ marginTop: 10 }}>
                                                {plan.debtFunds.map((f, i) => (
                                                    <div key={i} style={{ fontSize: 12, marginBottom: 4, opacity: 0.85 }}>→ {f}</div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* PPF note */}
                                <div style={{ background: theme.glass, padding: 14, borderRadius: 12, border: theme.border, fontSize: 13 }}>
                                    <strong>PPF Strategy:</strong> Invest ₹{fmt(plan.ppfMonthly)}/mo (₹{fmt(plan.ppfMonthly * 12)}/yr) in PPF for tax-free returns at 7.1% p.a. (Section 80C benefit). Remaining debt ₹{fmt(plan.debtFundMonthly)}/mo → Short Duration Debt Funds.
                                </div>
                            </>
                        ) : (
                            <div style={{ background: '#ff4d4f22', padding: 16, borderRadius: 12, border: '1px solid #ff4d4f44', color: '#ff4d4f', fontWeight: 600 }}>
                                ⚠️ No investible surplus. Your expenses (₹{fmt(plan.expenses)}) exceed income after insurance (₹{fmt(plan.income)}). Focus on reducing monthly expenses first.
                            </div>
                        )}
                    </Section>

                    {/* ── ULIP ASSESSMENT ── */}
                    <Section title="🚫 ULIP Assessment">
                        <div style={{
                            background: '#ff4d4f14', padding: 18, borderRadius: 16,
                            border: '1.5px solid #ff4d4f33',
                        }}>
                            <div style={{ fontWeight: 700, fontSize: 15, color: '#ff4d4f', marginBottom: 8 }}>
                                ULIPs are NOT recommended for your profile
                            </div>
                            <div style={{ fontSize: 13, lineHeight: 1.8, opacity: 0.85 }}>
                                <strong>Reason:</strong> ULIPs combine insurance + investment, but do both inefficiently:
                            </div>
                            <ul style={{ fontSize: 13, lineHeight: 1.9, marginTop: 6, paddingLeft: 18 }}>
                                <li>High charges: 2–4% p.a. (premium allocation + fund management + mortality)</li>
                                <li>Lock-in: 5 years with heavy exit penalties</li>
                                <li>Insurance coverage is inadequate vs pure term plan</li>
                                <li>Mutual Funds with same investment deliver 3–5% higher net returns</li>
                            </ul>
                            <div style={{ marginTop: 10, fontSize: 13, fontWeight: 600, color: theme.accent2 }}>
                                ✓ Better alternative: Term Insurance (₹{plan.termCover > 0 ? fmtLakh(plan.termCover) : 'as needed'}) + SIP in Mutual Funds
                            </div>
                        </div>
                    </Section>

                    {/* ── 10-YEAR WEALTH PROJECTION ── */}
                    {plan.surplus > 0 && (
                        <Section title="📈 Wealth Projection (at current surplus)">
                            <div style={{ background: theme.glass, padding: 20, borderRadius: 16, border: theme.border }}>
                                {/* Projections table */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
                                    {[
                                        { yr: '5 Years', corpus: plan.corpus5y, inv: (plan.equityAmt + plan.debtAmt) * 60 },
                                        { yr: '10 Years', corpus: plan.totalCorpus10y, inv: plan.totalInvested10y },
                                        { yr: '15 Years', corpus: plan.corpus15y, inv: (plan.equityAmt + plan.debtAmt) * 180 },
                                    ].map(({ yr, corpus, inv }) => (
                                        <div key={yr} style={{ background: theme.card, borderRadius: 12, padding: 14, textAlign: 'center' }}>
                                            <div style={{ fontSize: 12, opacity: 0.6, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase' }}>{yr}</div>
                                            <div style={{ fontSize: 18, fontWeight: 800, color: theme.accent }}>{fmtLakh(corpus)}</div>
                                            <div style={{ fontSize: 11, opacity: 0.55, marginTop: 4 }}>Invested: {fmtLakh(inv)}</div>
                                            <div style={{ fontSize: 11, color: '#00b894', fontWeight: 600, marginTop: 2 }}>
                                                +{fmtLakh(corpus - inv)} gain
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Visual bar */}
                                <div style={{ marginBottom: 12 }}>
                                    {[
                                        { label: 'Invested (10yr)', val: plan.totalInvested10y, color: theme.accent2, max: plan.totalCorpus10y },
                                        { label: 'Projected Corpus (10yr)', val: plan.totalCorpus10y, color: theme.accent, max: plan.totalCorpus10y },
                                    ].map(({ label, val, color, max }) => (
                                        <div key={label} style={{ marginBottom: 8 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                                                <span style={{ opacity: 0.7 }}>{label}</span>
                                                <span style={{ fontWeight: 700 }}>{fmtLakh(val)}</span>
                                            </div>
                                            <div style={{ height: 8, borderRadius: 4, background: 'rgba(128,128,128,0.15)', overflow: 'hidden' }}>
                                                <div style={{
                                                    height: '100%', width: `${(val / max) * 100}%`,
                                                    background: color, borderRadius: 4,
                                                    transition: 'width 0.8s ease',
                                                }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div style={{ fontSize: 12, opacity: 0.6, textAlign: 'center' }}>
                                    Equity assumed at 12% p.a. · Debt assumed at 7% p.a. · Past performance not guaranteed.
                                </div>
                            </div>
                        </Section>
                    )}

                    {/* ── FIRE NUMBER ── */}
                    <Section title="🔥 FIRE Number (Financial Independence)">
                        <div style={{ background: theme.glass, padding: 18, borderRadius: 16, border: theme.border }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                    <div style={{ fontSize: 12, opacity: 0.6, fontWeight: 600 }}>CORPUS NEEDED TO RETIRE</div>
                                    <div style={{ fontSize: 26, fontWeight: 800, color: theme.accent }}>{fmtLakh(plan.fireCorpus)}</div>
                                    <div style={{ fontSize: 12, opacity: 0.6 }}>25× annual expenses (4% rule)</div>
                                </div>
                                {plan.fireYears && plan.surplus > 0 && (
                                    <div>
                                        <div style={{ fontSize: 12, opacity: 0.6, fontWeight: 600 }}>ESTIMATED TIME TO FIRE</div>
                                        <div style={{ fontSize: 26, fontWeight: 800, color: theme.accent2 }}>
                                            {isFinite(plan.fireYears) ? `~${Math.ceil(plan.fireYears)} yrs` : 'N/A'}
                                        </div>
                                        <div style={{ fontSize: 12, opacity: 0.6 }}>At current surplus invested in equity</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Section>

                    {/* ── FORMULAS ── */}
                    <Section title="📐 Formulas Used">
                        <div style={{
                            background: theme.card, padding: 16, borderRadius: 12,
                            fontFamily: 'monospace', fontSize: 13, lineHeight: 1.9,
                        }}>
                            <div>Emergency Fund = 6 × Monthly Expenses = 6 × ₹{fmt(plan.expenses)}</div>
                            {plan.termCover > 0 && <div>Term Cover = 20 × Annual Income = 20 × ₹{fmt(plan.income * 12)}</div>}
                            <div>Health Cover = ₹5,00,000 + (₹2,00,000 × {plan.dependents} dependents)</div>
                            <div>Equity% = (100 - {plan.age}){data.risk === 'High' ? ' + 10' : data.risk === 'Low' ? ' - 10' : ''} = {plan.equityPct}%</div>
                            <div>SIP FV = P × [(1+r)^n - 1] / r × (1+r)</div>
                            <div>FIRE Corpus = 25 × Annual Expenses (4% Rule)</div>
                        </div>
                    </Section>

                    <div style={{
                        textAlign: 'center', fontSize: 12, opacity: 0.5,
                        padding: '8px 0 4px',
                        borderTop: theme.border,
                    }}>
                        This plan is for educational purposes only. Consult a SEBI-registered financial advisor for personalised advice.
                    </div>
                </div>
            )}
    </div>
  );
} // Ensure valid closure if messed up, but replace is safe