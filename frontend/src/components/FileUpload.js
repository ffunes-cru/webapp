import React, { useState } from 'react';
import { postInvoices } from '../api/loaddata'; // O usa fetch

const FileUploader = ({setSelectedFiles, handleUpload, }) => {

  const handleFileChange = (event) => {
    // Almacena la lista de archivos seleccionados
    setSelectedFiles(event.target.files);
  };

  return (
    <div>
      <input type="file" multiple onChange={handleFileChange} />
      <button onClick={handleUpload}>Subir Archivos</button>
    </div>
  );
};

export default FileUploader;