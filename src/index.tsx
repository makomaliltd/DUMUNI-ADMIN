import React from 'react';
import ReactDOM from 'react-dom/client';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { App } from './App';
import './index.css';

const rootElement = document.getElementById('app');

if (!rootElement) {
  throw new Error('Root element not found');
}

function Fallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-8">
      <div className="max-w-md text-center">
        <div className="mb-4 text-6xl">⚠️</div>
        <h1 className="mb-2 text-2xl font-bold text-foreground">Something went wrong</h1>
        <p className="mb-6 text-muted-foreground">
          The application encountered an unexpected error. Please try refreshing the page.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Refresh Page
        </button>
      </div>
    </div>
  );
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ErrorBoundary fallback={<Fallback />}>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);