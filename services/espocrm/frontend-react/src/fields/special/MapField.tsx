import React from 'react';
import { Input } from '@/components/ui/input';
import { MapPin, ExternalLink } from 'lucide-react';
import type { FieldProps } from '../types';
import { cn } from '@/lib/utils/cn';

interface MapCoordinates {
  latitude: number;
  longitude: number;
}

/**
 * Map field component - geographic coordinates display
 */
export function MapField({
  name,
  value,
  mode,
  onChange,
  disabled,
  readOnly,
  record,
  className,
}: FieldProps): React.ReactElement {
  // Parse coordinates from value or record
  let latitude: number | null = null;
  let longitude: number | null = null;

  if (typeof value === 'object' && value !== null) {
    const coords = value as MapCoordinates;
    latitude = coords.latitude ?? null;
    longitude = coords.longitude ?? null;
  } else if (typeof value === 'string' && value.includes(',')) {
    const parts = value.split(',').map((p) => parseFloat(p.trim()));
    const lat = parts[0];
    const lng = parts[1];
    if (parts.length === 2 && lat !== undefined && lng !== undefined && !isNaN(lat) && !isNaN(lng)) {
      latitude = lat;
      longitude = lng;
    }
  }

  // Also check for separate lat/lng fields in record
  const latField = `${name}Latitude`;
  const lngField = `${name}Longitude`;
  if (record?.[latField] != null && record?.[lngField] != null) {
    latitude = parseFloat(String(record[latField]));
    longitude = parseFloat(String(record[lngField]));
  }

  const hasCoordinates = latitude !== null && longitude !== null && !isNaN(latitude) && !isNaN(longitude);

  // Format coordinates for display
  const formatCoordinates = (): string => {
    if (!hasCoordinates) return '';
    return `${latitude!.toFixed(6)}, ${longitude!.toFixed(6)}`;
  };

  // Get Google Maps URL
  const getMapUrl = (): string => {
    if (!hasCoordinates) return '';
    return `https://www.google.com/maps?q=${latitude},${longitude}`;
  };

  // Get static map image URL (using OpenStreetMap)
  const getStaticMapUrl = (): string => {
    if (!hasCoordinates) return '';
    // Using OpenStreetMap's static map service
    return `https://staticmap.openstreetmap.de/staticmap.php?center=${latitude},${longitude}&zoom=14&size=300x200&markers=${latitude},${longitude},red`;
  };

  // Detail mode - map preview with link
  if (mode === 'detail') {
    if (!hasCoordinates) {
      return <span className={cn('text-muted-foreground', className)}>—</span>;
    }

    return (
      <div className={cn('space-y-2', className)}>
        {/* Static map preview */}
        <a
          href={getMapUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <div className="relative w-full max-w-sm h-40 bg-gray-100 rounded-md overflow-hidden border">
            <img
              src={getStaticMapUrl()}
              alt="Map location"
              className="w-full h-full object-cover"
              onError={(e) => {
                // Hide image on error, show fallback
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <MapPin className="h-8 w-8 text-red-500" />
            </div>
          </div>
        </a>

        {/* Coordinates with link */}
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <a
            href={getMapUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline inline-flex items-center gap-1 text-sm font-mono"
          >
            {formatCoordinates()}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    );
  }

  // List mode - compact coordinates
  if (mode === 'list') {
    if (!hasCoordinates) {
      return <span className={cn('text-muted-foreground', className)}>—</span>;
    }

    return (
      <a
        href={getMapUrl()}
        target="_blank"
        rel="noopener noreferrer"
        className={cn('text-blue-600 hover:underline inline-flex items-center gap-1', className)}
        onClick={(e) => e.stopPropagation()}
      >
        <MapPin className="h-3 w-3" />
        <span className="font-mono text-xs">{formatCoordinates()}</span>
      </a>
    );
  }

  // Edit mode - latitude and longitude inputs
  if (mode === 'edit') {
    const handleChange = (field: 'latitude' | 'longitude', newValue: string): void => {
      const numValue = newValue === '' ? null : parseFloat(newValue);
      onChange?.({
        latitude: field === 'latitude' ? numValue : latitude,
        longitude: field === 'longitude' ? numValue : longitude,
      });
    };

    return (
      <div className={cn('space-y-2', className)}>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-xs text-muted-foreground">Latitude</label>
            <Input
              name={`${name}Latitude`}
              type="number"
              step="any"
              value={latitude ?? ''}
              onChange={(e) => handleChange('latitude', e.target.value)}
              disabled={disabled}
              readOnly={readOnly}
              placeholder="-90 to 90"
              min={-90}
              max={90}
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-muted-foreground">Longitude</label>
            <Input
              name={`${name}Longitude`}
              type="number"
              step="any"
              value={longitude ?? ''}
              onChange={(e) => handleChange('longitude', e.target.value)}
              disabled={disabled}
              readOnly={readOnly}
              placeholder="-180 to 180"
              min={-180}
              max={180}
            />
          </div>
        </div>
        {hasCoordinates && (
          <a
            href={getMapUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1"
          >
            View on Map
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    );
  }

  // Search mode
  if (mode === 'search') {
    return (
      <Input
        name={name}
        value={formatCoordinates()}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder="lat, lng"
        className={cn('font-mono', className)}
      />
    );
  }

  return <span className="font-mono">{formatCoordinates() || '—'}</span>;
}
