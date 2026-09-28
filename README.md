# 🏁 Marileo Kart

Jogo de corrida de karts em 3D, no estilo Mario Kart, que roda direto no navegador.
Feito para jogar com a família e os amigos **na mesma tela, ao mesmo tempo (até 4 jogadores)**.

## ▶️ Como abrir o jogo

O jogo é um site estático (HTML + JavaScript). Como usa módulos JavaScript, ele precisa ser aberto
por um servidor web local (abrir o `index.html` com dois cliques não funciona em alguns navegadores).

**Opção 1 — Python (já vem no Mac/Linux):**

```bash
cd jogo-marileo
python3 -m http.server 8000
```

Depois abra **http://localhost:8000** no Chrome, Edge ou Firefox.

**Opção 2 — Node.js:**

```bash
npx serve .
```

**Opção 3 — GitHub Pages:** em *Settings → Pages* do repositório, publique a branch principal.
O jogo fica disponível num link para abrir em qualquer computador.

> Dica: aperte **F11** para tela cheia. Uma TV ligada ao computador + controles USB fica perfeito para a turma.

## 🎮 Controles

| Ação | Jogador 1 | Jogador 2 | Controle (gamepad) |
|---|---|---|---|
| Acelerar | `W` | `↑` | A ou RT |
| Frear / ré | `S` | `↓` | B ou LT |
| Virar | `A` / `D` | `←` / `→` | Analógico ou direcional |
| Usar item | `Espaço` | `Enter` | X ou LB |
| Derrapar (mini-turbo) | `Shift` esquerdo | `Shift` direito ou `0` | RB ou Y |
| Pausar | `Esc` / `P` | `Esc` / `P` | Start |
| Som liga/desliga | `M` | | |

- Jogadores 3 e 4 usam controles (USB ou Bluetooth — Xbox, PlayStation e genéricos funcionam).
  Aperte qualquer botão do controle para o navegador reconhecê-lo.
- Na tela de escolha, cada jogador troca de personagem com os **próprios controles** e aperta o
  botão de item para ficar **pronto**. Quando todos estão prontos, a corrida começa.
- A opção **“Acelerar sozinho”** faz o kart acelerar automaticamente — ótimo para os pequenos, que só precisam virar.

## 🌟 O que tem no jogo

- **3 modos:** Grande Prêmio (copa com 5 corridas e pódio), Corrida Rápida e Contra o Relógio (com recorde salvo).
- **5 fases:** Vale Verdejante 🌳, Deserto Dourado 🏜️, Pico Nevado ❄️, Reino Doce 🍭 e Vulcão Flamejante 🌋.
- **8 personagens** com atributos diferentes: Leo (Leão), Mari (Gatinha), Pipo (Panda), Tuti (Sapo),
  Fifi (Raposa), Bento (Coelho), Pingo (Pinguim) e Rex (Dino).
- **Tela dividida** para 1 a 4 jogadores + 8 karts na pista (o computador completa as vagas).
- **Caixas surpresa** com: ⚡ Turbo, ⚡⚡⚡ Turbo Triplo, 🛡️ Escudo, ⭐ Estrela (invencível), 🍌 Banana,
  🛢️ Óleo, 🎁 Caixa Falsa, 🚀 Foguete teleguiado e 🦑 Tinta de Lula (suja a tela de quem está na frente).
  Quem está atrás na corrida ganha itens melhores!
- **Obstáculos:** barris e pedras rolando, pilões esmagadores, gêiseres de fogo e areia, poças de lama,
  gelo e calda, e lava no vulcão.
- **Pista viva:** setas de turbo, rampas com manobras no ar, moedas (deixam o kart mais rápido), torcida pulando.
- **Derrapagem com mini-turbo** (faíscas azuis → laranjas → roxas) e **largada turbo**.
- **Desafios ⭐:** cada pista tem 3 objetivos (ex.: “colete 8 moedas”, “não caia na lava”). As estrelas ficam salvas.
- Computador em 3 níveis de dificuldade, com ajuste automático para a corrida ficar sempre disputada.
- Música e efeitos sonoros gerados na hora (sem arquivos de áudio).

## 🛠️ Tecnologia

- [three.js](https://threejs.org/) r160, carregado da CDN jsDelivr (precisa de internet ao abrir o jogo)
- Todos os modelos, texturas, músicas e sons são gerados por código — não há arquivos de imagem ou áudio.

```
index.html        telas e menus
css/style.css     visual dos menus e do HUD
js/main.js        fluxo do jogo, menus, Grande Prêmio, resultados
js/race.js        a corrida: regras, câmeras, tela dividida
js/kart.js        física do kart (derrapagem, saltos, colisões)
js/track.js       construção 3D das pistas, terreno, céu e cenário
js/tracks.js      definição das 5 fases (traçado, tema, obstáculos, desafios)
js/items.js       caixas surpresa e itens
js/obstacles.js   moedas, turbos, rampas, barris, pilões, gêiseres, poças
js/ai.js          pilotos do computador
js/characters.js  personagens e modelos 3D dos karts
js/effects.js     partículas e clima (neve, poeira, brasas)
js/audio.js       efeitos sonoros e música procedural
js/hud.js         placar de cada jogador e minimapa
js/input.js       teclado e controles
```
