import traceback
try:
    from app import app, db, ADRReport, DetectedSignal

    with app.app_context():
        print('ADRReport:', ADRReport.query.count())
        print('DetectedSignal:', DetectedSignal.query.count())
except Exception as e:
    print('Error running check_db.py')
    traceback.print_exc()
