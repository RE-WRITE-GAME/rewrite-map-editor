export interface TiledTileset {
  columns: number;
  firstgid: number;
  image: string;
  imageheight: number;
  imagewidth: number;
  margin: number;
  spacing: number;
  name: string;
  tilecount: number;
  tileheight: number;
  tilewidth: number;
}

export interface TiledTileLayer {
  data: number[];
  height: number;
  id: number;
  name: string;
  opacity: number;
  type: 'tilelayer';
  visible: boolean;
  width: number;
  x: number;
  y: number;
}

export interface TiledObject {
  height: number;
  id: number;
  name: string;
  type: string;
  visible: boolean;
  width: number;
  x: number;
  y: number;
  properties?: TiledProperty[];
}

export interface TiledProperty {
  name: string;
  type: string;
  value: string | number | boolean;
}

export interface TiledObjectLayer {
  id: number;
  name: string;
  objects: TiledObject[];
  opacity: number;
  type: 'objectgroup';
  visible: boolean;
  x: number;
  y: number;
}

export type TiledLayer = TiledTileLayer | TiledObjectLayer;

export interface TiledMap {
  compressionlevel: number;
  height: number;
  infinite: boolean;
  layers: TiledLayer[];
  nextlayerid: number;
  nextobjectid: number;
  orientation: string;
  renderorder: string;
  tiledversion: string;
  tileheight: number;
  tilesets: TiledTileset[];
  tilewidth: number;
  type: string;
  version: number;
  width: number;
}

export type ToolType = 'brush' | 'eraser' | 'fill' | 'object' | 'select';
export type ObjectType = 'spawn' | 'portal' | 'spawner' | 'ramp';

export interface EditorState {
  map: TiledMap | null;
  tilesetImages: Map<string, HTMLImageElement>;
  selectedLayerId: number;
  selectedTileId: number;
  selectedTool: ToolType;
  selectedObjectType: ObjectType;
  camera: { x: number; y: number; zoom: number };
  showGrid: boolean;
  hoveredTile: { x: number; y: number } | null;
  selectedObject: TiledObject | null;
  isDirty: boolean;
  mapFilePath: string | null;
}

export interface ObjectPlacement {
  name: string;
  type: string;
  width: number;
  height: number;
  properties: TiledProperty[];
}
