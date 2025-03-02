import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles/tailwind.css'; // Import Tailwind CSS
import './styles/global.css'; // Import global styles
import App from './App';

const container = document.getElementById('root');
if (!container) throw new Error('Failed to find the root element');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
