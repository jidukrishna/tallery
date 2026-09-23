import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { APP_NAME } from './constants/app.js';
import Dashboard from './pages/Dashboard/Dashboard.jsx';
import AlbumImageSelect from './pages/AlbumImageSelect/AlbumImageSelect.jsx';
import Workspace from './pages/Workspace/Workspace.jsx';
import { Camera } from 'lucide-react';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-stone-100 text-stone-900 selection:bg-amber-200">
        <header className="bg-white border-b border-stone-200 px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <Link to="/" className="flex items-center gap-2.5 font-bold text-lg tracking-tight text-stone-800 hover:text-stone-950 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <Camera className="w-5 h-5" />
            </div>
            <span>{APP_NAME}</span>
          </Link>
          <div className="text-xs text-stone-400 font-mono">
            Local Trip Gallery
          </div>
        </header>
        <main className="flex-1 flex flex-col">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/album/:id" element={<AlbumImageSelect />} />
            <Route path="/workspace/:id" element={<Workspace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

