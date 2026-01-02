import { createContext } from 'react';
import type { MetadataContextType } from './types';

export const MetadataContext = createContext<MetadataContextType | null>(null);
