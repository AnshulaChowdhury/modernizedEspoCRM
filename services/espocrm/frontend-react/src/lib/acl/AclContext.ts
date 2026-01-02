import { createContext } from 'react';
import type { AclContextValue } from './types';

export const AclContext = createContext<AclContextValue | null>(null);
