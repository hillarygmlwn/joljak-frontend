import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { AuthProvider } from './context/AuthContext';
import axios from 'axios';

// Axios 기본 설정
axios.defaults.baseURL = 'https://learningas.shop/';
axios.defaults.headers.common['Authorization'] = `Token ${localStorage.getItem('token')}`;

// root 노드에 렌더링
const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);

reportWebVitals();
