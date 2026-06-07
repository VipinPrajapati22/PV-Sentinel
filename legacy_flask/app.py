from flask import Flask, render_template, request, redirect, jsonify, send_file
from models import db, ADRReport, DetectedSignal, MedDRATerm
from collections import Counter
from signal_detection import detect_signals
from file_handler import parse_csv_file, export_to_excel, generate_signal_summary
from meddra_dictionary import search_meddra_term, get_autocomplete_suggestions, standardize_reaction, get_all_soc_categories
from causality_engine import causality_engine, get_causality_suggestions, CAUSALITY_CATEGORIES
import traceback
from werkzeug.utils import secure_filename
import os
import io
from datetime import datetime

app = Flask(__name__)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///adr.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
app.config['UPLOAD_FOLDER'] = 'uploads'

# Create upload folder
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

ALLOWED_EXTENSIONS = {'csv', 'xlsx', 'xls'}

db.init_app(app)

with app.app_context():
    db.create_all()
    

# ===== UTILITY FUNCTIONS =====

def run_signal_detection():
    """Execute PRR-based signal detection on all reports"""
    try:
        reports = ADRReport.query.all()
        
        if len(reports) < 3:
            return  # Need minimum data for meaningful analysis
        
        # Clear previous signals
        DetectedSignal.query.delete()
        
        # Build contingency tables and calculate PRR for each drug-effect pair
        drug_effect_pairs = {}
        for report in reports:
            if report.suspected_drug and report.reaction:
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
                notes=f"PRR: {signal_data['prr']} with {signal_data['case_count']} cases"
            )
            db.session.add(signal)
        
        db.session.commit()
    except Exception as e:
        print(f"Error in signal detection: {e}")
        traceback.print_exc()
        db.session.rollback()


# Run initial signal detection to populate DetectedSignal table from existing reports
with app.app_context():
    try:
        run_signal_detection()
    except Exception as e:
        print(f"Initial signal detection failed: {e}")

# ===== ROUTES =====

@app.route('/')
def home():
    try:
        reports = ADRReport.query.order_by(ADRReport.id.desc()).all()
        total_reports = len(reports)
        total_signals = DetectedSignal.query.filter_by(is_active=True).count()
    except Exception as e:
        print(f"Error loading home: {e}")
        reports = []
        total_reports = 0
        total_signals = 0
    
    return render_template('index.html', 
                         reports=reports,
                         total_reports=total_reports,
                         total_signals=total_signals)


@app.route('/report', methods=['GET', 'POST'])
def report():
    if request.method == 'POST':
        try:
            reaction_text = request.form.get('reaction', '')
            
            # Standardize reaction using MedDRA
            meddra_result = search_meddra_term(reaction_text)
            meddra_pt = meddra_result.get('pt') if meddra_result.get('found') else reaction_text
            meddra_soc = meddra_result.get('soc') if meddra_result.get('found') else ''
            meddra_llt = meddra_result.get('llt') if meddra_result.get('found') else reaction_text
            meddra_confidence = meddra_result.get('confidence', 0.0)
            
            # Get causality assessment if provided
            causality_assessment = request.form.get('causality_assessment', '')
            causality_confidence = 0.0
            
            # If causality assessment provided, calculate confidence
            if causality_assessment:
                try:
                    assessment_data = {
                        'drug_name': request.form.get('suspected_drug', ''),
                        'reaction': reaction_text,
                        'temporal_relationship': request.form.get('temporal_relationship') == 'true',
                        'dechallenge_result': request.form.get('dechallenge_result', None),
                        'rechallenge_result': request.form.get('rechallenge_result', None),
                        'alternative_causes': request.form.get('alternative_causes', '').split(',') if request.form.get('alternative_causes') else [],
                        'known_adr': request.form.get('known_adr') == 'true',
                        'reaction_severity': request.form.get('severity', 'Moderate')
                    }
                    assessment_result = causality_engine.assess(assessment_data)
                    causality_assessment = assessment_result.get('causality_category', causality_assessment)
                    causality_confidence = assessment_result.get('confidence_score', 0.0)
                except Exception as e:
                    print(f"Causality assessment error: {e}")
            
            new_report = ADRReport(
                patient_age=request.form.get('patient_age', ''),
                patient_gender=request.form.get('patient_gender', ''),
                suspected_drug=request.form.get('suspected_drug', ''),
                reaction=reaction_text,
                meddra_pt=meddra_pt,
                meddra_soc=meddra_soc,
                meddra_llt=meddra_llt,
                meddra_confidence=meddra_confidence,
                severity=request.form.get('severity', ''),
                causality=request.form.get('causality', ''),
                causality_assessment=causality_assessment,
                causality_confidence=causality_confidence,
                causality_system_generated=causality_assessment,
                temporal_relationship=request.form.get('temporal_relationship') == 'true' if request.form.get('temporal_relationship') else None,
                dechallenge_result=request.form.get('dechallenge_result', None),
                rechallenge_result=request.form.get('rechallenge_result', None),
                alternative_causes=request.form.get('alternative_causes', ''),
                seriousness=request.form.get('seriousness', ''),
                outcome=request.form.get('outcome', ''),
                follow_up=request.form.get('follow_up', ''),
                reporter_name=request.form.get('reporter_name', ''),
                notes=request.form.get('notes', '')
            )
            
            db.session.add(new_report)
            db.session.commit()
            
            # Trigger signal detection after new report
            run_signal_detection()
            
            return redirect('/')
        except Exception as e:
            print(f"Error submitting report: {e}")
            traceback.print_exc()
            db.session.rollback()
            return redirect('/report')

    return render_template('report.html', causality_categories=CAUSALITY_CATEGORIES)

