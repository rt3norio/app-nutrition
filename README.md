# 🥗 app-nutrition

App de nutrição **aberto, gratuito e sem backend**. Acompanhe **o que comer, em que
horário e quanto**, a partir de uma prescrição que o nutricionista entrega como um
arquivo JSON.

- **PWA / mobile-first** — instale na tela inicial, funciona offline.
- **Sem servidor** — todo o estado é um arquivo JSON. Backup/sincronização ficam no
  **seu próprio Google Drive** (pasta privada do app, escopo `drive.appdata`).
- **Validador embutido** — ao importar, o app explica em português qualquer problema
  do arquivo, com caminho do campo e dica de correção.
- **Amigável a IA** — há um prompt pronto para o nutricionista gerar o arquivo com
  ChatGPT/Claude/Gemini.

> App ao vivo: **https://rt3norio.github.io/app-nutrition/**

## Como funciona

1. O **nutricionista** cria a prescrição como JSON (à mão ou via IA — veja
   [`docs/PRESCRIPTION_SCHEMA.md`](docs/PRESCRIPTION_SCHEMA.md) e a aba **Ajuda** no app).
2. O **paciente** recebe o arquivo, abre o app e importa na aba **Dados**.
3. No dia a dia, marca cada refeição (comi / parcial / pulei) na aba **Hoje** e
   acompanha o progresso das metas.
4. Faz backup/sincroniza no Google Drive ou exporta o JSON quando quiser.

## Stack

- Vite + React + TypeScript (strict)
- `vite-plugin-pwa` (service worker, manifest, offline)
- IndexedDB (`idb`) para persistência local
- Google Identity Services + Drive REST (`appDataFolder`) — 100% client-side

## Desenvolvimento

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # gera dist/
node scripts/gen-icons.mjs   # regenera ícones a partir de scripts/logo.svg
```

## Deploy

Push em `main` dispara o GitHub Actions (`.github/workflows/deploy.yml`), que builda
e publica em **GitHub Pages**. O `base` do Vite é `/app-nutrition/`.

### Google Drive — Client ID único da aplicação

O usuário final **não cria conta no Google Cloud**. O app embute um único OAuth Web
client id (público — um client id de SPA não é segredo, só a origem autorizada o
protege), injetado no build pela variável de repositório `VITE_GOOGLE_CLIENT_ID`:

```bash
gh variable set VITE_GOOGLE_CLIENT_ID --repo rt3norio/app-nutrition --body "SEU_ID.apps.googleusercontent.com"
```

No Google Cloud (uma vez, pelo dono do app):
1. Crie um projeto e ative a **Google Drive API**.
2. Tela de consentimento OAuth: tipo **Externo**, escopo `drive.appdata`,
   **publique** (produção) para liberar a qualquer usuário.
3. Credenciais → **ID do cliente OAuth** → **Aplicativo da Web**.
4. Em "Origens JavaScript autorizadas": `https://rt3norio.github.io`.

Em **Configurações → Avançado** o usuário ainda pode, opcionalmente, usar um client
id próprio (sobrepõe o padrão).

## Privacidade

Não há servidor próprio nem coleta de dados. O único serviço externo é o Google
Drive, **opcional** e conectado com as credenciais do próprio usuário. O escopo
solicitado (`drive.appdata`) dá acesso apenas à pasta oculta do app — nunca ao
restante do Drive.

## Licença

MIT.
