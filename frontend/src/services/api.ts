import axios from 'axios';

const backendPort = 3000;
const protocol = window.location.protocol;
const hostname = window.location.hostname;

const baseURL = `${protocol}//${hostname}:${backendPort}/api`;

export const api = axios.create({
  baseURL,
});

// 🔐 Envia token automaticamente
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
