# Application Directory Portal

A modern, enterprise-grade application directory with SSO authentication, admin panel, and user favorites.

## Features

- **SSO Authentication**: Secure login with Microsoft Entra ID (Azure AD)
- **Application Directory**: Browse and search applications with department filtering
- **User Favorites**: Pin your most-used applications for quick access
- **Admin Panel**: Complete CRUD interface for managing applications and departments
- **Modern UI**: Built with Next.js, Tailwind CSS, and shadcn/ui
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS + shadcn/ui
- **Authentication**: NextAuth.js with Azure AD provider
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage for application images
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Microsoft Entra ID (Azure AD) app registration

### Environment Setup

1. Clone the repository
2. Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

3. Configure your environment variables:

#### NextAuth Configuration

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
```

#### Azure AD Configuration

1. Go to Azure Portal → Azure Active Directory → App registrations
2. Create a new registration
3. Add redirect URI: `http://localhost:3000/api/auth/callback/azure-ad`
4. Create a client secret
5. Copy the values:

```env
AZURE_AD_CLIENT_ID=<your-client-id>
AZURE_AD_CLIENT_SECRET=<your-client-secret>
AZURE_AD_TENANT_ID=<your-tenant-id>
```

#### Supabase Configuration

1. Create a project at https://supabase.com
2. Go to SQL Editor and run the schema from `supabase/schema.sql`
3. Get your keys from Project Settings → API
4. Add to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

#### Admin Users

To designate admin users, add their email addresses (comma-separated):

```env
ADMIN_EMAILS=admin1@company.com,admin2@company.com
```

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Deployment to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

### 2. Deploy to Vercel

1. Go to [Vercel](https://vercel.com)
2. Import your GitHub repository
3. Configure environment variables (same as `.env.local`)
4. Update `NEXTAUTH_URL` to your production domain
5. Deploy!

### 3. Update Azure AD Redirect URIs

Add your production URL to Azure AD:
- `https://your-domain.com/api/auth/callback/azure-ad`

### 4. Configure Custom Domain (Optional)

In Vercel project settings, add your custom domain.

## Project Structure

```
/app
  /api                  # API routes
    /auth              # NextAuth endpoints
    /applications      # Application CRUD
    /departments       # Department CRUD
    /favorites         # User favorites
    /upload            # Image upload
  /admin               # Admin panel pages
    /applications      # Application management
    /departments       # Department management
  /page.tsx            # Landing page
  /layout.tsx          # Root layout
/components
  /ui                  # shadcn/ui components
  /app-card.tsx        # Application card component
  /search-bar.tsx      # Search input
  /department-tabs.tsx # Department filter tabs
  /application-dialog.tsx # App create/edit dialog
  /image-upload.tsx    # Image uploader
  /providers.tsx       # NextAuth provider
/lib
  /auth.ts             # NextAuth configuration
  /supabase.ts         # Supabase clients
  /db-queries.ts       # Database queries
  /utils.ts            # Utility functions
/types
  /index.ts            # TypeScript types
  /next-auth.d.ts      # NextAuth type extensions
/supabase
  /schema.sql          # Database schema
  /README.md           # Setup instructions
```

## Database Schema

See `supabase/schema.sql` and `supabase/README.md` for detailed schema information.

## Admin Access

To access the admin panel:
1. Your email must be listed in the `ADMIN_EMAILS` environment variable
2. Sign in with your Microsoft account
3. Click "Admin" in the top navigation bar

## Features in Detail

### User Features

- **Browse Applications**: View all applications in a card grid
- **Search**: Real-time search by name and description
- **Department Filtering**: Toggle between departments using tabs
- **Favorites**: Star applications to pin them to the top
- **Direct Launch**: Click to open applications in a new tab

### Admin Features

- **Application Management**: Create, edit, and delete applications
- **Department Management**: Organize applications by departments
- **Image Upload**: Upload application logos to Supabase Storage
- **Multi-department Assignment**: Assign apps to multiple departments
- **Authentication Type Tracking**: Track how each app authenticates

## Troubleshooting

### Authentication Issues

- Verify Azure AD configuration
- Check redirect URIs match exactly
- Ensure `NEXTAUTH_SECRET` is set in production

### Database Issues

- Verify Supabase connection strings
- Check that schema has been applied
- Verify RLS policies are enabled

### Image Upload Issues

- Check Supabase storage bucket exists
- Verify storage policies allow uploads
- Ensure file size is under 5MB

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
