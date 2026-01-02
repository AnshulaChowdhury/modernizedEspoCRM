import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { File, X, Download, Plus } from 'lucide-react';
import type { FieldProps } from '../types';
import { cn } from '@/lib/utils/cn';

interface AttachmentValue {
  id: string;
  name: string;
  type?: string;
  size?: number;
}

/**
 * AttachmentMultiple field component - multiple file attachments
 */
export function AttachmentMultipleField({
  name,
  value,
  mode,
  onChange,
  disabled,
  readOnly,
  className,
}: FieldProps): React.ReactElement {
  const inputRef = useRef<HTMLInputElement>(null);

  // Parse attachments array
  const attachments: AttachmentValue[] = Array.isArray(value)
    ? (value as AttachmentValue[])
    : [];

  // Format file size
  const formatSize = (bytes?: number): string => {
    if (!bytes) return '';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  // Get download URL
  const getDownloadUrl = (id: string): string => {
    return `/api/v1/Attachment/file/${id}`;
  };

  // Detail mode - list of files
  if (mode === 'detail') {
    if (attachments.length === 0) {
      return <span className={cn('text-muted-foreground', className)}>—</span>;
    }

    return (
      <div className={cn('space-y-2', className)}>
        {attachments.map((file) => (
          <div key={file.id} className="flex items-center gap-2">
            <File className="h-4 w-4 text-muted-foreground" />
            <a
              href={getDownloadUrl(file.id)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline flex-1"
            >
              {file.name}
            </a>
            {file.size && (
              <span className="text-xs text-muted-foreground">
                {formatSize(file.size)}
              </span>
            )}
            <a
              href={getDownloadUrl(file.id)}
              download={file.name}
              className="text-muted-foreground hover:text-blue-600"
            >
              <Download className="h-4 w-4" />
            </a>
          </div>
        ))}
      </div>
    );
  }

  // List mode - count display
  if (mode === 'list') {
    if (attachments.length === 0) {
      return <span className={cn('text-muted-foreground', className)}>—</span>;
    }

    return (
      <span className={cn('inline-flex items-center gap-1', className)}>
        <File className="h-3 w-3" />
        {attachments.length} file{attachments.length !== 1 ? 's' : ''}
      </span>
    );
  }

  // Edit mode - file list with upload
  if (mode === 'edit') {
    const handleFilesSelect = (e: React.ChangeEvent<HTMLInputElement>): void => {
      const files = e.target.files;
      if (files && files.length > 0) {
        const newAttachments = Array.from(files).map((file) => ({
          id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          type: file.type,
          size: file.size,
          file: file,
        }));
        onChange?.([...attachments, ...newAttachments]);
      }
      // Reset input
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    };

    const handleRemove = (id: string): void => {
      onChange?.(attachments.filter((a) => a.id !== id));
    };

    return (
      <div className={cn('space-y-2', className)}>
        <input
          ref={inputRef}
          type="file"
          multiple
          onChange={handleFilesSelect}
          disabled={disabled || readOnly}
          className="hidden"
          id={`attachments-${name}`}
        />

        {attachments.length > 0 && (
          <div className="space-y-1 border rounded-md p-2">
            {attachments.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-2 p-1 hover:bg-muted/50 rounded"
              >
                <File className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="flex-1 truncate text-sm">{file.name}</span>
                {file.size && (
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {formatSize(file.size)}
                  </span>
                )}
                {!disabled && !readOnly && (
                  <button
                    type="button"
                    onClick={() => handleRemove(file.id)}
                    className="text-muted-foreground hover:text-red-600 flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || readOnly}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Files
        </Button>
      </div>
    );
  }

  // Search mode - not typically used
  if (mode === 'search') {
    return <span className={cn('text-muted-foreground', className)}>—</span>;
  }

  return <span>{attachments.length} file(s)</span>;
}
