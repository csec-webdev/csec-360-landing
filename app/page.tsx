'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { LogOut, Settings, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SearchBar } from '@/components/search-bar';
import { DepartmentTabs } from '@/components/department-tabs';
import { AppCard } from '@/components/app-card';
import { RequestApplicationDialog } from '@/components/request-application-dialog';
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
import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';

export default function HomePage() {
  const { data: session } = useSession();
  const [applications, setApplications] = useState<ApplicationWithDepartments[]>([]);
  const [myApplications, setMyApplications] = useState<ApplicationWithDepartments[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [viewMode, setViewMode] = useState<'all' | 'my'>('my');
  const [loading, setLoading] = useState(true);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [appsRes, deptsRes, myAppsRes] = await Promise.all([
        fetch('/api/applications'),
        fetch('/api/departments'),
        fetch('/api/my-applications'),
      ]);

      if (appsRes.ok) {
        const appsData = await appsRes.json();
        setApplications(appsData);
      }

      if (deptsRes.ok) {
        const deptsData = await deptsRes.json();
        setDepartments(deptsData);
      }

      if (myAppsRes.ok) {
        const myAppsData = await myAppsRes.json();
        setMyApplications(myAppsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const toggleMyApplication = async (appId: string) => {
    const isInMyApps = myApplications.some((app) => app.id === appId);

    if (isInMyApps) {
      // Remove from My Applications
      setMyApplications((prev) => prev.filter((app) => app.id !== appId));

      try {
        await fetch(`/api/my-applications?applicationId=${appId}`, {
          method: 'DELETE',
        });
        toast.success('Removed from My Applications');
      } catch (error) {
        // Revert on error
        await fetchData();
        toast.error('Failed to remove from My Applications');
      }
    } else {
      // Add to My Applications
      const appToAdd = applications.find((app) => app.id === appId);
      if (appToAdd) {
        setMyApplications((prev) => [...prev, appToAdd]);

        try {
          await fetch('/api/my-applications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ applicationId: appId }),
          });
          toast.success('Added to My Applications');
        } catch (error) {
          // Revert on error
          setMyApplications((prev) => prev.filter((app) => app.id !== appId));
          toast.error('Failed to add to My Applications');
        }
      }
    }
  };

  const reorderMyApplications = async (orderedApps: ApplicationWithDepartments[]) => {
    const previousOrder = [...myApplications];
    setMyApplications(orderedApps);

    try {
      const orderedIds = orderedApps.map((app) => app.id);
      await fetch('/api/my-applications/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedApplicationIds: orderedIds }),
      });
    } catch (error) {
      // Revert on error
      setMyApplications(previousOrder);
      toast.error('Failed to reorder applications');
    }
  };

  const filteredApplications = useMemo(() => {
    // Use myApplications if in "my" view, otherwise use all applications
    let filtered = viewMode === 'my' ? myApplications : applications;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (app) =>
          app.name.toLowerCase().includes(query) ||
          app.description?.toLowerCase().includes(query)
      );
    }

    // Filter by department (only in "all" view)
    if (selectedDepartment !== 'all' && viewMode === 'all') {
      filtered = filtered.filter((app) =>
        app.departments.some((dept) => dept.id === selectedDepartment)
      );
    }

    // Sort based on view mode
    if (viewMode === 'my') {
      // In "my" view, preserve the custom order
      return filtered;
    } else {
      // In "all" view, sort alphabetically
      return filtered.sort((a, b) => a.name.localeCompare(b.name));
    }
  }, [applications, myApplications, searchQuery, selectedDepartment, viewMode]);

  // Pragmatic drag and drop monitor
  useEffect(() => {
    if (viewMode !== 'my') return;

    return monitorForElements({
      onDrop({ source, location }) {
        const destination = location.current.dropTargets[0];
        if (!destination) return;

        const sourceId = source.data.id as string;
        const destinationId = destination.data.id as string;

        if (sourceId === destinationId) return;

        const sourceIndex = filteredApplications.findIndex((app) => app.id === sourceId);
        const destinationIndex = filteredApplications.findIndex((app) => app.id === destinationId);

        if (sourceIndex === -1 || destinationIndex === -1) return;

        const newOrder = [...filteredApplications];
        const [removed] = newOrder.splice(sourceIndex, 1);
        newOrder.splice(destinationIndex, 0, removed);

        reorderMyApplications(newOrder);
      },
    });
  }, [viewMode, filteredApplications]);

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
          
          <div className="flex items-center gap-3 flex-1 max-w-3xl">
            <div className="flex gap-2 shrink-0">
              <Button
                variant={viewMode === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('all')}
              >
                All Applications
              </Button>
              <Button
                variant={viewMode === 'my' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('my')}
              >
                My Applications
              </Button>
            </div>
            {viewMode === 'all' && (
              <DepartmentTabs
                departments={departments}
                selectedDepartment={selectedDepartment}
                onDepartmentChange={setSelectedDepartment}
              />
            )}
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={() => setRequestDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Request App
            </Button>
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
                <Button variant="ghost" className="flex items-center gap-3 h-auto py-2 px-3">
                  <Avatar>
                    <AvatarFallback>
                      {(() => {
                        const name = session?.user?.name;
                        if (name) {
                          const nameParts = name.split(' ');
                          if (nameParts.length >= 2) {
                            return `${nameParts[0].charAt(0)}${nameParts[nameParts.length - 1].charAt(0)}`.toUpperCase();
                          }
                          return name.charAt(0).toUpperCase();
                        }
                        return session?.user?.email?.charAt(0).toUpperCase() || 'U';
                      })()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium leading-tight">
                      {session?.user?.name || session?.user?.email}
                    </span>
                    <span className="text-xs text-muted-foreground leading-tight">
                      {session?.user?.email}
                    </span>
                  </div>
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
            <p className="text-lg text-muted-foreground">
              {viewMode === 'my' ? 'No applications in your list' : 'No applications found'}
            </p>
            <p className="text-sm text-muted-foreground">
              {viewMode === 'my' 
                ? 'Add applications from the "All Applications" view to build your custom list' 
                : 'Try adjusting your search or filter'}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredApplications.map((app) => (
              <AppCard
                key={app.id}
                application={app}
                viewMode={viewMode}
                isInMyApplications={myApplications.some((myApp) => myApp.id === app.id)}
                onToggleMyApplication={toggleMyApplication}
                isDraggable={viewMode === 'my'}
              />
            ))}
          </div>
        )}
      </main>

      <RequestApplicationDialog
        open={requestDialogOpen}
        onOpenChange={setRequestDialogOpen}
        departments={departments}
        onSuccess={fetchData}
      />
    </div>
  );
}
