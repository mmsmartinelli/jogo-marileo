# Anúncios no Marileo Kart — guia

Este guia tem duas partes: a primeira é para quem decide (CEO, sem precisar programar); o **Apêndice técnico** no fim é para o engenheiro que liga o módulo ao jogo.

> **Situação hoje:** os anúncios estão **prontos, mas DESLIGADOS** (`enabled: false`). Enquanto ninguém mudar isso, o jogo se comporta exatamente como antes. Além disso, o módulo ainda **não está ligado ao jogo** — falta o engenheiro seguir o Apêndice B.

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
| **Google AdMob (apps)** | Conta AdMob, um app Android e um iOS cadastrados, e 2 blocos de anúncio por app (intervalo e recompensa). | No código nativo dos apps (Apêndice C); os IDs de teste estão em `native.testIds` só como lembrete |
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

Configurado por padrão (`js/ads-config.js`):
- **Tratamento voltado a crianças** no Google (`childDirected: true` → `data-tag-for-child-directed-treatment`) e **menores de idade** (`underAgeOfConsent: true`).
- **Anúncios não personalizados** (`nonPersonalized: true`). Nenhum dado pessoal é usado.
- `data-ad-frequency-hint` = 60 s (o Google limita a frequência).
- Nos apps: `tagForChildDirectedTreatment`, `tagForUnderAgeOfConsent` e **classificação máxima "G"** (Apêndice C).
- **Classificação "G" no site (AdSense):** é configurada no **painel do AdSense** (Bloqueio de controles > conteúdo sensível/categorias). Faça isso manualmente.
- Nosso código **não coleta nada**: só guarda contadores locais ("quantos anúncios hoje") no aparelho, sem identificar ninguém.
- Links de patrocinador atrás de **portão dos pais**; só aceitam `http`/`https`.
- Anúncio nunca aparece durante a corrida.

**Atenção legal (ver riscos):** jogos para crianças têm regras próprias na Google Play (Política para Famílias), na App Store (Categoria Crianças) e leis como LGPD (art. 14), COPPA e ECA Digital. Antes de publicar anúncios nos apps, confirme com o jurídico e **atualize `privacidade.html`** informando que há anúncios e quem os fornece.

## 6. Pontos de risco para decidir
1. **App Store, categoria "Crianças":** praticamente proíbe anúncios de terceiros. Se o app iOS estiver nessa categoria, use só patrocinadores próprios (`providers.native: ['house']`) ou saia da categoria.
2. **Google Play (Famílias):** só pode usar SDKs de anúncio certificados para famílias (AdMob com as configurações acima serve). O app Android hoje é compilado por script, sem Gradle — adicionar AdMob exige migrar para Gradle.
3. **Receita:** com anúncios não personalizados para crianças o valor por exibição é bem menor. Patrocínio local costuma render mais por exibição.

## 7. Como ver os números

No console do navegador (F12) com o jogo ou `ads-test.html` aberto:
```js
__marileoAds.stats()
```
Retorna a sessão atual, o dia de hoje e os últimos 45 dias (guardados em `localStorage['marileo_ads']`). Exemplos de chave: `interstitial.race_end.house` (cartões mostrados), `interstitial.race_end.h5`, `campaign.padaria-pao-quente.shown`, `campaign.padaria-pao-quente.click`, `blocked.too-soon` (anúncios segurados pelas regras). Os números ficam no aparelho de cada jogador; para somar de todos os jogadores seria preciso um serviço de estatísticas (não incluído de propósito, para não coletar dados).

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
(precisa de `openUrl` nos apps — Apêndice C; é opcional: sem ele, só o site/PC abre links).

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

### B4. iOS
`ios/build-web.mjs` copia as pastas `css` e `js` inteiras, então os arquivos novos entram sozinhos. Se usar imagens de patrocinador, incluir a pasta `ads` na lista `['index.html', 'css', 'js', 'icons']` da linha do `cpSync`.

## C. Lado dos apps (provedor `native`)

Contrato JS ↔ app:
- JS chama `AndroidApp.showInterstitial(placement)` / `AndroidApp.showRewarded(placement)` (Android) ou `window.webkit.messageHandlers.ads.postMessage({action:'interstitial'|'rewarded', placement, test, childDirected:true})` (iOS).
- O app deve chamar **`window.__adStarted()`** quando o anúncio aparecer (se não chamar nem `__adDone` em `native.startTimeoutMs`=6 s, o jogo desiste e usa o cartão próprio) e **sempre** terminar com **`window.__adDone(result)`**, inclusive quando não há anúncio: `{shown:true}` / `{shown:false, reason:'not-ready'}`; para recompensa `{rewarded:true|false}`. (Também aceita `true`/`false` ou JSON em string.) Limite de segurança: `native.timeoutMs`=90 s.
- Detecção: o provedor é usado se existir `window.AndroidApp.showInterstitial` ou `window.webkit.messageHandlers.ads`.

