import React, { useEffect, useState } from 'react';
import { ThemeProvider, CssBaseline, Snackbar, Alert } from '@mui/material';
import Workspace from './Component/Workspace';
import { appTheme } from './theme/theme';

function App() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  useEffect(() => {
    // 1. Service Worker Registration
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        console.log('ServiceWorker registered:', reg.scope);
      }).catch((err) => {
        console.error('ServiceWorker registration failed:', err);
      });
    }

    // 2. Offline Listeners
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 3. SharedWorker for cross-tab sync
    if (window.SharedWorker) {
      const sharedWorker = new SharedWorker(new URL('./workers/sharedWorker.ts', import.meta.url), { type: 'module' });
      sharedWorker.port.onmessage = (event) => {
        if (event.data?.type === 'WORKSPACE_SYNC') {
          setSyncMessage(event.data.message);
        }
      };
      
      // Let other tabs know this tab opened
      sharedWorker.port.postMessage({ type: 'WORKSPACE_SYNC', message: 'A new workspace tab was opened' });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <Workspace />
      
      {/* Offline Indicator */}
      <Snackbar open={isOffline} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="warning" sx={{ width: '100%' }}>
          You are currently offline. Showing cached documents.
        </Alert>
      </Snackbar>

      {/* Cross-Tab Sync Notification */}
      <Snackbar 
        open={!!syncMessage} 
        autoHideDuration={3000} 
        onClose={() => setSyncMessage(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="info" onClose={() => setSyncMessage(null)}>{syncMessage}</Alert>
      </Snackbar>
    </ThemeProvider>
  );
}

export default App;
