# Anúncios no Race Cities — guia

Este guia tem duas partes: a primeira é para quem decide (CEO, sem precisar programar); o **Apêndice técnico** no fim é para o engenheiro que liga o módulo ao jogo.

> **Situação hoje:** os anúncios estão **prontos, mas DESLIGADOS** (`enabled: false`). Enquanto ninguém mudar isso, o jogo se comporta exatamente como antes — e os apps nem iniciam o SDK do Google.
> Os apps Android e iOS já têm o **Google AdMob** de verdade embutido (intervalo depois da corrida + "assista e ganhe"), hoje com os **IDs de TESTE** do Google. O passo a passo para trocar pelos IDs reais está na **seção 8**.

---

## 1. O que foi construído

Uma "camada de anúncios" que mostra **um intervalo comercial depois de cada corrida** (nunca durante a corrida), pensada para um jogo cujo público inclui **crianças**.

Ela sabe falar com vários "fornecedores" de anúncio e escolhe o certo conforme onde o jogo está rodando:

| Onde o jogo roda | Quem mostra o anúncio | Se não houver anúncio |
|---|---|---|
| App Android / iPhone | Google AdMob (dentro do app) | Cartão de patrocinador próprio |
| Site próprio (GitHub Pages etc.) | Google AdSense para jogos (H5) | Cartão de patrocinador próprio |
| CrazyGames | SDK da CrazyGames | nada (portais não aceitam anúncio misturado) |
| Poki | SDK da Poki | nada |

**Patrocinador próprio ("house")**: um cartão em tela cheia com o nome/foto do patrocinador, selo "Patrocinado", contagem 5→0 e botão grande "Continuar". Serve para **parcerias diretas com comércio local**, para divulgar nossos próprios jogos e como reserva quando o Google não tem anúncio. Funciona **sem internet**.

Regras de bom senso (todas ajustáveis):
- Nenhum anúncio depois da **primeira corrida** da sessão.
- No mínimo **90 segundos** entre dois anúncios.
- Máximo de **8 por sessão**.
- **Nada em salas online** (os outros jogadores ficam esperando).
- Se o jogador "remover anúncios" (compra futura), nenhum anúncio aparece.
- O "assista e ganhe" (anúncio com recompensa) só aparece se o jogador tocar num botão que o ofereça.
- Se o anúncio falhar, estiver bloqueado ou o aparelho estiver sem internet, **o jogo segue normalmente** — nunca trava.

O estúdio vê **quantos anúncios foram mostrados** (por dia, por tipo e por patrocinador) — ver seção 7.

## 2. Como ligar os anúncios

1. Abra `js/ads-config.js`.
2. Troque `enabled: false` por `enabled: true`.
3. Deixe `test: true` enquanto estiver testando (anúncios de teste, sem dinheiro). Só na publicação final troque para `test: false`.
4. Publique o jogo.

Para testar sem abrir o jogo: abra `ads-test.html` no navegador (por um servidor local ou pelo site publicado). Há botões para disparar anúncios e uma área de registro.

Para **desligar tudo de novo**: `enabled: false`.

## 3. Como cadastrar um patrocinador (passo a passo)

Exemplo: a **Padaria Pão Quente** paga R$ 300 para aparecer em dezembro.

1. **Receba do patrocinador:** o nome, uma frase curta, uma foto/logo (JPG ou PNG, leve — até uns 150 KB, proporção 3:2, por exemplo 600×400) e, se quiser, o site.
2. **Salve a imagem** na pasta `ads/` do jogo (crie a pasta se não existir): `ads/padaria.jpg`.
3. Em `js/ads-config.js`, dentro de `houseCampaigns`, adicione:

```js
{
  id: 'padaria-pao-quente',          // nome único, sem espaços
  title: 'Padaria Pão Quente',
  text: 'Pão fresquinho todo dia às 6h! Rua das Flores, 123.',
  image: 'ads/padaria.jpg',          // opcional; sem imagem vira cartão colorido de texto
  url: 'https://www.padariapaoquente.com.br',   // opcional
  linkLabel: 'Conhecer a padaria',   // opcional
  weight: 3,                         // peso: 3 aparece 3x mais que um de peso 1
  start: '2026-12-01',               // opcional: primeiro dia
  end: '2026-12-31',                 // opcional: último dia (inclusive)
  enabled: true,
},
```
4. O engenheiro deve adicionar `'ads/padaria.jpg'` à lista `FILES` do `sw.js` (para funcionar sem internet) e publicar.
5. Confira no `ads-test.html` (ou no jogo) se o cartão apareceu bonito no celular deitado.
6. Depois do fim do contrato, o cartão sai sozinho na data `end`. Para relatório ao patrocinador, use as estatísticas (seção 7): mostra quantas vezes o cartão apareceu (`campaign.padaria-pao-quente.shown`) e quantos adultos abriram o site (`...click`).

