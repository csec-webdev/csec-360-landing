'use client';

import { Star, ExternalLink, Key, Shield, Lock, Plus, X } from 'lucide-react';
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

const DEFAULT_APP_IMAGE = 'https://zgjvwacyowlsznpgmwdz.supabase.co/storage/v1/object/public/application-images/1769205453192-6gghs.svg';

interface AppCardProps {
  application: ApplicationWithDepartments;
  isFavorited: boolean;
  onToggleFavorite: (appId: string) => void;
  viewMode?: 'all' | 'my';
  isInMyApplications?: boolean;
  onToggleMyApplication?: (appId: string) => void;
  isDraggable?: boolean;
  onDragStart?: (e: React.DragEvent, appId: string) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, appId: string) => void;
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
  isFavorited, 
  onToggleFavorite,
  viewMode = 'all',
  isInMyApplications = false,
  onToggleMyApplication,
  isDraggable = false,
  onDragStart,
  onDragOver,
  onDrop,
}: AppCardProps) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    const element = titleRef.current;
    if (element) {
      setIsTruncated(element.scrollWidth > element.clientWidth);
    }
  }, [application.name]);

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
      className={cn(
        "group relative overflow-hidden transition-all hover:shadow-lg p-0 flex flex-col h-full",
        isDraggable && "cursor-move"
      )}
      draggable={isDraggable}
      onDragStart={(e) => onDragStart?.(e, application.id)}
      onDragOver={(e) => onDragOver?.(e)}
      onDrop={(e) => onDrop?.(e, application.id)}
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
        {/* Title and Favorite */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
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
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.preventDefault();
              onToggleFavorite(application.id);
            }}
            className="shrink-0 h-7 w-7 -mt-1"
          >
            <Star
              className={cn(
                'h-4 w-4',
                isFavorited ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
              )}
            />
          </Button>
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
