# GitHub & Vercel Deployment Workflow

## Phase 1: Local Git Setup

### Step 1: Initialize Git Repository
```bash
cd d:\label\pharmacovigilance_dashboard
git init
git config user.name "Your Name"
git config user.email "your.email@example.com"
```

### Step 2: Create .gitignore File
Create `.gitignore` in the root directory with:
```
# Dependencies
node_modules/
.env
.env.local
.env*.local

# Build outputs
dist/
build/
.next/

# Database
*.db
*.sqlite
prisma/dev.db

# Logs
logs/
*.log
npm-debug.log*

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Backend specific
__pycache__/
*.pyc
*.pyo
venv/
.pytest_cache/

# Frontend specific
.turbo/
coverage/

# Legacy Flask
legacy_flask/__pycache__/
legacy_flask/instance/
```

### Step 3: Create .gitattributes File
Create `.gitattributes` in root:
```
# Auto-detect text files
* text=auto

# Ensure scripts use LF
*.sh eol=lf
*.js eol=lf
*.ts eol=lf

# Windows-specific files
*.bat eol=crlf
*.ps1 eol=crlf
```

### Step 4: Initial Git Commit
```bash
git add .
git commit -m "Initial commit: pharmacovigilance dashboard project"
```

---

## Phase 2: GitHub Repository Setup

### Step 5: Create GitHub Remote Repository
1. Go to [GitHub](https://github.com/new)
2. Create new repository named: `pharmacovigilance-dashboard`
3. Choose: **Public** (for Vercel integration)
4. Do NOT initialize with README (you have one)
5. Click "Create repository"

### Step 6: Connect Local to Remote
```bash
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/pharmacovigilance-dashboard.git
git push -u origin main
```

---

## Phase 3: Environment Configuration

### Step 7: Create Environment Files

#### Backend - Create `backend/.env.example`
```
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/pharmacovigilance_dev"

# JWT
JWT_SECRET="your-secret-key-here-min-32-chars"
JWT_EXPIRY="7d"

# Server
NODE_ENV="development"
PORT=3000
CORS_ORIGIN="http://localhost:5173"

# Email (optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_DIR="./uploads"
```

#### Frontend - Create `frontend/.env.example`
```
VITE_API_URL="http://localhost:3000/api"
VITE_APP_NAME="Pharmacovigilance Dashboard"
```

#### Root - Create `.env.example`
```
# Deployment
VERCEL_PROJECT_ID="your-vercel-project-id"
```

### Step 8: Commit Environment Templates
```bash
git add .env.example backend/.env.example frontend/.env.example .gitignore .gitattributes
git commit -m "Add environment configuration templates"
git push
```

---

## Phase 4: GitHub Actions CI/CD Pipeline

### Step 9: Create GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Vercel

on:
  push:
    branches:
      - main
      - develop
  pull_request:
    branches:
      - main
      - develop

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x]
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      
      # Backend Tests
      - name: Install backend dependencies
        run: cd backend && npm install
      
      - name: Run backend linting
        run: cd backend && npm run lint --if-present
      
      - name: Run backend tests
        run: cd backend && npm test --if-present
      
      # Frontend Tests
      - name: Install frontend dependencies
        run: cd frontend && npm install
      
      - name: Run frontend linting
        run: cd frontend && npm run lint
      
      - name: Build frontend
        run: cd frontend && npm run build
      
  deploy-to-vercel:
    needs: lint-and-test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Vercel
        uses: vercel/action@master
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

### Step 10: Create Additional Workflows

Create `.github/workflows/backend-tests.yml`:
```yaml
name: Backend Tests

on:
  push:
    branches: [main, develop]
    paths:
      - 'backend/**'
  pull_request:
    branches: [main, develop]
    paths:
      - 'backend/**'

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: pharmacovigilance_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: 18.x
          cache: 'npm'
      
      - run: cd backend && npm install
      
      - name: Setup Database
        run: cd backend && npx prisma migrate dev --name init
        env:
          DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/pharmacovigilance_test"
      
      - run: cd backend && npm test
```

