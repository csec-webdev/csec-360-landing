'use client';

import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { LogIn } from 'lucide-react';

export default function SignInPage() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const handleSignIn = async () => {
    await signIn('azure-ad', { callbackUrl });
  };

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
