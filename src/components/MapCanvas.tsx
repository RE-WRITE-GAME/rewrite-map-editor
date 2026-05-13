import React, { useRef, useEffect, useCallback, useState } from 'react';
import type { TiledMap, TiledLayer, TiledTileLayer, TiledObjectLayer, TiledObject } from '../types/tiled';
import { findLayerById, getTilesetTileCoords } from '../utils/tiled';

interface MapCanvasProps {
  editor: {
    state: {
      map: TiledMap | null;
      selectedLayerId: number;
      selectedTileId: number;
      selectedTool: string;
      selectedObjectType: string;
      cameraX: number;
      cameraY: number;
      zoom: number;
      showGrid: boolean;
    };
    tilesetImages: Map<string, HTMLImageElement>;
    paintTile: (x: number, y: number) => void;
    eraseTile: (x: number, y: number) => void;
    fillTiles: (x: number, y: number) => void;
    placeObject: (x: number, y: number) => void;
    deleteObject: (objectId: number) => void;
    setCamera: (x: number, y: number, z: number) => void;
  };
  onCanvasResize?: (size: { width: number; height: number }) => void;
}

export function MapCanvas({ editor, onCanvasResize }: MapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isPanningRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const isDrawingRef = useRef(false);
  const [hoveredTile, setHoveredTile] = useState<{ x: number; y: number } | null>(null);
  const [selectedObjectId, setSelectedObjectId] = useState<number | null>(null);
  const [statusInfo, setStatusInfo] = useState({ x: 0, y: 0, tileId: 0 });
  const animFrameRef = useRef(0);
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  const { map, selectedLayerId, selectedTool, zoom, showGrid, cameraX, cameraY } = editor.state;

  const screenToTile = useCallback(
    (sx: number, sy: number): { tx: number; ty: number } => {
      const canvas = canvasRef.current;
      if (!canvas || !map) return { tx: 0, ty: 0 };
      const rect = canvas.getBoundingClientRect();
      const x = (sx - rect.left - cameraX) / zoom;
      const y = (sy - rect.top - cameraY) / zoom;
      return {
        tx: Math.floor(x / map.tilewidth),
        ty: Math.floor(y / map.tileheight),
      };
    },
    [map, zoom, cameraX, cameraY]
  );

  const screenToWorld = useCallback(
    (sx: number, sy: number): { wx: number; wy: number } => {
      const canvas = canvasRef.current;
      if (!canvas) return { wx: 0, wy: 0 };
      const rect = canvas.getBoundingClientRect();
      return {
        wx: (sx - rect.left - cameraX) / zoom,
        wy: (sy - rect.top - cameraY) / zoom,
      };
    },
    [zoom, cameraX, cameraY]
  );

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !map) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Force 32-bit pixel art mode (no smoothing/antialiasing)
    ctx.imageSmoothingEnabled = false;

    const tw = map.tilewidth;
    const th = map.tileheight;
    const mw = map.width * tw;
    const mh = map.height * th;

    canvas.width = canvas.clientWidth * window.devicePixelRatio;
    canvas.height = canvas.clientHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    ctx.save();
    ctx.translate(cameraX, cameraY);
    ctx.scale(zoom, zoom);

    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, mw, mh);

    for (const layer of map.layers) {
      if (!layer.visible) continue;

      if (layer.type === 'tilelayer') {
        const tileLayer = layer as TiledTileLayer;
        const startX = Math.max(0, Math.floor(-cameraX / zoom / tw));
        const startY = Math.max(0, Math.floor(-cameraY / zoom / th));
        const endX = Math.min(tileLayer.width, Math.ceil((-cameraX / zoom + canvas.clientWidth) / tw) + 1);
        const endY = Math.min(tileLayer.height, Math.ceil((-cameraY / zoom + canvas.clientHeight) / th) + 1);

        for (let y = startY; y < endY; y++) {
          for (let x = startX; x < endX; x++) {
            const tileId = tileLayer.data[y * tileLayer.width + x];
            if (tileId === 0) continue;

            for (const tileset of map.tilesets) {
              if (tileId >= tileset.firstgid && tileId < tileset.firstgid + tileset.tilecount) {
                const img = editor.tilesetImages.get(tileset.name);
                if (!img) break;
                const coords = getTilesetTileCoords(tileset, tileId);
                if (!coords) break;
                ctx.drawImage(
                  img,
                  coords.x,
                  coords.y,
                  tw,
                  th,
                  x * tw,
                  y * th,
                  tw,
                  th
                );
                break;
              }
            }
          }
        }
      } else if (layer.type === 'objectgroup') {
        const objLayer = layer as TiledObjectLayer;
        for (const obj of objLayer.objects) {
          if (!obj.visible) continue;

          const isSelected = obj.id === selectedObjectId;

          if (obj.type === 'ramp') {
            // Render ramp as a filled triangle
            const dir = (obj.properties?.find((p) => p.name === 'direction')?.value as string) ?? 'up-right';
            ctx.fillStyle = isSelected ? 'rgba(255, 180, 0, 0.5)' : 'rgba(255, 140, 0, 0.3)';
            ctx.strokeStyle = isSelected ? '#ffcc00' : '#ff9900';
            ctx.lineWidth = 1 / zoom;
            ctx.beginPath();
            if (dir === 'up-right') {
              ctx.moveTo(obj.x, obj.y + obj.height);
              ctx.lineTo(obj.x + obj.width, obj.y + obj.height);
              ctx.lineTo(obj.x + obj.width, obj.y);
            } else {
              ctx.moveTo(obj.x, obj.y + obj.height);
              ctx.lineTo(obj.x + obj.width, obj.y + obj.height);
              ctx.lineTo(obj.x, obj.y);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#fff';
            ctx.font = `${10 / zoom}px monospace`;
            ctx.fillText(`ramp (${dir})`, obj.x, obj.y - 2 / zoom);
          } else {
            if (obj.type === 'monster_spawner') {
              ctx.fillStyle = isSelected ? 'rgba(255, 100, 100, 0.4)' : 'rgba(255, 50, 50, 0.25)';
              ctx.strokeStyle = isSelected ? '#ff6464' : '#ff3232';
            } else if (obj.name.includes('portal')) {
              ctx.fillStyle = isSelected ? 'rgba(100, 100, 255, 0.4)' : 'rgba(50, 50, 255, 0.25)';
              ctx.strokeStyle = isSelected ? '#6464ff' : '#3232ff';
            } else {
              ctx.fillStyle = isSelected ? 'rgba(100, 255, 100, 0.4)' : 'rgba(50, 255, 50, 0.25)';
              ctx.strokeStyle = isSelected ? '#64ff64' : '#32ff32';
            }

            ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
            ctx.lineWidth = 1 / zoom;
            ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);

            ctx.fillStyle = '#fff';
            ctx.font = `${10 / zoom}px monospace`;
            ctx.fillText(obj.name, obj.x, obj.y - 2 / zoom);
          }
        }
      }
    }

    if (showGrid && zoom >= 0.5) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 0.5 / zoom;
      const gridStartX = Math.max(0, Math.floor(-cameraX / zoom / tw));
      const gridStartY = Math.max(0, Math.floor(-cameraY / zoom / th));
      const gridEndX = Math.min(map.width, Math.ceil((-cameraX / zoom + canvas.clientWidth) / tw) + 1);
      const gridEndY = Math.min(map.height, Math.ceil((-cameraY / zoom + canvas.clientHeight) / th) + 1);

      for (let x = gridStartX; x <= gridEndX; x++) {
        ctx.beginPath();
        ctx.moveTo(x * tw, gridStartY * th);
        ctx.lineTo(x * tw, gridEndY * th);
        ctx.stroke();
      }
      for (let y = gridStartY; y <= gridEndY; y++) {
        ctx.beginPath();
        ctx.moveTo(gridStartX * tw, y * th);
        ctx.lineTo(gridEndX * tw, y * th);
        ctx.stroke();
      }
    }

    ctx.strokeStyle = '#e94560';
    ctx.lineWidth = 2 / zoom;
    ctx.strokeRect(0, 0, mw, mh);

    if (hoveredTile && selectedTool !== 'object' && selectedTool !== 'select') {
      const { x: hx, y: hy } = hoveredTile;
      if (hx >= 0 && hx < map.width && hy >= 0 && hy < map.height) {
        ctx.fillStyle = 'rgba(233, 69, 96, 0.3)';
        ctx.fillRect(hx * tw, hy * th, tw, th);
        ctx.strokeStyle = '#e94560';
        ctx.lineWidth = 1 / zoom;
        ctx.strokeRect(hx * tw, hy * th, tw, th);
      }
    }

    ctx.restore();
  }, [map, selectedLayerId, zoom, showGrid, cameraX, cameraY, hoveredTile, selectedObjectId, editor.tilesetImages]);

  useEffect(() => {
    const loop = () => {
      render();
      animFrameRef.current = requestAnimationFrame(loop);
    };
    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [render]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(() => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.style.width = container.clientWidth + 'px';
        canvas.style.height = container.clientHeight + 'px';
        
        // Report canvas size to parent
        if (onCanvasResize) {
          onCanvasResize({
            width: container.clientWidth,
            height: container.clientHeight,
          });
        }
      }
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, [onCanvasResize]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Middle mouse button, Alt+LeftClick, or Spacebar+LeftClick to pan
      if (e.button === 1 || (e.button === 0 && e.altKey) || (e.button === 0 && isSpacePressed)) {
        isPanningRef.current = true;
        lastMouseRef.current = { x: e.clientX, y: e.clientY };
        e.preventDefault();
        return;
      }

      if (e.button === 0 && map) {
        isDrawingRef.current = true;
        const { tx, ty } = screenToTile(e.clientX, e.clientY);
        const layer = findLayerById(map, selectedLayerId);

        if (layer?.type === 'objectgroup') {
          if (selectedTool === 'object') {
            const { wx, wy } = screenToWorld(e.clientX, e.clientY);
            editor.placeObject(wx, wy);
          } else if (selectedTool === 'select') {
            const { wx, wy } = screenToWorld(e.clientX, e.clientY);
            const objLayer = layer as TiledObjectLayer;
            let found: TiledObject | null = null;
            for (const obj of objLayer.objects) {
              if (wx >= obj.x && wx <= obj.x + obj.width && wy >= obj.y && wy <= obj.y + obj.height) {
                found = obj;
              }
            }
            setSelectedObjectId(found?.id ?? null);
          }
        } else if (layer?.type === 'tilelayer') {
          if (selectedTool === 'brush') {
            editor.paintTile(tx, ty);
          } else if (selectedTool === 'eraser') {
            editor.eraseTile(tx, ty);
          } else if (selectedTool === 'fill') {
            editor.fillTiles(tx, ty);
          }
        }
      }

      if (e.button === 2 && map) {
        const { tx, ty } = screenToTile(e.clientX, e.clientY);
        const layer = findLayerById(map, selectedLayerId);
        if (layer?.type === 'objectgroup') {
          const { wx, wy } = screenToWorld(e.clientX, e.clientY);
          const objLayer = layer as TiledObjectLayer;
          for (const obj of objLayer.objects) {
            if (wx >= obj.x && wx <= obj.x + obj.width && wy >= obj.y && wy <= obj.y + obj.height) {
              editor.deleteObject(obj.id);
              break;
            }
          }
        } else if (layer?.type === 'tilelayer') {
          editor.eraseTile(tx, ty);
        }
      }
    },
    [map, selectedLayerId, selectedTool, screenToTile, screenToWorld, editor]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanningRef.current) {
        const dx = e.clientX - lastMouseRef.current.x;
        const dy = e.clientY - lastMouseRef.current.y;
        lastMouseRef.current = { x: e.clientX, y: e.clientY };
        editor.setCamera(cameraX + dx, cameraY + dy, zoom);
        return;
      }

      if (map) {
        const { tx, ty } = screenToTile(e.clientX, e.clientY);
        setHoveredTile({ x: tx, y: ty });

        if (tx >= 0 && tx < map.width && ty >= 0 && ty < map.height) {
          const layer = findLayerById(map, selectedLayerId);
          let tileId = 0;
          if (layer?.type === 'tilelayer') {
            tileId = (layer as TiledTileLayer).data[ty * map.width + tx];
          }
          setStatusInfo({ x: tx, y: ty, tileId });
        }

        if (isDrawingRef.current) {
          const drawLayer = findLayerById(map, selectedLayerId);
          if (drawLayer?.type === 'tilelayer') {
            if (selectedTool === 'brush') {
              editor.paintTile(tx, ty);
            } else if (selectedTool === 'eraser') {
              editor.eraseTile(tx, ty);
            }
          }
        }
      }
    },
    [map, selectedLayerId, selectedTool, zoom, cameraX, cameraY, screenToTile, editor, isSpacePressed]
  );

  const handleMouseUp = useCallback(() => {
    isPanningRef.current = false;
    isDrawingRef.current = false;
  }, []);

  // Use native wheel event listener to avoid passive event listener warning
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.min(5, Math.max(0.1, zoom * delta));

      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      const newCamX = mx - (mx - cameraX) * (newZoom / zoom);
      const newCamY = my - (my - cameraY) * (newZoom / zoom);

      editor.setCamera(newCamX, newCamY, newZoom);
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [zoom, cameraX, cameraY, editor]);

  // Keyboard event handlers for spacebar panning
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isSpacePressed) {
        e.preventDefault();
        setIsSpacePressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsSpacePressed(false);
        isPanningRef.current = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isSpacePressed]);

  const getCursor = () => {
    if (isPanningRef.current) return 'grabbing';
    if (isSpacePressed) return 'grab';
    if (selectedTool === 'select') return 'default';
    return 'crosshair';
  };

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onContextMenu={(e) => e.preventDefault()}
        style={{ display: 'block', cursor: getCursor() }}
      />
      <div className="status-bar">
        <div>Tile: <span>({statusInfo.x}, {statusInfo.y})</span></div>
        <div>ID: <span>{statusInfo.tileId}</span></div>
        <div>Zoom: <span>{Math.round(zoom * 100)}%</span></div>
        {map && (
          <div>Map: <span>{map.width}x{map.height} ({map.tilewidth}x{map.tileheight})</span></div>
        )}
        <div style={{ marginLeft: 'auto', fontSize: '11px', opacity: 0.6 }}>
          Pan: <span>Space+Drag | Middle-Mouse | Alt+Drag</span>
        </div>
      </div>
    </div>
  );
}
