// Registro de todos os marcos das cidades. Cada marco tem:
//   w, d   = terreno (largura x profundidade); a frente (+z) fica virada para a pista
//   kind   = 'near' (perto da pista), 'far' (no horizonte, bem grande) ou 'span' (portal por cima da pista)
//   water  = 'in' (dentro do mar) ou 'shore' (na beira do mar), quando a cidade tem mar
//   pillar = largura dos pilares (só nos portais)
//   build(ctx, g, opts, info) = monta o marco dentro do grupo g (coordenadas locais)
import { OSASCO_LANDMARKS } from './osasco.js';
import { LANDMARKS_A } from './lm-west.js';
import { LANDMARKS_B } from './lm-east.js';
import { LANDMARKS_C } from './lm-polish.js';

export const LANDMARKS = { ...OSASCO_LANDMARKS, ...LANDMARKS_A, ...LANDMARKS_B, ...LANDMARKS_C };