**Links são seguros para crianças:** tocar no cartão/botão **não abre o site direto**. Aparece "Área para adultos — Abrir site do patrocinador?" e é preciso **segurar um botão por 3 segundos**. Só então o site abre.

Dica comercial: sem `weight` o padrão é 1. Se só houver 1 campanha ativa, ela repete; com várias, o sorteio evita repetir a mesma duas vezes seguidas.

## 4. Como cada fornecedor é ativado

| Fornecedor | O que você precisa | Onde colocar |
|---|---|---|
| **Google AdSense (site)** | Conta AdSense aprovada para o site + ativar "Anúncios para jogos H5" (H5 Games Ads). Pegue o ID `ca-pub-XXXXXXXXXXXXXXXX`. | `js/ads-config.js` → `h5.client` |
| **Google AdMob (apps)** | Conta AdMob, um app Android e um iOS cadastrados, e 2 blocos de anúncio por app (intervalo e recompensa). | Android: `android/ads.properties` · iOS: `ios/project.yml` (linhas `ADMOB_*`). Passo a passo na seção 8. |
| **CrazyGames** | Jogo aprovado e publicado na CrazyGames (programa de desenvolvedores). Nada a configurar: o SDK é carregado automaticamente quando o jogo roda no domínio deles. | `platform: 'crazygames'` só se quiser forçar |
| **Poki** | Jogo aprovado pela Poki. Idem: automático no domínio deles. | `platform: 'poki'` só se quiser forçar |
| **Patrocinadores próprios** | Nada de conta. | `houseCampaigns` |

Cada portal tem **regras próprias** (CrazyGames, por exemplo, só aceita um anúncio de intervalo a cada ~3 minutos e proíbe misturar anúncio próprio). Por isso, nesses portais a lista de fornecedores tem só o SDK deles. Antes de enviar o jogo a um portal, releia os requisitos de anúncio dele.

Ordem de tentativa por plataforma (editável em `providers`):
```js
providers: {
  native:     ['native', 'house'],
  crazygames: ['crazygames'],
  poki:       ['poki'],
  web:        ['h5', 'house'],
}
```

## 5. Segurança para crianças

Configurado por padrão:
- **Site (AdSense):** tratamento voltado a crianças (`childDirected: true` → `data-tag-for-child-directed-treatment`), menores de idade (`underAgeOfConsent: true`), **anúncios não personalizados** (`nonPersonalized: true`) e `data-ad-frequency-hint` = 60 s. A **classificação "G"** do site é escolhida no **painel do AdSense** (Bloqueio de controles > conteúdo sensível/categorias) — faça isso manualmente.
- **Apps (AdMob):** todo pedido de anúncio sai com **tratamento de criança** (`AgeRestrictedTreatment.CHILD`, que o Google criou para substituir `tagForChildDirectedTreatment` + `tagForUnderAgeOfConsent` — mesmo efeito, os nomes antigos estão obsoletos), **sem personalização** (`PublisherPrivacyPersonalizationState.DISABLED`) e **classificação máxima G**. Isso está no código dos apps e vale mesmo que alguém mude o painel do AdMob.
- **Android:** o app **não usa o ID de publicidade** (a permissão `AD_ID` é removida do manifesto), nem os IDs/tópicos/atribuição do Privacy Sandbox.
- **iOS:** o app **não pede permissão de rastreamento** (sem a janela "Permitir que o app rastreie…", sem IDFA) e desliga a localização aproximada do SDK.
- Os apps **só ligam o SDK do Google quando `enabled: true`**. Desligado = nenhum contato com o Google.
- Nosso código **não coleta nada**: só guarda contadores locais ("quantos anúncios hoje") no aparelho, sem identificar ninguém.
- Links de patrocinador atrás de **portão dos pais**; só aceitam `http`/`https` e abrem no navegador do aparelho.
- Anúncio nunca aparece durante a corrida, nem ao abrir o app (o primeiro intervalo só vem depois da 2ª corrida).

**Atenção legal:** jogos com crianças no público têm regras próprias na Google Play (Política para Famílias), na App Store (diretrizes 1.3 e 5.1.4) e leis como LGPD (art. 14), COPPA e ECA Digital. Antes de ligar os anúncios nos apps, confirme com o jurídico e **atualize `privacidade.html`** informando que há anúncios do Google e o que o SDK coleta (seção 6).

