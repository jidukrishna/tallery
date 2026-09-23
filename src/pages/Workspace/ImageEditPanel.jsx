import React, { useState, useEffect, useRef } from 'react';
import { useAlbumWorkspace } from '../../context/AlbumWorkspaceContext.jsx';
import {
  Sliders,
  Crop,
  SunMedium,
  RotateCcw,
  Sparkles,
  Maximize2,
  Square,
  RectangleHorizontal,
} from 'lucide-react';

export default function ImageEditPanel() {
  const { focusedImage, updateFocusedImageEdits } = useAlbumWorkspace();

  const [crop, setCrop] = useState({ x: 0, y: 0, w: 1, h: 1 });
  const [temperature, setTemperature] = useState(0);
  const [activeTab, setActiveTab] = useState('crop'); // 'crop' | 'color'

  const containerRef = useRef(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Sync state with focused image
  useEffect(() => {
    if (focusedImage) {
      setCrop(focusedImage.edits?.crop || { x: 0, y: 0, w: 1, h: 1 });
      setTemperature(focusedImage.edits?.temperature ?? 0);
    }
  }, [focusedImage?.id]);

  if (!focusedImage) {
    return (
      <aside className="w-80 bg-white border-l border-stone-200 p-6 flex flex-col items-center justify-center text-center text-stone-400 shrink-0">
        <Sliders className="w-10 h-10 mb-2 stroke-[1.5] text-stone-300" />
        <p className="text-sm font-semibold text-stone-700">No Photo Focused</p>
        <p className="text-xs text-stone-400 mt-1 max-w-[200px]">
          Click any photo in the bottom filmstrip to crop or adjust color temperature.
        </p>
      </aside>
    );
  }

  const handleTempChange = (newTemp) => {
    const val = Number(newTemp);
    setTemperature(val);
    updateFocusedImageEdits({ temperature: val, crop });
  };

  const handleApplyPresetCrop = (ratio) => {
    let newCrop = { x: 0, y: 0, w: 1, h: 1 };
    if (ratio === '1:1') {
      newCrop = { x: 0.125, y: 0, w: 0.75, h: 1 };
    } else if (ratio === '4:3') {
      newCrop = { x: 0.05, y: 0.1, w: 0.9, h: 0.8 };
    } else if (ratio === '16:9') {
      newCrop = { x: 0, y: 0.2, w: 1, h: 0.6 };
    } else if (ratio === 'reset') {
      newCrop = { x: 0, y: 0, w: 1, h: 1 };
    }
    setCrop(newCrop);
    updateFocusedImageEdits({ crop: newCrop, temperature });
  };

  const handleResetAll = () => {
    const defaultEdits = {
      crop: { x: 0, y: 0, w: 1, h: 1 },
      temperature: 0,
    };
    setCrop(defaultEdits.crop);
    setTemperature(0);
    updateFocusedImageEdits(defaultEdits);
  };

  // Drag to select crop box
  const handleMouseDown = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const startX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const startY = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    isDraggingRef.current = true;
    dragStartRef.current = { x: startX, y: startY };
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const currX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const currY = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    const left = Math.min(dragStartRef.current.x, currX);
    const top = Math.min(dragStartRef.current.y, currY);
    const width = Math.max(0.1, Math.abs(currX - dragStartRef.current.x));
    const height = Math.max(0.1, Math.abs(currY - dragStartRef.current.y));

    const newCrop = {
      x: Number(left.toFixed(3)),
      y: Number(top.toFixed(3)),
      w: Number(Math.min(1 - left, width).toFixed(3)),
      h: Number(Math.min(1 - top, height).toFixed(3)),
    };
    setCrop(newCrop);
  };

  const handleMouseUp = () => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      updateFocusedImageEdits({ crop, temperature });
    }
  };

  // CSS filter representing temperature
  const getTemperatureFilter = () => {
    if (temperature > 0) {
      // Warm: sepia + saturated gold
      return `sepia(${temperature * 0.7}%) saturate(${100 + temperature * 0.5}%)`;
    } else if (temperature < 0) {
      // Cool: blue tint
      return `hue-rotate(${temperature * 0.6}deg) saturate(${100 - temperature * 0.3}%)`;
    }
    return 'none';
  };

  return (
    <aside className="w-80 bg-white border-l border-stone-200 flex flex-col h-full shrink-0">
      {/* Header */}
      <div className="p-4 border-b border-stone-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-amber-600" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-700">
            Edit Photo
          </h2>
        </div>
        <button
          onClick={handleResetAll}
          className="text-[11px] text-stone-400 hover:text-amber-600 flex items-center gap-1 transition-colors"
          title="Reset all edits"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* Interactive Canvas / Image Preview with Crop Overlay */}
      <div className="p-4 border-b border-stone-200 bg-stone-50 flex flex-col items-center">
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="relative w-full aspect-4/3 rounded-xl overflow-hidden bg-stone-900 shadow-inner select-none cursor-crosshair border border-stone-200"
        >
          <img
            src={focusedImage.sourceUrl || focusedImage.thumbUrl}
            alt={focusedImage.file}
            style={{ filter: getTemperatureFilter() }}
            className="w-full h-full object-contain pointer-events-none"
          />

          {/* Semi-transparent dark overlay outside crop box */}
          <div
            className="absolute border-2 border-amber-400 bg-amber-500/10 shadow-lg pointer-events-none transition-all"
            style={{
              left: `${crop.x * 100}%`,
              top: `${crop.y * 100}%`,
              width: `${crop.w * 100}%`,
              height: `${crop.h * 100}%`,
            }}
          >
            {/* Corner tags */}
            <div className="absolute top-0 left-0 w-2 h-2 bg-amber-500 border border-white" />
            <div className="absolute top-0 right-0 w-2 h-2 bg-amber-500 border border-white" />
            <div className="absolute bottom-0 left-0 w-2 h-2 bg-amber-500 border border-white" />
            <div className="absolute bottom-0 right-0 w-2 h-2 bg-amber-500 border border-white" />
          </div>
        </div>
        <span className="text-[10px] text-stone-400 mt-2">
          Click and drag on the preview to adjust crop rectangle
        </span>
      </div>

      {/* Editing Controls */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Crop Presets */}
        <div>
          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Crop className="w-3.5 h-3.5 text-amber-600" />
            <span>Crop Aspect Ratio</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleApplyPresetCrop('reset')}
              className="px-3 py-2 text-xs font-medium bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
            >
              <Maximize2 className="w-3.5 h-3.5 text-stone-500" />
              <span>Full (Reset)</span>
            </button>
            <button
              onClick={() => handleApplyPresetCrop('1:1')}
              className="px-3 py-2 text-xs font-medium bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
            >
              <Square className="w-3.5 h-3.5 text-stone-500" />
              <span>1:1 Square</span>
            </button>
            <button
              onClick={() => handleApplyPresetCrop('4:3')}
              className="px-3 py-2 text-xs font-medium bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
            >
              <RectangleHorizontal className="w-3.5 h-3.5 text-stone-500" />
              <span>4:3 Standard</span>
            </button>
            <button
              onClick={() => handleApplyPresetCrop('16:9')}
              className="px-3 py-2 text-xs font-medium bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
            >
              <RectangleHorizontal className="w-3.5 h-3.5 text-stone-500" />
              <span>16:9 Wide</span>
            </button>
          </div>
        </div>

        {/* Temperature Slider */}
        <div className="pt-4 border-t border-stone-100">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
              <SunMedium className="w-3.5 h-3.5 text-amber-600" />
              <span>Color Temperature</span>
            </label>
            <span className="text-xs font-mono font-bold text-stone-600">
              {temperature > 0 ? `+${temperature}` : temperature}
            </span>
          </div>

          <div className="space-y-2">
            <input
              type="range"
              min="-50"
              max="50"
              step="1"
              value={temperature}
              onChange={(e) => handleTempChange(e.target.value)}
              className="w-full accent-amber-500 cursor-pointer h-2 bg-linear-to-r from-blue-300 via-stone-200 to-amber-400 rounded-lg appearance-none"
            />
            <div className="flex items-center justify-between text-[10px] font-semibold text-stone-400">
              <span className="text-sky-600">Cooler (-50)</span>
              <span>Neutral (0)</span>
              <span className="text-amber-600">Warmer (+50)</span>
            </div>
          </div>
        </div>

        {/* Non-destructive notice */}
        <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80 text-[11px] text-stone-500 flex items-start gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
          <span>
            Edits are non-destructive parameters stored in <code className="font-mono">album.json</code> and applied during export.
          </span>
        </div>
      </div>
    </aside>
  );
}

