# PV Sentinel – Pharmacovigilance Surveillance & Signal Detection System

A production-ready full-stack pharmacovigilance platform designed for pharmacovigilance professionals, regulatory teams, healthcare providers, researchers, and pharmacy students. PV Sentinel helps collect, monitor, analyze, and manage adverse drug reaction (ADR) reports, detect potential safety signals, assess causality, and support regulatory pharmacovigilance workflows.

---

## Tech Stack

**Frontend:** React, Vite, Tailwind CSS, Framer Motion, Recharts

**Backend:** Node.js, Express.js, JWT Authentication, Multer, SheetJS

**Database:** MongoDB Atlas with Mongoose Schemas

**Exports:** CSV, Excel, PDF Safety Reports, Signal Detection Reports

---

## Project Structure

```text
client/
  src/

server/
  src/
    config/
    controllers/
    middleware/
    models/
    routes/
    seed/
    services/
    utils/
```

---

## Quick Start

```bash
npm install
npm run dev
```

Frontend: http://localhost:5173

Backend: http://localhost:5000

The application automatically runs in Demo Mode when MONGO_URI is not configured. Demo Mode loads realistic pharmacovigilance datasets for evaluation and academic demonstrations.

---

## Demo Accounts

**Admin**

```text
admin@pvsentinel.local
Admin@123
```

**Safety Officer**

```text
safety@pvsentinel.local
Safety@123
```

**Healthcare Professional**

```text
hcp@pvsentinel.local
HCP@123
```

**Reporter/User**

```text
user@pvsentinel.local
User@123
```

---

## MongoDB Atlas Setup

1. Create a MongoDB Atlas cluster.
2. Create a database user and whitelist your IP address.
3. Copy `.env.example` to `server/.env`.
4. Configure:

```env
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/pv_sentinel

DEMO_MODE=false

JWT_SECRET=<long-random-secret>

CLIENT_URL=http://localhost:5173
```

5. Seed the database:

```bash
npm run seed
```

---

## API Documentation

### Authentication

```http
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

### ADR Reports

```http
POST /api/adr/report
GET  /api/adr/reports
GET  /api/adr/:id
PUT  /api/adr/:id
DELETE /api/adr/:id
```

### Signal Detection

```http
GET  /api/signals
POST /api/signals/analyze
GET  /api/signals/:id
POST /api/signals/validate
```

### Drug Safety Database

```http
GET    /api/drugs
POST   /api/drugs
PUT    /api/drugs/:id
DELETE /api/drugs/:id
```

### Causality Assessment

```http
POST /api/causality/naranjo
POST /api/causality/who-umc
GET  /api/causality/history
```

### Case Management

```http
POST /api/cases/create
GET  /api/cases
PUT  /api/cases/:id
GET  /api/cases/export
```

### Excel Import

```http
POST /api/excel/upload
```

Multipart field:

```text
file
```

Body:

```text
type=adr|drugs|signals|cases
import=true|false
```

### Analytics

```http
GET /api/dashboard/analytics
GET /api/dashboard/trends
GET /api/dashboard/safety-metrics
```

Use:

```text
Authorization: Bearer <token>
```

for protected endpoints.

---

## Key Features

* Adverse Drug Reaction (ADR) Reporting
* Individual Case Safety Report (ICSR) Management
* WHO-UMC Causality Assessment
* Naranjo Algorithm Assessment
* Signal Detection Dashboard
* Seriousness Classification
* Expectedness Assessment
* Duplicate Case Detection
* Drug-Reaction Trend Analysis
* Safety Signal Monitoring
* Regulatory Reporting Support
* CSV, Excel, and PDF Export
* Role-Based Access Control

---

## Seed Data

The project generates:

* 100 Drug Safety Records
* 50 ADR Reports
* 30 Signal Detection Cases
* 25 MedDRA SOC/PT/LLT Terms
* 20 Serious Adverse Event Reports
* 15 Validated Safety Signals
* 10 Risk Management Plan Entries

### Included Examples

* Stevens-Johnson Syndrome associated with Carbamazepine
* Hepatotoxicity associated with Paracetamol overdose
* Anaphylaxis following Penicillin administration
* Bleeding events with Warfarin
* QT Prolongation associated with Azithromycin
* Tendon rupture associated with Ciprofloxacin
* Rhabdomyolysis associated with Statins

---

## Deployment

### Frontend on Vercel

Set root directory:

```text
client
```

Build command:

```bash
npm run build
```

Output directory:

```text
dist
```

Environment Variable:

```env
VITE_API_URL=https://your-render-service.onrender.com/api
```

---

### Backend on Render

Set root directory:

```text
server
```

Build command:

```bash
npm install
```

Start command:

```bash
npm start
```

Add all environment variables from `.env.example`.

Set:

```env
CLIENT_URL=https://your-vercel-app.vercel.app
```

---

## Regulatory Standards Supported

* WHO Pharmacovigilance Guidelines
* WHO-UMC Causality Assessment
* MedDRA Terminology Structure
* ICH E2B(R3) Concepts
* Individual Case Safety Reporting (ICSR)
* Good Pharmacovigilance Practices (GVP)

---

## Notes for Academic Use

PV Sentinel is designed for pharmacovigilance education, research projects, portfolio demonstrations, and learning purposes. It is not intended to replace validated regulatory pharmacovigilance systems, clinical judgment, official safety databases, or national reporting authorities. All generated data in Demo Mode is fictional and intended solely for training and demonstration.
