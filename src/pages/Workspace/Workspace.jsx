import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { AlbumWorkspaceProvider, useAlbumWorkspace } from '../../context/AlbumWorkspaceContext.jsx';
import TemplateSidebar from './TemplateSidebar.jsx';
import TemplatePreview from './TemplatePreview.jsx';
import AssetSelectionBar from './AssetSelectionBar.jsx';
import ImageEditPanel from './ImageEditPanel.jsx';
import ExportButton from './ExportButton.jsx';

function WorkspaceContent() {
  const { album, loading, error, images } = useAlbumWorkspace();

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-stone-100 text-stone-400">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-2" />
        <p className="text-sm font-semibold text-stone-600">Loading Workspace...</p>
      </div>
    );
  }

  if (error || !album) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-stone-50 p-6 text-center">
        <AlertCircle className="w-10 h-10 text-red-500 mb-2" />
        <h2 className="text-lg font-bold text-stone-800">Unable to load workspace</h2>
        <p className="text-xs text-stone-500 mt-1 mb-4">{error || 'Album not found'}</p>
        <Link to="/" className="text-xs font-semibold text-amber-600 hover:underline">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const selectedCount = images.filter((i) => i.selected).length;

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-61px)] overflow-hidden">
      {/* Top Workspace Bar */}
      <div className="bg-white border-b border-stone-200 px-6 py-2.5 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <Link
            to={`/album/${album.id}`}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium"
            title="Back to Photo Selection"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Photos</span>
          </Link>

          <span className="text-stone-300">|</span>

          <div>
            <h1 className="text-sm font-bold text-stone-900 leading-tight">
              {album.name}
            </h1>
            <span className="text-[11px] text-stone-400">
              Workspace • {selectedCount} photos in gallery
            </span>
          </div>
        </div>

        {/* Export Button */}
        <ExportButton albumId={album.id} disabled={selectedCount === 0} />
      </div>

      {/* Main 3-Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Bar: Templates */}
        <TemplateSidebar />

        {/* Center: Live Template Preview & Inline Editor */}
        <TemplatePreview />

        {/* Right Bar: Focused Image Crop / Temperature */}
        <ImageEditPanel />
      </div>

      {/* Bottom Bar: Filmstrip / Reorder */}
      <AssetSelectionBar />
    </div>
  );
}

export default function Workspace() {
  const { id } = useParams();

  return (
    <AlbumWorkspaceProvider albumId={id}>
      <WorkspaceContent />
    </AlbumWorkspaceProvider>
  );
}

