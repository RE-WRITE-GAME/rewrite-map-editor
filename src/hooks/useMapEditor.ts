import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { TiledMap, TiledLayer, TiledTileLayer, TiledObjectLayer, TiledObject, ToolType, ObjectType, ObjectPlacement } from '../types/tiled';
import {
  createEmptyMap,
  loadTiledMap,
  serializeTiledMap,
  setTileLayerData,
  getTileLayerData,
  floodFill,
  findLayerById,
  getTileLayers,
  getObjectLayers,
  addObjectToLayer,
  removeObjectFromLayer,
  updateObjectInLayer,
  generateLayerId,
} from '../utils/tiled';

interface EditorState {
  map: TiledMap | null;
  selectedLayerId: number;
  selectedTileId: number;
  selectedTool: ToolType;
  selectedObjectType: ObjectType;
  cameraX: number;
  cameraY: number;
  zoom: number;
  showGrid: boolean;
  isDirty: boolean;
  mapName: string;
}

interface HistoryEntry {
  map: TiledMap;
  timestamp: number;
}

const MAX_HISTORY = 50;

function deepCloneMap(map: TiledMap): TiledMap {
  return JSON.parse(JSON.stringify(map));
}

const OBJECT_TEMPLATES: Record<ObjectType, { name: string; width: number; height: number; properties: { name: string; type: string; value: string | number }[] }> = {
  spawn: { name: 'player_spawn', width: 32, height: 32, properties: [] },
  portal: {
    name: 'portal',
    width: 50,
    height: 80,
    properties: [{ name: 'targetMapId', type: 'string', value: '' }],
  },
  spawner: {
    name: 'monster',
    width: 32,
    height: 32,
    properties: [
      { name: 'maxCount', type: 'int', value: 2 },
      { name: 'respawnMin', type: 'int', value: 8000 },
      { name: 'respawnMax', type: 'int', value: 10000 },
    ],
  },
  ramp: {
    name: 'ramp',
    width: 128,
    height: 64,
    properties: [{ name: 'direction', type: 'string', value: 'up-right' }],
  },
};

