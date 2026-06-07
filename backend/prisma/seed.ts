import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || 'file:./dev.db'
});
const prisma = new PrismaClient({ adapter });

// Helper to get random item from array
const randomChoice = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Helper to get random number in range
const randomRange = (min: number, max: number): number => Math.random() * (max - min) + min;

// Helper to get random int in range
const randomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;

// Helper to generate a date in the past 24 months
const randomDate = (start: Date, end: Date): Date => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

async function main() {
  console.log('Starting seeding database...');

  // 1. Clean existing data
  await prisma.auditLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.capaTracking.deleteMany({});
  await prisma.riskRegister.deleteMany({});
  await prisma.signalHistory.deleteMany({});
  await prisma.signalDetection.deleteMany({});
  await prisma.attachment.deleteMany({});
  await prisma.aDRReport.deleteMany({});
  await prisma.patient.deleteMany({});
  await prisma.terminology.deleteMany({});
  await prisma.drug.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.role.deleteMany({});

  console.log('Database cleaned.');

  // 2. Create Roles
  const roles = [
    { name: 'Admin', description: 'System Administrator with full access' },
    { name: 'Safety Officer', description: 'Responsible for signal triage and safety reviews' },
    { name: 'Reviewer', description: 'Safety reviewer for case processing' },
    { name: 'Medical Monitor', description: 'Medical monitor for clinical review' },
    { name: 'Regulatory User', description: 'Regulatory agency reviewer (FDA/EMA)' },
    { name: 'Viewer', description: 'Read-only viewer' }
  ];

  const createdRoles: Record<string, string> = {};
  for (const role of roles) {
    const r = await prisma.role.create({ data: role });
    createdRoles[role.name] = r.id;
  }
  console.log('Roles created.');

  // 3. Create Users
  const passwordHash = await bcrypt.hash('password123', 10);
  const users = [
    { email: 'admin@pvplatform.local', passwordHash, firstName: 'Admin', lastName: 'User', roleId: createdRoles['Admin'] },
    { email: 'safety@pvplatform.local', passwordHash, firstName: 'Sarah', lastName: 'Conner', roleId: createdRoles['Safety Officer'] },
    { email: 'reviewer@pvplatform.local', passwordHash, firstName: 'Robert', lastName: 'Reviewer', roleId: createdRoles['Reviewer'] },
    { email: 'monitor@pvplatform.local', passwordHash, firstName: 'Emily', lastName: 'Monitor', roleId: createdRoles['Medical Monitor'] },
    { email: 'regulatory@pvplatform.local', passwordHash, firstName: 'George', lastName: 'Regulator', roleId: createdRoles['Regulatory User'] },
    { email: 'viewer@pvplatform.local', passwordHash, firstName: 'Valerie', lastName: 'Viewer', roleId: createdRoles['Viewer'] }
  ];

  const dbUsers: any[] = [];
  for (const user of users) {
    const u = await prisma.user.create({ data: user });
    dbUsers.push(u);
  }
  console.log('Users created.');

  // 4. Create Medical Terminology (500+ terms)
  // We will define standard Preferred Terms (PT) across System Organ Classes (SOC)
  // and map multiple Lower Level Terms (LLTs) / Synonyms to them.
  const terminologySpecs = [
    {
      soc: 'Cardiac disorders',
      pt: 'Myocardial infarction',
      llts: ['Heart attack', 'Cardiac infarction', 'Myocardial necrosis', 'Acute myocardial infarction', 'AMI', 'Coronary occlusion', 'Silent heart attack', 'Heart muscle death', 'Coronary thrombosis', 'Myocardial ischemia']
    },
    {
      soc: 'Cardiac disorders',
      pt: 'Arrhythmia',
      llts: ['Irregular heartbeat', 'Cardiac dysrhythmia', 'Heart rhythm disorder', 'Dysrhythmia', 'Cardiac arrhythmia', 'Fluttering heart', 'Ectopic beats', 'Chaotic heart rhythm', 'Tachyarrhythmia', 'Bradyarrhythmia']
    },
    {
      soc: 'Cardiac disorders',
      pt: 'Palpitations',
      llts: ['Pounding heart', 'Heart racing', 'Skipped beats', 'Awareness of heartbeat', 'Heart thumping', 'Fluttering chest', 'Racing pulse', 'Rapid heart action', 'Aware of heart action', 'Palpitation cardiac']
    },
    {
      soc: 'Cardiac disorders',
      pt: 'Heart failure',
      llts: ['Congestive heart failure', 'Cardiac failure', 'CHF', 'Left ventricular failure', 'Right ventricular failure', 'Myocardial insufficiency', 'Decompensated heart failure', 'Heart muscle weakness', 'Cardiac dropsy', 'Chronic heart failure']
    },
    {
      soc: 'Gastrointestinal disorders',
      pt: 'Nausea',
      llts: ['Feeling sick', 'Squeamishness', 'Sick to stomach', 'Nauseous feeling', 'Urge to vomit', 'Stomach upset', 'Travel sickness', 'Queasiness', 'Nausea mild', 'Nausea persistent']
    },
    {
      soc: 'Gastrointestinal disorders',
      pt: 'Vomiting',
      llts: ['Emesis', 'Throwing up', 'Sick', 'Vomiting blood', 'Retching', 'Dry heaves', 'Hyperemesis', 'Active vomiting', 'Bilious vomiting', 'Projectile vomiting']
    },
    {
      soc: 'Gastrointestinal disorders',
      pt: 'Diarrhoea',
      llts: ['Loose stools', 'Watery diarrhoea', 'Frequent bowel movements', 'Runny tummy', 'Diarrheal illness', 'Dysentery-like stools', 'Gastroenteritis symptoms', 'Hyperactive bowel', 'Diarrhoea acute', 'Diarrhoea chronic']
    },
    {
      soc: 'Gastrointestinal disorders',
      pt: 'Constipation',
      llts: ['Difficulty passing stool', 'Hard stools', 'Infrequent bowel movements', 'Bowel obstruction mild', 'Obstipation', 'Fecal impaction risk', 'Dyschezia', 'Irregular bowels', 'Constipation acute', 'Constipation chronic']
    },
    {
      soc: 'Gastrointestinal disorders',
      pt: 'Abdominal pain',
      llts: ['Stomach ache', 'Belly pain', 'Stomach cramps', 'Abdominal cramps', 'Gut ache', 'Epigastric pain', 'Visceral pain belly', 'Lower abdominal pain', 'Upper abdominal pain', 'Abdominal tenderness']
    },
    {
      soc: 'Gastrointestinal disorders',
      pt: 'Dyspepsia',
      llts: ['Indigestion', 'Heartburn', 'Acid reflux', 'Acid stomach', 'GERD symptoms', 'Sour stomach', 'Gastroesophageal reflux', 'Pyrosis', 'Burning chest stomach', 'Upper gut discomfort']
    },
    {
      soc: 'Gastrointestinal disorders',
      pt: 'Gastrointestinal haemorrhage',
      llts: ['GI bleeding', 'Stomach bleed', 'Blood in stool', 'Hematemesis', 'Melena', 'Rectal bleeding', 'Upper GI bleed', 'Lower GI bleed', 'Bowel haemorrhage', 'Intestinal bleeding']
    },
    {
      soc: 'Nervous system disorders',
      pt: 'Headache',
      llts: ['Cephalalgia', 'Head pain', 'Tension headache', 'Throbbing head', 'Frontal headache', 'Occipital headache', 'Cluster headache', 'Sinus headache', 'Brain ache', 'Daily headache']
    },
    {
      soc: 'Nervous system disorders',
      pt: 'Dizziness',
      llts: ['Lightheadedness', 'Giddiness', 'Feeling faint', 'Unsteadiness', 'Wooziness', 'Dizzy spell', 'Loss of balance', 'Dizziness postural', 'Dizziness transient', 'Head spinning']
    },
    {
      soc: 'Nervous system disorders',
      pt: 'Vertigo',
      llts: ['Spinning sensation', 'Labyrinthine disorder', 'Vestibular vertigo', 'Subjective vertigo', 'Aural vertigo', 'Inner ear dizziness', 'Motion vertigo', 'Objective vertigo', 'Rotational dizziness', 'True vertigo']
    },
    {
      soc: 'Nervous system disorders',
      pt: 'Tremor',
      llts: ['Shaking hands', 'Trembling', 'Jitteriness', 'Involuntary shaking', 'Fine tremor', 'Action tremor', 'Resting tremor', 'Essential tremor', 'Shaky limbs', 'Fasciculation muscle']
    },
    {
      soc: 'Nervous system disorders',
      pt: 'Somnolence',
      llts: ['Drowsiness', 'Sleepiness', 'Excessive daytime sleepiness', 'Lethargy', 'Sedation', 'Sluggishness', 'Somnolent state', 'Heavy eyelids', 'Fatigue sleepiness', 'Napping excessively']
    },
    {
      soc: 'Nervous system disorders',
      pt: 'Convulsion',
      llts: ['Seizure', 'Fits', 'Epileptic fit', 'Tonic-clonic seizure', 'Grand mal', 'Myoclonic jerk', 'Spasms convulsive', 'Petit mal', 'Status epilepticus', 'Seizure activity']
    },
    {
      soc: 'Nervous system disorders',
      pt: 'Paraesthesia',
      llts: ['Numbness', 'Tingling', 'Pins and needles', 'Prickling sensation', 'Loss of sensation', 'Hypoesthesia', 'Formication', 'Burning neuropathy', 'Numb limbs', 'Peripheral sensory loss']
    },
    {
      soc: 'Nervous system disorders',
      pt: 'Migraine',
      llts: ['Migraine headache', 'Hemicrania', 'Migraine with aura', 'Migraine without aura', 'Sick headache', 'Ophthalmic migraine', 'Visual migraine', 'Classical migraine', 'Hemiplegic migraine', 'Migraine attack']
    },
    {
      soc: 'Skin and subcutaneous tissue disorders',
      pt: 'Rash',
      llts: ['Skin rash', 'Eruption skin', 'Dermatitis rash', 'Maculopapular rash', 'Exanthema', 'Skin redness rash', 'Pruritic rash', 'Erythematous rash', 'Papular eruption', 'Morbilliform rash']
    },
    {
      soc: 'Skin and subcutaneous tissue disorders',
      pt: 'Pruritus',
      llts: ['Itching', 'Itous skin', 'Pruritic skin', 'Severe itching', 'Generalized itching', 'Localized itching', 'Itchy welts', 'Pruritus ani', 'Pruritus senilis', 'Pruritus generalized']
    },
    {
      soc: 'Skin and subcutaneous tissue disorders',
      pt: 'Urticaria',
      llts: ['Hives', 'Nettle rash', 'Welts', 'Wheals', 'Urticarial eruption', 'Giant urticaria', 'Allergic hives', 'Acute urticaria', 'Chronic urticaria', 'Angioedema hives']
    },
    {
      soc: 'Skin and subcutaneous tissue disorders',
      pt: 'Alopecia',
      llts: ['Hair loss', 'Baldness', 'Thinning hair', 'Hair shedding', 'Alopecia areata', 'Male pattern baldness', 'Drug induced alopecia', 'Loss of eyebrows', 'Alopecia totalis', 'Hair fall']
    },
    {
      soc: 'Skin and subcutaneous tissue disorders',
      pt: 'Stevens-Johnson syndrome',
      llts: ['SJS', 'Epidermal necrolysis mild', 'Mucocutaneous syndrome', 'Dermatostomatitis', 'Erythema multiforme severe', 'Toxic epidermal necrolysis SJS', 'SJS/TEN overlap', 'Fever with skin sloughing', 'Mucous membrane erosion', 'Blistering skin syndrome']
    },
    {
      soc: 'Respiratory, thoracic and mediastinal disorders',
      pt: 'Cough',
      llts: ['Dry cough', 'Persistent cough', 'Tickly cough', 'Coughing fits', 'Hack cough', 'Productive cough', 'Bronchial cough', 'Throat irritation cough', 'Spasmodic cough', 'Chronic cough']
    },
    {
      soc: 'Respiratory, thoracic and mediastinal disorders',
      pt: 'Dyspnoea',
      llts: ['Shortness of breath', 'Breathing difficulty', 'Air hunger', 'Breathlessness', 'Laboured breathing', 'Short of breath', 'Dyspnoea on exertion', 'Orthopnoea', 'Paroxysmal nocturnal dyspnoea', 'Respiratory distress']
    },
    {
      soc: 'Respiratory, thoracic and mediastinal disorders',
      pt: 'Asthma',
      llts: ['Asthma attack', 'Bronchospasm', 'Wheezing asthma', 'Reactive airways disease', 'Asthmatic bronchitis', 'Exercise induced asthma', 'Status asthmaticus', 'Allergic asthma', 'Tight chest wheeze', 'Reversible airway obstruction']
    },
    {
      soc: 'Respiratory, thoracic and mediastinal disorders',
      pt: 'Pneumonia',
      llts: ['Lung infection', 'Pneumonitis', 'Bronchopneumonia', 'Lobar pneumonia', 'Aspiration pneumonia', 'Community acquired pneumonia', 'Pulmonary infiltration', 'Viral pneumonia', 'Bacterial pneumonia', 'Alveolitis']
    },
    {
      soc: 'Hepatobiliary disorders',
      pt: 'Hepatic injury',
      llts: ['Liver damage', 'Hepatotoxicity', 'Toxic hepatitis', 'Drug induced liver injury', 'DILI', 'Hepatocellular damage', 'Liver necrosis', 'Hepatitis acute', 'Chemical liver injury', 'Liver damage acute']
    },
    {
      soc: 'Hepatobiliary disorders',
      pt: 'Jaundice',
      llts: ['Yellow skin', 'Icterus', 'Yellow eyes', 'Hyperbilirubinaemia', 'Yellow sclera', 'Bilirubinemia', 'Cholestatic jaundice', 'Hepatocellular jaundice', 'Bile duct blockage icterus', 'Neonatal jaundice-like']
    },
    {
      soc: 'Hepatobiliary disorders',
      pt: 'Liver failure',
      llts: ['Acute liver failure', 'Hepatic encephalopathy', 'End stage liver disease', 'Fulminant hepatitis', 'Hepatic coma', 'Liver necrosis massive', 'Decompensated cirrhosis', 'Hepatic insufficiency acute', 'Liver destruction', 'Terminal liver failure']
    },
    {
      soc: 'Renal and urinary disorders',
      pt: 'Renal impairment',
      llts: ['Kidney damage', 'Kidney function decreased', 'Renal insufficiency', 'Azotemia', 'Elevated creatinine', 'Reduced GFR', 'Chronic kidney disease', 'Uremia', 'Nephropathy', 'Glomerular filtration decreased']
    },
    {
      soc: 'Renal and urinary disorders',
      pt: 'Acute kidney injury',
      llts: ['AKI', 'Acute renal failure', 'ARF', 'Acute tubular necrosis', 'Anuria', 'Oliguria', 'Abrupt kidney failure', 'Sudden renal shutdown', 'Toxic nephropathy acute', 'Renal necrosis acute']
    },
    {
      soc: 'Renal and urinary disorders',
      pt: 'Urinary tract infection',
      llts: ['UTI', 'Cystitis', 'Bladder infection', 'Pyelonephritis', 'Dysuria', 'Urethritis', 'Urinary tract inflammation', 'Pyuria', 'Bacteriuria', 'Kidney infection']
    },
    {
      soc: 'General disorders',
      pt: 'Fatigue',
      llts: ['Tiredness', 'Exhaustion', 'Lethargy general', 'Weariness', 'Lack of energy', 'Malaise', 'Feeling drained', 'Drowsiness fatigue', 'Physical exhaustion', 'Mental fatigue']
    },
    {
      soc: 'General disorders',
      pt: 'Pyrexia',
      llts: ['Fever', 'High temperature', 'Hyperthermia', 'Febrile response', 'Fever spikes', 'Rigors with fever', 'Pyrexial state', 'Elevated core temp', 'Shivering with fever', 'Post-drug pyrexia']
    },
    {
      soc: 'General disorders',
      pt: 'Oedema peripheral',
      llts: ['Swollen ankles', 'Fluid retention', 'Swollen feet', 'Peripheral edema', 'Leg swelling', 'Ankle swelling', 'Pedal edema', 'Puffy ankles', 'Water retention limbs', 'Dropsy peripheral']
    },
    {
      soc: 'Metabolic and nutritional disorders',
      pt: 'Hypoglycaemia',
      llts: ['Low blood sugar', 'Insulin shock', 'Blood glucose low', 'Hypoglycemic shock', 'Low blood glucose', 'Shakiness low sugar', 'Hypoglycemic episode', 'Sugar crash', 'Sweating hypoglycemic', 'Low blood sugar reaction']
    },
    {
      soc: 'Metabolic and nutritional disorders',
      pt: 'Hyperglycaemia',
      llts: ['High blood sugar', 'Blood glucose high', 'Diabetic state temporary', 'Hyperglycemic event', 'Elevated blood sugar', 'High blood glucose', 'Postprandial hyperglycemia', 'High sugar levels', 'Pre-diabetic spike', 'Diabetic ketoacidosis mild']
    },
    {
      soc: 'Metabolic and nutritional disorders',
      pt: 'Hyperkalaemia',
      llts: ['High potassium', 'Potassium levels increased', 'Blood potassium high', 'Hyperkalemic state', 'Serum potassium elevation', 'Cardiotoxic potassium levels', 'Hyperpotassaemia', 'Elevated serum potassium', 'Potassium accumulation', 'Borderline hyperkalemia']
    },
    {
      soc: 'Immune system disorders',
      pt: 'Hypersensitivity',
      llts: ['Allergic reaction', 'Drug allergy', 'Allergic response', 'Hypersensitive reaction', 'Allergy symptoms', 'Drug hypersensitivity', 'Atopic reaction', 'Allergic sensitization', 'Immediate hypersensitivity', 'Delayed hypersensitivity']
    },
    {
      soc: 'Immune system disorders',
      pt: 'Anaphylactic reaction',
      llts: ['Anaphylaxis', 'Anaphylactic shock', 'Allergic shock', 'Severe allergic reaction', 'Anaphylactoid reaction', 'Cardiovascular collapse allergic', 'Anaphylactic collapse', 'Acute systemic allergy', 'Laryngeal edema anaphylactic', 'Systemic anaphylaxis']
    },
    {
      soc: 'Musculoskeletal and connective tissue disorders',
      pt: 'Arthralgia',
      llts: ['Joint pain', 'Painful joints', 'Arthritis-like pain', 'Joint stiffness', 'Polyarthralgia', 'Joint aches', 'Post-viral arthralgia', 'Knee joint pain', 'Shoulder pain joint', 'Rheumatic-like pain']
    },
    {
      soc: 'Musculoskeletal and connective tissue disorders',
      pt: 'Myalgia',
      llts: ['Muscle pain', 'Muscle ache', 'Sore muscles', 'Myalgic state', 'Muscle soreness', 'Generalized muscle aches', 'Fibromyalgia-like pain', 'Muscle tenderness', 'Myositis-like pain', 'Leg muscle pain']
    },
    {
      soc: 'Musculoskeletal and connective tissue disorders',
      pt: 'Rhabdomyolysis',
      llts: ['Muscle breakdown', 'Myoglobinuria', 'Skeletal muscle necrosis', 'Acute muscle injury', 'Muscle fiber destruction', 'CPK elevation massive', 'Myolysis skeletal', 'Myoglobin in urine', 'Statins muscle destruction', 'Severe rhabdo']
    },
    {
      soc: 'Endocrine disorders',
      pt: 'Hypothyroidism',
      llts: ['Underactive thyroid', 'Thyroid deficiency', 'Myxedema', 'Low thyroid function', 'TSH increased', 'Thyroid hormone deficiency', 'Hypothyroid state', 'Glandular hypothyroidism', 'Sluggish thyroid', 'Autoimmune thyroiditis-like']
    },
    {
      soc: 'Psychiatric disorders',
      pt: 'Insomnia',
      llts: ['Sleeplessness', 'Difficulty sleeping', 'Sleep disturbance', 'Inability to sleep', 'Poor sleep quality', 'Early awakening', 'Sleep onset insomnia', 'Middle insomnia', 'Wakefulness', 'Tossing and turning']
    },
    {
      soc: 'Blood and lymphatic system disorders',
      pt: 'Thrombocytopenia',
      llts: ['Low platelet count', 'Platelets decreased', 'Thrombocytopenia drug-induced', 'Bleeding platelets low', 'Immune thrombocytopenia', 'Thrombopenia', 'Low blood platelets', 'Bruising low platelets', 'Thrombocyte count decreased', 'Petechiae thrombocytopenic']
    },
    {
      soc: 'Vascular disorders',
      pt: 'Hypertension',
      llts: ['High blood pressure', 'Blood pressure increased', 'Hypertensive crisis', 'Elevated BP', 'Essential hypertension', 'Secondary hypertension', 'High systemic pressure', 'BP spike', 'Hypertensive episode', 'Borderline hypertension']
    },
    {
      soc: 'Vascular disorders',
      pt: 'Hypotension',
      llts: ['Low blood pressure', 'Blood pressure decreased', 'Hypotensive episode', 'Postural hypotension', 'Orthostatic hypotension', 'Fainting low pressure', 'Reduced BP', 'Shock hypotensive', 'Low systemic pressure', 'Circulatory collapse mild']
    }
  ];

  // Insert Terminology (this will create 50 PTs x 10 LLTs = 500 terminology rows)
  const dbTerminology: any[] = [];
  let termCount = 0;
  for (const spec of terminologySpecs) {
    for (const llt of spec.llts) {
      const t = await prisma.terminology.create({
        data: {
          lltName: llt,
          ptName: spec.pt,
          socName: spec.soc,
          synonyms: `${llt}, ${spec.pt}, ${llt.toLowerCase()}`
        }
      });
      dbTerminology.push(t);
      termCount++;
    }
  }
  console.log(`Medical Terminology seeded. Total terms: ${termCount}`);

  // 5. Create Drugs (100+ drugs)
  const drugTemplates = [
    { brandName: 'Glucophage', genericName: 'Metformin', atcCode: 'A10BA02', manufacturer: 'Bristol-Myers Squibb' },
    { brandName: 'Prinivil', genericName: 'Lisinopril', atcCode: 'C09AA03', manufacturer: 'Merck' },
    { brandName: 'Coumadin', genericName: 'Warfarin', atcCode: 'B01AA03', manufacturer: 'Bristol-Myers Squibb' },
    { brandName: 'Lipitor', genericName: 'Atorvastatin', atcCode: 'C10AA05', manufacturer: 'Pfizer' },
    { brandName: 'Amoxil', genericName: 'Amoxicillin', atcCode: 'J01CA04', manufacturer: 'GlaxoSmithKline' },
    { brandName: 'Advil', genericName: 'Ibuprofen', atcCode: 'M01AE01', manufacturer: 'Pfizer' },
    { brandName: 'Prilosec', genericName: 'Omeprazole', atcCode: 'A02BC01', manufacturer: 'AstraZeneca' },
    { brandName: 'Synthroid', genericName: 'Levothyroxine', atcCode: 'H03AA01', manufacturer: 'AbbVie' },
    { brandName: 'Norvasc', genericName: 'Amlodipine', atcCode: 'C08CA01', manufacturer: 'Pfizer' },
    { brandName: 'Lopressor', genericName: 'Metoprolol', atcCode: 'C07AB02', manufacturer: 'Novartis' },
    { brandName: 'Ventolin', genericName: 'Albuterol', atcCode: 'R03AC02', manufacturer: 'GlaxoSmithKline' },
    { brandName: 'Neurontin', genericName: 'Gabapentin', atcCode: 'N02BF01', manufacturer: 'Pfizer' },
    { brandName: 'Viagra', genericName: 'Sildenafil', atcCode: 'G04BE03', manufacturer: 'Pfizer' },
    { brandName: 'Levaquin', genericName: 'Levofloxacin', atcCode: 'J01MA12', manufacturer: 'Janssen' },
    { brandName: 'Plavix', genericName: 'Clopidogrel', atcCode: 'B01AC04', manufacturer: 'Sanofi' },
    { brandName: 'Aldactone', genericName: 'Spironolactone', atcCode: 'C03DA01', manufacturer: 'Pfizer' },
    { brandName: 'Zoloft', genericName: 'Sertraline', atcCode: 'N06AB06', manufacturer: 'Pfizer' },
    { brandName: 'Zithromax', genericName: 'Azithromycin', atcCode: 'J01FA10', manufacturer: 'Pfizer' },
    { brandName: 'Xanax', genericName: 'Alprazolam', atcCode: 'N05BA12', manufacturer: 'Pfizer' },
    { brandName: 'Singulair', genericName: 'Montelukast', atcCode: 'R03DC03', manufacturer: 'Merck' },
    { brandName: 'Crestor', genericName: 'Rosuvastatin', atcCode: 'C10AA07', manufacturer: 'AstraZeneca' },
    { brandName: 'Nexium', genericName: 'Esomeprazole', atcCode: 'A02BC05', manufacturer: 'AstraZeneca' },
    { brandName: 'Vicodin', genericName: 'Hydrocodone/Acetaminophen', atcCode: 'N02AJ13', manufacturer: 'AbbVie' },
    { brandName: 'Zyrtec', genericName: 'Cetirizine', atcCode: 'R06AE07', manufacturer: 'Johnson & Johnson' },
    { brandName: 'Synthroid', genericName: 'Levothyroxine', atcCode: 'H03AA01', manufacturer: 'AbbVie' },
    { brandName: 'Humalog', genericName: 'Insulin Lispro', atcCode: 'A10AB04', manufacturer: 'Eli Lilly' },
    { brandName: 'Cozaar', genericName: 'Losartan', atcCode: 'C09CA01', manufacturer: 'Merck' },
    { brandName: 'Prozac', genericName: 'Fluoxetine', atcCode: 'N06AB03', manufacturer: 'Eli Lilly' },
    { brandName: 'Lantus', genericName: 'Insulin Glargine', atcCode: 'A10AE04', manufacturer: 'Sanofi' },
    { brandName: 'Lyrica', genericName: 'Pregabalin', atcCode: 'N02BF02', manufacturer: 'Pfizer' },
    { brandName: 'Effexor', genericName: 'Venlafaxine', atcCode: 'N06AX16', manufacturer: 'Pfizer' },
    { brandName: 'Cymbalta', genericName: 'Duloxetine', atcCode: 'N06AX21', manufacturer: 'Eli Lilly' },
    { brandName: 'Spiriva', genericName: 'Tiotropium', atcCode: 'R03BB04', manufacturer: 'Boehringer Ingelheim' },
    { brandName: 'Celebrex', genericName: 'Celecoxib', atcCode: 'M01AH01', manufacturer: 'Pfizer' },
    { brandName: 'Abilify', genericName: 'Aripiprazole', atcCode: 'N05AX12', manufacturer: 'Otsuka' },
    { brandName: 'Januvia', genericName: 'Sitagliptin', atcCode: 'A10BH01', manufacturer: 'Merck' },
    { brandName: 'Symbicort', genericName: 'Budesonide/Formoterol', atcCode: 'R03AK07', manufacturer: 'AstraZeneca' },
    { brandName: 'Vyvanse', genericName: 'Lisdexamfetamine', atcCode: 'N06BA09', manufacturer: 'Takeda' },
    { brandName: 'Humira', genericName: 'Adalimumab', atcCode: 'L04AB04', manufacturer: 'AbbVie' },
    { brandName: 'Cialis', genericName: 'Tadalafil', atcCode: 'G04BE08', manufacturer: 'Eli Lilly' },
    { brandName: 'Valium', genericName: 'Diazepam', atcCode: 'N05BA01', manufacturer: 'Roche' },
    { brandName: 'Seroquel', genericName: 'Quetiapine', atcCode: 'N05AH04', manufacturer: 'AstraZeneca' },
    { brandName: 'Flonase', genericName: 'Fluticasone', atcCode: 'R01AD08', manufacturer: 'GlaxoSmithKline' },
    { brandName: 'Ultram', genericName: 'Tramadol', atcCode: 'N02AX02', manufacturer: 'Janssen' },
    { brandName: 'Coreg', genericName: 'Carvedilol', atcCode: 'C07AG02', manufacturer: 'Roche' },
    { brandName: 'Lexapro', genericName: 'Escitalopram', atcCode: 'N06AB10', manufacturer: 'Lundbeck' },
    { brandName: 'Augmentin', genericName: 'Amoxicillin/Clavulanate', atcCode: 'J01CR02', manufacturer: 'GlaxoSmithKline' },
    { brandName: 'Klonopin', genericName: 'Clonazepam', atcCode: 'N05BA09', manufacturer: 'Roche' },
    { brandName: 'Tylenol', genericName: 'Acetaminophen', atcCode: 'N02BE01', manufacturer: 'Johnson & Johnson' },
    { brandName: 'Cardizem', genericName: 'Diltiazem', atcCode: 'C08DB01', manufacturer: 'Bausch Health' }
  ];

  // We need 100+ drugs. Let's create another 55 programmatically to reach 105 drugs
  const classes = ['Beta Blocker', 'Statins', 'ACE Inhibitor', 'NSAID', 'Antibiotic', 'Antidepressant', 'Antipsychotic', 'Diuretic', 'Anticoagulant'];
  const companies = ['Pfizer', 'Merck', 'Novartis', 'AstraZeneca', 'GlaxoSmithKline', 'Eli Lilly', 'Sanofi', 'Roche', 'Johnson & Johnson', 'AbbVie'];
  
  for (let i = 1; i <= 55; i++) {
    const generic = `GenericDrug${i}`;
    const brand = `BrandDrug${i}`;
    const atc = `ATC${randomChoice(['A', 'B', 'C', 'G', 'H', 'J', 'L', 'M', 'N', 'R'])}${randomInt(10, 99)}${randomChoice(['A', 'B', 'C', 'D', 'F', 'G'])}${randomInt(10, 99)}`;
    const manufacturer = randomChoice(companies);
    drugTemplates.push({ brandName: brand, genericName: generic, atcCode: atc, manufacturer });
  }

  const dbDrugs = [];
  for (const d of drugTemplates) {
    const drg = await prisma.drug.create({ data: d });
    dbDrugs.push(drg);
  }
  console.log(`Drugs seeded. Total: ${dbDrugs.length}`);

  // Map by generic name for quick reference during seeding
  const drugMap: Record<string, typeof dbDrugs[0]> = {};
  for (const d of dbDrugs) {
    drugMap[d.genericName] = d;
  }

  // 6. Generate 5,000+ Reports with Realistic Statistical Distributions
  // We'll create strong signals (Evans criteria: PRR >= 2, Chi2 >= 4, Cases >= 3, Lower CI > 1)
  // And moderate signals, plus random noise.
  
  const reportsData: any[] = [];
  
  const strongSignals = [
    { genericName: 'Metformin', ptName: 'Lactic Acidosis', count: 140, ageGroup: 'elderly', severity: 'Severe', seriousness: 'Serious', outcome: 'Hospitalized', temporal: true, dechallenge: 'positive', rechallenge: 'positive', alternative: false },
    { genericName: 'Lisinopril', ptName: 'Cough', count: 180, ageGroup: 'any', severity: 'Mild', seriousness: 'Non-Serious', outcome: 'Resolved', temporal: true, dechallenge: 'positive', rechallenge: 'positive', alternative: false },
    { genericName: 'Warfarin', ptName: 'Gastrointestinal haemorrhage', count: 210, ageGroup: 'elderly', severity: 'Severe', seriousness: 'Serious', outcome: 'Hospitalized', temporal: true, dechallenge: 'positive', rechallenge: 'not_done', alternative: false },
    { genericName: 'Atorvastatin', ptName: 'Myalgia', count: 160, ageGroup: 'any', severity: 'Moderate', seriousness: 'Non-Serious', outcome: 'Resolving', temporal: true, dechallenge: 'positive', rechallenge: 'positive', alternative: false },
    { genericName: 'Amoxicillin', ptName: 'Urticaria', count: 130, ageGroup: 'child', severity: 'Moderate', seriousness: 'Non-Serious', outcome: 'Resolved', temporal: true, dechallenge: 'positive', rechallenge: 'not_done', alternative: false },
    { genericName: 'Ibuprofen', ptName: 'Acute kidney injury', count: 95, ageGroup: 'elderly', severity: 'Severe', seriousness: 'Serious', outcome: 'Hospitalized', temporal: true, dechallenge: 'positive', rechallenge: 'not_done', alternative: false },
    { genericName: 'Levofloxacin', ptName: 'Arthralgia', count: 85, ageGroup: 'any', severity: 'Moderate', seriousness: 'Non-Serious', outcome: 'Resolved', temporal: true, dechallenge: 'positive', rechallenge: 'not_done', alternative: false }
  ];

  const moderateSignals = [
    { genericName: 'Gabapentin', ptName: 'Somnolence', count: 65, ageGroup: 'any', severity: 'Mild', seriousness: 'Non-Serious', outcome: 'Resolved', temporal: true, dechallenge: 'positive', rechallenge: 'not_done', alternative: false },
    { genericName: 'Amlodipine', ptName: 'Oedema peripheral', count: 75, ageGroup: 'elderly', severity: 'Moderate', seriousness: 'Non-Serious', outcome: 'Resolving', temporal: true, dechallenge: 'positive', rechallenge: 'not_done', alternative: false },
    { genericName: 'Sildenafil', ptName: 'Palpitations', count: 55, ageGroup: 'any', severity: 'Mild', seriousness: 'Non-Serious', outcome: 'Resolved', temporal: true, dechallenge: 'positive', rechallenge: 'not_done', alternative: true },
    { genericName: 'Omeprazole', ptName: 'Diarrhoea', count: 50, ageGroup: 'any', severity: 'Mild', seriousness: 'Non-Serious', outcome: 'Resolved', temporal: true, dechallenge: 'positive', rechallenge: 'not_done', alternative: false },
    { genericName: 'Albuterol', ptName: 'Tremor', count: 40, ageGroup: 'child', severity: 'Mild', seriousness: 'Non-Serious', outcome: 'Resolved', temporal: true, dechallenge: 'positive', rechallenge: 'positive', alternative: false },
    { genericName: 'Levothyroxine', ptName: 'Arrhythmia', count: 35, ageGroup: 'any', severity: 'Moderate', seriousness: 'Serious', outcome: 'Resolved', temporal: true, dechallenge: 'positive', rechallenge: 'not_done', alternative: true },
    { genericName: 'Clopidogrel', ptName: 'Palpitations', count: 45, ageGroup: 'elderly', severity: 'Mild', seriousness: 'Non-Serious', outcome: 'Resolved', temporal: true, dechallenge: 'positive', rechallenge: 'not_done', alternative: false },
    { genericName: 'Spironolactone', ptName: 'Hyperkalaemia', count: 35, ageGroup: 'elderly', severity: 'Moderate', seriousness: 'Serious', outcome: 'Resolving', temporal: true, dechallenge: 'positive', rechallenge: 'not_done', alternative: false }
  ];

  // Helper to generate a patient
  const createPatientInfo = (ageGroup: string) => {
    let age = 40;
    if (ageGroup === 'elderly') {
      age = randomInt(65, 88);
    } else if (ageGroup === 'child') {
      age = randomInt(2, 14);
    } else {
      age = randomInt(18, 64);
    }
    const gender = randomChoice(['Male', 'Female', 'Female', 'Female', 'Male', 'Unknown']);
    const weight = ageGroup === 'child' ? randomRange(12, 45) : randomRange(55, 110);
    const height = ageGroup === 'child' ? randomRange(85, 150) : randomRange(150, 195);
    const medHistory = randomChoice([
      'None', 'Mild hypertension', 'Type 2 Diabetes', 'Osteoarthritis', 'Asthma history', 'No significant medical history'
    ]);
    const comorbidities = randomChoice([
      'None', 'Hypercholesterolemia', 'Obesity', 'Renal insufficiency mild', 'Anemia', 'Chronic heart failure stable'
    ]);
    return { age, ageUnit: 'Years', gender, weight: Math.round(weight * 10) / 10, height: Math.round(height), medicalHistory: medHistory, comorbidities };
  };

  // Helper to find a terminology term by PT name
  const getTermsByPt = (pt: string) => {
    return dbTerminology.filter(t => t.ptName === pt);
  };

  const reporterNames = [
    'Dr. Angela Miller', 'Dr. David Carter', 'Dr. Sarah Patel', 'Nurse Michael Brown', 'Pharmacist Lisa Green',
    'Dr. Kevin Jones', 'Nurse Karen Smith', 'Pharmacist Thomas Clark', 'Patient self-report', 'Dr. Helen Davis'
  ];

  const reporterTypes = [
    'Physician', 'Physician', 'Physician', 'Other Health Professional', 'Pharmacist', 'Physician',
    'Other Health Professional', 'Pharmacist', 'Consumer', 'Physician'
  ];

  console.log('Generating structured signal reports...');

  // Generate strong signals
  for (const sig of strongSignals) {
    const drug = drugMap[sig.genericName];
    if (!drug) continue;
    const terms = getTermsByPt(sig.ptName);
    if (terms.length === 0) continue;

    for (let i = 0; i < sig.count; i++) {
      const term = randomChoice(terms);
      const patient = createPatientInfo(sig.ageGroup);
      
      // Causality factors
      const temporal = sig.temporal;
      const dechallenge = sig.dechallenge;
      const rechallenge = sig.rechallenge;
      const alternative = sig.alternative ? ['Alternative etiology present'] : [];
      
      // Determine causality category (WHO-UMC rule based)
      let causality = 'Possible';
      let confidence = 0.7;
      if (temporal && dechallenge === 'positive' && rechallenge === 'positive') {
        causality = 'Certain';
        confidence = 0.95;
      } else if (temporal && dechallenge === 'positive') {
        causality = 'Probable';
        confidence = 0.85;
      }

      reportsData.push({
        patient,
        drugId: drug.id,
        termId: term.id,
        reactionFreeText: term.lltName,
        severity: sig.severity,
        seriousness: sig.seriousness,
        outcome: sig.outcome === 'Hospitalized' ? randomChoice(['Hospitalized', 'Recovering', 'Recovered']) : sig.outcome,
        reporterName: randomChoice(reporterNames),
        reporterType: randomChoice(reporterTypes),
        followUp: randomChoice(['Yes', 'No', 'No']),
        notes: `Clinical safety event for suspected drug ${sig.genericName}. Temporal relationship observed.`,
        temporalRelationship: temporal,
        dechallengeResult: dechallenge,
        rechallengeResult: rechallenge,
        alternativeCauses: alternative.join(','),
        causalityAssessment: causality,
        causalityConfidence: confidence,
        causalityReasoning: `Clear temporal link. Positive dechallenge: ${dechallenge === 'positive'}. Positive rechallenge: ${rechallenge === 'positive'}.`
      });
    }
  }

  // Generate moderate signals
  for (const sig of moderateSignals) {
    const drug = drugMap[sig.genericName];
    if (!drug) continue;
    const terms = getTermsByPt(sig.ptName);
    if (terms.length === 0) continue;

    for (let i = 0; i < sig.count; i++) {
      const term = randomChoice(terms);
      const patient = createPatientInfo(sig.ageGroup);
      
      const temporal = sig.temporal;
      const dechallenge = sig.dechallenge;
      const rechallenge = sig.rechallenge;
      const alternative = sig.alternative ? ['Alternative diagnosis suspected'] : [];
      
      let causality = 'Possible';
      let confidence = 0.6;
      if (temporal && dechallenge === 'positive') {
        causality = 'Probable';
        confidence = 0.8;
      }

      reportsData.push({
        patient,
        drugId: drug.id,
        termId: term.id,
        reactionFreeText: term.lltName,
        severity: sig.severity,
        seriousness: sig.seriousness,
        outcome: sig.outcome,
        reporterName: randomChoice(reporterNames),
        reporterType: randomChoice(reporterTypes),
        followUp: randomChoice(['Yes', 'No', 'No']),
        notes: `Adverse reaction reported. Patient monitored following drug withdrawal.`,
        temporalRelationship: temporal,
        dechallengeResult: dechallenge,
        rechallengeResult: rechallenge,
        alternativeCauses: alternative.join(','),
        causalityAssessment: causality,
        causalityConfidence: confidence,
        causalityReasoning: `Temporal relationship is consistent. Dechallenge positive: ${dechallenge === 'positive'}.`
      });
    }
  }

  console.log(`Generated structured signal reports count: ${reportsData.length}. Seeding noise reports to reach 5,000+...`);

  // Fill in random background noise (approx 3,800 reports)
  const remainingCount = 5200 - reportsData.length;
  for (let i = 0; i < remainingCount; i++) {
    // Pick random drug (avoiding strong/moderate drug-reaction pairs if possible, but random is fine as it dilutes)
    const drug = randomChoice(dbDrugs);
    const term = randomChoice(dbTerminology);
    
    // Low probability of temporal relationship or positive dechallenge
    const temporal = randomChoice([true, false, null]);
    const dechallenge = randomChoice(['positive', 'negative', 'not_done', null]);
    const rechallenge = randomChoice(['negative', 'not_done', null]);
    const alternativeCauses = randomChoice(['Yes', 'No']) === 'Yes' ? 'Alternative treatment, underlying viral infection' : '';

    let causality = 'Unlikely';
    let confidence = 0.3;
    if (temporal === true && dechallenge === 'positive') {
      causality = 'Possible';
      confidence = 0.6;
    } else if (temporal === false) {
      causality = 'Unlikely';
      confidence = 0.3;
    } else if (temporal === null) {
      causality = 'Conditional';
      confidence = 0.4;
    }

    reportsData.push({
      patient: createPatientInfo('any'),
      drugId: drug.id,
      termId: term.id,
      reactionFreeText: term.lltName,
      severity: randomChoice(['Mild', 'Moderate', 'Severe']),
      seriousness: randomChoice(['Serious', 'Non-Serious', 'Non-Serious']),
      outcome: randomChoice(['Resolved', 'Resolving', 'Not Resolved', 'Fatal', 'Unknown']),
      reporterName: randomChoice(reporterNames),
      reporterType: randomChoice(reporterTypes),
      followUp: 'No',
      notes: `Spontaneous report of adverse event. Evaluated for causality assessment.`,
      temporalRelationship: temporal,
      dechallengeResult: dechallenge,
      rechallengeResult: rechallenge,
      alternativeCauses,
      causalityAssessment: causality,
      causalityConfidence: confidence,
      causalityReasoning: `Assessable temporal criteria met = ${temporal}. Alternative etiologies = ${alternativeCauses ? 'Yes' : 'No'}.`
    });
  }

  // Seeding the reports in batches of 500 to keep it efficient and stable
  console.log(`Starting bulk insertion of ${reportsData.length} records...`);
  
  const batchSize = 500;
  for (let i = 0; i < reportsData.length; i += batchSize) {
    const batch = reportsData.slice(i, i + batchSize);
    
    await prisma.$transaction(async (tx: any) => {
      for (const item of batch) {
        // Create Patient first
        const pat = await tx.patient.create({
          data: item.patient
        });
        
        // Date: spread over past 24 months, with an upward trend for recent months
        const createdDate = randomDate(new Date(2024, 5, 1), new Date(2026, 5, 5));

        // Create Report
        await tx.aDRReport.create({
          data: {
            patientId: pat.id,
            suspectedDrugId: item.drugId,
            reactionTerminologyId: item.termId,
            reactionFreeText: item.reactionFreeText,
            severity: item.severity,
            seriousness: item.seriousness,
            outcome: item.outcome,
            reporterName: item.reporterName,
            reporterType: item.reporterType,
            followUp: item.followUp,
            notes: item.notes,
            temporalRelationship: item.temporalRelationship,
            dechallengeResult: item.dechallengeResult,
            rechallengeResult: item.rechallengeResult,
            alternativeCauses: item.alternativeCauses,
            causalityAssessment: item.causalityAssessment,
            causalityConfidence: item.causalityConfidence,
            causalityReasoning: item.causalityReasoning,
            reportDate: createdDate,
            createdById: randomChoice(dbUsers).id,
            createdAt: createdDate,
            updatedAt: createdDate
          }
        });
      }
    });
    console.log(`Inserted batch ${i / batchSize + 1} of ${Math.ceil(reportsData.length / batchSize)}`);
  }

  console.log('All reports inserted.');

  // 7. Execute Initial Signal Detection Analysis
  // Since we want the seed command to make everything fully functioning out-of-the-box,
  // we will run the signal detection engine logic here and save results to SignalDetection.
  console.log('Running initial signal detection on seeded data...');
  
  const reports = await prisma.aDRReport.findMany({
    include: {
      suspectedDrug: true,
      reactionTerminology: true
    }
  });

  const N = reports.length;
  
  // Counts maps
  const drugCounts: Record<string, number> = {};
  const eventCounts: Record<string, number> = {};
  const jointCounts: Record<string, number> = {}; // drugId_ptName -> count

  for (const r of reports) {
    const dId = r.suspectedDrugId;
    const pt = r.reactionTerminology.ptName;
    const key = `${dId}_${pt}`;

    drugCounts[dId] = (drugCounts[dId] || 0) + 1;
    eventCounts[pt] = (eventCounts[pt] || 0) + 1;
    jointCounts[key] = (jointCounts[key] || 0) + 1;
  }

  let signalsCount = 0;
  
  // Calculate statistics for each joint pair that has >= 2 cases
  for (const [key, a] of Object.entries(jointCounts)) {
    if (a < 2) continue; // Minimum threshold for signal calculations

    const [drugId, ptName] = key.split('_');
    const drugReports = drugCounts[drugId] || 0;
    const eventReports = eventCounts[ptName] || 0;

    // Contingency table:
    // a = drug + event
    // b = drug + other event = drugReports - a
    // c = event + other drug = eventReports - a
    // d = other drug + other event = N - a - b - c
    const b = drugReports - a;
    const c = eventReports - a;
    const d = N - a - b - c;

    // PRR: (a / (a + b)) / (c / (c + d))
    const p1 = a / (a + b);
    const p2 = c / (c + d);
    let prr = p2 === 0 ? 99.9 : p1 / p2;
    if (isNaN(prr) || !isFinite(prr)) prr = 99.9;
    prr = Math.max(0.01, Math.min(999.9, prr));

    // ROR: (a * d) / (b * c)
    let ror = (b * c) === 0 ? 99.9 : (a * d) / (b * c);
    if (isNaN(ror) || !isFinite(ror)) ror = 99.9;
    ror = Math.max(0.01, Math.min(999.9, ror));

    // Chi-Square with Yates' correction:
    // N * (|a*d - b*c| - N/2)^2 / ((a+b)(c+d)(a+c)(b+d))
    const num = N * Math.pow(Math.max(0, Math.abs(a * d - b * c) - N / 2), 2);
    const den = (a + b) * (c + d) * (a + c) * (b + d);
    let chiSquare = den === 0 ? 0 : num / den;
    if (isNaN(chiSquare)) chiSquare = 0;

    // 95% CI for PRR:
    // SE(ln(PRR)) = sqrt(1/a - 1/(a+b) + 1/c - 1/(c+d))
    let se = Math.sqrt((a > 0 ? 1/a : 0) - (a+b > 0 ? 1/(a+b) : 0) + (c > 0 ? 1/c : 0) - (c+d > 0 ? 1/(c+d) : 0));
    if (isNaN(se) || !isFinite(se)) se = 0;
    
    const lnPrr = Math.log(prr);
    const ciLower = se === 0 ? prr : Math.exp(lnPrr - 1.96 * se);
    const ciUpper = se === 0 ? prr : Math.exp(lnPrr + 1.96 * se);

    // Information Component (IC) with Bayesian shrinkage (prior cell count + 0.5)
    // IC = log2( (a + 0.5)*N / ((a+b+0.5)*(a+c+0.5)) )
    const ic = Math.log2(((a + 0.5) * N) / ((a + b + 0.5) * (a + c + 0.5)));

    // Composite Signal Score: (PRR * ln(a + 1)) + ln(ROR) + chiSquare / 10
    const signalScore = (prr * Math.log(a + 1)) + Math.max(0, Math.log(ror)) + Math.min(5, chiSquare / 10);

    // Evans criteria (standard): PRR >= 2, Chi2 >= 3.84 (p<0.05), Cases >= 3, PRR 95% CI lower limit > 1
    const isStrong = prr >= 2 && chiSquare >= 3.84 && a >= 3 && ciLower > 1;
    const isModerate = prr >= 1.5 && chiSquare >= 2 && a >= 2;
    
    let strength = 'No Signal';
    if (isStrong) strength = 'Strong';
    else if (isModerate) strength = 'Moderate';
    else if (prr > 1) strength = 'Weak';

    if (strength !== 'No Signal') {
      // Create Signal
      // Let's determine trend: random choice of Stable, Increasing, Decreasing
      const trend = randomChoice(['Stable', 'Increasing', 'Stable', 'Increasing', 'Decreasing']);
      
      const sig = await prisma.signalDetection.create({
        data: {
          drugId,
          reactionPtName: ptName,
          prr: Math.round(prr * 100) / 100,
          ror: Math.round(ror * 100) / 100,
          chiSquare: Math.round(chiSquare * 100) / 100,
          ciLower: Math.round(ciLower * 100) / 100,
          ciUpper: Math.round(ciUpper * 100) / 100,
          informationComponent: Math.round(ic * 100) / 100,
          signalScore: Math.round(signalScore * 100) / 100,
          status: 'New',
          strength,
          trend
        }
      });

      // Create history entry
      await prisma.signalHistory.create({
        data: {
          signalId: sig.id,
          previousStatus: 'None',
          newStatus: 'New',
          modifiedById: dbUsers[0].id,
          notes: 'Initial signal detection run after database population.'
        }
      });

      // Create Risk Register for Strong Signals
      if (strength === 'Strong') {
        const severityScore = randomChoice([3, 4, 5]);
        const likelihoodScore = randomChoice([3, 4, 5]);
        const riskScore = severityScore * likelihoodScore;
        const riskCategory = randomChoice([
          'Hepatotoxicity', 'Cardiotoxicity', 'Severe Cutaneous Adverse Reactions (SCAR)', 'Renal Toxicity', 'Metabolic Risk'
        ]);
        
        const rReg = await prisma.riskRegister.create({
          data: {
            signalId: sig.id,
            riskCategory,
            severityScore,
            likelihoodScore,
            riskScore,
            capaDescription: `Perform active surveillance. Update safety labeling for ${drugMap[drugId]?.genericName || 'drug'} regarding ${ptName}. Monitor high-risk patient subpopulations.`,
            capaStatus: 'Open',
            ownerId: dbUsers[1].id // Safety officer
          }
        });

        // Create initial CAPA tracking
        await prisma.capaTracking.create({
          data: {
            riskId: rReg.id,
            actionTaken: 'Escalation to pharmacovigilance safety committee.',
            status: 'Open',
            targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            updatedById: dbUsers[1].id
          }
        });

        // Add local notifications
        await prisma.notification.create({
          data: {
            userId: dbUsers[1].id,
            title: `Strong Signal Detected: ${drugMap[drugId]?.genericName} - ${ptName}`,
            message: `A strong safety signal has been flagged by the detection engine. PRR: ${prr.toFixed(2)}, Cases: ${a}. Risk assessment initiated.`,
            type: 'warning'
          }
        });
      }

      signalsCount++;
    }
  }

  console.log(`Initial signal detection seeded. Detected signals: ${signalsCount}`);
  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
