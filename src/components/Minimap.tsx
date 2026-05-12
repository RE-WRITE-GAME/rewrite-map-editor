import React, { useRef, useEffect, useCallback, useState } from 'react';
import type { TiledMap } from '../types/tiled';

interface MinimapProps {
  map: TiledMap | null;
  tilesetImages: Map<string, HTMLImageElement>;
  cameraX: number;
  cameraY: number;
  zoom: number;
  canvasWidth: number;
  canvasHeight: number;
  onCameraChange: (x: number, y: number) => void;
}

export function Minimap({
  map,
  tilesetImages,
  cameraX,
  cameraY,
  zoom,
  canvasWidth,
  canvasHeight,
  onCameraChange,
}: MinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDraggingRef = useRef(false);
  const [isHovered, setIsHovered] = useState(false);

  const MINIMAP_WIDTH = 220;
  const MINIMAP_HEIGHT = 165;
  const PADDING = 4;

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !map) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Force pixel art mode
    ctx.imageSmoothingEnabled = false;

    const mapPixelWidth = map.width * map.tilewidth;
    const mapPixelHeight = map.height * map.tileheight;

    // Calculate scale to fit map in minimap
    const scaleX = (MINIMAP_WIDTH - PADDING * 2) / mapPixelWidth;
    const scaleY = (MINIMAP_HEIGHT - PADDING * 2) / mapPixelHeight;
    const scale = Math.min(scaleX, scaleY);

    const scaledMapWidth = mapPixelWidth * scale;
    const scaledMapHeight = mapPixelHeight * scale;

    // Center the minimap
    const offsetX = (MINIMAP_WIDTH - scaledMapWidth) / 2;
    const offsetY = (MINIMAP_HEIGHT - scaledMapHeight) / 2;

    // Clear canvas
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, MINIMAP_WIDTH, MINIMAP_HEIGHT);

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    // Render map (simplified - just show background and objects)
    ctx.fillStyle = '#16213e';
    ctx.fillRect(0, 0, mapPixelWidth, mapPixelHeight);

    // Render tile layers (low detail)
    for (const layer of map.layers) {
      if (!layer.visible) continue;
      
      if (layer.type === 'tilelayer') {
        const tileLayer = layer as any;
        // Just show tiles as colored pixels for performance
        ctx.fillStyle = 'rgba(233, 69, 96, 0.3)';
        for (let y = 0; y < tileLayer.height; y++) {
          for (let x = 0; x < tileLayer.width; x++) {
            const tileId = tileLayer.data[y * tileLayer.width + x];
            if (tileId !== 0) {
              ctx.fillRect(x * map.tilewidth, y * map.tileheight, map.tilewidth, map.tileheight);
            }
          }
        }
      } else if (layer.type === 'objectgroup') {
        const objLayer = layer as any;
        for (const obj of objLayer.objects) {
          if (!obj.visible) continue;
          ctx.fillStyle = obj.type === 'monster_spawner' ? 'rgba(255, 50, 50, 0.6)' : 'rgba(50, 50, 255, 0.6)';
          ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
        }
      }
    }

    ctx.restore();

    // Draw viewport rectangle
    const viewportWidth = canvasWidth / zoom;
    const viewportHeight = canvasHeight / zoom;
    const viewportX = -cameraX / zoom;
    const viewportY = -cameraY / zoom;

    ctx.strokeStyle = '#4ecca3';
    ctx.lineWidth = 2;
    ctx.fillStyle = 'rgba(78, 204, 163, 0.1)';
    
    const rectX = offsetX + viewportX * scale;
    const rectY = offsetY + viewportY * scale;
    const rectW = viewportWidth * scale;
    const rectH = viewportHeight * scale;

    ctx.fillRect(rectX, rectY, rectW, rectH);
    ctx.strokeRect(rectX, rectY, rectW, rectH);

    // Draw border
    ctx.strokeStyle = isHovered ? '#4ecca3' : '#0f3460';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, MINIMAP_WIDTH, MINIMAP_HEIGHT);

  }, [map, tilesetImages, cameraX, cameraY, zoom, canvasWidth, canvasHeight, isHovered]);

  useEffect(() => {
    const animFrame = requestAnimationFrame(function loop() {
      render();
      requestAnimationFrame(loop);
    });
    return () => cancelAnimationFrame(animFrame);
  }, [render]);

  const handleMouseEvent = useCallback(
    (e: React.MouseEvent) => {
      if (!map) return;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const mapPixelWidth = map.width * map.tilewidth;
      const mapPixelHeight = map.height * map.tileheight;

      const scaleX = (MINIMAP_WIDTH - PADDING * 2) / mapPixelWidth;
      const scaleY = (MINIMAP_HEIGHT - PADDING * 2) / mapPixelHeight;
      const scale = Math.min(scaleX, scaleY);

      const scaledMapWidth = mapPixelWidth * scale;
      const scaledMapHeight = mapPixelHeight * scale;
      const offsetX = (MINIMAP_WIDTH - scaledMapWidth) / 2;
      const offsetY = (MINIMAP_HEIGHT - scaledMapHeight) / 2;

      // Convert mouse position to map coordinates
      const mapX = ((mouseX - offsetX) / scale);
      const mapY = ((mouseY - offsetY) / scale);

      // Center camera on clicked position
      const viewportWidth = canvasWidth / zoom;
      const viewportHeight = canvasHeight / zoom;
      
      const newCameraX = -(mapX - viewportWidth / 2) * zoom;
      const newCameraY = -(mapY - viewportHeight / 2) * zoom;

      onCameraChange(newCameraX, newCameraY);
    },
    [map, zoom, canvasWidth, canvasHeight, onCameraChange]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 0) {
        isDraggingRef.current = true;
        handleMouseEvent(e);
      }
    },
    [handleMouseEvent]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDraggingRef.current) {
        handleMouseEvent(e);
      }
    },
    [handleMouseEvent]
  );

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  if (!map) return null;

  return (
    <div className="minimap-container">
      <div className="minimap-title">Minimap</div>
      <canvas
        ref={canvasRef}
        width={MINIMAP_WIDTH}
        height={MINIMAP_HEIGHT}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onMouseEnter={() => setIsHovered(true)}
        onMouseOut={() => setIsHovered(false)}
        style={{
          display: 'block',
          cursor: isDraggingRef.current ? 'grabbing' : 'pointer',
          borderRadius: '4px',
        }}
      />
      <div className="minimap-hint">Click to navigate</div>
    </div>
  );
}
