import React from 'react';
import { Tree } from 'react-arborist';
import './styles.css';

const FileExplorer = ({ data, onFileSelect }) => {
  const Node = ({ node, style, tree }) => (
    <div style={style} onClick={() => node.isLeaf ? onFileSelect(node) : tree.toggle(node.id)}>
      {node.isInternal && <span onClick={() => tree.toggle(node.id)}>{node.isOpen ? '▼' : '►'}</span>}
      {node.data.name}
    </div>
  );

  return (
    <div className="left-panel">
      <h3>Explorador de Archivos</h3>
      <div className="file-explorer-container">
        <Tree
          data={data}
          initialOpenState={true}
          rowHeight={25}
          indent={10}
          onSelect={(selectedNodes) => {
            if (selectedNodes.length > 0) onFileSelect(selectedNodes[0]);
          }}
          children={Node}
          disableDrag
          disableMultiSelect
        />
      </div>
    </div>
  );
};

export default FileExplorer;