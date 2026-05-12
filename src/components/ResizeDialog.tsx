import React, { useState } from 'react';

interface ResizeDialogProps {
  currentWidth: number;
  currentHeight: number;
  onResize: (width: number, height: number) => void;
  onClose: () => void;
}

export function ResizeDialog({ currentWidth, currentHeight, onResize, onClose }: ResizeDialogProps) {
  const [width, setWidth] = useState(currentWidth);
  const [height, setHeight] = useState(currentHeight);

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <h3>Resize Map</h3>
        <div className="dialog-row">
          <label>Current: {currentWidth} x {currentHeight}</label>
        </div>
        <div className="dialog-row">
          <label>New Width (tiles)</label>
          <input
            type="number"
            value={width}
            onChange={(e) => setWidth(parseInt(e.target.value) || 1)}
            min={1}
            max={500}
          />
        </div>
        <div className="dialog-row">
          <label>New Height (tiles)</label>
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
          <button className="btn btn-primary" onClick={() => { onResize(width, height); onClose(); }}>Resize</button>
        </div>
      </div>
    </div>
  );
}
