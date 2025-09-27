import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // ← добавьте эту строку
import App from './App';
import TestPlayer from './components/TestPlayer';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);