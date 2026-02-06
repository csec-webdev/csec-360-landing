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
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';

export default function HomePage() {
  const { data: session } = useSession();
  const [applications, setApplications] = useState<ApplicationWithDepartments[]>([]);
  const [myApplications, setMyApplications] = useState<ApplicationWithDepartments[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [viewMode, setViewMode] = useState<'all' | 'my'>('my');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [appsRes, deptsRes, favsRes, myAppsRes] = await Promise.all([
        fetch('/api/applications'),
        fetch('/api/departments'),
        fetch('/api/favorites'),
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

      if (favsRes.ok) {
        const favsData = await favsRes.json();
        setFavorites(favsData);
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

  // @dnd-kit sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = filteredApplications.findIndex((app) => app.id === active.id);
      const newIndex = filteredApplications.findIndex((app) => app.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(filteredApplications, oldIndex, newIndex);
        reorderMyApplications(newOrder);
      }
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
      // In "all" view, sort: favorites first, then alphabetically
      return filtered.sort((a, b) => {
        const aFav = favorites.includes(a.id);
        const bFav = favorites.includes(b.id);

        if (aFav && !bFav) return -1;
        if (!aFav && bFav) return 1;
        return a.name.localeCompare(b.name);
      });
    }
  }, [applications, myApplications, searchQuery, selectedDepartment, favorites, viewMode]);

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
        ) : viewMode === 'my' ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={filteredApplications.map((app) => app.id)}
              strategy={rectSortingStrategy}
            >
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredApplications.map((app) => (
                  <AppCard
                    key={app.id}
                    application={app}
                    isFavorited={favorites.includes(app.id)}
                    onToggleFavorite={toggleFavorite}
                    viewMode={viewMode}
                    isInMyApplications={myApplications.some((myApp) => myApp.id === app.id)}
                    onToggleMyApplication={toggleMyApplication}
                    isDraggable={viewMode === 'my'}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredApplications.map((app) => (
              <AppCard
                key={app.id}
                application={app}
                isFavorited={favorites.includes(app.id)}
                onToggleFavorite={toggleFavorite}
                viewMode={viewMode}
                isInMyApplications={myApplications.some((myApp) => myApp.id === app.id)}
                onToggleMyApplication={toggleMyApplication}
                isDraggable={false}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
