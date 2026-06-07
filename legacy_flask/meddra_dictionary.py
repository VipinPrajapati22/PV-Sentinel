"""
MedDRA Dictionary - World Health Organization Medical Dictionary for Regulatory Activities

This module contains a curated MedDRA terminology mapping for adverse drug reactions.
Structure: LLT (Lowest Level Term) → PT (Preferred Term) → SOC (System Organ Class)

In production, this should be imported from WHO MedDRA database files.
"""

# Comprehensive MedDRA Terminology Mapping
# Format: 'free_text_input' -> {'pt': 'Preferred Term', 'soc': 'System Organ Class', 'llt': 'Lowest Level Term'}
MEDDRA_MAPPINGS = {
    # Gastrointestinal disorders
    'stomach pain': {'pt': 'Abdominal pain', 'soc': 'Gastrointestinal disorders', 'llt': 'Abdominal pain'},
    'abdominal pain': {'pt': 'Abdominal pain', 'soc': 'Gastrointestinal disorders', 'llt': 'Abdominal pain'},
    'nausea': {'pt': 'Nausea', 'soc': 'Gastrointestinal disorders', 'llt': 'Nausea'},
    'vomiting': {'pt': 'Vomiting', 'soc': 'Gastrointestinal disorders', 'llt': 'Vomiting'},
    'diarrhea': {'pt': 'Diarrhoea', 'soc': 'Gastrointestinal disorders', 'llt': 'Diarrhoea'},
    'constipation': {'pt': 'Constipation', 'soc': 'Gastrointestinal disorders', 'llt': 'Constipation'},
    'heartburn': {'pt': 'Dyspepsia', 'soc': 'Gastrointestinal disorders', 'llt': 'Dyspepsia'},
    'indigestion': {'pt': 'Dyspepsia', 'soc': 'Gastrointestinal disorders', 'llt': 'Dyspepsia'},
    'acid reflux': {'pt': 'Gastro-oesophageal reflux disease', 'soc': 'Gastrointestinal disorders', 'llt': 'Gastro-oesophageal reflux disease'},
    'gerd': {'pt': 'Gastro-oesophageal reflux disease', 'soc': 'Gastrointestinal disorders', 'llt': 'Gastro-oesophageal reflux disease'},
    
    # Cardiovascular disorders
    'heart attack': {'pt': 'Myocardial infarction', 'soc': 'Cardiac disorders', 'llt': 'Myocardial infarction'},
    'myocardial infarction': {'pt': 'Myocardial infarction', 'soc': 'Cardiac disorders', 'llt': 'Myocardial infarction'},
    'chest pain': {'pt': 'Chest pain', 'soc': 'Cardiac disorders', 'llt': 'Chest pain'},
    'angina': {'pt': 'Angina pectoris', 'soc': 'Cardiac disorders', 'llt': 'Angina pectoris'},
    'high blood pressure': {'pt': 'Hypertension', 'soc': 'Vascular disorders', 'llt': 'Hypertension'},
    'hypertension': {'pt': 'Hypertension', 'soc': 'Vascular disorders', 'llt': 'Hypertension'},
    'low blood pressure': {'pt': 'Hypotension', 'soc': 'Vascular disorders', 'llt': 'Hypotension'},
    'hypotension': {'pt': 'Hypotension', 'soc': 'Vascular disorders', 'llt': 'Hypotension'},
    'arrhythmia': {'pt': 'Arrhythmia', 'soc': 'Cardiac disorders', 'llt': 'Arrhythmia'},
    'palpitations': {'pt': 'Palpitations', 'soc': 'Cardiac disorders', 'llt': 'Palpitations'},
    'heart palpitations': {'pt': 'Palpitations', 'soc': 'Cardiac disorders', 'llt': 'Palpitations'},
    
    # Dermatological disorders
    'skin rash': {'pt': 'Rash', 'soc': 'Skin and subcutaneous tissue disorders', 'llt': 'Rash'},
    'rash': {'pt': 'Rash', 'soc': 'Skin and subcutaneous tissue disorders', 'llt': 'Rash'},
    'hives': {'pt': 'Urticaria', 'soc': 'Skin and subcutaneous tissue disorders', 'llt': 'Urticaria'},
    'urticaria': {'pt': 'Urticaria', 'soc': 'Skin and subcutaneous tissue disorders', 'llt': 'Urticaria'},
    'itching': {'pt': 'Pruritus', 'soc': 'Skin and subcutaneous tissue disorders', 'llt': 'Pruritus'},
    'pruritus': {'pt': 'Pruritus', 'soc': 'Skin and subcutaneous tissue disorders', 'llt': 'Pruritus'},
    'acne': {'pt': 'Acne', 'soc': 'Skin and subcutaneous tissue disorders', 'llt': 'Acne'},
    'eczema': {'pt': 'Dermatitis', 'soc': 'Skin and subcutaneous tissue disorders', 'llt': 'Dermatitis'},
    'dermatitis': {'pt': 'Dermatitis', 'soc': 'Skin and subcutaneous tissue disorders', 'llt': 'Dermatitis'},
    'dry skin': {'pt': 'Skin xerosis', 'soc': 'Skin and subcutaneous tissue disorders', 'llt': 'Skin xerosis'},
    
    # Nervous system disorders
    'headache': {'pt': 'Headache', 'soc': 'Nervous system disorders', 'llt': 'Headache'},
    'dizziness': {'pt': 'Dizziness', 'soc': 'Nervous system disorders', 'llt': 'Dizziness'},
    'vertigo': {'pt': 'Vertigo', 'soc': 'Nervous system disorders', 'llt': 'Vertigo'},
    'tremor': {'pt': 'Tremor', 'soc': 'Nervous system disorders', 'llt': 'Tremor'},
    'numbness': {'pt': 'Paraesthesia', 'soc': 'Nervous system disorders', 'llt': 'Paraesthesia'},
    'paraesthesia': {'pt': 'Paraesthesia', 'soc': 'Nervous system disorders', 'llt': 'Paraesthesia'},
    'seizure': {'pt': 'Convulsion', 'soc': 'Nervous system disorders', 'llt': 'Convulsion'},
    'convulsion': {'pt': 'Convulsion', 'soc': 'Nervous system disorders', 'llt': 'Convulsion'},
    'migraine': {'pt': 'Migraine', 'soc': 'Nervous system disorders', 'llt': 'Migraine'},
    'insomnia': {'pt': 'Insomnia', 'soc': 'Psychiatric disorders', 'llt': 'Insomnia'},
    'drowsiness': {'pt': 'Somnolence', 'soc': 'Nervous system disorders', 'llt': 'Somnolence'},
    'fatigue': {'pt': 'Fatigue', 'soc': 'General disorders', 'llt': 'Fatigue'},
    
    # Respiratory disorders
    'cough': {'pt': 'Cough', 'soc': 'Respiratory, thoracic and mediastinal disorders', 'llt': 'Cough'},
    'shortness of breath': {'pt': 'Dyspnoea', 'soc': 'Respiratory, thoracic and mediastinal disorders', 'llt': 'Dyspnoea'},
    'dyspnoea': {'pt': 'Dyspnoea', 'soc': 'Respiratory, thoracic and mediastinal disorders', 'llt': 'Dyspnoea'},
    'asthma': {'pt': 'Asthma', 'soc': 'Respiratory, thoracic and mediastinal disorders', 'llt': 'Asthma'},
    'bronchitis': {'pt': 'Bronchitis', 'soc': 'Respiratory, thoracic and mediastinal disorders', 'llt': 'Bronchitis'},
    'pneumonia': {'pt': 'Pneumonia', 'soc': 'Respiratory, thoracic and mediastinal disorders', 'llt': 'Pneumonia'},
    'wheezing': {'pt': 'Wheezing', 'soc': 'Respiratory, thoracic and mediastinal disorders', 'llt': 'Wheezing'},
    'throat pain': {'pt': 'Pharyngitis', 'soc': 'Respiratory, thoracic and mediastinal disorders', 'llt': 'Pharyngitis'},
    
    # Hepatic disorders
    'liver damage': {'pt': 'Hepatic injury', 'soc': 'Hepatobiliary disorders', 'llt': 'Hepatic injury'},
    'hepatic injury': {'pt': 'Hepatic injury', 'soc': 'Hepatobiliary disorders', 'llt': 'Hepatic injury'},
    'jaundice': {'pt': 'Jaundice', 'soc': 'Hepatobiliary disorders', 'llt': 'Jaundice'},
    
    # Renal disorders
    'kidney damage': {'pt': 'Renal impairment', 'soc': 'Renal and urinary disorders', 'llt': 'Renal impairment'},
    'renal impairment': {'pt': 'Renal impairment', 'soc': 'Renal and urinary disorders', 'llt': 'Renal impairment'},
    'urinary tract infection': {'pt': 'Urinary tract infection', 'soc': 'Renal and urinary disorders', 'llt': 'Urinary tract infection'},
    'uti': {'pt': 'Urinary tract infection', 'soc': 'Renal and urinary disorders', 'llt': 'Urinary tract infection'},
    
    # Metabolic and nutritional disorders
    'hypoglycemia': {'pt': 'Hypoglycaemia', 'soc': 'Endocrine disorders', 'llt': 'Hypoglycaemia'},
    'low blood sugar': {'pt': 'Hypoglycaemia', 'soc': 'Endocrine disorders', 'llt': 'Hypoglycaemia'},
    'hyperglycemia': {'pt': 'Hyperglycaemia', 'soc': 'Endocrine disorders', 'llt': 'Hyperglycaemia'},
    'high blood sugar': {'pt': 'Hyperglycaemia', 'soc': 'Endocrine disorders', 'llt': 'Hyperglycaemia'},
    
    # Infections and infestations
    'infection': {'pt': 'Infection', 'soc': 'Infections and infestations', 'llt': 'Infection'},
    'fever': {'pt': 'Pyrexia', 'soc': 'General disorders', 'llt': 'Pyrexia'},
    'chills': {'pt': 'Chills', 'soc': 'General disorders', 'llt': 'Chills'},
    
    # Immune system disorders
    'allergic reaction': {'pt': 'Hypersensitivity', 'soc': 'Immune system disorders', 'llt': 'Hypersensitivity'},
    'anaphylaxis': {'pt': 'Anaphylactic reaction', 'soc': 'Immune system disorders', 'llt': 'Anaphylactic reaction'},
    'anaphylactic shock': {'pt': 'Anaphylactic reaction', 'soc': 'Immune system disorders', 'llt': 'Anaphylactic reaction'},
    
    # Musculoskeletal disorders
    'joint pain': {'pt': 'Arthralgia', 'soc': 'Musculoskeletal and connective tissue disorders', 'llt': 'Arthralgia'},
    'arthralgia': {'pt': 'Arthralgia', 'soc': 'Musculoskeletal and connective tissue disorders', 'llt': 'Arthralgia'},
    'muscle pain': {'pt': 'Myalgia', 'soc': 'Musculoskeletal and connective tissue disorders', 'llt': 'Myalgia'},
    'myalgia': {'pt': 'Myalgia', 'soc': 'Musculoskeletal and connective tissue disorders', 'llt': 'Myalgia'},
    'back pain': {'pt': 'Back pain', 'soc': 'Musculoskeletal and connective tissue disorders', 'llt': 'Back pain'},
}

