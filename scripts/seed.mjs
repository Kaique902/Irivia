#!/usr/bin/env node
/**
 * Seed script — cria admin users + histórias iniciais no Supabase.
 *
 * Uso:
 *   node scripts/seed.mjs
 *
 * Pré-requisitos:
 *   .env.local com SUPABASE_SERVICE_ROLE_KEY
 *   .admins.json com lista de admins
 *   Migrations 00001-00004 já rodadas no SQL Editor
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '..', '.env.local');
const adminsPath = join(__dirname, '..', '.admins.json');

// ─── Load env ───────────────────────────────────────────────

function loadEnv() {
  const raw = readFileSync(envPath, 'utf-8');
  const env = {};
  for (const line of raw.split('\n')) {
    const m = line.match(/^\s*([^=]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim();
  }
  return env;
}

const env = loadEnv();
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não encontrada no .env.local');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ─── Load admins ────────────────────────────────────────────

const admins = existsSync(adminsPath) ? JSON.parse(readFileSync(adminsPath, 'utf-8')) : [];

if (admins.length === 0) {
  console.warn('⚠️  Nenhum admin encontrado em .admins.json');
}

// ─── Helper: random pattern ─────────────────────────────────

function randomPattern() {
  const len = 3 + Math.floor(Math.random() * 2);
  const set = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
  const picks = [];
  for (let i = 0; i < len && set.length > 0; i++) {
    const idx = Math.floor(Math.random() * set.length);
    picks.push(set[idx]);
    set.splice(idx, 1);
  }
  return picks;
}

const MAGIC_WORD = 'Irivia2034';

function hashPassword(password) {
  const hash = createHash('sha256').update(password).digest('hex');
  return 'h2_' + hash;
}

const HASHED_PASSWORD = hashPassword(MAGIC_WORD);

// ─── Register admin users ───────────────────────────────────

async function registerUsers() {
  console.log('\n📝 Registrando usuários admin...\n');

  for (const username of admins) {
    const email = `${username.toLowerCase()}@irivia.local`;
    try {
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password: HASHED_PASSWORD,
        email_confirm: true,
        user_metadata: {
          username,
          magic_word: HASHED_PASSWORD,
          pattern: randomPattern(),
          avatar: '🛡️',
        },
      });
      if (error) {
        if (error.message.includes('already exists') || error.message.includes('already registered') || error.message.includes('has already been')) {
          // Update password + metadata for existing user
          try {
            const { data: existing } = await admin.auth.admin.listUsers();
            const user = existing?.users?.find(u => u.email === email);
            if (user) {
              await admin.auth.admin.updateUserById(user.id, {
                password: HASHED_PASSWORD,
                user_metadata: { username, magic_word: HASHED_PASSWORD, pattern: randomPattern(), avatar: '🛡️' },
              });
              await ensureProfile(user, username, HASHED_PASSWORD);
              console.log(`  🔄 "${username}" — senha atualizada`);
            }
          } catch { console.error(`  ❌ "${username}": erro ao atualizar senha`); }
        } else {
          console.error(`  ❌ "${username}": ${error.message}`);
        }
        continue;
      }
      if (data?.user) {
        await ensureProfile(data.user, username, HASHED_PASSWORD);
        // Promote to admin
        try {
          await admin.rpc('promote_to_admin', { target_username: username });
        } catch { /* function may not exist yet */ }
        console.log(`  ✅ "${username}" — email: ${email} / senha: ${MAGIC_WORD}`);
      }
    } catch (err) {
      console.error(`  ❌ "${username}": ${err.message}`);
    }
  }

  // Remove old seed-created admin users no longer in .admins.json
  const OLD_ADMIN_EMAILS = ['iris@irivia.local', 'adam@irivia.local'];
  console.log('');
  try {
    const { data: existing } = await admin.auth.admin.listUsers();
    for (const user of existing?.users || []) {
      if (OLD_ADMIN_EMAILS.includes(user.email)) {
        await admin.auth.admin.deleteUser(user.id);
        await admin.from('profiles').delete().eq('id', user.id).maybeSingle();
        console.log(`  🗑️  "${user.email}" removido`);
      }
    }
  } catch { /* cleanup failed */ }
}

