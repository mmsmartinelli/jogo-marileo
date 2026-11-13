# 🏁 Race Cities

**Corrida maluca pelas cidades do mundo!** Um jogo de karts em 3D da **Marileo Studios** que roda
direto no navegador (e nos apps de Android e iPhone). O Leo (o leão), a Mari (a gatinha) e a turma
dão a volta ao mundo acelerando por Osasco, Rio de Janeiro, Nova York, Londres, Paris, Roma, Cairo,
Dubai, Agra, Pequim, Tóquio e Sydney — e por cidades novas que o jogo cria sozinho, sem fim.

Feito para jogar com a família e os amigos **na mesma tela, ao mesmo tempo (até 4 jogadores)**
ou **online, cada um no seu aparelho (até 8)**.

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
4. Quem criou a sala escolhe a cidade e as voltas e toca em **CORRER!**. As vagas que sobrarem
   até 8 são preenchidas por pilotos do computador.

Funciona com todos na mesma sala ou cada um na sua casa, desde que todos tenham internet.
Os aparelhos se conectam direto entre si (WebRTC); o serviço gratuito PeerJS só ajuda a
encontrar a sala. Em algumas redes muito fechadas (alguns 4G ou Wi-Fi de empresas) a conexão
pode não acontecer — nesse caso, usem o mesmo Wi-Fi. Todos precisam estar com a mesma versão do
jogo (versões diferentes não entram na mesma sala).

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

## 🌍 As cidades

| Cidade | Marcos famosos (estilizados) | Atravessando a rua |
|---|---|---|
| 🇧🇷 Osasco (pista feita à mão) | Ponte Metálica com arcos rosa, Estação Osasco com trem, Praça dos Pombos, Dogão do Leo gigante | carrinho de cachorro-quente |
| 🇧🇷 Rio de Janeiro | Cristo Redentor no morro, Pão de Açúcar com bondinho, Arcos da Lapa, calçadão de ondas e praia | bondinho amarelo |
| 🇺🇸 Nova York | Estátua da Liberdade na ilha, arranha-céu art déco, praça dos letreiros, ponte de cabos | táxi amarelo |
| 🇬🇧 Londres | Big Ben e o Parlamento, roda-gigante girando, ponte de duas torres, cabines vermelhas | ônibus de dois andares |
| 🇫🇷 Paris | Torre Eiffel, Arco do Triunfo (passa por dentro!), pirâmide de vidro, basílica no morro, cafés | carrinho de crepe |
| 🇮🇹 Roma | Coliseu, coluna triunfal, arco romano por cima da pista, cúpula, pinheiros-guarda-chuva | lambreta |
| 🇪🇬 Cairo | Pirâmides no horizonte, Esfinge, mesquita com minaretes, obelisco, tempestade de areia | camelo |
| 🇦🇪 Dubai | Torre-agulha gigante, hotel em forma de vela no mar, moldura dourada por cima da pista | carrão dourado e camelo |
| 🇮🇳 Agra | Taj Mahal com espelho d'água e jardins, forte vermelho, portão vermelho | tuk-tuk |
| 🇨🇳 Pequim | Grande Muralha nos morros, Templo do Céu, portal chinês, lanternas vermelhas | riquixá |
| 🇯🇵 Tóquio | Torre vermelha e branca, pagode de 5 andares, portal torii, neons e pétalas de cerejeira | carrinho de lámen |
| 🇦🇺 Sydney | Ópera com as velas brancas, ponte em arco sobre a baía, torre-agulha | canguru! |

Todos os nomes de lojas, bancos e placas são **inventados** (Banco do Leão, Shopping da Gatinha,
Condomínio das Flores, Dogão do Leo, Suco do Leão, Pipoca da Mari...). Não há marcas reais no jogo.

## 🌟 O que tem no jogo

