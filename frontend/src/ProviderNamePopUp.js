import React from 'react';
import {useInput} from './useProviderNamePopUp'; // Adjust the import path as needed

export const ProviderNamePopup = ({ onSubmit, onCancel }) => {
  const [providerName, handleProviderNameChange, setProviderName] = useInput('');

  const handleSubmit = () => {
    // Pass the input value to the parent component
    onSubmit(providerName);
    // You can reset the input after submission if needed
    setProviderName('');
  };

  return (
    <div className="popup-overlay">
      <div className="popup-content">
        <h2>Ingresar Nombre del Proveedor</h2>
        <p>Por favor, ingrese el nombre del proveedor para la carga:</p>
        <div className="input-container">
          <label htmlFor="provider-name-input">Nombre:</label>
          <input
            type="text"
            id="provider-name-input"
            name="provider-name-input"
            placeholder="Ej: Google Cloud"
            value={providerName}
            onChange={handleProviderNameChange}
          />
        </div>
        <div className="button-container">
          <button onClick={onCancel} className="btn cancel">Cancelar</button>
          <button onClick={handleSubmit} className="btn submit">Cargar</button>
        </div>
      </div>
    </div>
  );
};