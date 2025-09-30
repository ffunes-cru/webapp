import axios from 'axios';

const baseEnv = import.meta.env.VITE_API_BASE_URL;

const baseURL = baseEnv + '/api';

console.log(baseURL)
// Create and export the single, pre-configured Axios instance
const api = axios.create({
  baseURL,
});

export default api;
