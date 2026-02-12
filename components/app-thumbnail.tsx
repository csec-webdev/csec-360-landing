'use client';

import { ApplicationWithDepartments } from '@/types';
import { cn } from '@/lib/utils';
import { useRef, useEffect, useState } from 'react';
import { draggable, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';

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
  const [isDragging, setIsDragging] = useState(false);
  const [isOver, setIsOver] = useState(false);

  useEffect(() => {
    const el = cardRef.current;
    if (!el || !isDraggable) return;

    return combine(
      draggable({
        element: el,
        getInitialData: () => ({ id: application.id }),
        onDragStart: () => setIsDragging(true),
        onDrop: () => setIsDragging(false),
      }),
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
        isDraggable && "cursor-move",
        isDragging && "opacity-40",
        isOver && "ring-2 ring-primary ring-offset-2"
      )}
    >
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