Create `.github/workflows/frontend-tests.yml`:
```yaml
name: Frontend Tests

on:
  push:
    branches: [main, develop]
    paths:
      - 'frontend/**'
  pull_request:
    branches: [main, develop]
    paths:
      - 'frontend/**'

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: 18.x
          cache: 'npm'
      
      - run: cd frontend && npm install
      - run: cd frontend && npm run lint
      - run: cd frontend && npm test --if-present
```

### Step 11: Commit GitHub Actions
```bash
git add .github/
git commit -m "Add GitHub Actions CI/CD workflows"
git push
```

---

## Phase 5: Vercel Configuration

### Step 12: Create Vercel Configuration Files

#### Root - Create `vercel.json`
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "npm run build",
  "outputDirectory": "frontend/dist",
  "framework": "vite",
  "env": [
    "VITE_API_URL",
    "DATABASE_URL",
    "JWT_SECRET"
  ],
  "functions": {
    "backend/**/*.ts": {
      "runtime": "node18.x",
      "memory": 1024,
      "maxDuration": 60
    }
  }
}
```

#### Backend - Create `backend/vercel.json`
```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/index.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/index.ts"
    }
  ],
  "env": {
    "NODE_ENV": "production",
    "DATABASE_URL": "@database_url",
    "JWT_SECRET": "@jwt_secret"
  }
}
```

#### Frontend - Create `frontend/vercel.json`
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "env": [
    "VITE_API_URL"
  ],
  "routes": [
    {
      "src": "/(?!api/.*)",
      "dest": "/index.html"
    }
  ]
}
```

### Step 13: Commit Vercel Config
```bash
git add vercel.json backend/vercel.json frontend/vercel.json
git commit -m "Add Vercel deployment configuration"
git push
```

---

## Phase 6: Vercel Setup & Deployment

### Step 14: Connect Repository to Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New" → "Project"
3. Select "Import Git Repository"
4. Choose your GitHub repository: `pharmacovigilance-dashboard`
5. Click "Import"

### Step 15: Configure Project Settings

**In Vercel Dashboard:**
1. Go to "Settings" → "Environment Variables"
2. Add the following secrets:
   - `VITE_API_URL` = `https://api.your-domain.com` (or vercel backend URL)
   - `DATABASE_URL` = `postgresql://...` (your production DB)
   - `JWT_SECRET` = `your-secret-key-here-min-32-chars`
   - `SMTP_HOST` = `smtp.gmail.com`
   - `SMTP_PORT` = `587`
   - `SMTP_USER` = `your-email@gmail.com`
   - `SMTP_PASS` = `your-app-password`

3. Go to "Settings" → "Build & Development Settings":
   - Framework: **Vite**
   - Build Command: `cd frontend && npm run build`
   - Output Directory: `frontend/dist`

4. Go to "Deployments" tab to trigger initial deployment

### Step 16: Configure GitHub Secrets for Actions

