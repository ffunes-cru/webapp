import React, { useRef, useEffect, useState } from 'react';
import { Canvas, FabricImage, Rect } from 'fabric';
import HighlightEffect from './HighlightEffect';
import './styles.css';

const ImageViewer = ({ ocrData, imageUrl, selectedBox, setSelectedBox, setSelectedText, setSelectedItem, ProviderConfigs }) => {
  const canvasRef = useRef(null);
  const [canvasInstance, setCanvasInstance] = useState(null);

  // Hook principal que inicializa el canvas y reacciona a los cambios de imagen
  useEffect(() => {
    if (!canvasRef.current || !imageUrl || !ocrData) return;

    // Inicializar el canvas de Fabric.js
    const initCanvas = new Canvas(canvasRef.current, {
      width: ocrData?.width / 3 || 0,
      height: ocrData?.height / 3 || 0,
      selection: false, // Deshabilitar la selección nativa
    });
    setCanvasInstance(initCanvas);

    // 1. Crear el elemento de imagen HTML
    const imageElement = new Image();
    imageElement.src = imageUrl;
    imageElement.crossOrigin = "anonymous";

    // 2. Esperar a que la imagen se cargue antes de añadirla al canvas
    imageElement.onload = () => {
      // 3. Obtener las dimensiones de la imagen cargada
      const imageWidth = imageElement.naturalWidth;
      const imageHeight = imageElement.naturalHeight;
      
      // 4. Crear la instancia de FabricImage usando el elemento HTML ya cargado
      const fabricImg = new FabricImage(imageElement, {
          left: 0,
          top: 0,
          // Escalar la imagen al tamaño del canvas (si fuera necesario)
          scaleX: initCanvas.width / imageWidth,
          scaleY: initCanvas.height / imageHeight,
          opacity: 0.5,
          selectable: false,
          evented: false,
          hasControls: false,
          hoverCursor: "default",
      });

      initCanvas.add(fabricImg);
      initCanvas.renderAll();
    };

    // Configurar evento de clic en el canvas para seleccionar una bounding box
    initCanvas.on('mouse:up', function (o) {
      const pointer = initCanvas.getPointer(o.e);
      const clickX = pointer.x;
      const clickY = pointer.y;

      // Escalar las coordenadas de clic a las dimensiones originales del OCR
      const ocrScaleX = ocrData.width / initCanvas.width;
      const ocrScaleY = ocrData.height / initCanvas.height;

      const scaledClickX = clickX * ocrScaleX;
      const scaledClickY = clickY * ocrScaleY;

      let foundItem = null;
      for (const item of ocrData.layout_data) {
        const bbox = item.bounding_box;
        if (
          scaledClickX >= bbox.ulx &&
          scaledClickX <= bbox.lrx &&
          scaledClickY >= bbox.uly &&
          scaledClickY <= bbox.lry
        ) {
          foundItem = item;
          break;
        }
      }

      // Actualizar los estados del componente padre
      if (foundItem) {
        setSelectedBox(foundItem.bounding_box);
        setSelectedText(foundItem.text);
        setSelectedItem(foundItem);
      } else {
        setSelectedBox(null);
        setSelectedText('');
        setSelectedItem(null);
      }
    });

    return () => {
      // Limpieza al desmontar o re-renderizar
      if (initCanvas) {
        initCanvas.dispose();
      }
    };
  }, [imageUrl, ocrData, setSelectedBox, setSelectedText, setSelectedItem]);

  return (
    <div className="main-content">
      <h1>Invoice Automation Tool</h1>
      <div className="invoice-viewer">
        <canvas id="canvas" ref={canvasRef}/>
        <HighlightEffect 
          canvasInstance={canvasInstance}
          selectedBox={selectedBox}
          ocrData={ocrData}
          ProviderConfigs={ProviderConfigs}
        />
      </div>
    </div>
  );
};

export default ImageViewer;