from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class ADRReport(db.Model):
    """Adverse Drug Reaction Report with MedDRA coding and WHO-UMC causality assessment"""
    id = db.Column(db.Integer, primary_key=True)

    # Patient Information
    patient_age = db.Column(db.String(20))
    patient_gender = db.Column(db.String(20))

    # Drug Information
    suspected_drug = db.Column(db.String(100), index=True)
    
    # Reaction Information - Free Text
    reaction = db.Column(db.String(300))
    
    # MedDRA Standardization
    meddra_pt = db.Column(db.String(300))  # Preferred Term (standardized)
    meddra_soc = db.Column(db.String(300))  # System Organ Class
    meddra_llt = db.Column(db.String(300))  # Lowest Level Term
    meddra_confidence = db.Column(db.Float, default=0.0)  # 0-1 confidence in mapping
    
    # Clinical Assessment - Severity
    severity = db.Column(db.String(50))  # Mild, Moderate, Severe, Life-Threatening
    
    # Causality Assessment - Basic
    causality = db.Column(db.String(50))  # Legacy field for backward compatibility
    
    # Causality Assessment - WHO-UMC Advanced
    causality_assessment = db.Column(db.String(50))  # Certain, Probable, Possible, Unlikely, Conditional, Unassessable
    causality_confidence = db.Column(db.Float, default=0.0)  # 0-1 confidence score
    causality_system_generated = db.Column(db.String(50))  # Original system-generated assessment
    causality_modified_by = db.Column(db.String(100))  # If modified by reviewer
    causality_modified_date = db.Column(db.DateTime)
    
    # Causality Assessment - Input Factors
    temporal_relationship = db.Column(db.Boolean)  # Clear temporal link?
    dechallenge_result = db.Column(db.String(50))  # positive, negative, not_done
    rechallenge_result = db.Column(db.String(50))  # positive, negative, not_done
    alternative_causes = db.Column(db.String(500))  # Comma-separated list
    
    # Additional Fields
    seriousness = db.Column(db.String(50))  # Serious or Non-Serious
    outcome = db.Column(db.String(100))
    follow_up = db.Column(db.String(100))
    reporter_name = db.Column(db.String(100))
    
    notes = db.Column(db.String(500))
    report_date = db.Column(db.DateTime, default=datetime.utcnow)
    created_date = db.Column(db.DateTime, default=datetime.utcnow)
    updated_date = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class DetectedSignal(db.Model):
    """Drug-Effect Signal Detected by PRR Analysis"""
    id = db.Column(db.Integer, primary_key=True)
    
    drug_name = db.Column(db.String(100), index=True)
    side_effect = db.Column(db.String(300), index=True)
    
    # MedDRA Information
    meddra_pt = db.Column(db.String(300))  # Standardized Preferred Term
    meddra_soc = db.Column(db.String(300))  # System Organ Class
    
    # PRR Calculation Components
    prr_value = db.Column(db.Float)  # Proportional Reporting Ratio
    case_count = db.Column(db.Integer)  # a: Drug-Effect count
    background_count = db.Column(db.Integer)  # b: Other drugs with this effect
    
    # Signal Classification
    signal_strength = db.Column(db.String(20))  # 'Strong', 'Moderate', 'Weak'
    confidence_score = db.Column(db.Float)  # 0-1 score
    
    # Metadata
    detected_date = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    is_active = db.Column(db.Boolean, default=True)
    notes = db.Column(db.String(500))
    
    def __repr__(self):
        return f'<Signal {self.drug_name} - {self.side_effect} (PRR: {self.prr_value:.2f})>'


class MedDRATerm(db.Model):
    """MedDRA terminology database for fast lookups"""
    id = db.Column(db.Integer, primary_key=True)
    
    # MedDRA codes
    llt_code = db.Column(db.String(20), unique=True)  # Lowest Level Term code
    pt_code = db.Column(db.String(20))  # Preferred Term code
    soc_code = db.Column(db.String(20))  # System Organ Class code
    
    # Terms
    llt_name = db.Column(db.String(300), index=True)  # Lowest Level Term
    pt_name = db.Column(db.String(300), index=True)  # Preferred Term
    soc_name = db.Column(db.String(300), index=True)  # System Organ Class
    
    # Searchability
    synonyms = db.Column(db.String(1000))  # Comma-separated common terms
    
    created_date = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<MedDRA {self.pt_name} - {self.soc_name}>'