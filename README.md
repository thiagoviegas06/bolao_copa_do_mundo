# Bolão Copa 2026

Site de bolão para a Copa do Mundo 2026. Crie bolões, convide amigos, faça palpites e veja quem acerta mais!

---

## Passo a passo para deployment

### Passo 1 — Criar projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie uma conta gratuita
2. Clique em **New project**, escolha um nome e uma senha para o banco (guarde essa senha)
3. Aguarde o projeto inicializar (~1 min)

### Passo 2 — Criar as tabelas do banco

1. No painel do Supabase, vá em **SQL Editor** (menu lateral)
2. Clique em **New query**
3. Copie todo o conteúdo do arquivo `supabase/schema.sql` deste repositório e cole no editor
4. Clique em **Run** — deve aparecer "Success" no final

### Passo 3 — Desabilitar confirmação de e-mail

Para que o cadastro funcione direto (sem precisar confirmar e-mail):

1. No Supabase, vá em **Authentication → Providers → Email**
2. Desmarque a opção **"Confirm email"**
3. Clique em **Save**

### Passo 4 — Pegar as chaves do Supabase

1. Vá em **Project Settings → API** (ícone de engrenagem no menu lateral)
2. Copie os três valores abaixo — você vai precisar deles nos próximos passos:

| Variável | Onde fica no painel |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Campo **Project URL** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Seção **Project API keys → anon public** |
| `SUPABASE_SERVICE_ROLE_KEY` | Seção **Project API keys → service_role** (clique em "Reveal") |

### Passo 5 — Pegar a chave da API de futebol

A API de futebol é gratuita e traz os jogos e resultados automaticamente.

1. Acesse [football-data.org/client/register](https://www.football-data.org/client/register)
2. Preencha o cadastro (nome + e-mail)
3. Você vai receber um e-mail com o **API Token** — copie esse token

### Passo 6 — Subir o código para o GitHub

Se ainda não tem o repositório no GitHub:

```bash
git init
git add .
git commit -m "Initial commit"
```

1. Acesse [github.com](https://github.com) e crie um novo repositório (pode ser privado)
2. Copie o endereço do repositório e rode:

```bash
git remote add origin https://github.com/SEU_USUARIO/SEU_REPO.git
git push -u origin main
```

### Passo 7 — Deploy no Vercel

1. Acesse [vercel.com](https://vercel.com) e crie uma conta (pode entrar com o GitHub)
2. Clique em **Add New → Project**
3. Selecione o repositório que você acabou de criar e clique em **Import**
4. Antes de clicar em Deploy, clique em **Environment Variables** e adicione as seguintes variáveis uma por uma:

| Nome | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL copiada no Passo 4 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anon copiada no Passo 4 |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave service_role copiada no Passo 4 |
| `FOOTBALL_API_KEY` | Token copiado no Passo 5 |
| `FOOTBALL_API_BASE` | `https://api.football-data.org/v4` |
| `CRON_SECRET` | Qualquer texto aleatório (ex: `meubolao2026segredo`) |
| `NEXT_PUBLIC_SITE_URL` | Deixe em branco por agora — preencha após o deploy |
| `DEV_MODE` | `false` |
| `NEXT_PUBLIC_DEV_MODE` | `false` |

5. Clique em **Deploy** e aguarde (~2 min)
6. Após o deploy, copie a URL do site (ex: `bolao-site.vercel.app`)
7. Volte em **Settings → Environment Variables**, edite `NEXT_PUBLIC_SITE_URL` e cole a URL
8. Vá em **Deployments**, clique nos três pontinhos do último deploy e clique em **Redeploy**

### Passo 8 — Sincronizar os jogos pela primeira vez

Após o deploy, rode o comando abaixo para importar os jogos da Copa do sistema de API (substitua os valores):

```bash
curl -X POST https://SEU_SITE.vercel.app/api/matches/sync \
  -H "Authorization: Bearer SEU_CRON_SECRET"
```

A partir daí o site sincroniza automaticamente a cada 2 horas via cron.

---

## Testar localmente (sem Supabase)

O projeto tem um modo de desenvolvimento com dados fictícios. Basta rodar:

```bash
npm run dev
```

O `.env.local` já vem com `DEV_MODE=true` — o site abre direto no dashboard com dados de exemplo, sem precisar de nenhuma conta ou chave configurada.

Para sair do modo dev, edite `.env.local` e troque:
```
DEV_MODE=true  →  DEV_MODE=false
NEXT_PUBLIC_DEV_MODE=true  →  NEXT_PUBLIC_DEV_MODE=false
```

---

## Sistema de pontuação (padrão)

| Categoria | Acerto | Pontos |
|---|---|---|
| Placares | Resultado certo (quem ganhou/empate) | 1 pt |
| Placares | Placar exato | 3 pts |
| Fase de grupos | Time que avança (1º ou 2º) | 2 pts |
| Fase de grupos | Posição exata no grupo | 1 pt |
| Mata-mata | Vencedor do jogo | 5 pts |
| Pré-torneio | Campeão | 15 pts |
| Pré-torneio | Artilheiro | 10 pts |

Todos os valores são configuráveis por bolão na hora de criá-lo.
