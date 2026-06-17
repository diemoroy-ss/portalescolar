import React from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/context/AuthContext';
import { AppRouter } from '@/routes/AppRouter';
import './index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element #root not found in the document');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <AuthProvider>
      <AppRouter />
      <Toaster
        position="bottom-right"
        richColors
        expand
        toastOptions={{
          style: {
            background: '#111c16',
            border: '1px solid #1f3028',
            color: '#f0f4f1',
          },
        }}
      />
    </AuthProvider>
  </React.StrictMode>,
);
