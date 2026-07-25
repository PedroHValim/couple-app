# Nossa Órbita 💛🌙

App de casal: mapa com a localização dos dois, botões de mensagem rápida com notificação,
e um mural de viagens com fotos. Feito para ser instalado na tela inicial do celular
(PWA), sem nenhum custo de hospedagem ou banco de dados.

## O que tem

- **Início**: mapa (OpenStreetMap, sem API key) com um marcador circular para cada pessoa,
  usando a foto de perfil, atualizado em tempo real via Supabase Realtime.
- **Mensagens rápidas**: 4 botões (Bom dia / Te amo / Boa noite / Saudade). A frase enviada
  muda de acordo com o horário de quem está enviando (veja `src/lib/messages.js`).
- **Notificações**: quando o app está aberto, aparece um aviso na tela. Quando está fechado,
  uma notificação push real chega pelo sistema operacional (Web Push, grátis, sem servidor
  próprio — usa uma Supabase Edge Function).
- **Viagens**: mural com um card por viagem (foto de capa + título + data) e, dentro de cada
  viagem, uma galeria de fotos que dá pra ir adicionando com o tempo.
- **Perfil**: nome e foto de cada pessoa, e para quem você está conectado(a).

## Arquitetura (tudo de graça)

| Peça | Tecnologia | Por quê |
|---|---|---|
| Frontend | React + Vite, empacotado como PWA | Vira "app" instalável na tela inicial, sem loja de aplicativos |
| Mapa | Leaflet + tiles do OpenStreetMap | Não precisa de chave de API nem cartão de crédito |
| Backend / banco | Supabase (Postgres + Realtime + Storage + Auth) | Plano gratuito cobre tranquilamente o uso de 2 pessoas |
| Fotos das viagens | Supabase Storage (buckets `avatars` e `trips`) | 1GB grátis, dá pra centenas de fotos comprimidas |
| Notificação push | Web Push (VAPID) + 1 Supabase Edge Function | Push nativo do navegador, sem serviço pago |
| Hospedagem | Vercel ou Netlify (plano free) | Deploy direto do GitHub, HTTPS grátis (obrigatório pra GPS e push) |

Você não precisa pagar nada em nenhuma dessas peças no volume de uso de um casal.

---

## Passo a passo

### 1. Criar o projeto no Supabase

