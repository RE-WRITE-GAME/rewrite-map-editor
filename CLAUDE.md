# CLAUDE.md — Re:Write Map Editor

Context for Claude Code when working in this repository.

## What this project is

A **browser-based tile map editor** built specifically for *Re:Write: The Glitch Chronicles*, a 2D MMORPG. It produces Tiled-compatible JSON maps consumed directly by `rewrite-game-server` and `rewrite-game-client`.

Stack: **React 18 + TypeScript + Vite**. No backend. Rendering via HTML5 Canvas.

## Architecture in one paragraph

All editor state lives in `src/hooks/useMapEditor.ts` — a single custom hook that owns the `EditorState` object, the undo/redo history stack, and every map-mutation function. Components are pure presentational: they receive state and callbacks from `useMapEditor` via `App.tsx` and never mutate state directly. `MapCanvas.tsx` is the only component with its own local state (hover tile, selected object ID, pan/zoom gesture tracking). Utility functions in `src/utils/tiled.ts` are pure (no React, no side effects).

## Key files

| File | Role |
|---|---|
| `src/hooks/useMapEditor.ts` | All editor state + mutations + undo/redo + keyboard shortcuts |
| `src/components/MapCanvas.tsx` | Canvas renderer + mouse/keyboard input handler |
| `src/types/tiled.ts` | TypeScript interfaces for Tiled JSON format |
| `src/utils/tiled.ts` | Pure map utilities (create, load, save, flood-fill, coordinate math) |
| `src/App.tsx` | Root: wires useMapEditor to all panels and dialogs |

## Map format

Standard **Tiled 1.10 JSON** — `width`, `height`, `tilewidth`, `tileheight`, `layers[]`, `tilesets[]`. Layer types are `tilelayer` (flat `data: number[]` array, row-major) and `objectgroup` (array of objects with `x`, `y`, `width`, `height`, `properties[]`). Tile ID 0 = empty.

## Object types

Three game-specific object types are templated in `useMapEditor.ts`:

- `spawn` → `player_spawn` (32×32, no properties)
- `portal` → `portal` (50×80, `targetMapId: string`)
- `spawner` → `monster` (32×32, `maxCount: int`, `respawnMin: int`, `respawnMax: int`)

## Undo/redo

`historyRef` holds up to 50 deep-cloned `TiledMap` snapshots. `pushHistory()` must be called **before** any mutation. History is ref-based (not state) to avoid extra renders.

## Tileset path resolution

`resolveTilesetImagePath()` in `useMapEditor.ts` rewrites relative paths (`../`, `./`) to `/assets/...`. Blob URLs (from freshly loaded files) are passed through unchanged.

## Rendering

`MapCanvas` runs a `requestAnimationFrame` loop. It culls tiles outside the viewport before drawing. `imageSmoothingEnabled = false` is set on every frame for pixel-perfect output. The camera is just a `(cameraX, cameraY, zoom)` triple stored in editor state.

## Commands

```bash
npm run dev        # Vite dev server on :5173
npm run build      # tsc + vite build → dist/
npm run typecheck  # tsc --noEmit (no emit, fast type check)
npm run preview    # Serve dist/ locally
```

## Common tasks

**Add a new tool:**
1. Add the type to `ToolType` in `src/types/tiled.ts`
2. Add the handler in `useMapEditor.ts`
3. Add the button in `src/components/Toolbar.tsx`
4. Wire the handler in `MapCanvas.tsx` inside `handleMouseDown`/`handleMouseMove`

**Add a new object type:**
1. Add to `ObjectType` in `src/types/tiled.ts`
2. Add a template entry to `OBJECT_TEMPLATES` in `useMapEditor.ts`
3. Add to the object type selector in `src/components/ObjectPanel.tsx`

**Add a new dialog:**
1. Create the component in `src/components/`
2. Add open/close state in `App.tsx`
3. Render conditionally at the bottom of `App.tsx`'s JSX

## What to avoid

- Do not add global CSS that affects the canvas element — it breaks pixel rendering.
- Do not call `setState` inside `render()` (the RAF loop) — it will cause infinite renders.
- Do not skip `pushHistory()` before mutations — that breaks undo.
- Do not store large tileset images in React state — they live in `tilesetImagesRef` (a ref) to avoid re-render thrashing.