async function ensureProfile(user, username, magicWord) {
  try {
    await admin.from('profiles').upsert({
      id: user.id, username, magic_word: magicWord,
      pattern: user.user_metadata?.pattern || randomPattern(),
      avatar: '🛡️', level: 1, xp: 0, streak: 0,
      contributions: 0, following: [], followed_stories: [],
      muted_stories: [], badges: ['🌱 Primeiro Post'],
      onboarding_completed: true, is_admin: true,
    }, { ignoreDuplicates: false });
  } catch { /* upsert failed */ }
}

// ─── Seed stories ───────────────────────────────────────────

const STORIES = [
  {
    title: 'O Portal Esquecido',
    genre: 'fantasia',
    seed: 'A poeira dançava sob os raios de sol que atravessavam as frestas do telhado. Lia nunca imaginou que o sótão da avó guardasse um portal para outro mundo. Mas ali estava ele: um arco de pedra coberto de runas que pulsavam com uma luz azulada e fria.',
    nodes: [
      { content: 'Lia estendeu a mão trêmula e tocou a superfície do portal. As runas brilharam intensamente, e uma onda de energia percorreu seu braço. O ar à sua frente começou a se distorcer, revelando uma floresta com árvores de folhas prateadas.', author: 'admin', hotVotes: 8, coldVotes: 1 },
      { content: 'Antes de tocar no portal, Lia decidiu descer e contar para a avó. A senhora ouviu em silêncio, um sorriso misterioso no rosto. "Então é verdade... a chave sempre esteve com você", disse a avó, abrindo um medalhão que emitia a mesma luz azulada.', author: 'iris', hotVotes: 6, coldVotes: 3 },
      { content: 'Lia correu para chamar o irmão mais novo. Quando voltaram, o portal estava ainda mais brilhante. "Não podemos entrar sem preparação", disse ele. "Precisamos de suprimentos." Mas quando foram buscar mochilas, ouviram um uivo vindo do sótão.', author: 'adam', hotVotes: 5, coldVotes: 2 },
    ],
    branches: [
      { parentId: 0, content: 'Do outro lado do portal, Lia encontrou uma cidade flutuante feita de cristal. Os habitantes, seres translúcidos de luz, a saudaram como "a escolhida". Eles explicaram que o mundo humano e o deles estavam se despedaçando, e apenas alguém de sangue puro poderia selar a fenda.', author: 'admin', hotVotes: 7, coldVotes: 0 },
      { parentId: 0, content: 'A floresta prateada era bela, mas perigosa. Criaturas feitas de sombra deslizavam entre as árvores. Lia encontrou uma clareira com um espelho gigante — e sua imagem no reflexo acenou para ela, dizendo: "Finalmente você chegou. Estou presa aqui há séculos."', author: 'iris', hotVotes: 9, coldVotes: 1 },
      { parentId: 1, content: 'A avó explicou que o medalhão era a chave para fechar o portal para sempre. Mas Lia percebeu algo estranho: a avó não parecia envelhecida — ela estava exatamente como na foto de 50 anos atrás. "Você já passou pelo portal, não passou, vó?"', author: 'admin', hotVotes: 10, coldVotes: 2 },
    ],
  },
  {
    title: 'O Mistério do Relógio Parado',
    genre: 'mistério',
    seed: 'O relógio da torre da praça central parou exatamente à meia-noite do dia 12 de março. Não era um relógio qualquer — era o marcador oficial do tempo da cidade desde 1850. Desde então, nada na cidade funciona como antes. As plantas crescem ao contrário. As pessoas começam a esquecer quem são.',
    nodes: [
      { content: 'O detetive particular Carlos Mendes foi chamado pela prefeitura para investigar. Ao examinar o mecanismo do relógio, encontrou algo perturbador: as engrenagens estavam perfeitamente alinhadas, como se alguém as tivesse parado propositalmente. Mas não havia sinal de arrombamento.', author: 'admin', hotVotes: 12, coldVotes: 2 },
      { content: 'A jornalista investigativa Clara decidiu mergulhar nos arquivos históricos da cidade. Descobriu que o relógio havia sido construído por um imigrante chamado Viktor Klein, que desapareceu misteriosamente em 1851. Nos diários dele, Clara encontrou uma pista: "Quando o tempo parar, a verdade surgirá."', author: 'iris', hotVotes: 9, coldVotes: 1 },
      { content: 'O neto do relojoeiro original, Benjamin Klein, apareceu na cidade. "Meu bisavô amaldiçoou o relógio antes de desaparecer", disse ele. "Ele descobriu algo que a elite da cidade queria esconder." Benjamin tinha um velha chave de bronze que se encaixava perfeitamente na base do relógio.', author: 'adam', hotVotes: 11, coldVotes: 3 },
    ],
    branches: [
      { parentId: 0, content: 'Carlos percebeu que a chave encontrada por Benjamin tinha um símbolo que ele já tinha visto antes — no medalhão que a prefeita usava sempre. Determinado a desvendar o segredo, ele marcou um encontro com ela, fingindo desistir do caso.', author: 'admin', hotVotes: 8, coldVotes: 0 },
      { parentId: 2, content: 'Benjamin girou a chave na base do relógio. Um compartimento secreto se abriu, revelando uma carta de 1850. "Ao ler isto, saiba que fui silenciado por saber da verdade. A prefeitura esconde um túnel sob a torre. Lá estão os registros que podem destruí-los."', author: 'iris', hotVotes: 14, coldVotes: 1 },
    ],
  },
  {
    title: 'Café na Esquina',
    genre: 'romance',
    seed: 'Todos os dias, às 7h da manhã, ele entrava no mesmo café, pedia um expresso duplo e sentava na mesma mesa junto à janela. Ela trabalhava no balcão e odiava clientes metódicos. Até o dia em que ele pediu um capuccino com canela — o pedido errado que mudou tudo.',
    nodes: [
      { content: '"Trocaram o pedido?", ele perguntou, confuso. Ela riu — pela primeira vez em meses. "Não, eu que fiz de propósito. Você precisa de menos rotina e mais surpresas." Ele olhou para o copo e depois para ela. "Você tem razão. Meu nome é Rafael. E você se importa se eu sentar em outra mesa hoje?"', author: 'iris', hotVotes: 15, coldVotes: 1 },
      { content: 'Rafael devolveu o café. "Pedi expresso, não capuccino." Ela bufou, virou as costas e fez outro. Mas algo naquele gesto seco a fez olhar para ele com mais atenção. Ele não estava no celular como todo mundo — estava lendo um livro de poesia. "Baudelaire?", ela perguntou. Ele levantou os olhos, surpreso.', author: 'admin', hotVotes: 7, coldVotes: 4 },
    ],
    branches: [
      { parentId: 0, content: 'Rafael sentou em outra mesa, mas não conseguiu ler. Ficou observando o jeito que ela limpava a máquina de espresso, a concentração no rosto. Quando o café esvaziou, ele se levantou e foi até o balcão. "O que você faz quando o café fecha?" Ela sorriu. "Toco violão em um bar ali na frente."', author: 'iris', hotVotes: 13, coldVotes: 0 },
      { parentId: 0, content: 'Ela olhou para o livro de poesia e sentiu o coração apertar. "Meu pai amava Baudelaire", disse, a voz falhando. Rafael fechou o livro. "E você?", perguntou com suavidade. "Você não ama mais?" O silêncio entre eles foi mais longo que o habitual.', author: 'admin', hotVotes: 10, coldVotes: 2 },
    ],
  },
  {
    title: 'A Casa na Colina',
    genre: 'terror',
    seed: 'Diziam que a casa abandonada no topo da colina não existia de verdade. Que era uma alucinação coletiva, um truque da névoa. Mas quando três amigos resolveram passar uma noite acampando perto dali, descobriram que a casa era mais real — e mais consciente — do que qualquer um poderia imaginar.',
    nodes: [
      { content: 'A névoa desceu tão rápido que em cinco minutos eles não viam as próprias mãos. Quando finalmente clareou, a casa estava a menos de cem metros. Não era velha nem abandonada — as janelas brilhavam com luz quente, e havia alguém na varanda, acenando.', author: 'admin', hotVotes: 18, coldVotes: 2 },
      { content: '"É uma miragem", disse Lucas, o cético do grupo. "Não podemos ir para lá." Mas Marina já estava andando. "Você não entendeu? Ela nunca esteve aqui antes. Eu vi fotos antigas. A casa... muda de lugar." Nina, a mais quieta, murmurou: "Ela não muda de lugar. Ela escolhe quem vê."', author: 'iris', hotVotes: 20, coldVotes: 1 },
    ],
    branches: [
      { parentId: 0, content: 'A pessoa na varanda era uma mulher idosa, vestida como se estivesse em um chá dos anos 1920. "Finalmente voltaram", disse ela, como se os conhecesse há anos. "A mesa está posta. Entrem, está esfriando." Seu sorriso era doce, mas seus olhos eram completamente negros.', author: 'admin', hotVotes: 25, coldVotes: 3 },
      { parentId: 1, content: 'Nina começou a recitar algo em uma língua que nenhum dos dois reconhecia. Seus olhos estavam vidrados. "Ela está sendo usada", Lucas sussurrou. "A casa está falando através dela." Marina pegou o celular — sem sinal. Mas a câmera mostrava algo que a olho nu não via: a casa estava coberta de escritas.', author: 'iris', hotVotes: 22, coldVotes: 0 },
    ],
  },
  {
    title: 'Sinal de Origem Desconhecida',
    genre: 'ficção científica',
    seed: 'O radiotelescópio de Arecibo captou um sinal repetitivo vindo de Proxima Centauri. Não era aleatório — era matemática pura. Sequências de Fibonacci, números primos e, finalmente, coordenadas. Coordenadas que apontavam para uma região remota do deserto do Atacama. Algo estava esperando ser encontrado.',
    nodes: [
      { content: 'A equipe de pesquisa chegou ao local indicado — um platô completamente liso no meio do deserto. Não havia nada, exceto um cubo preto de um metro de altura, perfeito, sem junções, sem poeira. Quando se aproximaram, a superfície do cubo tornou-se transparente, revelando um mapa estelar.', author: 'admin', hotVotes: 14, coldVotes: 1 },
      { content: 'Antes de partirem, a astrobióloga Dra. Faria notou algo estranho: o sinal não vinha de Proxima Centauri. Vinha de muito mais longe — e estava sendo "retransmitido" por um objeto em órbita da Terra. "Não é uma mensagem", ela disse. "É um alerta. Algo está vindo."', author: 'adam', hotVotes: 16, coldVotes: 3 },
    ],
    branches: [
      { parentId: 0, content: 'O mapa estelar mostrava uma rota através do sistema solar, com um ponto final na Terra. "Isto não é um convite", murmurou o criptógrafo da equipe. "É uma rota de fuga. Eles estavam aqui antes de nós, e algo os expulsou." O cubo emitiu um som grave, e o deserto inteiro tremeu.', author: 'admin', hotVotes: 17, coldVotes: 0 },
      { parentId: 1, content: '"Se algo está vindo, quanto tempo temos?", perguntou o general. Dra. Faria olhou para os dados. "Pelas trajetórias... aproximadamente 72 horas." Ela hesitou. "Mas o objeto em órbita não é uma sonda. É um portal. E ele está se ativando agora." No céu noturno, uma segunda lua começou a brilhar.', author: 'adam', hotVotes: 19, coldVotes: 1 },
    ],
  },
  {
    title: 'O Mapa Rasgado',
    genre: 'aventura',
    seed: 'Era apenas um mapa antigo, rasgado e manchado de café, encontrado dentro de um livro na biblioteca pública. Mas quando Miguel o desdobrou, percebeu que não era um mapa qualquer — as marcações não correspondiam a nenhum lugar conhecido. E no canto, uma anotação: "Aqui repousa o que nunca foi perdido."',
    nodes: [
      { content: 'Miguel mostrou o mapa para a amiga Sofia, historiadora. Ela ficou pálida. "Conheço esta caligrafia", disse. "É do meu bisavô, um cartógrafo que desapareceu na Amazônia em 1923." Juntos, descobriram que o mapa mostrava uma região que não existe em nenhum levantamento moderno.', author: 'admin', hotVotes: 10, coldVotes: 1 },
      { content: 'Decidiram seguir o mapa. Três dias de barco pelo rio Negro, depois uma trilha fechada pela mata. No local indicado não havia ruínas nem tesouro — apenas uma árvore imensa, com a casca marcada por símbolos idênticos aos do mapa. E uma inscrição: "O tesouro é o caminho."', author: 'iris', hotVotes: 8, coldVotes: 2 },
    ],
    branches: [
      { parentId: 0, content: 'Sofia descobriu que o bisavô fazia parte de uma sociedade secreta de cartógrafos que mapeavam "lugares entre mundos". O mapa não levava a um tesouro físico, mas a um local onde as fronteiras entre realidade e mito se dissolviam. "Se cruzarmos aquela árvore", disse ela, "podemos não voltar iguais."', author: 'admin', hotVotes: 11, coldVotes: 0 },
      { parentId: 1, content: 'Miguel tocou a árvore. A casca era quente, como se estivesse viva. De repente, os símbolos começaram a brilhar e a árvore se abriu, revelando uma escada em espiral descendo. "É agora ou nunca", disse Sofia. Trocaram um olhar e começaram a descer.', author: 'iris', hotVotes: 9, coldVotes: 1 },
    ],
  },
];

