import React, { useState, useEffect } from 'react';
import FileExplorer from './components/FileExplorer';
import ImageViewer from './components/ImageViewer';
import ConfigManager from './components/ConfigManager';
import { getTreeData, getInvoiceData } from './api/providers'; 
import { postConfigData, getConfigData } from './api/savedata'; 
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

  // Lógica para cargar los datos del árbol (usando la nueva función)
  useEffect(() => {
    getTreeData()
      .then(treeData => setData(treeData))
      .catch(error => console.error('Error fetching tree data:', error));
  }, []);


  const handleFileSelect = async (node) => {
    if (node.isLeaf) {
      setCurrentProvider(node.data.id.split('-')[0]);
      const fileName = node.data.json_file;

      try {
        const invoiceData = await getInvoiceData(currentProvider, fileName);
        setOcrData(invoiceData);
        setImageUrl(`http://localhost:5005/providers/${currentProvider}/${invoiceData.img}`);
        setSelectedBox(null);
        setSelectedText('');
      } catch (error) {
        console.error('Error fetching invoice data:', error);
      }
    }
  };

  return (
    <div className="app-container">
      <FileExplorer data={data} onFileSelect={handleFileSelect} />
      <ImageViewer
        ocrData={ocrData}
        imageUrl={imageUrl}
        selectedBox={selectedBox}
        setSelectedBox={setSelectedBox}
        setSelectedText={setSelectedText}
        setSelectedItem={setSelectedItem}
        ProviderConfigs={allProviderConfigs[currentProvider] || []}
      />
      <ConfigManager 
        providerName={currentProvider}
        allProviderConfigs={allProviderConfigs}
        setAllProviderConfigs={setAllProviderConfigs}
        selectedItem={selectedItem}
        setSelectedItem={setSelectedItem}
        setSelectedBox={setSelectedBox}
      />
    </div>
  );
};

export default App;