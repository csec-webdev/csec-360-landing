# Quick Start Guide

Get your Application Directory Portal running in 10 minutes!

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Up Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Copy the example file
cp .env.example .env.local
```

Fill in these critical values in `.env.local`:

### Required for Local Development

1. **Generate NextAuth Secret**
   ```bash
   openssl rand -base64 32
   ```
   Copy the output to `NEXTAUTH_SECRET`

2. **Set NextAuth URL**
   ```env
   NEXTAUTH_URL=http://localhost:3000
   ```

3. **Get Supabase Credentials** (5 minutes)
   - Go to https://supabase.com → Create new project
   - Wait for it to initialize
   - Go to SQL Editor → New Query
   - Paste contents of `supabase/schema.sql` → Run
   - Go to Project Settings → API
   - Copy the URL and keys to your `.env.local`

4. **Set Up Azure AD** (5 minutes)
   - Go to Azure Portal → Azure Active Directory → App registrations
   - New registration → Name it "App Directory"
   - Add redirect URI: `http://localhost:3000/api/auth/callback/azure-ad`
   - Certificates & secrets → New client secret
   - Copy Application ID, Tenant ID, and Secret to `.env.local`

5. **Add Admin Emails**
   ```env
   ADMIN_EMAILS=your-email@company.com
   ```

## Step 3: Run the Development Server

```bash
npm run dev
```

Visit http://localhost:3000 - you should see the Microsoft login screen!

## Step 4: Add Your First Application

1. Sign in with your Microsoft account
2. Click "Admin" in the top right
3. Go to "Departments" → Add a department (e.g., "IT")
4. Go to "Applications" → Add an application
5. Fill in the details and save

## Step 5: Test User Experience

1. Go back to the home page
2. See your application in the grid
3. Try the search bar
4. Try the department tabs
5. Click the star to favorite the app

## That's it! 🎉

You now have a fully functional application directory!

## Next Steps

- **Deploy to Production**: Follow `DEPLOYMENT.md` for detailed deployment instructions
- **Customize**: Modify colors, layouts, and features to match your brand
- **Add More Apps**: Keep building your directory

## Common Issues

### "Error: Unable to connect to Supabase"
- Check your Supabase URL and keys are correct
- Verify you ran the schema SQL in Supabase

### "Authentication failed"
- Verify Azure AD redirect URI exactly matches: `http://localhost:3000/api/auth/callback/azure-ad`
- Check client secret is correct (not the secret ID)

### "Admin button not showing"
- Verify your email is in `ADMIN_EMAILS`
- Make sure there are no spaces in the email list
- Restart the dev server after changing `.env.local`

## Need Help?

- Check the full `README.md` for detailed documentation
- Review `DEPLOYMENT.md` for production setup
- Check `supabase/README.md` for database details

## Project Structure Overview

```
app/
├── page.tsx              # Main landing page
├── admin/               # Admin panel
│   ├── applications/    # App management
│   └── departments/     # Dept management
└── api/                 # Backend API routes

components/
├── ui/                  # shadcn components
├── app-card.tsx         # Application display card
└── ...                  # Other components

lib/
├── auth.ts              # NextAuth config
├── supabase.ts          # Database client
└── db-queries.ts        # Database functions
```

Happy coding! 🚀
