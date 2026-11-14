# Monumentos feitos no Blender (teste: Cristo Redentor)

O `cristo.py` é um script que monta o Cristo sozinho dentro do Blender e salva o modelo em
`assets/models/cristo.glb`. Você não precisa mexer em nada no Blender: é só rodar um comando.

## Como rodar no Mac

1. Instale o Blender 4.2 ou mais novo (blender.org). Ele fica em `/Applications/Blender.app`.
2. Abra o Terminal e entre na pasta do jogo:
   ```
   cd caminho/para/jogo-marileo
   ```
3. Rode:
   ```
   /Applications/Blender.app/Contents/MacOS/Blender --background --python tools/blender/cristo.py
   ```
   Leva uns 2 segundos. No final aparece algo como:
   `[cristo] salvo .../assets/models/cristo.glb (74.0 KB)`.

Extras (vão depois de `--`):
- `-- --salvar-blend` também salva `assets/models/cristo.blend`, para abrir e olhar no Blender.
- `-- --saida outro/lugar.glb` salva em outro lugar.

## Como ver o resultado

Na pasta do jogo, rode `npx serve .` (ou `python3 -m http.server`) e abra
`http://localhost:3000/tools/blender/viewer.html` (no `python3 -m http.server`, a porta é 8000).
A tela mostra, lado a lado e com a mesma câmera, o Cristo de hoje (procedural) e o do Blender,
com os números de triângulos, malhas e tamanho do arquivo. Os botões trocam entre só a estátua,
o marco completo (com o morro), os materiais e dia/noite. Dá para girar com o mouse.

## Para mudar o modelo

Tudo está no `cristo.py`, em blocos com comentários (pedestal, túnica, manto, braços, cabeça,
coração). As medidas estão em "unidades do jogo" e as cores são as mesmas do jogo (hex).
Depois de mudar, rode o comando de novo.

Ainda **não** está ligado ao jogo: é só o teste para comparar.

## Medição do Rio inteiro com o Cristo do Blender (13/11/2026)

O teste `medir_rio.py` monta o Rio de verdade no Chrome do Mac (placa de vídeo Apple M5) duas vezes,
uma com o Cristo de hoje e outra com o do Blender, que ele troca **só dentro do teste**. Nas duas,
as câmeras ficam nos mesmos pontos. Para rodar: `python3 tools/blender/medir_rio.py` (precisa do
Google Chrome e do Playwright para Python). As capturas ficam em `capturas/lado-a-lado-*.png`,
com o Cristo de hoje à esquerda e o do Blender à direita.

| Ponto da pista | Draw calls (hoje / Blender) | Triângulos (hoje / Blender) |
|---|---|---|
| 15% | 64 / 64 | 82.012 / 82.048 |
| 50% | 69 / 69 | 92.848 / 92.848 |
| 85% | 384 / 384 | 227.156 / 228.788 |
| Largada | 139 / 141 (*) | 112.384 / 113.668 |
| Olhando o Cristo | 40 / 40 | 75.168 / 76.800 |
| **Cena inteira** | 490 malhas / 490 | **274.469 / 276.101 (+1.632, +0,6%)** |

(*) Na largada, os draw calls mudam ±2 de uma rodada para outra mesmo sem trocar o Cristo, por
causa da ordem dos karts, que é sorteada. Por isso, isso não é diferença do Cristo.

- Draw calls: **iguais**. A estátua usa as mesmas 3 pinturas do jogo e entra no mesmo "pacote" do morro.
- Arquivo: +67 KB para baixar (`cristo.glb`). O procedural não baixa nada.
- 40 s de corrida simulada com a IA nas duas versões: sem erros de JavaScript.
- Aparência: no do Blender dá para ver o rosto, o cabelo, o manto caindo dos braços, o cinto, o
  coração e a porta no pedestal. No procedural, a estátua é uma cruz lisa com uma bola no lugar da cabeça.
- **Não testado:** FPS em celular de verdade e uma corrida inteira de 3 voltas com um jogador humano.
  Os números desta tabela não dá para comparar com `docs/QA-cidades-linha-de-base.md`, porque as câmeras são outras.

Para ligar ao jogo, falta: carregar o `.glb` antes de montar o Rio (hoje a cidade é montada toda de
uma vez, sem esperar arquivo), pôr o arquivo na lista do modo offline (`sw.js`) e subir a versão do
cache. Isso mexe em `js/cities/` e no `sw.js`, que não são da seção Blender.
