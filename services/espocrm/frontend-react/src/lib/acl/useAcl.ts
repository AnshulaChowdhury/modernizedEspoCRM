import { useContext } from 'react';
import { AclContext } from './AclContext';
import type { AclContextValue } from './types';

/**
 * Hook to access ACL context
 */
export function useAcl(): AclContextValue {
  const context = useContext(AclContext);
  if (!context) {
    throw new Error('useAcl must be used within an AclProvider');
  }
  return context;
}

export { useAcl as useAclContext };
