import Link from 'next/link';

export default function TermosPage() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 bg-[#09090b]/80 backdrop-blur-xl border-b border-[#27272a]">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="text-orange-400 hover:text-orange-300 text-sm">Irivia</Link>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-12 text-zinc-300 text-sm leading-relaxed space-y-6">
        <h1 className="text-2xl font-bold text-white mb-6">Termos de Uso</h1>
        <p className="text-zinc-500 text-xs">Última atualização: junho de 2026</p>

        <section>
          <h2 className="text-lg font-semibold text-white mt-8 mb-3">1. Aceitação dos Termos</h2>
          <p>Ao criar uma conta e utilizar o Irivia, você concorda com estes Termos de Uso. Se não concordar, não utilize a plataforma.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mt-8 mb-3">2. Conta do Usuário</h2>
          <p>Você é responsável por manter a confidencialidade de sua chave visual e palavra mágica. O Irivia não se responsabiliza por acessos não autorizados decorrentes de compartilhamento ou perda de credenciais.</p>
          <p className="mt-2">Você deve ter pelo menos 13 anos para criar uma conta. Conteúdos classificados como 18+ exigem verificação de idade.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mt-8 mb-3">3. Conteúdo Gerado pelo Usuário</h2>
          <p>Ao publicar histórias, nós ou comentários, você concede ao Irivia uma licença mundial, não exclusiva e isenta de royalties para exibir, distribuir e promover seu conteúdo na plataforma.</p>
          <p className="mt-2">Você declara que é o autor do conteúdo ou possui permissão para publicá-lo. Conteúdo que viole leis, direitos autorais ou padrões da comunidade poderá ser removido sem aviso prévio.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mt-8 mb-3">4. Moderação</h2>
          <p>O Irivia se reserva o direito de moderar, editar ou remover qualquer conteúdo, bem como suspender ou banir contas que violem estes termos ou as leis aplicáveis.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mt-8 mb-3">5. Limitação de Responsabilidade</h2>
          <p>O Irivia é fornecido &ldquo;como está&rdquo;. Não garantimos disponibilidade contínua ou ausência de erros. Em nenhuma circunstância nos responsabilizamos por danos indiretos decorrentes do uso da plataforma.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mt-8 mb-3">6. Alterações</h2>
          <p>Estes termos podem ser alterados a qualquer momento. O uso continuado após alterações constitui aceitação dos novos termos. Recomendamos revisar esta página periodicamente.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mt-8 mb-3">7. Contato</h2>
          <p>Dúvidas ou solicitações podem ser enviadas através do formulário de feedback na plataforma ou pelo e-mail de contato disponível no perfil da equipe.</p>
        </section>
      </main>
    </div>
  );
}
