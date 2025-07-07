import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Enhanced Error Boundary will be imported from the app
const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);

root.render(
    <React.StrictMode>
        <App/>
    </React.StrictMode>
);

// Register service worker for PWA capabilities (optional)
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}