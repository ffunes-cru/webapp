import axios from 'axios';

const baseURL = process.env.REACT_APP_API_BASE_URL;

console.log(baseURL)
// Create and export the single, pre-configured Axios instance
const api = axios.create({
  baseURL,
});

export default api;