import React, { useState, useRef } from 'react';
import { useAlbumWorkspace } from '../../context/AlbumWorkspaceContext.jsx';
import { Layout, Plus, Check, Upload, Loader2, X, AlertCircle } from 'lucide-react';
import { uploadTemplate } from '../../api/templatesApi.js';

export default function TemplateSidebar() {
  const {
    templates,
    selectedTemplateId,
    selectTemplate,
    reloadWorkspace,
  } = useAlbumWorkspace();

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  const handleZipUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setUploadError(null);
      await uploadTemplate(file);
      await reloadWorkspace();
      setIsUploadModalOpen(false);
    } catch (err) {
      setUploadError(err.message || 'Template upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <aside className="w-72 bg-white border-r border-stone-200 flex flex-col h-full shrink-0">
      {/* Header */}
      <div className="p-4 border-b border-stone-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layout className="w-4 h-4 text-amber-600" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-700">
            Site Templates
          </h2>
        </div>
        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
          title="Add custom template (.zip)"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add</span>
        </button>
      </div>

      {/* Templates List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {templates.map((tpl) => {
          const isSelected = tpl.id === selectedTemplateId;
          return (
            <div
              key={tpl.id}
              onClick={() => selectTemplate(tpl.id)}
              className={`group relative rounded-xl border-2 overflow-hidden cursor-pointer transition-all duration-200 ${
                isSelected
                  ? 'border-amber-500 shadow-md ring-2 ring-amber-500/20 bg-amber-50/20'
                  : 'border-stone-200 hover:border-stone-300 bg-white'
              }`}
            >
              {/* Thumbnail */}
              <div className="h-28 bg-stone-100 overflow-hidden relative border-b border-stone-100">
                <img
                  src={tpl.thumbUrl}
                  alt={tpl.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {isSelected && (
                  <div className="absolute top-2 right-2 bg-amber-500 text-white rounded-full p-1 shadow-xs">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-stone-900">{tpl.name}</h3>
                  {tpl.editableFields?.includes('title') && (
                    <span className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded font-mono">
                      Editable
                    </span>
                  )}
                </div>
                {tpl.description && (
                  <p className="mt-1 text-[11px] text-stone-500 leading-snug line-clamp-2">
                    {tpl.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Upload Custom Template Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50">
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <Upload className="w-4 h-4 text-amber-600" />
                <span>Upload Custom Template</span>
              </h3>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs text-stone-600 leading-relaxed">
                Upload a self-contained template as a <code className="bg-stone-100 px-1 py-0.5 rounded font-mono">.zip</code> package containing <code className="font-mono">template.json</code>, <code className="font-mono">index.html</code>, and <code className="font-mono">styles.css</code> per the Template Authoring Guide.
              </p>

              {uploadError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{uploadError}</span>
                </div>
              )}

              <input
                type="file"
                ref={fileInputRef}
                accept=".zip"
                onChange={handleZipUpload}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-stone-200 hover:border-amber-400 hover:bg-stone-50 rounded-xl p-6 text-center cursor-pointer transition-all"
              >
                {uploading ? (
                  <div className="flex flex-col items-center gap-2 text-stone-600">
                    <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                    <span className="text-xs font-medium">Validating & extracting template...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1.5">
                    <Upload className="w-8 h-8 text-stone-400" />
                    <span className="text-xs font-semibold text-stone-800">
                      Click to select .zip file
                    </span>
                    <span className="text-[10px] text-stone-400">
                      Must conform to templates.md schema
                    </span>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setIsUploadModalOpen(false)}
                  disabled={uploading}
                  className="px-4 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-xl"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

