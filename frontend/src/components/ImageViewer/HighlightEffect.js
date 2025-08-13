// src/components/ImageViewer/HighlightEffect.js
import React, { useEffect } from 'react';
import { Rect } from 'fabric';

const HighlightEffect = ({ canvasInstance, selectedBox, ocrData, ProviderConfigs }) => {
  useEffect(() => {
    if (!canvasInstance || !ocrData) return;

    // Lógica para limpiar recuadros anteriores
    canvasInstance.getObjects().forEach((obj) => {
      if (obj.isHighlighted) {
        canvasInstance.remove(obj);
      }
    });

    const drawHighlight = (box, color, isCurrentSelection = false) => {
      const canvasScaleX = canvasInstance.width / ocrData.width;
      const canvasScaleY = canvasInstance.height / ocrData.height;

      const highlightRect = new Rect({
        left: box.ulx * canvasScaleX,
        top: box.uly * canvasScaleY,
        width: (box.lrx - box.ulx) * canvasScaleX,
        height: (box.lry - box.uly) * canvasScaleY,
        fill: color,
        stroke: 'rgba(0,0,0,0)',
        strokeWidth: 2,
        selectable: false,
        evented: false,
        isHighlighted: true,
        isCurrentSelection: isCurrentSelection,
      });

      canvasInstance.add(highlightRect);
      //highlightRect.bringToFront();
    };
    console.log(ProviderConfigs)
    if (Array.isArray(ProviderConfigs)) {
      ProviderConfigs.forEach(config => {
        if (config.item && config.item.bounding_box) {
          drawHighlight(config.item.bounding_box, 'rgba(0,128,0,0.3)');
        }
      });
    }

    // Dibujar el recuadro de la selección actual
    if (selectedBox) {
      drawHighlight(selectedBox, 'rgba(255,255,0,0.3)', true);
    }

    canvasInstance.renderAll();
  }, [canvasInstance, selectedBox, ocrData, ProviderConfigs]);

  return null; // Este componente no renderiza nada visible
};

export default HighlightEffect;