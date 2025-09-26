import api from './api';


export const getTreeData = async () => {
  const response = await api.get('/tree-data');
  return response.data;
};

export const getInvoiceData = async (providerName, fileName) => {
  const response = await api.get(`/invoice_data/${providerName}/${fileName}`);
  return response.data;
};

export const postDeleteProv = async (providerName) => {
  try {
    const response = await api.post(`/delete/${providerName}`);
    return response.data;
  } catch (error) {
    console.error('Error al borrar el proveedor', error);
    return error.response.data; 
  }
};


