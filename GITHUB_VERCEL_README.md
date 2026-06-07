# 🚀 GitHub & Vercel Deployment Setup

Complete step-by-step guide for deploying the Pharmacovigilance Dashboard to GitHub and Vercel.

## 📋 Quick Overview

This deployment setup includes:
- **GitHub** - Version control & CI/CD
- **Vercel** - Frontend & Backend hosting
- **Automated Testing** - Runs on every push
- **Automated Deployment** - Deploy to production automatically
- **Security Scanning** - Dependency & code quality checks

## 🎯 Prerequisites

Before starting, ensure you have:
- [ ] GitHub account created
- [ ] Vercel account created
- [ ] Git installed locally
- [ ] Node.js 18+ installed
- [ ] PostgreSQL database ready (or using Vercel Postgres)

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) | Complete step-by-step deployment workflow |
| [GITHUB_SECRETS_SETUP.md](./GITHUB_SECRETS_SETUP.md) | How to configure GitHub secrets |
| [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) | Common issues and solutions |

## ⚡ Quick Start (5 Steps)

### 1. Initialize Git Locally
```bash
cd d:\label\pharmacovigilance_dashboard
git init
git config user.name "Your Name"
git config user.email "your.email@example.com"
git add .
git commit -m "Initial commit: pharmacovigilance dashboard"
```

