import api from './api';

export const postConfigData = async (selections, provider_name) => {  
  const response = await api.post(`/config/${provider_name}`, selections);
  return response;
};

export const getConfigData = async (provider_name) => {
  const response = await api.get(`/config/${provider_name}`);
  return response.data;
};