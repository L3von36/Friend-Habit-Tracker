import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css';
import App from './App.tsx';
import './pwa'; // Register PWA Service Worker

import { SecurityProvider } from '@/context/SecurityContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SecurityProvider>
      <App />
    </SecurityProvider>
  </StrictMode>,
)
