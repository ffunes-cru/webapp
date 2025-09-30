import React, { useState, useEffect } from 'react';
import FileExplorer from './components/FileExplorer';
import GeminiQueryLauncher from './components/Gemini/GeminiPostAlt';
import ImageViewer from './components/ImageViewer';
import FileUploader from './components/FileUpload';
import ConfigManager from './components/ConfigManager';
import { getTreeData, getInvoiceData, postDeleteProv } from './api/providers'; 
import { postConfigData, getStatus, postGemini } from './api/savedata'; 
import { postInvoices, postCancelInv } from './api/loaddata';

import { ProgressPopUp } from './ProgressBar';
import { useProgressPopup } from './useProgressBar';

import { useInput } from './useProviderNamePopUp'; 
import { ProviderNamePopup } from './ProviderNamePopUp'; 

import './styles/App.css';

const App = () => {
  const [data, setData] = useState([]);
  const [ocrData, setOcrData] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [selectedBox, setSelectedBox] = useState(null);
  const [selectedItem, setSelectedItem] = useState({});
  const [selectedText, setSelectedText] = useState('');
  const [currentProvider, setCurrentProvider] = useState('');
  // El estado que guarda todas las configuraciones por proveedor
  const [allProviderConfigs, setAllProviderConfigs] = useState({});

  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showInput, setShowInput] = useState(false);

  const [geminiResponse, setGeminiResponse] = useState('');
  const [showGemini, setShowGemini] = useState('');

  const { 
    showPopup, 
    status,
    setJobId,
    jobId, 
    startProcessing, 
    updateProgress, 
    errorProcess, 
    closePopup 
  } = useProgressPopup();

  const [providerName, handleProviderNameChange, setProviderName] = useInput('');

  const handleOpenPopup = () => {
    setShowInput(true);
    console.log(showInput)
  };

  const handleClosePopup = () => {
    setShowInput(false);
  };

  const onSendQuery = async (query) => {
    const gemini_data = {
      "query" : query,
      "provider" : currentProvider
    }

    console.log(gemini_data)

    try {
      // 1. Oculta el pop-up anterior y resetea el estado
      closePopup()
      startProcessing()
      //updateProgress({ status: 'started', message: 'Subiendo archivos' });
      // 2. Llama al backend para iniciar el proceso
      const newJobId = await postGemini(gemini_data);
      // 3. Si se obtiene un Job ID, muestra el pop-up y guarda el ID
      if (newJobId) {
        
        setJobId(newJobId);
        console.log(newJobId)
        updateProgress({ status: 'started', message: 'GEMINI Started' });
      } else {
        errorProcess('No se pudo iniciar el proceso.');
      }
    } catch (error) {
      console.error('Error al iniciar la automatización:', error);
      errorProcess( 'Error de conexión.');
    }

  }

  
  const handleLoadProvider = async (name) => {
    try {
      // Crea un nuevo objeto FormData
      const formData = new FormData();
      setShowInput(true)
      closePopup()
      startProcessing()
      // Agrega cada archivo a FormData
      // La clave 'files' es la que el backend usará para acceder a los archivos
      for (const file of selectedFiles) {
        formData.append('files', file); 
      }
      const newJobId = await postInvoices(formData, name);
        // 3. Si se obtiene un Job ID, muestra el pop-up y guarda el ID
      if (newJobId) {
        setJobId(newJobId);
        updateProgress({ status: 'started', message: 'Iniciando proceso...' });
      } else {
        errorProcess('No se pudo iniciar el proceso.');
      }

    } catch (error) {
      errorProcess( 'Error de conexión.');
    }
    setShowInput(false); // Cierra el pop-up
  };

  // Lógica para cargar los datos del árbol (usando la nueva función)
  useEffect(() => {
    getTreeData()
      .then(treeData => setData(treeData))
      .catch(error => console.error('Error fetching tree data:', error));
  }, []);

  const handleRunAutomatization = async () => {
    try {
      // 1. Oculta el pop-up anterior y resetea el estado
      closePopup()
      startProcessing()
      updateProgress({ status: 'started', message: 'Subiendo archivos' });
      // 2. Llama al backend para iniciar el proceso
      const newJobId = await postConfigData(allProviderConfigs, currentProvider);
      // 3. Si se obtiene un Job ID, muestra el pop-up y guarda el ID
      if (newJobId) {
        
        setJobId(newJobId);
        console.log(newJobId)
        //updateProgress({ status: 'started', message: 'Subiendo archivos' });
      } else {
        errorProcess('No se pudo iniciar el proceso.');
      }
    } catch (error) {
      console.error('Error al iniciar la automatización:', error);
      errorProcess( 'Error de conexión.');
    }
  };

    // Lógica de polling (para consultar el estado del backend)
  useEffect(() => {
    let intervalId;
    if (jobId && status.status !== 'complete' && status.status !== 'error') {
      intervalId = setInterval(async () => {
        try {
          const currentStatus = await getStatus(jobId)
          updateProgress(currentStatus); // Actualiza el estado con la respuesta del backend

          if (status.status === 'complete' || status.status === 'error') {
            clearInterval(intervalId); // Detiene el polling
          }
          if (currentStatus == null) {
            clearInterval(intervalId);
            errorProcess('El estado es null');
          }
        } catch (error) {
          clearInterval(intervalId);
          errorProcess('Fallo al obtener el estado.');
        }
      }, 200); // Polling cada 2 segundos
    }

    // Función de limpieza para evitar fugas de memoria
    return () => clearInterval(intervalId);
  }, [jobId, status]);

  const handleDownload = () => {
    let downloadUrl = import.meta.env.VITE_API_BASE_URL + `/api/config/${currentProvider}`
    console.log("downloadUrl")
    console.log(downloadUrl)
    // Creates an anchor element and clicks it to trigger download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', 'processed_file.json'); // Suggest a filename
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteProv = async () => {
    const ret = await postDeleteProv(currentProvider)
    console.log(ret)
  };

  const handleFileSelect = async (node) => {
    if (node.isLeaf) {
      setCurrentProvider(node.data.id.split('-')[0]);
      const fileName = node.data.json_file;

      try {
        const invoiceData = await getInvoiceData(currentProvider, fileName);
        const baseURL = import.meta.env.VITE_API_BASE_URL
        setOcrData(invoiceData);
        setImageUrl(`${baseURL}/providers/${currentProvider}/${invoiceData.img}`);
        setSelectedBox(null);
        setSelectedText('');
      } catch (error) {
        console.error('Error fetching invoice data:', error);
      }
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className="panel-buttons-toggle" align="left">
            <button onClick={() => setIsLeftPanelCollapsed(!isLeftPanelCollapsed)}>
                {isLeftPanelCollapsed ? '▶' : '◀'}
            </button>
        </div>
        <div className="divider"></div>
        <div className="App-header">
          <div>
            <button onClick={handleDeleteProv}>Borrar proveedor</button>
            {showInput && (
              <ProviderNamePopup
                inputValue={providerName} // Pasar el valor actual
                onInputChange={handleProviderNameChange} // Pasar la función de manejo de cambios
                onSubmit={handleLoadProvider}
                onCancel={handleClosePopup}
              />
            )}
          </div>
          <div className="divider"></div>
          <div>
            <FileUploader
            handleUpload={handleOpenPopup}
            setSelectedFiles = {setSelectedFiles}
            />
          </div>
          <div className="divider"></div>
          <div>
            <button onClick={() => {setShowGemini(!showGemini)}}>GEMINI</button>
            {showGemini && (
              <GeminiQueryLauncher
              onSendQuery={onSendQuery}
              geminiResponse={geminiResponse}
              setShowGemini={setShowGemini}
              >
                <h3>Proveedor actual: {currentProvider}</h3>
              </GeminiQueryLauncher>
            )}
          </div>
          <div className="divider"></div>
          <button onClick={handleDownload}>Descargar</button>
            <ProgressPopUp
              showPopup={showPopup}
              status={status}
              closePopup={closePopup}
              handleDownload={handleDownload}
            />
        </div>
        <div className="right-aligned-button">
            <button onClick={() => setIsRightPanelCollapsed(!isRightPanelCollapsed)}>
                {isRightPanelCollapsed ? '◀' : '▶'}
            </button>
        </div>
      </header>
      <div className="app-container">
        <div className={`left-panel ${isLeftPanelCollapsed ? 'collapsed' : ''}`}>
         <FileExplorer data={data} onFileSelect={handleFileSelect} />
        </div>

        <div className="main-content">
              <ImageViewer
          ocrData={ocrData}
          imageUrl={imageUrl}
          selectedBox={selectedBox}
          setSelectedBox={setSelectedBox}
          setSelectedText={setSelectedText}
          setSelectedItem={setSelectedItem}
          ProviderConfigs={allProviderConfigs[currentProvider] || []}
        />
        </div>
        
        <div className={`right-panel ${isRightPanelCollapsed ? 'collapsed' : ''}`}>
          <ConfigManager 
            providerName={currentProvider}
            allProviderConfigs={allProviderConfigs}
            setAllProviderConfigs={setAllProviderConfigs}
            selectedItem={selectedItem}
            setSelectedItem={setSelectedItem}
            setSelectedBox={setSelectedBox}
            handleRunAutomatization={handleRunAutomatization}
          />
        </div>
      </div>
    </div>
  );
};

export default App;