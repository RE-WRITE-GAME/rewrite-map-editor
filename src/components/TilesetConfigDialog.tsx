import React, { useState } from 'react';

interface TilesetConfigDialogProps {
  imageWidth: number;
  imageHeight: number;
  defaultTileWidth: number;
  defaultTileHeight: number;
  onConfirm: (config: {
    tileWidth: number;
    tileHeight: number;
    columns: number;
    rows: number;
  }) => void;
  onClose: () => void;
}

export function TilesetConfigDialog({
  imageWidth,
  imageHeight,
  defaultTileWidth,
  defaultTileHeight,
  onConfirm,
  onClose,
}: TilesetConfigDialogProps) {
  const [tileWidth, setTileWidth] = useState(defaultTileWidth);
  const [tileHeight, setTileHeight] = useState(defaultTileHeight);
  const [columns, setColumns] = useState(Math.floor(imageWidth / defaultTileWidth));
  const [rows, setRows] = useState(Math.floor(imageHeight / defaultTileHeight));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tileWidth > 0 && tileHeight > 0 && columns > 0 && rows > 0) {
      onConfirm({ tileWidth, tileHeight, columns, rows });
    }
  };

  // Auto-calculate columns/rows when tile dimensions change
  React.useEffect(() => {
    if (tileWidth > 0) {
      setColumns(Math.floor(imageWidth / tileWidth));
    }
  }, [tileWidth, imageWidth]);

  React.useEffect(() => {
    if (tileHeight > 0) {
      setRows(Math.floor(imageHeight / tileHeight));
    }
  }, [tileHeight, imageHeight]);

  return (
    <div className="dialog-overlay">
      <div className="dialog">
        <h2 className="dialog-title">Configure Tileset</h2>
        <form onSubmit={handleSubmit}>
          <div className="dialog-content">
            <div style={{ marginBottom: 12, fontSize: 11, color: '#888' }}>
              Image Size: {imageWidth}×{imageHeight} pixels
            </div>
            
            <div className="dialog-row">
              <label>Tile Width (px)</label>
              <input
                type="number"
                min="1"
                max={imageWidth}
                value={tileWidth}
                onChange={(e) => setTileWidth(parseInt(e.target.value) || 0)}
                autoFocus
              />
            </div>

            <div className="dialog-row">
              <label>Tile Height (px)</label>
              <input
                type="number"
                min="1"
                max={imageHeight}
                value={tileHeight}
                onChange={(e) => setTileHeight(parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="dialog-row">
              <label>Columns</label>
              <input
                type="number"
                min="1"
                max={Math.floor(imageWidth / (tileWidth || 1))}
                value={columns}
                onChange={(e) => setColumns(parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="dialog-row">
              <label>Rows</label>
              <input
                type="number"
                min="1"
                max={Math.floor(imageHeight / (tileHeight || 1))}
                value={rows}
                onChange={(e) => setRows(parseInt(e.target.value) || 0)}
              />
            </div>

            <div style={{ marginTop: 12, fontSize: 11, color: '#4ecca3' }}>
              Total Tiles: {columns * rows}
            </div>

            <div style={{ marginTop: 8, fontSize: 10, color: '#666', fontStyle: 'italic' }}>
              ✓ 32-bit pixel art mode enabled
            </div>
          </div>

          <div className="dialog-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={tileWidth <= 0 || tileHeight <= 0 || columns <= 0 || rows <= 0}
            >
              Add Tileset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
