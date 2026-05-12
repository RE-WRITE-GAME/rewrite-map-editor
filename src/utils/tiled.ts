import type { TiledMap, TiledLayer, TiledTileLayer, TiledObjectLayer, TiledObject, TiledProperty } from '../types/tiled';

export function createEmptyMap(width: number, height: number, tileWidth: number = 32, tileHeight: number = 32): TiledMap {
  const groundLayer: TiledTileLayer = {
    data: new Array(width * height).fill(0),
    height,
    id: 1,
    name: 'Ground',
    opacity: 1,
    type: 'tilelayer',
    visible: true,
    width,
    x: 0,
    y: 0,
  };

  const platformsLayer: TiledTileLayer = {
    data: new Array(width * height).fill(0),
    height,
    id: 2,
    name: 'Platforms',
    opacity: 1,
    type: 'tilelayer',
    visible: true,
    width,
    x: 0,
    y: 0,
  };

  const spawnsLayer: TiledObjectLayer = {
    id: 3,
    name: 'Spawns',
    objects: [],
    opacity: 1,
    type: 'objectgroup',
    visible: true,
    x: 0,
    y: 0,
  };

  const portalsLayer: TiledObjectLayer = {
    id: 4,
    name: 'Portals',
    objects: [],
    opacity: 1,
    type: 'objectgroup',
    visible: true,
    x: 0,
    y: 0,
  };

  const spawnersLayer: TiledObjectLayer = {
    id: 5,
    name: 'Spawners',
    objects: [],
    opacity: 1,
    type: 'objectgroup',
    visible: true,
    x: 0,
    y: 0,
  };

  return {
    compressionlevel: -1,
    height,
    infinite: false,
    layers: [groundLayer, platformsLayer, spawnsLayer, portalsLayer, spawnersLayer],
    nextlayerid: 7,
    nextobjectid: 1,
    orientation: 'orthogonal',
    renderorder: 'right-down',
    tiledversion: '1.10.2',
    tileheight: tileHeight,
    tilesets: [],
    tilewidth: tileWidth,
    type: 'map',
    version: 1.10,
    width,
  };
}

export function loadTiledMap(json: string): TiledMap {
  const map = JSON.parse(json) as TiledMap;
  return map;
}

export function serializeTiledMap(map: TiledMap): string {
  return JSON.stringify(map, null, 2);
}

export function getTileLayerData(layer: TiledTileLayer, x: number, y: number): number {
  if (x < 0 || x >= layer.width || y < 0 || y >= layer.height) return 0;
  return layer.data[y * layer.width + x];
}

export function setTileLayerData(layer: TiledTileLayer, x: number, y: number, tileId: number): void {
  if (x < 0 || x >= layer.width || y < 0 || y >= layer.height) return;
  layer.data[y * layer.width + x] = tileId;
}

export function floodFill(layer: TiledTileLayer, startX: number, startY: number, newTileId: number): void {
  const targetTileId = getTileLayerData(layer, startX, startY);
  if (targetTileId === newTileId) return;

  const stack: [number, number][] = [[startX, startY]];
  const visited = new Set<string>();

  while (stack.length > 0) {
    const [x, y] = stack.pop()!;
    const key = `${x},${y}`;
    if (visited.has(key)) continue;
    if (x < 0 || x >= layer.width || y < 0 || y >= layer.height) continue;
    if (getTileLayerData(layer, x, y) !== targetTileId) continue;

    visited.add(key);
    setTileLayerData(layer, x, y, newTileId);

    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
}

export function findLayerById(map: TiledMap, id: number): TiledLayer | undefined {
  return map.layers.find(l => l.id === id);
}

export function findLayerByName(map: TiledMap, name: string): TiledLayer | undefined {
  return map.layers.find(l => l.name === name);
}

export function getTileLayers(map: TiledMap): TiledTileLayer[] {
  return map.layers.filter((l): l is TiledTileLayer => l.type === 'tilelayer');
}

export function getObjectLayers(map: TiledMap): TiledObjectLayer[] {
  return map.layers.filter((l): l is TiledObjectLayer => l.type === 'objectgroup');
}

export function addObjectToLayer(layer: TiledObjectLayer, obj: Omit<TiledObject, 'id'>): TiledObject {
  const newObj: TiledObject = { ...obj, id: generateObjectId() };
  layer.objects.push(newObj);
  return newObj;
}

export function removeObjectFromLayer(layer: TiledObjectLayer, objectId: number): void {
  layer.objects = layer.objects.filter(o => o.id !== objectId);
}

export function updateObjectInLayer(layer: TiledObjectLayer, objectId: number, updates: Partial<TiledObject>): void {
  const obj = layer.objects.find(o => o.id === objectId);
  if (obj) {
    Object.assign(obj, updates);
  }
}

export function generateLayerId(map: TiledMap): number {
  return Math.max(...map.layers.map(l => l.id)) + 1;
}

export function generateObjectId(): number {
  return Date.now() + Math.floor(Math.random() * 1000);
}

export function getTilesetTileCoords(tileset: { columns: number; tilewidth: number; tileheight: number; firstgid: number }, tileId: number): { x: number; y: number } | null {
  if (tileId === 0) return null;
  const localId = tileId - tileset.firstgid;
  const col = localId % tileset.columns;
  const row = Math.floor(localId / tileset.columns);
  return { x: col * tileset.tilewidth, y: row * tileset.tileheight };
}