1. Go to GitHub repository
2. Navigate to "Settings" → "Secrets and variables" → "Actions"
3. Add New Repository Secrets:
   - `VERCEL_TOKEN`: Get from [Vercel Account Settings](https://vercel.com/account/tokens)
   - `VERCEL_ORG_ID`: Get from Vercel dashboard URL (vercel.com/organizations/{org_id})
   - `VERCEL_PROJECT_ID`: Get from project settings in Vercel

---

## Phase 7: Database & Backend Deployment

### Step 17: Set Up Production Database

**Option A - Using Railway, Render, or similar:**
1. Create PostgreSQL instance
2. Update `DATABASE_URL` in Vercel environment
3. Run migrations: `npx prisma migrate deploy`

**Option B - Using Vercel Postgres:**
1. Go to Vercel dashboard
2. Navigate to "Storage" → "Create Database" → "Postgres"
3. Copy connection string to `DATABASE_URL`
4. Run migrations via CLI or API

### Step 18: Deploy Backend API

**Option A - Deploy backend separately (Recommended):**
1. Create new Vercel project for backend
2. Connect same GitHub repository
3. Set Root Directory: `backend`
4. Add same environment variables
5. Deploy

**Option B - Use Vercel Serverless Functions:**
1. Create `api/` directory in root or `vercel/functions/`
2. Backend endpoints automatically deployed as serverless functions

---

## Phase 8: Testing & Validation

### Step 19: Verify Deployments
```bash
# Test on main branch push
git checkout main
echo "// test update" >> DEPLOYMENT_GUIDE.md
git add DEPLOYMENT_GUIDE.md
git commit -m "Test CI/CD pipeline"
git push

# Monitor:
# - GitHub Actions: repo → Actions tab
# - Vercel Deployments: dashboard → Deployments
```

### Step 20: Set Branch Protection Rules

In GitHub repository:
1. Go to "Settings" → "Branches"
2. Under "Branch protection rules", click "Add rule"
3. Configure:
   - Pattern name: `main`
   - ✅ Require status checks to pass before merging
   - ✅ Require pull request reviews (at least 1)
   - ✅ Dismiss stale pull request approvals
   - ✅ Require branches to be up to date

---

## Phase 9: Custom Domain (Optional)

### Step 21: Add Custom Domain
1. Go to Vercel project settings → "Domains"
2. Enter your domain: `yourdomain.com`
3. Add DNS records (Vercel will provide exact values)
4. Wait for DNS propagation (24-48 hours)

### Step 22: Enable HTTPS
- Vercel automatically provides free SSL certificate
- Verify in "Domains" section

---

## Phase 10: Monitoring & Maintenance

### Step 23: Set Up Monitoring

Create `.github/workflows/security.yml`:
```yaml
name: Security & Dependency Checks

on:
  schedule:
    - cron: '0 0 * * 0'  # Weekly
  push:
    branches: [main]

jobs:
  security:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Run npm audit
        run: npm audit --audit-level=moderate || true
      
      - name: Dependency check
        uses: actions/dependency-review-action@v3
        if: github.event_name == 'pull_request'
```

### Step 24: Create Deployment Documentation

Create `DEPLOYMENT.md` with:
- Deployment architecture diagram
- Troubleshooting guide
- Rollback procedures
- Environment variables reference
- Backup & recovery procedures

---

## Deployment Checklist

- [ ] Phase 1: Git initialized locally
- [ ] Phase 2: Repository pushed to GitHub
- [ ] Phase 3: Environment files created
- [ ] Phase 4: GitHub Actions workflows set up
- [ ] Phase 5: Vercel config files added
- [ ] Phase 6: Project connected to Vercel
- [ ] Phase 7: Database configured
- [ ] Phase 8: Test deployment successful
- [ ] Phase 9: Custom domain configured (optional)
- [ ] Phase 10: Monitoring in place

---

## Quick Reference Commands

```bash
# Git
git clone https://github.com/YOUR_USERNAME/pharmacovigilance-dashboard.git
git checkout develop
git checkout -b feature/feature-name
git push origin feature/feature-name

# Vercel CLI (for local testing)
npm install -g vercel
vercel login
vercel deploy
vercel --prod

# Database
npx prisma migrate dev --name your_migration_name
npx prisma migrate deploy  # Production
npx prisma db seed         # Run seed script
```

---

## Troubleshooting

### Build Fails on Vercel
- Check build logs in Vercel dashboard
- Verify environment variables are set
- Ensure package.json scripts are correct

### GitHub Actions Fails
- Check Actions tab for error logs
- Verify secrets are set correctly
- Run locally: `npm run build` and `npm test`

### Database Connection Issues
- Verify DATABASE_URL in Vercel env
- Check database service is running
- Test connection: `npx prisma db push --skip-generate`

### Deployment Stuck
- Check for infinite loops in build scripts
- Increase build timeout in vercel.json
- Cancel and retry deployment

