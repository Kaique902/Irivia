# Irivia — Roadmap Completo

> Documento técnico para implementação futura.
> Última atualização: 2026-05-30

---

## Stack Atual

```
Framework:    Next.js 14.1.0 (App Router)
Linguagem:    TypeScript 5
UI:           Tailwind CSS 3.3
Animações:    Framer Motion 11
Ícones:       Lucide React 0.344
Estado:       Zustand 4.5 (persist em localStorage)
Testes:       Jest + ts-jest (20 testes, 3 suites)
```

## ⚠️ PRÉ-REQUISITO ABSOLUTO: Backend Real

Tudo abaixo depende de sair do Zustand client-side para um backend.
A implementação atual usa localStorage — você **não pode** pular esta etapa.

### O que migrar:

| Atual (Zustand) | Destino (Supabase/PostgreSQL) |
|---|---|
| `stories[]` | `stories` table |
| `users[]` | `auth.users` + `profiles` table |
| `user` (session) | Supabase Auth (server-side session) |
| `votedNodes[]` + `voteLog[]` | `votes` table |
| `comments[]` | `comments` table |
| `reports[]` | `reports` table |
| `feedbackTexts[]` | `feedbacks` table |
| `challenges[]` | `daily_challenges` table |
| `adminLogs[]` | `admin_logs` table |
| `visitLog[]` | `page_visits` table |
| `.admins.json` | `profiles.is_admin` column |

### Passos da migração:

```
1. `npm install @supabase/supabase-js @supabase/ssr`
2. Criar schema SQL (tabelas, RLS, índices)
3. Substituir persist middleware por chamadas Supabase
4. Adicionar server actions para mutações
5. Remover persist do Zustand (manter só estado ephemeral)
6. Adicionar loading states em todas as operações async
```

---

## FASE 0 — Fundação (Backend)

### 0.1 Schema do Banco

**Arquivos:** `supabase/migrations/`

```sql
-- profiles (estende auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  username TEXT UNIQUE NOT NULL,
  avatar TEXT,
  level INT DEFAULT 1,
  xp INT DEFAULT 0,
  streak INT DEFAULT 0,
  contributions INT DEFAULT 0,
  following UUID[] DEFAULT '{}',
  followed_stories TEXT[] DEFAULT '{}',
  muted_stories TEXT[] DEFAULT '{}',
  is_admin BOOLEAN DEFAULT false,
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- stories
CREATE TABLE stories (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  seed TEXT,
  genre TEXT,
  total_branches INT DEFAULT 0,
  participants INT DEFAULT 0,
  author_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- story_nodes
CREATE TABLE story_nodes (
  id TEXT PRIMARY KEY,
  story_id TEXT REFERENCES stories(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author TEXT,
  author_id UUID REFERENCES profiles(id),
  emotion TEXT,
  parent_id TEXT,
  hot_votes INT DEFAULT 0,
  cold_votes INT DEFAULT 0,
  trending BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- votes
CREATE TABLE votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  node_id TEXT REFERENCES story_nodes(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('hot', 'cold')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, node_id)
);

-- comments, reports, feedbacks, admin_logs, page_visits...
```

### 0.2 Autenticação Server-Side

**Arquivos:** `src/lib/supabase.ts`, `src/app/auth/actions.ts`

- Substituir `hashPassword` (SHA-256 client-side) por bcrypt server-side
- Substituir login/register do Zustand por server actions
- Sessão via cookie (Supabase SSR)
- Rate limit no servidor (Redis ou PostgreSQL)
- Recuperação de conta via email (opcional)

### 0.3 Admin por Server Command

Já existe — `scripts/create-admin.mjs` + `GET /api/admin/check` + `POST /api/admin/setup`.
Na migração, trocar `.admins.json` por `profiles.is_admin = true`.

---

## FASE 1 — Monetização

### 1.1 Planos de Assinatura (Premium)

**Arquivos novos:**
- `src/app/premium/page.tsx` — Landing page de planos
- `src/stripe/...` — Webhooks de pagamento (se Stripe)
- `src/lib/subscription.ts` — Lógica de planos

**Fluxo:**
```
Usuário clica "Premium" → Stripe Checkout → Webhook → profiles.subscription = 'premium'
```

**Benefícios Premium:**
- Sem anúncios (placeholder)
- Tema escuro extra (já existe, mas pode variar)
- XP bônus (+20% em tudo)
- Badge "Premium" no perfil
- Histórias em destaque aparecem primeiro
- Exportar PDF sem marca d'água

**Store:**
```typescript
// profiles table
subscription: 'free' | 'premium' | 'vip'
subscription_expires: timestamptz
```

### 1.2 Moeda Virtual (Gems)

**Arquivos novos:**
- `src/store/virtualCurrency.ts`
- `src/app/shop/page.tsx`

**Conceito:**
- Gems — moeda premium (comprada com dinheiro real)
- Moedas — moeda gratuita (ganha por XP, desafios, streak)

