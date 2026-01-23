# Deployment Guide

This guide will walk you through deploying the Application Directory Portal to Vercel with Supabase.

## Prerequisites

- GitHub account
- Vercel account (free tier works)
- Supabase account (free tier works)
- Microsoft Entra ID (Azure AD) tenant with app registration privileges

## Step 1: Set Up Supabase

### 1.1 Create Supabase Project

1. Go to https://supabase.com and sign in
2. Click "New Project"
3. Choose an organization (or create one)
4. Set project name, database password, and region
5. Wait for project to be created (~2 minutes)

### 1.2 Run Database Schema

1. In your Supabase dashboard, go to "SQL Editor"
2. Click "New Query"
3. Copy the entire contents of `supabase/schema.sql` from this repo
4. Paste and click "Run"
5. Verify all tables were created (check "Table Editor")

### 1.3 Get Supabase Keys

1. Go to Project Settings → API
2. Copy these values for later:
   - Project URL (NEXT_PUBLIC_SUPABASE_URL)
   - anon public key (NEXT_PUBLIC_SUPABASE_ANON_KEY)
   - service_role key (SUPABASE_SERVICE_ROLE_KEY) - **Keep this secret!**

## Step 2: Set Up Azure AD (Entra ID)

### 2.1 Create App Registration

1. Go to Azure Portal → Azure Active Directory
2. Navigate to "App registrations" → "New registration"
3. Set the name: "Application Directory Portal"
4. Choose "Accounts in this organizational directory only"
5. Click "Register"

### 2.2 Configure Authentication

1. Go to "Authentication" in your app registration
2. Click "Add a platform" → "Web"
3. Add redirect URIs:
   - Development: `http://localhost:3000/api/auth/callback/azure-ad`
   - Production: `https://your-domain.vercel.app/api/auth/callback/azure-ad`
4. Enable "ID tokens" checkbox
5. Save

### 2.3 Create Client Secret

1. Go to "Certificates & secrets"
2. Click "New client secret"
3. Add description: "NextAuth"
4. Choose expiration (recommend 24 months)
5. Copy the secret VALUE immediately (you can't see it again!)

### 2.4 Copy Required Values

From the "Overview" page, copy:
- Application (client) ID → `AZURE_AD_CLIENT_ID`
- Directory (tenant) ID → `AZURE_AD_TENANT_ID`
- Client secret value (from previous step) → `AZURE_AD_CLIENT_SECRET`

## Step 3: Prepare Code for Deployment

### 3.1 Push to GitHub

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit"

# Create main branch
git branch -M main

# Add your GitHub remote
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# Push
git push -u origin main
```

## Step 4: Deploy to Vercel

### 4.1 Import Project

1. Go to https://vercel.com
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Vercel will auto-detect Next.js

### 4.2 Configure Environment Variables

In the Vercel project configuration, add these environment variables:

```env
# NextAuth
NEXTAUTH_URL=https://your-project.vercel.app
NEXTAUTH_SECRET=<generate-random-string>

# Azure AD
AZURE_AD_CLIENT_ID=<from-azure-step-2.4>
AZURE_AD_CLIENT_SECRET=<from-azure-step-2.4>
AZURE_AD_TENANT_ID=<from-azure-step-2.4>

# Supabase
NEXT_PUBLIC_SUPABASE_URL=<from-supabase-step-1.3>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from-supabase-step-1.3>
SUPABASE_SERVICE_ROLE_KEY=<from-supabase-step-1.3>

# Admin Emails (comma-separated)
ADMIN_EMAILS=your-email@company.com,another-admin@company.com
```

**To generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 4.3 Deploy

1. Click "Deploy"
2. Wait for build to complete (~2-3 minutes)
3. Your app will be live at `https://your-project.vercel.app`

## Step 5: Update Azure AD Redirect URI

1. Go back to Azure Portal → App registrations
2. Update the redirect URI with your actual Vercel URL:
   - `https://your-actual-domain.vercel.app/api/auth/callback/azure-ad`
3. Save

## Step 6: Test Deployment

1. Visit your Vercel URL
2. You should be redirected to Microsoft login
3. Sign in with your Microsoft account
4. You should see the application directory
5. If you're listed in `ADMIN_EMAILS`, click "Admin" to access admin panel

## Step 7: Custom Domain (Optional)

### 7.1 Add Domain in Vercel

1. Go to Project Settings → Domains
2. Add your custom domain
3. Follow Vercel's DNS configuration instructions

### 7.2 Update Environment Variables

Update `NEXTAUTH_URL` to your custom domain:
```env
NEXTAUTH_URL=https://your-custom-domain.com
```

### 7.3 Update Azure AD

Add your custom domain to Azure AD redirect URIs:
- `https://your-custom-domain.com/api/auth/callback/azure-ad`

## Troubleshooting

### Build Fails

- Check all environment variables are set correctly
- Verify no TypeScript errors locally
- Check Vercel build logs for specific errors

### Authentication Doesn't Work

- Verify `NEXTAUTH_URL` matches your actual domain
- Check Azure AD redirect URIs are exactly correct (including `/api/auth/callback/azure-ad`)
- Ensure `NEXTAUTH_SECRET` is set
- Check Azure AD client secret hasn't expired

### Database Connection Issues

- Verify all three Supabase environment variables are set
- Check Supabase project is running (not paused)
- Verify schema was applied correctly

### Admin Access Not Working

- Check your email is in `ADMIN_EMAILS` environment variable
- Verify no extra spaces in email list
- Redeploy after changing environment variables

### Images Not Uploading

- Check Supabase storage bucket was created
- Verify storage policies were applied from schema
- Check file size is under 5MB

## Maintenance

### Updating the Application

```bash
# Make changes locally
git add .
git commit -m "Description of changes"
git push

# Vercel will automatically redeploy
```

### Monitoring

- Vercel Dashboard: View deployment status, logs, analytics
- Supabase Dashboard: Monitor database usage, storage
- Azure AD: Review sign-in logs

### Backup

- Supabase automatically backs up your database
- Consider exporting data periodically from Supabase Table Editor

## Security Best Practices

1. **Never commit secrets**: Keep `.env.local` in `.gitignore`
2. **Rotate secrets**: Update Azure AD client secrets before expiration
3. **Monitor access**: Review Azure AD sign-in logs regularly
4. **Limit admin access**: Only add necessary emails to `ADMIN_EMAILS`
5. **Enable 2FA**: Require multi-factor auth in Azure AD
6. **Review RLS policies**: Ensure Supabase policies match your security requirements

## Cost Considerations

### Free Tier Limits

- **Vercel**: 100GB bandwidth, 100 hours build time/month
- **Supabase**: 500MB database, 1GB file storage, 2GB bandwidth
- **Azure AD**: Unlimited sign-ins on free tier

### When You Might Need to Upgrade

- More than 500MB of data
- More than 1GB of application images
- Very high traffic (>100GB/month)

Both Vercel and Supabase have generous free tiers suitable for small to medium deployments.

## Support

If you encounter issues:

1. Check this guide's troubleshooting section
2. Review logs in Vercel dashboard
3. Check Supabase logs and API status
4. Open an issue on GitHub

## Next Steps

After deployment:

1. Add initial departments via admin panel
2. Add applications with logos
3. Invite users to test
4. Gather feedback and iterate
5. Monitor usage and performance

Congratulations! Your Application Directory Portal is now live! 🎉
