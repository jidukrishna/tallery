import React, { useRef, useEffect, useState } from 'react';
import { useAlbumWorkspace } from '../../context/AlbumWorkspaceContext.jsx';
import {
  Monitor,
  Tablet,
  Smartphone,
  Edit3,
  Palette,
  Loader2,
  Sparkles,
} from 'lucide-react';

export default function TemplatePreview() {
  const {
    album,
    previewHtml,
    previewLoading,
    saving,
    updateTemplateOptions,
  } = useAlbumWorkspace();

  const iframeRef = useRef(null);
  const [deviceView, setDeviceView] = useState('desktop'); // 'desktop', 'tablet', 'mobile'
  const [showDetailsBar, setShowDetailsBar] = useState(false);

  // Synchronize contenteditable inside the iframe per project.md §6.1
  const handleIframeLoad = () => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    try {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc) return;

      // Inject editing styles inside iframe head
      const styleEl = doc.createElement('style');
      styleEl.textContent = `
        [data-editable] {
          cursor: text !important;
          transition: outline 0.15s ease, background-color 0.15s ease;
          border-radius: 4px;
        }
        [data-editable]:hover {
          outline: 1.5px dashed rgba(245, 158, 11, 0.6) !important;
          outline-offset: 3px;
          background-color: rgba(245, 158, 11, 0.05);
        }
        [data-editable]:focus {
          outline: 2px solid #f59e0b !important;
          outline-offset: 4px;
          background-color: rgba(245, 158, 11, 0.08);
        }
      `;
      doc.head.appendChild(styleEl);

      // Setup contenteditable nodes
      const editableNodes = doc.querySelectorAll('[data-editable]');
      editableNodes.forEach((node) => {
        const fieldName = node.getAttribute('data-editable');
        node.setAttribute('contenteditable', 'true');
        node.setAttribute('spellcheck', 'false');

        // On blur or input
        node.addEventListener('blur', () => {
          const newText = node.innerText.trim();
          if (fieldName === 'title' || fieldName === 'description') {
            updateTemplateOptions({ [fieldName]: newText });
          }
        });

        // Prevent accidental newlines in title
        if (fieldName === 'title') {
          node.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              node.blur();
            }
          });
        }
      });
    } catch (err) {
      console.warn('Cannot attach contenteditable listeners to iframe:', err);
    }
  };

  const getDeviceWidthClass = () => {
    switch (deviceView) {
      case 'mobile':
        return 'w-[390px] shadow-2xl rounded-3xl border-8 border-stone-800 my-4';
      case 'tablet':
        return 'w-[768px] shadow-xl rounded-2xl border-4 border-stone-700 my-4';
      default:
        return 'w-full h-full';
    }
  };

  const titleValue = album?.templateOptions?.title ?? album?.name ?? '';
  const descValue = album?.templateOptions?.description ?? album?.description ?? '';
  const accentColor = album?.templateOptions?.accentColor ?? '#2b6cb0';

  return (
    <div className="flex-1 flex flex-col bg-stone-100 overflow-hidden relative">
      {/* Top Preview Controls Bar */}
      <div className="bg-white px-5 py-2.5 border-b border-stone-200 flex items-center justify-between text-xs z-10">
        {/* Left: Device view toggles */}
        <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
          <button
            onClick={() => setDeviceView('desktop')}
            className={`p-1.5 rounded-lg transition-all ${
              deviceView === 'desktop'
                ? 'bg-white shadow-xs text-stone-900 font-semibold'
                : 'text-stone-500 hover:text-stone-800'
            }`}
            title="Desktop view"
          >
            <Monitor className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeviceView('tablet')}
            className={`p-1.5 rounded-lg transition-all ${
              deviceView === 'tablet'
                ? 'bg-white shadow-xs text-stone-900 font-semibold'
                : 'text-stone-500 hover:text-stone-800'
            }`}
            title="Tablet view (768px)"
          >
            <Tablet className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeviceView('mobile')}
            className={`p-1.5 rounded-lg transition-all ${
              deviceView === 'mobile'
                ? 'bg-white shadow-xs text-stone-900 font-semibold'
                : 'text-stone-500 hover:text-stone-800'
            }`}
            title="Mobile view (390px)"
          >
            <Smartphone className="w-4 h-4" />
          </button>
        </div>

        {/* Center: Live Inline Editing Hint */}
        <div className="hidden md:flex items-center gap-2 text-stone-400 font-mono text-[11px]">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Click directly on title/subtitle in preview to edit text</span>
        </div>

        {/* Right: Toggle Page Details & Color */}
        <div className="flex items-center gap-3">
          {/* Accent color picker */}
          <label className="flex items-center gap-1.5 cursor-pointer bg-stone-50 border border-stone-200 px-2.5 py-1 rounded-lg hover:bg-stone-100 transition-colors">
            <Palette className="w-3.5 h-3.5 text-stone-500" />
            <span className="text-[11px] font-medium text-stone-600">Accent</span>
            <input
              type="color"
              value={accentColor}
              onChange={(e) => updateTemplateOptions({ accentColor: e.target.value })}
              className="w-4 h-4 rounded-full border-0 p-0 cursor-pointer overflow-hidden"
            />
          </label>

          {/* Fallback Details Bar Toggle */}
          <button
            onClick={() => setShowDetailsBar(!showDetailsBar)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-all ${
              showDetailsBar
                ? 'bg-amber-50 border-amber-300 text-amber-800 font-semibold'
                : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Page Details</span>
          </button>

          {/* Saving / Loading indicator */}
          {(previewLoading || saving) && (
            <div className="flex items-center gap-1 text-amber-600 font-medium">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span className="text-[11px]">{saving ? 'Saving...' : 'Updating...'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Fallback Collapsible Details Inputs Bar */}
      {showDetailsBar && (
        <div className="bg-amber-50/60 border-b border-amber-200/80 px-6 py-3 flex flex-wrap items-center gap-4 text-xs animate-in slide-in-from-top duration-150">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-600 mb-1">
              Site Title
            </label>
            <input
              type="text"
              value={titleValue}
              onChange={(e) => updateTemplateOptions({ title: e.target.value })}
              placeholder="Display title on site"
              className="w-full bg-white px-3 py-1.5 text-xs rounded-lg border border-stone-300 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="flex-1 min-w-[280px]">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-600 mb-1">
              Site Description / Subtitle
            </label>
            <input
              type="text"
              value={descValue}
              onChange={(e) => updateTemplateOptions({ description: e.target.value })}
              placeholder="Display subtitle on site"
              className="w-full bg-white px-3 py-1.5 text-xs rounded-lg border border-stone-300 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>
      )}

      {/* Iframe Container */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-stone-200/50">
        <div
          className={`h-full bg-white overflow-hidden shadow-xs transition-all duration-300 flex flex-col ${getDeviceWidthClass()}`}
        >
          <iframe
            ref={iframeRef}
            srcDoc={previewHtml}
            title="Live Template Preview"
            onLoad={handleIframeLoad}
            className="w-full h-full border-0 flex-1 bg-white"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      </div>
    </div>
  );
}

