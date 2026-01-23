# Supabase Database Setup

This directory contains the SQL schema for the application.

## Setup Instructions

1. Create a new project in Supabase (https://supabase.com)
2. Go to the SQL Editor in your Supabase dashboard
3. Copy and paste the contents of `schema.sql`
4. Run the SQL script to create all tables, indexes, and policies
5. Copy your Supabase URL and keys to your `.env.local` file

## Database Structure

### Tables

- **users**: Stores user information synced from NextAuth sessions
- **departments**: Stores department names
- **applications**: Stores application information (name, description, URL, image, auth type)
- **application_departments**: Junction table for many-to-many relationship between applications and departments
- **user_favorites**: Stores user's favorited/pinned applications

### Row Level Security (RLS)

The schema includes RLS policies to ensure:
- All authenticated users can read applications and departments
- Only service role (admin) can create/update/delete applications and departments
- Users can only manage their own favorites

### Storage

A storage bucket named `application-images` is created for storing application logos/images with public read access.

## Accessing the Database

Use the Supabase client libraries provided in `lib/supabase.ts`:
- `supabase`: Client for browser/client components
- `supabaseAdmin`: Admin client with service role for server-side operations
