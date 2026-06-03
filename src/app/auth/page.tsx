'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore, EMOJIS } from '@/store/store';
import { BookOpen, ArrowRight, Sparkles, Check, AlertCircle, Eye, EyeOff, Swords, PenLine, Vote, GitBranch } from 'lucide-react';

type Step = 'word' | 'pattern' | 'confirm';

export default function AuthPage() {
  const router = useRouter();
  const { register, login, user } = useStore();
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [step, setStep] = useState<Step>('word');
  const [magicWord, setMagicWord] = useState('');
  const [username, setUsername] = useState('');
  const [loginUsername, setLoginUsername] = useState('');
  const [pattern, setPattern] = useState<number[]>([]);
  const [showAsNumbers, setShowAsNumbers] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [challengeType, setChallengeType] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect');
    if (redirect) {
      const decoded = decodeURIComponent(redirect);
      const match = decoded.match(/challenge=(write|branch|vote)/);
      if (match) setChallengeType(match[1]);
    }
  }, []);

  useEffect(() => {
    if (user) {
      const params = new URLSearchParams(window.location.search);
      router.push(params.get('redirect') || '/');
    }
  }, [user, router]);

  if (!mounted) return null;
  if (user) return null;

  const handleWordSubmit = () => {
    if (!magicWord.trim()) { setError('Escolha sua palavra mágica'); return; }
    if (magicWord.length < 9) { setError('Mínimo 9 caracteres (com seu padrão = 12+)'); return; }
    setError('');
    setStep('pattern');
  };

  const handlePatternSelect = (index: number) => {
    if (pattern.includes(index)) {
      setPattern(pattern.filter(i => i !== index));
    } else if (pattern.length < 4) {
      setPattern([...pattern, index]);
    }
  };

  const handlePatternConfirm = () => {
    if (pattern.length < 3) { setError('Selecione pelo menos 3 itens'); return; }
    setError('');
    if (mode === 'register') setStep('confirm');
    else handleSubmit();
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    await new Promise(r => setTimeout(r, 800));
    let success = false;
    if (mode === 'register') {
      success = await register(username, magicWord, pattern);
      if (!success) { setError('Esta combinação já existe ou é inválida.'); setLoading(false); return; }
    } else {
      success = await login(loginUsername, magicWord, pattern);
      if (!success) { setError('Nickname, palavra ou padrão incorreto'); setLoading(false); return; }
    }
    const params = new URLSearchParams(window.location.search);
    router.push(params.get('redirect') || '/');
  };

  const reset = () => { setStep('word'); setMagicWord(''); setUsername(''); setLoginUsername(''); setPattern([]); setError(''); };

  const displayItem = (index: number) => showAsNumbers ? index : EMOJIS[index];

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold mb-2">Irivia</h1>
          <p className="text-zinc-400">Onde a comunidade decide o próximo capítulo</p>
        </motion.div>

        {/* Challenge context */}
        <AnimatePresence>
          {challengeType && (
            <motion.div initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="mb-5 p-4 rounded-xl bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-cyan-500/10 border border-orange-500/20 overflow-hidden relative">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(251,146,60,0.08),transparent_60%)]" />
              <div className="relative flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  {challengeType === 'write' ? <PenLine className="w-5 h-5 text-orange-400" /> :
                   challengeType === 'branch' ? <GitBranch className="w-5 h-5 text-cyan-400" /> :
                   <Vote className="w-5 h-5 text-orange-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Swords className="w-4 h-4 text-orange-400 flex-shrink-0" />
                    <p className="text-sm font-bold text-white">Desafio recebido!</p>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {challengeType === 'write' && 'Alguém te desafiou a escrever o próximo capítulo. Crie sua conta agora e mostre seu talento — a história espera por você!'}
                    {challengeType === 'branch' && 'Um novo caminho precisa ser criado. Alguém te desafiou a abrir um ramo inédito nesta história. Entre e deixe sua marca!'}
                    {challengeType === 'vote' && 'Os votos decidem o rumo da história. Alguém te desafiou a votar nos melhores caminhos. Sua escolha importa — entre agora!'}
                  </p>
                  <motion.div className="flex gap-1.5 mt-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                    <span className="px-2 py-0.5 rounded-md bg-orange-500/15 text-[10px] font-medium text-orange-400 border border-orange-500/10">
                      +{challengeType === 'vote' ? '5' : '15'} XP
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-[10px] font-medium text-zinc-400">
                      Após entrar
                    </span>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mode toggle */}
        <div className="flex gap-2 mb-6">
          <button onClick={() => { setMode('register'); reset(); }}
            className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition-all ${mode === 'register' ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>
            Criar Conta
          </button>
          <button onClick={() => { setMode('login'); reset(); }}
            className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition-all ${mode === 'login' ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>
            Entrar
          </button>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-2 mb-6">
          {['word', 'pattern', 'confirm'].map((s, i) => (
            <div key={s} className="flex-1 flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step === s ? 'bg-orange-500 text-white' : ['word', 'pattern', 'confirm'].indexOf(step) > i ? 'bg-green-500 text-white' : 'bg-zinc-800 text-zinc-500'
              }`}>
                {['word', 'pattern', 'confirm'].indexOf(step) > i ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              {i < 2 && <div className="flex-1 h-0.5 bg-zinc-800 rounded-full" />}
            </div>
          ))}
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" /> {error}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {/* Step 1: Word */}
          {step === 'word' && (
            <motion.div key="word" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="card p-6">
                <h2 className="text-lg font-bold mb-1">
                  {mode === 'register' ? 'Crie sua Conta' : 'Entre na sua Conta'}
                </h2>
                <p className="text-zinc-500 text-sm mb-4">
                  {mode === 'register' ? 'Escolha sua chave secreta.' : 'Digite sua chave secreta.'}
                </p>

                <div className="mb-4">
                  <label className="block text-sm text-zinc-400 mb-1.5">Nickname</label>
                  <input 
                    value={mode === 'register' ? username : loginUsername} 
                    onChange={e => mode === 'register' ? setUsername(e.target.value) : setLoginUsername(e.target.value)}
                    className="input" placeholder="Seu nick" />
                </div>

                <div className="mb-4">
                  <label className="block text-sm text-zinc-400 mb-1.5">Palavra Mágica</label>
                  <input value={magicWord} onChange={e => { setMagicWord(e.target.value); setError(''); }}
                    className="input text-center text-lg tracking-wider font-mono" placeholder="Sua palavra secreta" type="password" />
                </div>

                <button onClick={handleWordSubmit} className="btn btn-primary w-full flex items-center justify-center gap-2">
                  Próximo <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Pattern */}
          {step === 'pattern' && (
            <motion.div key="pattern" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="card p-6">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-lg font-bold">Crie seu Padrão</h2>
                  <button onClick={() => setShowAsNumbers(!showAsNumbers)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white text-xs transition-all">
                    {showAsNumbers ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {showAsNumbers ? 'Emojis' : 'Números'}
                  </button>
                </div>
                <p className="text-zinc-500 text-sm mb-4">Selecione 3 ou 4 itens na ordem que quiser.</p>

                {/* Grid */}
                <div className="grid grid-cols-5 gap-2 mb-4">
                  {EMOJIS.map((_, i) => {
                    const isSelected = pattern.includes(i);
                    const position = pattern.indexOf(i);
                    return (
                      <motion.button key={i} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
                        onClick={() => handlePatternSelect(i)}
                        className={`relative w-full aspect-square rounded-xl flex items-center justify-center transition-all font-bold ${
                          showAsNumbers ? 'text-lg font-mono' : 'text-2xl'
                        } ${
                          isSelected ? 'bg-orange-500/20 border-2 border-orange-500 text-orange-400' : 'bg-zinc-800 border-2 border-transparent hover:border-zinc-600 text-zinc-300'
                        }`}>
                        {displayItem(i)}
                        {isSelected && (
                          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center">
                            {position + 1}
                          </span>
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                {/* Preview */}
                <div className="flex items-center justify-between mb-4 p-3 bg-zinc-900 rounded-xl">
                  <span className="text-xs text-zinc-500">Seu padrão:</span>
                  <div className="flex gap-1.5">
                    {pattern.length === 0 ? (
                      <span className="text-xs text-zinc-600">Nenhum selecionado</span>
                    ) : (
                      pattern.map((i, idx) => (
                        <span key={idx} className={`w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center font-bold ${
                          showAsNumbers ? 'text-sm font-mono text-cyan-400' : 'text-xl'
                        }`}>
                          {displayItem(i)}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                <button onClick={handlePatternConfirm} className="btn btn-primary w-full flex items-center justify-center gap-2">
                  {mode === 'register' ? 'Próximo' : 'Entrar'} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Confirm */}
          {step === 'confirm' && (
            <motion.div key="confirm" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="card p-6">
                <h2 className="text-lg font-bold mb-1">Confirme sua Chave</h2>
                <p className="text-zinc-500 text-sm mb-4">Anote ou memorize. Você precisará dela para entrar.</p>
                <div className="bg-zinc-900 rounded-xl p-4 mb-4">
                  <div className="text-center mb-3">
                    <p className="text-xs text-zinc-500 mb-1">Nome</p>
                    <p className="font-bold text-lg">{username}</p>
                  </div>
                  <div className="text-center mb-3">
                    <p className="text-xs text-zinc-500 mb-1">Palavra</p>
                    <p className="font-mono text-orange-400">{'•'.repeat(magicWord.length)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-zinc-500 mb-2">Padrão</p>
                    <div className="flex justify-center gap-2">
                      {pattern.map((i, idx) => (
                        <span key={idx} className="text-3xl">{EMOJIS[i]}</span>
                      ))}
                    </div>
                    <p className="text-xs text-zinc-500 mt-1 font-mono">
                      Números: {pattern.join(' ')}
                    </p>
                  </div>
                </div>
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 mb-4">
                  <p className="text-xs text-orange-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Guarde bem! Sem esta chave, você não acessa sua conta.
                  </p>
                </div>
                <button onClick={handleSubmit} disabled={loading}
                  className="btn btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Criando...
                    </span>
                  ) : <><Sparkles className="w-4 h-4" /> Criar Minha Conta</>}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center text-xs text-zinc-600 mt-6">
          {mode === 'register' ? 'Já tem conta?' : 'Não tem conta?'}{' '}
          <button onClick={() => { setMode(mode === 'register' ? 'login' : 'register'); reset(); }}
            className="text-orange-400 hover:text-orange-300">
            {mode === 'register' ? 'Entrar' : 'Criar conta'}
          </button>
        </p>
        <div className="flex justify-center gap-4 mt-4 text-xs text-zinc-600">
          <Link href="/termos" className="hover:text-zinc-400">Termos</Link>
          <Link href="/privacidade" className="hover:text-zinc-400">Privacidade</Link>
        </div>
      </div>
    </div>
  );
}