- **Grande Prêmio — Volta ao Mundo:** copas de 4 cidades com pódio — 🌊 Copa Atlântico
  (Osasco, Rio, Nova York, Londres), 🏛️ Copa Europa & Oriente (Paris, Roma, Cairo, Dubai) e
  🐉 Copa Ásia & Oceania (Agra, Pequim, Tóquio, Sydney). De bônus, a 🦄 **Copa Fantasia** com as
  pistas de fantasia do começo do jogo (Vale Verdejante, Deserto Dourado, Pico Nevado, Reino Doce e
  Vulcão Flamejante).
- **♾️ Copa Infinita:** uma volta ao mundo sem fim, com cidades e pistas novas (veja abaixo).
- **Corrida Rápida** e **Contra o Relógio** (com recorde salvo) em qualquer cidade ou na 🎲 **Cidade Surpresa**.
- **8 personagens** com atributos diferentes: Leo (Leão), Mari (Gatinha), Pipo (Panda), Tuti (Sapo),
  Fifi (Raposa), Bento (Coelho), Pingo (Pinguim) e Rex (Dino).
- **Tela dividida** para 1 a 4 jogadores + 8 karts na pista (o computador completa as vagas).
- **Caixas surpresa** com: ⚡ Turbo, ⚡⚡⚡ Turbo Triplo, 🛡️ Escudo, ⭐ Estrela (invencível), 🍌 Banana,
  🛢️ Óleo, 🎁 Caixa Falsa, 🚀 Foguete teleguiado e 🦑 Tinta de Lula (suja a tela de quem está na frente).
  Quem está atrás na corrida ganha itens melhores!
- **Obstáculos das cidades:** veículos e bichos atravessando a rua, hidrantes jorrando água, poças,
  caixotes que caem do guindaste e bandos de pombos (saem voando quando o kart chega — e às vezes
  deixam um “presente” na tela!).
- **Dia, pôr do sol e noite**, chuva em Londres, areia no Cairo e pétalas de cerejeira em Tóquio.
- **Pista viva:** setas de turbo, rampas com manobras no ar, moedas (deixam o kart mais rápido), torcida pulando.
- **Derrapagem com mini-turbo** (faíscas azuis → laranjas → roxas) e **largada turbo**.
- **Desafios ⭐:** cada pista tem 3 objetivos. As estrelas ficam salvas.
- Computador em 3 níveis de dificuldade, com ajuste automático para a corrida ficar sempre disputada.
- Música e efeitos sonoros gerados na hora (sem arquivos de áudio), com o clima de cada país.

## ♾️ Cidades sem fim

O jogo nunca fica sem fases: além das cidades da Volta ao Mundo, ele **cria corridas novas sozinho**.
Cada corrida gerada escolhe uma cidade, desenha um traçado novo e sorteia a hora do dia, o clima,
quais marcos aparecem, os obstáculos, os desafios e a música (ex.: “Paris — Circuito da Torre”,
“Tóquio à Noite”). Os marcos são colocados sozinhos em lugares livres perto da pista, sempre
bem à vista e nunca em cima do asfalto.

- **🎲 Cidade Surpresa:** na Corrida Rápida e no Contra o Relógio, um cartão da lista de cidades
  é uma corrida sorteada na hora. Toque em **🎲 Outra** para sortear outra. Recordes e estrelas
  ficam guardados para cada corrida surpresa.
- **♾️ Copa Infinita:** Copa 1, Copa 2, Copa 3... sem fim, cada uma com 4 cidades diferentes e um
  pouco mais difícil (curvas mais fechadas, mais obstáculos e o computador mais esperto). Terminar a
  copa entre os 3 primeiros libera a próxima; com ◀ ▶ dá para jogar de novo as copas já liberadas.
- **Online:** o anfitrião também pode escolher a 🎲 Cidade Surpresa. Só o número da pista é enviado
  e cada aparelho monta exatamente a mesma cidade.

