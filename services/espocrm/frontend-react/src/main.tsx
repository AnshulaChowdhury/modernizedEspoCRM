import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { MetadataProvider } from '@/lib/metadata/MetadataProvider';
import { AclProvider } from '@/lib/acl';
import { ModalProvider } from '@/components/modals';
import { initI18n } from '@/lib/i18n/config';
import './index.css';
import App from './App';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

// Initialize i18n then render app
initI18n()
  .then(() => {
    createRoot(rootElement).render(
      <StrictMode>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <MetadataProvider>
              <AclProvider>
                <ModalProvider>
                  <App />
                </ModalProvider>
              </AclProvider>
            </MetadataProvider>
          </BrowserRouter>
        </QueryClientProvider>
      </StrictMode>
    );
  })
  .catch((error: unknown) => {
    console.error('Failed to initialize i18n:', error);
    // Render app anyway, translations will fall back to keys
    createRoot(rootElement).render(
      <StrictMode>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <MetadataProvider>
              <AclProvider>
                <ModalProvider>
                  <App />
                </ModalProvider>
              </AclProvider>
            </MetadataProvider>
          </BrowserRouter>
        </QueryClientProvider>
      </StrictMode>
    );
  });
