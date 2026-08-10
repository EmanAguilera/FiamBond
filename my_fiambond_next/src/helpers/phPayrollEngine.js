/**
 * PHILIPPINE STATUTORY PAYROLL COMPUTATION ENGINE
 * Compliant with DOLE, SSS, PhilHealth, Pag-IBIG (HDMF), and BIR TRAIN Law.
 */

// 1. DOLE OVERTIME & HOLIDAY MULTIPLIERS
export const Multipliers = {
    REGULAR_OT: 1.25,
    SPECIAL_HOLIDAY: 1.30,
    SPECIAL_HOLIDAY_OT: 1.30 * 1.25, // 1.625
    LEGAL_HOLIDAY: 2.00,
    LEGAL_HOLIDAY_OT: 2.00 * 1.30, // 2.60
    NIGHT_DIFFERENTIAL: 0.10 // 10% premium (10 PM to 6 AM)
};

/**
 * Calculates hourly and daily breakdown rates from basic salary.
 */
export function calculateRates(basicSalary, payType = 'monthly', daysInPeriod = 11) {
    let monthlyRate = 0;
    let dailyRate = 0;
    let hourlyRate = 0;

    if (payType === 'daily') {
        dailyRate = parseFloat(basicSalary) || 0;
        monthlyRate = dailyRate * 22; // Standard 22 working days
        hourlyRate = dailyRate / 8;
    } else {
        monthlyRate = parseFloat(basicSalary) || 0;
        dailyRate = monthlyRate / 22; 
        hourlyRate = dailyRate / 8;
    }

    return { monthlyRate, dailyRate, hourlyRate };
}

/**
 * 2. SSS CONTRIBUTION LOOKUP (2024-2026 Standard)
 * Rate: 14% Total (4.5% Employee Share, 9.5% Employer Share)
 * Minimum MSC: ₱4,000 | Maximum MSC: ₱30,000
 */
export function calculateSSS(monthlyBasic) {
    if (monthlyBasic <= 0) return { ee: 0, er: 0, total: 0, msc: 0 };

    const minMSC = 4000;
    const maxMSC = 30000;
    let msc = Math.max(minMSC, Math.min(maxMSC, Math.round(monthlyBasic / 500) * 500));

    const ee = msc * 0.045;
    const er = msc * 0.095;

    return {
        ee: Math.round(ee * 100) / 100,
        er: Math.round(er * 100) / 100,
        total: Math.round((ee + er) * 100) / 100,
        msc
    };
}

/**
 * 3. PHILHEALTH PREMIUM COMPUTATION (2024-2026 Standard)
 * Rate: 5% Premium Split 50/50 | Floor: ₱10,000 | Ceiling: ₱100,000
 */
export function calculatePhilHealth(monthlyBasic) {
    if (monthlyBasic <= 0) return { ee: 0, er: 0, total: 0 };

    const floor = 10000;
    const ceiling = 100000;
    const subjectSalary = Math.max(floor, Math.min(ceiling, monthlyBasic));

    const totalContribution = subjectSalary * 0.05;
    const ee = totalContribution / 2;
    const er = totalContribution / 2;

    return {
        ee: Math.round(ee * 100) / 100,
        er: Math.round(er * 100) / 100,
        total: Math.round(totalContribution * 100) / 100
    };
}

/**
 * 4. PAG-IBIG (HDMF) CONTRIBUTION (Updated ₱200 Cap)
 * EE: 2% (Max ₱200) | ER: 2% (Max ₱200)
 */
export function calculatePagIBIG(monthlyBasic) {
    if (monthlyBasic <= 0) return { ee: 0, er: 0, total: 0 };

    const cap = 200;
    const ee = Math.min(monthlyBasic * 0.02, cap);
    const er = Math.min(monthlyBasic * 0.02, cap);

    return {
        ee: Math.round(ee * 100) / 100,
        er: Math.round(er * 100) / 100,
        total: Math.round((ee + er) * 100) / 100
    };
}

/**
 * 5. BIR WITHHOLDING TAX COMPUTATION (TRAIN Law Semi-Monthly Schedule)
 */
export function calculateBIRWithholdingTax(taxableIncome, payCycle = 'semi-monthly') {
    if (taxableIncome <= 0) return 0;

    let tax = 0;
    if (payCycle === 'semi-monthly') {
        if (taxableIncome <= 10417) {
            tax = 0;
        } else if (taxableIncome <= 16666) {
            tax = (taxableIncome - 10417) * 0.15;
        } else if (taxableIncome <= 33332) {
            tax = 937.50 + ((taxableIncome - 16666) * 0.20);
        } else if (taxableIncome <= 83332) {
            tax = 4270.83 + ((taxableIncome - 33332) * 0.25);
        } else if (taxableIncome <= 333332) {
            tax = 16770.83 + ((taxableIncome - 83332) * 0.30);
        } else {
            tax = 91770.83 + ((taxableIncome - 333332) * 0.35);
        }
    } else {
        const monthlyTaxable = taxableIncome;
        if (monthlyTaxable <= 20833) {
            tax = 0;
        } else if (monthlyTaxable <= 33333) {
            tax = (monthlyTaxable - 20833) * 0.15;
        } else if (monthlyTaxable <= 66667) {
            tax = 1875 + ((monthlyTaxable - 33333) * 0.20);
        } else if (monthlyTaxable <= 166667) {
            tax = 8541.67 + ((monthlyTaxable - 66667) * 0.25);
        } else if (monthlyTaxable <= 666667) {
            tax = 33541.67 + ((monthlyTaxable - 166667) * 0.30);
        } else {
            tax = 183541.67 + ((monthlyTaxable - 66667) * 0.35);
        }
    }

    return Math.max(0, Math.round(tax * 100) / 100);
}

