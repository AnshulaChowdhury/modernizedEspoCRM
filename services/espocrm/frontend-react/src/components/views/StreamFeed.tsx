import React, { useState, useCallback } from 'react';
import { useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import {
  MessageSquare,
  Mail,
  Phone,
  Calendar,
  FileText,
  Edit,
  Trash2,
  MoreHorizontal,
  Send,
  Paperclip,
  ThumbsUp,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { get, post as apiPost, del } from '@/api/client';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { cn } from '@/lib/utils/cn';

interface StreamFeedProps {
  /** Entity type (e.g., 'Account', 'Contact') */
  entityType?: string;
  /** Record ID for record-specific stream */
  recordId?: string;
  /** Show global stream if no entity/record specified */
  global?: boolean;
  className?: string;
}

interface StreamNote {
  id: string;
  type: 'Post' | 'Email' | 'Call' | 'Meeting' | 'Task' | 'Update' | 'Create' | 'Status';
  post?: string;
  data?: Record<string, unknown>;
  parentType?: string;
  parentId?: string;
  parentName?: string;
  createdAt: string;
  createdById?: string;
  createdByName?: string;
  isInternal?: boolean;
  attachments?: Array<{ id: string; name: string; type: string }>;
}

interface StreamResponse {
  total: number;
  list: StreamNote[];
}

const PAGE_SIZE = 20;

export function StreamFeed({
  entityType,
  recordId,
  global = false,
  className,
}: StreamFeedProps): React.ReactElement {
  const queryClient = useQueryClient();
  const [newPost, setNewPost] = useState('');
  const [isInternal, setIsInternal] = useState(false);

  // Build query key and URL based on props
  const queryKey = entityType && recordId
    ? ['stream', entityType, recordId]
    : global
    ? ['stream', 'global']
    : ['stream'];

  const getStreamUrl = (offset: number) => {
    if (entityType && recordId) {
      return `/${entityType}/${recordId}/stream?maxSize=${PAGE_SIZE}&offset=${offset}`;
    }
    return `/Stream?maxSize=${PAGE_SIZE}&offset=${offset}`;
  };

  // Fetch stream with infinite scroll
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery<StreamResponse, Error>({
    queryKey,
    queryFn: async ({ pageParam = 0 }) => {
      const response = await get<StreamResponse>(getStreamUrl(pageParam as number));
      return response;
    },
    getNextPageParam: (lastPage, allPages) => {
      const totalFetched = allPages.reduce((sum, page) => sum + page.list.length, 0);
      return totalFetched < lastPage.total ? totalFetched : undefined;
    },
    initialPageParam: 0,
  });

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async (postContent: string) => {
      const payload: Record<string, unknown> = {
        post: postContent,
        type: 'Post',
        isInternal,
      };

      if (entityType && recordId) {
        payload.parentType = entityType;
        payload.parentId = recordId;
      }

      const response = await apiPost<StreamNote>('/Note', payload);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setNewPost('');
    },
  });

  // Delete note mutation
  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      await del(`/Note/${noteId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const handleSubmitPost = useCallback(() => {
    if (!newPost.trim()) return;
    createPostMutation.mutate(newPost);
  }, [newPost, createPostMutation]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSubmitPost();
      }
    },
    [handleSubmitPost]
  );

  const allNotes = data?.pages.flatMap((page) => page.list) ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
        Error loading stream: {error.message}
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* New post form */}
      <div className="rounded-lg border p-4 bg-card">
        <textarea
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write a post..."
          className="w-full min-h-[80px] p-3 rounded-md border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" title="Attach file">
              <Paperclip className="h-4 w-4" />
            </Button>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={isInternal}
                onChange={(e) => setIsInternal(e.target.checked)}
                className="rounded"
              />
              Internal
            </label>
          </div>
          <Button
            onClick={handleSubmitPost}
            disabled={!newPost.trim() || createPostMutation.isPending}
            size="sm"
          >
            <Send className="h-4 w-4 mr-2" />
            {createPostMutation.isPending ? 'Posting...' : 'Post'}
          </Button>
        </div>
      </div>

      {/* Stream items */}
      <div className="space-y-4">
        {allNotes.map((note) => (
          <StreamItem
            key={note.id}
            note={note}
            onDelete={() => deleteNoteMutation.mutate(note.id)}
          />
        ))}

        {allNotes.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No activity yet
          </div>
        )}

        {hasNextPage && (
          <div className="text-center">
            <Button
              variant="outline"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? 'Loading...' : 'Load more'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

interface StreamItemProps {
  note: StreamNote;
  onDelete: () => void;
}

function StreamItem({ note, onDelete }: StreamItemProps): React.ReactElement {
  const [showMenu, setShowMenu] = useState(false);

  const icon = getStreamIcon(note.type);
  const title = getStreamTitle(note);
  const content = getStreamContent(note);
  const timeAgo = formatTimeAgo(new Date(note.createdAt));

  return (
    <div className="rounded-lg border p-4 bg-card">
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
            getStreamIconColor(note.type)
          )}
        >
          {icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <span className="font-medium text-sm">
                {note.createdByName ?? 'System'}
              </span>
              <span className="text-muted-foreground text-sm mx-1">•</span>
              <span className="text-muted-foreground text-sm">{title}</span>
              {note.parentType && note.parentName && (
                <>
                  <span className="text-muted-foreground text-sm mx-1">on</span>
                  <Link
                    to={`/${note.parentType}/view/${note.parentId}`}
                    className="text-primary text-sm hover:underline"
                  >
                    {note.parentName}
                  </Link>
                </>
              )}
            </div>

            {/* Actions menu */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setShowMenu(!showMenu)}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>

              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 z-20 bg-background border rounded-md shadow-lg py-1 min-w-[100px]">
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onDelete();
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted w-full text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Time */}
          <div className="text-xs text-muted-foreground mt-0.5">
            {timeAgo}
            {note.isInternal && (
              <span className="ml-2 px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs">
                Internal
              </span>
            )}
          </div>

          {/* Content */}
          {content && (
            <div className="mt-2 text-sm whitespace-pre-wrap">{content}</div>
          )}

          {/* Attachments */}
          {note.attachments && note.attachments.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {note.attachments.map((attachment) => (
                <a
                  key={attachment.id}
                  href={`/api/v1/Attachment/file/${attachment.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded text-sm hover:bg-muted/80"
                >
                  <FileText className="h-3 w-3" />
                  {attachment.name}
                </a>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="mt-3 flex items-center gap-4">
            <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <ThumbsUp className="h-4 w-4" />
              Like
            </button>
            <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <MessageSquare className="h-4 w-4" />
              Comment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function getStreamIcon(type: string): React.ReactNode {
  switch (type) {
    case 'Post':
      return <MessageSquare className="h-5 w-5" />;
    case 'Email':
      return <Mail className="h-5 w-5" />;
    case 'Call':
      return <Phone className="h-5 w-5" />;
    case 'Meeting':
      return <Calendar className="h-5 w-5" />;
    case 'Task':
      return <FileText className="h-5 w-5" />;
    case 'Update':
    case 'Create':
      return <Edit className="h-5 w-5" />;
    default:
      return <MessageSquare className="h-5 w-5" />;
  }
}

function getStreamIconColor(type: string): string {
  switch (type) {
    case 'Post':
      return 'bg-blue-100 text-blue-600';
    case 'Email':
      return 'bg-purple-100 text-purple-600';
    case 'Call':
      return 'bg-green-100 text-green-600';
    case 'Meeting':
      return 'bg-orange-100 text-orange-600';
    case 'Task':
      return 'bg-yellow-100 text-yellow-600';
    case 'Update':
      return 'bg-gray-100 text-gray-600';
    case 'Create':
      return 'bg-emerald-100 text-emerald-600';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

function getStreamTitle(note: StreamNote): string {
  switch (note.type) {
    case 'Post':
      return 'posted';
    case 'Email':
      return 'sent an email';
    case 'Call':
      return 'logged a call';
    case 'Meeting':
      return 'scheduled a meeting';
    case 'Task':
      return 'created a task';
    case 'Update':
      return 'updated';
    case 'Create':
      return 'created';
    case 'Status':
      return 'changed status';
    default:
      return String(note.type).toLowerCase();
  }
}

function getStreamContent(note: StreamNote): string | null {
  if (note.post) {
    return note.post;
  }

  if (note.type === 'Update' && note.data) {
    // Format field changes
    const changes: string[] = [];
    const data = note.data as Record<string, { was?: unknown; became?: unknown }>;

    for (const [field, change] of Object.entries(data)) {
      if (change.was !== undefined || change.became !== undefined) {
        changes.push(
          `${formatFieldName(field)}: ${formatValue(change.was)} → ${formatValue(change.became)}`
        );
      }
    }

    return changes.join('\n');
  }

  return null;
}

function formatFieldName(name: string): string {
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '(empty)';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;

  return date.toLocaleDateString();
}

export default StreamFeed;
