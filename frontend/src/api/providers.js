import api from './api';

export const getTreeData = async () => {
  const response = await api.get('/tree-data');
  return response.data;
};

export const getInvoiceData = async (providerName, fileName) => {
  const response = await api.get(`/invoice_data/${providerName}/${fileName}`);
  return response.data;
};