**Tabelas:**
```sql
profiles.gems INT DEFAULT 0
profiles.coins INT DEFAULT 100  -- bônus inicial
```

**Compras:**
- 100 gems = R$ 5,00
- 500 gems = R$ 20,00 (bônus)
- 1200 gems = R$ 40,00 (mega bônus)

### 1.3 Gorjetas para Escritores

**Arquivos novos:**
- `src/components/ui/TipButton.tsx`
- `src/app/[id]/page.tsx` (botão de gorjeta)

**Fluxo:**
```
Usuário lê história → clica "Gorjeta" → escolhe valor em gems → confirma
→ gems debitadas do leitor → creditadas no escritor (com taxa da plataforma)
```

### 1.4 Histórias em Destaque Pagas

**Arquivos:**
- `src/components/ui/PromotedStory.tsx`
- `src/app/page.tsx` (inserir no feed)

**Tabela:**
```sql
CREATE TABLE promoted_stories (
  story_id TEXT PRIMARY KEY REFERENCES stories(id),
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  paid_by UUID REFERENCES profiles(id),
  amount INT
);
```

**Regra:** 1 história paga a cada 4 orgânicas no feed.

### 1.5 Batalhas de Histórias (Pay-to-Enter)

**Arquivos novos:**
- `src/app/battles/page.tsx`
- `src/components/battle/BattleArena.tsx`

**Conceito:**
- Inscrição: 50 moedas
- 2 escritores recebem o mesmo prompt
- 24h para escrever
- Comunidade vota no melhor
- Vencedor leva 80% do pool, plataforma 20%

**Tabelas:**
```sql
CREATE TABLE battles (
  id UUID PRIMARY KEY,
  prompt TEXT NOT NULL,
  entry_fee INT DEFAULT 50,
  prize_pool INT,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  status TEXT CHECK (status IN ('open', 'active', 'voting', 'finished'))
);
```

---

## FASE 2 — Engajamento & Retenção

### 2.1 Busca

**Arquivos novos:**
- `src/components/ui/SearchBar.tsx`
- `src/app/search/page.tsx`

**Tabela:** `stories.title` + `stories.seed` com índices GIN (pg_trgm) ou Elasticsearch.

```
GET /api/search?q=chapéu&genre=fantasia&sort=trending
```

### 2.2 Perfil Público do Escritor

**Arquivos novos:**
- `src/app/[username]/page.tsx` — Perfil público

**Conteúdo:**
- Bio editável
- Obras completas + em andamento
- Estatísticas (total de leitores, XP, joined date)
- Botão "Seguir"
- Badges visíveis (Premium, Top Escritor, etc.)

### 2.3 Listas de Leitura

**Arquivos novos:**
- `src/components/ui/ReadingList.tsx`
- `src/app/profile/lists/page.tsx`

**Tabela:**
```sql
CREATE TABLE reading_lists (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  name TEXT NOT NULL,
  story_ids TEXT[] DEFAULT '{}',
  is_public BOOLEAN DEFAULT true
);
```

**Funcionalidades:**
- "Ler depois" (1 clique no card da história)
- "Favoritos"
- Listas customizadas (criar, renomear, compartilhar)

### 2.4 Histórico de Leitura

**Tabela:**
```sql
CREATE TABLE reading_history (
  user_id UUID REFERENCES profiles(id),
  story_id TEXT REFERENCES stories(id),
  last_node_id TEXT,
  progress INT DEFAULT 0,  -- percentual
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, story_id)
);
```

**UI:** Seção "Continuar Lendo" no topo do feed.

### 2.5 Notificações Push

**Arquivos novos:**
- `src/lib/notifications.ts` — Server-side push
- Modificar `public/sw.js` para receber push

**Eventos que disparam push:**
- Alguém votou no seu nó
- Alguém continuou sua história
- Seguidor publicou nova história
- Desafio diário disponível
- Batalha começou/terminou
- História seguida foi atualizada

### 2.6 Desafios Comunitários

**Arquivo novo:** `src/app/challenges/page.tsx`

**Tipos:**
- **Semana do Terror** — todos escrevem histórias de terror, melhor ganha gems
- **Concurso mensal** — tema definido, prêmio em gems + badge exclusivo
- **Corrente literária** — cada escritor adiciona 1 parágrafo, passa pro próximo

---

## FASE 3 — Crescimento

### 3.1 Programa de Indicação (Referral)

**Tabela:**
```sql
profiles.referral_code TEXT UNIQUE
profiles.referred_by UUID REFERENCES profiles(id)
```

**Fluxo:**
```
Usuário A → compartilha link com código → Usuário B cria conta
→ Ambos ganham 100 moedas + streak bônus
```

### 3.2 Compartilhamento de Perfil

- `GET /api/profile/[username]/share` — gera card OG Image
- Meta tags dinâmicas no perfil público
- Botão "Compartilhar Perfil" no app

### 3.3 Curadoria Humana (Editorial Picks)