## 6. Regras das lojas (decisões já tomadas e o que falta preencher)

### App Store (iPhone/iPad)
- **NÃO coloque o app na categoria "Crianças" (Kids).** A diretriz 1.3 diz que apps dessa categoria "não devem incluir analytics nem publicidade de terceiros" — e quem entra nela não pode sair depois sem continuar cumprindo as regras. O Race Cities vai como **jogo para toda a família, classificação 4+**, categoria **Jogos › Corrida** (`public.app-category.racing-games`, já configurado).
- A diretriz 5.1.4 também diz que apps **destinados principalmente a crianças** não devem ter publicidade de terceiros. Por isso, na página da loja, **não use "para crianças"/"infantil"** como público principal; descreva como jogo para toda a família (a diretriz 2.3.8 também restringe esses termos).
- **Privacidade do app (App Store Connect › Privacidade do app):** com o AdMob, deixa de ser "Dados não coletados". Segundo a página do Google para o SDK 13.12.0 (*developers.google.com/admob/ios/privacy/data-disclosure*, consultada em 13/11/2026), o SDK pode coletar:

  | Tipo de dado (nome na Apple) | O que é | Finalidade a marcar |
  |---|---|---|
  | **Diagnóstico › Dados de falhas** (Crash Data) | registros de falha do SDK | Publicidade de terceiros, Análises |
  | **Diagnóstico › Dados de desempenho** (Performance Data) | tempo de abertura, travamentos, energia | Publicidade de terceiros, Análises |
  | **Identificadores › ID do dispositivo** (Device ID) | identificadores do app/aparelho (o IDFA não é acessado, pois não pedimos ATT) | Publicidade de terceiros, Análises |
  | **Dados de uso › Dados de publicidade** (Advertising Data) | anúncios que a pessoa viu | Publicidade de terceiros, Análises |
  | **Dados de uso › Interação com o produto** (Product Interaction) | toques, abertura do app, vídeos vistos | Publicidade de terceiros, Análises |
  | **Localização › Localização aproximada** (Coarse Location) | estimada pelo IP (a coleta pelo GPS está desligada no código) | Publicidade de terceiros |

  *Não verificado / decisão do jurídico:* "vinculado à identidade" e "usado para rastreamento". Nossa leitura: **não vinculado** e **sem rastreamento** (não pedimos ATT, anúncios sem personalização e com tratamento de criança), mas confirme antes de enviar.

### Google Play (Android)
- Em **Conteúdo do app › Público-alvo e conteúdo**, se marcar faixas etárias de crianças (menos de 13), o app entra na **Política para Famílias**. Texto atual (consultado em 13/11/2026 em *support.google.com/googleplay/android-developer/answer/9893335*): quem mostra anúncios a crianças ou a usuários de idade desconhecida deve **usar apenas SDKs de anúncios autocertificados para Famílias** ("Families Self-Certified Ads SDKs"), sem anúncios baseados em interesse nem remarketing, com conteúdo adequado a crianças e seguindo os requisitos de formato.
- **O AdMob está na lista de SDKs autocertificados** (`com.google.android.gms:play-services-ads` **19.0.0 ou mais novo**; usamos a 25.5.0 — lista em *support.google.com/googleplay/android-developer/answer/9283445*, consultada em 13/11/2026).
- Requisitos de formato que **valem para nós**: anúncio que ocupa a tela toda precisa ter um jeito claro de fechar; **anúncios "com recompensa" ou opcionais que não podem ser fechados depois de 5 segundos são proibidos** para crianças/idade desconhecida; nada de intersticial logo ao abrir o app (o nosso só aparece entre corridas e nunca depois da 1ª). ⚠️ *Não verificado:* se todo vídeo com recompensa servido pelo AdMob a pedidos com tratamento de criança respeita o limite de 5 s. Até confirmar no AdMob, a opção mais segura é **não oferecer o "assista e ganhe" nos apps** (`rewardedEnabled: false`) — hoje o jogo ainda não tem botão de recompensa.
- Dados: apps só para crianças **não podem transmitir o ID de publicidade (AAID)** e, com API 33+, não devem pedir a permissão `AD_ID` — já removida.
- **Segurança dos dados (Data safety):** segundo *developers.google.com/admob/android/privacy/play-data-disclosure* (versão 25.5.0, consultada em 13/11/2026), o SDK coleta e compartilha automaticamente, para publicidade, análises e prevenção a fraudes: **endereço IP** (localização aproximada), **interações do usuário com o produto** (abertura do app, toques, vídeos vistos), **informações de diagnóstico** (tempo de abertura, travamentos, energia) e **identificadores do dispositivo** (ID de publicidade — que no nosso app está bloqueado —, app set ID). Dados criptografados em trânsito (TLS).
- **Nível de API:** app novo precisa de `targetSdk` 36 — já está (`compileSdk`/`targetSdk` 36, `minSdk` 24).

