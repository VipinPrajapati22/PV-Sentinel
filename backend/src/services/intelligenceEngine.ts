/**
 * Pharmacovigilance Intelligence Engine (PIE)
 * 
 * A rule-based clinical expert system that provides:
 * - WHO-UMC causality recommendation logic
 * - Clinical interpretations of statistical metrics
 * - Risk prioritization assessments
 * - Corrective and Preventive Actions (CAPA) suggestions
 * - Executive summary generation
 */

export interface WHOUMCInputs {
  temporalRelationship: boolean | null; // Is there a clear temporal onset relative to dosing?
  dechallengeResult: 'positive' | 'negative' | 'not_done' | null; // Does the reaction improve when stopping the drug?
  rechallengeResult: 'positive' | 'negative' | 'not_done' | null; // Does the reaction return when restarting?
  alternativeCauses: string | null; // Are there competing diagnoses or drugs?
  severity: string; // Mild, Moderate, Severe, Life-Threatening
  seriousness: string; // Serious, Non-Serious
}

export interface CausalityResult {
  category: 'Certain' | 'Probable' | 'Possible' | 'Unlikely' | 'Conditional' | 'Unassessable';
  confidence: number; // 0-1 confidence score
  reasoning: string[];
}

export interface SignalAnalysis {
  drugName: string;
  reactionName: string;
  prr: number;
  ror: number;
  chiSquare: number;
  ciLower: number;
  ciUpper: number;
  caseCount: number;
  strength: string;
  trend: string;
}

export interface ExpertInterpretation {
  causality: CausalityResult;
  statsInterpretation: string;
  riskAssessment: string;
  capaRecommendations: string[];
  executiveSummary: string;
}

/**
 * Executes a deterministic clinical expert assessment of a drug-safety event or signal.
 */
export class IntelligenceEngine {
  /**
   * Evaluates adverse event details and suggests a WHO-UMC causality category.
   */
  public static assessCausality(inputs: WHOUMCInputs): CausalityResult {
    const {
      temporalRelationship,
      dechallengeResult,
      rechallengeResult,
      alternativeCauses,
      severity
    } = inputs;

    const reasoning: string[] = [];
    let category: CausalityResult['category'] = 'Unassessable';
    let confidence = 0.0;

    // Normalize alternative causes presence
    const alternativePresent = !!alternativeCauses && alternativeCauses.trim().length > 0 && !alternativeCauses.toLowerCase().includes('none');

    // 1. Unassessable: critical details are missing or contradictory
    if (temporalRelationship === null && dechallengeResult === null && rechallengeResult === null) {
      reasoning.push('Insufficient clinical parameters provided to run causality logic.');
      return { category: 'Unassessable', confidence: 0.1, reasoning };
    }

    // 2. Certain
    if (
      temporalRelationship === true &&
      dechallengeResult === 'positive' &&
      rechallengeResult === 'positive' &&
      !alternativePresent
    ) {
      category = 'Certain';
      confidence = 0.95;
      reasoning.push('✓ Clear, plausible temporal relationship confirmed.');
      reasoning.push('✓ Reaction resolved/improved on drug withdrawal (Positive Dechallenge).');
      reasoning.push('✓ Reaction recurred on drug re-introduction (Positive Rechallenge).');
      reasoning.push('✓ Alternative causes or confounding conditions have been excluded.');
    }
    // 3. Probable
    else if (
      temporalRelationship === true &&
      dechallengeResult === 'positive' &&
      !alternativePresent
    ) {
      category = 'Probable';
      confidence = 0.85;
      reasoning.push('✓ Plausible temporal relationship to drug administration.');
      reasoning.push('✓ Positive dechallenge response observed.');
      reasoning.push('✓ No competing alternative explanations found.');
      if (rechallengeResult === 'not_done') {
        reasoning.push('ℹ Rechallenge was not performed (standard clinical practice for safety).');
      } else if (rechallengeResult === 'negative') {
        reasoning.push('⚠ Negative rechallenge weakens certainty but does not rule out causal relation.');
        confidence = 0.75;
      }
    }
    // 4. Possible
    else if (
      temporalRelationship === true &&
      (dechallengeResult === 'not_done' || dechallengeResult === null || dechallengeResult === 'positive') &&
      (alternativePresent || dechallengeResult !== 'positive')
    ) {
      category = 'Possible';
      confidence = 0.65;
      reasoning.push('✓ Reasonable temporal window established.');
      if (alternativePresent) {
        reasoning.push('⚠ Confounding alternative etiologies or co-suspected drugs are present.');
      }
      if (dechallengeResult !== 'positive') {
        reasoning.push('⚠ Dechallenge was negative or not performed, making confirmation difficult.');
      }
    }
    // 5. Unlikely
    else if (
      temporalRelationship === false ||
      (dechallengeResult === 'negative' && alternativePresent)
    ) {
      category = 'Unlikely';
      confidence = 0.30;
      reasoning.push('✗ Temporal relationship is implausible or absent.');
      if (alternativePresent) {
        reasoning.push('✓ Clear alternative explanation or underlying pathology is more likely.');
      }
      if (dechallengeResult === 'negative') {
        reasoning.push('✗ Symptoms persisted despite drug cessation (Negative Dechallenge).');
      }
    }
    // 6. Conditional (More data needed)
    else {
      category = 'Conditional';
      confidence = 0.50;
      reasoning.push('ℹ Temporal relationship is possible but key diagnostic clinical data is outstanding.');
      reasoning.push('ℹ Further follow-up reports required to solidify classification.');
    }

    // Adjust confidence slightly based on severity
    if (severity === 'Life-Threatening' || severity === 'Severe') {
      reasoning.push(`• Reaction is flagged as severe (${severity}), prioritizing safety vigilance.`);
    }

    return { category, confidence, reasoning };
  }

