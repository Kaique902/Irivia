'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createChallengeUrl, copyToClipboard } from '@/lib/share';
import { Share2, Check, Copy, Swords } from 'lucide-react';

interface ChallengeFriendProps {
  storyId: string;
  storyTitle: string;
}

export default function ChallengeFriend({ storyId, storyTitle }: ChallengeFriendProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [challengeType, setChallengeType] = useState('write');

  const handleCopy = async () => {
    const url = createChallengeUrl(storyId, challengeType);
    await copyToClipboard(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const url = createChallengeUrl(storyId, challengeType);
    if (navigator.share) {
      await navigator.share({
        title: `Desafio: ${storyTitle}`,
        text: `Aceita o desafio de continuar "${storyTitle}" no Irivia?`,
        url,
      });
    } else {
      await handleCopy();
    }
  };

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-ghost flex items-center gap-1.5 text-xs"
      >
        <Swords className="w-3.5 h-3.5" /> Desafiar Alguém
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-3 p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3"
          >
            <p className="text-xs text-zinc-400">Desafie um amigo a continuar esta história:</p>

            <div className="flex gap-2">
              {[
                { type: 'write', label: 'Escrever' },
                { type: 'branch', label: 'Criar Ramo' },
                { type: 'vote', label: 'Votar' },
              ].map(t => (
                <button
                  key={t.type}
                  onClick={() => setChallengeType(t.type)}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                    challengeType === t.type
                      ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleShare}
                className="btn btn-primary flex-1 flex items-center justify-center gap-1.5 text-xs py-2"
              >
                <Share2 className="w-3.5 h-3.5" /> Compartilhar
              </button>
              <button
                onClick={handleCopy}
                className="btn bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center gap-1.5 text-xs py-2"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copiado!' : 'Copiar Link'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