**Tabela:**
```sql
CREATE TABLE editorial_picks (
  story_id TEXT PRIMARY KEY REFERENCES stories(id),
  picked_by UUID REFERENCES profiles(id),
  reason TEXT,
  picked_at TIMESTAMPTZ DEFAULT now()
);
```

**UI:** Seção "Escolha da Curadoria" no feed, destacada visualmente.

### 3.4 Reputação do Escritor

**Sistema de selos:**
- ✅ **Verificado** — manual (admin concede)
- 🏅 **Top Escritor** — baseado em votos recebidos
- 📈 **Em Alta** — trending na última semana
- 🔥 **Popular** — mais de 1000 votos totais

**Tabela:**
```sql
profiles.reputation INT DEFAULT 0  -- score calculado periodicamente
profiles.badges TEXT[] DEFAULT '{}'  -- selos concedidos
```

---

## FASE 4 — Infraestrutura

### 4.1 API Pública

**Arquivo:** `src/app/api/v1/...`

- `GET /api/v1/stories` — listar histórias
- `GET /api/v1/stories/[id]` — detalhes
- `POST /api/v1/stories` — criar (autenticado)
- Rate limit por API key

### 4.2 Moderação com IA

- Integrar OpenAI ou Claude para detectar:
  - Spam
  - Conteúdo ofensivo
  - Gore/Violência explícita (fora dos gêneros permitidos)
- Score de 0-1, admin revisa acima de 0.8
- Moderador pode aceitar/rejeitar sugestão da IA

### 4.3 Analytics Avançado

- Eventos no cliente → servidor (via POST)
- Dashboard com gráficos (Chart.js ou Recharts)
- Métricas: DAU, MAU, retenção D1/D7/D30, LTV por plano

---

## Cronograma Sugerido

```
MÊS 1 — Fundação:
├── Semana 1: Schema SQL + Supabase setup
├── Semana 2: Migrar autenticação (server-side)
├── Semana 3: Migrar stories + nodes + votes
├── Semana 4: Migrar comments + reports + feedbacks

MÊS 2 — Monetização:
├── Semana 1: Planos de assinatura
├── Semana 2: Moeda virtual + loja
├── Semana 3: Gorjetas
├── Semana 4: Histórias em destaque pagas

MÊS 3 — Engajamento:
├── Semana 1: Busca + perfil público
├── Semana 2: Listas + histórico
├── Semana 3: Notificações push
├── Semana 4: Desafios comunitários

MÊS 4 — Crescimento + Infra:
├── Semana 1: Programa de indicação
├── Semana 2: Curadoria + reputação
├── Semana 3: API pública
├── Semana 4: Moderação IA + analytics
```

---

## Checklist de Implementação

### FASE 0 — Backend
- [ ] Schema SQL completo (migration)
- [ ] Supabase client configurado
- [ ] Server actions para auth (register/login/logout)
- [ ] Server actions para stories (CRUD)
- [ ] Server actions para nodes + votes
- [ ] Server actions para comments
- [ ] Server actions para reports + feedbacks
- [ ] Rate limit server-side
- [ ] RLS policies configuradas
- [ ] Admin sync via API (migrar de .admins.json)

### FASE 1 — Monetização
- [ ] Planos: Stripe integration
- [ ] Planos: UI de upgrade
- [ ] Planos: Lógica de benefícios
- [ ] Moeda: Store + tabela
- [ ] Moeda: Comprar gems
- [ ] Moeda: Loja de itens
- [ ] Gorjetas: UI + lógica
- [ ] Destaque pagos: Tabela + UI no feed
- [ ] Batalhas: Tabela + inscrição
- [ ] Batalhas: Arena de escrita
- [ ] Batalhas: Votação + premiação

### FASE 2 — Engajamento
- [ ] Busca: Input + resultados
- [ ] Busca: Filtros (gênero, data, trending)
- [ ] Perfil público: Rota dinâmica
- [ ] Perfil público: Estatísticas + bio
- [ ] Listas: Tabela + CRUD
- [ ] Listas: UI "Ler depois"
- [ ] Histórico: Tabela + tracking
- [ ] Histórico: "Continuar lendo" no feed
- [ ] Push: Service worker atualizado
- [ ] Push: Eventos server-side
- [ ] Desafios comunitários: UI + lógica

### FASE 3 — Crescimento
- [ ] Referral: Código único por usuário
- [ ] Referral: Bônus ao indicar
- [ ] Compartilhamento: OG image
- [ ] Curadoria: Tabela + UI no feed
- [ ] Reputação: Cálculo + badges
- [ ] Selos: Admin concede manualmente

### FASE 4 — Infra
- [ ] API pública: Rotas + auth
- [ ] API pública: Documentação
- [ ] Moderação IA: Integração OpenAI
- [ ] Moderação IA: Score + revisão
- [ ] Analytics: Coleta de eventos
- [ ] Analytics: Dashboard com gráficos