### Receita
Com anúncios não personalizados e tratamento de criança, o valor por exibição é bem menor e o preenchimento cai (só entram anúncios "família"). Patrocínio local costuma render mais por exibição.

## 7. Como ver os números

No console do navegador (F12) com o jogo ou `ads-test.html` aberto:
```js
__marileoAds.stats()
```
Retorna a sessão atual, o dia de hoje e os últimos 45 dias (guardados em `localStorage['marileo_ads']`). Exemplos de chave: `interstitial.race_end.house` (cartões mostrados), `interstitial.race_end.h5`, `interstitial.race_end.native` (AdMob nos apps), `campaign.padaria-pao-quente.shown`, `campaign.padaria-pao-quente.click`, `blocked.too-soon` (anúncios segurados pelas regras), `nofill.interstitial.not-ready` (o AdMob ainda não tinha anúncio carregado). Os números ficam no aparelho de cada jogador; para somar de todos os jogadores seria preciso um serviço de estatísticas (não incluído de propósito, para não coletar dados). Os números do AdMob (exibições, receita) aparecem no painel do AdMob.

## 8. Checklist do CEO — ligar o AdMob de verdade nos apps

1. **Criar a conta AdMob:** <https://admob.google.com> com a conta Google do estúdio (Marileo Studios). Preencher pagamento/impostos.
2. **Cadastrar os 2 apps** (Apps › Adicionar app): "Race Cities" **Android** (pacote `com.marileostudios.racecities`) e "Race Cities" **iOS** (ID do pacote `com.marileostudios.racecities`). Se o app ainda não estiver publicado, escolha "não está publicado" e vincule à loja depois.
3. Em cada app, ir em **Configurações do app** e marcar que o app é **direcionado a crianças / tratamento de criança** quando o AdMob perguntar, e em **Controles de bloqueio** escolher a classificação máxima **G**.
4. **Criar 2 blocos de anúncio por app** (Blocos de anúncios › Adicionar): **Intersticial** (nome sugerido `race_end`) e **Premiado** (nome sugerido `bonus`).
5. **Colar os IDs:**

   | Valor | Formato | Android (`android/ads.properties`) | iOS (`ios/project.yml`) |
   |---|---|---|---|
   | ID do app | `ca-app-pub-…~…` | `admob.appId=` | `ADMOB_APP_ID:` |
   | Bloco intersticial | `ca-app-pub-…/…` | `admob.interstitialId=` | `ADMOB_INTERSTITIAL_ID:` |
   | Bloco premiado | `ca-app-pub-…/…` | `admob.rewardedId=` | `ADMOB_REWARDED_ID:` |

   (Nenhum ID vai em `js/ads-config.js`.)
6. Em `js/ads-config.js`: `enabled: true`. Testar primeiro com `test: true` (anúncios de teste aparecem com a etiqueta "Test Ad"). Na publicação final: `test: false`. **Nunca toque em anúncios reais no seu próprio celular** (o AdMob pode bloquear a conta) — para testar com IDs reais, cadastre o seu aparelho como "dispositivo de teste" no AdMob.
7. Gerar as versões novas: GitHub › Actions › **Android** › Run workflow (APK + AAB) e **iOS** › Run workflow (TestFlight).
8. **Atualizar a política de privacidade** (`privacidade.html`): dizer que os apps mostram anúncios do Google AdMob, não personalizados e com tratamento de criança, e listar os dados da seção 6. Link do Google: <https://policies.google.com/technologies/partner-sites>.
9. **Formulários das lojas:** Google Play › Conteúdo do app › **Anúncios** = "Sim, o app contém anúncios"; **Segurança dos dados** e **Público-alvo** (seção 6); App Store Connect › **Privacidade do app** (tabela da seção 6) e categoria **fora de "Crianças"**.
10. Depois que o app Android estiver publicado, vincular a loja no AdMob e publicar o arquivo **app-ads.txt** no site do estúdio (o AdMob mostra o conteúdo exato) — o AdMob cobra isso para pagar normalmente.

---

# Apêndice técnico

## A. Arquivos

