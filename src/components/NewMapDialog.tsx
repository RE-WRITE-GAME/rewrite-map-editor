import React, { useState } from 'react';

interface NewMapDialogProps {
  onCreate: (width: number, height: number, name: string) => void;
  onClose: () => void;
}

export function NewMapDialog({ onCreate, onClose }: NewMapDialogProps) {
  const [width, setWidth] = useState(80);
  const [height, setHeight] = useState(23);
  const [name, setName] = useState('');

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <h3>New Map</h3>
        <div className="dialog-row">
          <label>Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. my-new-map"
            autoFocus
          />
        </div>
        <div className="dialog-row">
          <label>Width (tiles)</label>
          <input
            type="number"
            value={width}
            onChange={(e) => setWidth(parseInt(e.target.value) || 1)}
            min={1}
            max={500}
          />
        </div>
        <div className="dialog-row">
          <label>Height (tiles)</label>
          <input
            type="number"
            value={height}
            onChange={(e) => setHeight(parseInt(e.target.value) || 1)}
            min={1}
            max={500}
          />
        </div>
        <div className="dialog-actions">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onCreate(width, height, name)}>Create</button>
        </div>
      </div>
    </div>
  );
}