export function useMapEditor() {
  const [state, setState] = useState<EditorState>({
    map: null,
    selectedLayerId: 1,
    selectedTileId: 0,
    selectedTool: 'brush',
    selectedObjectType: 'spawn',
    cameraX: 0,
    cameraY: 0,
    zoom: 1,
    showGrid: true,
    isDirty: false,
    mapName: '',
  });

  const tilesetImagesRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const [tilesetImagesReady, setTilesetImagesReady] = useState(false);
  
  // Undo/Redo history
  const historyRef = useRef<HistoryEntry[]>([]);
  const historyIndexRef = useRef(-1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const pushHistory = useCallback((map: TiledMap) => {
    // Remove any redo entries if we're not at the end
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    }
    
    // Add new history entry
    historyRef.current.push({
      map: deepCloneMap(map),
      timestamp: Date.now(),
    });
    
    // Limit history size
    if (historyRef.current.length > MAX_HISTORY) {
      historyRef.current.shift();
    } else {
      historyIndexRef.current++;
    }
    
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(false);
  }, []);
  
  const resolveTilesetImagePath = (imagePath: string): string => {
    if (imagePath.startsWith('http') || imagePath.startsWith('/') || imagePath.startsWith('blob:')) return imagePath;
    if (imagePath.startsWith('../')) {
      return '/assets/' + imagePath.replace('../', '');
    }
    if (imagePath.startsWith('./')) {
      return '/assets/' + imagePath.replace('./', '');
    }
    return '/assets/' + imagePath;
  };

  const loadTilesetImages = useCallback(async (map: TiledMap) => {
    const images = new Map<string, HTMLImageElement>();
    const promises = map.tilesets.map(
      (ts) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            images.set(ts.name, img);
            resolve();
          };
          img.onerror = () => {
            console.warn(`Failed to load tileset image: ${ts.image} -> ${resolveTilesetImagePath(ts.image)}`);
            resolve();
          };
          img.src = resolveTilesetImagePath(ts.image);
        })
    );
    await Promise.all(promises);
    tilesetImagesRef.current = images;
    setTilesetImagesReady(true);
  }, []);

  const newMap = useCallback((width: number, height: number, name: string) => {
    const map = createEmptyMap(width, height);
    setState(s => ({
      ...s,
      map,
      mapName: name,
      selectedLayerId: 1,
      isDirty: false,
    }));
    
    // Reset history
    historyRef.current = [{ map: deepCloneMap(map), timestamp: Date.now() }];
    historyIndexRef.current = 0;
    setCanUndo(false);
    setCanRedo(false);
    
    return map;
  }, []);

  const loadMapFromFile = useCallback(async (content: string, fileName: string) => {
    try {
      const map = loadTiledMap(content);
      setState(s => ({
        ...s,
        map,
        mapName: fileName.replace('.json', ''),
        selectedLayerId: map.layers[0]?.id ?? 1,
        isDirty: false,
      }));
      await loadTilesetImages(map);
      
      // Reset history with loaded map
      historyRef.current = [{ map: deepCloneMap(map), timestamp: Date.now() }];
      historyIndexRef.current = 0;
      setCanUndo(false);
      setCanRedo(false);
      
      return true;
    } catch (e) {
      console.error('Failed to load map:', e);
      return false;
    }
  }, [loadTilesetImages]);

  const saveMap = useCallback((): string | null => {
    if (!state.map) return null;
    return serializeTiledMap(state.map);
  }, [state.map]);

  const setSelectedLayer = useCallback((id: number) => {
    setState(s => ({ ...s, selectedLayerId: id }));
  }, []);

  const setSelectedTile = useCallback((id: number) => {
    setState(s => ({ ...s, selectedTileId: id }));
  }, []);

  const setTool = useCallback((tool: ToolType) => {
    setState(s => ({ ...s, selectedTool: tool }));
  }, []);

  const setObjectType = useCallback((type: ObjectType) => {
    setState(s => ({ ...s, selectedObjectType: type }));
  }, []);

  const setCamera = useCallback((x: number, y: number, zoom: number) => {
    setState(s => ({ ...s, cameraX: x, cameraY: y, zoom }));
  }, []);

  const toggleGrid = useCallback(() => {
    setState(s => ({ ...s, showGrid: !s.showGrid }));
  }, []);

  const paintTile = useCallback((x: number, y: number) => {
    if (!state.map) return;
    const layer = findLayerById(state.map, state.selectedLayerId);
    if (!layer || layer.type !== 'tilelayer') return;
    
    // Only push to history if tile actually changed
    const currentTile = getTileLayerData(layer as TiledTileLayer, x, y);
    if (currentTile === state.selectedTileId) return;
    
    pushHistory(state.map);
    setTileLayerData(layer as TiledTileLayer, x, y, state.selectedTileId);
    setState(s => ({ ...s, isDirty: true }));
  }, [state.map, state.selectedLayerId, state.selectedTileId, pushHistory]);

  const eraseTile = useCallback((x: number, y: number) => {
    if (!state.map) return;
    const layer = findLayerById(state.map, state.selectedLayerId);
    if (!layer || layer.type !== 'tilelayer') return;
    
    // Only push to history if tile is not already empty
    const currentTile = getTileLayerData(layer as TiledTileLayer, x, y);
    if (currentTile === 0) return;
    
    pushHistory(state.map);
    setTileLayerData(layer as TiledTileLayer, x, y, 0);
    setState(s => ({ ...s, isDirty: true }));
  }, [state.map, state.selectedLayerId, pushHistory]);

  const fillTiles = useCallback((x: number, y: number) => {
    if (!state.map) return;
    const layer = findLayerById(state.map, state.selectedLayerId);
    if (!layer || layer.type !== 'tilelayer') return;
    
    pushHistory(state.map);
    floodFill(layer as TiledTileLayer, x, y, state.selectedTileId);
    setState(s => ({ ...s, isDirty: true }));
  }, [state.map, state.selectedLayerId, state.selectedTileId, pushHistory]);

  const placeObject = useCallback((x: number, y: number) => {
    if (!state.map) return;
    const layer = findLayerById(state.map, state.selectedLayerId);
    if (!layer || layer.type !== 'objectgroup') return;

    pushHistory(state.map);
    const template = OBJECT_TEMPLATES[state.selectedObjectType];
    const objTypeStr = state.selectedObjectType === 'spawner' ? 'monster_spawner'
      : state.selectedObjectType === 'ramp' ? 'ramp'
      : '';
    addObjectToLayer(layer as TiledObjectLayer, {
      name: template.name,
      type: objTypeStr,
      width: template.width,
      height: template.height,
      x,
      y,
      visible: true,
      properties: template.properties.map(p => ({ ...p })),
    });
    setState(s => ({ ...s, isDirty: true }));
  }, [state.map, state.selectedLayerId, state.selectedObjectType, pushHistory]);

  const deleteObject = useCallback((objectId: number) => {
    if (!state.map) return;
    const layer = findLayerById(state.map, state.selectedLayerId);
    if (!layer || layer.type !== 'objectgroup') return;
    
    pushHistory(state.map);
    removeObjectFromLayer(layer as TiledObjectLayer, objectId);
    setState(s => ({ ...s, isDirty: true }));
  }, [state.map, state.selectedLayerId, pushHistory]);

  const updateObject = useCallback((objectId: number, updates: Partial<TiledObject>) => {
    if (!state.map) return;
    
    pushHistory(state.map);
    for (const layer of state.map.layers) {
      if (layer.type === 'objectgroup') {
        updateObjectInLayer(layer as TiledObjectLayer, objectId, updates);
      }
    }
    setState(s => ({ ...s, isDirty: true }));
  }, [state.map, pushHistory]);

  const toggleLayerVisibility = useCallback((layerId: number) => {
    if (!state.map) return;
    const layer = findLayerById(state.map, layerId);
    if (layer) {
      pushHistory(state.map);
      layer.visible = !layer.visible;
      setState(s => ({ ...s, isDirty: true }));
    }
  }, [state.map, pushHistory]);

  const addTileLayer = useCallback((name: string, layerType: 'tilelayer' | 'objectgroup' = 'tilelayer') => {
    if (!state.map) return;
    
    pushHistory(state.map);
    const newId = generateLayerId(state.map);
    const h = state.map.height;
    const w = state.map.width;
    
    if (layerType === 'objectgroup') {
      const newLayer: TiledObjectLayer = {
        id: newId,
        name,
        objects: [],
        opacity: 1,
        type: 'objectgroup',
        visible: true,
        x: 0,
        y: 0,
      };
      state.map.layers.push(newLayer);
    } else {
      const newLayer: TiledTileLayer = {
        data: new Array(w * h).fill(0),
        height: h,
        id: newId,
        name,
        opacity: 1,
        type: 'tilelayer',
        visible: true,
        width: w,
        x: 0,
        y: 0,
      };
      state.map.layers.push(newLayer);
    }
    
    state.map.nextlayerid = newId + 1;
    setState(s => ({ ...s, isDirty: true }));
  }, [state.map, pushHistory]);

  const removeLayer = useCallback((layerId: number) => {
    if (!state.map) return;
    if (state.map.layers.length <= 1) return;
    
    pushHistory(state.map);
    state.map.layers = state.map.layers.filter(l => l.id !== layerId);
    setState(s => ({
      ...s,
      selectedLayerId: state.map!.layers[0]?.id ?? 1,
      isDirty: true,
    }));
  }, [state.map, pushHistory]);

  const resizeMap = useCallback((newWidth: number, newHeight: number) => {
    if (!state.map) return;
    const map = state.map;
    const oldW = map.width;
    const oldH = map.height;

    pushHistory(state.map);
    for (const layer of map.layers) {
      if (layer.type === 'tilelayer') {
        const oldData = layer.data;
        const newData = new Array(newWidth * newHeight).fill(0);
        for (let y = 0; y < Math.min(oldH, newHeight); y++) {
          for (let x = 0; x < Math.min(oldW, newWidth); x++) {
            newData[y * newWidth + x] = oldData[y * oldW + x];
          }
        }
        layer.data = newData;
        layer.width = newWidth;
        layer.height = newHeight;
      }
    }
    map.width = newWidth;
    map.height = newHeight;
    setState(s => ({ ...s, isDirty: true }));
  }, [state.map, pushHistory]);

  const getTileLayersList = useCallback(() => {
    if (!state.map) return [];
    return getTileLayers(state.map);
  }, [state.map]);

  const getObjectLayersList = useCallback(() => {
    if (!state.map) return [];
    return getObjectLayers(state.map);
  }, [state.map]);

  const getAllLayers = useCallback(() => {
    if (!state.map) return [];
    return state.map.layers;
  }, [state.map]);

  const getSelectedLayer = useCallback((): TiledLayer | undefined => {
    if (!state.map) return undefined;
    return findLayerById(state.map, state.selectedLayerId);
  }, [state.map, state.selectedLayerId]);

  const getObjectsOnSelectedLayer = useCallback((): TiledObject[] => {
    if (!state.map) return [];
    const layer = findLayerById(state.map, state.selectedLayerId);
    if (!layer || layer.type !== 'objectgroup') return [];
    return (layer as TiledObjectLayer).objects;
  }, [state.map, state.selectedLayerId]);
  
  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0 || historyRef.current.length === 0) return;
    
    historyIndexRef.current--;
    const entry = historyRef.current[historyIndexRef.current];
    const restoredMap = deepCloneMap(entry.map);
    
    setState(s => ({
      ...s,
      map: restoredMap,
      isDirty: true,
    }));
    
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(true);
  }, []);
  
  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    
    historyIndexRef.current++;
    const entry = historyRef.current[historyIndexRef.current];
    const restoredMap = deepCloneMap(entry.map);
    
    setState(s => ({
      ...s,
      map: restoredMap,
      isDirty: true,
    }));
    
    setCanUndo(true);
    setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
  }, []);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Z or Cmd+Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      // Ctrl+Shift+Z or Ctrl+Y or Cmd+Shift+Z for redo
      else if (
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') ||
        ((e.ctrlKey || e.metaKey) && e.key === 'y')
      ) {
        e.preventDefault();
        redo();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return {
    state,
    tilesetImages: tilesetImagesRef.current,
    tilesetImagesReady,
    newMap,
    loadMapFromFile,
    saveMap,
    setSelectedLayer,
    setSelectedTile,
    setTool,
    setObjectType,
    setCamera,
    toggleGrid,
    paintTile,
    eraseTile,
    fillTiles,
    placeObject,
    deleteObject,
    updateObject,
    toggleLayerVisibility,
    addTileLayer,
    removeLayer,
    resizeMap,
    getTileLayersList,
    getObjectLayersList,
    getAllLayers,
    getSelectedLayer,
    getObjectsOnSelectedLayer,
    loadTilesetImages,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}
