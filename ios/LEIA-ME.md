# Marileo Kart na App Store — passo a passo

O app de iPhone/iPad está pronto em `ios/`. O jogo vai **guardado dentro do app** e funciona sem
internet (só o modo Online com Amigos precisa de conexão). Não é preciso ter Mac: o GitHub compila
o app num Mac da nuvem (`.github/workflows/ios.yml`).

## 1. Conta de desenvolvedor Apple (só o dono pode fazer)
1. Entre em <https://developer.apple.com/programs/enroll/> com o seu Apple ID e assine o
   **Apple Developer Program** (US$ 99 por ano; pessoa física serve).
2. A Apple pode levar de algumas horas a 2 dias para aprovar.

## 2. Criar o app no App Store Connect
1. <https://appstoreconnect.apple.com> → **Apps** → **+** → **Novo app**.
2. Plataforma **iOS** · Nome **Marileo Kart** · Idioma principal **Português (Brasil)**
   · ID do pacote **com.martinelli.marileokart** (se não aparecer na lista, crie em
   developer.apple.com → Certificates, IDs & Profiles → Identifiers → +) · SKU **marileokart**.

## 3. Chave para o GitHub enviar o app
1. App Store Connect → **Usuários e acesso** → **Integrações** → **Chaves da API do App Store Connect**
   → **+** → nome “GitHub”, acesso **Admin** → baixe o arquivo `AuthKey_XXXXXXXX.p8` (só baixa uma vez).
2. Anote o **ID da chave** e o **ID do emissor (Issuer ID)** que aparecem na mesma página.
3. O **Team ID** fica em developer.apple.com → Account → Membership details.
4. No GitHub: repositório **jogo-marileo** → **Settings** → **Secrets and variables** → **Actions**
   → **New repository secret**, e crie:

   | Nome | Valor |
   |---|---|
   | `APPLE_TEAM_ID` | Team ID (10 letras/números) |
   | `ASC_KEY_ID` | ID da chave |
   | `ASC_ISSUER_ID` | Issuer ID |
   | `ASC_KEY_P8` | o texto inteiro do arquivo .p8 (abra no Bloco de Notas e cole tudo) |

## 4. Gerar e enviar o app
GitHub → **Actions** → **iOS** → **Run workflow** → **Run workflow**. Em ~15 minutos a versão aparece
no App Store Connect, em **TestFlight** (dá para instalar no seu iPhone pelo app TestFlight e testar
antes de publicar).

## 5. Preencher a página da loja e enviar para revisão
Use os textos de `ios/AppStore/textos.md` e as fotos de `ios/AppStore/screenshots/`
(`iphone-*` = iPhone 6,9", `ipad-*` = iPad 13"). Escolha a versão (build) enviada pelo GitHub e
toque em **Enviar para revisão**. A Apple costuma responder em 1 a 3 dias.

## Para desenvolvedores
- `node ios/build-web.mjs` copia o jogo para `ios/www` e baixa three.js, PeerJS e as fontes.
- `cd ios && xcodegen generate` cria o `MarileoKart.xcodeproj` (abre no Xcode, se tiver um Mac).
- Ícone 1024×1024: `ios/tools/icon.html` (desenhado com os próprios karts do jogo).
