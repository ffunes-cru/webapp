import axios from 'axios';

const baseEnv = 'http://localhost:5005';

const baseURL = baseEnv + '/api';

console.log(baseURL)
// Create and export the single, pre-configured Axios instance
const api = axios.create({
  baseURL,
});

export default api;