| Arquivo | Papel |
|---|---|
| `js/ads.js` | Módulo `ads` (singleton) + adaptadores `house`, `h5`, `crazygames`, `poki`, `native` |
| `js/ads-config.js` | Configuração e campanhas |
| `css/ads.css` | Visual do cartão de patrocinador (`z-index: 2000`, o jogo usa até 100) |
| `ads-test.html` | Página de teste isolada |

API:
```js
import { ads } from './ads.js';
ads.init();                                   // nunca lança; pré-carrega SDKs externos sem bloquear
const r = await ads.interstitial('race_end', { online: false });
// -> { shown: bool, provider: 'house'|'h5'|..|null, reason: 'closed'|'too-soon'|'first-race'|'disabled'|... }
const w = await ads.rewarded('bonus');        // -> { rewarded: bool, provider, reason }
ads.onPause = () => {};  ads.onResume = () => {};   // chamados quando um anúncio entra/sai da tela
ads.showing;                                  // true enquanto há anúncio na tela
ads.gameplayStart(); ads.gameplayStop();      // só faz algo em CrazyGames/Poki
ads.onOpenUrl = url => {};                    // opcional: abrir link de patrocinador fora do WebView
ads.isSoundOn = () => true;                   // opcional: informa o som ao AdSense
ads.stats();  ads.configure({...});  ads.reset();  ads.platform;
```
Motivos de bloqueio (`reason`): `disabled`, `no-ads`, `busy`, `online`, `first-race`, `session-cap`, `too-soon`, `unavailable`/`sdk-unavailable` (sem SDK/sem campanha), `timeout`, `error`, `hard-timeout`.

Se um provedor não mostrar anúncio (sem SDK, sem preenchimento, timeout), o próximo da lista é tentado; exceção: `frequency-capped` (limite do Google) não cai para o house. Toda chamada resolve dentro de limites de tempo (`loadTimeoutMs`, `startTimeoutMs`, `maxAdMs`).

## B. Integração no jogo (para o engenheiro principal)

### B1. `index.html`
No `<head>`, depois do `<link rel="stylesheet" href="css/style.css">`:
```html
<link rel="stylesheet" href="css/ads.css">
```
Não é preciso `<script>`: o módulo é importado por `main.js`. (Não há CSP no projeto. Se um dia houver, liberar `pagead2.googlesyndication.com`, `googleads.g.doubleclick.net`, `sdk.crazygames.com`, `game-cdn.poki.com`.)

### B2. `js/main.js`
Import (junto dos outros):
```js
import { ads } from './ads.js';
```

No construtor de `App` (ou logo depois de `audio` existir), uma vez:
```js
ads.onPause = () => { try { audio.ctx && audio.ctx.suspend(); } catch (e) {} };
ads.onResume = () => { try { audio.ctx && audio.ctx.resume(); } catch (e) {} };
ads.isSoundOn = () => !audio.muted;
ads.init();   // não precisa de await
```
(`audio.ctx` é o `AudioContext` de `js/audio.js`; suspender silencia tudo, inclusive música e motor, e `resume()` devolve.)

Helper novo em `App` (impede toque duplo e garante que o jogo siga mesmo se algo falhar):
```js
async _adBreak(next, cfg) {
  if (this._adBusy) return;
  this._adBusy = true;
  try { await ads.interstitial('race_end', { online: !!(cfg && cfg.online) }); } catch (e) { /* segue */ }
  this._adBusy = false;
  next();
}
```

Em `onRaceFinished(race)`, nos botões que **iniciam a próxima corrida** (o anúncio aparece ao tocar, por cima da tela de resultados, e a corrida só começa depois):
```js
// GP: próxima corrida
btn(`▶ Próxima: ${next.name}`, 'big go', () => this._adBreak(() => { this.gp.index++; this.startGPRace(); }, cfg));
// corrida avulsa
btn('🔄 Correr de novo', 'big go', () => this._adBreak(() => this.startRace(cfg), cfg));
```
Não colocar anúncio em "Ver o pódio", "Menu", "Sair", "Escolher outra pista" nem nos botões online (online já é ignorado por `skipOnline`). Alternativa: chamar `ads.interstitial` ao final de `onRaceFinished` (logo depois de `this.show('results')`), mas isso cobre os desafios/estrelas que a criança quer ler.

Gamepad/teclado — enquanto houver anúncio o jogo não pode reagir aos botões do controle (o cartão captura o teclado sozinho). No começo de `_menuInput()`:
```js
if (ads.showing) { for (const m of this.menuInputs) m.poll(); return; }
```

