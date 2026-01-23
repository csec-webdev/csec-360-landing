'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Department } from '@/types';
import { FolderTree } from 'lucide-react';

interface DepartmentTabsProps {
  departments: Department[];
  selectedDepartment: string;
  onDepartmentChange: (departmentId: string) => void;
}

export function DepartmentTabs({
  departments,
  selectedDepartment,
  onDepartmentChange,
}: DepartmentTabsProps) {
  return (
    <Select value={selectedDepartment} onValueChange={onDepartmentChange}>
      <SelectTrigger className="w-[220px]">
        <div className="flex items-center gap-2">
          <FolderTree className="h-4 w-4" />
          <SelectValue placeholder="All Departments" />
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Departments</SelectItem>
        {departments.map((dept) => (
          <SelectItem key={dept.id} value={dept.id}>
            {dept.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
