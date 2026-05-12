import React from 'react';
import type { ToolType } from '../types/tiled';

interface ToolbarProps {
  selectedTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  zoom: number;
  onZoom: (zoom: number) => void;
  isObjectLayer: boolean;
}

export function Toolbar({ selectedTool, onSelectTool, showGrid, onToggleGrid, zoom, onZoom, isObjectLayer }: ToolbarProps) {
  const tools: { id: ToolType; label: string; icon: string }[] = [
    { id: 'brush', label: 'Brush', icon: '\u270E' },
    { id: 'eraser', label: 'Eraser', icon: '\u2395' },
    { id: 'fill', label: 'Fill', icon: '\u25A7' },
    { id: 'select', label: 'Select', icon: '\u2753' },
    { id: 'object', label: 'Place', icon: '+' },
  ];

  return (
    <div className="panel">
      <div className="panel-title">Tools</div>
      <div className="tool-grid">
        {tools.map((tool) => (
          <button
            key={tool.id}
            className={`tool-btn ${selectedTool === tool.id ? 'active' : ''}`}
            onClick={() => onSelectTool(tool.id)}
            title={tool.label}
          >
            <span style={{ fontSize: 14 }}>{tool.icon}</span>
            <div style={{ fontSize: 9 }}>{tool.label}</div>
          </button>
        ))}
        <button
          className={`tool-btn ${showGrid ? 'active' : ''}`}
          onClick={onToggleGrid}
          title="Toggle Grid"
        >
          <span style={{ fontSize: 14 }}>#</span>
          <div style={{ fontSize: 9 }}>Grid</div>
        </button>
      </div>
      <div className="zoom-controls">
        <button onClick={() => onZoom(Math.max(0.1, zoom / 1.2))}>-</button>
        <span>{Math.round(zoom * 100)}%</span>
        <button onClick={() => onZoom(Math.min(5, zoom * 1.2))}>+</button>
        <button onClick={() => onZoom(1)} style={{ fontSize: 10 }}>1:1</button>
      </div>
    </div>
  );
}
