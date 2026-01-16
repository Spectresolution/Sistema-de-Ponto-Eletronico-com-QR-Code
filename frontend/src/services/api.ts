import axios from 'axios';

const backendPort = 3000;
const protocol = window.location.protocol;
const hostname = window.location.hostname;

const baseURL = `${protocol}//${hostname}:${backendPort}/api`;

export const api = axios.create({
  baseURL,
});
