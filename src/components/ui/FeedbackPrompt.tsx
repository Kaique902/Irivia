'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/store';
import { MessageSquareText, Send, X, ThumbsUp } from 'lucide-react';

const FEEDBACK_COOLDOWN = 7 * 24 * 60 * 60 * 1000; // 7 days
const MIN_VISITS = 3;

export default function FeedbackPrompt() {
  const { user, pageVisits, feedbackLastShown, feedbackTexts, submitFeedback, dismissFeedback } = useStore();
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (feedbackTexts.length >= 3) return;
    if (pageVisits < MIN_VISITS && useStore.getState().votedNodes.length === 0) return;
    if (feedbackLastShown && Date.now() - feedbackLastShown < FEEDBACK_COOLDOWN) return;
    const timer = setTimeout(() => setShowBanner(true), 5000);
    return () => clearTimeout(timer);
  }, [user, pageVisits, feedbackLastShown, feedbackTexts.length]);

  const handleDismiss = () => {
    setShowBanner(false);
    dismissFeedback();
  };

  const handleOpenModal = () => {
    setShowModal(true);
    setShowBanner(false);
  };

  const handleSubmit = () => {
    if (!feedbackText.trim()) return;
    submitFeedback(feedbackText);
    setFeedbackText('');
    setSubmitted(true);
    setShowModal(false);
    dismissFeedback();
    setTimeout(() => setSubmitted(false), 3000);
  };

  if (!user || submitted) return null;

  return (
    <>
      {/* Bottom banner */}
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 80 }}
            className="fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto"
          >
            <div className="card p-4 border-zinc-700 shadow-xl">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                  <MessageSquareText className="w-4 h-4 text-orange-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Como está sendo a experiência?</p>
                  <p className="text-xs text-zinc-400">Sua opinião ajuda a melhorar o Irivia.</p>
                </div>
                <button onClick={handleDismiss} className="text-zinc-500 hover:text-white p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <button onClick={handleOpenModal} className="btn bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 w-full mt-3 text-sm flex items-center justify-center gap-1.5">
                <ThumbsUp className="w-3.5 h-3.5" /> Dar Feedback
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feedback modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="w-full max-w-sm card p-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold">Feedback</h3>
                <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-zinc-400 mb-3">
                Encontrou algum bug? Tem sugestões? Conte pra gente.
              </p>
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                className="input resize-none h-24 mb-3"
                placeholder="Digite seu feedback..."
                autoFocus
              />
              <div className="flex gap-2">
                <button onClick={() => setShowModal(false)} className="btn btn-ghost flex-1">Cancelar</button>
                <button onClick={handleSubmit} disabled={!feedbackText.trim()}
                  className="btn btn-primary flex-1 flex items-center justify-center gap-1.5 disabled:opacity-40">
                  <Send className="w-3.5 h-3.5" /> Enviar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submitted toast */}
      <AnimatePresence>
        {submitted && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto"
          >
            <div className="px-4 py-3 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400 text-sm flex items-center gap-2">
              <ThumbsUp className="w-4 h-4" /> Obrigado pelo feedback!
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
