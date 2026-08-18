import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

// Safari iOS compatibility fix - ensure DOM is ready
const initializeApp = () => {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    return;
  }
  
  try {
    const root = createRoot(rootElement);
    
    root.render(
      <StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </StrictMode>
    );
  } catch (error) {
    rootElement.innerHTML = '<div style="padding: 20px; text-align: center;"><h2>Application Error</h2><p>Failed to initialize. Please refresh the page.</p></div>';
  }
};

// Use DOMContentLoaded for Safari compatibility
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
