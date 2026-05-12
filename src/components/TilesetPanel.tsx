import React, { useRef, useEffect, useCallback } from 'react';
import type { TiledMap, TiledTileset } from '../types/tiled';

interface TilesetPanelProps {
  map: TiledMap | null;
  tilesetImages: Map<string, HTMLImageElement>;
  selectedTileId: number;
  onSelectTile: (id: number) => void;
}

export function TilesetPanel({ map, tilesetImages, selectedTileId, onSelectTile }: TilesetPanelProps) {
  const canvasRefs = useRef<Map<string, HTMLCanvasElement>>(new Map());
  const containerRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const renderTileset = useCallback(
    (tileset: TiledTileset, canvas: HTMLCanvasElement, container: HTMLDivElement | null) => {
      const img = tilesetImages.get(tileset.name);
      if (!img || !canvas) return;

      const tw = tileset.tilewidth;
      const th = tileset.tileheight;
      const cols = tileset.columns;
      const rows = Math.ceil(tileset.tilecount / cols);
      const scale = 2;

      canvas.width = cols * tw * scale;
      canvas.height = rows * th * scale;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= cols; x++) {
        ctx.beginPath();
        ctx.moveTo(x * tw * scale, 0);
        ctx.lineTo(x * tw * scale, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y <= rows; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * th * scale);
        ctx.lineTo(canvas.width, y * th * scale);
        ctx.stroke();
      }

      if (selectedTileId >= tileset.firstgid && selectedTileId < tileset.firstgid + tileset.tilecount) {
        const localId = selectedTileId - tileset.firstgid;
        const col = localId % cols;
        const row = Math.floor(localId / cols);
        ctx.strokeStyle = '#e94560';
        ctx.lineWidth = 2;
        ctx.strokeRect(col * tw * scale, row * th * scale, tw * scale, th * scale);
      }
    },
    [tilesetImages, selectedTileId]
  );

  useEffect(() => {
    if (!map) return;
    for (const tileset of map.tilesets) {
      const canvas = canvasRefs.current.get(tileset.name);
      const container = containerRefs.current.get(tileset.name);
      if (canvas) renderTileset(tileset, canvas, container ?? null);
    }
  }, [map, tilesetImages, selectedTileId, renderTileset]);

  if (!map || map.tilesets.length === 0) {
    return (
      <div className="panel">
        <div className="panel-title">Tileset</div>
        <p style={{ fontSize: 11, color: '#666' }}>No tilesets loaded. Use File &gt; Add Tileset to load an image.</p>
      </div>
    );
  }

  const handleClick = (tileset: TiledTileset, e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const scale = 2;
    
    // Convert from CSS display coordinates to canvas coordinates
    const mouseX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const mouseY = ((e.clientY - rect.top) / rect.height) * canvas.height;
    
    const col = Math.floor(mouseX / (tileset.tilewidth * scale));
    const row = Math.floor(mouseY / (tileset.tileheight * scale));
    const localId = row * tileset.columns + col;
    if (localId >= 0 && localId < tileset.tilecount) {
      onSelectTile(tileset.firstgid + localId);
    }
  };

  return (
    <div className="panel">
      <div className="panel-title">Tileset</div>
      <div className="tileset-canvas-container">
        {map.tilesets.map((tileset) => (
          <div key={tileset.name} style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 10, color: '#888', marginBottom: 4 }}>{tileset.name}</div>
            <div
              ref={(el) => {
                if (el) containerRefs.current.set(tileset.name, el);
              }}
            >
              <canvas
                ref={(el) => {
                  if (el) {
                    canvasRefs.current.set(tileset.name, el);
                    renderTileset(tileset, el, containerRefs.current.get(tileset.name) ?? null);
                  }
                }}
                onClick={(e) => handleClick(tileset, e)}
                style={{ cursor: 'pointer', width: '100%' }}
              />
            </div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 10, color: '#888', marginTop: 4 }}>
        Selected: {selectedTileId === 0 ? 'Eraser' : `Tile #${selectedTileId}`}
      </div>
    </div>
  );
}
