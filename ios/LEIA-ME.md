# Race Cities na App Store — passo a passo

O app de iPhone/iPad (**Race Cities**, da **Marileo Studios**) está pronto em `ios/`. O jogo vai
**guardado dentro do app** e funciona sem internet (só o modo Online com Amigos e os anúncios precisam
de conexão). Não é preciso ter Mac: o GitHub compila
o app num Mac da nuvem (`.github/workflows/ios.yml`).

## 1. Conta de desenvolvedor Apple (só o dono pode fazer)
1. Entre em <https://developer.apple.com/programs/enroll/> com o seu Apple ID e assine o
   **Apple Developer Program** (US$ 99 por ano; pessoa física serve).
2. A Apple pode levar de algumas horas a 2 dias para aprovar.

## 2. Criar o app no App Store Connect
1. <https://appstoreconnect.apple.com> → **Apps** → **+** → **Novo app**.
2. Plataforma **iOS** · Nome **Race Cities** · Idioma principal **Português (Brasil)**
   · ID do pacote **com.marileostudios.racecities** (se não aparecer na lista, crie em
   developer.apple.com → Certificates, IDs & Profiles → Identifiers → +) · SKU **racecities**.
3. **Categoria:** principal **Jogos**, subcategoria **Corrida**. **NÃO marque a categoria "Crianças"
   (Kids)** — veja a seção 6. Classificação etária: responda o questionário (sem violência
   realista etc.) → deve dar **4+**.

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

> Confira se os textos e fotos de `ios/AppStore/` já usam o nome **Race Cities** antes de enviar. Evite "para crianças"/"infantil" no nome, subtítulo e
> palavras-chave (diretriz 2.3.8 da Apple): descreva como jogo **para toda a família**.

## 6. Anúncios (Google AdMob)
O app já vem com o **Google AdMob** (intervalo depois da corrida e "assista e ganhe"), hoje com os
**IDs de TESTE** do Google, e só liga quando `js/ads-config.js` estiver com `enabled: true`.

**Onde colar os IDs reais** (quando a conta AdMob existir — passo a passo completo em
`docs/ANUNCIOS.md`, seção 8): abra `ios/project.yml` e troque as 3 linhas:

```yaml
    ADMOB_APP_ID: ca-app-pub-3940256099942544~1458002511          # ID do app iOS no AdMob (tem "~")
    ADMOB_INTERSTITIAL_ID: ca-app-pub-3940256099942544/4411468910 # bloco "Intersticial" (tem "/")
    ADMOB_REWARDED_ID: ca-app-pub-3940256099942544/1712485313     # bloco "Premiado" (tem "/")
```
Depois gere uma nova versão (seção 4). Enquanto `js/ads-config.js` tiver `test: true`, o app mostra
anúncios de teste mesmo com os IDs reais.

**Regras da Apple que já foram decididas:**
- **Fora da categoria "Crianças" (Kids).** A diretriz 1.3 diz que apps dessa categoria não devem ter
  publicidade de terceiros. O Race Cities vai como jogo **4+ para toda a família**, categoria Corrida.
- O app **não pede permissão de rastreamento** (não aparece "Permitir que o app rastreie…"): os
  anúncios são sem personalização, com tratamento de criança e classificação máxima G.
- **Privacidade do app** (App Store Connect → seu app → Privacidade do app): com anúncios **não é mais
  "Dados não coletados"**. Essa resposta só vale enquanto os anúncios estiverem desligados. Ao ligar, declare o que o SDK do Google coleta (tabela em `docs/ANUNCIOS.md`, seção 6):
  Dados de falhas, Dados de desempenho, ID do dispositivo, Dados de publicidade, Interação com o produto
  e Localização aproximada — finalidade "Publicidade de terceiros" (e "Análises"). Confirme com o
  jurídico se marca "vinculado à identidade"/"rastreamento" (nossa leitura: não).
- Atualize a política de privacidade (`privacidade.html`) dizendo que há anúncios do Google AdMob.

## Para desenvolvedores
- `node ios/build-web.mjs` copia o jogo para `ios/www` e baixa three.js, PeerJS e as fontes
  (o app Android usa o mesmo script: `node ios/build-web.mjs <pasta>/www`).
- `cd ios && xcodegen generate` cria o `MarileoKart.xcodeproj` (abre no Xcode, se tiver um Mac); o
  Xcode baixa sozinho o pacote `GoogleMobileAds` (Swift Package Manager).
- Anúncios: `ios/MarileoKart/GameAds.swift`; contrato com o jogo em `docs/ANUNCIOS.md`, Apêndice C.
- Ícone 1024×1024: `ios/tools/icon.html` (desenhado com os próprios karts do jogo).
