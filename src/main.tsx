
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initializeEnvironmentCheck } from './utils/envCheck'

// Initialize environment check
initializeEnvironmentCheck();

// Add loading indicator while the app initializes
const rootElement = document.getElementById("root");
if (rootElement) {
  // Show loading state
  rootElement.innerHTML = `
    <div style="
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    ">
      <div style="text-align: center;">
        <div style="
          width: 40px;
          height: 40px;
          border: 3px solid rgba(255,255,255,0.3);
          border-top: 3px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        "></div>
        <h2 style="margin: 0; font-size: 24px; font-weight: 600;">Loading...</h2>
        <p style="margin: 10px 0 0; opacity: 0.8;">Sybase to Oracle Migration Tool</p>
      </div>
    </div>
    <style>
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>
  `;
  
  // Render the app
  createRoot(rootElement).render(<App />);
} else {
  console.error('Root element not found');
}
