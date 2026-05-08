import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './ErrorBoundary.jsx'

window.onerror = function (message, source, lineno, colno, error) {
  document.body.innerHTML = `<div style="color: red; padding: 20px; background: black; z-index: 9999; position: absolute; top: 0; left: 0; right: 0; bottom: 0;">
    <h1>Runtime Error</h1>
    <p>${message}</p>
    <pre>${error?.stack}</pre>
  </div>`;
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