@app.route('/dashboard')
def dashboard():
    try:
        reports = ADRReport.query.all()
        
        # Calculate statistics
        severity_data = Counter([r.severity for r in reports if r.severity])
        causality_data = Counter([r.causality_assessment for r in reports if r.causality_assessment])
        
        # Get top side effects using MedDRA PT (standardized)
        reaction_data = Counter([r.meddra_pt or r.reaction for r in reports if r.meddra_pt or r.reaction])
        top_reactions = dict(reaction_data.most_common(10))
        
        # Get top SOC categories
        soc_data = Counter([r.meddra_soc for r in reports if r.meddra_soc])
        top_soc = dict(soc_data.most_common(5))
        
        total_reports = len(reports)
        
        # Causality statistics
        causality_stats = {
            'Certain': len([r for r in reports if r.causality_assessment == 'Certain']),
            'Probable': len([r for r in reports if r.causality_assessment == 'Probable']),
            'Possible': len([r for r in reports if r.causality_assessment == 'Possible']),
            'Unlikely': len([r for r in reports if r.causality_assessment == 'Unlikely']),
            'Conditional': len([r for r in reports if r.causality_assessment == 'Conditional']),
            'Unassessable': len([r for r in reports if r.causality_assessment == 'Unassessable'])
        }
        
    except Exception as e:
        print(f"Error loading dashboard: {e}")
        severity_data = {}
        causality_data = {}
        top_reactions = {}
        top_soc = {}
        causality_stats = {}
        total_reports = 0
    
    return render_template(
        'dashboard.html',
        severity_labels=list(severity_data.keys()),
        severity_values=list(severity_data.values()),
        causality_labels=list(causality_data.keys()),
        causality_values=list(causality_data.values()),
        reaction_labels=list(top_reactions.keys()),
        reaction_values=list(top_reactions.values()),
        soc_labels=list(top_soc.keys()),
        soc_values=list(top_soc.values()),
        causality_stats=causality_stats,
        total_reports=total_reports
    )

@app.route('/signals')
def signals():
    """Display all detected signals"""
    try:
        all_signals = DetectedSignal.query.filter_by(is_active=True).order_by(
            DetectedSignal.prr_value.desc()
        ).all()
        
        # Categorize signals
        strong_signals = [s for s in all_signals if s.signal_strength == 'Strong']
        moderate_signals = [s for s in all_signals if s.signal_strength == 'Moderate']
        weak_signals = [s for s in all_signals if s.signal_strength == 'Weak']
    except Exception as e:
        print(f"Error loading signals: {e}")
        all_signals = []
        strong_signals = []
        moderate_signals = []
        weak_signals = []
    
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
    try:
        signals = DetectedSignal.query.filter_by(is_active=True).order_by(
            DetectedSignal.prr_value.desc()
        ).limit(15).all()
    except Exception as e:
        print(f"Error loading top signals: {e}")
        signals = []
    
    return render_template(
        'top_signals.html',
        signals=signals
    )

@app.route('/signals/heatmap')
def signal_heatmap():
    """Drug-Effect heatmap data"""
    try:
        signals_list = DetectedSignal.query.filter_by(is_active=True).all()
        
        # Prepare heatmap data
        drugs = sorted(set(s.drug_name for s in signals_list))
        effects = sorted(set(s.side_effect for s in signals_list))
        
        data = []
        for signal in signals_list:
            data.append({
                'drug': signal.drug_name,
                'effect': signal.side_effect,
                'prr': signal.prr_value
            })
    except Exception as e:
        print(f"Error loading heatmap: {e}")
        drugs = []
        effects = []
        data = []
    
    return render_template(
        'heatmap.html',
        drugs=drugs,
        effects=effects,
        signals=data
    )

@app.route('/api/reanalyze', methods=['POST'])
def reanalyze():
    """Trigger signal detection analysis"""
    try:
        run_signal_detection()
        total_signals = DetectedSignal.query.filter_by(is_active=True).count()
        return jsonify({'status': 'success', 'total_signals': total_signals})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})

