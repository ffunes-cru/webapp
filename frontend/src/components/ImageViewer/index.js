import React, { useRef, useEffect, useState } from 'react';
import { Canvas, FabricImage, Rect } from 'fabric'
import './styles.css';

const ImageViewer = ({ ocrData, imageUrl, selectedBox, setSelectedBox, setSelectedText, setSelectedItem }) => {
  const canvasRef = useRef(null);
  const [canvas, setCanvas] = useState(null);
  const imageElement = document.createElement("img");
  imageElement.src = imageUrl;

  useEffect(() => {
    if (canvasRef.current) {
      const initCanvas = new Canvas(canvasRef.current, {
        width: ocrData?.width || 0,
        height: ocrData?.height || 0,
      });
      console.log(ocrData?.width)
      console.log(ocrData?.height)
      initCanvas.renderAll();

      setCanvas(initCanvas);

      return () => {
        initCanvas.dispose();
      }
    }
  }, [ocrData])

  //imageElement.crossOrigin = "anonymous";


  imageElement.onload = () => {

      const imageWidth = imageElement.naturalWidth;
      const imageHeight = imageElement.naturalHeight;

      imageElement.width = imageWidth;
      imageElement.height = imageHeight;

      // Get canvas dimensions
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;

      const scale = Math.min(
          canvasWidth / imageWidth,
          canvasHeight / imageHeight
      );

      canvas.renderAll();

      const fabricImg = new FabricImage(imageElement, {
          left: 0,
          top: 0,
          scaleX: scale,
          scaleY: scale,
          opacity: 0.5,
          selectable: false,
          evented: false,
          hasControls: false,
          hoverCursor: "default",
      });

      canvas.add(fabricImg);
      canvas.renderAll();
  };

  const addRectangle = () => {
    if (canvas) {
      const rect = new Rect({
        top: 100,
        left: 50,
        width: 100,
        height: 60,
        fill: "#D68611",
        opacity: 0.8,
      })

      canvas.add(rect);
    }
  }

  addRectangle();

  const handleImageClick = (e) => {
    if (!ocrData) return;

    const { clientX, clientY } = e;
    const rect = e.target.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const renderedWidth = e.target.offsetWidth;
    const renderedHeight = e.target.offsetHeight;
    const scaleX = ocrData.width / renderedWidth;
    const scaleY = ocrData.height / renderedHeight;
    const clickX = x * scaleX;
    const clickY = y * scaleY;
    let foundBox = null;
    let foundItem = null;
    let foundText = '';
    for (const item of ocrData.layout_data) {
      const bbox = item.bounding_box;
      if (
        clickX >= bbox.ulx &&
        clickX <= bbox.lrx &&
        clickY >= bbox.uly &&
        clickY <= bbox.lry
      ) {
        foundBox = { ...bbox, parentWidth: renderedWidth, parentHeight: renderedHeight };
        foundText = item.text;
        foundText = item.text;
        foundItem = item;
        break;
      }
    }
    setSelectedBox(foundBox);
    setSelectedText(foundText);
    setSelectedItem(foundItem);
  };

  const getHighlightStyle = () => {
    if (!selectedBox) return {};
    const scaleX = selectedBox.parentWidth / ocrData.width;
    const scaleY = selectedBox.parentHeight / ocrData.height;
    return {
      left: selectedBox.ulx * scaleX,
      top: selectedBox.uly * scaleY,
      width: (selectedBox.lrx - selectedBox.ulx) * scaleX,
      height: (selectedBox.lry - selectedBox.uly) * scaleY,
    };
  };

  return (
    <div className="main-content">
      <h1>Invoice Automation Tool</h1>
      <div className="invoice-viewer">
      <canvas id="canvas" ref={canvasRef}/>
      </div>
    </div>
  );
};

export default ImageViewer;