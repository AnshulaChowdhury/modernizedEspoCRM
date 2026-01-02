import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { File, Upload, X, Download } from 'lucide-react';
import type { FieldProps } from '../types';
import { cn } from '@/lib/utils/cn';

interface FileValue {
  id: string;
  name: string;
  type?: string;
  size?: number;
}

/**
 * File field component - single file upload
 */
export function FileField({
  name,
  value,
  mode,
  onChange,
  disabled,
  readOnly,
  className,
}: FieldProps): React.ReactElement {
  const inputRef = useRef<HTMLInputElement>(null);

  // Parse file value
  let fileData: FileValue | null = null;
  if (typeof value === 'object' && value !== null && 'id' in value) {
    fileData = value as FileValue;
  } else if (typeof value === 'string' && value) {
    fileData = { id: value, name: 'File' };
  }

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

  // Detail mode - display file with download link
  if (mode === 'detail') {
    if (!fileData) {
      return <span className={cn('text-muted-foreground', className)}>—</span>;
    }

    return (
      <div className={cn('flex items-center gap-2', className)}>
        <File className="h-4 w-4 text-muted-foreground" />
        <a
          href={getDownloadUrl(fileData.id)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          {fileData.name}
        </a>
        {fileData.size && (
          <span className="text-xs text-muted-foreground">
            ({formatSize(fileData.size)})
          </span>
        )}
        <a
          href={getDownloadUrl(fileData.id)}
          download={fileData.name}
          className="text-muted-foreground hover:text-blue-600"
        >
          <Download className="h-4 w-4" />
        </a>
      </div>
    );
  }

  // List mode - compact file display
  if (mode === 'list') {
    if (!fileData) {
      return <span className={cn('text-muted-foreground', className)}>—</span>;
    }

    return (
      <a
        href={getDownloadUrl(fileData.id)}
        className={cn('text-blue-600 hover:underline inline-flex items-center gap-1', className)}
        onClick={(e) => e.stopPropagation()}
      >
        <File className="h-3 w-3" />
        {fileData.name}
      </a>
    );
  }

  // Edit mode - file upload
  if (mode === 'edit') {
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>): void => {
      const file = e.target.files?.[0];
      if (file) {
        // In a real implementation, this would upload the file and get back an ID
        // For now, we'll pass the File object
        onChange?.({
          id: `temp-${Date.now()}`,
          name: file.name,
          type: file.type,
          size: file.size,
          file: file, // Include file for upload handling
        });
      }
    };

    const handleRemove = (): void => {
      onChange?.(null);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    };

    return (
      <div className={cn('space-y-2', className)}>
        <input
          ref={inputRef}
          type="file"
          onChange={handleFileSelect}
          disabled={disabled || readOnly}
          className="hidden"
          id={`file-${name}`}
        />

        {fileData ? (
          <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
            <File className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1 truncate">{fileData.name}</span>
            {fileData.size && (
              <span className="text-xs text-muted-foreground">
                {formatSize(fileData.size)}
              </span>
            )}
            {!disabled && !readOnly && (
              <button
                type="button"
                onClick={handleRemove}
                className="text-muted-foreground hover:text-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={() => inputRef.current?.click()}
            disabled={disabled || readOnly}
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            Choose File
          </Button>
        )}
      </div>
    );
  }

  // Search mode - not typically used for files
  if (mode === 'search') {
    return <span className={cn('text-muted-foreground', className)}>—</span>;
  }

  return <span>{fileData?.name ?? '—'}</span>;
}
