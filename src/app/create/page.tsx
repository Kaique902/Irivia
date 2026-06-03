'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/store';
import { Story } from '@/types';
import { ArrowLeft, BookOpen } from 'lucide-react';

const GENRES = ['thriller', 'ficção científica', 'fantasia', 'romance', 'terror', 'mistério', 'drama', 'comédia'];

export default function CreatePage() {
  const router = useRouter();
  const { addStory, user } = useStore();
  const [title, setTitle] = useState('');
  const [seed, setSeed] = useState('');
  const [genre, setGenre] = useState('thriller');

  useEffect(() => {
    if (!user) {
      router.push('/auth');
    }
  }, [user, router]);

  if (!user) return null;

  const handleCreate = () => {
    if (!title.trim() || !seed.trim()) return;
    const story: Story = {
      id: `s${Date.now()}`,
      title,
      seed,
      genre,
      totalBranches: 0,
      participants: 1,
      authorId: user?.id || '',
      createdAt: new Date().toISOString(),
      nodes: [{
        id: `n${Date.now()}`,
        content: seed,
        author: 'Você',
        emotion: 'curiosidade',
        parentId: null,
        votes: 1,
        hotVotes: 1,
        coldVotes: 0,
        trending: false,
        createdAt: new Date().toISOString(),
      }],
    };
    addStory(story);
    router.push(`/${story.id}`);
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 bg-[#09090b]/80 backdrop-blur-xl border-b border-[#27272a]">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center">
          <button onClick={() => router.push('/')} className="flex items-center gap-2 text-zinc-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" /> Voltar
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Nova História</h1>
            <p className="text-sm text-zinc-500">Plante a semente de uma nova narrativa</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-1.5">Título</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className="input" placeholder="Ex: O Mistério da Floresta" />
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1.5">A Semente (primeira frase)</label>
            <textarea value={seed} onChange={e => setSeed(e.target.value)} className="input resize-none h-24" placeholder="Escreva a frase que plantará esta história..." />
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-2">Gênero</label>
            <div className="flex flex-wrap gap-2">
              {GENRES.map(g => (
                <button key={g} onClick={() => setGenre(g)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-all ${genre === g ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>
                  {g}
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleCreate} disabled={!title.trim() || !seed.trim()}
            className="btn btn-primary w-full py-3 text-base disabled:opacity-40">
            Plantar Semente
          </button>
        </div>
      </main>
    </div>
  );
}
