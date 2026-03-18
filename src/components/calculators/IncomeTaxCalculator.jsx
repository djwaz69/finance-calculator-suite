import React, { useState } from 'react';

// ─── Tax Slab Definitions ────────────────────────────────────────────────────

const NEW_REGIME_SLABS = [
    { min: 0,         max: 400000,   rate: 0   },
    { min: 400000,    max: 800000,   rate: 5   },
    { min: 800000,    max: 1200000,  rate: 10  },
    { min: 1200000,   max: 1600000,  rate: 15  },
    { min: 1600000,   max: 2000000,  rate: 20  },
    { min: 2000000,   max: 2400000,  rate: 25  },
    { min: 2400000,   max: Infinity, rate: 30  },
];

const OLD_REGIME_SLABS_NORMAL = [
    { min: 0,         max: 250000,   rate: 0   },
    { min: 250000,    max: 500000,   rate: 5   },
    { min: 500000,    max: 1000000,  rate: 20  },
    { min: 1000000,   max: Infinity, rate: 30  },
];

const OLD_REGIME_SLABS_SENIOR = [
    { min: 0,         max: 300000,   rate: 0   },
    { min: 300000,    max: 500000,   rate: 5   },
    { min: 500000,    max: 1000000,  rate: 20  },
    { min: 1000000,   max: Infinity, rate: 30  },
];

// ─── Core Tax Computation ─────────────────────────────────────────────────────

function computeSlabTax(taxableIncome, slabs) {
    let tax = 0;
    const breakdown = [];
    for (const slab of slabs) {
        if (taxableIncome <= slab.min) break;
        const taxable = Math.min(taxableIncome, slab.max) - slab.min;
        const slabTax = (taxable * slab.rate) / 100;
        breakdown.push({
            range: slab.max === Infinity
                ? `Above ₹${fmt(slab.min)}`
                : `₹${fmt(slab.min + 1)} – ₹${fmt(slab.max)}`,
            rate: slab.rate,
            taxableAmount: taxable,
            tax: slabTax,
        });
        tax += slabTax;
    }
    return { tax, breakdown };
}

function computeSurcharge(income, tax, regime) {
    let rate = 0;
    if (regime === 'new') {
        if (income > 50000000)       rate = 25;
        else if (income > 20000000)  rate = 25;
        else if (income > 10000000)  rate = 15;
        else if (income > 5000000)   rate = 10;
    } else {
        if (income > 50000000)       rate = 37;
        else if (income > 20000000)  rate = 25;
        else if (income > 10000000)  rate = 15;
        else if (income > 5000000)   rate = 10;
    }
    return (tax * rate) / 100;
}

function computeTax({ grossIncome, bonus = 0, regime, employmentType, isSenior, deductions, ay }) {
    const totalGross = grossIncome + bonus;

    // Standard Deduction
    const stdDeduction = regime === 'new' ? 75000 : (employmentType === 'salaried' ? 50000 : 0);

    // Build total deductions
    let totalDeductions = stdDeduction;
    if (regime === 'old') {
        totalDeductions += Math.min(deductions.c80 || 0, 150000);
        totalDeductions += Math.min(deductions.nps80ccd1b || 0, 50000);
        totalDeductions += Math.min(deductions.npsEmployer || 0, totalGross); // no upper limit, practical cap
        const selfLimit = isSenior ? 50000 : 25000;
        totalDeductions += Math.min(deductions.health80d || 0, selfLimit);
        const parentLimit = deductions.parentSenior ? 50000 : 25000;
        totalDeductions += Math.min(deductions.healthParent80d || 0, parentLimit);
        totalDeductions += Math.min(deductions.homeLoan24b || 0, 200000);
        totalDeductions += (deductions.eduLoan80e || 0); // no limit
        totalDeductions += (deductions.hra || 0);
        totalDeductions += Math.min(deductions.professionalTax || 0, 2500);
        totalDeductions += (deductions.other || 0);
    } else {
        // New regime: only employer NPS
        totalDeductions += Math.min(deductions.npsEmployer || 0, totalGross);
    }

    const taxableIncome = Math.max(0, totalGross - totalDeductions);

    // Slab tax
    const slabs = regime === 'new'
        ? NEW_REGIME_SLABS
        : (isSenior ? OLD_REGIME_SLABS_SENIOR : OLD_REGIME_SLABS_NORMAL);

    const { tax: slabTax, breakdown } = computeSlabTax(taxableIncome, slabs);

    // Rebate 87A
    let rebate = 0;
    if (regime === 'new') {
        if (taxableIncome <= 1200000) {
            rebate = slabTax; // full rebate
        } else if (taxableIncome > 1200000) {
            // Marginal relief: tax can't exceed income - 12L
            const marginalRelief = Math.max(0, slabTax - (taxableIncome - 1200000));
            rebate = marginalRelief;
        }
    } else {
        if (taxableIncome <= 500000) {
            rebate = Math.min(slabTax, 12500);
        }
    }

    const taxAfterRebate = Math.max(0, slabTax - rebate);

    // Surcharge
    const surcharge = computeSurcharge(taxableIncome, taxAfterRebate, regime);

    // Cess
    const cess = ((taxAfterRebate + surcharge) * 4) / 100;

    const totalTax = taxAfterRebate + surcharge + cess;
    const effectiveRate = totalGross > 0 ? ((totalTax / totalGross) * 100).toFixed(2) : '0.00';

    return {
        totalGross,
        stdDeduction,
        totalDeductions,
        taxableIncome,
        slabTax,
        breakdown,
        rebate,
        taxAfterRebate,
        surcharge,
        cess,
        totalTax,
        effectiveRate,
        monthlyTDS: totalTax / 12,
    };
}