### Android (Java, WebView + Google Mobile Ads SDK)
Dependência (Gradle): `implementation 'com.google.android.gms:play-services-ads:23.+'` (use a versão atual). `AndroidManifest.xml`, dentro de `<application>`:
```xml
<meta-data android:name="com.google.android.gms.ads.APPLICATION_ID"
           android:value="ca-app-pub-3940256099942544~3347511713"/> <!-- ID de TESTE; troque pelo real -->
```
`MainActivity.onCreate` (antes de carregar a página): configuração **voltada a crianças**:
```java
MobileAds.setRequestConfiguration(new RequestConfiguration.Builder()
    .setTagForChildDirectedTreatment(RequestConfiguration.TAG_FOR_CHILD_DIRECTED_TREATMENT_TRUE)
    .setTagForUnderAgeOfConsent(RequestConfiguration.TAG_FOR_UNDER_AGE_OF_CONSENT_TRUE)
    .setMaxAdContentRating(RequestConfiguration.MAX_AD_CONTENT_RATING_G)
    .build());
MobileAds.initialize(this, s -> { loadInterstitial(); loadRewarded(); });
```
Pedido de anúncio sempre **não personalizado**: `new AdRequest.Builder().addNetworkExtrasBundle(AdMobAdapter.class, bundle_com_npa_1).build()` (`bundle.putString("npa","1")`).

Na classe `Bridge` (o objeto de `addJavascriptInterface(..., "AndroidApp")`):
```java
private InterstitialAd interstitial; private RewardedAd rewarded;
static final String INTERSTITIAL_ID = "ca-app-pub-3940256099942544/1033173712"; // TESTE
static final String REWARDED_ID     = "ca-app-pub-3940256099942544/5224354917"; // TESTE

private void js(String code) { runOnUiThread(() -> web.evaluateJavascript(code, null)); }
private void done(String json) { js("window.__adDone && window.__adDone(" + json + ")"); }

private void loadInterstitial() {
  InterstitialAd.load(MainActivity.this, INTERSTITIAL_ID, childSafeRequest(), new InterstitialAdLoadCallback() {
    @Override public void onAdLoaded(InterstitialAd ad) { interstitial = ad; }
    @Override public void onAdFailedToLoad(LoadAdError e) { interstitial = null; }
  });
}

@JavascriptInterface public void showInterstitial(String placement) {
  runOnUiThread(() -> {
    InterstitialAd ad = interstitial;
    if (ad == null) { done("{\"shown\":false,\"reason\":\"not-ready\"}"); loadInterstitial(); return; }
    interstitial = null;
    ad.setFullScreenContentCallback(new FullScreenContentCallback() {
      @Override public void onAdShowedFullScreenContent() { js("window.__adStarted && window.__adStarted()"); }
      @Override public void onAdDismissedFullScreenContent() { done("{\"shown\":true}"); loadInterstitial(); }
      @Override public void onAdFailedToShowFullScreenContent(AdError e) { done("{\"shown\":false,\"reason\":\"show-failed\"}"); loadInterstitial(); }
    });
    ad.show(MainActivity.this);
  });
}

@JavascriptInterface public void showRewarded(String placement) {
  runOnUiThread(() -> {
    RewardedAd ad = rewarded;
    if (ad == null) { done("{\"rewarded\":false,\"reason\":\"not-ready\"}"); loadRewarded(); return; }
    rewarded = null;
    final boolean[] earned = { false };
    ad.setFullScreenContentCallback(new FullScreenContentCallback() {
      @Override public void onAdShowedFullScreenContent() { js("window.__adStarted && window.__adStarted()"); }
      @Override public void onAdDismissedFullScreenContent() { done("{\"rewarded\":" + earned[0] + "}"); loadRewarded(); }
      @Override public void onAdFailedToShowFullScreenContent(AdError e) { done("{\"rewarded\":false}"); loadRewarded(); }
    });
    ad.show(MainActivity.this, item -> earned[0] = true);
  });
}

// links de patrocinador (chamado só depois do portão dos pais)
@JavascriptInterface public void openUrl(String url) {
  if (!url.startsWith("https://") && !url.startsWith("http://")) return;
  runOnUiThread(() -> { try { startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url))); } catch (Exception e) {} });
}
```
(`loadRewarded` é igual a `loadInterstitial` com `RewardedAd.load`.) Métodos de `@JavascriptInterface` rodam fora da thread principal: por isso o `runOnUiThread`. Em produção (`test:false`) troque os IDs pelos do AdMob.

### iOS (Swift, WKWebView + Google Mobile Ads SDK)
Swift Package / CocoaPods: `GoogleMobileAds` (v11+: tipos `MobileAds`, `InterstitialAd`, `RewardedAd`; versões antigas usam o prefixo `GAD`). `Info.plist`:
```xml
<key>GADApplicationIdentifier</key><string>ca-app-pub-3940256099942544~1458002511</string> <!-- TESTE -->
```
(mais a lista `SKAdNetworkItems` do Google). Como os anúncios são não personalizados, **não** peça ATT.

