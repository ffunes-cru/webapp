// src/components/ProgressPopUp.js

import React from 'react';
import './styles/popup.css'; // Asume que tienes el CSS

export const ProgressPopUp = ({ status, showPopup, closePopup, handleDownload }) => {
  if (!showPopup) return null; //TODO no muestra cancelar si tira error

  return (
    <div className="popup-overlay">
      <div className="popup-content">
        <h3>{status.status === 'complete' ? 'Proceso Finalizado' : 'Procesando...'}</h3>
        <p>{status.message}</p>
        
        {/* Barra de progreso */}
        <div className="progress-bar-container">
          <div
            className="progress-bar"
            style={{ width: `${status.progress}%` }}
          ></div>
        </div>
        
        {/* Mensaje de progreso */}
        <p>{status.progress}%</p>

        {/* Botón de descarga */}
        {status.status === 'complete' && status.download_url && (
          <button onClick={handleDownload} className="download-button">Descargar Archivo</button>
        )}
        
        {/* Mensaje de error */}
        {status.status === 'error' && (
            <p className="error-message">Ha ocurrido un error. Inténtalo de nuevo.</p>
        )}
        
        <button onClick={closePopup}>Cerrar</button>
      </div>
    </div>
  );
};