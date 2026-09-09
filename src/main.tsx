import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { LicenseProvider } from './context/LicenseContext';
import { UserAiProvider } from './context/UserAiContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LicenseProvider>
      <UserAiProvider>
        <App />
      </UserAiProvider>
    </LicenseProvider>
  </StrictMode>,
);
