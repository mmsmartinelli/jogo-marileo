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
