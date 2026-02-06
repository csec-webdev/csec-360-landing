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
import { Check, X, MoreHorizontal, Eye } from 'lucide-react';
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
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ApplicationRequest | null>(null);

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
      const response = await fetch('/api/application-requests');
      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
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
                  className={index % 2 === 0 ? 'bg-background' : 'bg-muted/30'}
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
                            onClick={() => handleApprove(request)}
                          >
                            <Check className="mr-1 h-4 w-4" />
                            Approve
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(request);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <X className="mr-1 h-4 w-4" />
                            Reject
                          </Button>
                        </>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedRequest(request);
                          setViewDialogOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
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

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Application Request Details</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">Application Name</h3>
                <p>{selectedRequest.name}</p>
              </div>
              <div>
                <h3 className="font-semibold">Description</h3>
                <p>{selectedRequest.description || 'No description provided'}</p>
              </div>
              <div>
                <h3 className="font-semibold">URL</h3>
                <a
                  href={selectedRequest.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  {selectedRequest.url}
                </a>
              </div>
              <div>
                <h3 className="font-semibold">Authentication Type</h3>
                <p>{getAuthLabel(selectedRequest.auth_type)}</p>
              </div>
              <div>
                <h3 className="font-semibold">Departments</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedRequest.departments.map((dept) => (
                    <Badge key={dept.id} variant="secondary">
                      {dept.name}
                    </Badge>
                  ))}
                </div>
              </div>
              {selectedRequest.image_url && (
                <div>
                  <h3 className="font-semibold">Image</h3>
                  <img
                    src={selectedRequest.image_url}
                    alt={selectedRequest.name}
                    className="mt-2 max-w-xs max-h-32 object-contain"
                  />
                </div>
              )}
              <div>
                <h3 className="font-semibold">Requested By</h3>
                <p>
                  {selectedRequest.requestedBy?.name || 'Unknown'} (
                  {selectedRequest.requestedBy?.email})
                </p>
              </div>
              <div>
                <h3 className="font-semibold">Status</h3>
                <Badge className={getStatusColor(selectedRequest.status)}>
                  {selectedRequest.status}
                </Badge>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
