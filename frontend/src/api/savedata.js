import api from './api';

export const postConfigData = async (provider_configs, provider_name) => {
  try {
    const response = await api.post(`/config/${provider_name}`, provider_configs);
    // El backend devuelve algo como { "job_id": "..." }
    // Devolvemos solo el job_id de la respuesta
    return response.data.job_id; 
  } catch (error) {
    console.error('Error al enviar la configuración:', error);
    // Manejar el error apropiadamente, por ejemplo, devolviendo null
    return null; 
  }
};

//export const getConfigData = async (provider_name) => {
//  const response = await api.get(`/config/${provider_name}`);
// return response.config.url.va;
//};

export const getStatus = async (job_id) => {
  const response = await api.get(`/status/${job_id}`);
  return response.data;
};

export const getAutoLog = async () => {
  const response = await api.get(`/config/log.txt`);
  return response.data;
};

export const postGemini = async (gemini_data) => {
  try {
    const response = await api.post(`/gemini`, gemini_data)

    return response.data.job_id
  } catch (error) {
    console.error('Error during fetch:', error);
  }
};