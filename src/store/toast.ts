import { create } from 'zustand';

type Toast = { id: string; message: string; type?: 'info' | 'error' };

type ToastStore = {
  toasts: Toast[];
  show: (message: string, type?: Toast['type']) => void;
  dismiss: (id: string) => void;
};

export const useToast = create<ToastStore>((set) => ({
  toasts: [],
  show: (message, type = 'info') => {
    const id = `t${Date.now()}`;
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter(t => t.id !== id) }));
    }, 3500);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter(t => t.id !== id) })),
}));