function generateId() {
  return `s${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function generateNodeId() {
  return `n${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function seedStories() {
  console.log('\n📖 Criando histórias iniciais...\n');

  for (const storyData of STORIES) {
    const storyId = generateId();
    const nodeIds = storyData.nodes.map(() => generateNodeId());

    try {
      // Insert story
      const { error: storyErr } = await admin.from('stories').insert({
        id: storyId,
        title: storyData.title,
        seed: storyData.seed,
        genre: storyData.genre,
        total_branches: storyData.nodes.length + storyData.branches.length,
        participants: [...new Set([...storyData.nodes, ...storyData.branches].map(n => n.author))].length,
        created_at: new Date().toISOString(),
      });
      if (storyErr) throw storyErr;

      // Insert main path nodes
      for (let i = 0; i < storyData.nodes.length; i++) {
        const n = storyData.nodes[i];
        const nodeId = nodeIds[i];
        const { error: nodeErr } = await admin.from('story_nodes').insert({
          id: nodeId,
          story_id: storyId,
          content: n.content,
          author: n.author,
          parent_id: i > 0 ? nodeIds[i - 1] : null,
          votes: n.hotVotes + n.coldVotes,
          hot_votes: n.hotVotes,
          cold_votes: n.coldVotes,
          trending: n.hotVotes >= 10,
          created_at: new Date(Date.now() - (storyData.nodes.length - i) * 60000).toISOString(),
        });
        if (nodeErr) throw nodeErr;
      }

      // Insert branch nodes
      for (const b of storyData.branches) {
        const branchId = generateNodeId();
        const { error: branchErr } = await admin.from('story_nodes').insert({
          id: branchId,
          story_id: storyId,
          content: b.content,
          author: b.author,
          parent_id: nodeIds[b.parentId],
          votes: b.hotVotes + b.coldVotes,
          hot_votes: b.hotVotes,
          cold_votes: b.coldVotes,
          trending: b.hotVotes >= 10,
          created_at: new Date().toISOString(),
        });
        if (branchErr) throw branchErr;
      }

      console.log(`  ✅ "${storyData.title}" (${storyData.genre})`);
    } catch (err) {
      // If duplicate (already seeded), skip
      if (err.message?.includes('duplicate') || err.code === '23505') {
        console.log(`  ⏭️  "${storyData.title}" já existe`);
      } else {
        console.error(`  ❌ "${storyData.title}": ${err.message}`);
      }
    }
  }
}

// ─── Run ────────────────────────────────────────────────────

async function main() {
  console.log('');
  console.log('  ╔═══════════════════════════════════════╗');
  console.log('  ║       Irivia — Seed Script        ║');
  console.log('  ╚═══════════════════════════════════════╝');

  await registerUsers();
  await seedStories();

  console.log('\n  ───────────────────────────────────────');
  console.log('  ✅ Seed concluído!');
  console.log('');
  console.log('  Credenciais dos admins:');
  console.log(`    URL: ${SUPABASE_URL.replace('.co', '.com')}`);
  console.log('    Senha padrão: ' + MAGIC_WORD);
  console.log('');
  for (const u of admins) {
    console.log(`    📧 ${u.toLowerCase()}@irivia.local → ${u} / ${MAGIC_WORD}`);
  }
  console.log('');
  console.log('  ⚠️  Se algum email já existir, foi ignorado.');
  console.log('  ⚠️  Rode as migrations 00003 e 00004 no SQL Editor se ainda não rodou.');
  console.log('');
}

main().catch(console.error);
