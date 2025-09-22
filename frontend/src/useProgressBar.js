// src/hooks/useProgressPopup.js

import { useState } from 'react';
import { postCancelInv } from './api/loaddata'
export const useProgressPopup = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [status, setStatus] = useState({
    status: 'idle',
    progress: 0,
    message: '',
    download_url: null,
  });
  const [jobId, setJobId] = useState(null);

  // Funciones para controlar el estado
  const startProcessing = () => {
    setShowPopup(true);
    setStatus({
      status: 'processing',
      progress: 0,
      message: 'Procesando...',
      download_url: null,
    });
  };

  const updateProgress = (newStatus) => {
    setStatus(prevStatus => ({
      ...prevStatus,
      ...newStatus,
    }));
  };

  const completeProcess = (url) => {
    setStatus({
      status: 'complete',
      progress: 100,
      message: 'Proceso Finalizado',
      download_url: url,
    });
  };

  const errorProcess = (errorMessage = 'Ha ocurrido un error. Inténtalo de nuevo.') => {
    setStatus({
      status: 'error',
      progress: 0,
      message: errorMessage,
      download_url: null,
    });
  };

  const closePopup = () => {
    let currstatus = status.status
    if ((currstatus != "complete" && currstatus != "error") && jobId){
        postCancelInv(jobId)
    }
    setShowPopup(false);
  };

  return {
    jobId,
    setJobId,
    showPopup,
    status,
    startProcessing,
    updateProgress,
    completeProcess,
    errorProcess,
    closePopup
  };
};