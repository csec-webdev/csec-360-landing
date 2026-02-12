'use client';

import { ApplicationWithDepartments } from '@/types';
import { cn } from '@/lib/utils';
import { useRef, useEffect, useState } from 'react';
import { draggable, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import { setCustomNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview';
import { pointerOutsideOfPreview } from '@atlaskit/pragmatic-drag-and-drop/element/pointer-outside-of-preview';
import { Key, Shield, Lock, GripVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const DEFAULT_APP_IMAGE = 'https://zgjvwacyowlsznpgmwdz.supabase.co/storage/v1/object/public/application-images/1769205453192-6gghs.svg';

interface AppListRowProps {
  application: ApplicationWithDepartments;
  isDraggable?: boolean;
}

const getAuthIcon = (authType: string) => {
  switch (authType) {
    case 'sso':
      return <Shield className="h-3.5 w-3.5" />;
    case 'username_password':
      return <Lock className="h-3.5 w-3.5" />;
    case 'api_key':
      return <Key className="h-3.5 w-3.5" />;
    default:
      return <Lock className="h-3.5 w-3.5" />;
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

export function AppListRow({ 
  application, 
  isDraggable = false,
}: AppListRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isOver, setIsOver] = useState(false);

  useEffect(() => {
    const el = rowRef.current;
    const handle = handleRef.current;
    if (!el || !isDraggable || !handle) return;

    return combine(
      // Only the handle is draggable, but shows the entire row as preview
      draggable({
        element: handle,
        getInitialData: () => ({ id: application.id }),
        onGenerateDragPreview: ({ nativeSetDragImage }) => {
          setCustomNativeDragPreview({
            nativeSetDragImage,
            getOffset: pointerOutsideOfPreview({
              x: '16px',
              y: '16px',
            }),
            render({ container }) {
              // Clone the entire row for the preview
              const clone = el.cloneNode(true) as HTMLElement;
              clone.style.width = `${el.offsetWidth}px`;
              clone.style.height = `${el.offsetHeight}px`;
              container.appendChild(clone);
            },
          });
        },
        onDragStart: () => setIsDragging(true),
        onDrop: () => setIsDragging(false),
      }),
      // The entire row is a drop target
      dropTargetForElements({
        element: el,
        getData: () => ({ id: application.id }),
        onDragEnter: () => setIsOver(true),
        onDragLeave: () => setIsOver(false),
        onDrop: () => setIsOver(false),
      })
    );
  }, [application.id, isDraggable]);

  return (
    <div
      ref={rowRef}
      onClick={() => window.open(application.url, '_blank')}
      className={cn(
        "group relative overflow-hidden rounded-lg border bg-card p-4 transition-all hover:shadow-md cursor-pointer flex items-center gap-4",
        isDragging && "opacity-40",
        isOver && "ring-2 ring-primary ring-offset-2"
      )}
    >
      {/* Drag Handle - only visible when draggable */}
      {isDraggable && (
        <div
          ref={handleRef}
          onClick={(e) => e.stopPropagation()}
          className="flex-shrink-0 p-1 rounded cursor-move hover:bg-muted/80 transition-colors"
          title="Drag to reorder"
        >
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>
      )}

      {/* Logo */}
      <div className="relative h-12 w-12 flex-shrink-0 flex items-center justify-center bg-muted/30 rounded p-2">
        <img
          src={application.image_url || DEFAULT_APP_IMAGE}
          alt={application.name}
          className="max-h-full max-w-full object-contain"
        />
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-base truncate">
          {application.name}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-1">
          {application.description}
        </p>
      </div>

      {/* Auth Badge */}
      <Badge variant="secondary" className="flex-shrink-0 text-xs h-6 inline-flex items-center gap-1">
        {getAuthIcon(application.auth_type)}
        {getAuthLabel(application.auth_type)}
      </Badge>
    </div>
  );
}