function fmt(n) {
    return Math.round(n).toLocaleString('en-IN');
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function IncomeTaxCalculator({ theme }) {
    const [ay, setAy] = useState('AY2026-27');
    const [regime, setRegime] = useState('new');
    const [employmentType, setEmploymentType] = useState('salaried');
    const [isSenior, setIsSenior] = useState(false);
    const [parentSenior, setParentSenior] = useState(false);

    const [grossIncome, setGrossIncome] = useState('');
    const [bonus, setBonus] = useState('');

    const [deductions, setDeductions] = useState({
        c80: '',
        nps80ccd1b: '',
        npsEmployer: '',
        health80d: '',
        healthParent80d: '',
        homeLoan24b: '',
        eduLoan80e: '',
        hra: '',
        professionalTax: '',
        other: '',
    });

    const [dedOpen, setDedOpen] = useState(true);
    const [result, setResult] = useState(null);
    const [comparison, setComparison] = useState(null);

    const inputStyle = {
        width: '100%', padding: '0.8rem 1rem',
        borderRadius: 12, border: theme.border,
        background: theme.card, color: theme.text,
        fontSize: 16, outline: 'none', boxSizing: 'border-box',
    };

    const labelStyle = {
        display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14,
    };

    function setDed(key, val) {
        setDeductions(prev => ({ ...prev, [key]: val }));
    }

    function parseDed(key) {
        return parseFloat(deductions[key]) || 0;
    }

    function calculate() {
        const gi = parseFloat(grossIncome) || 0;
        const bon = parseFloat(bonus) || 0;
        const ded = {
            c80:            parseDed('c80'),
            nps80ccd1b:     parseDed('nps80ccd1b'),
            npsEmployer:    parseDed('npsEmployer'),
            health80d:      parseDed('health80d'),
            healthParent80d: parseDed('healthParent80d'),
            parentSenior,
            homeLoan24b:    parseDed('homeLoan24b'),
            eduLoan80e:     parseDed('eduLoan80e'),
            hra:            parseDed('hra'),
            professionalTax: parseDed('professionalTax'),
            other:          parseDed('other'),
        };

        const r = computeTax({ grossIncome: gi, bonus: bon, regime, employmentType, isSenior, deductions: ded, ay });
        setResult(r);

        // Compute both regimes for comparison
        const newResult = computeTax({ grossIncome: gi, bonus: bon, regime: 'new', employmentType, isSenior, deductions: ded, ay });
        const oldResult = computeTax({ grossIncome: gi, bonus: bon, regime: 'old', employmentType, isSenior, deductions: ded, ay });
        setComparison({ new: newResult, old: oldResult });
    }

    async function exportToExcel() {
        if (!result || !comparison) return;
        const XLSX = await import('xlsx');
        const wb = XLSX.utils.book_new();

        // Income & Deductions sheet
        const incomeData = [
            ['INCOME TAX SUMMARY', ''],
            ['Assessment Year', ay],
            ['Tax Regime', regime === 'new' ? 'New Regime' : 'Old Regime'],
            ['Employment Type', employmentType === 'salaried' ? 'Salaried' : 'Self-Employed'],
            [''],
            ['INCOME DETAILS', ''],
            ['Gross Annual Income', result.totalGross - (parseFloat(bonus) || 0)],
            ['Annual Bonus', parseFloat(bonus) || 0],
            ['Total Gross Income', result.totalGross],
            ['Standard Deduction', result.stdDeduction],
            ['Total Deductions', result.totalDeductions],
            ['Taxable Income', result.taxableIncome],
            [''],
            ['TAX COMPUTATION', ''],
            ['Tax (Slab)', result.slabTax],
            ['87A Rebate', result.rebate],
            ['Tax After Rebate', result.taxAfterRebate],
            ['Surcharge', result.surcharge],
            ['Health & Education Cess (4%)', result.cess],
            ['Total Tax Payable', result.totalTax],
            ['Effective Tax Rate (%)', result.effectiveRate],
            ['Monthly TDS Estimate', result.monthlyTDS],
        ];
        const ws1 = XLSX.utils.aoa_to_sheet(incomeData);
        XLSX.utils.book_append_sheet(wb, ws1, 'Tax Summary');

        // Slab breakdown
        const slabData = [
            ['Slab Range', 'Rate (%)', 'Taxable Amount (₹)', 'Tax (₹)'],
            ...result.breakdown.map(b => [b.range, b.rate, Math.round(b.taxableAmount), Math.round(b.tax)]),
        ];
        const ws2 = XLSX.utils.aoa_to_sheet(slabData);
        XLSX.utils.book_append_sheet(wb, ws2, 'Slab Breakdown');

        // Comparison
        const compData = [
            ['', 'New Regime (₹)', 'Old Regime (₹)'],
            ['Total Gross', fmt(comparison.new.totalGross), fmt(comparison.old.totalGross)],
            ['Total Deductions', fmt(comparison.new.totalDeductions), fmt(comparison.old.totalDeductions)],
            ['Taxable Income', fmt(comparison.new.taxableIncome), fmt(comparison.old.taxableIncome)],
            ['Total Tax Payable', fmt(comparison.new.totalTax), fmt(comparison.old.totalTax)],
            ['Effective Rate (%)', comparison.new.effectiveRate, comparison.old.effectiveRate],
            ['Monthly TDS', fmt(comparison.new.monthlyTDS), fmt(comparison.old.monthlyTDS)],
        ];
        const ws3 = XLSX.utils.aoa_to_sheet(compData);
        XLSX.utils.book_append_sheet(wb, ws3, 'Regime Comparison');

        XLSX.writeFile(wb, `IncomeTax_${ay}.xlsx`);
    }

    const toggleStyle = (active) => ({
        flex: 1, padding: '0.55rem 0', borderRadius: 10,
        border: 'none', fontWeight: 700, fontSize: 14,
        background: active ? theme.navActive : 'transparent',
        color: active ? '#fff' : theme.text,
        cursor: 'pointer', transition: 'all 0.2s',
    });

    const sectionCard = {
        background: theme.glass, borderRadius: 16,
        border: theme.border, padding: 20, marginBottom: 18,
        textAlign: 'left',
    };

    // Bar chart data
    const maxBar = result ? Math.max(result.totalGross, result.taxableIncome, result.totalTax, 1) : 1;
    function barPct(val) { return Math.min(100, (val / maxBar) * 100); }

    return (
        <div style={{ color: theme.text }}>
            <h2 style={{ fontWeight: 800, fontSize: 28, marginBottom: 6, textAlign: 'center' }}>
                Income Tax Calculator
            </h2>
            <p style={{ fontSize: 14, opacity: 0.65, textAlign: 'center', marginBottom: 28 }}>
                India AY 2026-27 / AY 2027-28 — New & Old Regime with 87A Rebate, Surcharge & Cess
            </p>

            {/* ── FORM ── */}
            <div style={{ maxWidth: 600, margin: '0 auto' }}>

                {/* Assessment Year */}
                <div style={sectionCard}>
                    <label style={{ ...labelStyle, marginBottom: 10 }}>Assessment Year</label>
                    <div style={{ display: 'flex', gap: 10 }}>
                        {[
                            { val: 'AY2026-27', label: 'AY 2026-27 (FY 25-26)' },
                            { val: 'AY2027-28', label: 'AY 2027-28 (FY 26-27)' },
                        ].map(opt => (
                            <button key={opt.val} onClick={() => setAy(opt.val)}
                                style={toggleStyle(ay === opt.val)}>
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Regime & Employment */}
                <div style={sectionCard}>
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ ...labelStyle, marginBottom: 10 }}>Tax Regime</label>
                        <div style={{ display: 'flex', gap: 8, background: theme.card, borderRadius: 12, padding: 4 }}>
                            <button onClick={() => setRegime('new')} style={toggleStyle(regime === 'new')}>New Regime</button>
                            <button onClick={() => setRegime('old')} style={toggleStyle(regime === 'old')}>Old Regime</button>
                        </div>
                    </div>
                    <div>
                        <label style={{ ...labelStyle, marginBottom: 10 }}>Employment Type</label>
                        <div style={{ display: 'flex', gap: 8, background: theme.card, borderRadius: 12, padding: 4 }}>
                            <button onClick={() => setEmploymentType('salaried')} style={toggleStyle(employmentType === 'salaried')}>Salaried</button>
                            <button onClick={() => setEmploymentType('self')} style={toggleStyle(employmentType === 'self')}>Self-Employed / Business</button>
                        </div>
                    </div>
                </div>

                {/* Senior Citizen */}
                <div style={{ ...sectionCard, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <input type="checkbox" id="senior" checked={isSenior}
                        onChange={e => setIsSenior(e.target.checked)}
                        style={{ width: 18, height: 18, cursor: 'pointer', accentColor: theme.navActive }} />
                    <label htmlFor="senior" style={{ fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>
                        Taxpayer is Senior Citizen (≥ 60 years)
                        <span style={{ display: 'block', fontSize: 12, fontWeight: 400, opacity: 0.65 }}>
                            Old Regime: basic exemption increases to ₹3,00,000
                        </span>
                    </label>
                </div>

                {/* Income Inputs */}
                <div style={sectionCard}>
                    <label style={{ ...labelStyle, fontSize: 16, marginBottom: 14 }}>Income Details</label>
                    <div style={{ marginBottom: 16 }}>
                        <label style={labelStyle}>Gross Annual Income (₹)</label>
                        <input type="number" min="0" value={grossIncome}
                            onChange={e => setGrossIncome(e.target.value)}
                            placeholder="e.g. 1200000"
                            style={inputStyle} />
                    </div>
                    {employmentType === 'salaried' && (
                        <div>
                            <label style={labelStyle}>Annual Bonus (₹) — optional</label>
                            <input type="number" min="0" value={bonus}
                                onChange={e => setBonus(e.target.value)}
                                placeholder="e.g. 50000"
                                style={inputStyle} />
                        </div>
                    )}
                </div>

                {/* Deductions */}
                <div style={{ ...sectionCard, padding: 0, overflow: 'hidden' }}>
                    <button onClick={() => setDedOpen(o => !o)}
                        style={{
                            width: '100%', display: 'flex', justifyContent: 'space-between',
                            alignItems: 'center', padding: '16px 20px',
                            background: 'transparent', border: 'none',
                            color: theme.text, fontWeight: 700, fontSize: 16,
                            cursor: 'pointer',
                        }}>
                        <span>
                            {regime === 'new' ? 'Employer NPS (80CCD(2))' : 'Deductions & Exemptions'}
                        </span>
                        <span style={{ fontSize: 20 }}>{dedOpen ? '▲' : '▼'}</span>
                    </button>

                    {dedOpen && (
                        <div style={{ padding: '0 20px 20px 20px' }}>
                            {regime === 'old' && (
                                <>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                                        <div>
                                            <label style={labelStyle}>80C — EPF/PPF/ELSS/LIC (max ₹1.5L)</label>
                                            <input type="number" min="0" max="150000" value={deductions.c80}
                                                onChange={e => setDed('c80', e.target.value)}
                                                placeholder="Max 1,50,000" style={inputStyle} />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>80CCD(1B) — Additional NPS (max ₹50K)</label>
                                            <input type="number" min="0" max="50000" value={deductions.nps80ccd1b}
                                                onChange={e => setDed('nps80ccd1b', e.target.value)}
                                                placeholder="Max 50,000" style={inputStyle} />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>80D — Health Insurance Self+Family</label>
                                            <input type="number" min="0" value={deductions.health80d}
                                                onChange={e => setDed('health80d', e.target.value)}
                                                placeholder={isSenior ? 'Max 50,000' : 'Max 25,000'} style={inputStyle} />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>80D — Health Insurance Parents</label>
                                            <input type="number" min="0" value={deductions.healthParent80d}
                                                onChange={e => setDed('healthParent80d', e.target.value)}
                                                placeholder={parentSenior ? 'Max 50,000' : 'Max 25,000'} style={inputStyle} />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Sec 24b — Home Loan Interest (max ₹2L)</label>
                                            <input type="number" min="0" max="200000" value={deductions.homeLoan24b}
                                                onChange={e => setDed('homeLoan24b', e.target.value)}
                                                placeholder="Max 2,00,000" style={inputStyle} />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>80E — Education Loan Interest (no limit)</label>
                                            <input type="number" min="0" value={deductions.eduLoan80e}
                                                onChange={e => setDed('eduLoan80e', e.target.value)}
                                                placeholder="No upper limit" style={inputStyle} />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>HRA Exemption (calculated separately)</label>
                                            <input type="number" min="0" value={deductions.hra}
                                                onChange={e => setDed('hra', e.target.value)}
                                                placeholder="Enter exempt HRA amount" style={inputStyle} />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Professional Tax (max ₹2,500)</label>
                                            <input type="number" min="0" max="2500" value={deductions.professionalTax}
                                                onChange={e => setDed('professionalTax', e.target.value)}
                                                placeholder="Max 2,500" style={inputStyle} />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Other Deductions (80TTA, 80G etc.)</label>
                                            <input type="number" min="0" value={deductions.other}
                                                onChange={e => setDed('other', e.target.value)}
                                                placeholder="Any other deductions" style={inputStyle} />
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                                        <input type="checkbox" id="parentSenior" checked={parentSenior}
                                            onChange={e => setParentSenior(e.target.checked)}
                                            style={{ width: 16, height: 16, accentColor: theme.navActive, cursor: 'pointer' }} />
                                        <label htmlFor="parentSenior" style={{ fontSize: 13, cursor: 'pointer' }}>
                                            Parents are Senior Citizens (80D parent limit: ₹50,000)
                                        </label>
                                    </div>
                                    <div style={{ borderTop: theme.border, marginTop: 14, paddingTop: 14 }}>
                                        <label style={labelStyle}>80CCD(2) — Employer NPS Contribution</label>
                                        <input type="number" min="0" value={deductions.npsEmployer}
                                            onChange={e => setDed('npsEmployer', e.target.value)}
                                            placeholder="Employer contribution to NPS (no limit)" style={inputStyle} />
                                    </div>
                                </>
                            )}
                            {regime === 'new' && (
                                <div>
                                    <label style={labelStyle}>80CCD(2) — Employer NPS Contribution (no limit)</label>
                                    <input type="number" min="0" value={deductions.npsEmployer}
                                        onChange={e => setDed('npsEmployer', e.target.value)}
                                        placeholder="Employer contribution to NPS" style={inputStyle} />
                                    <p style={{ fontSize: 13, opacity: 0.6, marginTop: 8 }}>
                                        Note: Under New Regime, only employer NPS contribution (80CCD(2)) is deductible.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Calculate Button */}
                <button onClick={calculate} style={{
                    width: '100%', padding: '0.9rem',
                    borderRadius: 12, border: 'none',
                    fontWeight: 700, fontSize: 18,
                    background: theme.navActive, color: '#fff',
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(0,122,255,0.3)',
                    marginBottom: 32,
                }}>
                    Calculate Tax
                </button>
            </div>

            {/* ── RESULTS ── */}
            {result && comparison && (
                <div style={{ maxWidth: 700, margin: '0 auto', animation: 'fadeIn 0.4s ease-out' }}>

                    {/* Tax Breakdown */}
                    <div style={{ background: theme.glass, borderRadius: 16, border: theme.border, padding: 24, marginBottom: 20 }}>
                        <h3 style={{ fontWeight: 800, fontSize: 20, marginBottom: 18 }}>
                            Tax Breakdown — {regime === 'new' ? 'New Regime' : 'Old Regime'} ({ay})
                        </h3>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                            {[
                                { label: 'Gross Income', val: result.totalGross, color: theme.text },
                                { label: 'Standard Deduction', val: result.stdDeduction, color: theme.accent2 },
                                { label: 'Total Deductions', val: result.totalDeductions, color: theme.accent2 },
                                { label: 'Taxable Income', val: result.taxableIncome, color: theme.accent },
                            ].map(item => (
                                <div key={item.label} style={{ background: theme.card, padding: 14, borderRadius: 12, border: theme.border }}>
                                    <div style={{ fontSize: 12, opacity: 0.6, fontWeight: 600, textTransform: 'uppercase' }}>{item.label}</div>
                                    <div style={{ fontSize: 20, fontWeight: 700, color: item.color, marginTop: 4 }}>₹{fmt(item.val)}</div>
                                </div>
                            ))}
                        </div>

                        {/* Slab Breakdown Table */}
                        <h4 style={{ fontWeight: 700, marginBottom: 10, fontSize: 15 }}>Slab-wise Tax Calculation</h4>
                        <div style={{ borderRadius: 10, border: theme.border, overflow: 'hidden', marginBottom: 18 }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
                                <thead>
                                    <tr style={{ background: theme.card, borderBottom: `2px solid ${theme.navActive}` }}>
                                        <th style={{ padding: '8px 12px', textAlign: 'left' }}>Slab Range</th>
                                        <th style={{ padding: '8px 12px', textAlign: 'center' }}>Rate</th>
                                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>Taxable Amt</th>
                                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>Tax</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {result.breakdown.map((row, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid rgba(128,128,128,0.1)' }}>
                                            <td style={{ padding: '7px 12px' }}>{row.range}</td>
                                            <td style={{ padding: '7px 12px', textAlign: 'center', color: theme.accent }}>{row.rate}%</td>
                                            <td style={{ padding: '7px 12px', textAlign: 'right' }}>₹{fmt(row.taxableAmount)}</td>
                                            <td style={{ padding: '7px 12px', textAlign: 'right', fontWeight: 600 }}>₹{fmt(row.tax)}</td>
                                        </tr>
                                    ))}
                                    <tr style={{ background: theme.card, fontWeight: 700 }}>
                                        <td colSpan={3} style={{ padding: '8px 12px' }}>Total Slab Tax</td>
                                        <td style={{ padding: '8px 12px', textAlign: 'right', color: theme.accent }}>₹{fmt(result.slabTax)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Final Tax Summary */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {[
                                { label: 'Tax Before Rebate', val: result.slabTax, color: theme.text },
                                { label: 'Less: 87A Rebate', val: -result.rebate, color: '#22c55e' },
                                { label: 'Tax After Rebate', val: result.taxAfterRebate, color: theme.text },
                                { label: 'Surcharge', val: result.surcharge, color: theme.accent2 },
                                { label: 'Health & Education Cess (4%)', val: result.cess, color: theme.accent2 },
                            ].map(row => (
                                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 14px', borderRadius: 8, background: theme.card }}>
                                    <span style={{ fontSize: 14 }}>{row.label}</span>
                                    <span style={{ fontWeight: 600, color: row.color }}>
                                        {row.val < 0 ? '–' : ''}₹{fmt(Math.abs(row.val))}
                                    </span>
                                </div>
                            ))}

                            {/* Total Tax — highlighted */}
                            <div style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '14px 18px', borderRadius: 12,
                                background: `linear-gradient(135deg, ${theme.navActive}22, ${theme.accent}22)`,
                                border: `2px solid ${theme.navActive}`,
                                marginTop: 4,
                            }}>
                                <span style={{ fontWeight: 800, fontSize: 18 }}>Total Tax Payable</span>
                                <span style={{ fontWeight: 900, fontSize: 24, color: theme.navActive }}>₹{fmt(result.totalTax)}</span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 4 }}>
                                <div style={{ background: theme.card, padding: 12, borderRadius: 10, border: theme.border, textAlign: 'center' }}>
                                    <div style={{ fontSize: 12, opacity: 0.6 }}>Effective Tax Rate</div>
                                    <div style={{ fontSize: 20, fontWeight: 700, color: theme.accent }}>{result.effectiveRate}%</div>
                                </div>
                                <div style={{ background: theme.card, padding: 12, borderRadius: 10, border: theme.border, textAlign: 'center' }}>
                                    <div style={{ fontSize: 12, opacity: 0.6 }}>Monthly TDS Estimate</div>
                                    <div style={{ fontSize: 20, fontWeight: 700, color: theme.accent }}>₹{fmt(result.monthlyTDS)}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Visual Bar Chart */}
                    <div style={{ background: theme.glass, borderRadius: 16, border: theme.border, padding: 24, marginBottom: 20 }}>
                        <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 20 }}>Visual Overview</h3>
                        {[
                            { label: 'Gross Income', val: result.totalGross, color: theme.accent },
                            { label: 'Taxable Income', val: result.taxableIncome, color: '#f59e0b' },
                            { label: 'Tax Payable', val: result.totalTax, color: theme.accent2 },
                        ].map(bar => (
                            <div key={bar.label} style={{ marginBottom: 16 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13, fontWeight: 600 }}>
                                    <span>{bar.label}</span>
                                    <span>₹{fmt(bar.val)}</span>
                                </div>
                                <div style={{ background: theme.card, borderRadius: 8, height: 14, overflow: 'hidden', border: theme.border }}>
                                    <div style={{
                                        height: '100%', width: `${barPct(bar.val)}%`,
                                        background: bar.color, borderRadius: 8,
                                        transition: 'width 0.8s ease',
                                    }} />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Regime Comparison */}
                    <div style={{ background: theme.glass, borderRadius: 16, border: theme.border, padding: 24, marginBottom: 20 }}>
                        <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 16 }}>Regime Comparison</h3>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                                <thead>
                                    <tr style={{ borderBottom: `2px solid ${theme.navActive}` }}>
                                        <th style={{ padding: '10px 12px', textAlign: 'left' }}>Metric</th>
                                        <th style={{ padding: '10px 12px', textAlign: 'right', color: theme.accent }}>New Regime</th>
                                        <th style={{ padding: '10px 12px', textAlign: 'right', color: '#f59e0b' }}>Old Regime</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[
                                        { label: 'Total Deductions', new: comparison.new.totalDeductions, old: comparison.old.totalDeductions },
                                        { label: 'Taxable Income', new: comparison.new.taxableIncome, old: comparison.old.taxableIncome },
                                        { label: 'Slab Tax', new: comparison.new.slabTax, old: comparison.old.slabTax },
                                        { label: '87A Rebate', new: comparison.new.rebate, old: comparison.old.rebate },
                                        { label: 'Surcharge', new: comparison.new.surcharge, old: comparison.old.surcharge },
                                        { label: 'Cess (4%)', new: comparison.new.cess, old: comparison.old.cess },
                                        { label: 'Total Tax Payable', new: comparison.new.totalTax, old: comparison.old.totalTax, bold: true },
                                        { label: 'Effective Rate (%)', new: `${comparison.new.effectiveRate}%`, old: `${comparison.old.effectiveRate}%`, raw: true },
                                        { label: 'Monthly TDS', new: comparison.new.monthlyTDS, old: comparison.old.monthlyTDS },
                                    ].map((row, i) => {
                                        const better = typeof row.new === 'number' && typeof row.old === 'number'
                                            ? (row.new <= row.old ? 'new' : 'old') : null;
                                        return (
                                            <tr key={i} style={{ borderBottom: '1px solid rgba(128,128,128,0.1)', background: i % 2 === 0 ? 'transparent' : 'rgba(128,128,128,0.04)' }}>
                                                <td style={{ padding: '9px 12px', fontWeight: row.bold ? 700 : 400 }}>{row.label}</td>
                                                <td style={{ padding: '9px 12px', textAlign: 'right', fontWeight: row.bold ? 800 : 400, color: better === 'new' && row.bold ? '#22c55e' : theme.accent }}>
                                                    {row.raw ? row.new : `₹${fmt(row.new)}`}
                                                    {better === 'new' && row.bold && <span style={{ fontSize: 11, marginLeft: 6, background: '#22c55e22', color: '#22c55e', padding: '2px 6px', borderRadius: 6 }}>Better</span>}
                                                </td>
                                                <td style={{ padding: '9px 12px', textAlign: 'right', fontWeight: row.bold ? 800 : 400, color: better === 'old' && row.bold ? '#22c55e' : '#f59e0b' }}>
                                                    {row.raw ? row.old : `₹${fmt(row.old)}`}
                                                    {better === 'old' && row.bold && <span style={{ fontSize: 11, marginLeft: 6, background: '#22c55e22', color: '#22c55e', padding: '2px 6px', borderRadius: 6 }}>Better</span>}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <div style={{ marginTop: 14, padding: 12, borderRadius: 10, background: theme.card, fontSize: 13, opacity: 0.75 }}>
                            Recommendation: {comparison.new.totalTax <= comparison.old.totalTax
                                ? 'New Regime is more beneficial for this income profile.'
                                : 'Old Regime saves more tax for this income profile due to higher deductions.'}
                        </div>
                    </div>

                    {/* Tax Saving Suggestions */}
                    <div style={{ background: theme.glass, borderRadius: 16, border: theme.border, padding: 24, marginBottom: 20 }}>
                        <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 14 }}>
                            Ways to Reduce Your Tax Burden
                        </h3>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
                                <thead>
                                    <tr style={{ borderBottom: `2px solid ${theme.navActive}` }}>
                                        <th style={{ padding: '8px 10px', textAlign: 'left' }}>Section</th>
                                        <th style={{ padding: '8px 10px', textAlign: 'left' }}>Instrument</th>
                                        <th style={{ padding: '8px 10px', textAlign: 'right' }}>Max Benefit</th>
                                        <th style={{ padding: '8px 10px', textAlign: 'center' }}>New Regime</th>
                                        <th style={{ padding: '8px 10px', textAlign: 'center' }}>Old Regime</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[
                                        { sec: '80C', inst: 'ELSS / PPF / EPF / LIC', max: '₹1,50,000', newR: false, oldR: true },
                                        { sec: '80CCD(1B)', inst: 'Additional NPS contribution', max: '₹50,000', newR: false, oldR: true },
                                        { sec: '80CCD(2)', inst: 'Employer NPS contribution', max: 'No limit', newR: true, oldR: true },
                                        { sec: '80D', inst: 'Health Insurance (Self+Family)', max: '₹25,000 / ₹50,000*', newR: false, oldR: true },
                                        { sec: '80D', inst: 'Health Insurance (Parents)', max: '₹25,000 / ₹50,000*', newR: false, oldR: true },
                                        { sec: 'Sec 24b', inst: 'Home Loan Interest Deduction', max: '₹2,00,000', newR: false, oldR: true },
                                        { sec: '80E', inst: 'Education Loan Interest', max: 'No limit', newR: false, oldR: true },
                                        { sec: 'Std Ded', inst: 'Standard Deduction (Salaried)', max: '₹75,000 / ₹50,000', newR: true, oldR: true },
                                    ].map((row, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid rgba(128,128,128,0.1)', background: i % 2 === 0 ? 'transparent' : 'rgba(128,128,128,0.04)' }}>
                                            <td style={{ padding: '8px 10px', fontWeight: 600, color: theme.accent }}>{row.sec}</td>
                                            <td style={{ padding: '8px 10px' }}>{row.inst}</td>
                                            <td style={{ padding: '8px 10px', textAlign: 'right', color: '#22c55e', fontWeight: 600 }}>{row.max}</td>
                                            <td style={{ padding: '8px 10px', textAlign: 'center' }}>{row.newR ? '✓' : '–'}</td>
                                            <td style={{ padding: '8px 10px', textAlign: 'center' }}>{row.oldR ? '✓' : '–'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <p style={{ fontSize: 12, opacity: 0.6, marginTop: 10 }}>* ₹50,000 limit applies if self or parents are senior citizens (≥60 years)</p>
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
