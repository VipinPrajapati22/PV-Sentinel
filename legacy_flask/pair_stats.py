from app import app
from collections import Counter

with app.app_context():
    from models import ADRReport
    pairs = Counter()
    reports = ADRReport.query.all()
    for r in reports:
        if r.suspected_drug and r.reaction:
            pairs[(r.suspected_drug.strip().lower(), r.reaction.strip().lower())] += 1

    for (drug, effect), count in pairs.most_common(20):
        print(f'{count}\t{drug}\t{effect}')
