# 🔧 Troubleshooting Guide

Common issues and their solutions during GitHub and Vercel deployment.

## GitHub Issues

### Issue: "fatal: not a git repository"
**Problem**: Git is not initialized in your project
```bash
# Solution:
cd d:\label\pharmacovigilance_dashboard
git init
git config user.name "Your Name"
git config user.email "your.email@example.com"
git add .
git commit -m "Initial commit"
```

### Issue: "ERROR: fatal: could not read Username"
**Problem**: Git authentication failed
```bash
# Solution 1: Create Personal Access Token (Recommended)
# 1. Go to https://github.com/settings/tokens
# 2. Click "Generate new token" → "Generate new token (classic)"
# 3. Select: repo, workflow, write:packages
# 4. Copy token
# 5. When pushing, use token as password:
git push
# Username: YOUR_USERNAME
# Password: PASTE_TOKEN_HERE

# Solution 2: Set up SSH key
ssh-keygen -t ed25519 -C "your.email@github.com"
# Add public key to https://github.com/settings/keys
```

### Issue: ".env file committed to git"
**Problem**: `.env` file with secrets is in repository
```bash
# Solution:
git rm --cached .env backend/.env frontend/.env
git commit -m "Remove env files from git"
git push

# Then add to .gitignore:
echo ".env" >> .gitignore
echo "backend/.env" >> .gitignore
echo "frontend/.env" >> .gitignore
git add .gitignore
git commit -m "Update gitignore"
git push

# WARNING: Rotate all secrets if exposed!
```

### Issue: GitHub Actions workflow not running
**Problem**: Workflow file not detected or disabled
```bash
# Solutions:
# 1. Check file is in correct location:
#    .github/workflows/deploy.yml

# 2. Verify YAML syntax:
#    - No tabs (use 2 spaces)
#    - Correct indentation
#    - No special characters

# 3. Check if workflows are enabled:
#    Repository → Settings → Actions → General
#    → "Actions permissions" should be "Allow all actions"

# 4. Commit and push the workflow file:
git add .github/workflows/
git commit -m "Add GitHub Actions workflows"
git push
```

### Issue: "Permissions denied" in Actions
**Problem**: Workflow lacks required permissions
```bash
# Solution: Update workflow with permissions:
# At the top of .github/workflows/yml file:
permissions:
  contents: read
  packages: write
  checks: write
  pull-requests: write
```

### Issue: "Secret not found" in Actions logs
**Problem**: GitHub secret name doesn't match
```bash
# Solutions:
# 1. Check secret name matches EXACTLY (case-sensitive)
# 2. Verify in Settings → Secrets and variables → Actions
# 3. Add secret if missing
# 4. Re-run workflow after adding secret
```

## Vercel Issues

### Issue: "Build failed" on Vercel
**Problem**: Build command failed
```bash
# Solutions:
# 1. Check Vercel build logs:
#    Vercel Dashboard → Deployments → Click failed deployment

# 2. Verify build command is correct:
#    For React/Vite: npm run build
#    For Next.js: next build

# 3. Check dependencies are installed:
npm install  # Run locally first

# 4. Verify output directory exists:
#    For Vite: dist/
#    For Next.js: .next/

# 5. Test build locally:
npm run build

# 6. Check environment variables:
#    Vercel Dashboard → Settings → Environment Variables
```

### Issue: "Cannot find module" in Vercel build
**Problem**: Dependency not installed
```bash
# Solution 1: Install missing package
npm install package-name

# Solution 2: Check package.json
# Ensure package is listed in "dependencies", not "devDependencies"

# Solution 3: Clear Vercel cache
# Vercel Dashboard → Settings → Git → Deployments
# Scroll to "Deployment Hooks" and re-trigger

# Solution 4: Check Node version
# Vercel Dashboard → Settings → Build & Development
# Verify Node.js version matches your project
```

### Issue: "Environment variable undefined"
**Problem**: Env var not set in Vercel
```bash
# Solutions:
# 1. Add in Vercel Dashboard:
#    Settings → Environment Variables
#    Add each variable for: Production, Preview, Development

# 2. Verify variable names match code:
#    Code: process.env.DATABASE_URL
#    Vercel: DATABASE_URL

# 3. For frontend env vars, must start with VITE_:
#    Vercel: VITE_API_URL
#    Code: import.meta.env.VITE_API_URL

# 4. Redeploy after adding variables:
#    Deployments → Redeploy

# 5. Check variable is not empty:
#    Vercel UI shows the value (masked for secrets)
```

### Issue: "Deployment timeout"
**Problem**: Build takes too long
```bash
# Solutions:
# 1. Optimize dependencies:
npm audit
npm audit fix

# 2. Check for large files:
du -sh node_modules/
# Remove unnecessary packages

# 3. Increase timeout in vercel.json:
{
  "buildCommand": "npm run build",
  "functions": {
    "api/**/*.js": {
      "maxDuration": 60
    }
  }
}

# 4. Split into multiple projects:
#    Frontend on Vercel
#    Backend API on separate Vercel project
```

### Issue: "Cannot GET /" (404 error)
**Problem**: Frontend routing not configured
```bash
# Solutions for Vite/React:
# Add to frontend/vercel.json:
{
  "routes": [
    {
      "src": "/(?!api/.*)",
      "dest": "/index.html"
    }
  ]
}

# Solutions for Next.js:
# Already handled by framework, verify pages exist
```

