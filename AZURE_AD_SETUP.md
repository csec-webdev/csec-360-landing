# Azure AD (Entra ID) SSO Setup Guide

## Current Status

The application is now ready for SSO authentication, but you need to complete the Azure AD configuration to enable it.

## What's Been Done

✅ NextAuth.js configured with Azure AD provider  
✅ Middleware protecting all frontend and admin routes  
✅ Environment variables structure ready  
✅ Admin role checking based on email list  
✅ Authentication callbacks configured  

## What You Need to Do

### Step 1: Register Application in Azure Portal

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** (or **Microsoft Entra ID**)
3. Click **App registrations** → **New registration**
4. Fill in the details:
   - **Name**: CSEC 360 Landing Page (or your preferred name)
   - **Supported account types**: Accounts in this organizational directory only
   - **Redirect URI**: Web platform, `http://localhost:3000/api/auth/callback/azure-ad`
5. Click **Register**

### Step 2: Get Client ID and Tenant ID

After registration, you'll see the **Overview** page:

1. Copy the **Application (client) ID** → This is your `AZURE_AD_CLIENT_ID`
2. Copy the **Directory (tenant) ID** → This is your `AZURE_AD_TENANT_ID`

### Step 3: Create Client Secret

1. In your app registration, go to **Certificates & secrets**
2. Click **New client secret**
3. Add a description (e.g., "Dev Secret") and set expiration
4. Click **Add**
5. **IMPORTANT**: Copy the **Value** immediately → This is your `AZURE_AD_CLIENT_SECRET`
   - You won't be able to see this again!

### Step 4: Update .env.local

Update your `.env.local` file with the values you copied:

```bash
# Your actual values from Azure AD
AZURE_AD_CLIENT_ID=your-actual-client-id-here
AZURE_AD_CLIENT_SECRET=your-actual-client-secret-here  
AZURE_AD_TENANT_ID=your-actual-tenant-id-here

# Admin email (your email address that will have admin access)
ADMIN_EMAILS=your.email@domain.com

# Keep these as is
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-already-generated-secret
```

### Step 5: Configure Supabase (For Database)

If you haven't already:

1. Go to [Supabase](https://supabase.com)
2. Create a new project
3. Go to **Project Settings** → **API**
4. Copy the values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`
5. Go to **SQL Editor** and run the script from `supabase/schema.sql`

Update `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Step 6: Add Redirect URI for Production (Later)

When deploying to Vercel, you'll need to add another redirect URI:

1. Go back to Azure Portal → Your app registration
2. Go to **Authentication**
3. Click **Add a platform** → **Web**
4. Add: `https://your-vercel-domain.vercel.app/api/auth/callback/azure-ad`
5. Click **Configure**

## Testing the Authentication

Once you've completed the steps above:

1. Start the dev server:
   ```bash
   npm run dev
   ```

2. Open `http://localhost:3000` in your browser

3. You should be redirected to Microsoft login

4. After signing in with your Microsoft account, you'll be redirected back to the app

5. If your email is in `ADMIN_EMAILS`, you can access the admin panel at `http://localhost:3000/admin/applications`

## Troubleshooting

### Still getting redirect loops?

- Make sure all environment variables are correct
- Restart the dev server after changing `.env.local`
- Clear your browser cookies for `localhost:3000`
- Check that the redirect URI in Azure matches exactly: `http://localhost:3000/api/auth/callback/azure-ad`

### Can't access admin panel?

- Make sure your email (the one you sign in with) is listed in `ADMIN_EMAILS` in `.env.local`
- Check browser console for any errors
- Verify you're signed in by checking the user menu

### "Error 400: redirect_uri_mismatch"?

- The redirect URI in Azure doesn't match
- Should be: `http://localhost:3000/api/auth/callback/azure-ad`
- Make sure there are no trailing slashes or extra characters

## Need Help?

If you encounter issues:
1. Check the terminal for error messages
2. Check browser console (F12) for errors
3. Verify all environment variables are set correctly
4. Make sure the Azure AD app is configured with the correct redirect URI
