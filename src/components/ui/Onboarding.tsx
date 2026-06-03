'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ArrowRight, ArrowLeft, Sparkles, Flame, GitBranch, Rocket } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

const steps = [
  {
    icon: BookOpen,
    title: 'Bem-vindo ao Irivia',
    subtitle: 'Uma plataforma onde histórias ganham vida',
    description: 'Cada frase que você escreve cria um novo caminho. Outros usuários podem continuar sua história ou criar ramificações alternativas.',
    color: 'from-orange-500 to-orange-600',
  },
  {
    icon: Flame,
    title: 'Vote nos Melhores',
    subtitle: 'Hot ou Cold - você decide',
    description: 'Ao ler uma história, vote se a frase é boa (Hot) ou ruim (Cold). As melhores frases se tornam o caminho principal da história.',
    color: 'from-red-500 to-orange-500',
  },
  {
    icon: GitBranch,
    title: 'Crie Ramificações',
    subtitle: 'Sua imaginação é o limite',
    description: 'A cada ponto da história, você pode adicionar sua própria continuação. Crie desvios, surpreenda os leitores, torne-se lendário.',
    color: 'from-cyan-500 to-blue-500',
  },
  {
    icon: Rocket,
    title: 'Suba de Nível',
    subtitle: 'Ganhe XP e conquiste badges',
    description: 'Cada voto, cada contribuição, cada dia seguido te aproxima do próximo nível. Mostre que você é um mestre da narrativa.',
    color: 'from-purple-500 to-pink-500',
  },
];

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const next = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const prev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const step = steps[currentStep];
  const Icon = step.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-[#09090b] flex items-center justify-center"
    >
      <div className="w-full max-w-md px-4">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentStep ? 'w-8 bg-orange-500' :
                i < currentStep ? 'w-4 bg-orange-500/50' :
                'w-4 bg-zinc-800'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            {/* Icon */}
            <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mx-auto mb-6 shadow-lg`}>
              <Icon className="w-10 h-10 text-white" />
            </div>

            {/* Text */}
            <h2 className="text-2xl font-extrabold text-white mb-2">{step.title}</h2>
            <p className="text-orange-400 font-medium mb-3">{step.subtitle}</p>
            <p className="text-zinc-400 text-sm leading-relaxed max-w-sm mx-auto">{step.description}</p>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-10">
          <button
            onClick={prev}
            disabled={currentStep === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all ${
              currentStep === 0 ? 'text-zinc-700 cursor-not-allowed' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>

          <button
            onClick={next}
            className="flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 rounded-xl text-white font-bold transition-all"
          >
            {currentStep === steps.length - 1 ? (
              <>
                <Sparkles className="w-4 h-4" /> Começar
              </>
            ) : (
              <>
                Próximo <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Skip */}
        <button
          onClick={onComplete}
          className="w-full mt-4 text-sm text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          Pular tutorial
        </button>
      </div>
    </motion.div>
  );
}