Portais (no-op nas outras plataformas):
- `startRace(cfg)`, no fim (depois de `this.show('race')`): `ads.gameplayStart();`
- `pause()`: `ads.gameplayStop();`   `resume()`: `ads.gameplayStart();`
- início de `onRaceFinished(race)`: `ads.gameplayStop();`
- `toMenu()`: `ads.gameplayStop();`

Links de patrocinador nos apps (o `window.open` é ignorado no WebView Android e bloqueado no iOS): depois dos hooks,
```js
ads.onOpenUrl = url => {
  if (window.AndroidApp && window.AndroidApp.openUrl) window.AndroidApp.openUrl(url);
  else if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.openurl) window.webkit.messageHandlers.openurl.postMessage(url);
  else window.open(url, '_blank', 'noopener,noreferrer');
};
```
(os dois apps já têm `openUrl` — Apêndice C1).

"Assista e ganhe" (futuro): num botão explícito, `const r = await ads.rewarded('bonus'); if (r.rewarded) { /* dar o prêmio */ }`.

### B3. `sw.js`
1. Adicionar à lista `FILES` (e subir `CACHE` para `marileo-kart-v9`):
```js
'css/ads.css', 'js/ads.js', 'js/ads-config.js',
```
mais cada imagem de patrocinador (`'ads/padaria.jpg'`).
2. **Importante:** o `fetch` do service worker hoje guarda no cache *qualquer* resposta GET, incluindo `opaque` de outros domínios. Com anúncios isso passaria a guardar scripts e respostas do Google/portais. No início do handler `fetch`, depois do `if (req.method !== 'GET') return;`, acrescentar:
```js
const u = new URL(req.url);
if (u.origin !== location.origin && !req.url.startsWith(THREE) && !/(^|\.)(jsdelivr\.net|googleapis\.com|gstatic\.com)$/.test(u.hostname)) return;
```
(deixa passar direto para a rede tudo o que for de anúncios; mantém o que o jogo já cacheia: three.js, PeerJS, fontes).

### B4. Apps (iOS e Android)
`ios/build-web.mjs` copia as pastas `css` e `js` inteiras (com subpastas), então os arquivos novos entram sozinhos nos dois apps — o app Android usa o mesmo script (o Gradle chama `node ios/build-web.mjs android/app/build/generated/webgame/www`). Se usar imagens de patrocinador, incluir a pasta `ads` na lista `['index.html', 'css', 'js', 'icons']` da linha do `cpSync`.

## C. Lado dos apps (provedor `native`) — implementado

### C1. Contrato JS ↔ app
| Momento | Android (`window.AndroidApp`) | iOS (`window.webkit.messageHandlers`) |
|---|---|---|
| `ads.init()` com `enabled: true` (uma vez por página) | `AndroidApp.prepareAds('{"test":true}')` | `ads.postMessage({action:'prepare', test:true})` |
| intervalo | `AndroidApp.showInterstitial(placement)` | `ads.postMessage({action:'interstitial', placement, test, childDirected:true})` |
| recompensa | `AndroidApp.showRewarded(placement)` | `ads.postMessage({action:'rewarded', placement, test, childDirected:true})` |
| link de patrocinador (após o portão dos pais) | `AndroidApp.openUrl(url)` | `openurl.postMessage(url)` |
| convite da sala | `AndroidApp.share(texto)` | `IOSApp.share(texto)` → `share.postMessage` |

O app responde sempre na thread principal, via `evaluateJavascript`/`evaluateJavaScript`:
- `window.__adStarted()` quando o anúncio aparece (o jogo pausa e silencia);
- **sempre** `window.__adDone({shown, rewarded, reason})`, em qualquer desfecho:

| Desfecho | `shown` | `rewarded` | `reason` | O que o jogo faz |
|---|---|---|---|---|
| intervalo visto e fechado | true | false | `dismissed` | segue |
| recompensa ganha | true | true | `rewarded` | dá o prêmio |
| recompensa fechada antes do fim | true | false | `dismissed` | sem prêmio, **não** mostra o cartão próprio |
| SDK ainda iniciando | false | false | `not-initialized` | tenta o próximo provedor (cartão próprio) |
| nenhum anúncio carregado (sem internet, sem preenchimento) | false | false | `not-ready` | idem |
| outro anúncio já na tela | false | false | `busy` | idem |
| falha ao exibir | false | false | `show-failed` | idem |

Se o app não responder em `native.startTimeoutMs` (6 s) o jogo desiste sozinho; limite total `native.timeoutMs` (90 s). Mudança no `js/ads.js` feita junto com os apps: (1) `prepareAds`/`prepare` enviado por `ads.init()`; (2) para recompensa, `{shown:true, rewarded:false}` agora conta como "anúncio mostrado sem prêmio" (antes caía para o cartão próprio). Os outros provedores não mudaram.

