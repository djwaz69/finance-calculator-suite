/**
 * Core mathematical and financial formulas.
 * Extracting these from UI components makes them pure, testable, and reusable.
 */

export function calculateEMIParams(principal, tenureMonths, rateAnnual) {
    const P = parseFloat(principal);
    const N = parseInt(tenureMonths);
    const R_annual = parseFloat(rateAnnual);

    if (isNaN(P) || P <= 0 || isNaN(N) || N <= 0) {
        return { emi: null, schedule: [] };
    }

    const R = R_annual / 12 / 100;
    let emiVal;

    if (R_annual === 0) {
        emiVal = P / N;
    } else {
        emiVal = (P * R * Math.pow(1 + R, N)) / (Math.pow(1 + R, N) - 1);
    }
    
    return { emi: emiVal, R };
}

export function generateAmortizationSchedule(principal, tenureMonths, rateAnnual, emiVal) {
    const P = parseFloat(principal);
    const N = parseInt(tenureMonths);
    const R = parseFloat(rateAnnual) / 12 / 100;
    
    if (isNaN(P) || P <= 0 || isNaN(N) || N <= 0 || !emiVal) return [];

    let balance = P;
    const schedule = [];
    
    for (let i = 1; i <= N; i++) {
        let interest = 0;
        let p = emiVal;
        
        if (R > 0) {
            interest = balance * R;
            p = emiVal - interest;
        }

        // Handle rounding errors in the last month
        if (balance < p || i === N) {
            p = balance;
        }
        
        balance = balance - p;
        
        schedule.push({
            month: i,
            principal: p > 0 ? p : 0,
            interest: interest > 0 ? interest : 0,
            balance: balance > 0 ? balance : 0
        });
        
        if (balance <= 0) break;
    }
    return schedule;
}

export function getAmortizationStats(principal, ratePerMonth, emi) {
    let bal = principal;
    let totalInt = 0;
    let months = 0;
    // Safety break to prevent infinite loop (e.g. 50 years max)
    while (bal > 1 && months < 600) {
        let int = bal * ratePerMonth;
        let princ = emi - int;
        if (bal < princ) {
            princ = bal;
        }
        bal -= princ;
        totalInt += int;
        months++;
    }
    return { totalInterest: totalInt, tenureMonths: months };
}

export function getInterestAccruedTillMonth(principal, ratePerMonth, emi, targetMonth) {
    let bal = principal;
    let totalInt = 0;
    for (let i = 0; i < targetMonth; i++) {
        if (bal <= 0) break;
        let int = bal * ratePerMonth;
        let princ = emi - int;
        if (bal < princ) princ = bal;
        bal -= princ;
        totalInt += int;
    }
    return totalInt;
}

export function calculateSIP(P, T, R, stepUpRate = 0, lumpsum = 0) {
    const r_monthly = R / 12 / 100;
    const months = T * 12;

    let currentCorpus = lumpsum;
    let currentMonthlyInv = P;
    let investedSoFar = lumpsum;
    
    let labels = [];
    let dataPoints = [];
    let scheduleData = [];

    for (let i = 1; i <= months; i++) {
        currentCorpus = currentCorpus * (1 + r_monthly) + currentMonthlyInv;
        investedSoFar += currentMonthlyInv;

        scheduleData.push({ month: i, invested: investedSoFar, value: currentCorpus });

        if (i % 12 === 0) {
            currentMonthlyInv = currentMonthlyInv * (1 + stepUpRate / 100);
            labels.push(`Yr ${i / 12}`);
            dataPoints.push({ invested: investedSoFar, value: currentCorpus });
        }
    }
    
    return {
        totalInv: investedSoFar,
        finalValue: currentCorpus,
        profit: currentCorpus - investedSoFar,
        labels,
        dataPoints,
        scheduleData
    };
}

export function calculateLumpsum(P, T, R) {
    let labels = [];
    let dataPoints = [];
    let scheduleData = [];
    const finalValue = P * Math.pow(1 + R / 100, T);

    for (let i = 1; i <= T; i++) {
        let val = P * Math.pow(1 + R / 100, i);
        labels.push(`Yr ${i}`);
        dataPoints.push({ invested: P, value: val });
        scheduleData.push({ year: i, invested: P, value: val });
    }

    return {
        totalInv: P,
        finalValue,
        profit: finalValue - P,
        labels,
        dataPoints,
        scheduleData
    };
}

export function calculateSWP(P, T, R, W) {
    const r_monthly = R / 12 / 100;
    const months = T * 12;

    let currentBalance = P;
    let totalWithdrawn = 0;
    let fundsLasted = true;
    let extraText = '';

    let labels = [];
    let dataPoints = [];
    let scheduleData = [];

    for (let i = 1; i <= months; i++) {
        currentBalance += (currentBalance * r_monthly);

        let wAmt = W;
        if (currentBalance < W) {
            wAmt = currentBalance;
            currentBalance = 0;
            fundsLasted = false;
            extraText = `Funds lasted: ${Math.floor(i / 12)}y ${i % 12}m`;
        } else {
            currentBalance -= W;
        }
        totalWithdrawn += wAmt;

        scheduleData.push({ month: i, withdrawn: totalWithdrawn, value: currentBalance });

        if (i % 12 === 0 || i === months || currentBalance === 0) {
            if (labels.length === 0 || labels[labels.length - 1] !== `Yr ${Math.ceil(i / 12)}`) {
                labels.push(`Yr ${Math.ceil(i / 12)}`);
                dataPoints.push({ withdrawn: totalWithdrawn, value: currentBalance });
            }
        }
        if (currentBalance === 0) break;
    }

    if (fundsLasted) extraText = "Funds lasted: Full Tenure";

    return {
        totalInv: P,
        finalValue: currentBalance,
        profit: totalWithdrawn + currentBalance - P,
        totalWithdrawn,
        labels,
        dataPoints,
        scheduleData,
        extraText
    };
}

export function calculateRetirement(age, P, T, R) {
    const months = T * 12;
    const r_monthly = R / 12 / 100;

    // PMT = P * r / [1 - (1+r)^-n]
    // Guard: when R = 0 the formula produces 0/0; fall back to simple equal division
    let monthlyWithdrawal;
    if (r_monthly === 0) {
        monthlyWithdrawal = P / months;
    } else {
        monthlyWithdrawal = (P * r_monthly) / (1 - Math.pow(1 + r_monthly, -months));
    }

    let labels = [];
    let dataPoints = [];
    // Chart: Declining Balance
    let bal = P;
    for (let i = 0; i <= months; i++) {
        if (i % 12 === 0) {
            labels.push(age + i / 12);
            dataPoints.push({ value: bal });
        }
        bal = bal + (bal * r_monthly) - monthlyWithdrawal;
        if (bal < 0) bal = 0;
    }

    return {
        totalInv: P,
        finalValue: 0,
        profit: monthlyWithdrawal, // Returns monthly limit
        labels,
        dataPoints
    };
}

export function calculateFIRE(amount, fireCorpusOnly) {
    if (fireCorpusOnly) {
        // Amount is Monthly Expense
        const annualExp = amount * 12;
        return {
            totalInv: 0,
            finalValue: annualExp * 25,
            profit: annualExp, // Store Annual Exp
            extraText: "Required Corpus (4% Rule)"
        };
    } else {
        // Amount is Existing Corpus
        const annualIncome = amount * 0.04;
        const monthlyIncome = annualIncome / 12;
        return {
            totalInv: amount,
            finalValue: monthlyIncome, // Store Result
            profit: 0,
            extraText: "Safe Monthly Income (4% Rule) to never run out*"
        };
    }
}
