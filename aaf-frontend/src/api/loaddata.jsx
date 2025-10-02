import api from './api';

export const postInvoices = async (formData, provider_name) => {
    try {
      // Envía la solicitud POST al backend
      const response = await api.post(`/upload-files/${provider_name}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      //console.log('Archivos subidos con éxito:', response.data);
      console.log(response)
      return response.data.job_id
    } catch (error) {
      console.error('Error al subir archivos:', error);
      return error
    } 
};

export const postCancelInv = async (job_id) => {
  const response = await api.post(`/cancel-process/${job_id}`);
  return response.data;
};


