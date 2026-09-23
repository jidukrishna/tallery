import React, { useState } from 'react';
import { Download, Loader2, CheckCircle2, Sparkles } from 'lucide-react';
import { triggerExport } from '../../api/exportApi.js';

export default function ExportButton({ albumId, disabled }) {
  const [exporting, setExporting] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [success, setSuccess] = useState(false);

  const handleExport = async () => {
    try {
      setExporting(true);
      setSuccess(false);
      setStatusMsg('Applying edits & rendering images...');

      const res = await triggerExport(albumId);
      setStatusMsg('Packaging static site into .zip...');

      // Trigger browser download via invisible link
      const link = document.createElement('a');
      link.href = res.downloadUrl;
      link.setAttribute('download', res.filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setSuccess(true);
      setStatusMsg('Export complete!');
      setTimeout(() => {
        setSuccess(false);
        setStatusMsg('');
      }, 4000);
    } catch (err) {
      alert(`Export failed: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {statusMsg && (
        <span className="text-xs font-medium text-amber-700 animate-in fade-in flex items-center gap-1">
          {success ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          ) : (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
          )}
          <span>{statusMsg}</span>
        </span>
      )}

      <button
        onClick={handleExport}
        disabled={disabled || exporting}
        className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {exporting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        <span>Export Static Site (.zip)</span>
      </button>
    </div>
  );
}