Cada pista gerada sai de um número (semente): a mesma semente cria sempre a mesma pista. O gerador
confere o traçado antes de usar (comprimento, curvas não muito fechadas, trechos sem encostar uns nos
outros e reta de largada comprida) e, se algo não estiver bom, tenta de novo com outra variação.

## 🛠️ Tecnologia

- [three.js](https://threejs.org/) r160, carregado da CDN jsDelivr (precisa de internet na primeira abertura; o app instalado guarda uma cópia)
- Todos os modelos, cidades, texturas, músicas e sons são gerados por código — não há arquivos de imagem ou áudio no jogo.
- Pensado para celular: os prédios de cada cidade viram poucas malhas, as árvores e postes usam
  instâncias e todas as placas de uma cidade ficam numa textura só.

```
index.html             telas e menus
css/style.css          visual dos menus e do HUD
js/main.js             fluxo do jogo, menus, Grande Prêmio, resultados
js/race.js             a corrida: regras, câmeras, tela dividida
js/kart.js             física do kart (derrapagem, saltos, colisões)
js/track.js            construção 3D das pistas, terreno, céu e cenário
js/tracks.js           as cidades da Volta ao Mundo, as copas e a Copa Fantasia
js/trackgen.js         gerador de corridas em cidades (Cidade Surpresa e Copa Infinita)
js/cities/kits.js      "kit" de cada cidade: cores, hora do dia, prédios, obstáculos, música, marcos
js/cities/build.js     monta qualquer pista como cidade (prédios, ruas, mar, marcos no lugar certo)
js/cities/common.js    peças 3D comuns (materiais compartilhados, placas, fachadas, treliças)
js/cities/osasco.js    marcos de Osasco (Ponte Metálica, estação, praça, Dogão...)
js/cities/lm-west.js   marcos do Rio, Nova York, Londres, Paris e Roma
js/cities/lm-east.js   marcos do Cairo, Dubai, Agra, Pequim, Tóquio e Sydney
js/cities/landmarks.js lista de todos os marcos
js/cities/props.js     enfeites de rua (cafés, cabines, neons, lanternas...)
js/cities/vehicles.js  veículos e bichos que atravessam a rua
js/pigeons.js          os pombos (desenho e animação)
js/items.js            caixas surpresa e itens
js/obstacles.js        moedas, turbos, rampas, veículos, caixotes, hidrantes, poças, pombos
js/ai.js               pilotos do computador
js/characters.js       personagens e modelos 3D dos karts
js/effects.js          partículas e clima (chuva, areia, pétalas, neve, brasas)
js/audio.js            efeitos sonoros e música procedural
js/hud.js              placar de cada jogador e minimapa
js/input.js            teclado e controles
js/touch.js            controles de toque (celular e tablet)
js/online.js           sala online: criar/entrar com código, lista de jogadores
js/net.js              conexão entre aparelhos (PeerJS/WebRTC)
js/netrace.js          sincroniza a corrida online entre os aparelhos
sw.js                  funcionamento offline do app instalado
manifest.webmanifest   nome, ícone e orientação do app
```

## App para Android (APK)

No Android, a tela inicial do jogo mostra o botão **📱 Baixar o app para Android**, que leva à página
`baixar.html` com o arquivo `download/marileo-kart.apk` e o passo a passo para instalar.

- O app (pasta `android/`) é feito para o Android atual (*targetSdk 35*, funciona do Android 7 em diante).
- Ele abre o jogo do site em tela cheia e deitado, então as novidades do jogo chegam sem reinstalar.
- O botão **voltar** do celular pausa a corrida ou volta uma tela; no menu, dois toques fecham o app.
- Convites das salas online abrem a janela de compartilhar do Android (WhatsApp etc.).
- Para gerar de novo: `ANDROID_HOME=... KEYSTORE=... KS_PASS=... ./android/build.sh`
  (precisa de `platforms;android-35` e `build-tools;35.0.0`).
