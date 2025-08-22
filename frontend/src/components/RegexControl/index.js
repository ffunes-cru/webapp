import React, { useState, useEffect } from 'react'; 
import './styles.css';

const RegexControls = ({ selectedItem, config, onSave }) => {
  const [regexInput, setRegexInput] = useState('');
  const [regexOutput, setRegexOutput] = useState('');
  const [showRegexHelp, setShowRegexHelp] = useState(false);
  const [replaceText, setReplaceText] = useState('');
  const [replaceWith, setReplaceWith] = useState('');
  const [replacementType, setReplacementType] = useState('substring');
  const [formatPattern, setFormatPattern] = useState('');
  const [formattedOutput, setFormattedOutput] = useState('');
  const [strip, setStrip] = useState(true);
  const provider_name = config.provider_name;
  const selectedText = selectedItem?.text || '';
  const selectedId = selectedItem?.annotation_id || '';
  const [configName, setConfigName] = useState(''); // <-- Nuevo estado para el nombre de la config

  // Sincronizar estados locales con el prop 'config' cuando cambie
  useEffect(() => {
    if (config) {
      setRegexInput(config.regex || '');
      setStrip(config.cleaning?.trim || '');
      setReplaceText(config.cleaning?.replace?.from || '');
      setReplaceWith(config.cleaning?.replace?.to || '');
      setReplacementType(config.cleaning?.replace?.type || '');
      setFormatPattern(config.format || '');
    }
  }, [config]);

  // La lógica del useEffect que corre la regex y aplica limpieza
  useEffect(() => {

    let result = selectedText;
    
    if (regexInput) {
      try {
        const regex = new RegExp(regexInput);
        const match = selectedText.match(regex);
        if (match) {
          result = match[1] || match[0];
        } else {
          result = 'No match found.';
        }
      } catch (error) {
        result = 'Invalid regex syntax.';
      }
    }

    // --- Opciones de limpieza (si la regex tuvo éxito) ---
    if (result !== 'No match found.' && result !== 'Invalid regex syntax.') {
      // Reemplazar texto
      if (replaceText && replaceWith) {
        if (replacementType === 'substring') {
          const replaceRegex = new RegExp(replaceText, 'g');
          result = result.replace(replaceRegex, replaceWith);
        } else if (replacementType === 'character') {
          const charsToReplace = new Set(replaceText);
          result = [...result].map(char => charsToReplace.has(char) ? replaceWith : char).join('');
        }
      }
      // Trim se aplica por defecto después de la limpieza
      result = result.trim();
    }
    
    setRegexOutput(result);

    // --- Aplicar formato ---
    if (result && formatPattern && result !== 'No match found.' && result !== 'Invalid regex syntax.') {
      let formatted = '';
      let patternIndex = formatPattern.length - 1; // Start from the end of the pattern
      let resultIndex = result.length - 1; // Start from the end of the result string
      
      while (patternIndex >= 0 && resultIndex >= 0) {
        const patternChar = formatPattern[patternIndex];
        const resultChar = result[resultIndex];
        
        if (patternChar === '#') { // Pattern for any character
          formatted = resultChar + formatted;
          resultIndex--;
        } else if (patternChar === '_') { // Pattern for numbers only
          if (/\d/.test(resultChar)) {
            formatted = resultChar + formatted;
          } else {
            // Skip non-numeric characters in the result string
            resultIndex--;
            continue;
          }
          resultIndex--;
        } else { // Literal character in the pattern (like a comma or period)
          formatted = patternChar + formatted;
          // Don't consume a character from the result string
        }
        patternIndex--;
      }

      // Handle remaining characters from the result string (if any)
      while (resultIndex >= 0) {
        formatted = result[resultIndex] + formatted;
        resultIndex--;
      }
      
      setFormattedOutput(formatted);
    } else {
      setFormattedOutput('');
    }

  }, [selectedText, regexInput, strip, replaceText, replaceWith, formatPattern]);

  // --- Función que construye el objeto y llama a la función del padre ---
  const handleSaveButtonClick = () => {
      
    const finalConfig = {
      item: selectedItem,
      // The regular expression to extract the value
      regex: regexInput,
      provider_name : provider_name,
      field_name : configName,
      // Post-processing rules
      cleaning: {
        trim: strip,
        replace: {
          from: replaceText,
          to: replaceWith,
          type: replacementType
        }
      },
      // Formatting rules for the final output
      format: formatPattern // Your pattern
    }
    console.log("finalConfig:")
    console.log(finalConfig)
    onSave(finalConfig); // <-- Llamar a la función del padre
  };

    return (
    <div className="right-panel">
        <h3>Extraction Parameters</h3>
        <p>Selected Text: <strong>{selectedText || 'None'}</strong></p>
        {/* --- Nuevo campo para el nombre de la configuración --- */}
        <div className="config-name-input">
            <label>Nombre de la Configuración:</label>
            <input 
              type="text" 
              value={configName} 
              onChange={(e) => setConfigName(e.target.value)}
            />
        </div>

        <div className="regex-input-group">
            <label htmlFor="regex-input">Expresión Regular</label>
            <div className="regex-controls">
            <input 
                id="regex-input"
                type="text" 
                value={regexInput}
                onChange={(e) => setRegexInput(e.target.value)}
                placeholder="e.g., (\d+)"
            />
            <button className="help-button" onClick={() => setShowRegexHelp(!showRegexHelp)}>
                ?
            </button>
            </div>
        </div>

        {/* --- Nuevos Controles de Limpieza --- */}
        <div className="cleaning-options">
            <h4>Opciones de Limpieza</h4>
            <label>
            <input 
                type="checkbox" 
                checked={strip}
                onChange={(e) => setStrip(e.target.checked)}
            />
            Eliminar espacios al inicio/final (Trim)
            </label>
            
            <h4>Opciones de Limpieza y Reemplazo</h4>
            <div className="replace-group">
                <label>
                Reemplazar:
                <select 
                    value={replacementType} 
                    onChange={(e) => setReplacementType(e.target.value)}
                    className="replacement-type-select"
                >
                    <option value="substring">Subcadena</option>
                    <option value="character">Carácter por carácter</option>
                </select>
                </label>
                <div className="replace-inputs">
                <input 
                    type="text" 
                    placeholder="Texto a reemplazar" 
                    value={replaceText}
                    onChange={(e) => setReplaceText(e.target.value)}
                />
                <span> por </span>
                <input 
                    type="text" 
                    placeholder="Texto de reemplazo" 
                    value={replaceWith}
                    onChange={(e) => setReplaceWith(e.target.value)}
                />
                </div>
            </div>
        </div>
        {/* --- Fin Nuevos Controles de Limpieza --- */}

        <div className="regex-output">
            <h4>Resultado de Regex</h4>
            <p>{regexOutput}</p>
        </div>

        {/* --- Nuevo Campo de Formato --- */}
        <div className="format-options">
            <h4>Aplicar Formato</h4>
            <input
            type="text"
            placeholder="Patrón (Ej: ####-######)"
            value={formatPattern}
            onChange={(e) => setFormatPattern(e.target.value)}
            />
            <p>Salida Formateada: {formattedOutput}</p>
        </div>
        {/* --- Fin Nuevo Campo de Formato --- */}
        
        {showRegexHelp && (
        <div className="regex-help-popup">
            <h4>Regex Syntax Help</h4>
            <p><strong>.</strong> - Any character</p>
            <p><strong>*</strong> - Zero or more of the preceding</p>
            <p><strong>+</strong> - One or more of the preceding</p>
            <p><strong>?</strong> - Zero or one of the preceding</p>
            <p><strong>\d</strong> - A digit (0-9)</p>
            <p><strong>\w</strong> - A word character (a-z, A-Z, 0-9, _)</p>
            <p><strong>()</strong> - Capture group</p>
            <p><strong>[]</strong> - Character set</p>
            <p><strong>|</strong> - OR operator</p>
            <button onClick={() => setShowRegexHelp(false)}>Close</button>
        </div>
        )}

        <div className="regex-output">
        <h4>Output</h4>
        <p>{regexOutput}</p>
        </div>

        <button onClick={handleSaveButtonClick}>Guardar Configuración</button>

    </div>
  );

};

export default RegexControls;