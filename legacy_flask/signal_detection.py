"""
Signal Detection Module - Proportional Reporting Ratio (PRR) Analysis
Implements pharmacovigilance signal detection using PRR methodology
"""

from collections import Counter, defaultdict


def calculate_prr(drug_effect_count, other_drugs_effect_count, drug_other_effects_count, other_drugs_other_effects_count):
    """
    Calculate Proportional Reporting Ratio (PRR)
    
    PRR = (a / (a+c)) / (b / (b+d))
    
    where:
    a = Count of (Drug X, Side Effect Y)
    b = Count of (All Other Drugs, Side Effect Y)
    c = Count of (Drug X, All Other Side Effects)
    d = Count of (All Other Drugs, All Other Side Effects)
    
    Args:
        drug_effect_count: a - Reports for this drug-effect pair
        other_drugs_effect_count: b - Reports of same effect from other drugs
        drug_other_effects_count: c - Other effects for this drug
        other_drugs_other_effects_count: d - Other effects from other drugs
    
    Returns:
        float: PRR value
    """
    if drug_effect_count == 0:
        return 0.0
    
    try:
        numerator = drug_effect_count / (drug_effect_count + drug_other_effects_count) if (drug_effect_count + drug_other_effects_count) > 0 else 1.0
        
        denominator = other_drugs_effect_count / (other_drugs_effect_count + other_drugs_other_effects_count) if (other_drugs_effect_count + other_drugs_other_effects_count) > 0 else 1.0
        
        # If no other drugs reported this effect, this is a strong signal
        if other_drugs_effect_count == 0 and other_drugs_other_effects_count == 0:
            # Unique effect for this drug - very strong signal
            return 100.0
        
        if denominator == 0:
            return 100.0  # Edge case: strong signal
            
        prr = numerator / denominator
        return max(prr, 0.1)  # Return at least 0.1 to avoid zero results
    except:
        return 0.0


def classify_signal_strength(prr_value, case_count):
    """
    Classify signal strength based on PRR value and case count
    
    Args:
        prr_value: Calculated PRR value
        case_count: Number of cases for this drug-effect pair
    
    Returns:
        tuple: (strength_category, confidence_score)
    """
    # Minimum case count threshold
    if case_count < 2:
        return 'Weak', 0.1
    
    if prr_value >= 100:
        confidence = min(1.0, case_count / 50)  # Higher count = higher confidence
        return 'Strong', confidence
    elif prr_value >= 10:
        confidence = min(0.8, case_count / 100)
        return 'Moderate', confidence
    elif prr_value >= 2:
        confidence = min(0.6, case_count / 150)
        return 'Weak', confidence
    else:
        return 'No Signal', 0.0


def detect_signals(drug_effect_pairs, reports):
    """
    Detect safety signals using PRR analysis
    
    Args:
        drug_effect_pairs: Dict of (drug, effect) tuples with counts
        reports: List of ADRReport objects
    
    Returns:
        list: List of detected signals with PRR metrics
    """
    signals = []
    
    if not reports or len(reports) < 2:
        return signals
    
    # Build comprehensive data structures
    all_drugs = defaultdict(lambda: defaultdict(int))  # drug -> effect -> count
    all_effects = defaultdict(int)  # effect -> total count
    total_reports = len(reports)
    
    for report in reports:
        drug = report.suspected_drug.lower()
        effect = report.reaction.lower()
        all_drugs[drug][effect] += 1
        all_effects[effect] += 1
    
    # Calculate PRR for each drug-effect pair
    for (drug, effect), case_count in drug_effect_pairs.items():
        if case_count < 2:  # Minimum threshold (lowered to include small datasets)
            continue
        
        # Calculate contingency table values
        a = case_count  # Drug-Effect count
        b = all_effects[effect] - a  # Other drugs with this effect
        c = sum(all_drugs[drug].values()) - a  # Other effects for this drug
        d = total_reports - a - b - c  # Other drugs, other effects
        
        # Calculate PRR
        prr = calculate_prr(a, b, c, d)
        
        # Classify signal
        strength, confidence = classify_signal_strength(prr, case_count)
        
        if strength != 'No Signal':
            signal = {
                'drug': drug.title(),
                'effect': effect.title(),
                'prr': round(prr, 2),
                'case_count': a,
                'background_count': b,
                'strength': strength,
                'confidence': round(confidence, 2),
                'total_drug_reports': sum(all_drugs[drug].values())
            }
            signals.append(signal)
    
    # Sort by PRR value (descending)
    signals.sort(key=lambda x: x['prr'], reverse=True)
    
    return signals


def get_signal_statistics(signals):
    """
    Generate summary statistics from detected signals
    
    Args:
        signals: List of detected signals
    
    Returns:
        dict: Statistics including counts by strength category
    """
    if not signals:
        return {
            'total': 0,
            'strong': 0,
            'moderate': 0,
            'weak': 0,
            'avg_prr': 0.0,
            'max_prr': 0.0
        }
    
    strong = len([s for s in signals if s['strength'] == 'Strong'])
    moderate = len([s for s in signals if s['strength'] == 'Moderate'])
    weak = len([s for s in signals if s['strength'] == 'Weak'])
    
    prr_values = [s['prr'] for s in signals]
    
    return {
        'total': len(signals),
        'strong': strong,
        'moderate': moderate,
        'weak': weak,
        'avg_prr': round(sum(prr_values) / len(prr_values), 2),
        'max_prr': round(max(prr_values), 2)
    }


def get_top_signals_by_drug(signals, drug_name):
    """
    Get top signals for a specific drug
    
    Args:
        signals: List of all detected signals
        drug_name: Name of the drug to filter
    
    Returns:
        list: Filtered and sorted signals for the drug
    """
    drug_signals = [s for s in signals if s['drug'].lower() == drug_name.lower()]
    return sorted(drug_signals, key=lambda x: x['prr'], reverse=True)


def get_top_signals_by_effect(signals, effect_name):
    """
    Get top signals for a specific side effect
    
    Args:
        signals: List of all detected signals
        effect_name: Name of the side effect to filter
    
    Returns:
        list: Filtered and sorted signals for the effect
    """
    effect_signals = [s for s in signals if s['effect'].lower() == effect_name.lower()]
    return sorted(effect_signals, key=lambda x: x['prr'], reverse=True)
