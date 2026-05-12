import React, { useState } from 'react';
import type { TiledObject, ObjectType, TiledProperty } from '../types/tiled';

interface ObjectPanelProps {
  objects: TiledObject[];
  isObjectLayer: boolean;
  objectType: ObjectType;
  onSelectObjectType: (type: ObjectType) => void;
  onDeleteObject: (id: number) => void;
  onUpdateObject: (id: number, updates: Partial<TiledObject>) => void;
}

export function ObjectPanel({ objects, isObjectLayer, objectType, onSelectObjectType, onDeleteObject, onUpdateObject }: ObjectPanelProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editProps, setEditProps] = useState<TiledProperty[]>([]);

  if (!isObjectLayer) return null;

  const startEdit = (obj: TiledObject) => {
    setEditingId(obj.id);
    setEditName(obj.name);
    setEditProps(obj.properties ? obj.properties.map(p => ({ ...p })) : []);
  };

  const saveEdit = () => {
    if (editingId === null) return;
    onUpdateObject(editingId, {
      name: editName,
      properties: editProps,
    });
    setEditingId(null);
  };

  const updateProp = (index: number, value: string | number | boolean) => {
    setEditProps(prev => prev.map((p, i) => i === index ? { ...p, value } : p));
  };

  const getObjectColor = (obj: TiledObject): string => {
    if (obj.type === 'monster_spawner') return '#ff3232';
    if (obj.name.includes('portal')) return '#3232ff';
    return '#32ff32';
  };

  return (
    <div className="panel">
      <div className="panel-title">Objects</div>

      <div className="object-type-grid">
        {(['spawn', 'portal', 'spawner'] as ObjectType[]).map((type) => (
          <button
            key={type}
            className={`tool-btn ${objectType === type ? 'active' : ''}`}
            onClick={() => onSelectObjectType(type)}
            style={{ fontSize: 10 }}
          >
            {type}
          </button>
        ))}
      </div>

      {objects.length === 0 ? (
        <p style={{ fontSize: 11, color: '#666' }}>
          No objects. Select Place tool and click on canvas.
        </p>
      ) : (
        objects.map((obj) => (
          <div key={obj.id}>
            <div className="object-item">
              <div
                className="obj-icon"
                style={{ background: getObjectColor(obj), color: '#fff' }}
              >
                {obj.type === 'monster_spawner' ? 'M' : obj.name.includes('portal') ? 'P' : 'S'}
              </div>
              <span className="obj-name" onClick={() => startEdit(obj)} style={{ cursor: 'pointer' }}>
                {obj.name}
              </span>
              <span style={{ fontSize: 9, color: '#555' }}>
                ({Math.round(obj.x)},{Math.round(obj.y)})
              </span>
              <button className="obj-del" onClick={() => onDeleteObject(obj.id)} title="Delete">
                x
              </button>
            </div>
            {editingId === obj.id && (
              <div className="object-props">
                <div className="prop-row">
                  <label>Name</label>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); }}
                  />
                </div>
                <div className="prop-row">
                  <label>X</label>
                  <input
                    type="number"
                    value={obj.x}
                    onChange={(e) => onUpdateObject(obj.id, { x: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="prop-row">
                  <label>Y</label>
                  <input
                    type="number"
                    value={obj.y}
                    onChange={(e) => onUpdateObject(obj.id, { y: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="prop-row">
                  <label>Width</label>
                  <input
                    type="number"
                    value={obj.width}
                    onChange={(e) => onUpdateObject(obj.id, { width: parseFloat(e.target.value) || 32 })}
                  />
                </div>
                <div className="prop-row">
                  <label>Height</label>
                  <input
                    type="number"
                    value={obj.height}
                    onChange={(e) => onUpdateObject(obj.id, { height: parseFloat(e.target.value) || 32 })}
                  />
                </div>
                {editProps.map((prop, i) => (
                  <div className="prop-row" key={prop.name}>
                    <label>{prop.name}</label>
                    <input
                      value={String(prop.value)}
                      onChange={(e) => {
                        const v = prop.type === 'int' ? parseInt(e.target.value) || 0 : e.target.value;
                        updateProp(i, v);
                      }}
                      onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); }}
                    />
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                  <button className="btn btn-small btn-primary" onClick={saveEdit}>OK</button>
                  <button className="btn btn-small btn-secondary" onClick={() => setEditingId(null)}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
