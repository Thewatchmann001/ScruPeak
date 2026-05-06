import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { PrivyProvider } from '@privy-io/react-auth';

const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID || 'cmmxpr19800000cl51l48f0yv';

// Get the correct origin for embedded wallets
const getPrivyAppOrigin = () => {
  // For production GCP
  if (window.location.hostname === 'web-prod-1090857402667.us-central1.run.app' || 
      window.location.hostname.includes('run.app')) {
    return window.location.origin;
  }
  // For local development
  return window.location.origin;
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        loginMethods: ['email', 'google', 'wallet'],
        appearance: {
          theme: 'light',
          accentColor: '#006AFF',
          logo: 'https://web-prod-kqr3pbuu3a-uc.a.run.app/images/logo.jpg',
        },
        // Properly configure iframe settings
        fundingMethodConfig: {
          moonpay: {
            useSandbox: false,
          },
        },
      }}
    >
      <App />
    </PrivyProvider>
  </React.StrictMode>,
)