Inicialização (por exemplo em `viewDidLoad`, antes de carregar a página):
```swift
let rc = MobileAds.shared.requestConfiguration
rc.tagForChildDirectedTreatment = true
rc.tagForUnderAgeOfConsent = true
rc.maxAdContentRating = .general
MobileAds.shared.start { _ in self.loadInterstitial(); self.loadRewarded() }
```
Ponte (junto de `"share"`):
```swift
config.userContentController.add(WeakHandler(self), name: "ads")
config.userContentController.add(WeakHandler(self), name: "openurl")

// em userContentController(_:didReceive:)
if message.name == "ads", let d = message.body as? [String: Any], let action = d["action"] as? String {
    action == "rewarded" ? showRewarded() : showInterstitial()
}
if message.name == "openurl", let s = message.body as? String, let u = URL(string: s), ["http","https"].contains(u.scheme) {
    UIApplication.shared.open(u)
}

let interstitialID = "ca-app-pub-3940256099942544/4411468910" // TESTE
let rewardedID     = "ca-app-pub-3940256099942544/1712485313" // TESTE

private func done(_ json: String) { web.evaluateJavaScript("window.__adDone && window.__adDone(\(json))", completionHandler: nil) }

func loadInterstitial() {
    let req = Request(); let extras = Extras(); extras.additionalParameters = ["npa": "1"]; req.register(extras)
    InterstitialAd.load(with: interstitialID, request: req) { ad, _ in self.interstitial = ad; ad?.fullScreenContentDelegate = self }
}
func showInterstitial() {
    guard let ad = interstitial else { done("{\"shown\":false,\"reason\":\"not-ready\"}"); loadInterstitial(); return }
    interstitial = nil; lastKind = "interstitial"
    ad.present(from: self)   // adDidPresentFullScreenContent -> __adStarted; adDidDismissFullScreenContent -> __adDone({shown:true})
}
func showRewarded() {
    guard let ad = rewarded else { done("{\"rewarded\":false,\"reason\":\"not-ready\"}"); loadRewarded(); return }
    rewarded = nil; lastKind = "rewarded"; earned = false
    ad.present(from: self) { self.earned = true }
}
// FullScreenContentDelegate
func adDidPresentFullScreenContent(_ ad: FullScreenPresentingAd) { web.evaluateJavaScript("window.__adStarted && window.__adStarted()", completionHandler: nil) }
func adDidDismissFullScreenContent(_ ad: FullScreenPresentingAd) {
    done(lastKind == "rewarded" ? "{\"rewarded\":\(earned)}" : "{\"shown\":true}")
    loadInterstitial(); loadRewarded()
}
func ad(_ ad: FullScreenPresentingAd, didFailToPresentFullScreenContentWithError e: Error) { done("{\"shown\":false,\"rewarded\":false,\"reason\":\"show-failed\"}") }
```
(`loadRewarded` análogo com `RewardedAd.load`.) Os nomes exatos variam entre versões do SDK; confira na documentação da versão usada. Lembrete: a categoria "Crianças" da App Store restringe anúncios de terceiros (seção 6).

### IDs de teste oficiais do Google
| | Android | iOS |
|---|---|---|
| App ID | `ca-app-pub-3940256099942544~3347511713` | `ca-app-pub-3940256099942544~1458002511` |
| Intervalo (interstitial) | `ca-app-pub-3940256099942544/1033173712` | `ca-app-pub-3940256099942544/4411468910` |
| Recompensa (rewarded) | `ca-app-pub-3940256099942544/5224354917` | `ca-app-pub-3940256099942544/1712485313` |

## D. Detalhes do adaptador H5 (AdSense)
Segue a "Ad Placement API": `adBreak({type:'next', name, beforeAd, afterAd, adBreakDone})` para intervalos entre corridas e `type:'reward'` com `beforeReward(showAdFn)`/`adViewed`/`adDismissed` para recompensa; `adConfig({preloadAdBreaks:'on', sound})`. O script é inserido com `data-ad-client`, `data-adbreak-test="on"` (quando `test:true`), `data-tag-for-child-directed-treatment="1"`, `data-tag-for-age-treatment="1"` (nome novo; o Google avisa no console que o antigo está obsoleto), `data-tag-for-under-age-of-consent="1"` e `data-ad-frequency-hint`. Pré-requisito: o site precisa estar aprovado no AdSense com H5 Games Ads.

## E. Testes
`ads-test.html` (manual) e o roteiro automatizado usado no desenvolvimento cobrem: cartão house, contagem 5→0, resolução da promessa, limite de frequência, `enabled:false`, janela de datas, falha/bloqueio de SDK com queda para house, offline, portão dos pais, layout 667×320 e 1280×720, adaptadores de portal/AdSense/nativo contra SDKs simulados.