@app.route('/api/signal-stats')
def signal_stats():
    """Get signal statistics"""
    try:
        all_signals = DetectedSignal.query.filter_by(is_active=True).all()
        
        stats = {
            'total': len(all_signals),
            'strong': len([s for s in all_signals if s.signal_strength == 'Strong']),
            'moderate': len([s for s in all_signals if s.signal_strength == 'Moderate']),
            'weak': len([s for s in all_signals if s.signal_strength == 'Weak']),
            'avg_prr': sum(s.prr_value for s in all_signals) / len(all_signals) if all_signals else 0
        }
    except Exception as e:
        print(f"Error getting stats: {e}")
        stats = {'total': 0, 'strong': 0, 'moderate': 0, 'weak': 0, 'avg_prr': 0}
    
    return jsonify(stats)

# ===== MedDRA API ROUTES =====

@app.route('/api/meddra/search')
def meddra_search():
    """Search MedDRA terminology by free-text reaction"""
    query = request.args.get('q', '').strip()
    
    if not query:
        return jsonify({'found': False, 'error': 'Query required'})
    
    result = search_meddra_term(query)
    return jsonify(result)

@app.route('/api/meddra/autocomplete')
def meddra_autocomplete():
    """Get MedDRA autocomplete suggestions"""
    query = request.args.get('q', '').strip()
    limit = request.args.get('limit', 5, type=int)
    
    if not query or len(query) < 2:
        return jsonify([])
    
    suggestions = get_autocomplete_suggestions(query, limit)
    return jsonify(suggestions)

@app.route('/api/meddra/soc')
def meddra_soc_list():
    """Get all SOC categories"""
    soc_categories = get_all_soc_categories()
    return jsonify({'categories': soc_categories})

# ===== CAUSALITY API ROUTES =====

@app.route('/api/causality/suggest', methods=['POST'])
def causality_suggest():
    """Get causality assessment suggestions based on drug and reaction"""
    data = request.get_json()
    drug_name = data.get('drug_name', '')
    reaction = data.get('reaction', '')
    
    if not drug_name or not reaction:
        return jsonify({'error': 'Drug name and reaction required'}), 400
    
    suggestions = get_causality_suggestions(drug_name, reaction)
    return jsonify(suggestions)

@app.route('/api/causality/assess', methods=['POST'])
def causality_assess():
    """Assess causality using WHO-UMC criteria"""
    try:
        assessment_data = request.get_json()
        
        # Validate required fields
        if not assessment_data:
            return jsonify({'error': 'Assessment data required'}), 400
        
        # Perform assessment
        result = causality_engine.assess(assessment_data)
        
        return jsonify(result)
    except Exception as e:
        print(f"Error in causality assessment: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/upload', methods=['GET', 'POST'])
def upload_file():
    """Upload CSV file with ADR reports"""
    if request.method == 'POST':
        try:
            if 'file' not in request.files:
                return render_template('upload.html', error='No file selected'), 400
            
            file = request.files['file']
            if file.filename == '':
                return render_template('upload.html', error='No file selected'), 400
            
            if not file.filename.lower().endswith('.csv'):
                return render_template('upload.html', error='Only CSV files are supported'), 400
            
            # Read and parse file
            file_content = file.read()
            records = parse_csv_file(file_content)
            
            if not records:
                return render_template('upload.html', error='No records found in file'), 400
            
            # Add records to database
            added_count = 0
            for record in records:
                if record.get('suspected_drug') and record.get('reaction'):
                    new_report = ADRReport(
                        patient_age=record.get('patient_age', ''),
                        patient_gender=record.get('patient_gender', ''),
                        suspected_drug=record.get('suspected_drug', ''),
                        reaction=record.get('reaction', ''),
                        severity=record.get('severity', ''),
                        causality=record.get('causality', ''),
                        seriousness=record.get('seriousness', ''),
                        outcome=record.get('outcome', ''),
                        follow_up=record.get('follow_up', ''),
                        reporter_name=record.get('reporter_name', ''),
                        notes=record.get('notes', '')
                    )
                    db.session.add(new_report)
                    added_count += 1
            
            db.session.commit()
            
            # Run signal detection
            run_signal_detection()
            
            return render_template('upload.html', 
                                 success=f'Successfully imported {added_count} reports',
                                 records_count=added_count)
        
        except Exception as e:
            print(f"Error uploading file: {e}")
            traceback.print_exc()
            return render_template('upload.html', error=f'Error: {str(e)}'), 400
    
    return render_template('upload.html')

@app.route('/export/excel')
def export_excel():
    """Export all data and signals to Excel with pivot tables"""
    try:
        reports = ADRReport.query.all()
        signals = DetectedSignal.query.filter_by(is_active=True).all()
        stats = generate_signal_summary(signals)
        
        excel_data = export_to_excel(reports, signals, stats)
        
        return send_file(
            io.BytesIO(excel_data),
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            as_attachment=True,
            download_name=f'Pharmacovigilance_Report_{datetime.now().strftime("%Y%m%d_%H%M%S")}.xlsx'
        )
    except Exception as e:
        print(f"Error exporting: {e}")
        return jsonify({'error': str(e)}), 500

@app.errorhandler(404)
def not_found(error):
    return render_template('index.html'), 404

@app.errorhandler(500)
def server_error(error):
    return render_template('index.html'), 500

if __name__ == '__main__':
    app.run(debug=True)
