import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

// Add debug logging for iOS
console.log('App initializing...');
console.log('User Agent:', navigator.userAgent);
console.log('Platform:', navigator.platform);

// Safari iOS compatibility fix - ensure DOM is ready
const initializeApp = () => {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error('Root element not found!');
    return;
  }
  
  console.log('Root element found, mounting React...');
  
  try {
    const root = createRoot(rootElement);
    
    root.render(
      <StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </StrictMode>
    );
    
    console.log('React mounted successfully');
  } catch (error) {
    console.error('Failed to mount React:', error);
    rootElement.innerHTML = '<div style="padding: 20px; text-align: center;"><h2>Application Error</h2><p>Failed to initialize. Please refresh the page.</p></div>';
  }
};

// Use DOMContentLoaded for Safari compatibility
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
