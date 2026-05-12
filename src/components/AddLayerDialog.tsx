import React, { useState } from 'react';

interface LayerPreset {
  name: string;
  description: string;
  type: 'tilelayer' | 'objectgroup';
  category: 'gameplay' | 'visual';
}

const LAYER_PRESETS: LayerPreset[] = [
  {
    name: 'Ground',
    description: 'Main ground/floor tiles for player to walk on',
    type: 'tilelayer',
    category: 'gameplay',
  },
  {
    name: 'Platforms',
    description: 'Floating platforms and elevated surfaces',
    type: 'tilelayer',
    category: 'gameplay',
  },
  {
    name: 'Walls',
    description: 'Vertical barriers and collision walls',
    type: 'tilelayer',
    category: 'gameplay',
  },
  {
    name: 'Background',
    description: 'Decorative background tiles (non-collision)',
    type: 'tilelayer',
    category: 'visual',
  },
  {
    name: 'Foreground',
    description: 'Decorative foreground tiles (above player)',
    type: 'tilelayer',
    category: 'visual',
  },
  {
    name: 'Decoration',
    description: 'Props, plants, and decorative elements',
    type: 'tilelayer',
    category: 'visual',
  },
  {
    name: 'Objects',
    description: 'Interactive objects, spawners, and portals',
    type: 'objectgroup',
    category: 'gameplay',
  },
  {
    name: 'Collision',
    description: 'Invisible collision boundaries and zones',
    type: 'objectgroup',
    category: 'gameplay',
  },
];

interface AddLayerDialogProps {
  onAdd: (name: string, type: 'tilelayer' | 'objectgroup') => void;
  onClose: () => void;
}

export function AddLayerDialog({ onAdd, onClose }: AddLayerDialogProps) {
  const [selectedPreset, setSelectedPreset] = useState<LayerPreset | null>(null);
  const [customName, setCustomName] = useState('');
  const [mode, setMode] = useState<'preset' | 'custom'>('preset');

  const handleAdd = () => {
    if (mode === 'preset' && selectedPreset) {
      onAdd(selectedPreset.name, selectedPreset.type);
      onClose();
    } else if (mode === 'custom' && customName.trim()) {
      onAdd(customName.trim(), 'tilelayer');
      onClose();
    }
  };

  return (
    <div className="dialog-overlay">
      <div className="dialog" style={{ maxWidth: 500 }}>
        <h2 className="dialog-title">Add New Layer</h2>
        
        <div className="dialog-content">
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button
              className={`btn ${mode === 'preset' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setMode('preset')}
              style={{ flex: 1 }}
            >
              Preset
            </button>
            <button
              className={`btn ${mode === 'custom' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setMode('custom')}
              style={{ flex: 1 }}
            >
              Custom
            </button>
          </div>

          {mode === 'preset' ? (
            <div>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 8 }}>
                Choose a layer preset:
              </div>
              
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, color: '#e94560', marginBottom: 4, fontWeight: 700 }}>GAMEPLAY LAYERS</div>
                {LAYER_PRESETS.filter(p => p.category === 'gameplay').map(preset => (
                  <div
                    key={preset.name}
                    className={`layer-preset-item ${selectedPreset?.name === preset.name ? 'selected' : ''}`}
                    onClick={() => setSelectedPreset(preset)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 700, fontSize: 12 }}>{preset.name}</span>
                      <span className="layer-type">{preset.type === 'tilelayer' ? 'tiles' : 'obj'}</span>
                    </div>
                    <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>
                      {preset.description}
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <div style={{ fontSize: 10, color: '#4ecca3', marginBottom: 4, fontWeight: 700 }}>VISUAL LAYERS</div>
                {LAYER_PRESETS.filter(p => p.category === 'visual').map(preset => (
                  <div
                    key={preset.name}
                    className={`layer-preset-item ${selectedPreset?.name === preset.name ? 'selected' : ''}`}
                    onClick={() => setSelectedPreset(preset)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 700, fontSize: 12 }}>{preset.name}</span>
                      <span className="layer-type">{preset.type === 'tilelayer' ? 'tiles' : 'obj'}</span>
                    </div>
                    <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>
                      {preset.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 8 }}>
                Enter custom layer name:
              </div>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="e.g., MyLayer"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && customName.trim()) {
                    handleAdd();
                  }
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: '#1a1a2e',
                  border: '1px solid #0f3460',
                  borderRadius: 4,
                  color: '#e0e0e0',
                  fontSize: 12,
                }}
              />
            </div>
          )}
        </div>

        <div className="dialog-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleAdd}
            disabled={
              (mode === 'preset' && !selectedPreset) ||
              (mode === 'custom' && !customName.trim())
            }
          >
            Add Layer
          </button>
        </div>
      </div>
    </div>
  );
}
