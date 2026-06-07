import { describe, it, expect } from 'vitest';
import { calculateMetrics } from './statsEngine';

describe('Stats Engine Calculations', () => {
  it('correctly calculates metrics for a strong safety signal', () => {
    // a = 120 (drug + event)
    // drugReports = 150 (total reports for drug X, so b = 30)
    // eventReports = 200 (total reports for event Y, so c = 80)
    // N = 5000 (total reports, so d = 5000 - 120 - 30 - 80 = 4770)
    const metrics = calculateMetrics(120, 150, 200, 5000);

    // PRR = (a / (a+b)) / (c / (c+d))
    // Numerator = 120 / 150 = 0.8
    // Denominator = 80 / 4850 = 0.0164948
    // PRR = 0.8 / 0.0164948 = 48.5
    expect(metrics.prr).toBeCloseTo(48.5, 1);
    
    // ROR = (a * d) / (b * c)
    // ROR = (120 * 4770) / (30 * 80) = 572400 / 2400 = 238.5
    expect(metrics.ror).toBeCloseTo(238.5, 1);

    // Chi-Square with Yates correction should be very high
    expect(metrics.chiSquare).toBeGreaterThan(100);

    // 95% CI lower limit should be well above 1.0
    expect(metrics.ciLower).toBeGreaterThan(10);
    
    // Strength should be Strong
    expect(metrics.strength).toBe('Strong');
  });

  it('correctly classifies a non-signal pair', () => {
    // low case counts / proportion
    const metrics = calculateMetrics(1, 150, 200, 5000);
    expect(metrics.prr).toBeLessThan(1.0);
    expect(metrics.strength).toBe('No Signal');
  });

  it('handles division by zero and edge cases gracefully', () => {
    const metrics = calculateMetrics(0, 0, 0, 5000);
    expect(metrics.prr).toBe(0);
    expect(metrics.ror).toBe(0);
    expect(metrics.chiSquare).toBe(0);
    expect(metrics.ciLower).toBe(0);
    expect(metrics.strength).toBe('No Signal');
  });
});
