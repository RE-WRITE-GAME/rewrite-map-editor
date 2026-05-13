import React from 'react';
import { useMapEditor } from './hooks/useMapEditor';
import { MapCanvas } from './components/MapCanvas';
import { TilesetPanel } from './components/TilesetPanel';
import { LayerPanel } from './components/LayerPanel';
import { Toolbar } from './components/Toolbar';
import { ObjectPanel } from './components/ObjectPanel';
import { MenuBar } from './components/MenuBar';
import { NewMapDialog } from './components/NewMapDialog';
import { ResizeDialog } from './components/ResizeDialog';
import { TilesetConfigDialog } from './components/TilesetConfigDialog';
import { Minimap } from './components/Minimap';
import './App.css';

export default function App() {
  const editor = useMapEditor();
  const [showNewMap, setShowNewMap] = React.useState(false);
  const [showResize, setShowResize] = React.useState(false);
  const [showTilesetConfig, setShowTilesetConfig] = React.useState(false);
  const [pendingTileset, setPendingTileset] = React.useState<{
    file: File;
    url: string;
    img: HTMLImageElement;
  } | null>(null);
  const [canvasSize, setCanvasSize] = React.useState({ width: 800, height: 600 });

  const handleLoadMap = async (file: File) => {
    const text = await file.text();
    await editor.loadMapFromFile(text, file.name);
  };

  const handleLoadTileset = async (file: File) => {
    if (!editor.state.map) return;
    const url = URL.createObjectURL(file);

    const img = new Image();
    img.src = url;
    await new Promise<void>((resolve) => { img.onload = () => resolve(); });

    // Store the pending tileset and show config dialog
    setPendingTileset({ file, url, img });
    setShowTilesetConfig(true);
  };

  const handleTilesetConfigConfirm = async (config: {
    tileWidth: number;
    tileHeight: number;
    columns: number;
    rows: number;
  }) => {
    if (!editor.state.map || !pendingTileset) return;

    const { file, url, img } = pendingTileset;
    const map = editor.state.map;
    const firstgid = map.tilesets.length > 0
      ? Math.max(...map.tilesets.map(t => t.firstgid + t.tilecount))
      : 1;
    const name = file.name.replace(/\.[^.]+$/, '');
    const tilecount = config.columns * config.rows;

    map.tilesets.push({
      columns: config.columns,
      firstgid,
      image: url,
      imageheight: img.height,
      imagewidth: img.width,
      margin: 0,
      spacing: 0,
      name,
      tilecount,
      tileheight: config.tileHeight,
      tilewidth: config.tileWidth,
    });

    await editor.loadTilesetImages(map);
    
    // Clean up
    setShowTilesetConfig(false);
    setPendingTileset(null);
  };

  const handleSave = () => {
    const json = editor.saveMap();
    if (!json) return;
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${editor.state.mapName || 'map'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectedLayer = editor.getSelectedLayer();
  const isObjectLayer = selectedLayer?.type === 'objectgroup';

  return (
    <div className="app">
      <MenuBar
        onNewMap={() => setShowNewMap(true)}
        onOpenMap={handleLoadMap}
        onLoadTileset={handleLoadTileset}
        onSave={handleSave}
        onResize={() => setShowResize(true)}
        onUndo={editor.undo}
        onRedo={editor.redo}
        hasMap={!!editor.state.map}
        mapName={editor.state.mapName}
        isDirty={editor.state.isDirty}
        canUndo={editor.canUndo}
        canRedo={editor.canRedo}
      />
      <div className="main-layout">
        {editor.state.map && (
          <div className="left-panel">
            <LayerPanel
              layers={editor.getAllLayers()}
              selectedLayerId={editor.state.selectedLayerId}
              onSelectLayer={editor.setSelectedLayer}
              onToggleVisibility={editor.toggleLayerVisibility}
              onAddLayer={editor.addTileLayer}
              onRemoveLayer={editor.removeLayer}
            />
            <ObjectPanel
              objects={editor.getObjectsOnSelectedLayer()}
              isObjectLayer={isObjectLayer}
              objectType={editor.state.selectedObjectType}
              onSelectObjectType={editor.setObjectType}
              onDeleteObject={editor.deleteObject}
              onUpdateObject={editor.updateObject}
            />
          </div>
        )}
        <div className="canvas-area">
          {editor.state.map ? (
            <MapCanvas
              editor={editor}
              onCanvasResize={setCanvasSize}
            />
          ) : (
            <div className="empty-state">
              <h2>Re:Write Map Editor</h2>
              <p>Create a new map or open an existing Tiled JSON file to begin editing.</p>
              <div className="empty-actions">
                <button className="btn btn-primary" onClick={() => setShowNewMap(true)}>New Map</button>
                <label className="btn btn-secondary">
                  Open Map
                  <input
                    type="file"
                    accept=".json"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleLoadMap(f);
                    }}
                  />
                </label>
              </div>
            </div>
          )}
        </div>
        {editor.state.map && (
          <div className="right-panel">
            <Minimap
              map={editor.state.map}
              tilesetImages={editor.tilesetImages}
              cameraX={editor.state.cameraX}
              cameraY={editor.state.cameraY}
              zoom={editor.state.zoom}
              canvasWidth={canvasSize.width}
              canvasHeight={canvasSize.height}
              onCameraChange={(x, y) => editor.setCamera(x, y, editor.state.zoom)}
            />
            <Toolbar
              selectedTool={editor.state.selectedTool}
              onSelectTool={editor.setTool}
              showGrid={editor.state.showGrid}
              onToggleGrid={editor.toggleGrid}
              zoom={editor.state.zoom}
              onZoom={(z) => editor.setCamera(editor.state.cameraX, editor.state.cameraY, z)}
              isObjectLayer={isObjectLayer}
            />
            <TilesetPanel
              map={editor.state.map}
              tilesetImages={editor.tilesetImages}
              selectedTileId={editor.state.selectedTileId}
              onSelectTile={editor.setSelectedTile}
            />
          </div>
        )}
      </div>
      {showNewMap && (
        <NewMapDialog
          onCreate={(w, h, name) => {
            editor.newMap(w, h, name);
            setShowNewMap(false);
          }}
          onClose={() => setShowNewMap(false)}
        />
      )}
      {showResize && editor.state.map && (
        <ResizeDialog
          currentWidth={editor.state.map.width}
          currentHeight={editor.state.map.height}
          onResize={editor.resizeMap}
          onClose={() => setShowResize(false)}
        />
      )}
      {showTilesetConfig && pendingTileset && editor.state.map && (
        <TilesetConfigDialog
          imageWidth={pendingTileset.img.width}
          imageHeight={pendingTileset.img.height}
          defaultTileWidth={editor.state.map.tilewidth}
          defaultTileHeight={editor.state.map.tileheight}
          onConfirm={handleTilesetConfigConfirm}
          onClose={() => {
            setShowTilesetConfig(false);
            if (pendingTileset) {
              URL.revokeObjectURL(pendingTileset.url);
            }
            setPendingTileset(null);
          }}
        />
      )}
    </div>
  );
}
