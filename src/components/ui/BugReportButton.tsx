'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/store';
import { Bug, Send, X, ThumbsUp } from 'lucide-react';

export default function BugReportButton() {
  const { submitFeedback } = useStore();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = () => {
    if (!text.trim()) return;
    submitFeedback(`[BUG] ${text}`);
    setText('');
    setOpen(false);
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  };

  return (
    <>
      {/* FAB */}
      <button onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-50 w-11 h-11 rounded-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 flex items-center justify-center shadow-lg transition-all hover:scale-105 active:scale-95"
        title="Reportar bug">
        <Bug className="w-4 h-4 text-zinc-400" />
      </button>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
            onClick={() => setOpen(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="w-full max-w-sm card p-5" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-red-500/20 flex items-center justify-center">
                    <Bug className="w-4 h-4 text-red-400" />
                  </div>
                  <h3 className="font-bold">Reportar Bug</h3>
                </div>
                <button onClick={() => setOpen(false)} className="text-zinc-500 hover:text-white"><X className="w-4 h-4" /></button>
              </div>
              <p className="text-xs text-zinc-400 mb-3">Descreva o problema que você encontrou. Inclua detalhes como onde aconteceu e o que estava fazendo.</p>
              <textarea value={text} onChange={e => setText(e.target.value)}
                className="input resize-none h-28 mb-3 text-sm" placeholder="Descreva o bug..." autoFocus />
              <button onClick={handleSubmit} disabled={!text.trim()}
                className="btn bg-red-600 hover:bg-red-500 text-white w-full flex items-center justify-center gap-1.5 disabled:opacity-40">
                <Send className="w-3.5 h-3.5" /> Enviar relato
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {sent && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
            <div className="px-5 py-3 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400 text-sm flex items-center gap-2 shadow-lg">
              <ThumbsUp className="w-4 h-4" /> Bug reportado! Obrigado.
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}