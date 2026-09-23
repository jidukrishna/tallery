import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { fetchAlbum, updateAlbum } from '../api/albumsApi.js';
import { fetchAlbumImages, updateImageEdit } from '../api/imagesApi.js';
import { fetchTemplates, fetchPreviewHtml } from '../api/templatesApi.js';

const AlbumWorkspaceContext = createContext(null);

export function AlbumWorkspaceProvider({ albumId, children }) {
  const [album, setAlbum] = useState(null);
  const [images, setImages] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('template-classic');
  const [focusedImageId, setFocusedImageId] = useState(null);
  const [previewHtml, setPreviewHtml] = useState('');
  const [loading, setLoading] = useState(true);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const saveTimeoutRef = useRef(null);

  // Load initial data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [albumData, imgData, templatesData] = await Promise.all([
        fetchAlbum(albumId),
        fetchAlbumImages(albumId),
        fetchTemplates(),
      ]);

      setAlbum(albumData);
      setImages(imgData || []);
      setTemplates(templatesData || []);
      setSelectedTemplateId(albumData.templateId || 'template-classic');

      const selectedList = (imgData || []).filter((i) => i.selected);
      if (selectedList.length > 0) {
        setFocusedImageId(selectedList[0].id);
      }
    } catch (err) {
      console.error('Failed to load workspace data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [albumId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Refresh preview HTML whenever template or relevant options change
  const refreshPreview = useCallback(async () => {
    if (!albumId) return;
    try {
      setPreviewLoading(true);
      const html = await fetchPreviewHtml(albumId);
      setPreviewHtml(html);
    } catch (err) {
      console.error('Failed to refresh preview:', err);
    } finally {
      setPreviewLoading(false);
    }
  }, [albumId]);

  useEffect(() => {
    if (album) {
      refreshPreview();
    }
  }, [album?.templateId, album?.templateOptions?.title, album?.templateOptions?.description, album?.templateOptions?.accentColor, images]);

  // Select a template
  const selectTemplate = async (templateId) => {
    setSelectedTemplateId(templateId);
    setAlbum((prev) => ({ ...prev, templateId }));
    try {
      await updateAlbum(albumId, { templateId });
      refreshPreview();
    } catch (err) {
      console.error('Failed to update template:', err);
    }
  };

  // Update template options (title, description, accentColor)
  const updateTemplateOptions = (options) => {
    setAlbum((prev) => ({
      ...prev,
      templateOptions: {
        ...prev.templateOptions,
        ...options,
      },
    }));

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        setSaving(true);
        await updateAlbum(albumId, { templateOptions: options });
        refreshPreview();
      } catch (err) {
        console.error('Failed to save template options:', err);
      } finally {
        setSaving(false);
      }
    }, 400);
  };

  // Reorder images
  const reorderImages = async (newOrderedImages) => {
    setImages(newOrderedImages);
    const updatedAlbumImages = newOrderedImages.map((img, idx) => ({
      ...img,
      order: idx,
    }));

    setAlbum((prev) => ({ ...prev, images: updatedAlbumImages }));

    try {
      await updateAlbum(albumId, { images: updatedAlbumImages });
      refreshPreview();
    } catch (err) {
      console.error('Failed to reorder images:', err);
    }
  };

  // Toggle or update image selection
  const toggleImageSelection = async (imageId) => {
    const updated = images.map((img) =>
      img.id === imageId ? { ...img, selected: !img.selected } : img
    );
    setImages(updated);
    setAlbum((prev) => ({ ...prev, images: updated }));

    try {
      await updateAlbum(albumId, { images: updated });
      refreshPreview();
    } catch (err) {
      console.error('Failed to toggle image selection:', err);
    }
  };

  // Update edits for focused image (crop, temperature)
  const updateFocusedImageEdits = (edits) => {
    if (!focusedImageId) return;

    setImages((prev) =>
      prev.map((img) =>
        img.id === focusedImageId
          ? { ...img, edits: { ...img.edits, ...edits } }
          : img
      )
    );

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        setSaving(true);
        await updateImageEdit(albumId, focusedImageId, edits);
        // Also update local album state
        setAlbum((prev) => ({
          ...prev,
          images: prev.images.map((i) =>
            i.id === focusedImageId ? { ...i, edits: { ...i.edits, ...edits } } : i
          ),
        }));
      } catch (err) {
        console.error('Failed to save image edits:', err);
      } finally {
        setSaving(false);
      }
    }, 300);
  };

  const focusedImage = images.find((i) => i.id === focusedImageId) || null;

  return (
    <AlbumWorkspaceContext.Provider
      value={{
        album,
        images,
        templates,
        selectedTemplateId,
        focusedImageId,
        focusedImage,
        previewHtml,
        loading,
        previewLoading,
        saving,
        error,
        setFocusedImageId,
        selectTemplate,
        updateTemplateOptions,
        reorderImages,
        toggleImageSelection,
        updateFocusedImageEdits,
        reloadWorkspace: loadData,
        refreshPreview,
      }}
    >
      {children}
    </AlbumWorkspaceContext.Provider>
  );
}

export function useAlbumWorkspace() {
  const ctx = useContext(AlbumWorkspaceContext);
  if (!ctx) {
    throw new Error('useAlbumWorkspace must be used within an AlbumWorkspaceProvider');
  }
  return ctx;
}

