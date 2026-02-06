'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Home, LayoutGrid, FolderTree, FileCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  {
    title: 'Applications',
    href: '/admin/applications',
    icon: LayoutGrid,
  },
  {
    title: 'Departments',
    href: '/admin/departments',
    icon: FolderTree,
  },
  {
    title: 'Requests',
    href: '/admin/requests',
    icon: FileCheck,
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [pendingCount, setPendingCount] = useState(0);

  // Handle redirect in useEffect to avoid render-time navigation
  useEffect(() => {
    // Only check auth if session is loaded and authentication is enabled
    if (status === 'authenticated' && !session?.user?.isAdmin) {
      router.push('/');
    }
  }, [status, session, router]);

  // Fetch pending requests count
  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const response = await fetch('/api/application-requests');
        if (response.ok) {
          const data = await response.json();
          const pending = data.filter((req: any) => req.status === 'pending');
          setPendingCount(pending.length);
        }
      } catch (error) {
        console.error('Error fetching pending requests:', error);
      }
    };

    if (status === 'authenticated' && session?.user?.isAdmin) {
      fetchPendingCount();
      // Poll every 30 seconds
      const interval = setInterval(fetchPendingCount, 30000);
      return () => clearInterval(interval);
    }
  }, [status, session]);

  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Allow access if unauthenticated (auth disabled) or if user is admin
  // This supports development mode when authentication is disabled
  const hasAccess = status === 'unauthenticated' || session?.user?.isAdmin;

  if (status === 'authenticated' && !hasAccess) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">Redirecting...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Development Warning Banner */}
      {status === 'unauthenticated' && (
        <div className="bg-yellow-500 px-4 py-2 text-center text-sm font-medium text-yellow-950">
          ⚠️ Development Mode: Authentication is disabled. Anyone can access the admin panel.
        </div>
      )}

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-64 border-r bg-muted/50">
          <div className="flex h-16 items-center border-b px-6">
            <h2 className="text-lg font-semibold">Admin Panel</h2>
          </div>
          <nav className="space-y-1 p-4">
            <Link href="/">
              <Button variant="ghost" className="w-full justify-start">
                <Home className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
            {navItems.map((item) => {
              const Icon = item.icon;
              const showBadge = item.href === '/admin/requests' && pendingCount > 0;
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={pathname === item.href ? 'secondary' : 'ghost'}
                    className={cn('w-full justify-start relative', pathname === item.href && 'bg-secondary')}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {item.title}
                    {showBadge && (
                      <Badge
                        variant="destructive"
                        className="ml-auto"
                      >
                        {pendingCount}
                      </Badge>
                    )}
                  </Button>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
