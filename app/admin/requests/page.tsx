'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Check, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ImageUpload } from '@/components/image-upload';
import { toast } from 'sonner';

interface ApplicationRequest {
  id: string;
  name: string;
  description: string;
  url: string;
  image_url?: string;
  auth_type: string;
  status: string;
  admin_notes?: string;
  created_at: string;
  requestedBy?: {
    email: string;
    name?: string;
  };
  departments: any[];
}

export default function RequestsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [requests, setRequests] = useState<ApplicationRequest[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ApplicationRequest | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    url: '',
    image_url: '',
    auth_type: 'username_password',
    departmentIds: [] as string[],
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated' && !session?.user?.isAdmin) {
      router.push('/');
    } else if (status === 'authenticated') {
      fetchRequests();
    }
  }, [status, session, router]);

  const fetchRequests = async () => {
    try {
      const [requestsRes, deptsRes] = await Promise.all([
        fetch('/api/application-requests'),
        fetch('/api/departments'),
      ]);
      
      if (requestsRes.ok) {
        const data = await requestsRes.json();
        setRequests(data);
      }
      
      if (deptsRes.ok) {
        const depts = await deptsRes.json();
        setDepartments(depts);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (request: ApplicationRequest) => {
    setSelectedRequest(request);
    setEditForm({
      name: request.name,
      description: request.description || '',
      url: request.url,
      image_url: request.image_url || '',
      auth_type: request.auth_type,
      departmentIds: request.departments.map((d) => d.id),
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedRequest) return;

    try {
      const response = await fetch(`/api/application-requests/${selectedRequest.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        toast.success('Request updated successfully');
        fetchRequests();
        setEditDialogOpen(false);
      } else {
        throw new Error('Failed to update request');
      }
    } catch (error) {
      console.error('Error updating request:', error);
      toast.error('Failed to update request');
    }
  };

  const handleSaveAndApprove = async () => {
    if (!selectedRequest) return;

    try {
      // First update the request
      const updateResponse = await fetch(`/api/application-requests/${selectedRequest.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      if (!updateResponse.ok) {
        throw new Error('Failed to update request');
      }

      // Then approve it
      const approveResponse = await fetch(`/api/application-requests/${selectedRequest.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approve: true }),
      });

      if (approveResponse.ok) {
        toast.success('Application approved and added!');
        fetchRequests();
        setEditDialogOpen(false);
      } else {
        throw new Error('Failed to approve request');
      }
    } catch (error) {
      console.error('Error saving and approving request:', error);
      toast.error('Failed to save and approve request');
    }
  };

  const handleApprove = async (request: ApplicationRequest) => {
    try {
      const response = await fetch(`/api/application-requests/${request.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approve: true }),
      });

      if (response.ok) {
        toast.success('Application approved and added!');
        fetchRequests();
      } else {
        throw new Error('Failed to approve request');
      }
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error('Failed to approve request');
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;

    try {
      const response = await fetch(`/api/application-requests/${selectedRequest.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Request rejected');
        fetchRequests();
        setDeleteDialogOpen(false);
        setSelectedRequest(null);
      } else {
        throw new Error('Failed to reject request');
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Failed to reject request');
    }
  };

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500';
      case 'approved':
        return 'bg-green-500';
      case 'rejected':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading || status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  const pendingRequests = requests.filter((r) => r.status === 'pending');

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Application Requests</h1>
          <p className="text-muted-foreground mt-1">
            Review and approve user-submitted application requests
          </p>
        </div>
        {pendingRequests.length > 0 && (
          <Badge variant="destructive" className="text-lg px-3 py-1">
            {pendingRequests.length} Pending
          </Badge>
        )}
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground">No application requests yet</p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Application Name</TableHead>
                <TableHead>Requested By</TableHead>
                <TableHead>Auth Type</TableHead>
                <TableHead>Departments</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request, index) => (
                <TableRow
                  key={request.id}
                  className={index % 2 === 0 ? 'bg-background hover:bg-muted/50 cursor-pointer' : 'bg-muted/30 hover:bg-muted/50 cursor-pointer'}
                  onClick={() => handleEdit(request)}
                >
                  <TableCell className="font-medium">{request.name}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {request.requestedBy?.name || 'Unknown'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {request.requestedBy?.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getAuthLabel(request.auth_type)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {request.departments.length} dept(s)
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(request.status)}>
                      {request.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(request.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {request.status === 'pending' && (
                        <>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApprove(request);
                            }}
                          >
                            <Check className="mr-1 h-4 w-4" />
                            Approve
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedRequest(request);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <X className="mr-1 h-4 w-4" />
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Application Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject this application request? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReject} className="bg-destructive">
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Application Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Application Name *
              </label>
              <Input
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
                placeholder="Enter application name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Description
              </label>
              <Textarea
                value={editForm.description}
                onChange={(e) =>
                  setEditForm({ ...editForm, description: e.target.value })
                }
                placeholder="Enter application description"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">URL *</label>
              <Input
                value={editForm.url}
                onChange={(e) =>
                  setEditForm({ ...editForm, url: e.target.value })
                }
                placeholder="https://example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Authentication Type *
              </label>
              <Select
                value={editForm.auth_type}
                onValueChange={(value) =>
                  setEditForm({ ...editForm, auth_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select authentication type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sso">SSO</SelectItem>
                  <SelectItem value="username_password">
                    Username/Password
                  </SelectItem>
                  <SelectItem value="api_key">API Key</SelectItem>
                  <SelectItem value="oauth">OAuth</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Application Image
              </label>
              <ImageUpload
                value={editForm.image_url}
                onChange={(url) =>
                  setEditForm({ ...editForm, image_url: url })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Departments
              </label>
              <div className="flex flex-wrap gap-2 mt-2">
                {departments.map((dept) => (
                  <Button
                    key={dept.id}
                    type="button"
                    variant={
                      editForm.departmentIds.includes(dept.id)
                        ? 'default'
                        : 'outline'
                    }
                    size="sm"
                    onClick={() => {
                      setEditForm({
                        ...editForm,
                        departmentIds: editForm.departmentIds.includes(dept.id)
                          ? editForm.departmentIds.filter((id) => id !== dept.id)
                          : [...editForm.departmentIds, dept.id],
                      });
                    }}
                  >
                    {dept.name}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button variant="secondary" onClick={handleSaveEdit}>
                Save Changes
              </Button>
              <Button onClick={handleSaveAndApprove}>
                Save and Approve
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
