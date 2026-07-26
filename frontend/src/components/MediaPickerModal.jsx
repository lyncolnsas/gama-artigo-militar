import React, { useState, useEffect } from 'react';
import MediaViewer from './MediaViewer';
import { X, Upload, Check, Trash2, HardDriveUpload, Clipboard, DownloadCloud, Sparkles } from 'lucide-react';

export default function MediaPickerModal({ isOpen = true, onClose, onSelect, mediaLibrary, onUpload, onDelete, uploading }) {
  const [subTab, setSubTab] = useState('unused'); // Default to unused for selection
  const [isDragging, setIsDragging] = useState(false);
  const [pasteNotification, setPasteNotification] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e) => {
      const clipboardData = e.clipboardData || window.clipboardData;
      if (!clipboardData) return;

      const items = clipboardData.items;
      let foundImage = null;

      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            foundImage = items[i].getAsFile();
            break;
          }
        }
      }

      if (!foundImage && clipboardData.files && clipboardData.files.length > 0) {
        if (clipboardData.files[0].type.indexOf('image') !== -1) {
          foundImage = clipboardData.files[0];
        }
      }

      if (foundImage) {
        e.preventDefault();
        setPasteNotification('📋 Imagem capturada da área de transferência! Enviando...');
        onUpload(foundImage);
        setTimeout(() => setPasteNotification(null), 3500);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen, onUpload]);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.indexOf('image') !== -1 || file.type.indexOf('video') !== -1) {
        setPasteNotification('📥 Arquivo arrastado detectado! Enviando...');
        onUpload(file);
        setTimeout(() => setPasteNotification(null), 3500);
      }
    }
  };

  if (!isOpen) return null;

  const unusedList = mediaLibrary?.unused || [];
  const inUseList = mediaLibrary?.inUse || [];
  const unusedCount = mediaLibrary?.unusedCount ?? unusedList.length;
  const inUseCount = mediaLibrary?.inUseCount ?? inUseList.length;

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
      onDragOver={handleDragOver}
    >
      <div 
        className={`bg-[#171a21] border w-full max-w-5xl rounded-lg shadow-2xl flex flex-col max-h-[90vh] relative transition-all ${
          isDragging ? 'border-tactical-gold ring-4 ring-tactical-gold/30' : 'border-gray-700'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >

        {/* Overlay de Drag & Drop */}
        {isDragging && (
          <div className="absolute inset-0 z-50 bg-black/90 rounded-lg flex flex-col items-center justify-center border-4 border-dashed border-tactical-gold text-tactical-gold p-6 text-center space-y-3">
            <DownloadCloud className="w-16 h-16 animate-bounce" />
            <h3 className="font-tactical text-3xl font-bold">SOLTE A IMAGEM AQUI</h3>
            <p className="text-white text-xs">O arquivo será enviado e cadastrado automaticamente no sistema.</p>
          </div>
        )}
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div>
            <h2 className="font-tactical text-2xl font-bold text-white flex items-center gap-2">
              <HardDriveUpload className="w-5 h-5 text-tactical-gold" /> 
              SELECIONAR OU ENVIAR MÍDIA
            </h2>
            <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
              <span>Escolha um arquivo do sistema ou faça upload.</span>
              <span className="text-tactical-gold font-bold flex items-center gap-1 bg-tactical-gold/10 px-2 py-0.5 rounded border border-tactical-gold/30">
                <Clipboard className="w-3 h-3" /> Pressione CTRL+V para Colar Imagem Copiada
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-800 hover:bg-red-900 text-gray-400 hover:text-red-200 rounded transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notificação de Paste / Drag */}
        {pasteNotification && (
          <div className="bg-emerald-950 border-b border-emerald-500 text-emerald-200 px-4 py-2 text-xs font-bold flex items-center gap-2">
            <Sparkles className="w-4 h-4 animate-spin text-emerald-400" />
            <span>{pasteNotification}</span>
          </div>
        )}

        {/* Action Bar & Tabs */}
        <div className="p-4 flex flex-col sm:flex-row justify-between items-center gap-4 bg-[#0f1115] border-b border-gray-800">
          <div className="flex gap-2">
            <button
              onClick={() => setSubTab('unused')}
              className={`px-4 py-2 rounded text-xs font-bold font-tactical tracking-wider flex items-center gap-2 transition-all ${
                subTab === 'unused'
                  ? 'bg-amber-500 text-black shadow font-extrabold'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              <span>🟡 DISPONÍVEIS / SEM USO</span>
              <span className="bg-black/40 px-2 py-0.5 rounded text-[10px]">{unusedCount}</span>
            </button>
            <button
              onClick={() => setSubTab('inUse')}
              className={`px-4 py-2 rounded text-xs font-bold font-tactical tracking-wider flex items-center gap-2 transition-all ${
                subTab === 'inUse'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              <span>🟢 ARQUIVOS EM USO</span>
              <span className="bg-black/40 px-2 py-0.5 rounded text-[10px]">{inUseCount}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <label className="bg-tactical-gold hover:bg-tactical-goldHover text-black font-tactical text-lg font-bold px-6 py-2 rounded shadow cursor-pointer flex items-center gap-2 transition-all">
              <Upload className="w-4 h-4" />
              <span>{uploading ? 'ENVIANDO...' : 'UPLOAD DE NOVA MÍDIA'}</span>
              <input
                type="file"
                accept="image/*,video/mp4"
                className="hidden"
                disabled={uploading}
                onChange={(e) => onUpload(e)}
              />
            </label>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4 overflow-y-auto flex-1 bg-[#171a21]">
          {subTab === 'unused' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {unusedList.length === 0 ? (
                <div className="col-span-full py-12 text-center text-gray-500 text-xs">
                  Nenhum arquivo sem uso disponível. Pressione CTRL+V ou arraste uma imagem para cá.
                </div>
              ) : (
                unusedList.map((item, idx) => (
                  <div key={idx} className="bg-[#0f1115] border border-gray-800 rounded overflow-hidden flex flex-col">
                    <div className="aspect-square bg-black relative group cursor-pointer" onClick={() => onSelect(item.url, item.mediaType)}>
                      <MediaViewer mediaUrl={item.url} mediaType={item.mediaType} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 transition-opacity">
                        <div className="bg-tactical-gold text-black px-3 py-1.5 rounded font-bold text-xs flex items-center gap-1 shadow-lg">
                          <Check className="w-4 h-4" /> SELECIONAR
                        </div>
                      </div>
                    </div>
                    <div className="p-2 space-y-2">
                      <div className="font-mono text-gray-400 text-[9px] truncate" title={item.filename}>{item.filename}</div>
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] text-gray-500">{(item.sizeBytes / 1024).toFixed(0)} KB</span>
                        {onDelete && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); onDelete(item.filename); }}
                            className="text-gray-600 hover:text-red-400 p-1"
                            title="Excluir arquivo permanentemente"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {subTab === 'inUse' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {inUseList.length === 0 ? (
                <div className="col-span-full py-12 text-center text-gray-500 text-xs">
                  Nenhuma mídia em uso.
                </div>
              ) : (
                inUseList.map((item, idx) => (
                  <div key={idx} className="bg-[#0f1115] border border-gray-800 rounded overflow-hidden flex flex-col">
                    <div className="aspect-square bg-black relative group cursor-pointer" onClick={() => onSelect(item.url, item.mediaType)}>
                      <MediaViewer mediaUrl={item.url} mediaType={item.mediaType} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 transition-opacity">
                        <div className="bg-emerald-500 text-white px-3 py-1.5 rounded font-bold text-xs flex items-center gap-1 shadow-lg">
                          <Check className="w-4 h-4" /> REUTILIZAR
                        </div>
                      </div>
                    </div>
                    <div className="p-2 space-y-1">
                      <div className="font-mono text-gray-400 text-[9px] truncate" title={item.filename}>{item.filename}</div>
                      <div className="text-[9px] text-gray-500 space-y-0.5 max-h-16 overflow-y-auto">
                        {item.usageList?.map((u, i) => (
                          <span key={i} className="block text-emerald-500 font-bold leading-tight truncate" title={u}>• {u}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
