# QA das 12 cidades — linha de base (13/11/2026, antes do acabamento das 6 fracas)

Medido na nuvem com Chromium + WebGL por software, corridas de 3 voltas só com IA (8 karts), em `746bd3c`.
Calls/triângulos = média de 3 pontos da pista (15%, 50%, 85%); variam muito com a câmera (ex.: Dubai 141–400), então é uma medida grosseira.
Não mede FPS (renderização por software). Não testou humano, itens, online, toque, 2–4 jogadores.

| Cidade | Calls | Triângulos | Terminou? |
|---|---|---|---|
| Osasco | 285 | 223k | sim (~126 s) |
| Rio | 402 | 225k | sim (~124 s) |
| Nova York | 343 | 206k | sim (~123 s) |
| Londres | 423 | 237k | sim (~131 s) |
| Paris | 350 | 220k | sim (~128 s) |
| Roma | 271 | 187k | sim (~123 s) |
| Cairo | 244 | 196k | sim (~129 s) |
| Dubai | 237 | 170k | sim (~114 s) |
| Agra | 231 | 196k | sim (~111 s) |
| Pequim | 169 | 158k | sim (~111 s) |
| Tóquio | 218 | 168k | sim (~122 s) |
| Sydney | 419 | 206k | sim (~128 s) |

Nenhum kart preso, 0 respawns, 0 erros de JavaScript do jogo.

## O que parece fraco nas 6 cidades (pelas capturas)
- **Roma:** avenida reta de prédios ocres iguais, chão plano e vazio; Coliseu só ao fundo.
- **Agra:** muito vazia; sem espelho d'água/jardim; Taj Mahal pouco visível; fachadas repetidas.
- **Pequim:** domina prédio moderno genérico; faltam pagodes, muralha, telhados curvos ao longo do trajeto.
- **Cairo:** pirâmides minúsculas no horizonte; céu e chão quase da mesma cor; cenário sem relevo.
- **Dubai:** Burj só na largada; corredor de prédios repetidos; asfalto muito escuro; sem mar na maior parte.
- **Sydney:** a mais completa, mas o meio da corrida é avenida repetida; 419 calls (a mais pesada das fracas).