  /**
   * Generates a natural language explanation of the disproportionality stats.
   */
  public static interpretStats(analysis: SignalMetricsAnalysis): string {
    const { prr, ror, chiSquare, ciLower, ciUpper, caseCount } = analysis;
    
    let explanation = `Statistical analysis is based on a case count of ${caseCount} report(s). `;

    if (caseCount < 3) {
      return explanation + 'The case volume is too low (< 3 reports) to establish a statistically validated safety signal, though active monitoring is recommended.';
    }

    const prrSignif = prr >= 2;
    // Use chi-square critical value for df=1 at p=0.05 (≈3.84)
    const chiSignif = chiSquare >= 3.84;
    const ciSignif = ciLower > 1;

    if (prrSignif && chiSignif && ciSignif) {
      explanation += `The Proportional Reporting Ratio (PRR) of ${prr.toFixed(2)} indicates that this reaction is reported at ${prr.toFixed(1)} times the rate for this drug compared to all other therapeutics in the system. `;
      explanation += `This is supported by a Reporting Odds Ratio (ROR) of ${ror.toFixed(2)}. `;
      explanation += `The Chi-Square value of ${chiSquare.toFixed(2)} meets the critical threshold for significance (≈3.84, p < 0.05). `;
      explanation += `Crucially, the 95% Confidence Interval lower bound (${ciLower.toFixed(2)}) is greater than 1.0, satisfying the Evans criteria for a **Strong Safety Signal**.`;
    } else if (prr > 1 && chiSquare > 0) {
      explanation += `There is a mild reporting disproportionality (PRR = ${prr.toFixed(2)}, ROR = ${ror.toFixed(2)}). `;
      explanation += `However, it does not fully meet all criteria for a strong signal. `;
      if (!chiSignif) {
        explanation += `The Chi-Square value (${chiSquare.toFixed(2)}) is below the threshold of 4.0, suggesting the association could be due to random variation. `;
      }
      if (!ciSignif) {
        explanation += `The 95% Confidence Interval lower limit is ${ciLower.toFixed(2)}, which is <= 1.0. This indicates insufficient statistical power to rule out neutrality. `;
      }
      explanation += 'This represents a **Weak/Moderate Alert** that warrants further surveillance.';
    } else {
      explanation += `With a PRR of ${prr.toFixed(2)} and ROR of ${ror.toFixed(2)}, there is no statistical evidence of disproportionality. No safety signal is flagged at this time.`;
    }

    return explanation;
  }

  /**
   * Formulates risk assessment and prioritization guidelines.
   */
  public static assessRisk(analysis: SignalMetricsAnalysis, severityDistribution: Record<string, number>): string {
    const { strength, trend, signalScore } = analysis;
    
    let priority = 'LOW';
    let monitoring = 'Routine periodic surveillance.';

    if (strength === 'Strong') {
      priority = trend === 'Increasing' ? 'CRITICAL' : 'HIGH';
      monitoring = trend === 'Increasing' 
        ? 'Urgent medical review. Active daily signal tracking.' 
        : 'Monthly safety review committee audits.';
    } else if (strength === 'Moderate') {
      priority = 'MEDIUM';
      monitoring = 'Quarterly screening and literature review.';
    }

    let severityFactor = 'predominantly mild/moderate cases.';
    const severeCount = (severityDistribution['Severe'] || 0) + (severityDistribution['Life-Threatening'] || 0);
    const totalWithSeverity = Object.values(severityDistribution).reduce((a, b) => a + b, 0);

    if (totalWithSeverity > 0 && (severeCount / totalWithSeverity) > 0.3) {
      severityFactor = `a high proportion of severe/life-threatening events (${Math.round((severeCount / totalWithSeverity) * 100)}%). This increases clinical risk regardless of statistical disproportionality.`;
      if (priority === 'MEDIUM') priority = 'HIGH';
    }

    return `Prioritization Level: **${priority}** (Composite Signal Score: ${signalScore.toFixed(2)}). ` +
           `Risk trend is categorized as **${trend}** with ${severityFactor} ` +
           `Action Plan: ${monitoring}`;
  }

