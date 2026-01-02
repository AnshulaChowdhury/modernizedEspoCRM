import { useContext } from 'react';
import { MetadataContext } from './MetadataContext';
import type { MetadataContextType } from './types';

/**
 * Hook to access metadata context
 */
export function useMetadata(): MetadataContextType {
  const context = useContext(MetadataContext);
  if (!context) {
    throw new Error('useMetadata must be used within MetadataProvider');
  }
  return context;
}