/**
 * MASTER COMPUTATION ENGINE
 */
export function computePhPayroll(input) {
    const {
        basicSalary = 0,
        payType = 'monthly',
        payCycle = 'semi-monthly',
        daysWorked = 11,
        tardinessMins = 0,
        undertimeMins = 0,
        regularOTHours = 0,
        specialHolidayOTHours = 0,
        legalHolidayOTHours = 0,
        nightDiffHours = 0,
        allowances = { transport: 0, meal: 0, colas: 0, other: 0 },
        voluntaryDeductions = { sssLoan: 0, pagibigLoan: 0, salaryAdvance: 0, other: 0 }
    } = input;

    // 1. Rates
    const { monthlyRate, dailyRate, hourlyRate } = calculateRates(basicSalary, payType);
    const minuteRate = hourlyRate / 60;

    // 2. Base Period Pay
    const basePeriodPay = payCycle === 'semi-monthly' ? monthlyRate / 2 : monthlyRate;

    // 3. Timekeeper Deductions
    const tardinessDeduction = tardinessMins * minuteRate;
    const undertimeDeduction = undertimeMins * minuteRate;
    const totalTimeDeductions = tardinessDeduction + undertimeDeduction;

    // 4. Overtime & Premiums
    const regularOTPay = regularOTHours * hourlyRate * Multipliers.REGULAR_OT;
    const specialHolidayOTPay = specialHolidayOTHours * hourlyRate * Multipliers.SPECIAL_HOLIDAY_OT;
    const legalHolidayOTPay = legalHolidayOTHours * hourlyRate * Multipliers.LEGAL_HOLIDAY_OT;
    const nightDiffPay = nightDiffHours * hourlyRate * Multipliers.NIGHT_DIFFERENTIAL;

    const totalOTPay = regularOTPay + specialHolidayOTPay + legalHolidayOTPay + nightDiffPay;

    // 5. Allowances
    const totalAllowances = (parseFloat(allowances.transport) || 0) + 
                            (parseFloat(allowances.meal) || 0) + 
                            (parseFloat(allowances.colas) || 0) + 
                            (parseFloat(allowances.other) || 0);

    // 6. Gross Pay
    const grossPay = (basePeriodPay - totalTimeDeductions) + totalOTPay + totalAllowances;

    // 7. Mandatory Statutory Contributions
    const fullSSS = calculateSSS(monthlyRate);
    const fullPhilHealth = calculatePhilHealth(monthlyRate);
    const fullPagIBIG = calculatePagIBIG(monthlyRate);

    const periodFactor = payCycle === 'semi-monthly' ? 0.5 : 1.0;

    const sssEE = fullSSS.ee * periodFactor;
    const sssER = fullSSS.er * periodFactor;

    const philHealthEE = fullPhilHealth.ee * periodFactor;
    const philHealthER = fullPhilHealth.er * periodFactor;

    const pagibigEE = fullPagIBIG.ee * periodFactor;
    const pagibigER = fullPagIBIG.er * periodFactor;

    const totalStatutoryEE = sssEE + philHealthEE + pagibigEE;
    const totalStatutoryER = sssER + philHealthER + pagibigER;

    // 8. Taxable Income & BIR Withholding Tax
    const taxableIncome = grossPay - totalStatutoryEE;
    const birTax = calculateBIRWithholdingTax(taxableIncome, payCycle);

    // 9. Voluntary Deductions
    const totalVoluntaryDeductions = (parseFloat(voluntaryDeductions.sssLoan) || 0) +
                                     (parseFloat(voluntaryDeductions.pagibigLoan) || 0) +
                                     (parseFloat(voluntaryDeductions.salaryAdvance) || 0) +
                                     (parseFloat(voluntaryDeductions.other) || 0);

    // 10. Net Take-Home Pay
    const totalDeductions = totalStatutoryEE + birTax + totalVoluntaryDeductions;
    const netPay = Math.max(0, grossPay - totalDeductions);

    return {
        rates: { monthlyRate, dailyRate, hourlyRate },
        earnings: {
            basePeriodPay,
            tardinessDeduction,
            undertimeDeduction,
            regularOTPay,
            specialHolidayOTPay,
            legalHolidayOTPay,
            nightDiffPay,
            totalOTPay,
            totalAllowances,
            grossPay
        },
        statutory: {
            sss: { ee: sssEE, er: sssER },
            philHealth: { ee: philHealthEE, er: philHealthER },
            pagIBIG: { ee: pagibigEE, er: pagibigER },
            birTax,
            totalStatutoryEE,
            totalStatutoryER
        },
        deductions: {
            totalStatutoryEE,
            birTax,
            totalVoluntaryDeductions,
            totalDeductions
        },
        netPay,
        employerCosts: {
            totalStatutoryER,
            totalCompanyExpense: grossPay + totalStatutoryER
        }
    };
}