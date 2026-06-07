"""
WHO-UMC Causality Assessment Engine

Implements the WHO-UMC causality categories:
- Certain: Clear temporal relationship, dechallenge and rechallenge positive
- Probable: Clear temporal relationship, dechallenge positive or likely ADR
- Possible: Reasonable temporal relationship, alternative causes less likely
- Unlikely: Temporal relationship unclear, alternative causes present
- Conditional: More information needed for assessment
- Unassessable: Insufficient information for causality assessment

Reference: WHO-UMC causality assessment system
"""

CAUSALITY_CATEGORIES = ['Certain', 'Probable', 'Possible', 'Unlikely', 'Conditional', 'Unassessable']

CAUSALITY_EXPLANATIONS = {
    'Certain': 'Clear temporal relationship, confirmed by dechallenge and/or rechallenge',
    'Probable': 'Clear temporal relationship, confirmed by dechallenge or likely ADR',
    'Possible': 'Reasonable temporal relationship, alternative causes not ruled out',
    'Unlikely': 'Weak temporal relationship, alternative causes more likely',
    'Conditional': 'Temporal relationship unclear, requires additional information',
    'Unassessable': 'Insufficient information to assess causality'
}


class CausalityAssessment:
    """
    Rule-based causality assessment engine.
    
    Factors considered:
    - Temporal relationship (onset relative to drug administration)
    - Dechallenge result (reaction improvement after drug withdrawal)
    - Rechallenge result (reaction recurrence after drug re-administration)
    - Alternative causes (presence of competing etiology)
    - Known ADR (drug is known to cause this reaction)
    """
    
    def __init__(self):
        self.assessment_rules = self._define_rules()
    
    def _define_rules(self):
        """Define causality assessment decision rules"""
        return [
            {
                'name': 'Certain',
                'conditions': [
                    ('temporal_relationship', True),  # Clear temporal link
                    ('dechallenge_positive', True),   # Improved after withdrawal
                    ('rechallenge_positive', True)     # Recurred after re-administration
                ],
                'confidence': 0.95
            },
            {
                'name': 'Certain',
                'conditions': [
                    ('temporal_relationship', True),
                    ('dechallenge_positive', True),
                    ('known_adr', True)
                ],
                'confidence': 0.90
            },
            {
                'name': 'Probable',
                'conditions': [
                    ('temporal_relationship', True),
                    ('dechallenge_positive', True),
                    ('alternative_causes_present', False)
                ],
                'confidence': 0.85
            },
            {
                'name': 'Probable',
                'conditions': [
                    ('temporal_relationship', True),
                    ('known_adr', True),
                    ('alternative_causes_present', False)
                ],
                'confidence': 0.80
            },
            {
                'name': 'Possible',
                'conditions': [
                    ('temporal_relationship', True),
                    ('alternative_causes_present', False)
                ],
                'confidence': 0.70
            },
            {
                'name': 'Possible',
                'conditions': [
                    ('temporal_relationship', True),
                    ('known_adr', True)
                ],
                'confidence': 0.75
            },
            {
                'name': 'Unlikely',
                'conditions': [
                    ('temporal_relationship', False),
                    ('alternative_causes_present', True)
                ],
                'confidence': 0.40
            },
            {
                'name': 'Unlikely',
                'conditions': [
                    ('dechallenge_positive', False),
                    ('alternative_causes_present', True)
                ],
                'confidence': 0.35
            },
            {
                'name': 'Unassessable',
                'conditions': [
                    ('temporal_relationship', None),
                    ('dechallenge_result', None)
                ],
                'confidence': 0.0
            }
        ]
    
    def assess(self, assessment_data):
        """
        Assess causality based on clinical factors.
        
        Args:
            assessment_data (dict): Contains:
                - temporal_relationship (bool): Clear temporal link to drug dose/timing
                - dechallenge_result (str): 'positive', 'negative', 'not_done', None
                - rechallenge_result (str): 'positive', 'negative', 'not_done', None
                - alternative_causes (list): List of alternative etiologies
                - known_adr (bool): Known ADR for this drug
                - reaction_severity (str): 'Mild', 'Moderate', 'Severe'
                
        Returns:
            dict: Assessment result with:
                - causality_category (str)
                - confidence_score (float: 0-1)
                - reasoning (str)
                - evidence_summary (dict)
        """
        # Normalize inputs
        factors = self._normalize_factors(assessment_data)
        
        # Apply decision rules
        best_match = self._apply_rules(factors)
        
        # Generate reasoning
        reasoning = self._generate_reasoning(factors, best_match)
        
        return {
            'causality_category': best_match['category'],
            'confidence_score': best_match['confidence'],
            'reasoning': reasoning,
            'explanation': CAUSALITY_EXPLANATIONS.get(best_match['category'], ''),
            'evidence_summary': self._create_evidence_summary(factors)
        }
    
    def _normalize_factors(self, data):
        """Normalize and validate assessment data"""
        return {
            'temporal_relationship': data.get('temporal_relationship', None),
            'dechallenge_positive': data.get('dechallenge_result') == 'positive',
            'dechallenge_negative': data.get('dechallenge_result') == 'negative',
            'dechallenge_result': data.get('dechallenge_result'),
            'rechallenge_positive': data.get('rechallenge_result') == 'positive',
            'rechallenge_negative': data.get('rechallenge_result') == 'negative',
            'rechallenge_result': data.get('rechallenge_result'),
            'alternative_causes_present': len(data.get('alternative_causes', [])) > 0,
            'alternative_causes': data.get('alternative_causes', []),
            'known_adr': data.get('known_adr', False),
            'reaction_severity': data.get('reaction_severity', 'Moderate'),
            'drug_name': data.get('drug_name', ''),
            'reaction': data.get('reaction', '')
        }
    
    def _apply_rules(self, factors):
        """Apply decision rules to determine causality"""
        best_match = {
            'category': 'Unassessable',
            'confidence': 0.0,
            'rule_index': -1
        }
        
        # Try exact matches first
        for idx, rule in enumerate(self.assessment_rules):
            if self._matches_rule(factors, rule['conditions']):
                if rule['confidence'] > best_match['confidence']:
                    best_match = {
                        'category': rule['name'],
                        'confidence': rule['confidence'],
                        'rule_index': idx
                    }
        
        # If no exact match, use default logic
        if best_match['rule_index'] == -1:
            best_match = self._apply_default_logic(factors)
        
        return best_match
    
    def _matches_rule(self, factors, conditions):
        """Check if all conditions in a rule are met"""
        for factor_name, expected_value in conditions:
            if factor_name not in factors:
                return False
            if expected_value is not None and factors[factor_name] != expected_value:
                return False
        return True
    
    def _apply_default_logic(self, factors):
        """Apply default logic when no exact rule matches"""
        # Assess severity
        if factors['temporal_relationship'] is True:
            if factors['dechallenge_positive']:
                return {'category': 'Probable', 'confidence': 0.75}
            elif factors['known_adr']:
                return {'category': 'Possible', 'confidence': 0.70}
            else:
                return {'category': 'Possible', 'confidence': 0.60}
        
        if factors['alternative_causes_present']:
            return {'category': 'Unlikely', 'confidence': 0.40}
        
        return {'category': 'Conditional', 'confidence': 0.50}
    
    def _generate_reasoning(self, factors, best_match):
        """Generate human-readable reasoning for assessment"""
        reasoning_parts = []
        
        if factors['temporal_relationship'] is True:
            reasoning_parts.append('✓ Clear temporal relationship between drug use and reaction onset')
        elif factors['temporal_relationship'] is False:
            reasoning_parts.append('✗ Weak or unclear temporal relationship')
        
        if factors['dechallenge_positive']:
            reasoning_parts.append('✓ Reaction improved after drug withdrawal (positive dechallenge)')
        elif factors['dechallenge_negative']:
            reasoning_parts.append('✗ Reaction did not improve after withdrawal (negative dechallenge)')
        
        if factors['rechallenge_positive']:
            reasoning_parts.append('✓ Reaction recurred after drug re-administration (positive rechallenge)')
        elif factors['rechallenge_negative']:
            reasoning_parts.append('✗ Reaction did not recur after re-administration (negative rechallenge)')
        
        if factors['known_adr']:
            reasoning_parts.append('✓ This reaction is a known ADR for this drug')
        
        if factors['alternative_causes_present']:
            causes_list = ', '.join(factors['alternative_causes'][:3])
            reasoning_parts.append(f'⚠ Alternative causes identified: {causes_list}')
        
        severity_note = f"• Reaction severity: {factors['reaction_severity']}"
        reasoning_parts.append(severity_note)
        
        return '\n'.join(reasoning_parts)
    
    def _create_evidence_summary(self, factors):
        """Create a summary of evidence for this assessment"""
        return {
            'temporal_relationship': factors['temporal_relationship'],
            'dechallenge_result': factors['dechallenge_result'],
            'rechallenge_result': factors['rechallenge_result'],
            'alternative_causes_count': len(factors['alternative_causes']),
            'alternative_causes': factors['alternative_causes'],
            'known_adr': factors['known_adr'],
            'reaction_severity': factors['reaction_severity']
        }


def get_causality_suggestions(drug_name, reaction):
    """
    Get suggested causality questions based on drug and reaction.
    
    Args:
        drug_name (str): Name of suspected drug
        reaction (str): Adverse reaction
        
    Returns:
        dict: Pre-filled assessment template
    """
    return {
        'drug_name': drug_name,
        'reaction': reaction,
        'temporal_relationship': None,
        'dechallenge_result': None,
        'rechallenge_result': None,
        'alternative_causes': [],
        'known_adr': None,
        'reaction_severity': 'Moderate',
        'suggested_questions': [
            'When did the patient start taking this drug relative to symptom onset?',
            'Did symptoms improve after stopping the drug?',
            'Were symptoms re-tested when the drug was re-administered?',
            'Are there alternative explanations for this reaction?',
            'Is this reaction documented as a known ADR for this drug?'
        ]
    }


# Initialize assessment engine
causality_engine = CausalityAssessment()