# SOC (System Organ Class) categories - Top-level classification
SOC_CATEGORIES = [
    'Cardiac disorders',
    'Vascular disorders',
    'Respiratory, thoracic and mediastinal disorders',
    'Gastrointestinal disorders',
    'Hepatobiliary disorders',
    'Renal and urinary disorders',
    'Endocrine disorders',
    'Metabolic and nutritional disorders',
    'Psychiatric disorders',
    'Nervous system disorders',
    'Eye disorders',
    'Ear and labyrinth disorders',
    'Skin and subcutaneous tissue disorders',
    'Musculoskeletal and connective tissue disorders',
    'Immune system disorders',
    'Infections and infestations',
    'General disorders',
    'Blood and lymphatic system disorders',
]

def search_meddra_term(text):
    """
    Search for MedDRA mapping by free-text input.
    Returns best match with confidence score.
    
    Args:
        text (str): Free-text adverse reaction
        
    Returns:
        dict: {'found': bool, 'pt': str, 'soc': str, 'llt': str, 'confidence': float}
    """
    if not text:
        return {'found': False, 'pt': None, 'soc': None, 'llt': None, 'confidence': 0.0}
    
    text_lower = text.lower().strip()
    
    # Exact match
    if text_lower in MEDDRA_MAPPINGS:
        mapping = MEDDRA_MAPPINGS[text_lower]
        return {
            'found': True,
            'pt': mapping['pt'],
            'soc': mapping['soc'],
            'llt': mapping['llt'],
            'confidence': 1.0,
            'original': text_lower
        }
    
    # Substring match
    for key, mapping in MEDDRA_MAPPINGS.items():
        if key in text_lower or text_lower in key:
            return {
                'found': True,
                'pt': mapping['pt'],
                'soc': mapping['soc'],
                'llt': mapping['llt'],
                'confidence': 0.8,
                'original': text_lower,
                'suggested_key': key
            }
    
    # No match found
    return {'found': False, 'pt': None, 'soc': None, 'llt': None, 'confidence': 0.0, 'original': text_lower}


