import React from 'react';

interface MenuBarProps {
  onNewMap: () => void;
  onOpenMap: (file: File) => void;
  onLoadTileset: (file: File) => void;
  onSave: () => void;
  onResize: () => void;
  onUndo: () => void;
  onRedo: () => void;
  hasMap: boolean;
  mapName: string;
  isDirty: boolean;
  canUndo: boolean;
  canRedo: boolean;
}

export function MenuBar({ 
  onNewMap, 
  onOpenMap, 
  onLoadTileset, 
  onSave, 
  onResize, 
  onUndo,
  onRedo,
  hasMap, 
  mapName, 
  isDirty,
  canUndo,
  canRedo,
}: MenuBarProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const tilesetInputRef = React.useRef<HTMLInputElement>(null);

  return (
    <div className="menu-bar">
      <span className="menu-title">Re:Write Map Editor</span>
      <div className="menu-item">
        <button className="menu-btn" onClick={onNewMap}>New</button>
      </div>
      <div className="menu-item">
        <button className="menu-btn" onClick={() => fileInputRef.current?.click()}>Open</button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onOpenMap(f);
            e.target.value = '';
          }}
        />
      </div>
      <div className="menu-item">
        <button className="menu-btn" onClick={() => tilesetInputRef.current?.click()} disabled={!hasMap}>
          Add Tileset
        </button>
        <input
          ref={tilesetInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onLoadTileset(f);
            e.target.value = '';
          }}
        />
      </div>
      <div className="menu-item">
        <button className="menu-btn" onClick={onSave} disabled={!hasMap}>Save</button>
      </div>
      <div className="menu-item">
        <button className="menu-btn" onClick={onResize} disabled={!hasMap}>Resize</button>
      </div>      <div className="menu-separator" />
      <div className="menu-item">
        <button 
          className="menu-btn" 
          onClick={onUndo} 
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
        >
          ↶ Undo
        </button>
      </div>
      <div className="menu-item">
        <button 
          className="menu-btn" 
          onClick={onRedo} 
          disabled={!canRedo}
          title="Redo (Ctrl+Shift+Z or Ctrl+Y)"
        >
          ↷ Redo
        </button>
      </div>      <div className="map-info">
        {hasMap ? (
          <>
            {mapName || 'Untitled'}
            {isDirty && <span className="dirty-indicator">*</span>}
          </>
        ) : (
          'No map loaded'
        )}
      </div>
    </div>
  );
}
