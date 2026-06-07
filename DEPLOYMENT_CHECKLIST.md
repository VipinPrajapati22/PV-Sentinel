# 📋 Deployment Checklist

Use this checklist to ensure all deployment steps are completed correctly.

## ✅ Pre-Deployment (Local Setup)

- [ ] Git installed and configured
- [ ] Node.js 18+ installed
- [ ] PostgreSQL database available (local or remote)
- [ ] All dependencies installed (`npm install` in both backend and frontend)
- [ ] Local environment files created (`.env` files)
- [ ] Local build works (`npm run build` in both directories)
- [ ] Local tests pass (`npm test` in both directories)

## ✅ Phase 1: Git Repository Setup

- [ ] Git initialized: `git init`
- [ ] Git config set: `git config user.name` and `git config user.email`
- [ ] `.gitignore` created and committed
- [ ] `.gitattributes` created and committed
- [ ] Environment examples created:
  - [ ] `backend/.env.example`
  - [ ] `frontend/.env.example`
  - [ ] `GITHUB_SECRETS_SETUP.md` for reference
- [ ] Initial commit made: `git commit -m "Initial commit"`

## ✅ Phase 2: GitHub Repository Creation

- [ ] GitHub account created and logged in
- [ ] New repository created: `pharmacovigilance-dashboard`
- [ ] Repository set to **Public** (required for Vercel)
- [ ] Repository not initialized with README
- [ ] Remote added: `git remote add origin https://github.com/USERNAME/...`
- [ ] Branch renamed to main: `git branch -M main`
- [ ] Initial push completed: `git push -u origin main`
- [ ] Repository accessible on GitHub at `https://github.com/USERNAME/pharmacovigilance-dashboard`

## ✅ Phase 3: GitHub Configuration Files

- [ ] Vercel config files created:
  - [ ] `vercel.json` (root)
  - [ ] `backend/vercel.json`
  - [ ] `frontend/vercel.json`
- [ ] GitHub Actions workflow files created:
  - [ ] `.github/workflows/deploy.yml`
  - [ ] `.github/workflows/backend-tests.yml`
  - [ ] `.github/workflows/frontend-tests.yml`
  - [ ] `.github/workflows/security.yml`
- [ ] All config files committed and pushed: `git push`
- [ ] GitHub repository updated with new files

## ✅ Phase 4: Vercel Project Setup (Frontend)

- [ ] Vercel account created and logged in
- [ ] New Vercel project created for frontend
- [ ] GitHub repository connected to Vercel
- [ ] Build settings configured:
  - [ ] Framework: **Vite**
  - [ ] Build Command: `npm run build`
  - [ ] Output Directory: `dist`
  - [ ] Root Directory: `frontend`
- [ ] Environment variables added:
  - [ ] `VITE_API_URL` = your backend URL
  - [ ] Any other frontend vars from `frontend/.env.example`
- [ ] Initial deployment triggered and successful
- [ ] Frontend accessible at Vercel URL

## ✅ Phase 5: Vercel Project Setup (Backend)

- [ ] New Vercel project created for backend (or using serverless functions)
- [ ] GitHub repository connected (same repo, different project)
- [ ] Build settings configured:
  - [ ] Root Directory: `backend`
  - [ ] Build Command: `npm run build` or equivalent
- [ ] Environment variables added:
  - [ ] `DATABASE_URL` = production database connection
  - [ ] `JWT_SECRET` = secure random token (32+ chars)
  - [ ] `NODE_ENV` = `production`
  - [ ] All vars from `backend/.env.example`
- [ ] Database migrations configured
- [ ] Initial deployment triggered and successful
- [ ] Backend API accessible at Vercel URL

## ✅ Phase 6: GitHub Secrets Configuration

**Note**: Do this in GitHub web interface

- [ ] Vercel secrets added:
  - [ ] `VERCEL_TOKEN` - from Vercel settings
  - [ ] `VERCEL_ORG_ID` - from Vercel dashboard URL
  - [ ] `VERCEL_PROJECT_ID_FRONTEND` - from Vercel project
  - [ ] `VERCEL_PROJECT_ID_BACKEND` - from Vercel project
