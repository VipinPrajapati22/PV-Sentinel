# GitHub Secrets Configuration

This document outlines all the secrets and environment variables needed for GitHub Actions CI/CD and Vercel deployment.

## Step 1: Access GitHub Secrets Settings

1. Go to your repository on GitHub
2. Click **Settings** (top navigation)
3. In the left sidebar, click **Secrets and variables** → **Actions**

## Step 2: Add Repository Secrets

### Vercel Integration Secrets

These are required for automatic deployment to Vercel:

#### `VERCEL_TOKEN`
- **Purpose**: Authentication token for Vercel API
- **How to get**:
  1. Go to [Vercel Account Settings](https://vercel.com/account/tokens)
  2. Click "Create" → "Tokens"
  3. Name it: `github-actions`
  4. Set expiration to "No Expiration"
  5. Copy the token
- **Value**: `Your_Vercel_Token_Here`

#### `VERCEL_ORG_ID`
- **Purpose**: Your Vercel organization ID
- **How to get**:
  1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
  2. Look at the URL: `https://vercel.com/organizations/{ORG_ID}`
  3. Copy the `{ORG_ID}` part
- **Value**: `Your_Org_ID_Here`

#### `VERCEL_PROJECT_ID_FRONTEND`
- **Purpose**: Project ID for frontend deployment
- **How to get**:
  1. Go to Vercel dashboard
  2. Select your frontend project
  3. Go to **Settings** → **General**
  4. Look for "Project ID"
- **Value**: `Your_Frontend_Project_ID`

#### `VERCEL_PROJECT_ID_BACKEND`
- **Purpose**: Project ID for backend API deployment
- **How to get**:
  1. Go to Vercel dashboard
  2. Select your backend project
  3. Go to **Settings** → **General**
  4. Look for "Project ID"
- **Value**: `Your_Backend_Project_ID`

### Database Secrets

#### `DATABASE_URL`
- **Purpose**: Production database connection string
- **Format**: `postgresql://username:password@host:port/database_name`
- **Example**: `postgresql://admin:secretpass@db.example.com:5432/pharma_prod`
- **How to get**:
  - If using Vercel Postgres: Copy from Vercel Storage
  - If using Railway: Copy from Railway dashboard
  - If using external provider: Get from their console
- **Value**: `Your_Database_URL`

### Application Secrets

#### `JWT_SECRET`
- **Purpose**: Secret key for JWT token signing
- **Requirements**: Minimum 32 characters, random and secure
- **How to generate**:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- **Value**: `Your_32_Character_JWT_Secret`

#### `VITE_API_URL`
- **Purpose**: API endpoint for frontend
- **Format**: `https://api.yourdomain.com` or Vercel backend URL
- **Example**: `https://pharma-api.vercel.app`
- **Value**: `Your_API_URL`

### Email Configuration Secrets (Optional)

#### `SMTP_HOST`
- **Purpose**: Email service SMTP server
- **Example for Gmail**: `smtp.gmail.com`
- **Value**: `Your_SMTP_Host`

#### `SMTP_PORT`
- **Purpose**: SMTP port number
- **Example for Gmail**: `587`
- **Value**: `587`

#### `SMTP_USER`
- **Purpose**: Email account username
- **Example**: `your-email@gmail.com`
- **Value**: `Your_SMTP_Username`

#### `SMTP_PASS`
- **Purpose**: Email account password or app password
- **Important**: For Gmail, use [App Password](https://support.google.com/accounts/answer/185833)
- **Value**: `Your_SMTP_Password`

## Step 3: Add Environment Variables

Some values can also be added as **Environment Variables** (non-sensitive):

1. In the same **Secrets and variables** → **Actions** section
2. Click the **Variables** tab
3. Click **New repository variable**

### Suggested Environment Variables

- `NODE_ENV`: `production`
- `LOG_LEVEL`: `info`
- `API_VERSION`: `v1`

## Step 4: Verify Secrets Are Set

Run a test by:
1. Making a push to your repository
2. Going to **Actions** tab
3. Click the latest workflow run
4. Verify no "secret not found" errors

## Security Best Practices

✅ **Do:**
- ✅ Use unique, strong tokens
- ✅ Rotate tokens annually
- ✅ Use app-specific passwords (not account passwords)
- ✅ Enable branch protection on main
- ✅ Review secret access in audit logs

❌ **Don't:**
- ❌ Commit secrets to code
- ❌ Share tokens publicly
- ❌ Use personal passwords for service accounts
- ❌ Hardcode database URLs
- ❌ Commit .env files

## Troubleshooting

### "Secret not found" error
- Verify secret name matches exactly (case-sensitive)
- Check secret is saved (refresh page)

### "Invalid token" error
- Regenerate and update the token
- Check token hasn't expired

### "Unauthorized" error
- Verify credentials are correct
- Check API access permissions
- Verify service account has required role

## Updating Secrets

To update a secret:
1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Find the secret in the list
3. Click the pencil icon
4. Update the value
5. Click **Update secret**

All future workflow runs will use the updated value.

