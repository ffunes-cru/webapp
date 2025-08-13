// src/components/ConfigManager/index.js
import React, { useEffect, useState, useRef } from 'react';
import RegexControls from './RegexControl';

const ConfigManager = ({ providerName, allProviderConfigs, setAllProviderConfigs, selectedItem, setSelectedItem, setSelectedBox }) => {
  const [activeConfig, setActiveConfig] = useState(null); // La configuración que se está editando
  const [editingMode, setEditingMode] = useState(null); // 'new', 'edit'
  const providerConfigs = allProviderConfigs[providerName] || [];
  const selectRef = useRef(null);

  useEffect(() => {
    if (!selectedItem?.annotation_id) { return }
    if (!selectRef.current) { return }
    
    const config = providerConfigs.find(c => c.item?.annotation_id === selectedItem?.annotation_id);
    if ( config ){
      setEditingMode('edit');
      setActiveConfig(config);
      selectRef.current.value = config?.item?.text
    } else {
      console.log("entra al otro")
      setEditingMode(null);
      //setEditingMode('new');
    }
  }, [selectedItem]);
  
  const handleSelectConfig = (configName) => {
    // If the user selects the blank option, clear the state
    if (!configName) {
      setActiveConfig(null);
      setEditingMode(null);
      setSelectedItem(null);
      setSelectedBox(null);
      return;
    }
    // Si se selecciona del combobox, activar modo 'edit'
    const config = providerConfigs.find(c => c.item?.text === configName);

    if (config) {
      setSelectedItem(config.item);
      setSelectedBox(config.item?.bounding_box)
      setActiveConfig(config);
      // Ahora llamas a la función que recibiste como prop
      //selectedItem = config.item;
      setEditingMode('edit');
    } else {
      setSelectedBox(null);
      setActiveConfig(null);
      setSelectedItem(null);
      setEditingMode(null);
    }
  };

  const handleNewConfig = () => {

    // Activar modo 'new' con una configuración vacía
    setActiveConfig({
      item: selectedItem,
      provider_name: providerName,
      regex: '',
      cleaning: { trim: false, replace: { from: '', to: '', type: 'substring' } },
      format: ''
    });
    setEditingMode('new');
  };

  // --- Nueva función para guardar una configuración ---
  const handleSave = (configData) => {
      // 1. Clonar el estado para no mutarlo directamente
     
      const updatedConfigs = { ...allProviderConfigs };
      console.log("entra")
      // 2. Obtener el array de configuraciones del proveedor actual o crear uno nuevo
      const NewProviderConfigs = updatedConfigs[providerName] || [];

      // 3. Lógica para reemplazar o añadir la configuración
      const existingIndex = NewProviderConfigs.findIndex(c => c.item?.annotation_id === configData.item?.annotation_id);
      console.log(configData.item?.annotation_id)
      console.log(existingIndex)

      if (existingIndex !== -1) {
          // Si existe, reemplazamos la entrada
          NewProviderConfigs[existingIndex] = configData;
      } else {
          // Si no existe, lo añadimos
          NewProviderConfigs.push(configData);
      }
      
      // 4. Actualizar el diccionario y el estado
      updatedConfigs[providerName] = NewProviderConfigs;
      setAllProviderConfigs(updatedConfigs);
      setEditingMode(null); // Ocultar RegexControls
      console.log('Configuración guardada en estado:', updatedConfigs);
  };

  const handleDeleteSelection = (selectionNameToDelete) => {
    const updatedConfigs = { ...providerConfigs };
    const CproviderConfigs = updatedConfigs[providerName] || [];

    const filteredConfigs = CproviderConfigs.filter(
        (sel) => sel.name !== selectionNameToDelete
    );

    updatedConfigs[providerName] = filteredConfigs;
    setAllProviderConfigs(updatedConfigs);

    console.log("Configuración eliminada:", updatedConfigs);
  };
  
  return (
    <div className="right-panel">
      {/* ComboBox para seleccionar configuraciones */}
      <select ref={selectRef} onChange={(e) => handleSelectConfig(e.target.value)}>
        <option value="">-- Seleccionar --</option>
        {providerConfigs.map(config => (
          <option key={config.item?.id} value={config.item?.text}>{config.item?.text}</option>
        ))}
      </select>
      <button onClick={handleNewConfig}>Nuevo</button>
      
      {/* Mostrar RegexControls solo si se está en modo de edición */}
      {(editingMode === 'new' || editingMode === 'edit') && (
        <RegexControls 
          selectedItem={selectedItem}
          config={activeConfig} // Pasar la configuración para editar o vacía
          onSave={handleSave}
        />
      )}
    </div>
  );
};
export default ConfigManager;