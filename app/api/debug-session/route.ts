import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  
  return NextResponse.json({
    session,
    isAdmin: session?.user?.isAdmin,
    email: session?.user?.email,
    adminEmails: process.env.ADMIN_EMAILS,
  });
}
