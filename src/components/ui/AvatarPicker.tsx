'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AVATARS, useStore } from '@/store/store';
import { X, Upload, Check } from 'lucide-react';

interface AvatarPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (avatar: string) => void;
  currentAvatar?: string;
}

export default function AvatarPicker({ open, onClose, onSelect, currentAvatar }: AvatarPickerProps) {
  const [tab, setTab] = useState<'avatars' | 'upload'>('avatars');
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert('Máximo 2MB'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      setUploadedUrl(url);
    };
    reader.readAsDataURL(file);
  };

  const handleUseUploaded = () => {
    if (uploadedUrl) onSelect(uploadedUrl);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
          onClick={onClose}>
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
            className="w-full max-w-sm card p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">Escolher Avatar</h3>
              <button onClick={onClose} className="text-zinc-500 hover:text-white"><X className="w-4 h-4" /></button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-4">
              <button onClick={() => setTab('avatars')}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${tab === 'avatars' ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-400'}`}>
                Avatares
              </button>
              <button onClick={() => setTab('upload')}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${tab === 'upload' ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-400'}`}>
                <Upload className="w-3 h-3 inline mr-1" />Enviar
              </button>
            </div>

            {tab === 'avatars' ? (
              <div className="grid grid-cols-5 gap-2 max-h-60 overflow-y-auto">
                {AVATARS.map((avatar) => (
                  <button key={avatar} onClick={() => onSelect(avatar)}
                    className={`w-full aspect-square rounded-xl flex items-center justify-center text-2xl transition-all hover:bg-zinc-800 ${
                      currentAvatar === avatar ? 'bg-orange-500/20 border-2 border-orange-500' : 'bg-zinc-900 border-2 border-transparent'
                    }`}>
                    {currentAvatar === avatar && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </span>
                    )}
                    {avatar}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center">
                <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
                {uploadedUrl ? (
                  <div className="space-y-3">
                    <img src={uploadedUrl} alt="Preview" className="w-24 h-24 rounded-2xl mx-auto object-cover" />
                    <div className="flex gap-2">
                      <button onClick={() => { setUploadedUrl(null); if (fileRef.current) fileRef.current.value = ''; }}
                        className="btn btn-ghost flex-1 text-xs">Remover</button>
                      <button onClick={handleUseUploaded} className="btn btn-primary flex-1 text-xs">Usar esta foto</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => fileRef.current?.click()}
                    className="w-full py-8 rounded-xl border-2 border-dashed border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-white transition-all">
                    <Upload className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">Clique para enviar uma foto</p>
                    <p className="text-xs text-zinc-600 mt-1">Máximo 2MB</p>
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}