### C2. O que cada app faz
- Só inicia o SDK quando recebe `prepare` (ou o primeiro pedido). Então: configuração global de criança (abaixo), `MobileAds.initialize` (Android, numa thread separada) / `MobileAds.shared.start` (iOS) e **pré-carrega 1 intersticial e 1 premiado**.
- Ao mostrar, usa o anúncio já carregado (sem espera); depois de cada exibição (ou falha) **carrega o próximo**. Anúncio com mais de 55 min é descartado (validade de 1 h). Falha de carregamento: nova tentativa em 30 s, 60 s, 120 s… até 10 min.
- **Teste x real:** os blocos de **teste** do Google são usados sempre que `test: true` no `js/ads-config.js`, **ou** o build é de desenvolvimento (Android `debug` / iOS `Debug`), **ou** o ID real está vazio. O ID do **app** (`APPLICATION_ID` / `GADApplicationIdentifier`) não muda em tempo de execução: é o do arquivo de configuração.

Configuração de criança (igual nos dois):
```java
// Android — GameAds.java (play-services-ads 25.5.0)
MobileAds.setRequestConfiguration(MobileAds.getRequestConfiguration().toBuilder()
    .setAgeRestrictedTreatment(AgeRestrictedTreatment.CHILD)            // = TFCD true + TFUA true
    .setMaxAdContentRating(RequestConfiguration.MAX_AD_CONTENT_RATING_G)
    .setPublisherPrivacyPersonalizationState(RequestConfiguration.PublisherPrivacyPersonalizationState.DISABLED)
    .build());
```
```swift
// iOS — GameAds.swift (GoogleMobileAds 13.x)
let rc = MobileAds.shared.requestConfiguration
rc.ageRestrictedTreatment = .child                      // = TFCD true + TFUA true
rc.maxAdContentRating = GADMaxAdContentRating.general
rc.publisherPrivacyPersonalizationState = .disabled
rc.coarseLocationCollectionEnabled = false
```
Por que não `setTagForChildDirectedTreatment` / `tagForUnderAgeOfConsent`: nas versões atuais (Android 25.x, iOS 13.x) eles estão **obsoletos**; a documentação do Google (*admob/android/targeting* e *admob/ios/targeting*, consultadas em 13/11/2026) manda migrar para a "age treatment", e a tabela de migração diz que `TAG_FOR_CHILD_DIRECTED_TREATMENT_TRUE` e `TAG_FOR_UNDER_AGE_OF_CONSENT_TRUE` equivalem a `CHILD`.

