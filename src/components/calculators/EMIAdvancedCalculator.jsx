import React, { useState, useRef, useCallback } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { exportElementToPDF, exportDataToExcel } from '../../utils/exportUtils';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n) {
    return Math.round(n).toLocaleString('en-IN');
}

function fmtDec(n, d = 2) {
    return Number(n).toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });
}

function addMonths(baseYYYYMM, delta) {
    // baseYYYYMM: "2024-01"
    const [y, m] = baseYYYYMM.split('-').map(Number);
    const date = new Date(y, m - 1 + delta, 1);
    return date.toLocaleString('default', { month: 'short', year: 'numeric' });
}

function calcEMI(principal, annualRate, months) {
    if (annualRate === 0) return principal / months;
    const r = annualRate / 12 / 100;
    const pow = Math.pow(1 + r, months);
    return (principal * r * pow) / (pow - 1);
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function EMIAdvancedCalculator({ theme }) {
    // ── Inputs ────────────────────────────────────────────────────────────────
    const [loanAmount, setLoanAmount] = useState('');
    const [annualRate, setAnnualRate] = useState('8.70');
    const [tenureMonths, setTenureMonths] = useState('');
    const [startDate, setStartDate] = useState('');

    // ── Settings ──────────────────────────────────────────────────────────────
    const [prepayEffect, setPrepayEffect] = useState('reduceTenure');   // 'reduceTenure' | 'reduceEMI'
    const [roiEffect, setRoiEffect] = useState('reduceTenure');          // 'reduceTenure' | 'reduceEMI'

    // ── Optional Sections ─────────────────────────────────────────────────────
    const [showPrepayments, setShowPrepayments] = useState(false);
    const [showRateChanges, setShowRateChanges] = useState(false);
    const [showMoratorium, setShowMoratorium] = useState(false);

    const [prepayments, setPrepayments] = useState([]);          // [{id, month, amount}]
    const [rateChanges, setRateChanges] = useState([]);          // [{id, month, rate}]
    const [moratoriumMonths, setMoratoriumMonths] = useState('0');

    // ── Results ───────────────────────────────────────────────────────────────
    const [results, setResults] = useState(null);
    const [exporting, setExporting] = useState(false);

    const exportRef = useRef(null);
    const nextId = useRef(1);

    // ── Input Styles ──────────────────────────────────────────────────────────
    const inputStyle = {
        width: '100%',
        padding: '0.8rem 1rem',
        borderRadius: 12,
        border: theme.border,
        background: theme.card,
        color: theme.text,
        fontSize: 16,
        outline: 'none',
        boxSizing: 'border-box',
    };

    const smallInputStyle = {
        ...inputStyle,
        width: 'auto',
        padding: '0.55rem 0.7rem',
        fontSize: 14,
        minWidth: 80,
    };

    // ── Prepayment rows ───────────────────────────────────────────────────────
    function addPrepayment() {
        setPrepayments(prev => [...prev, { id: nextId.current++, month: '', amount: '' }]);
    }
    function updatePrepayment(id, field, val) {
        setPrepayments(prev => prev.map(p => p.id === id ? { ...p, [field]: val } : p));
    }
    function removePrepayment(id) {
        setPrepayments(prev => prev.filter(p => p.id !== id));
    }

    // ── Rate Change rows ──────────────────────────────────────────────────────
    function addRateChange() {
        setRateChanges(prev => [...prev, { id: nextId.current++, month: '', rate: '' }]);
    }
    function updateRateChange(id, field, val) {
        setRateChanges(prev => prev.map(r => r.id === id ? { ...r, [field]: val } : r));
    }
    function removeRateChange(id) {
        setRateChanges(prev => prev.filter(r => r.id !== id));
    }

    // ── Core Calculation ──────────────────────────────────────────────────────
    const calculate = useCallback(() => {
        const P = parseFloat(loanAmount);
        const R = parseFloat(annualRate);
        const N = parseInt(tenureMonths, 10);
        const moro = parseInt(moratoriumMonths, 10) || 0;

        if (!P || isNaN(P) || P <= 0) return;
        if (isNaN(R) || R < 0) return;
        if (!N || isNaN(N) || N <= 0) return;

        // Parse & sort prepayments
        const parsedPrepay = prepayments
            .map(p => ({ month: parseInt(p.month, 10), amount: parseFloat(p.amount) }))
            .filter(p => !isNaN(p.month) && p.month > 0 && !isNaN(p.amount) && p.amount > 0)
            .sort((a, b) => a.month - b.month);

        // Parse & sort rate changes
        const parsedRateChanges = rateChanges
            .map(rc => ({ month: parseInt(rc.month, 10), rate: parseFloat(rc.rate) }))
            .filter(rc => !isNaN(rc.month) && rc.month > 0 && !isNaN(rc.rate) && rc.rate >= 0)
            .sort((a, b) => a.month - b.month);

        // Compute base EMI
        const baseEMI = calcEMI(P, R, N);

        let balance = P;
        let currentRate = R;
        let currentEMI = baseEMI;
        let remainingTenure = N;
        let actualMonth = 0;
        const schedule = [];
        const maxIter = N + moro + 600; // safety cap

        for (let i = 1; i <= maxIter; i++) {
            const r = currentRate / 12 / 100;
            const labelDate = startDate ? addMonths(startDate, i - 1) : `Month ${i}`;

            // ── Moratorium phase ─────────────────────────────────────────────
            if (i <= moro) {
                const interest = balance * r;
                balance += interest;
                schedule.push({
                    month: i,
                    actualMonth: 0,
                    label: labelDate,
                    type: 'Moratorium',
                    emi: 0,
                    principal: 0,
                    interest,
                    prepayment: 0,
                    balance,
                    hasRateChange: false,
                    hasPrepayment: false,
                });
                // After moratorium ends, recalculate EMI on capitalised balance
                if (i === moro) {
                    currentEMI = calcEMI(balance, currentRate, N);
                    remainingTenure = N;
                }
                continue;
            }

            // ── Regular phase ─────────────────────────────────────────────────
            actualMonth++;

            // Apply rate change (keyed on actualMonth)
            let hasRateChange = false;
            const rcEntry = parsedRateChanges.find(rc => rc.month === actualMonth);
            if (rcEntry) {
                currentRate = rcEntry.rate;
                hasRateChange = true;
                const rNew = currentRate / 12 / 100;
                if (roiEffect === 'reduceEMI' && remainingTenure > 0) {
                    if (currentRate === 0) {
                        currentEMI = balance / remainingTenure;
                    } else {
                        currentEMI = calcEMI(balance, currentRate, remainingTenure);
                    }
                }
                // if reduceTenure: keep currentEMI, tenure shortens naturally
            }

            const rCur = currentRate / 12 / 100;
            const interest = balance * rCur;

            // Principal from EMI
            let principal;
            if (balance <= currentEMI) {
                principal = balance;
            } else {
                principal = Math.max(0, currentEMI - interest);
            }
            balance -= principal;

            // Prepayment (keyed on actualMonth)
            let prepayAmt = 0;
            const ppEntry = parsedPrepay.find(p => p.month === actualMonth);
            if (ppEntry && balance > 0) {
                prepayAmt = Math.min(ppEntry.amount, balance);
                balance -= prepayAmt;
                if (prepayEffect === 'reduceEMI' && balance > 0 && remainingTenure > 1) {
                    if (currentRate === 0) {
                        currentEMI = balance / (remainingTenure - 1);
                    } else {
                        currentEMI = calcEMI(balance, currentRate, remainingTenure - 1);
                    }
                }
            }

            balance = Math.max(0, balance);

            schedule.push({
                month: i,
                actualMonth,
                label: labelDate,
                type: 'Regular',
                emi: principal + interest,
                principal,
                interest,
                prepayment: prepayAmt,
                balance,
                hasRateChange,
                hasPrepayment: prepayAmt > 0,
            });

            if (balance <= 0.005) break;

            remainingTenure = Math.max(1, remainingTenure - 1);
        }

        // ── Summary ───────────────────────────────────────────────────────────
        const regularRows = schedule.filter(r => r.type !== 'Moratorium');
        const totalEMIPaid = regularRows.reduce((s, r) => s + r.emi, 0);
        const totalPrepaid = regularRows.reduce((s, r) => s + r.prepayment, 0);
        const totalInterest = schedule.reduce((s, r) => s + r.interest, 0);
        const totalPaid = totalEMIPaid + totalPrepaid;
        const actualTenure = regularRows.length;

        // ── Original comparison (no prepayments, initial rate) ────────────────
        let origBalance = P;
        if (moro > 0) {
            const rBase = R / 12 / 100;
            for (let m = 0; m < moro; m++) origBalance += origBalance * rBase;
        }
        const origEMI = calcEMI(origBalance, R, N);
        let origTotalInterest = 0;
        let origTenure = 0;
        let tempBal = origBalance;
        for (let m = 0; m < N + 600; m++) {
            if (tempBal <= 0.005) break;
            const rr = R / 12 / 100;
            const intPart = tempBal * rr;
            const prinPart = Math.min(origEMI - intPart, tempBal);
            origTotalInterest += intPart;
            tempBal -= Math.max(0, prinPart);
            origTenure++;
        }

        const interestSaved = Math.max(0, origTotalInterest - totalInterest);
        const monthsSaved = Math.max(0, origTenure - actualTenure);

        const years = Math.floor(actualTenure / 12);
        const months = actualTenure % 12;
        const tenureLabel = years > 0
            ? `${actualTenure} months (${years}y ${months}m)`
            : `${actualTenure} months`;

        setResults({
            baseEMI,
            schedule,
            totalEMIPaid,
            totalPrepaid,
            totalInterest,
            totalPaid,
            actualTenure,
            tenureLabel,
            interestSaved,
            monthsSaved,
            originalTotalInterest: origTotalInterest,
        });
    }, [loanAmount, annualRate, tenureMonths, startDate, prepayEffect, roiEffect, prepayments, rateChanges, moratoriumMonths]);

    // ── Export Excel ──────────────────────────────────────────────────────────
    async function handleExportExcel() {
        if (!results) return;
        const XLSX = await import('xlsx');

        // Summary sheet
        const summaryData = [
            { Field: 'Loan Amount (₹)', Value: parseFloat(loanAmount) },
            { Field: 'Annual Interest Rate (% p.a.)', Value: parseFloat(annualRate) },
            { Field: 'Original Tenure (Months)', Value: parseInt(tenureMonths, 10) },
            { Field: 'Moratorium (Months)', Value: parseInt(moratoriumMonths, 10) || 0 },
            { Field: 'Base EMI (₹)', Value: Math.round(results.baseEMI) },
            { Field: 'Actual Tenure (Months)', Value: results.actualTenure },
            { Field: 'Total Interest Paid (₹)', Value: Math.round(results.totalInterest) },
            { Field: 'Total Prepayments (₹)', Value: Math.round(results.totalPrepaid) },
            { Field: 'Total Amount Paid (₹)', Value: Math.round(results.totalPaid) },
            { Field: 'Interest Saved (₹)', Value: Math.round(results.interestSaved) },
            { Field: 'Months Saved', Value: results.monthsSaved },
        ];

        // Schedule sheet (aoa)
        const scheduleHeader = ['Month No.', 'Date', 'Type', 'EMI (₹)', 'Principal (₹)', 'Interest (₹)', 'Prepayment (₹)', 'Balance (₹)'];
        const scheduleRows = results.schedule.map(r => [
            r.month,
            r.label,
            r.type,
            Math.round(r.emi),
            Math.round(r.principal),
            Math.round(r.interest),
            Math.round(r.prepayment),
            Math.round(r.balance),
        ]);

        const wb = XLSX.utils.book_new();

        const wsSummary = XLSX.utils.json_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

        const wsSchedule = XLSX.utils.aoa_to_sheet([scheduleHeader, ...scheduleRows]);
        XLSX.utils.book_append_sheet(wb, wsSchedule, 'Amortization_Schedule');

        XLSX.writeFile(wb, 'EMI_Advanced_Amortization.xlsx');
    }

    // ── Export PDF ────────────────────────────────────────────────────────────
    async function handleExportPDF() {
        if (!results || !exportRef.current) return;
        setExporting(true);
        try {
            await exportElementToPDF(
                exportRef.current,
                'EMI_Advanced_Amortization.pdf',
                (pdf, pdfWidth) => {
                    pdf.setFontSize(22);
                    pdf.setFont('helvetica', 'bold');
                    pdf.text('Advanced EMI Amortization', pdfWidth / 2, 48, { align: 'center' });
                    pdf.setFontSize(12);
                    pdf.setFont('helvetica', 'normal');
                    const lines = [
                        [`Loan Amount`, `₹${fmt(parseFloat(loanAmount))}`],
                        [`Interest Rate`, `${annualRate}% p.a.`],
                        [`Tenure`, `${tenureMonths} months`],
                        [`Base EMI`, `₹${fmt(results.baseEMI)}`],
                        [`Actual Tenure`, results.tenureLabel],
                        [`Total Interest`, `₹${fmt(results.totalInterest)}`],
                        [`Interest Saved`, `₹${fmt(results.interestSaved)}`],
                        [`Total Paid`, `₹${fmt(results.totalPaid)}`],
                    ];
                    let y = 80;
                    lines.forEach(([label, value]) => {
                        pdf.setFont('helvetica', 'bold');
                        pdf.text(`${label}:`, pdfWidth / 2 - 100, y);
                        pdf.setFont('helvetica', 'normal');
                        pdf.text(value, pdfWidth / 2 + 20, y);
                        y += 22;
                    });
                }
            );
        } finally {
            setExporting(false);
        }
    }

    // ── Chart Data ────────────────────────────────────────────────────────────
    function buildChartData() {
        if (!results) return null;

        const step = Math.max(1, Math.floor(results.schedule.length / 60));
        const labels = [];
        const balanceData = [];
        const cumInterestData = [];
        const pointColors = [];
        const pointRadii = [];

        let cumInt = 0;
        results.schedule.forEach((row, idx) => {
            cumInt += row.interest;
            if (idx % step === 0 || idx === results.schedule.length - 1) {
                labels.push(row.label);
                balanceData.push(parseFloat(row.balance.toFixed(2)));
                cumInterestData.push(parseFloat(cumInt.toFixed(2)));
                pointColors.push(row.hasPrepayment ? '#f59e0b' : 'transparent');
                pointRadii.push(row.hasPrepayment ? 6 : 0);
            }
        });

        return {
            labels,
            datasets: [
                {
                    label: 'Outstanding Balance (₹)',
                    data: balanceData,
                    borderColor: '#007AFF',
                    backgroundColor: 'rgba(0,122,255,0.08)',
                    fill: true,
                    tension: 0.3,
                    yAxisID: 'y',
                    pointRadius: pointRadii,
                    pointBackgroundColor: pointColors,
                    pointBorderColor: pointColors,
                },
                {
                    label: 'Cumulative Interest (₹)',
                    data: cumInterestData,
                    borderColor: '#FF6B6B',
                    backgroundColor: 'rgba(255,107,107,0.06)',
                    fill: false,
                    tension: 0.3,
                    yAxisID: 'y1',
                    pointRadius: 0,
                },
            ],
        };
    }

    const chartOptions = {
        responsive: true,
        interaction: { mode: 'index', intersect: false },
        plugins: {
            legend: {
                labels: { color: theme.text, font: { size: 13 } },
            },
            title: {
                display: true,
                text: 'Balance & Cumulative Interest Over Time',
                color: theme.text,
                font: { size: 16, weight: 'bold' },
            },
            tooltip: {
                callbacks: {
                    label: ctx => `${ctx.dataset.label}: ₹${fmt(ctx.parsed.y)}`,
                },
            },
        },
        scales: {
            x: {
                ticks: {
                    color: theme.subtleText || theme.text,
                    maxRotation: 45,
                    font: { size: 11 },
                },
                grid: { color: 'rgba(128,128,128,0.12)' },
            },
            y: {
                position: 'left',
                ticks: {
                    color: '#007AFF',
                    callback: v => '₹' + fmt(v),
                    font: { size: 11 },
                },
                grid: { color: 'rgba(128,128,128,0.12)' },
                title: { display: true, text: 'Outstanding Balance (₹)', color: '#007AFF', font: { size: 12 } },
            },
            y1: {
                position: 'right',
                ticks: {
                    color: '#FF6B6B',
                    callback: v => '₹' + fmt(v),
                    font: { size: 11 },
                },
                grid: { drawOnChartArea: false },
                title: { display: true, text: 'Cumulative Interest (₹)', color: '#FF6B6B', font: { size: 12 } },
            },
        },
    };

    // ── Chevron SVG ───────────────────────────────────────────────────────────
    const Chevron = ({ open }) => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.25s' }}>
            <polyline points="6 9 12 15 18 9" />
        </svg>
    );

    // ── Section Toggle Button ─────────────────────────────────────────────────
    const ToggleSection = ({ label, open, onToggle, optional = true }) => (
        <button
            type="button"
            onClick={onToggle}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '0.7rem 1rem',
                borderRadius: 12,
                border: theme.border,
                background: open ? theme.glass : theme.card,
                color: theme.text,
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                marginBottom: open ? 12 : 0,
                transition: 'background 0.2s',
            }}
        >
            <span>
                {label}
                {optional && (
                    <span style={{
                        marginLeft: 8,
                        fontSize: 11,
                        fontWeight: 500,
                        padding: '2px 7px',
                        borderRadius: 20,
                        background: 'rgba(128,128,128,0.15)',
                        color: theme.subtleText || theme.text,
                        verticalAlign: 'middle',
                    }}>
                        Optional
                    </span>
                )}
            </span>
            <Chevron open={open} />
        </button>
    );

    // ── Radio Group ───────────────────────────────────────────────────────────
    const RadioGroup = ({ label, name, value, onChange, options }) => (
        <div style={{ marginBottom: 12 }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8, color: theme.text }}>{label}</div>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                {options.map(opt => (
                    <label key={opt.value} style={{
                        display: 'flex', alignItems: 'center', gap: 7,
                        cursor: 'pointer', fontSize: 14,
                        color: value === opt.value ? theme.accent : (theme.subtleText || theme.text),
                        fontWeight: value === opt.value ? 600 : 400,
                    }}>
                        <input
                            type="radio"
                            name={name}
                            value={opt.value}
                            checked={value === opt.value}
                            onChange={() => onChange(opt.value)}
                            style={{ accentColor: theme.accent, width: 16, height: 16 }}
                        />
                        {opt.label}
                    </label>
                ))}
            </div>
        </div>
    );

    // ── Render ────────────────────────────────────────────────────────────────
    const chartData = results ? buildChartData() : null;

    return (
        <div style={{ textAlign: 'center', color: theme.text }}>
            <h2 style={{ fontWeight: 800, fontSize: 28, marginBottom: 8 }}>Advanced EMI Calculator</h2>
            <p style={{ fontSize: 15, marginBottom: 28, opacity: 0.7 }}>
                Full loan amortization with prepayments, rate changes, moratorium & more.
            </p>

            <form
                onSubmit={e => { e.preventDefault(); calculate(); }}
                style={{ maxWidth: 560, margin: '0 auto 8px auto', textAlign: 'left' }}
            >
                {/* ── Main Loan Details ─────────────────────────────────────── */}
                <div style={{
                    background: theme.glass,
                    borderRadius: 16,
                    border: theme.border,
                    padding: '20px 20px',
                    marginBottom: 16,
                }}>
                    <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16, color: theme.text }}>
                        Loan Details
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                        <div>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 13 }}>
                                Loan Amount (₹)
                            </label>
                            <input
                                type="number" min="0" step="1000"
                                value={loanAmount}
                                onChange={e => setLoanAmount(e.target.value)}
                                style={inputStyle}
                                required
                                placeholder="e.g. 5000000"
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 13 }}>
                                Annual Interest Rate (% p.a.)
                            </label>
                            <input
                                type="number" min="0" step="0.01"
                                value={annualRate}
                                onChange={e => setAnnualRate(e.target.value)}
                                style={inputStyle}
                                required
                                placeholder="e.g. 8.70"
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 13 }}>
                                Loan Tenure (Months)
                            </label>
                            <input
                                type="number" min="1" step="1"
                                value={tenureMonths}
                                onChange={e => setTenureMonths(e.target.value)}
                                style={inputStyle}
                                required
                                placeholder="e.g. 240"
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 13 }}>
                                Loan Start Date
                            </label>
                            <input
                                type="month"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                style={inputStyle}
                            />
                        </div>
                    </div>
                </div>

                {/* ── Loan Settings ─────────────────────────────────────────── */}
                <div style={{
                    background: theme.glass,
                    borderRadius: 16,
                    border: theme.border,
                    padding: '20px 20px',
                    marginBottom: 16,
                }}>
                    <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16, color: theme.text }}>
                        Loan Settings
                    </div>
                    <RadioGroup
                        label="Prepayment Effect"
                        name="prepayEffect"
                        value={prepayEffect}
                        onChange={setPrepayEffect}
                        options={[
                            { value: 'reduceTenure', label: 'Reduce Tenure (keep same EMI)' },
                            { value: 'reduceEMI', label: 'Reduce EMI (keep same tenure)' },
                        ]}
                    />
                    <RadioGroup
                        label="ROI Change Effect"
                        name="roiEffect"
                        value={roiEffect}
                        onChange={setRoiEffect}
                        options={[
                            { value: 'reduceTenure', label: 'Reduce Tenure (keep same EMI)' },
                            { value: 'reduceEMI', label: 'Reduce EMI (keep same tenure)' },
                        ]}
                    />
                </div>

                {/* ── Optional: Extra Repayments ────────────────────────────── */}
                <div style={{ marginBottom: 12 }}>
                    <ToggleSection
                        label="Extra Repayments / Prepayments"
                        open={showPrepayments}
                        onToggle={() => setShowPrepayments(v => !v)}
                    />
                    {showPrepayments && (
                        <div style={{
                            background: theme.glass,
                            borderRadius: '0 0 16px 16px',
                            border: theme.border,
                            borderTop: 'none',
                            padding: '16px 16px',
                        }}>
                            {prepayments.length === 0 && (
                                <div style={{ fontSize: 13, opacity: 0.6, marginBottom: 10, textAlign: 'center' }}>
                                    No prepayments added. Click below to add one.
                                </div>
                            )}
                            {prepayments.map((p, idx) => (
                                <div key={p.id} style={{
                                    display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap'
                                }}>
                                    <div style={{ fontSize: 13, fontWeight: 600, minWidth: 24, color: theme.subtleText || theme.text }}>
                                        #{idx + 1}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 100 }}>
                                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                                            Month No.
                                        </label>
                                        <input
                                            type="number" min="1" step="1"
                                            value={p.month}
                                            onChange={e => updatePrepayment(p.id, 'month', e.target.value)}
                                            style={smallInputStyle}
                                            placeholder="e.g. 12"
                                        />
                                    </div>
                                    <div style={{ flex: 2, minWidth: 120 }}>
                                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                                            Amount (₹)
                                        </label>
                                        <input
                                            type="number" min="0" step="1000"
                                            value={p.amount}
                                            onChange={e => updatePrepayment(p.id, 'amount', e.target.value)}
                                            style={smallInputStyle}
                                            placeholder="e.g. 100000"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removePrepayment(p.id)}
                                        style={{
                                            marginTop: 18,
                                            padding: '0.5rem 0.8rem',
                                            borderRadius: 8,
                                            border: 'none',
                                            background: 'rgba(255,80,80,0.15)',
                                            color: '#ff5050',
                                            cursor: 'pointer',
                                            fontWeight: 700,
                                            fontSize: 16,
                                        }}
                                        title="Delete"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={addPrepayment}
                                style={{
                                    marginTop: 4,
                                    padding: '0.55rem 1.2rem',
                                    borderRadius: 10,
                                    border: `1.5px dashed ${theme.accent}`,
                                    background: 'transparent',
                                    color: theme.accent,
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                    fontSize: 14,
                                }}
                            >
                                + Add Prepayment
                            </button>
                        </div>
                    )}
                </div>

                {/* ── Optional: Interest Rate Changes ───────────────────────── */}
                <div style={{ marginBottom: 12 }}>
                    <ToggleSection
                        label="Interest Rate Changes (Floating Rate)"
                        open={showRateChanges}
                        onToggle={() => setShowRateChanges(v => !v)}
                    />
                    {showRateChanges && (
                        <div style={{
                            background: theme.glass,
                            borderRadius: '0 0 16px 16px',
                            border: theme.border,
                            borderTop: 'none',
                            padding: '16px 16px',
                        }}>
                            {rateChanges.length === 0 && (
                                <div style={{ fontSize: 13, opacity: 0.6, marginBottom: 10, textAlign: 'center' }}>
                                    No rate changes added. Click below to add one.
                                </div>
                            )}
                            {rateChanges.map((rc, idx) => (
                                <div key={rc.id} style={{
                                    display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap'
                                }}>
                                    <div style={{ fontSize: 13, fontWeight: 600, minWidth: 24, color: theme.subtleText || theme.text }}>
                                        #{idx + 1}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 100 }}>
                                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                                            Month No.
                                        </label>
                                        <input
                                            type="number" min="1" step="1"
                                            value={rc.month}
                                            onChange={e => updateRateChange(rc.id, 'month', e.target.value)}
                                            style={smallInputStyle}
                                            placeholder="e.g. 24"
                                        />
                                    </div>
                                    <div style={{ flex: 2, minWidth: 120 }}>
                                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                                            New Rate (% p.a.)
                                        </label>
                                        <input
                                            type="number" min="0" step="0.01"
                                            value={rc.rate}
                                            onChange={e => updateRateChange(rc.id, 'rate', e.target.value)}
                                            style={smallInputStyle}
                                            placeholder="e.g. 9.50"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeRateChange(rc.id)}
                                        style={{
                                            marginTop: 18,
                                            padding: '0.5rem 0.8rem',
                                            borderRadius: 8,
                                            border: 'none',
                                            background: 'rgba(255,80,80,0.15)',
                                            color: '#ff5050',
                                            cursor: 'pointer',
                                            fontWeight: 700,
                                            fontSize: 16,
                                        }}
                                        title="Delete"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={addRateChange}
                                style={{
                                    marginTop: 4,
                                    padding: '0.55rem 1.2rem',
                                    borderRadius: 10,
                                    border: `1.5px dashed ${theme.accent}`,
                                    background: 'transparent',
                                    color: theme.accent,
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                    fontSize: 14,
                                }}
                            >
                                + Add Rate Change
                            </button>
                        </div>
                    )}
                </div>

                {/* ── Optional: Moratorium ──────────────────────────────────── */}
                <div style={{ marginBottom: 20 }}>
                    <ToggleSection
                        label="Moratorium Period"
                        open={showMoratorium}
                        onToggle={() => setShowMoratorium(v => !v)}
                    />
                    {showMoratorium && (
                        <div style={{
                            background: theme.glass,
                            borderRadius: '0 0 16px 16px',
                            border: theme.border,
                            borderTop: 'none',
                            padding: '16px 16px',
                        }}>
                            <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 10 }}>
                                Interest accrues and is capitalized into the principal. No EMI is paid during this period.
                            </div>
                            <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                                Moratorium Duration (Months)
                            </label>
                            <input
                                type="number" min="0" step="1"
                                value={moratoriumMonths}
                                onChange={e => setMoratoriumMonths(e.target.value)}
                                style={{ ...inputStyle, maxWidth: 200 }}
                                placeholder="e.g. 6"
                            />
                        </div>
                    )}
                </div>

                {/* ── Calculate Button ──────────────────────────────────────── */}
                <button
                    type="submit"
                    style={{
                        width: '100%',
                        padding: '0.95rem',
                        borderRadius: 14,
                        border: 'none',
                        fontWeight: 700,
                        fontSize: 18,
                        background: theme.navActive,
                        color: '#fff',
                        cursor: 'pointer',
                        boxShadow: '0 4px 16px rgba(0,122,255,0.3)',
                    }}
                >
                    Calculate
                </button>
            </form>

            {/* ── Results Section ──────────────────────────────────────────── */}
            {results && (
                <div
                    ref={exportRef}
                    style={{
                        marginTop: 36,
                        animation: 'fadeIn 0.4s ease-out',
                        textAlign: 'left',
                        maxWidth: 900,
                        margin: '36px auto 0 auto',
                    }}
                >
                    {/* Summary Cards */}
                    <h3 style={{ fontWeight: 700, fontSize: 20, marginBottom: 16, textAlign: 'center', color: theme.text }}>
                        Loan Summary
                    </h3>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                        gap: 12,
                        marginBottom: 28,
                    }}>
                        <SummaryCard
                            label="Base EMI"
                            value={`₹${fmt(results.baseEMI)}`}
                            theme={theme}
                            accent={theme.accent}
                        />
                        <SummaryCard
                            label="Actual Tenure"
                            value={results.tenureLabel}
                            theme={theme}
                            accent={theme.text}
                            valueFontSize={15}
                        />
                        <SummaryCard
                            label="Total Interest Paid"
                            value={`₹${fmt(results.totalInterest)}`}
                            theme={theme}
                            accent={theme.accent2}
                        />
                        <SummaryCard
                            label="Interest Saved"
                            value={`₹${fmt(results.interestSaved)}`}
                            theme={theme}
                            accent={results.interestSaved > 0 ? '#22c55e' : theme.text}
                            highlight={results.interestSaved > 0}
                        />
                        <SummaryCard
                            label="Total Amount Paid"
                            value={`₹${fmt(results.totalPaid)}`}
                            theme={theme}
                            accent={theme.text}
                            subLabel={results.totalPrepaid > 0 ? `incl. ₹${fmt(results.totalPrepaid)} prepaid` : ''}
                        />
                    </div>

                    {/* Amortization Table */}
                    <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 10, color: theme.text }}>
                        Amortization Schedule
                    </h3>

                    {/* Legend */}
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 10, fontSize: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <div style={{ width: 14, height: 14, borderRadius: 4, background: 'rgba(245,158,11,0.25)', border: '1px solid rgba(245,158,11,0.5)' }} />
                            <span style={{ color: theme.subtleText || theme.text }}>Moratorium</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <div style={{ width: 14, height: 14, borderRadius: 4, background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.4)' }} />
                            <span style={{ color: theme.subtleText || theme.text }}>Prepayment</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <div style={{ width: 14, height: 14, borderRadius: 4, background: 'transparent', border: '2px solid rgba(99,102,241,0.7)' }} />
                            <span style={{ color: theme.subtleText || theme.text }}>Rate Change</span>
                        </div>
                    </div>

                    <div style={{
                        maxHeight: 400,
                        overflowY: 'auto',
                        borderRadius: 12,
                        border: theme.border,
                        marginBottom: 28,
                    }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                            <thead style={{ position: 'sticky', top: 0, background: theme.card, zIndex: 1 }}>
                                <tr style={{ borderBottom: `2px solid ${theme.accent}` }}>
                                    {['Month', 'Date', 'Type', 'EMI (₹)', 'Principal (₹)', 'Interest (₹)', 'Prepayment (₹)', 'Balance (₹)'].map(col => (
                                        <th key={col} style={{
                                            padding: '10px 10px',
                                            textAlign: col === 'Month' || col === 'Date' || col === 'Type' ? 'center' : 'right',
                                            fontWeight: 700,
                                            whiteSpace: 'nowrap',
                                        }}>
                                            {col}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {results.schedule.map((row, idx) => {
                                    const isMoro = row.type === 'Moratorium';
                                    const bg = isMoro
                                        ? 'rgba(245,158,11,0.10)'
                                        : row.hasPrepayment
                                            ? 'rgba(34,197,94,0.08)'
                                            : idx % 2 === 0
                                                ? 'transparent'
                                                : 'rgba(128,128,128,0.04)';
                                    const borderLeft = row.hasRateChange
                                        ? '3px solid rgba(99,102,241,0.7)'
                                        : '3px solid transparent';
                                    return (
                                        <tr key={row.month} style={{
                                            background: bg,
                                            borderBottom: `1px solid rgba(128,128,128,0.08)`,
                                            borderLeft,
                                        }}>
                                            <td style={{ padding: '7px 10px', textAlign: 'center', fontWeight: 500 }}>{row.month}</td>
                                            <td style={{ padding: '7px 10px', textAlign: 'center', whiteSpace: 'nowrap' }}>{row.label}</td>
                                            <td style={{ padding: '7px 10px', textAlign: 'center' }}>
                                                <span style={{
                                                    fontSize: 11,
                                                    fontWeight: 600,
                                                    padding: '2px 7px',
                                                    borderRadius: 20,
                                                    background: isMoro ? 'rgba(245,158,11,0.25)' : 'rgba(128,128,128,0.12)',
                                                    color: isMoro ? '#b45309' : (theme.subtleText || theme.text),
                                                }}>
                                                    {row.type}
                                                </span>
                                            </td>
                                            <td style={{ padding: '7px 10px', textAlign: 'right' }}>
                                                {row.emi > 0 ? fmt(row.emi) : '—'}
                                            </td>
                                            <td style={{ padding: '7px 10px', textAlign: 'right', color: theme.accent }}>
                                                {row.principal > 0 ? fmt(row.principal) : '—'}
                                            </td>
                                            <td style={{ padding: '7px 10px', textAlign: 'right', color: theme.accent2 }}>
                                                {fmt(row.interest)}
                                            </td>
                                            <td style={{ padding: '7px 10px', textAlign: 'right', color: '#22c55e', fontWeight: row.hasPrepayment ? 700 : 400 }}>
                                                {row.prepayment > 0 ? fmt(row.prepayment) : '—'}
                                            </td>
                                            <td style={{ padding: '7px 10px', textAlign: 'right' }}>
                                                {fmt(row.balance)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Export Buttons */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}>
                        <button
                            type="button"
                            onClick={handleExportExcel}
                            style={{
                                padding: '0.7rem 1.6rem',
                                borderRadius: 12,
                                border: 'none',
                                fontWeight: 700,
                                fontSize: 15,
                                background: theme.accent2,
                                color: '#fff',
                                cursor: 'pointer',
                                boxShadow: '0 2px 10px rgba(0,198,174,0.3)',
                            }}
                        >
                            📊 Export Excel
                        </button>
                        <button
                            type="button"
                            onClick={handleExportPDF}
                            disabled={exporting}
                            style={{
                                padding: '0.7rem 1.6rem',
                                borderRadius: 12,
                                border: 'none',
                                fontWeight: 700,
                                fontSize: 15,
                                background: exporting ? 'rgba(128,128,128,0.3)' : theme.accent,
                                color: '#fff',
                                cursor: exporting ? 'not-allowed' : 'pointer',
                                boxShadow: exporting ? 'none' : '0 2px 10px rgba(0,122,255,0.3)',
                            }}
                        >
                            {exporting ? '⏳ Generating...' : '📄 Export PDF'}
                        </button>
                    </div>

                    {/* Chart */}
                    {chartData && (
                        <div style={{
                            background: theme.glass,
                            borderRadius: 16,
                            border: theme.border,
                            padding: '20px 16px',
                            marginTop: 8,
                        }}>
                            <Line data={chartData} options={chartOptions} />
                            {results.schedule.some(r => r.hasPrepayment) && (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 7,
                                    justifyContent: 'center',
                                    marginTop: 10,
                                    fontSize: 12,
                                    color: theme.subtleText || theme.text,
                                }}>
                                    <div style={{
                                        width: 12, height: 12, borderRadius: '50%',
                                        background: '#f59e0b', border: '2px solid #b45309',
                                    }} />
                                    Yellow dots indicate prepayment months
                                </div>
                            )}
                        </div>
                    )}
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

// ── Sub-component: Summary Card ───────────────────────────────────────────────

function SummaryCard({ label, value, theme, accent, highlight, subLabel, valueFontSize }) {
    return (
        <div style={{
            background: highlight ? 'rgba(34,197,94,0.08)' : theme.glass,
            padding: '16px 14px',
            borderRadius: 16,
            border: highlight ? '1.5px solid rgba(34,197,94,0.4)' : theme.border,
        }}>
            <div style={{
                fontSize: 11,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                opacity: 0.6,
                marginBottom: 6,
                color: theme.text,
            }}>
                {label}
            </div>
            <div style={{
                fontSize: valueFontSize || 20,
                fontWeight: 800,
                color: accent,
                lineHeight: 1.2,
                wordBreak: 'break-word',
            }}>
                {value}
            </div>
            {subLabel && (
                <div style={{ fontSize: 11, marginTop: 4, opacity: 0.6, color: theme.text }}>
                    {subLabel}
                </div>
            )}
        </div>
    );
}
