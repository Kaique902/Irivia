'use client';

import Link from 'next/link';
import { BookOpen, WifiOff } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center mx-auto mb-6">
          <WifiOff className="w-8 h-8 text-zinc-400" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Sem Conexão</h1>
        <p className="text-zinc-400 text-sm mb-6">
          Você está offline. As histórias salvas continuam disponíveis.
        </p>
        <Link href="/" className="btn btn-primary inline-flex items-center gap-2">
          <BookOpen className="w-4 h-4" /> Tentar Novamente
        </Link>
      </div>
    </div>
  );
}