### C3. Android
- Projeto Gradle em `android/` (AGP 8.13.2, Gradle 8.14.3 pelo wrapper, Java 17, `compileSdk`/`targetSdk` 36, `minSdk` 24, pacote `com.marileostudios.racecities`, nome "Race Cities").
- Código: `android/app/src/main/java/com/marileostudios/racecities/MainActivity.java` (WebView, ponte `AndroidApp`, voltar, tela cheia) e `GameAds.java` (AdMob).
- Dependências: `com.google.android.gms:play-services-ads:25.5.0`, `androidx.webkit:webkit:1.18.0`.
- **IDs:** `android/ads.properties` (ou variáveis de ambiente `ADMOB_APP_ID`, `ADMOB_INTERSTITIAL_ID`, `ADMOB_REWARDED_ID`). O ID do app vai para o manifesto (`com.google.android.gms.ads.APPLICATION_ID`, via `manifestPlaceholders`); os dos blocos viram recursos `@string/admob_interstitial_id` / `admob_rewarded_id`.
- **Permissões removidas** do manifesto final (`tools:node="remove"`): `com.google.android.gms.permission.AD_ID` (a Política para Famílias diz que apps só para crianças não devem pedi-la com API 33+, e apps com crianças no público não podem transmitir o AAID de crianças/idade desconhecida), `ACCESS_ADSERVICES_AD_ID`, `ACCESS_ADSERVICES_TOPICS` (anúncios por interesse) e `ACCESS_ADSERVICES_ATTRIBUTION`. Sem `AD_ID`, o SDK manda um ID zerado — os anúncios continuam funcionando, sem identificar o aparelho.
- **O jogo vai dentro do APK** (como no iOS): o Gradle roda `node ios/build-web.mjs app/build/generated/webgame/www` e a pasta vira `assets/www`. O `WebViewAssetLoader` entrega os arquivos em `https://appassets.androidplatform.net/assets/www/index.html` — endereço https "de verdade", então **módulos ES, localStorage e WebRTC (modo online)** funcionam e o jogo abre **sem internet**. Links de convite `https://mmsmartinelli.github.io/jogo-marileo/?sala=ABCD` abrem a cópia local com `?sala=ABCD`; no compartilhamento o app troca o endereço local pelo do site. O service worker do site é bloqueado dentro do app (os arquivos já estão no aparelho). Para voltar ao modo antigo (abrir o site): `./gradlew assembleDebug -PremoteGame=true`.
- Voltar: com `targetSdk` 36 o Android não chama mais `onBackPressed` — o app usa `OnBackInvokedCallback` (Android 13+) e `onBackPressed` nos antigos; em ambos chama `window.androidBack()` e, no menu, dois toques fecham o app.
- **Assinatura:** `ANDROID_KEYSTORE_FILE`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD` (ambiente ou propriedades do Gradle). Sem elas a versão `release` é assinada com a chave de depuração (não falha, mas não serve para a loja). Versão: `VERSION_CODE`/`VERSION_NAME` (ambiente) ou `appVersionCode`/`appVersionName` em `android/gradle.properties`.
- Nuvem: `.github/workflows/android.yml` (APK de teste a cada push; APK + AAB assinados no "Run workflow"; segredos `ANDROID_KEYSTORE_B64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`).

### C4. iOS
- Pacote Swift `GoogleMobileAds` (`github.com/googleads/swift-package-manager-google-mobile-ads`, "até a próxima versão principal" a partir de 13.12.0) declarado em `ios/project.yml`; nome do app "Race Cities", ID do pacote `com.marileostudios.racecities` (pastas/alvo/esquema continuam `MarileoKart`).
- Código: `ios/MarileoKart/GameAds.swift` (AdMob) e os manipuladores `ads`/`openurl` em `MarileoKartApp.swift`.
- **IDs:** `ios/project.yml` → `ADMOB_APP_ID` (vira `GADApplicationIdentifier` no Info.plist), `ADMOB_INTERSTITIAL_ID`, `ADMOB_REWARDED_ID`.
- Info.plist: `GADApplicationIdentifier`, a lista `SKAdNetworkItems` exigida pelo Google (50 itens copiados do guia de início rápido em 13/11/2026; o Google atualiza essa lista de tempos em tempos) e **nenhum** `NSUserTrackingUsageDescription` (sem ATT).
- Nuvem: `.github/workflows/ios.yml` baixa o pacote (`-resolvePackageDependencies`) antes de compilar.

### IDs de teste oficiais do Google
| | Android | iOS |
|---|---|---|
| App ID | `ca-app-pub-3940256099942544~3347511713` | `ca-app-pub-3940256099942544~1458002511` |
| Intervalo (interstitial) | `ca-app-pub-3940256099942544/1033173712` | `ca-app-pub-3940256099942544/4411468910` |
| Recompensa (rewarded) | `ca-app-pub-3940256099942544/5224354917` | `ca-app-pub-3940256099942544/1712485313` |

## D. Detalhes do adaptador H5 (AdSense)
Segue a "Ad Placement API": `adBreak({type:'next', name, beforeAd, afterAd, adBreakDone})` para intervalos entre corridas e `type:'reward'` com `beforeReward(showAdFn)`/`adViewed`/`adDismissed` para recompensa; `adConfig({preloadAdBreaks:'on', sound})`. O script é inserido com `data-ad-client`, `data-adbreak-test="on"` (quando `test:true`), `data-tag-for-child-directed-treatment="1"`, `data-tag-for-age-treatment="1"` (nome novo; o Google avisa no console que o antigo está obsoleto), `data-tag-for-under-age-of-consent="1"` e `data-ad-frequency-hint`. Pré-requisito: o site precisa estar aprovado no AdSense com H5 Games Ads.

## E. Testes
`ads-test.html` (manual) e o roteiro automatizado usado no desenvolvimento cobrem: cartão house, contagem 5→0, resolução da promessa, limite de frequência, `enabled:false`, janela de datas, falha/bloqueio de SDK com queda para house, offline, portão dos pais, layout 667×320 e 1280×720, adaptadores de portal/AdSense/nativo contra SDKs simulados — e o contrato dos apps (C1) com as mensagens exatas que `GameAds.java`/`GameAds.swift` mandam: `prepare` uma vez, `test` repassado, recompensa fechada antes do fim, `not-ready` caindo para o cartão próprio, nada enviado ao app com `enabled:false`. Nos aparelhos: os anúncios de teste do Google mostram a etiqueta "Test Ad".
