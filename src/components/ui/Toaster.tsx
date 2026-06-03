'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/store/toast';
import { useRouter } from 'next/navigation';

export default function Toaster() {
  const { toasts, dismiss } = useToast();
  const router = useRouter();

  const handleClick = (message: string) => {
    if (message.includes('logado') || message.includes('login')) {
      router.push('/auth');
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            onClick={() => {
              dismiss(t.id);
              handleClick(t.message);
            }}
            className={`pointer-events-auto cursor-pointer px-5 py-3 rounded-xl shadow-lg text-sm font-medium border ${
              t.type === 'error'
                ? 'bg-red-900/90 border-red-700/50 text-red-200'
                : 'bg-zinc-900/90 border-zinc-700/50 text-zinc-200'
            }`}
          >
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
