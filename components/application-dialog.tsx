'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { ImageUpload } from './image-upload';
import { ApplicationWithDepartments, Department, AUTH_TYPES } from '@/types';
import { toast } from 'sonner';

interface ApplicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application?: ApplicationWithDepartments | null;
  departments: Department[];
  onSuccess: () => void;
}

export function ApplicationDialog({
  open,
  onOpenChange,
  application,
  departments,
  onSuccess,
}: ApplicationDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    url: '',
    image_url: '',
    auth_type: 'username_password',
  });
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);

  useEffect(() => {
    if (application) {
      setFormData({
        name: application.name,
        description: application.description || '',
        url: application.url,
        image_url: application.image_url || '',
        auth_type: application.auth_type,
      });
      setSelectedDepartments(application.departments.map((d) => d.id));
    } else {
      setFormData({
        name: '',
        description: '',
        url: '',
        image_url: '',
        auth_type: 'username_password',
      });
      setSelectedDepartments([]);
    }
  }, [application, open]);

  const toggleDepartment = (deptId: string) => {
    setSelectedDepartments((prev) =>
      prev.includes(deptId) ? prev.filter((id) => id !== deptId) : [...prev, deptId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        departmentIds: selectedDepartments,
      };

      const url = application
        ? `/api/applications/${application.id}`
        : '/api/applications';
      const method = application ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to save application');
      }

      toast.success(application ? 'Application updated' : 'Application created');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving application:', error);
      toast.error('Failed to save application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {application ? 'Edit Application' : 'Create Application'}
          </DialogTitle>
          <DialogDescription>
            {application
              ? 'Update application details'
              : 'Add a new application to the directory'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">URL *</Label>
            <Input
              id="url"
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="https://example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="auth_type">Authentication Type *</Label>
            <Select
              value={formData.auth_type}
              onValueChange={(value) => setFormData({ ...formData, auth_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AUTH_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Image</Label>
            <ImageUpload
              value={formData.image_url}
              onChange={(url) => setFormData({ ...formData, image_url: url })}
            />
          </div>

          <div className="space-y-2">
            <Label>Departments</Label>
            <div className="flex flex-wrap gap-2">
              {departments.map((dept) => (
                <Badge
                  key={dept.id}
                  variant={selectedDepartments.includes(dept.id) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleDepartment(dept.id)}
                >
                  {dept.name}
                  {selectedDepartments.includes(dept.id) && (
                    <X className="ml-1 h-3 w-3" />
                  )}
                </Badge>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : application ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
