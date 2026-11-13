// "Kits" de cidade: tudo o que define o jeito de cada cidade do Race Cities
// (cores, hora do dia, prédios, plantas, obstáculos, música, marcos e nomes de pista).
// Este arquivo é só de dados (não usa o three.js): o gerador de pistas (trackgen.js)
// também roda no Node para os testes. Quem monta o 3D é js/cities/build.js.
//
// Nenhum nome de empresa ou marca real: placas e lojas são todas inventadas.

// ---------- Cores do céu por hora do dia ----------
const NIGHT = {
  skyTop: '#060a24', skyHorizon: '#2c3a72', skyBottom: '#141a3a', sun: '#b8c4ff', sunDir: [0.3, 0.75, -0.4],
  fog: '#1c2448', fogNear: 140, fogFar: 700, hemiSky: '#8a9ad8', hemiGround: '#2a2a40',
  stars: true, clouds: false, sunI: 1.5, hemiI: 1.0, glow: 1.25,
};
const SUNSET = {
  skyTop: '#3b3a8a', skyHorizon: '#ff9e6b', sun: '#ffc48a',
  fog: '#c9958f', fogNear: 170, fogFar: 760, hemiSky: '#ffc8a8', glow: 0.8,
};

// Cores comuns das ruas
const ASPHALT = { road: '#4a4b53', roadSpeckle: ['#5a5b63', '#3c3d44', '#6a6a72'] };
const PAVED = ['#9a9a9c', '#8e8e91', '#a6a6a6', '#86868a', '#b0aea8'];
const SIDEWALK = ['#c4c0b6', '#b8b4ac', '#d0ccc2'];

export const TIMES = ['dia', 'tarde', 'noite'];
export const TIME_LABEL = { dia: 'de Dia', tarde: 'ao Pôr do Sol', noite: 'à Noite' };

