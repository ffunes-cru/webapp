import React, { useRef, useEffect } from 'react';
//import { StaticCanvas, Rect, Image } from 'fabric';
import './styles.css';

const ImageViewer = ({ ocrData, imageUrl, selectedBox, setSelectedBox, setSelectedText, setSelectedItem }) => {
  
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
        {imageUrl && (
          <div className="image-container">
            <img src={imageUrl} alt="Invoice" className="invoice-image" onClick={handleImageClick} />
            {selectedBox && <div className="highlight-box" style={getHighlightStyle()} />}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageViewer;