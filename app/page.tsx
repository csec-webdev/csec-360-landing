'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { LogOut, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SearchBar } from '@/components/search-bar';
import { DepartmentTabs } from '@/components/department-tabs';
import { AppCard } from '@/components/app-card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ApplicationWithDepartments, Department } from '@/types';
import { toast } from 'sonner';
import Link from 'next/link';
import Image from 'next/image';

export default function HomePage() {
  const { data: session } = useSession();
  const [applications, setApplications] = useState<ApplicationWithDepartments[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [appsRes, deptsRes, favsRes] = await Promise.all([
        fetch('/api/applications'),
        fetch('/api/departments'),
        fetch('/api/favorites'),
      ]);

      if (appsRes.ok) {
        const appsData = await appsRes.json();
        setApplications(appsData);
      }

      if (deptsRes.ok) {
        const deptsData = await deptsRes.json();
        setDepartments(deptsData);
      }

      if (favsRes.ok) {
        const favsData = await favsRes.json();
        setFavorites(favsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (appId: string) => {
    const isFavorited = favorites.includes(appId);

    // Optimistic update
    setFavorites((prev) =>
      isFavorited ? prev.filter((id) => id !== appId) : [...prev, appId]
    );

    try {
      if (isFavorited) {
        await fetch(`/api/favorites?applicationId=${appId}`, {
          method: 'DELETE',
        });
        toast.success('Removed from favorites');
      } else {
        await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ applicationId: appId }),
        });
        toast.success('Added to favorites');
      }
    } catch (error) {
      // Revert on error
      setFavorites((prev) =>
        isFavorited ? [...prev, appId] : prev.filter((id) => id !== appId)
      );
      toast.error('Failed to update favorites');
    }
  };

  const filteredApplications = useMemo(() => {
    let filtered = applications;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (app) =>
          app.name.toLowerCase().includes(query) ||
          app.description?.toLowerCase().includes(query)
      );
    }

    // Filter by department
    if (selectedDepartment !== 'all') {
      filtered = filtered.filter((app) =>
        app.departments.some((dept) => dept.id === selectedDepartment)
      );
    }

    // Sort: favorites first, then alphabetically
    return filtered.sort((a, b) => {
      const aFav = favorites.includes(a.id);
      const bFav = favorites.includes(b.id);

      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [applications, searchQuery, selectedDepartment, favorites]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 gap-4">
          <div className="flex-shrink-0">
            <Image
              src="/csec_logo.svg"
              alt="CSEC Logo"
              width={180}
              height={60}
              className="h-10 w-auto"
              priority
            />
          </div>
          
          <div className="flex items-center gap-3 flex-1 max-w-2xl">
            <DepartmentTabs
              departments={departments}
              selectedDepartment={selectedDepartment}
              onDepartmentChange={setSelectedDepartment}
            />
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>
          
          <div className="flex items-center gap-2">
            {session?.user?.isAdmin && (
              <Link href="/admin">
                <Button variant="outline" size="sm">
                  <Settings className="mr-2 h-4 w-4" />
                  Admin
                </Button>
              </Link>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar>
                    <AvatarFallback>
                      {session?.user?.name?.charAt(0) || session?.user?.email?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{session?.user?.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {session?.user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Applications Grid */}
      <main className="container mx-auto px-4 py-8">
        {filteredApplications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-lg text-muted-foreground">No applications found</p>
            <p className="text-sm text-muted-foreground">
              Try adjusting your search or filter
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredApplications.map((app) => (
              <AppCard
                key={app.id}
                application={app}
                isFavorited={favorites.includes(app.id)}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
