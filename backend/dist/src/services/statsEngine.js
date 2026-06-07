"use strict";
/**
 * Pharmacovigilance Statistical Signal Detection Engine
 *
 * Implements:
 * - PRR (Proportional Reporting Ratio)
 * - ROR (Reporting Odds Ratio)
 * - Chi-Square (with Yates' correction)
 * - 95% Confidence Intervals for PRR
 * - Information Component (IC) with Bayesian shrinkage
 * - Composite Signal Score
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateMetrics = calculateMetrics;
/**
 * Calculates all disproportionality metrics for a 2x2 contingency table.
 *
 * @param a Reports with Suspected Drug & Adverse Event
 * @param drugReports Total reports for the Suspected Drug
 * @param eventReports Total reports for the Adverse Event
 * @param N Total reports in the database
 */
function calculateMetrics(a, drugReports, eventReports, N) {
    // Contingency Table values:
    // a = drug + event
    // b = drug + other event
    // c = other drug + event
    // d = other drug + other event
    const b = Math.max(0, drugReports - a);
    const c = Math.max(0, eventReports - a);
    const d = Math.max(0, N - a - b - c);
    // 1. Proportional Reporting Ratio (PRR)
    // PRR = (a / (a + b)) / (c / (c + d))
    const p1 = (a + b) > 0 ? a / (a + b) : 0;
    const p2 = (c + d) > 0 ? c / (c + d) : 0;
    let prr = p2 === 0 ? 0 : p1 / p2;
    if (isNaN(prr) || !isFinite(prr))
        prr = 0;
    // 2. Reporting Odds Ratio (ROR)
    // ROR = (a * d) / (b * c)
    let ror = (b * c) === 0 ? 0 : (a * d) / (b * c);
    if (isNaN(ror) || !isFinite(ror))
        ror = 0;
    // 3. Chi-Square (with Yates' correction for continuity)
    // Chi2 = N * (|a*d - b*c| - N/2)^2 / ((a+b)*(c+d)*(a+c)*(b+d))
    const num = N * Math.pow(Math.max(0, Math.abs(a * d - b * c) - N / 2), 2);
    const den = (a + b) * (c + d) * (a + c) * (b + d);
    let chiSquare = den === 0 ? 0 : num / den;
    if (isNaN(chiSquare) || !isFinite(chiSquare))
        chiSquare = 0;
    // 4. 95% Confidence Interval for PRR
    // SE(ln(PRR)) = sqrt(1/a - 1/(a+b) + 1/c - 1/(c+d))
    // Haldane-Anscombe correction: add 0.5 to cells when division by zero might occur
    const aCorr = a === 0 ? a + 0.5 : a;
    const bCorr = b === 0 ? b + 0.5 : b;
    const cCorr = c === 0 ? c + 0.5 : c;
    const dCorr = d === 0 ? d + 0.5 : d;
    const prrCorr = (aCorr / (aCorr + bCorr)) / (cCorr / (cCorr + dCorr));
    const se = Math.sqrt(1 / aCorr - 1 / (aCorr + bCorr) + 1 / cCorr - 1 / (cCorr + dCorr));
    const lnPrr = Math.log(prrCorr);
    let ciLower = Math.exp(lnPrr - 1.96 * se);
    let ciUpper = Math.exp(lnPrr + 1.96 * se);
    if (a === 0 || c === 0) {
        ciLower = 0;
        ciUpper = 0;
    }
    // 5. Information Component (IC) with Bayesian shrinkage (prior cell count + 0.5)
    // IC = log2( (a + 0.5)*N / ((a+b+0.5)*(a+c+0.5)) )
    let informationComponent = Math.log2(((a + 0.5) * N) / ((a + b + 0.5) * (a + c + 0.5)));
    if (isNaN(informationComponent) || !isFinite(informationComponent))
        informationComponent = 0;
    // 6. Composite Signal Score
    // Score = (PRR * ln(a + 1)) + ln(ROR) + chiSquare / 10
    // Handle edge cases where PRR or ROR is 0 or negative
    const lnROR = ror > 0 ? Math.log(ror) : 0;
    const prrWeight = prr * Math.log(a + 1);
    const chiWeight = Math.min(5, chiSquare / 10);
    const signalScore = prrWeight + Math.max(0, lnROR) + chiWeight;
    // 7. Signal Strength Criteria
    // Strong Signal (Evans criteria): PRR >= 2, Chi-square >= 3.84 (p<0.05), Cases >= 3, PRR 95% CI lower limit > 1
    const isStrong = prr >= 2 && chiSquare >= 3.84 && a >= 3 && ciLower > 1;
    const isModerate = prr >= 1.5 && chiSquare >= 2 && a >= 2;
    let strength = 'No Signal';
    if (isStrong) {
        strength = 'Strong';
    }
    else if (isModerate) {
        strength = 'Moderate';
    }
    else if (prr > 1) {
        strength = 'Weak';
    }
    return {
        a,
        b,
        c,
        d,
        prr: Math.round(prr * 100) / 100,
        ror: Math.round(ror * 100) / 100,
        chiSquare: Math.round(chiSquare * 100) / 100,
        ciLower: Math.round(ciLower * 100) / 100,
        ciUpper: Math.round(ciUpper * 100) / 100,
        informationComponent: Math.round(informationComponent * 100) / 100,
        signalScore: Math.round(signalScore * 100) / 100,
        strength
    };
}
