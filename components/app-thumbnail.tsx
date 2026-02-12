'use client';

import { ApplicationWithDepartments } from '@/types';
import { cn } from '@/lib/utils';
import { useRef, useEffect, useState } from 'react';
import { draggable, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import { setCustomNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview';
import { pointerOutsideOfPreview } from '@atlaskit/pragmatic-drag-and-drop/element/pointer-outside-of-preview';
import { GripVertical } from 'lucide-react';

const DEFAULT_APP_IMAGE = 'https://zgjvwacyowlsznpgmwdz.supabase.co/storage/v1/object/public/application-images/1769205453192-6gghs.svg';

interface AppThumbnailProps {
  application: ApplicationWithDepartments;
  isDraggable?: boolean;
}

export function AppThumbnail({ 
  application, 
  isDraggable = false,
}: AppThumbnailProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isOver, setIsOver] = useState(false);

  useEffect(() => {
    const el = cardRef.current;
    const handle = handleRef.current;
    if (!el || !isDraggable || !handle) return;

    return combine(
      // Only the handle is draggable, but shows the entire card as preview
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
              // Clone the entire card for the preview
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
      // The entire card is a drop target
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
      ref={cardRef}
      onClick={() => window.open(application.url, '_blank')}
      className={cn(
        "group relative overflow-hidden rounded-lg border bg-card p-4 transition-all hover:shadow-md cursor-pointer flex flex-col items-center gap-3",
        isDragging && "opacity-40",
        isOver && "ring-2 ring-primary ring-offset-2"
      )}
    >
      {/* Drag Handle - only visible when draggable */}
      {isDraggable && (
        <div
          ref={handleRef}
          onClick={(e) => e.stopPropagation()}
          className="absolute top-1 right-1 p-1 rounded cursor-move hover:bg-muted/80 transition-colors"
          title="Drag to reorder"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      )}

      {/* Logo */}
      <div className="relative h-16 w-16 flex items-center justify-center">
        <img
          src={application.image_url || DEFAULT_APP_IMAGE}
          alt={application.name}
          className="max-h-full max-w-full object-contain"
        />
      </div>
      
      {/* Name */}
      <p className="text-sm font-medium text-center line-clamp-2 leading-tight">
        {application.name}
      </p>
    </div>
  );
}
