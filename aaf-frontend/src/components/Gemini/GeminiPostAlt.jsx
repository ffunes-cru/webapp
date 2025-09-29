import React, { useState, useEffect } from 'react';
// Asumiendo que useInput manejaría el estado de la consulta
import { useInput } from './useGeminiPostAlt';

const GeminiQueryLauncher = ({ onSendQuery, geminiResponse, children, setShowGemini }) => {
  const [query, handleQueryChange, setQuery] = useInput('');
  
  // Estado para el historial de chat, si quieres mostrar múltiples interacciones
  const [chatHistory, setChatHistory] = useState([]);

  const handleSubmit = () => {
    // Solo enviamos si hay una consulta
    if (query.trim() === '') return;
    
    // Llamar a la función del padre para enviar la consulta
    onSendQuery(query);
    
    // Opcional: limpiar la consulta después de enviar
    setQuery('');
    setShowGemini(false)
  };

  // Esto es para mostrar la respuesta de Gemini cuando llega
  // Puedes usar un useEffect para actualizar el historial cuando geminiResponse cambie
  useEffect(() => {
    if (geminiResponse) {
      setChatHistory(prevHistory => [...prevHistory, { query: query, response: geminiResponse }]);
    }
  }, [geminiResponse]);
  
  return (
    <div className="popup-overlay">
      <div className="popup-content">
        <h2>Consultas a Gemini</h2>
        {children}
        <div className="query-container">
          <textarea
            id="gemini-query-input"
            name="gemini-query-input"
            rows="5"
            placeholder="Escribe tu consulta aquí... Ej: 'Calcula el total de las facturas seleccionadas'"
            value={query}
            onChange={handleQueryChange}
          />
        </div>

        <div className="button-container">
          <button onClick={handleSubmit} className="btn submit">Enviar Consulta</button>
          <button onClick={() => {setShowGemini(false)}} className="btn submit">Cerrar</button>
        </div>
        
        <div className="response-container">
          <h3>Historial de Chat</h3>
          {chatHistory.length > 0 ? (
            chatHistory.map((item, index) => (
              <div key={index} className="chat-item">
                <p><strong>Tú:</strong> {item.query}</p>
                <p><strong>Gemini:</strong> {item.response}</p>
              </div>
            ))
          ) : (
            <p>Aún no hay respuestas. Envía tu primera consulta.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default GeminiQueryLauncher