- [ ] Database secrets added:
  - [ ] `DATABASE_URL` - production DB connection
- [ ] Application secrets added:
  - [ ] `JWT_SECRET` - JWT signing secret (32+ chars)
  - [ ] `VITE_API_URL` - backend API URL
- [ ] Email secrets added (if needed):
  - [ ] `SMTP_HOST`
  - [ ] `SMTP_PORT`
  - [ ] `SMTP_USER`
  - [ ] `SMTP_PASS`
- [ ] Secrets verified in GitHub:
  - [ ] Settings → Secrets and variables → Actions
  - [ ] All secrets showing in list (masked)

## ✅ Phase 7: Test Deployment Pipeline

- [ ] Make test commit:
  ```bash
  echo "# Test deployment" >> DEPLOYMENT_TEST.md
  git add DEPLOYMENT_TEST.md
  git commit -m "test: trigger CI/CD pipeline"
  git push
  ```
- [ ] GitHub Actions workflow triggered:
  - [ ] Go to Actions tab
  - [ ] See workflow run
  - [ ] Workflow completed without errors
- [ ] Backend tests passed (if tests exist)
- [ ] Frontend tests passed (if tests exist)
- [ ] Build successful
- [ ] Vercel deployment triggered
- [ ] Vercel deployment completed
- [ ] Website accessible and functional

## ✅ Phase 8: Production Verification

**Before considering deployment complete:**

- [ ] Frontend loads without errors
- [ ] Can authenticate to backend (if required)
- [ ] API calls working correctly
- [ ] Database operations functioning
- [ ] No console errors in browser DevTools
- [ ] No errors in Vercel logs
- [ ] No errors in GitHub Actions logs
- [ ] HTTPS working (green lock icon)
- [ ] Performance acceptable (< 3s load time)

## ✅ Phase 9: Security Setup

- [ ] Branch protection rules configured:
  - [ ] `main` branch requires pull request review
  - [ ] Require status checks to pass
  - [ ] Require branches to be up to date
- [ ] GitHub collaborators configured (if team)
- [ ] Secrets rotation policy established
- [ ] Backup strategy configured
- [ ] Monitoring/alerting setup (optional)

## ✅ Phase 10: Documentation & Cleanup

- [ ] `DEPLOYMENT_GUIDE.md` - reviewed and up-to-date
- [ ] `GITHUB_SECRETS_SETUP.md` - saved for reference
- [ ] `TROUBLESHOOTING.md` - bookmarked for reference
- [ ] `GITHUB_VERCEL_README.md` - reviewed
- [ ] Test file removed if created: `git rm DEPLOYMENT_TEST.md`
- [ ] Team notified of deployment process
- [ ] Documentation shared with team

## 🚀 Post-Deployment

- [ ] Monitor first 24 hours for errors
- [ ] Check Vercel Analytics
- [ ] Review GitHub Actions logs
- [ ] Set up monitoring/alerting
- [ ] Plan custom domain configuration
- [ ] Consider staging environment
- [ ] Document any team processes

## 🎯 Quick Verification Commands

Run these to verify deployment:

```bash
# Verify git history
git log --oneline

# Verify remote
git remote -v

# Check GitHub Actions status
# Visit: https://github.com/USERNAME/pharmacovigilance-dashboard/actions

# Check Vercel deployment
# Visit: https://vercel.com/dashboard

# Test API (if backend deployed)
curl https://your-backend-url.vercel.app/api/health
```

## 📞 Need Help?

If any step fails:
1. Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
2. Review [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
3. Check GitHub Actions logs
4. Check Vercel build logs
5. Review [GITHUB_SECRETS_SETUP.md](./GITHUB_SECRETS_SETUP.md)

## ✨ Final Status

- [ ] All checkboxes above completed
- [ ] Application deployed and accessible
- [ ] Team can push to main to trigger deployments
- [ ] Rollback procedure documented
- [ ] Monitoring in place

**Deployment Date**: ___________
**Deployed By**: ___________
**Status**: ⚪ In Progress | 🟡 Ready | 🟢 Complete | 🔴 Issues

---

**Print this checklist and keep it handy during deployment!**
