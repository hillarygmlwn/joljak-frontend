// src/axios.js
import axios from 'axios';

const instance = axios.create({
  baseURL: 'https://learningas.shop',
});

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Token ${token}`;
  return config;
});

export default instance;
