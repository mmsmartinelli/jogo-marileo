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

## 📱 Instalar no celular (app)

O jogo funciona como aplicativo instalável (PWA), com os mesmos gráficos 3D e controles de toque:

1. Publique o jogo no **GitHub Pages** (Settings → Pages → escolha a branch e a pasta `/ (root)`).
2. No celular, abra o link do GitHub Pages:
   - **Android (Chrome):** menu ⋮ → **Instalar app** (ou “Adicionar à tela inicial”).
   - **iPhone/iPad (Safari):** botão Compartilhar → **Adicionar à Tela de Início**.
3. Abra pelo ícone: o jogo fica em tela cheia, na horizontal, e funciona sem internet depois da primeira vez.

Controles de toque: arraste o dedo no **lado esquerdo** da tela para virar; os botões do **lado direito**
aceleram, freiam, derrapam e usam o item. A opção “Acelerar sozinho” já vem ligada no celular.
Em tablets dá para ligar controles Bluetooth e jogar em tela dividida.

> Dica: aperte **F11** para tela cheia. Uma TV ligada ao computador + controles USB fica perfeito para a turma.

## 🌐 Online com amigos (até 8 jogadores)

Cada criança joga no **próprio celular, tablet ou computador**, todos na mesma corrida:

1. Uma criança toca em **🌐 Online com Amigos → Criar sala**. Aparece um **código de 4 letras**.
2. Ela toca em **📨 Convidar amigos** para mandar o código (ou o link) pelo WhatsApp.
3. Os amigos abrem o jogo, tocam em **Online com Amigos**, digitam o código e tocam em **Entrar**
   (quem abrir pelo link do convite já chega com o código preenchido).
4. Quem criou a sala escolhe a pista e as voltas e toca em **CORRER!**. As vagas que sobrarem
   até 8 são preenchidas por pilotos do computador.

Funciona com todos na mesma sala ou cada um na sua casa, desde que todos tenham internet.
Os aparelhos se conectam direto entre si (WebRTC); o serviço gratuito PeerJS só ajuda a
encontrar a sala. Em algumas redes muito fechadas (alguns 4G ou Wi-Fi de empresas) a conexão
pode não acontecer — nesse caso, usem o mesmo Wi-Fi.

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

- **3 modos:** Grande Prêmio (copa com 6 corridas e pódio), Corrida Rápida e Contra o Relógio (com recorde salvo).
- **6 fases:** Vale Verdejante 🌳, Deserto Dourado 🏜️, Pico Nevado ❄️, Reino Doce 🍭, Vulcão Flamejante 🌋 e a **Super Osasco 🌭**.
- **Super Osasco:** a maior pista do jogo, no fim de tarde com as janelas acesas. Tem o Dogão gigante na largada,
  bandos de pombos na pista (saem voando quando o kart chega — e às vezes deixam um “presente” na tela!),
  Osasco Plaza e Shopping União, Condomínio Jardins do Brasil, Cidade de Deus (Bradesco), a Ponte Metálica
  com os arcos rosa por cima da avenida, a Estação Osasco com o trem passando e a Praça dos Pombos.
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

- [three.js](https://threejs.org/) r160, carregado da CDN jsDelivr (precisa de internet na primeira abertura; o app instalado guarda uma cópia)
- Todos os modelos, texturas, músicas e sons são gerados por código — não há arquivos de imagem ou áudio.

```
index.html        telas e menus
css/style.css     visual dos menus e do HUD
js/main.js        fluxo do jogo, menus, Grande Prêmio, resultados
js/race.js        a corrida: regras, câmeras, tela dividida
js/kart.js        física do kart (derrapagem, saltos, colisões)
js/track.js       construção 3D das pistas, terreno, céu e cenário
js/city.js        cenário da Super Osasco (prédios, pontos da cidade, ponte, trem)
js/pigeons.js     os pombos (desenho e animação)
js/tracks.js      definição das 5 fases (traçado, tema, obstáculos, desafios)
js/items.js       caixas surpresa e itens
js/obstacles.js   moedas, turbos, rampas, barris, pilões, gêiseres, poças
js/ai.js          pilotos do computador
js/characters.js  personagens e modelos 3D dos karts
js/effects.js     partículas e clima (neve, poeira, brasas)
js/audio.js       efeitos sonoros e música procedural
js/hud.js         placar de cada jogador e minimapa
js/input.js       teclado e controles
js/touch.js       controles de toque (celular e tablet)
js/online.js      sala online: criar/entrar com código, lista de jogadores
js/net.js         conexão entre aparelhos (PeerJS/WebRTC)
js/netrace.js     sincroniza a corrida online entre os aparelhos
sw.js             funcionamento offline do app instalado
manifest.webmanifest  nome, ícone e orientação do app
```
