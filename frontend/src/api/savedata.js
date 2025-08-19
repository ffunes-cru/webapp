import api from './api';

export const postConfigData = async (provider_configs, provider_name) => {  
  const response = await api.post(`/config/${provider_name}`, provider_configs);
  return response;
};

export const getConfigData = async (provider_name) => {
  const response = await api.get(`/config/${provider_name}`);
  return response.data;
};


export const getAutoLog = async () => {
  const response = await api.get(`/config/log.txt`);
  return response.data;
};