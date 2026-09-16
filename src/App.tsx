import { useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@/presentation/theme/ThemeContext';
import { ToastProvider } from '@/presentation/components/ToastContext';
import { AppRoutes } from '@/presentation/routes/AppRoutes';
import { container } from '@/infrastructure/container';
import { LoadingLogo } from '@/presentation/components/LoadingLogo';
import './presentation/theme/theme.css';

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void container.initialize().then(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          background: '#0F0A12',
        }}
      >
        <LoadingLogo />
        <span style={{ color: '#C9B7C5', fontSize: 13, fontWeight: 600 }}>Iniciando Copiado Alfonzo...</span>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <ToastProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  );
}