def get_autocomplete_suggestions(text, limit=5):
    """
    Get autocomplete suggestions based on partial text.
    
    Args:
        text (str): Partial text input
        limit (int): Maximum suggestions to return
        
    Returns:
        list: List of suggestion dicts with pt, soc, confidence
    """
    if not text:
        return []
    
    text_lower = text.lower().strip()
    suggestions = []
    
    # Find matching terms
    for key, mapping in MEDDRA_MAPPINGS.items():
        if text_lower in key or text_lower in mapping['pt'].lower():
            confidence = 1.0 if text_lower == key else 0.8 if text_lower in key else 0.6
            suggestions.append({
                'term': key,
                'pt': mapping['pt'],
                'soc': mapping['soc'],
                'llt': mapping['llt'],
                'confidence': confidence
            })
    
    # Sort by confidence and return top matches
    suggestions.sort(key=lambda x: (-x['confidence'], x['pt']))
    return suggestions[:limit]


def standardize_reaction(text):
    """
    Standardize free-text reaction to MedDRA Preferred Term.
    If exact match not found, uses best available match or returns original.
    
    Args:
        text (str): Free-text adverse reaction
        
    Returns:
        str: Standardized MedDRA Preferred Term or original text
    """
    result = search_meddra_term(text)
    return result['pt'] if result['found'] else text


def get_soc_by_pt(pt):
    """Get SOC category for a given Preferred Term"""
    for mapping in MEDDRA_MAPPINGS.values():
        if mapping['pt'] == pt:
            return mapping['soc']
    return None


def get_all_pt_terms():
    """Get all available Preferred Terms"""
    return sorted(set(m['pt'] for m in MEDDRA_MAPPINGS.values()))


def get_all_soc_categories():
    """Get all SOC categories"""
    return sorted(SOC_CATEGORIES)
