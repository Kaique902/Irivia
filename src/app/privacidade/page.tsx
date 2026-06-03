import Link from 'next/link';

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 bg-[#09090b]/80 backdrop-blur-xl border-b border-[#27272a]">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="text-orange-400 hover:text-orange-300 text-sm">Irivia</Link>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-12 text-zinc-300 text-sm leading-relaxed space-y-6">
        <h1 className="text-2xl font-bold text-white mb-6">Política de Privacidade</h1>
        <p className="text-zinc-500 text-xs">Última atualização: junho de 2026</p>

        <section>
          <h2 className="text-lg font-semibold text-white mt-8 mb-3">1. Dados Coletados</h2>
          <p>Coletamos as seguintes informações quando você cria uma conta e utiliza o Irivia:</p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-zinc-400">
            <li>Nome de usuário (nickname)</li>
            <li>Padrão visual escolhido (sequência de emojis/números)</li>
            <li>Avatar e configurações de perfil</li>
            <li>Histórias, nós e comentários publicados</li>
            <li>Votos (Quente/Frio) em nós de histórias</li>
            <li>XP, nível, sequência e conquistas</li>
            <li>Dados de uso (páginas visitadas, tempo de sessão)</li>
            <li>Informações de referral (origem do tráfego)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mt-8 mb-3">2. Como Usamos Seus Dados</h2>
          <p>Seus dados são utilizados para:</p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-zinc-400">
            <li>Operar e manter a plataforma</li>
            <li>Personalizar sua experiência (feed &ldquo;Pra Você&rdquo;)</li>
            <li>Calcular rankings, pontuações e conquistas</li>
            <li>Moderar conteúdo e prevenir abusos</li>
            <li>Melhorar a plataforma com base em análises de uso</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mt-8 mb-3">3. Armazenamento e Segurança</h2>
          <p>Seus dados são armazenados no Supabase, um serviço de banco de dados com criptografia em trânsito (TLS) e em repouso. Sua palavra mágica é transformada via SHA-256 antes de ser armazenada — nunca mantemos sua palavra original.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mt-8 mb-3">4. Compartilhamento com Terceiros</h2>
          <p>Não vendemos seus dados pessoais. Utilizamos os seguintes serviços de terceiros para operar a plataforma:</p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-zinc-400">
            <li><strong>Supabase</strong> — banco de dados e autenticação</li>
            <li><strong>Vercel</strong> — hospedagem e infraestrutura</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mt-8 mb-3">5. Cookies</h2>
          <p>Utilizamos cookies essenciais para o funcionamento da plataforma (sessão de autenticação). Não utilizamos cookies de rastreamento ou publicidade. Você pode gerenciar cookies nas configurações do seu navegador.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mt-8 mb-3">6. Seus Direitos</h2>
          <p>Você pode, a qualquer momento:</p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-zinc-400">
            <li>Solicitar a exclusão da sua conta e dados</li>
            <li>Solicitar uma cópia dos seus dados</li>
            <li>Corrigir informações do seu perfil</li>
          </ul>
          <p className="mt-2">Para exercer seus direitos, utilize o formulário de feedback na plataforma.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mt-8 mb-3">7. Retenção de Dados</h2>
          <p>Mantemos seus dados enquanto sua conta estiver ativa. Após exclusão da conta, os dados são removidos em até 30 dias, exceto quando necessário para cumprir obrigações legais.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mt-8 mb-3">8. Alterações</h2>
          <p>Esta política pode ser atualizada periodicamente. Notificaremos sobre mudanças significativas através da plataforma.</p>
        </section>
      </main>
    </div>
  );
}