1. Crie uma conta em [supabase.com](https://supabase.com) e um novo projeto (plano Free).
2. Vá em **SQL Editor** → cole todo o conteúdo de `supabase/schema.sql` → Run.
   Isso cria as tabelas, as políticas de segurança (RLS), o gerador de código de convite
   e os buckets de imagem.
3. Vá em **Project Settings → API** e copie a **Project URL** e a **anon public key**.

### 2. Configurar o app localmente

```bash
cp .env.example .env
# edite o .env e cole a URL e a anon key do passo anterior
npm install
npm run dev
```

Abra o link que aparecer (algo como `http://localhost:5173`). Crie duas contas
(uma para cada pessoa — pode usar dois e-mails diferentes ou o mesmo navegador em aba anônima
para testar) e conecte uma com a outra usando o código de convite que aparece na tela de
pareamento.

> Nota: por padrão o Supabase pede confirmação de e-mail no cadastro. Para testar mais rápido,
> vá em **Authentication → Providers → Email** e desative "Confirm email" (você pode reativar
> depois, se quiser).

### 3. Ativar as notificações push (opcional, mas recomendado)

1. Gere as chaves VAPID (só precisa fazer isso uma vez):
   ```bash
   npx web-push generate-vapid-keys
   ```
2. Cole a chave **pública** no seu `.env` em `VITE_VAPID_PUBLIC_KEY`.
3. No Supabase, instale a CLI e faça login (`npx supabase login`), depois:
   ```bash
   npx supabase functions deploy send-push --project-ref SEU_PROJECT_REF
   ```
4. Em **Edge Functions → send-push → Secrets**, cadastre:
   - `VAPID_PUBLIC_KEY` e `VAPID_PRIVATE_KEY` (as duas chaves geradas no passo 1)
   - `VAPID_SUBJECT` (ex: `mailto:seuemail@exemplo.com`)
   - `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` (a service role key fica em Project Settings → API)
5. Em **Database → Webhooks**, crie um novo webhook:
   - Tabela: `messages`, evento: `INSERT`
   - Tipo: "Supabase Edge Function" → escolha `send-push`

Pronto: toda vez que alguém tocar em um dos botões de mensagem, a função dispara o push
para quem vai receber.

### 4. Colocar no ar (hospedagem grátis)

Você pode escolher **Vercel/Netlify** ou **GitHub Pages** — os dois são grátis e têm HTTPS
(obrigatório para geolocalização e push funcionarem). O projeto já vem pronto para qualquer
um dos dois.

#### Opção A — Vercel ou Netlify (mais simples)

1. Suba este projeto para um repositório no GitHub.
2. Crie uma conta na [Vercel](https://vercel.com) (ou Netlify), importe o repositório.
3. Nas variáveis de ambiente do projeto, adicione as três do seu `.env`.
4. Deploy. Você vai receber uma URL `https://seu-app.vercel.app`.

#### Opção B — GitHub Pages

O projeto já inclui um workflow pronto em `.github/workflows/deploy.yml` que builda e publica
automaticamente a cada push na branch `main`. Só precisa:

1. Suba este projeto para um repositório no GitHub (pode ser privado ou público).
2. Em **Settings → Pages**, em "Build and deployment", escolha a fonte **GitHub Actions**.
3. Em **Settings → Secrets and variables → Actions → New repository secret**, cadastre:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_VAPID_PUBLIC_KEY`
4. Dê um `git push` na branch `main`. O Actions builda o app e publica sozinho.
5. Seu app fica em `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/`.

**Dois detalhes importantes do GitHub Pages** (o projeto já está ajustado para isso, é só
saber o motivo):

- O app usa `HashRouter` (URLs como `.../#/viagens`) em vez do padrão, porque o GitHub Pages
  não tem como redirecionar uma rota interna de volta pro `index.html` ao recarregar a página
  — com hash, o navegador sempre resolve sozinho.
- O caminho base (`BASE_PATH`) é calculado automaticamente pelo workflow a partir do nome do
  seu repositório (`/nome-do-repositorio/`). Se algum dia você **renomear o repositório**,
  o próximo deploy já se ajusta sozinho — não precisa mexer em nada.
- Se o repositório se chamar exatamente `SEU-USUARIO.github.io` (site de usuário, não de
  projeto), o app fica na raiz do domínio; nesse caso troque `BASE_PATH` no workflow para `/`.
- No Supabase, vá em **Authentication → URL Configuration** e adicione a URL do seu
  `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/` tanto no "Site URL" quanto em
  "Redirect URLs" — isso evita erro de redirecionamento nos links de confirmação de e-mail.

### 5. Instalar na tela inicial

- **Android (Chrome)**: abra o link → menu (⋮) → "Adicionar à tela inicial".
- **iPhone (Safari)**: abra o link → ícone de compartilhar → "Adicionar à Tela de Início".
  No iPhone, o push só funciona depois de instalado dessa forma (iOS 16.4 ou mais recente).

Depois de instalado, abra pelo ícone (não pelo Safari/Chrome) para que as notificações
funcionem direitinho.

---

## Limitações importantes para saber

- **Localização em segundo plano**: em navegadores/PWA (diferente de um app nativo da loja),
  a localização só atualiza de forma confiável enquanto o app está aberto ou em segundo plano
  recente. Se o celular "matar" o app por muito tempo, a localização para de atualizar até a
  pessoa abrir de novo. Isso é uma limitação de plataforma (Android e principalmente iOS), não
  do código — um app nativo publicado na loja não teria essa limitação, mas exigiria conta de
  desenvolvedor (paga, ~US$99/ano na Apple).
- **Push no iPhone**: exige o app instalado na tela inicial e iOS 16.4+.
- **Fotos**: o plano gratuito do Supabase Storage tem 1GB — dá pra muitas viagens, mas vale
  ficar de olho se forem fotos em altíssima resolução.

## Para customizar

- **Cores e fontes**: tudo centralizado em `src/index.css` (variáveis no `:root`).
- **Mensagens rápidas e frases por horário**: `src/lib/messages.js`.
- **Ícones**: `public/icons/` (gerados simples — sinta-se à vontade para trocar por algo
  mais pessoal, como uma foto de vocês dois).