### 2. Create GitHub Repository
- Go to [GitHub](https://github.com/new)
- Name: `pharmacovigilance-dashboard`
- Make it **Public**
- Do not initialize with README
- Click "Create repository"

### 3. Push to GitHub
```bash
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/pharmacovigilance-dashboard.git
git push -u origin main
```

### 4. Connect to Vercel
- Go to [Vercel Dashboard](https://vercel.com/dashboard)
- Click "Add New" → "Project"
- Select your GitHub repository
- Configure build settings:
  - **Frontend Root Directory**: `frontend`
  - **Build Command**: `npm run build`
  - **Output Directory**: `dist`

### 5. Add Secrets to GitHub
- Go to repo **Settings** → **Secrets and variables** → **Actions**
- Follow [GITHUB_SECRETS_SETUP.md](./GITHUB_SECRETS_SETUP.md)

## 📁 Configuration Files Structure

```
pharmacovigilance_dashboard/
├── .gitignore              ✓ Git ignore patterns
├── .gitattributes          ✓ Line ending config
├── .github/
│   └── workflows/
│       ├── deploy.yml      ✓ Main CI/CD pipeline
│       ├── backend-tests.yml
│       ├── frontend-tests.yml
│       └── security.yml    ✓ Security scanning
├── backend/
│   ├── vercel.json         ✓ Backend deployment config
│   └── .env.example        ✓ Backend env template
├── frontend/
│   ├── vercel.json         ✓ Frontend deployment config
│   └── .env.example        ✓ Frontend env template
├── vercel.json             ✓ Root Vercel config
├── DEPLOYMENT_GUIDE.md     ✓ Full step-by-step guide
├── GITHUB_SECRETS_SETUP.md ✓ Secrets configuration
└── TROUBLESHOOTING.md      ✓ Common issues
```

## 🔄 Deployment Workflow

```
Your Code
    ↓
Git Push to GitHub
    ↓
GitHub Actions Triggered
    ├── Run Linting
    ├── Run Tests
    └── Build Project
    ↓
Tests Pass? → YES → Deploy to Vercel
    ↓
Website Live! ✅
```

## 📊 GitHub Actions Workflows

### deploy.yml
- Triggers on push to `main` or `develop`
- Runs tests for backend & frontend
- Deploys to Vercel on success
- **Run time**: ~5-10 minutes

### backend-tests.yml
- Runs whenever backend code changes
- Sets up PostgreSQL for testing
- Runs database migrations
- Uploads coverage reports

### frontend-tests.yml
- Runs whenever frontend code changes
- Lints code
- Builds project
- Runs unit tests

### security.yml
- Runs weekly + on push to main
- Scans dependencies for vulnerabilities
- Runs CodeQL analysis
- Checks for supply chain attacks

## 🔐 Environment Variables

### Required Secrets (GitHub)
- `VERCEL_TOKEN` - Vercel API token
- `VERCEL_ORG_ID` - Vercel organization ID
- `VERCEL_PROJECT_ID_FRONTEND` - Frontend project ID
- `VERCEL_PROJECT_ID_BACKEND` - Backend project ID
- `DATABASE_URL` - Production database URL
- `JWT_SECRET` - JWT signing secret
- `VITE_API_URL` - Backend API URL

### Optional Secrets (Email)
- `SMTP_HOST` - Email SMTP server
- `SMTP_PORT` - SMTP port
- `SMTP_USER` - Email username
- `SMTP_PASS` - Email password

## 🎮 Common Commands

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/pharmacovigilance-dashboard.git

# Create a feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: description of changes"

# Push to GitHub
git push origin feature/your-feature-name

# Create Pull Request on GitHub
# → Automated tests will run
# → Review required before merge
# → Merge to main to deploy

# Vercel CLI (for local testing)
npm install -g vercel
vercel login
vercel deploy      # Preview deployment
vercel --prod      # Production deployment
```

## 📈 Monitoring Deployments

### GitHub Actions
- Go to **Actions** tab in your repository
- View workflow runs
- Click run to see detailed logs
- Check for failures

### Vercel Deployments
- Go to [Vercel Dashboard](https://vercel.com/dashboard)
- Click your project
- View **Deployments** tab
- Check build logs
- View analytics

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] `.gitignore` prevents tracking `.env` files
- [ ] `.github/workflows/` created with all 4 workflows
- [ ] `backend/vercel.json` and `frontend/vercel.json` created
- [ ] All environment templates (`.env.example`) created
- [ ] GitHub repository connected
- [ ] Vercel projects created (frontend + backend)
- [ ] GitHub secrets configured
- [ ] Initial commit pushed to main
- [ ] GitHub Actions ran successfully
- [ ] Vercel deployment completed
- [ ] Website accessible at Vercel URL

## 🚨 Important Notes

### Database
- Local development: Use `.env` file (not in git)
- Production: Set `DATABASE_URL` in GitHub secrets
- Vercel Postgres: Recommended for serverless backend

### Environment Files
- **Never commit** `.env` files
- Always use `.env.example` templates
- Copy example files for local development:
  ```bash
  cp backend/.env.example backend/.env
  cp frontend/.env.example frontend/.env
  ```

### Secrets Management
- GitHub secrets are **not visible** in logs
- Rotate tokens annually
- Never share secrets publicly
- Use branch protection rules on `main`

## 🔗 Useful Links

- [GitHub Documentation](https://docs.github.com)
- [Vercel Documentation](https://vercel.com/docs)
- [GitHub Actions Guide](https://docs.github.com/en/actions)
- [Vercel Deployment Guide](https://vercel.com/docs/get-started)
- [PostgreSQL Connection](https://www.postgresql.org/docs/current/libpq-envars.html)

## 📞 Support

For issues during deployment:
1. Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
2. View GitHub Actions logs
3. Check Vercel deployment logs
4. Review application logs

## 🎓 Next Steps

After deployment is working:

1. **Set up custom domain** in Vercel
2. **Enable analytics** to monitor usage
3. **Set up error tracking** (e.g., Sentry)
4. **Configure monitoring** (e.g., UptimeRobot)
5. **Plan backup strategy** for database
6. **Document team processes** for deployments
7. **Set up staging environment** for testing

## 📝 Notes

- All configuration files are included in this repository
- Follow DEPLOYMENT_GUIDE.md for detailed step-by-step instructions
- GitHub Actions will run automatically after each push
- Vercel deployments are triggered by GitHub Actions
- Rollback is as simple as reverting a commit and pushing

---

**Last Updated**: 2026-06-07
**Status**: Ready for Implementation
