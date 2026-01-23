'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, MoreHorizontal, Pencil, Trash2, Search } from 'lucide-react';
import { ApplicationDialog } from '@/components/application-dialog';
import { ApplicationWithDepartments, Department } from '@/types';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

const getAuthLabel = (authType: string) => {
  switch (authType) {
    case 'sso':
      return 'SSO';
    case 'username_password':
      return 'Username/Password';
    case 'api_key':
      return 'API Key';
    case 'oauth':
      return 'OAuth';
    default:
      return authType.replace('_', ' ');
  }
};

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationWithDepartments[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<ApplicationWithDepartments | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [appToDelete, setAppToDelete] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [appsRes, deptsRes] = await Promise.all([
        fetch('/api/applications'),
        fetch('/api/departments'),
      ]);

      if (appsRes.ok) {
        setApplications(await appsRes.json());
      }

      if (deptsRes.ok) {
        setDepartments(await deptsRes.json());
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (app: ApplicationWithDepartments) => {
    setSelectedApp(app);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedApp(null);
    setDialogOpen(true);
  };

  const handleDeleteClick = (appId: string) => {
    setAppToDelete(appId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!appToDelete) return;

    try {
      const response = await fetch(`/api/applications/${appToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete');
      }

      toast.success('Application deleted');
      fetchData();
    } catch (error) {
      console.error('Error deleting application:', error);
      toast.error('Failed to delete application');
    } finally {
      setDeleteDialogOpen(false);
      setAppToDelete(null);
    }
  };

  const filteredApplications = applications.filter((app) =>
    app.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Applications</h1>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Application
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search applications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Auth Type</TableHead>
              <TableHead>Departments</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredApplications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No applications found
                </TableCell>
              </TableRow>
            ) : (
              filteredApplications.map((app) => (
                <TableRow key={app.id}>
                  <TableCell className="font-medium">{app.name}</TableCell>
                  <TableCell className="max-w-xs truncate">{app.url}</TableCell>
                  <TableCell>
                    {getAuthLabel(app.auth_type)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {app.departments.map((dept) => (
                        <Badge key={dept.id} variant="secondary">
                          {dept.name}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(app)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(app.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ApplicationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        application={selectedApp}
        departments={departments}
        onSuccess={fetchData}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the application.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
