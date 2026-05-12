import React, { useState } from 'react';
import type { TiledLayer } from '../types/tiled';
import { AddLayerDialog } from './AddLayerDialog';

interface LayerPanelProps {
  layers: TiledLayer[];
  selectedLayerId: number;
  onSelectLayer: (id: number) => void;
  onToggleVisibility: (id: number) => void;
  onAddLayer: (name: string, type?: 'tilelayer' | 'objectgroup') => void;
  onRemoveLayer: (id: number) => void;
}

export function LayerPanel({ layers, selectedLayerId, onSelectLayer, onToggleVisibility, onAddLayer, onRemoveLayer }: LayerPanelProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);

  return (
    <div className="panel">
      <div className="panel-title">Layers</div>
      {layers.map((layer) => (
        <div
          key={layer.id}
          className={`layer-item ${layer.id === selectedLayerId ? 'selected' : ''}`}
          onClick={() => onSelectLayer(layer.id)}
        >
          <button
            className={`vis-btn ${layer.visible ? 'visible' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleVisibility(layer.id);
            }}
          >
            {layer.visible ? '\u25C9' : '\u25CE'}
          </button>
          <span className="layer-name">{layer.name}</span>
          <span className="layer-type">{layer.type === 'tilelayer' ? 'tiles' : 'obj'}</span>
          {layers.length > 1 && (
            <button
              className="vis-btn"
              style={{ color: '#e94560', fontSize: 10 }}
              onClick={(e) => {
                e.stopPropagation();
                onRemoveLayer(layer.id);
              }}
            >
              \u2715
            </button>
          )}
        </div>
      ))}
      <button
        className="btn btn-primary"
        onClick={() => setShowAddDialog(true)}
        style={{ width: '100%', marginTop: 8 }}
      >
        + Add Layer
      </button>
      {showAddDialog && (
        <AddLayerDialog
          onAdd={(name, type) => {
            onAddLayer(name, type);
            setShowAddDialog(false);
          }}
          onClose={() => setShowAddDialog(false)}
        />
      )}
    </div>
  );
}
