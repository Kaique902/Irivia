'use client';

import { memo } from 'react';
import Link from 'next/link';
import { useStore } from '@/store/store';
import NotificationBell from '@/components/ui/NotificationBell';
import { BookOpen, Plus, User, Trophy } from 'lucide-react';

function Header() {
  const user = useStore(s => s.user);

  return (
    <header className="sticky top-0 z-50 bg-[#09090b]/80 backdrop-blur-xl border-b border-[#27272a]">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-orange-500" />
          <span className="font-bold text-lg">Irivia</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/create" className="btn btn-primary flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Nova História
          </Link>
          {user ? (
            <>
              <Link href="/ranking" className="p-2 rounded-xl hover:bg-zinc-800 transition-all" aria-label="Ranking">
                <Trophy className="w-5 h-5 text-zinc-400" />
              </Link>
              <NotificationBell />
              <Link href="/profile" className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-lg">
                {user.avatar}
              </Link>
            </>
          ) : (
            <Link href="/auth" className="btn btn-ghost flex items-center gap-1.5">
              <User className="w-4 h-4" /> Entrar
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

export default memo(Header);