export const KITS = {
  osasco: {
    name: 'Osasco', flag: '🇧🇷', country: 'Brasil', emoji: '🌭',
    times: { dia: 0.4, tarde: 0.45, noite: 0.15 },
    sky: {
      skyTop: '#3f86e0', skyHorizon: '#cfe6ff', skyBottom: '#7a7a80', sun: '#fff4d6', sunDir: [-0.5, 0.75, -0.45],
      fog: '#c3d3e6', fogNear: 190, fogFar: 800, hemiSky: '#d6e6ff', hemiGround: '#6a6a65', glow: 0.18,
    },
    sunset: { skyTop: '#2b2f7a', skyHorizon: '#ff9e6b', skyBottom: '#5a4a5e', sunDir: [-0.55, 0.28, -0.6], fog: '#b98a95', hemiSky: '#c7b8ff', hemiGround: '#6a5a55', glow: 0.9 },
    theme: {
      ...ASPHALT, curbA: '#ff3fbf', curbB: '#ffffff', wallA: '#ffffff', wallB: '#8a8f9a',
      ground: PAVED, shoulder: SIDEWALK, terrainColor: '#a19e98', mountainColor: '#5f8a4f', clouds: true,
      hills: [330, 520, 45],
    },
    buildings: { types: ['office', 'res', 'glass'], heights: [[10, 26], [18, 42], [26, 64]], far: [30, 90], roof: 'tank', density: 1 },
    trees: 'broadleaf', lamps: 'modern', props: ['bancas'],
    obstacles: { barrel: ['dogcart'], puddle: ['poop', 'water'], geyser: 'water', pigeons: 2 },
    landmarks: [{ id: 'ponteRosa', hero: true }, { id: 'dogao' }, { id: 'pracaPombos' }, { id: 'estacao' }, { id: 'bancoLeao' }],
    names: ['Circuito da Ponte', 'Volta do Dogão', 'Avenida dos Pombos', 'Corrida da Estação'],
    music: { scales: ['major', 'major', 'minorPent'], root: [57, 62], tempo: [134, 146] },
  },

  rio: {
    name: 'Rio de Janeiro', short: 'Rio', flag: '🇧🇷', country: 'Brasil', emoji: '🏖️',
    times: { dia: 0.6, tarde: 0.3, noite: 0.1 },
    sky: {
      skyTop: '#1f7ae0', skyHorizon: '#bfe8ff', skyBottom: '#6aa0b8', sun: '#fff2cf', sunDir: [0.45, 0.8, 0.35],
      fog: '#bfe0f0', fogNear: 220, fogFar: 900, hemiSky: '#d6eeff', hemiGround: '#7a8a6a', glow: 0.15,
    },
    theme: {
      ...ASPHALT, curbA: '#ffd23f', curbB: '#1f9e4a', wallA: '#ffffff', wallB: '#2f7bff',
      ground: PAVED, shoulder: ['#f2efe6', '#2a2a2e'], sidewalk: 'waves', terrainColor: '#9aa09a', mountainColor: '#3f8a46', clouds: true,
      hills: [140, 340, 120], water: { color: '#1f8fc0', beach: '#f1dca0', beachW: 34 },
    },
    buildings: { types: ['res', 'res2', 'office'], heights: [[12, 30], [18, 44], [24, 60]], far: [24, 70], roof: 'flat', density: 0.9 },
    trees: 'palm', lamps: 'modern', props: ['guardasois', 'quiosques'],
    obstacles: { barrel: ['bonde'], puddle: ['water', 'poop'], geyser: 'water', pigeons: 1 },
    landmarks: [{ id: 'cristo', hero: true }, { id: 'paoDeAcucar' }, { id: 'arcosLapa' }],
    names: ['Circuito do Cristo', 'Volta de Copacabana', 'Avenida da Praia', 'Ladeira do Bondinho', 'Grande Prêmio da Orla'],
    music: { scales: ['major', 'major', 'mixolydian'], root: [60, 65], tempo: [140, 152] },
  },

  paris: {
    name: 'Paris', flag: '🇫🇷', country: 'França', emoji: '🥐',
    times: { dia: 0.45, tarde: 0.4, noite: 0.15 },
    sky: {
      skyTop: '#4a86d6', skyHorizon: '#e6eefc', skyBottom: '#8a8a90', sun: '#fff1d8', sunDir: [-0.4, 0.75, 0.5],
      fog: '#d6dcea', fogNear: 200, fogFar: 820, hemiSky: '#e6ecff', hemiGround: '#7a7266', glow: 0.18,
    },
    sunset: { skyTop: '#3b4a9a', skyHorizon: '#ffb08a', sun: '#ffd0a0', fog: '#d6a8a6', hemiSky: '#ffd6c0' },
    theme: {
      road: '#55545a', roadSpeckle: ['#64636a', '#47464c', '#73727a'], curbA: '#2f5fd0', curbB: '#ffffff', wallA: '#ffffff', wallB: '#e8262a',
      ground: ['#b9ad98', '#ada28e', '#c2b7a2', '#a69a86', '#cabfa9'], shoulder: ['#cfc6b4', '#c2b9a6', '#d8d0bf'], sidewalk: 'cobble',
      terrainColor: '#b0a690', mountainColor: '#6f8a5a', clouds: true, hills: [300, 500, 40],
    },
    buildings: { types: ['haussmann', 'haussmann2'], heights: [[16, 22], [16, 24], [18, 26]], far: [16, 30], roof: 'mansard', density: 1.15, tints: ['#fff6e6', '#f6ead2', '#fbf1df', '#efe2c8'] },
    trees: 'plane', lamps: 'classic', props: ['cafes'],
    obstacles: { barrel: ['crepe'], puddle: ['water', 'poop'], geyser: 'water', pigeons: 2 },
    landmarks: [{ id: 'eiffel', hero: true }, { id: 'arcoTriunfo' }, { id: 'piramideVidro' }, { id: 'basilicaMorro' }],
    names: ['Circuito da Torre', 'Volta do Arco', 'Avenida dos Cafés', 'Grande Prêmio do Rio Sena', 'Passeio dos Croissants'],
    music: { scales: ['major', 'mixolydian'], root: [62, 67], tempo: [126, 138] },
  },

  londres: {
    name: 'Londres', flag: '🇬🇧', country: 'Reino Unido', emoji: '💂',
    times: { dia: 0.55, tarde: 0.25, noite: 0.2 },
    sky: {
      skyTop: '#6f8fb8', skyHorizon: '#dfe6ee', skyBottom: '#7a7a80', sun: '#f4f0e6', sunDir: [0.35, 0.7, -0.5],
      fog: '#c9d0da', fogNear: 160, fogFar: 700, hemiSky: '#dde4ee', hemiGround: '#6a6a66', glow: 0.25,
    },
    weather: { kind: 'rain', chance: 0.35 },
    theme: {
      road: '#47484f', roadSpeckle: ['#55565e', '#3a3b42', '#62636a'], curbA: '#d6202a', curbB: '#ffffff', wallA: '#ffffff', wallB: '#1f3fa0',
      ground: PAVED, shoulder: ['#b8b6b0', '#aeaca6', '#c4c2bb'], terrainColor: '#9a9894', mountainColor: '#5f7a52', clouds: true, hills: [320, 520, 35],
    },
    buildings: { types: ['brick', 'stone', 'glass'], heights: [[12, 22], [14, 30], [20, 56]], far: [20, 70], roof: 'gable', density: 1.05 },
    trees: 'plane', lamps: 'classic', props: ['cabines'],
    obstacles: { barrel: ['bus'], puddle: ['water', 'poop'], geyser: 'water', pigeons: 1 },
    landmarks: [{ id: 'bigBen', hero: true }, { id: 'rodaGigante' }, { id: 'ponteTorres' }],
    names: ['Circuito do Relógio', 'Volta da Roda Gigante', 'Grande Prêmio do Tâmisa', 'Avenida dos Ônibus Vermelhos', 'Passeio da Rainha'],
    music: { scales: ['mixolydian', 'major'], root: [60, 64], tempo: [128, 140] },
  },

  novayork: {
    name: 'Nova York', flag: '🇺🇸', country: 'Estados Unidos', emoji: '🗽',
    times: { dia: 0.4, tarde: 0.3, noite: 0.3 },
    sky: {
      skyTop: '#2f74d0', skyHorizon: '#d2e6fa', skyBottom: '#7a8090', sun: '#fff4dc', sunDir: [0.5, 0.75, 0.3],
      fog: '#c8d8ea', fogNear: 220, fogFar: 900, hemiSky: '#dbe8ff', hemiGround: '#6a6a70', glow: 0.25,
    },
    theme: {
      ...ASPHALT, curbA: '#ffc81a', curbB: '#222228', wallA: '#ffffff', wallB: '#2f7bff',
      ground: PAVED, shoulder: SIDEWALK, terrainColor: '#9a9a9c', mountainColor: '#5f7a52', clouds: true, hills: [360, 540, 30],
      water: { color: '#2a6f9a', beach: '#9a9a90', beachW: 10 },
    },
    buildings: { types: ['brick', 'office', 'glass'], heights: [[16, 40], [30, 80], [50, 120]], far: [50, 140], roof: 'spire', density: 1.15 },
    trees: 'broadleaf', lamps: 'modern', props: ['hidrantes'],
    obstacles: { barrel: ['taxi'], puddle: ['water', 'poop'], geyser: 'water', pigeons: 1 },
    landmarks: [{ id: 'arranhaCeu', hero: true }, { id: 'liberdade' }, { id: 'letreiros' }, { id: 'ponteCabos' }],
    names: ['Circuito da Estátua', 'Volta dos Táxis', 'Avenida dos Letreiros', 'Grande Prêmio da Grande Maçã', 'Corrida dos Arranha-Céus'],
    music: { scales: ['blues', 'minorPent', 'major'], root: [57, 62], tempo: [132, 146] },
  },

  toquio: {
    name: 'Tóquio', flag: '🇯🇵', country: 'Japão', emoji: '🌸',
    times: { dia: 0.3, tarde: 0.2, noite: 0.5 },
    sky: {
      skyTop: '#4a8ae0', skyHorizon: '#f0f2ff', skyBottom: '#9a8a9a', sun: '#fff0f0', sunDir: [-0.45, 0.75, 0.4],
      fog: '#e6e0f0', fogNear: 200, fogFar: 820, hemiSky: '#f2e6ff', hemiGround: '#6a6070', glow: 0.25,
    },
    night: { skyTop: '#0a0626', skyHorizon: '#3a2a6a', fog: '#241a48', hemiSky: '#a08ad8', glow: 1.4 },
    weather: { kind: 'petals', chance: 1 },
    theme: {
      road: '#45464e', roadSpeckle: ['#55565e', '#393a42', '#62636a'], curbA: '#ff3b6b', curbB: '#ffffff', wallA: '#ffffff', wallB: '#ff7ab8',
      ground: PAVED, shoulder: ['#c8c4c0', '#bcb8b4', '#d4d0cc'], terrainColor: '#9e9a9c', mountainColor: '#5a7a5a', clouds: true, hills: [320, 520, 50],
    },
    buildings: { types: ['tokyo', 'office', 'glass'], heights: [[14, 34], [22, 54], [30, 90]], far: [30, 100], roof: 'flat', density: 1.15 },
    trees: 'sakura', lamps: 'modern', props: ['neon', 'maquinas'],
    obstacles: { barrel: ['ramen'], puddle: ['water'], geyser: 'water', pigeons: 0 },
    landmarks: [{ id: 'torreTrelica', hero: true }, { id: 'pagode' }, { id: 'torii' }],
    names: ['Circuito da Torre Vermelha', 'Volta das Cerejeiras', 'Avenida dos Neons', 'Grande Prêmio do Pagode', 'Corrida do Portal'],
    music: { scales: ['japan', 'majorPent'], root: [60, 66], tempo: [136, 150] },
  },

  cairo: {
    name: 'Cairo', flag: '🇪🇬', country: 'Egito', emoji: '🐪',
    times: { dia: 0.65, tarde: 0.3, noite: 0.05 },
    sky: {
      skyTop: '#3a7bd5', skyHorizon: '#ffe6b8', skyBottom: '#e0b070', sun: '#fff0c8', sunDir: [-0.4, 0.72, 0.5],
      fog: '#f0d6a6', fogNear: 200, fogFar: 900, hemiSky: '#ffe9c4', hemiGround: '#b98a4a', glow: 0.12,
    },
    weather: { kind: 'dust', chance: 0.7 },
    theme: {
      road: '#6d5f55', roadSpeckle: ['#7d6f63', '#5d5048', '#8a7a6c'], lineColor: 'rgba(255,240,200,0.85)',
      curbA: '#ff7a1a', curbB: '#fff3d0', wallA: '#f2dcae', wallB: '#b8763a',
      ground: ['#e3b76a', '#d8a85a', '#eec383', '#c99550', '#f2cf93'], shoulder: ['#e2c896', '#d6bb86', '#ecd4a6'], sidewalk: 'tiles',
      terrainColor: '#e8bb70', mountainColor: '#d9a050', clouds: false, hills: [260, 460, 28],
    },
    buildings: { types: ['adobe', 'adobe2'], heights: [[8, 16], [10, 22], [12, 28]], far: [10, 26], roof: 'flatRail', density: 1.1, tints: ['#f2dcae', '#e8c890', '#f6e4c0', '#dcb67e', '#eed2a0'] },
    trees: 'palm', lamps: 'lantern', props: ['bancas'],
    obstacles: { barrel: ['camel'], puddle: ['quicksand'], geyser: 'sand', pigeons: 1 },
    landmarks: [{ id: 'piramides', hero: true }, { id: 'esfinge' }, { id: 'mesquita' }, { id: 'obelisco' }],
    names: ['Circuito das Pirâmides', 'Volta da Esfinge', 'Rally do Faraó', 'Avenida do Rio Nilo', 'Corrida dos Camelos'],
    music: { scales: ['arabic', 'arabic', 'minor'], root: [55, 60], tempo: [120, 134] },
  },

  roma: {
    name: 'Roma', flag: '🇮🇹', country: 'Itália', emoji: '🍕',
    times: { dia: 0.55, tarde: 0.4, noite: 0.05 },
    sky: {
      skyTop: '#3f80d8', skyHorizon: '#fbe8cc', skyBottom: '#b08a6a', sun: '#fff0d0', sunDir: [0.45, 0.72, -0.45],
      fog: '#ead8c0', fogNear: 200, fogFar: 820, hemiSky: '#fff0dc', hemiGround: '#8a6a4a', glow: 0.15,
    },
    theme: {
      road: '#5a5658', roadSpeckle: ['#686466', '#4a4648', '#767274'], curbA: '#1f9e4a', curbB: '#ffffff', wallA: '#ffffff', wallB: '#e8262a',
      ground: ['#b8a68e', '#ac9a82', '#c4b29a', '#a08e76', '#ccbaa2'], shoulder: ['#c9b9a0', '#bcad94', '#d4c4aa'], sidewalk: 'cobble',
      terrainColor: '#b0a088', mountainColor: '#6f8a4a', clouds: true, hills: [280, 480, 50],
    },
    buildings: { types: ['terracotta', 'terracotta2'], heights: [[10, 18], [12, 22], [14, 26]], far: [12, 26], roof: 'tiles', density: 1.1, tints: ['#e8a066', '#f0c080', '#d98a5a', '#f2d29a', '#e6b07a', '#cf7a4a'] },
    trees: 'pine', lamps: 'classic', props: ['cafes'],
    obstacles: { barrel: ['vespa'], puddle: ['gelato', 'water'], geyser: 'water', pigeons: 2 },
    landmarks: [{ id: 'coliseu', hero: true }, { id: 'colunaTriunfal' }, { id: 'arcoRomano' }, { id: 'domo' }],
    names: ['Circuito do Coliseu', 'Volta dos Gladiadores', 'Via das Fontes', 'Grande Prêmio da Pizza', 'Corrida dos Imperadores'],
    music: { scales: ['major', 'minor'], root: [60, 65], tempo: [130, 144] },
  },

  sydney: {
    name: 'Sydney', flag: '🇦🇺', country: 'Austrália', emoji: '🦘',
    times: { dia: 0.6, tarde: 0.3, noite: 0.1 },
    sky: {
      skyTop: '#1e78e6', skyHorizon: '#c6ecff', skyBottom: '#6aa8c0', sun: '#fff6dc', sunDir: [0.4, 0.8, 0.4],
      fog: '#c4e6f6', fogNear: 230, fogFar: 940, hemiSky: '#dcf2ff', hemiGround: '#7a8a7a', glow: 0.15,
    },
    theme: {
      ...ASPHALT, curbA: '#1fae5c', curbB: '#ffd23f', wallA: '#ffffff', wallB: '#2f7bff',
      ground: PAVED, shoulder: SIDEWALK, terrainColor: '#9c9e98', mountainColor: '#4f8a4a', clouds: true, hills: [320, 520, 40],
      water: { color: '#1a86c8', beach: '#c8c2b0', beachW: 14 },
    },
    buildings: { types: ['glass', 'office', 'res'], heights: [[14, 34], [24, 60], [34, 96]], far: [30, 100], roof: 'flat', density: 1 },
    trees: 'broadleaf', lamps: 'modern', props: ['bancas'],
    obstacles: { barrel: ['canguru'], puddle: ['water'], geyser: 'water', pigeons: 1 },
    landmarks: [{ id: 'opera', hero: true }, { id: 'ponteArco' }, { id: 'torreAgulha' }],
    names: ['Circuito da Ópera', 'Volta do Porto', 'Grande Prêmio do Canguru', 'Avenida da Baía', 'Corrida do Arco de Aço'],
    music: { scales: ['major', 'majorPent'], root: [60, 66], tempo: [134, 148] },
  },

  dubai: {
    name: 'Dubai', flag: '🇦🇪', country: 'Emirados Árabes', emoji: '🏙️',
    times: { dia: 0.45, tarde: 0.25, noite: 0.3 },
    sky: {
      skyTop: '#2f7ae0', skyHorizon: '#f2e6cc', skyBottom: '#d0b080', sun: '#fff4d8', sunDir: [-0.45, 0.78, 0.35],
      fog: '#eadcc0', fogNear: 240, fogFar: 1000, hemiSky: '#fff0d8', hemiGround: '#a88a5a', glow: 0.2,
    },
    weather: { kind: 'dust', chance: 0.25 },
    theme: {
      road: '#3f4048', roadSpeckle: ['#4c4d55', '#33343a', '#5a5b63'], curbA: '#d6a83a', curbB: '#ffffff', wallA: '#ffffff', wallB: '#b8b8c0',
      ground: ['#d9c49a', '#cfb88c', '#e3cfa6', '#c6ae80', '#e8d6b0'], shoulder: ['#e6dcc6', '#dcd2bc', '#efe6d2'], sidewalk: 'tiles',
      terrainColor: '#e2c48a', mountainColor: '#e8b870', clouds: false, hills: [240, 460, 30],
      water: { color: '#1fa8c8', beach: '#f2dcae', beachW: 26 },
    },
    buildings: { types: ['glass', 'glass2', 'office'], heights: [[16, 40], [40, 100], [60, 150]], far: [60, 170], roof: 'spire', density: 0.9 },
    trees: 'palm', lamps: 'modern', props: ['bancas'],
    obstacles: { barrel: ['supercarro', 'camel'], puddle: ['quicksand', 'water'], geyser: 'sand', pigeons: 0 },
    landmarks: [{ id: 'agulha', hero: true }, { id: 'hotelVela' }, { id: 'moldura' }],
    names: ['Circuito da Agulha', 'Volta da Vela', 'Grande Prêmio do Deserto', 'Avenida dos Arranha-Céus', 'Corrida da Moldura Dourada'],
    music: { scales: ['arabic', 'minor', 'harmonic'], root: [56, 61], tempo: [128, 142] },
  },

  agra: {
    name: 'Agra', flag: '🇮🇳', country: 'Índia', emoji: '🐘',
    times: { dia: 0.55, tarde: 0.4, noite: 0.05 },
    sky: {
      skyTop: '#4a8ad8', skyHorizon: '#fde8d0', skyBottom: '#c09a7a', sun: '#fff0d4', sunDir: [0.45, 0.7, 0.45],
      fog: '#f0dcc8', fogNear: 200, fogFar: 840, hemiSky: '#fff0e0', hemiGround: '#8a7050', glow: 0.18,
    },
    sunset: { skyTop: '#4a3a9a', skyHorizon: '#ffaa7a', sun: '#ffcc90', fog: '#e8b0a0', hemiSky: '#ffd8c0' },
    theme: {
      road: '#5e5450', roadSpeckle: ['#6c625e', '#4e4440', '#7a706a'], curbA: '#ff8a1a', curbB: '#ffffff', wallA: '#ffffff', wallB: '#1f9e4a',
      ground: ['#d4bc94', '#b8b07c', '#dcc8a0', '#a8a46e', '#e0cca4'], shoulder: ['#d8c0a0', '#ccb494', '#e2ccae'], sidewalk: 'tiles',
      terrainColor: '#d6caa0', mountainColor: '#7a9a4a', clouds: true, hills: [220, 430, 70],
    },
    // fachadas variadas (rosa, ocre, branco, azul de casarão), telhados com cúpulas e chhatris
    buildings: { types: ['indian', 'haveli', 'jharokha', 'adobe'], heights: [[8, 16], [10, 22], [12, 26]], far: [10, 24], roof: 'mughal', density: 1.0, tints: ['#f2c6a0', '#f0a8a8', '#f6dcb0', '#c8e0d0', '#f0b878', '#e6c8e8', '#ffffff', '#a8c8e8', '#e89a7a'] },
    trees: 'broadleaf', treeMix: ['broadleaf', 'palm', 'broadleaf', 'cypress'], lotTrees: 90, lamps: 'lantern', props: ['bandeirinhas', 'templos', 'bazar', 'bichos', 'flores'],
    obstacles: { barrel: ['tuktuk', 'vaca'], puddle: ['water', 'quicksand'], geyser: 'water', pigeons: 1 },
    landmarks: [{ id: 'tajMahal', hero: true }, { id: 'forteVermelho' }, { id: 'portaoVermelho' }],
    names: ['Circuito do Palácio Branco', 'Volta dos Jardins', 'Grande Prêmio do Tuk-Tuk', 'Avenida do Rio Yamuna', 'Corrida do Forte Vermelho'],
    music: { scales: ['indian', 'arabic'], root: [57, 62], tempo: [124, 138] },
  },

  pequim: {
    name: 'Pequim', flag: '🇨🇳', country: 'China', emoji: '🏮',
    times: { dia: 0.45, tarde: 0.3, noite: 0.25 },
    sky: {
      skyTop: '#5a8ad0', skyHorizon: '#eef0f2', skyBottom: '#9a9088', sun: '#fff2e0', sunDir: [0.4, 0.72, -0.5],
      fog: '#dcdce0', fogNear: 200, fogFar: 820, hemiSky: '#eeeeff', hemiGround: '#7a6a5a', glow: 0.2,
    },
    theme: {
      road: '#4c4a50', roadSpeckle: ['#5a585e', '#3e3c42', '#68666c'], curbA: '#e8262a', curbB: '#ffd23f', wallA: '#ffffff', wallB: '#e8262a',
      ground: PAVED, shoulder: ['#c0bab2', '#b4aea6', '#ccc6be'], sidewalk: 'tiles', terrainColor: '#9c9890', mountainColor: '#5f7a4a', clouds: true, hills: [180, 380, 80],
    },
    buildings: { types: ['chinese', 'office', 'glass'], heights: [[8, 14], [16, 40], [30, 80]], far: [30, 90], roof: 'pagoda', density: 1.05 },
    trees: 'broadleaf', lamps: 'lantern', props: ['lanternas'],
    obstacles: { barrel: ['riquixa'], puddle: ['water', 'poop'], geyser: 'water', pigeons: 1 },
    landmarks: [{ id: 'muralha', hero: true }, { id: 'temploCeu' }, { id: 'portalChines' }],
    names: ['Circuito da Muralha', 'Volta do Templo do Céu', 'Grande Prêmio do Dragão', 'Avenida das Lanternas', 'Corrida do Panda'],
    music: { scales: ['majorPent', 'majorPent', 'japan'], root: [60, 66], tempo: [128, 142] },
  },
};

export const KIT_IDS = Object.keys(KITS);

// Ordem da Volta ao Mundo (para o leste, saindo de Osasco)
export const WORLD_ORDER = ['osasco', 'rio', 'novayork', 'londres', 'paris', 'roma', 'cairo', 'dubai', 'agra', 'pequim', 'toquio', 'sydney'];

// Tema completo (cores da pista, do céu e do clima) de um kit numa hora do dia.
export function kitTheme(kitId, time = 'dia', weatherOn = false) {
  const k = KITS[kitId];
  const th = JSON.parse(JSON.stringify({ ...k.theme, ...k.sky }));
  th.mountainSnow = false;
  if (time === 'tarde') Object.assign(th, SUNSET, { sunDir: [th.sunDir[0] < 0 ? -0.6 : 0.6, 0.28, th.sunDir[2] < 0 ? -0.55 : 0.55] }, k.sunset || {});
  if (time === 'noite') Object.assign(th, NIGHT, k.night || {});
  th.weather = weatherOn && k.weather ? k.weather.kind : (kitId === 'toquio' ? 'petals' : null);
  if (th.weather === 'rain') { th.fogFar = Math.round(th.fogFar * 0.85); th.clouds = time !== 'noite'; }
  return th;
}