### Issue: "Backend API 503 Service Unavailable"
**Problem**: Backend deployment has errors
```bash
# Solutions:
# 1. Check Vercel build logs:
#    Backend project → Deployments → Logs

# 2. Verify database connection:
#    DATABASE_URL should be in Environment Variables

# 3. Check startup script:
#    backend/vercel.json should route to correct handler

# 4. Test locally:
cd backend
npm install
npm run build
npm start

# 5. Check for missing environment variables:
#    All required vars in .env.example must be in Vercel
```

## Database Issues

### Issue: "Connection refused" on DATABASE_URL
**Problem**: Database service not running or URL invalid
```bash
# Local development:
# 1. Start PostgreSQL service
# 2. Verify DATABASE_URL format:
#    postgresql://user:password@localhost:5432/dbname

# Production (Vercel):
# 1. Check DATABASE_URL in Vercel Environment Variables
# 2. Verify database is running
# 3. Check firewall/security groups allow connection
# 4. Test connection:
#    npx prisma db push
```

### Issue: "Migration failed" during deployment
**Problem**: Database schema out of sync
```bash
# Solutions:
# 1. Check Prisma schema consistency
# 2. Run locally first:
npx prisma migrate dev --name migration_name

# 3. Verify migrations folder exists:
#    backend/prisma/migrations/

# 4. Check DATABASE_URL in production
# 5. Run migration manually:
npx prisma migrate deploy
```

### Issue: "Pending migrations" warning
**Problem**: Schema not up to date
```bash
# Solution:
npx prisma migrate deploy  # Apply pending migrations
npx prisma db push         # Push schema changes
```

## Testing Issues

### Issue: Tests fail in GitHub Actions
**Problem**: Tests pass locally but fail in CI
```bash
# Solutions:
# 1. Check database configuration
#    Actions uses test database, verify in workflow

# 2. Verify test environment variables
#    Add in GitHub workflow or secrets

# 3. Check test database exists
#    Actions should create it automatically

# 4. Run tests locally in same environment:
NODE_ENV=test npm test

# 5. Check for timing issues:
#    Add jest timeout:
jest.setTimeout(10000);
```

### Issue: "Port already in use" during tests
**Problem**: Service already running on test port
```bash
# Solution:
# Kill process on port:
# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux:
lsof -i :5000
kill -9 <PID>
```

## Security Issues

### Issue: "Secret exposed in logs"
**Problem**: Secret printed to console output
**Action Required**: 
```bash
# 1. IMMEDIATELY rotate the secret
# 2. Regenerate tokens
# 3. Update in GitHub secrets
# 4. Commit a fix that removes logging
# 5. Push new commit
```

### Issue: "Unknown SSL certificate"
**Problem**: HTTPS certificate not trusted
```bash
# Solutions:
# 1. Wait for DNS propagation (24-48 hours)
# 2. Verify domain is connected in Vercel
# 3. Check certificate renewal:
#    Usually automatic after 30 days

# 4. Manual renew:
#    Vercel Dashboard → Domains → Verify
```

## Network Issues

### Issue: "CORS errors" in browser console
**Problem**: Backend URL not set correctly
```bash
# Solution:
# 1. Check VITE_API_URL in frontend/.env:
VITE_API_URL="https://api.yourdomain.com"

# 2. Verify backend CORS configuration:
#    backend/src/index.ts should have:
app.use(cors({
  origin: process.env.CORS_ORIGIN || "*"
}));

# 3. Check GitHub secret VITE_API_URL is set
# 4. Redeploy frontend
```

### Issue: "Mixed content" warning
**Problem**: Mixing HTTP and HTTPS
```bash
# Solution:
# 1. Ensure all URLs use HTTPS:
VITE_API_URL="https://..."  # Not http://

# 2. Set Vercel to always HTTPS:
#    Settings → Domains → Automatic HTTPS

# 3. Verify certificate is valid
```

## Performance Issues

### Issue: "Slow deployment"
**Problem**: Deployment takes too long
```bash
# Solutions:
# 1. Check build size:
npm run build  # Check dist/ size

# 2. Optimize dependencies:
npm audit      # Remove unnecessary packages

# 3. Check for large assets:
#    Images, videos should be optimized

# 4. Use Vercel analytics:
#    Vercel Dashboard → Analytics
```

## Rollback Procedures

### If deployment is broken:
```bash
# Option 1: Revert to previous commit
git revert HEAD
git push  # Triggers new deployment

# Option 2: Direct Vercel rollback
# Go to Vercel Dashboard → Deployments
# Find successful deployment
# Click "..." → Promote to Production

# Option 3: Manual fix and redeploy
# Fix code locally
git add .
git commit -m "fix: issue description"
git push  # Triggers new deployment
```

## Getting Help

If you're still stuck:

1. **Check logs**:
   - GitHub Actions: Repository → Actions → Click workflow run
   - Vercel: Dashboard → Select project → Deployments → Click failed build

2. **Search issues**:
   - GitHub Issues on your repository
   - Vercel Community: https://github.com/vercel/vercel/discussions

3. **Contact support**:
   - GitHub Support: https://support.github.com
   - Vercel Support: https://vercel.com/support

4. **Debug locally**:
   ```bash
   npm run build  # Test build locally
   npm test       # Run tests
   vercel build   # Test Vercel build locally
   ```

---

**Last Updated**: 2026-06-07
