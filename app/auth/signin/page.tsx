'use client';

import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { LogIn } from 'lucide-react';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

function SignInContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const error = searchParams.get('error');

  const handleSignIn = async () => {
    console.log('[SignIn] Initiating sign-in with callback:', callbackUrl);
    try {
      const result = await signIn('azure-ad', { 
        callbackUrl,
        redirect: true,
      });
      console.log('[SignIn] Sign-in result:', result);
    } catch (error) {
      console.error('[SignIn] Sign-in error:', error);
    }
  };

  // Log if there's an error from NextAuth
  if (error) {
    console.error('[SignIn] NextAuth error:', error);
  }

  return (
    <div 
      className="flex min-h-screen items-center justify-center" 
      style={{ 
        background: 'linear-gradient(135deg, #C8102E 0%, #8B0A1F 100%)' 
      }}
    >
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-12 shadow-2xl">
        {/* Logo */}
        <div className="flex flex-col items-center space-y-6">
          <Image
            src="/csec_logo.svg"
            alt="CSEC Logo"
            width={240}
            height={80}
            className="h-auto w-full max-w-[240px]"
            priority
          />
          
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Application Directory
            </h1>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800">
            <p className="font-semibold">Authentication Error</p>
            <p className="mt-1">
              {error === 'Configuration' && 'There is a problem with the server configuration.'}
              {error === 'AccessDenied' && 'Access denied. You may not have permission to sign in.'}
              {error === 'Verification' && 'The verification token has expired or has already been used.'}
              {!['Configuration', 'AccessDenied', 'Verification'].includes(error) && `Error: ${error}`}
            </p>
            <p className="mt-2 text-xs">Check the browser console for more details.</p>
          </div>
        )}

        {/* Sign In Button */}
        <div className="pt-4">
          <Button
            onClick={handleSignIn}
            className="w-full text-white font-semibold py-6 text-base rounded-lg shadow-md transition-all"
            style={{ backgroundColor: '#C8102E' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#A00D24';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#C8102E';
            }}
            size="lg"
          >
            <LogIn className="mr-2 h-5 w-5" />
            Sign In
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 pt-4">
          <p>© {new Date().getFullYear()} Calgary Sports and Entertainment Corporation.</p>
          <p>All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center" style={{ background: 'linear-gradient(135deg, #C8102E 0%, #8B0A1F 100%)' }}>
        <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-12 shadow-2xl">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    }>
      <SignInContent />
    </Suspense>
  );
}
