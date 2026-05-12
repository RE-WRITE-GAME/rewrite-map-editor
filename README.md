# Re:Write Map Editor

A browser-based tile map editor built for **Re:Write: The Glitch Chronicles** — a 2D side-scrolling Action-RPG (Isekai MMORPG). Maps are saved in [Tiled](https://www.mapeditor.org/) JSON format and consumed directly by the game server and client.

## Tech Stack

| Layer | Technology |
|---|---|
| UI Framework | React 18 + TypeScript |
| Build Tool | Vite 5 |
| Rendering | HTML5 Canvas (2D API) |
| Map Format | Tiled JSON (`.json`) |

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Type-check without building
npm run typecheck

# Build for production
npm run build

# Preview production build
npm run preview
```

The dev server runs at `http://localhost:5173` by default.

## Project Structure

```
rewrite-map-editor/
├── src/
│   ├── App.tsx                   # Root component, dialog orchestration
│   ├── App.css                   # Global styles and layout
│   ├── components/
│   │   ├── MapCanvas.tsx         # Canvas renderer + mouse/keyboard input
│   │   ├── TilesetPanel.tsx      # Tileset viewer + tile picker
│   │   ├── LayerPanel.tsx        # Layer list, visibility toggles, add/remove
│   │   ├── Toolbar.tsx           # Tool selector (brush/eraser/fill/object/select) + zoom
│   │   ├── ObjectPanel.tsx       # Object list + property editor for selected layer
│   │   ├── MenuBar.tsx           # File menu (new/open/save/resize)
│   │   ├── Minimap.tsx           # Overview minimap with camera navigation
│   │   ├── NewMapDialog.tsx      # Dialog: create a new map
│   │   ├── ResizeDialog.tsx      # Dialog: resize an existing map
│   │   ├── TilesetConfigDialog.tsx # Dialog: configure tileset tile size after loading
│   │   └── AddLayerDialog.tsx    # Dialog: add a new layer
│   ├── hooks/
│   │   └── useMapEditor.ts       # Core editor state, history, and all map mutations
│   ├── types/
│   │   └── tiled.ts              # TypeScript interfaces for Tiled JSON format
│   └── utils/
│       └── tiled.ts              # Pure functions: create/load/save/mutate maps
├── public/
│   └── assets/
│       ├── tilesets/             # Tileset images (PNG)
│       └── tilemaps/             # Sample map files (JSON)
├── dist/                         # Production build output
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## Editor Features

### Tools

| Tool | Shortcut | Description |
|---|---|---|
| Brush | — | Paint the selected tile onto tile layers |
| Eraser | — | Remove tiles (set to 0) |
| Fill | — | Flood-fill a region with the selected tile |
| Select | — | Click to select objects on object layers |
| Place | — | Click to place the selected object type |

### Navigation

| Action | How |
|---|---|
| Pan | `Space + Drag`, `Middle Mouse`, or `Alt + Drag` |
| Zoom | `Scroll Wheel` or `+`/`-` buttons in toolbar |
| Reset zoom | `1:1` button |

### Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Cmd/Ctrl + Z` | Undo |
| `Cmd/Ctrl + Shift + Z` / `Cmd/Ctrl + Y` | Redo |

### Layers

New maps are created with five default layers:

| Layer | Type | Purpose |
|---|---|---|
| Ground | Tile Layer | Base terrain tiles |
| Platforms | Tile Layer | Floating platforms |
| Spawns | Object Layer | Player spawn points |
| Portals | Object Layer | Map transition portals |
| Spawners | Object Layer | Monster spawner zones |

Additional tile or object layers can be added at any time from the Layer panel.

### Object Types

| Type | Object Name | Properties |
|---|---|---|
| `spawn` | `player_spawn` | none |
| `portal` | `portal` | `targetMapId` (string) |
| `spawner` | `monster` | `maxCount`, `respawnMin`, `respawnMax` (ms) |

Right-click an object on the canvas to delete it instantly.

### Tileset Loading

1. Open a map first (or create a new one)
2. Use **File → Load Tileset** to pick a PNG image
3. A config dialog prompts for tile width, height, columns, and rows
4. The tileset is added to the map and tiles are immediately available to paint

Tileset paths are resolved relative to `/assets/` so existing game tilesets load automatically when running locally against the game client's asset server.

### Undo / Redo

The editor keeps up to **50 history entries**. Every paint stroke, fill, object placement/deletion, layer add/remove, layer visibility toggle, and map resize is undoable.

## Map Format

Maps are saved as standard [Tiled 1.10 JSON](https://doc.mapeditor.org/en/stable/reference/json-map-format/).

```jsonc
{
  "type": "map",
  "width": 40,
  "height": 23,
  "tilewidth": 32,
  "tileheight": 32,
  "orientation": "orthogonal",
  "renderorder": "right-down",
  "layers": [ ... ],
  "tilesets": [ ... ]
}
```

## Development Tips

- **Pixel-perfect rendering:** The canvas disables `imageSmoothingEnabled` so tiles render crisply at any zoom level.
- **Large maps:** The renderer culls tiles outside the viewport, so large maps have no performance penalty.
- **Multiple tilesets:** The editor supports multiple tilesets per map; GID ranges are calculated automatically on load.
- **Relative asset paths:** Tileset `image` fields starting with `../` or `./` are rewritten to `/assets/...` at load time so local development works without copying files.
