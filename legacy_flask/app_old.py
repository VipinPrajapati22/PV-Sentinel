from flask import Flask, render_template, request, redirect, jsonify
from models import db, ADRReport, DetectedSignal
from collections import Counter
from signal_detection import calculate_prr, detect_signals, classify_signal_strength

app = Flask(__name__)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///adr.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

with app.app_context():
    db.create_all()

# ===== UTILITY FUNCTIONS =====

def run_signal_detection():
    """Execute PRR-based signal detection on all reports"""
    reports = ADRReport.query.all()
    
    if len(reports) < 3:
        return  # Need minimum data for meaningful analysis
    
    # Clear previous signals
    DetectedSignal.query.delete()
    
    # Build contingency tables and calculate PRR for each drug-effect pair
    drug_effect_pairs = {}
    for report in reports:
        key = (report.suspected_drug.lower(), report.reaction.lower())
        drug_effect_pairs[key] = drug_effect_pairs.get(key, 0) + 1
    
    # Detect signals
    signals = detect_signals(drug_effect_pairs, reports)
    
    # Store detected signals in database
    for signal_data in signals:
        signal = DetectedSignal(
            drug_name=signal_data['drug'],
            side_effect=signal_data['effect'],
            prr_value=signal_data['prr'],
            case_count=signal_data['case_count'],
            background_count=signal_data['background_count'],
            signal_strength=signal_data['strength'],
            confidence_score=signal_data['confidence'],
            notes=f"PRR > 2 with {signal_data['case_count']} cases"
        )
        db.session.add(signal)
    
    db.session.commit()

# ===== ROUTES =====

@app.route('/')
def home():
    reports = ADRReport.query.all()
    total_reports = len(reports)
    total_signals = DetectedSignal.query.filter_by(is_active=True).count()
    
    return render_template('index.html', 
                         reports=reports,
                         total_reports=total_reports,
                         total_signals=total_signals)

@app.route('/report', methods=['GET', 'POST'])
def report():
    if request.method == 'POST':
        new_report = ADRReport(
            patient_age=request.form['patient_age'],
            patient_gender=request.form['patient_gender'],
            suspected_drug=request.form['suspected_drug'],
            reaction=request.form['reaction'],
            severity=request.form['severity'],
            causality=request.form['causality'],
            seriousness=request.form['seriousness'],
            outcome=request.form['outcome'],
            follow_up=request.form['follow_up'],
            reporter_name=request.form['reporter_name'],
            notes=request.form['notes']
        )
        
        db.session.add(new_report)
        db.session.commit()
        
        # Trigger signal detection after new report
        run_signal_detection()
        
        return redirect('/')

    return render_template('report.html')

@app.route('/dashboard')
def dashboard():
    reports = ADRReport.query.all()
    
    # Calculate statistics
    severity_data = Counter([r.severity for r in reports if r.severity])
    causality_data = Counter([r.causality for r in reports if r.causality])
    
    # Get top side effects
    reaction_data = Counter([r.reaction for r in reports if r.reaction])
    top_reactions = dict(reaction_data.most_common(10))
    
    return render_template(
        'dashboard.html',
        severity_labels=list(severity_data.keys()),
        severity_values=list(severity_data.values()),
        causality_labels=list(causality_data.keys()),
        causality_values=list(causality_data.values()),
        reaction_labels=list(top_reactions.keys()),
        reaction_values=list(top_reactions.values()),
        total_reports=len(reports)
    )

@app.route('/signals')
def signals():
    """Display all detected signals"""
    all_signals = DetectedSignal.query.filter_by(is_active=True).order_by(
        DetectedSignal.prr_value.desc()
    ).all()
    
    # Categorize signals
    strong_signals = [s for s in all_signals if s.signal_strength == 'Strong']
    moderate_signals = [s for s in all_signals if s.signal_strength == 'Moderate']
    weak_signals = [s for s in all_signals if s.signal_strength == 'Weak']
    
    return render_template(
        'signals.html',
        all_signals=all_signals,
        strong_signals=strong_signals,
        moderate_signals=moderate_signals,
        weak_signals=weak_signals,
        total_signals=len(all_signals),
        strong_count=len(strong_signals),
        moderate_count=len(moderate_signals),
        weak_count=len(weak_signals)
    )

@app.route('/signals/top')
def top_signals():
    """Get top signals by PRR value"""
    signals = DetectedSignal.query.filter_by(is_active=True).order_by(
        DetectedSignal.prr_value.desc()
    ).limit(15).all()
    
    return render_template(
        'top_signals.html',
        signals=signals
    )

@app.route('/signals/heatmap')
def signal_heatmap():
    """Drug-Effect heatmap data"""
    signals = DetectedSignal.query.filter_by(is_active=True).all()
    
    # Prepare heatmap data
    drugs = sorted(set(s.drug_name for s in signals))
    effects = sorted(set(s.side_effect for s in signals))
    
    data = []
    for signal in signals:
        data.append({
            'drug': signal.drug_name,
            'effect': signal.side_effect,
            'prr': signal.prr_value
        })
    
    return render_template(
        'heatmap.html',
        drugs=drugs,
        effects=effects,
        signals=data
    )

@app.route('/api/reanalyze', methods=['POST'])
def reanalyze():
    """Trigger signal detection analysis"""
    run_signal_detection()
    total_signals = DetectedSignal.query.filter_by(is_active=True).count()
    return jsonify({'status': 'success', 'total_signals': total_signals})

@app.route('/api/signal-stats')
def signal_stats():
    """Get signal statistics"""
    all_signals = DetectedSignal.query.filter_by(is_active=True).all()
    
    stats = {
        'total': len(all_signals),
        'strong': len([s for s in all_signals if s.signal_strength == 'Strong']),
        'moderate': len([s for s in all_signals if s.signal_strength == 'Moderate']),
        'weak': len([s for s in all_signals if s.signal_strength == 'Weak']),
        'avg_prr': sum(s.prr_value for s in all_signals) / len(all_signals) if all_signals else 0
    }
    
    return jsonify(stats)

if __name__ == '__main__':
    app.run(debug=True)
