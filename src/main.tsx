import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { StackProvider } from '@stackframe/stack';
import stackApp from './lib/auth';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <StackProvider app={stackApp}>
        <App />
      </StackProvider>
    </BrowserRouter>
  </StrictMode>
);
