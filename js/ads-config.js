// Race Cities — configuração dos anúncios.
// É AQUI que o estúdio liga/desliga os anúncios e cadastra patrocinadores.
// Guia completo (em português): docs/ANUNCIOS.md
//
// IMPORTANTE: o jogo é para crianças. Mantenha as opções de "childDirected" ligadas.

export const ADS_CONFIG = {
  // ===== CHAVE GERAL =====
  // false = nenhum anúncio aparece, em nenhuma plataforma. Troque para true para ligar.
  enabled: false,

  // true = anúncios de TESTE (sem dinheiro real). Troque para false só na publicação final.
  test: true,

  // ===== REGRAS =====
  minSecondsBetween: 90,   // intervalo mínimo entre dois anúncios de intervalo
  everyNRaces: 2,          // anúncio só a cada N corridas (2 = depois da 2ª, 4ª, 6ª...; 1 = toda corrida)
  skipFirstRace: true,     // nenhum anúncio depois da 1ª corrida da sessão
  maxPerSession: 8,        // máximo de anúncios por sessão (0 = sem limite)
  skipOnline: true,        // sem anúncio em salas online (os outros jogadores estão esperando)
  rewardedEnabled: true,   // permite o "assista e ganhe" (só quando o jogador escolhe)
  // O jogador que "remover anúncios" (compra futura) grava localStorage 'marileo_noads' = '1'.

  // ===== PLATAFORMA =====
  // 'auto' detecta: app (Android/iOS) -> 'native'; crazygames.com -> 'crazygames'; poki.com -> 'poki'; resto -> 'web'.
  // Para forçar: 'native' | 'crazygames' | 'poki' | 'web'
  platform: 'auto',

  // Ordem de tentativa em cada plataforma. Se o primeiro não mostrar nada, tenta o próximo.
  // Provedores: 'native', 'h5', 'crazygames', 'poki', 'house'
  providers: {
    native: ['native', 'house'],
    crazygames: ['crazygames'],   // portais proíbem anúncio próprio misturado
    poki: ['poki'],
    web: ['h5', 'house'],
  },

  // ===== TEMPOS DE SEGURANÇA (nada trava o jogo) =====
  loadTimeoutMs: 5000,      // carregar o SDK externo
  startTimeoutMs: 4000,     // o anúncio precisa começar em até X ms, senão desiste
  maxAdMs: 90000,           // duração máxima de um anúncio externo

  // ===== GOOGLE ADSENSE PARA JOGOS (H5 Games Ads) =====
  h5: {
    client: 'ca-pub-XXXXXXXXXXXXXXXX', // <- ID do AdSense (troque pelo real)
    childDirected: true,               // tratamento para crianças (data-tag-for-child-directed-treatment)
    underAgeOfConsent: true,           // data-tag-for-under-age-of-consent
    nonPersonalized: true,             // anúncios não personalizados
    frequencyHint: '60s',              // data-ad-frequency-hint ('30s', '60s', ...)
    // A classificação máxima "G" (livre) é escolhida no painel do AdSense
    // (Bloqueio de anúncios > classificação de conteúdo). Veja docs/ANUNCIOS.md.
  },

  // ===== PORTAIS =====
  crazygames: { scriptUrl: 'https://sdk.crazygames.com/crazygames-sdk-v3.js' },
  poki: { scriptUrl: 'https://game-cdn.poki.com/scripts/v2/poki-sdk.js' },

  // ===== APP (Android/iOS) =====
  native: {
    timeoutMs: 90000,       // espera máxima pelo retorno do app (window.__adDone)
    startTimeoutMs: 6000,   // o app precisa chamar window.__adStarted() ou window.__adDone() em até X ms
    // Os apps (Google AdMob) NÃO precisam de nenhum ID aqui. Os IDs ficam:
    //   Android: android/ads.properties      iOS: ios/project.yml (ADMOB_*)
    // Com `enabled: true` o jogo avisa o app (ads.init) e só então o app liga o SDK do Google.
    // Com `test: true` (ou numa versão de desenvolvimento) o app usa SEMPRE os blocos de teste
    // do Google, mesmo que os IDs reais já estejam colocados.
    // Para mostrar anúncios SÓ nos apps (e nada no site): providers.web: [] (ou ['house']).
    // IDs de TESTE oficiais do Google, só para referência:
    testIds: {
      androidInterstitial: 'ca-app-pub-3940256099942544/1033173712',
      androidRewarded: 'ca-app-pub-3940256099942544/5224354917',
      iosInterstitial: 'ca-app-pub-3940256099942544/4411468910',
      iosRewarded: 'ca-app-pub-3940256099942544/1712485313',
    },
  },

  // ===== ANÚNCIOS PRÓPRIOS (patrocinadores locais e divulgação) =====
  house: {
    countdown: 5,          // segundos até aparecer o botão "Continuar"
    maxMs: 60000,          // fecha sozinho depois disso (segurança)
    gateHoldMs: 3000,      // tempo segurando o botão no "portão dos pais"
    sponsorLabel: 'Patrocinado',
  },

  // Cada campanha:
  //   id       nome único, sem espaços (aparece nas estatísticas)
  //   title    título grande
  //   text     frase curta
  //   image    (opcional) caminho de imagem, ex.: 'ads/padaria.jpg'. Sem imagem = cartão de texto.
  //   url      (opcional) site do patrocinador (https://...). Só abre depois do portão dos pais.
  //   linkLabel(opcional) texto do botão do link. Padrão: 'Saiba mais'
  //   weight   peso do sorteio (maior = aparece mais). Padrão 1
  //   start/end(opcional) datas 'AAAA-MM-DD' (início e fim, inclusive)
  //   enabled  (opcional) false = desligada
  houseCampaigns: [
    {
      id: 'marileo-online',
      title: 'Jogue com os amigos!',
      text: 'Crie uma sala online e corra com a turma toda.',
      weight: 1,
    },
    // EXEMPLO de comércio local (desligado). Copie, edite e coloque enabled: true.
    {
      id: 'exemplo-padaria',
      title: 'Padaria Pão Quente',
      text: 'Pão fresquinho todo dia às 6h! Rua das Flores, 123.',
      image: '',
      url: 'https://exemplo.com.br',
      linkLabel: 'Conhecer a padaria',
      weight: 3,
      start: '2026-12-01',
      end: '2026-12-31',
      enabled: false,
    },
  ],
};

export default ADS_CONFIG;
