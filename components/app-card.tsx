'use client';

import { ExternalLink, Key, Shield, Lock, Plus, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ApplicationWithDepartments } from '@/types';
import { cn } from '@/lib/utils';
import { useRef, useEffect, useState } from 'react';
import { draggable, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import { setCustomNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview';
import { pointerOutsideOfPreview } from '@atlaskit/pragmatic-drag-and-drop/element/pointer-outside-of-preview';

const DEFAULT_APP_IMAGE = 'https://zgjvwacyowlsznpgmwdz.supabase.co/storage/v1/object/public/application-images/1769205453192-6gghs.svg';

interface AppCardProps {
  application: ApplicationWithDepartments;
  viewMode?: 'all' | 'my';
  isInMyApplications?: boolean;
  onToggleMyApplication?: (appId: string) => void;
  isDraggable?: boolean;
}

const getAuthIcon = (authType: string) => {
  switch (authType) {
    case 'sso':
      return <Shield className="h-4 w-4" />;
    case 'username_password':
      return <Lock className="h-4 w-4" />;
    case 'api_key':
      return <Key className="h-4 w-4" />;
    default:
      return <Lock className="h-4 w-4" />;
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

export function AppCard({ 
  application, 
  viewMode = 'all',
  isInMyApplications = false,
  onToggleMyApplication,
  isDraggable = false,
}: AppCardProps) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isOver, setIsOver] = useState(false);

  useEffect(() => {
    const element = titleRef.current;
    if (element) {
      setIsTruncated(element.scrollWidth > element.clientWidth);
    }
  }, [application.name]);

  useEffect(() => {
    const el = cardRef.current;
    if (!el || !isDraggable) return;

    return combine(
      draggable({
        element: el,
        getInitialData: () => ({ id: application.id }),
        onDragStart: () => setIsDragging(true),
        onDrop: () => setIsDragging(false),
        onGenerateDragPreview({ nativeSetDragImage }) {
          setCustomNativeDragPreview({
            nativeSetDragImage,
            getOffset: pointerOutsideOfPreview({
              x: '16px',
              y: '8px',
            }),
            render({ container }) {
              const preview = el.cloneNode(true) as HTMLElement;
              preview.style.width = `${el.offsetWidth}px`;
              container.appendChild(preview);
            },
          });
        },
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

  const titleElement = (
    <h3 
      ref={titleRef}
      className="font-semibold truncate text-base leading-tight cursor-default"
    >
      {application.name}
    </h3>
  );

  return (
    <Card 
      ref={cardRef}
      className={cn(
        "group relative overflow-hidden transition-all hover:shadow-lg p-0 flex flex-col h-full",
        isDraggable && "cursor-move",
        viewMode === 'all' && isInMyApplications && "border-2 border-[#C8102E]",
        isDragging && "opacity-40",
        isOver && "ring-2 ring-primary ring-offset-2"
      )}
    >
      {/* Image Row */}
      <div className="px-4 mt-3">
        <div className="relative h-20 w-full flex items-center justify-center bg-muted/30 p-2">
          <img
            src={application.image_url || DEFAULT_APP_IMAGE}
            alt={application.name}
            className="max-h-full max-w-full object-contain"
          />
        </div>
      </div>
      
      <div className="p-5 flex flex-col flex-1">
        {/* Title */}
        <div className="mb-2">
          {isTruncated ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  {titleElement}
                </TooltipTrigger>
                <TooltipContent>
                  <p>{application.name}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            titleElement
          )}
          <Badge variant="secondary" className="mt-1.5 text-xs h-5 inline-flex items-center gap-1">
            {getAuthIcon(application.auth_type)}
            {getAuthLabel(application.auth_type)}
          </Badge>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2 leading-snug mb-2 flex-1">
          {application.description}
        </p>

        {/* Buttons - Always at bottom */}
        <div className="mt-auto space-y-2">
          <Button
            variant="default"
            className="w-full h-9"
            onClick={() => window.open(application.url, '_blank')}
          >
            Open Application
            <ExternalLink className="ml-2 h-3.5 w-3.5" />
          </Button>
          
          {/* Add/Remove from My Applications button (only in "all" view) */}
          {viewMode === 'all' && onToggleMyApplication && (
            <Button
              variant={isInMyApplications ? "outline" : "secondary"}
              className="w-full h-8 text-xs"
              onClick={(e) => {
                e.preventDefault();
                onToggleMyApplication(application.id);
              }}
            >
              {isInMyApplications ? (
                <>
                  <X className="mr-1.5 h-3.5 w-3.5" />
                  Remove from My Apps
                </>
              ) : (
                <>
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Add to My Apps
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
