import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon, Upload, X, ZoomIn } from 'lucide-react';
import type { FieldProps } from '../types';
import { cn } from '@/lib/utils/cn';

interface ImageValue {
  id: string;
  name?: string;
  type?: string;
  size?: number;
}

/**
 * Image field component - image upload with preview
 */
export function ImageField({
  name,
  value,
  mode,
  onChange,
  disabled,
  readOnly,
  className,
}: FieldProps): React.ReactElement {
  const inputRef = useRef<HTMLInputElement>(null);
  const [showLightbox, setShowLightbox] = useState(false);

  // Parse image value
  let imageData: ImageValue | null = null;
  if (typeof value === 'object' && value !== null && 'id' in value) {
    imageData = value as ImageValue;
  } else if (typeof value === 'string' && value) {
    imageData = { id: value };
  }

  // Get image URL
  const getImageUrl = (id: string, size?: 'small' | 'medium' | 'large'): string => {
    const sizeParam = size ? `?size=${size}` : '';
    return `/api/v1/Attachment/file/${id}${sizeParam}`;
  };

  // Detail mode - display image with lightbox
  if (mode === 'detail') {
    if (!imageData) {
      return <span className={cn('text-muted-foreground', className)}>—</span>;
    }

    return (
      <>
        <div
          className={cn('relative inline-block cursor-pointer group', className)}
          onClick={() => setShowLightbox(true)}
        >
          <img
            src={getImageUrl(imageData.id, 'medium')}
            alt={imageData.name ?? 'Image'}
            className="max-w-full max-h-48 rounded-md object-cover"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center">
            <ZoomIn className="h-6 w-6 text-white" />
          </div>
        </div>

        {/* Lightbox */}
        {showLightbox && (
          <div
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={() => setShowLightbox(false)}
          >
            <button
              className="absolute top-4 right-4 text-white hover:text-gray-300"
              onClick={() => setShowLightbox(false)}
            >
              <X className="h-8 w-8" />
            </button>
            <img
              src={getImageUrl(imageData.id)}
              alt={imageData.name ?? 'Image'}
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </>
    );
  }

  // List mode - thumbnail
  if (mode === 'list') {
    if (!imageData) {
      return <span className={cn('text-muted-foreground', className)}>—</span>;
    }

    return (
      <img
        src={getImageUrl(imageData.id, 'small')}
        alt={imageData.name ?? 'Image'}
        className={cn('h-8 w-8 rounded object-cover', className)}
      />
    );
  }

  // Edit mode - image upload with preview
  if (mode === 'edit') {
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>): void => {
      const file = e.target.files?.[0];
      if (file) {
        // Validate it's an image
        if (!file.type.startsWith('image/')) {
          return;
        }
        // In a real implementation, this would upload the file
        onChange?.({
          id: `temp-${Date.now()}`,
          name: file.name,
          type: file.type,
          size: file.size,
          file: file,
          // Create preview URL
          previewUrl: URL.createObjectURL(file),
        });
      }
    };

    const handleRemove = (): void => {
      onChange?.(null);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    };

    const previewUrl = imageData
      ? (imageData as ImageValue & { previewUrl?: string }).previewUrl ?? getImageUrl(imageData.id, 'medium')
      : null;

    return (
      <div className={cn('space-y-2', className)}>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={disabled || readOnly}
          className="hidden"
          id={`image-${name}`}
        />

        {previewUrl ? (
          <div className="relative inline-block">
            <img
              src={previewUrl}
              alt="Preview"
              className="max-w-full max-h-48 rounded-md object-cover border"
            />
            {!disabled && !readOnly && (
              <button
                type="button"
                onClick={handleRemove}
                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
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
            className="w-full h-24 border-dashed"
          >
            <div className="flex flex-col items-center gap-1">
              <ImageIcon className="h-6 w-6 text-muted-foreground" />
              <span className="text-sm">
                <Upload className="h-3 w-3 inline mr-1" />
                Upload Image
              </span>
            </div>
          </Button>
        )}
      </div>
    );
  }

  // Search mode - not typically used for images
  if (mode === 'search') {
    return <span className={cn('text-muted-foreground', className)}>—</span>;
  }

  return imageData ? (
    <img src={getImageUrl(imageData.id, 'small')} alt="" className="h-8 w-8 rounded object-cover" />
  ) : (
    <span>—</span>
  );
}