  /**
   * Generates CAPA recommendations.
   */
  public static getCapaRecommendations(drugName: string, reactionName: string, strength: string): string[] {
    const recommendations: string[] = [];

    recommendations.push(`Conduct a detailed medical history review of all ${caseText(strength)} cases of ${reactionName} with ${drugName}.`);
    
    if (strength === 'Strong') {
      recommendations.push(`Propose updating the drug safety label (Package Insert / SmPC) to include "${reactionName}" as a known adverse drug reaction.`);
      recommendations.push('Draft a Dear Healthcare Professional (DHCP) letter to alert practitioners of this emerging risk.');
      recommendations.push(`Initiate an active surveillance protocol across hospital databases or electronic health records (EHR) to capture incident cases.`);
      recommendations.push('Evaluate if specific comorbidities (e.g. renal or hepatic impairment) or drug-drug interactions act as predisposing risk factors.');
    } else if (strength === 'Moderate') {
      recommendations.push(`Perform a literature search (e.g. PubMed, EMBASE) to check for similar published case reports of ${drugName} and ${reactionName}.`);
      recommendations.push('Establish an active monitoring register for this drug-event pair for the next 6 months.');
      recommendations.push('Review the clinical trial safety database of the product for early signals or transient events.');
    } else {
      recommendations.push('Continue routine pharmacovigilance screening during periodic safety update report (PSUR) cycles.');
    }

    return recommendations;
  }

  /**
   * Generates a formatted executive safety summary.
   */
  public static generateExecutiveSummary(
    drugName: string,
    reactionName: string,
    metrics: SignalMetricsAnalysis,
    causalityStats: Record<string, number>,
    riskAssessment: string
  ): string {
    const totalCausality = Object.values(causalityStats).reduce((a, b) => a + b, 0);
    const positiveCausalityCount = (causalityStats['Certain'] || 0) + (causalityStats['Probable'] || 0) + (causalityStats['Possible'] || 0);
    const percentPositive = totalCausality > 0 ? Math.round((positiveCausalityCount / totalCausality) * 100) : 0;

    return `EXECUTIVE SAFETY SUMMARY: EVALUATION OF ${drugName.toUpperCase()} AND ${reactionName.toUpperCase()}

1. SIGNAL DETECTION OVERVIEW
A statistical safety signal evaluation was conducted for the drug-event pair ${drugName} and ${reactionName}. A total of ${metrics.caseCount} spontaneous adverse reaction reports have been logged. The signal strength is classified as **${metrics.strength}** with a **${metrics.trend}** trend.

2. DISPROPORTIONALITY ANALYSIS
*   **PRR (Proportional Reporting Ratio):** ${metrics.prr.toFixed(2)} (indicating elevated reporting relative to background drugs).
*   **ROR (Reporting Odds Ratio):** ${metrics.ror.toFixed(2)}.
*   **Chi-Square Value:** ${metrics.chiSquare.toFixed(2)} (Threshold: >= 3.84 for significance).
*   **95% Confidence Interval:** [${metrics.ciLower.toFixed(2)} - ${metrics.ciUpper.toFixed(2)}] (Evans criteria: Lower Limit > 1.0).
*   **Information Component (IC):** ${metrics.informationComponent.toFixed(2)} (Bayesian disproportionality threshold > 0).

3. CLINICAL CAUSALITY ASSESSMENT (WHO-UMC CRITERIA)
Of the ${totalCausality} reports evaluated clinical-causality assessments, ${positiveCausalityCount} cases (${percentPositive}%) were flagged as having a plausible causal relationship (Certain, Probable, or Possible). This suggests a strong temporal and biological plausibility for the event.

4. RISK MANAGEMENT CONCLUSION & ACTION PLAN
${riskAssessment}

Review Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
Safety Review Division, Pharmacovigilance Department.`;
  }
}

// Utility types to avoid code duplication
interface SignalMetricsAnalysis {
  prr: number;
  ror: number;
  chiSquare: number;
  ciLower: number;
  ciUpper: number;
  informationComponent: number;
  signalScore: number;
  caseCount: number;
  strength: string;
  trend: string;
}

function caseText(strength: string): string {
  return strength === 'Strong' ? 'confirmed' : 'suspected';
}
