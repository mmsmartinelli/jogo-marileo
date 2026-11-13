# Briefing do Diretor — Race Cities (Marileo Studios, Osasco-SP)

Quem fala com o diretor é o **CEO** (não é programador): português simples, curto e claro; na dúvida, pergunte de forma resumida.
O diretor delega o trabalho a agentes (ferramenta Agent), cada um com nome e função claros. Sugestão de modelo: arte e código difíceis = Opus esforço alto; ajustes simples, textos e testes = Sonnet esforço médio; pesquisa de políticas de loja = Sonnet com busca na web.

## O produto
Jogo de corrida de kart 3D (estilo Mario Kart, bichinhos Leo, Mari etc.), chamado **Race Cities**: corridas pelas cidades do mundo (Osasco, Rio, Nova York, Londres, Paris, Roma, Cairo, Dubai, Agra, Pequim, Tóquio, Sydney), Grande Prêmio com copas, Cidade Surpresa e Copa Infinita (pistas por seed), online até 8 amigos (PeerJS/WebRTC), 4 jogadores na mesma tela.
- Site estático (ES modules + three@0.160.0 por import map, sem build); tudo procedural. GitHub Pages: https://mmsmartinelli.github.io/jogo-marileo/
- Apps: `android/` (Gradle, WebView, AdMob) e `ios/` (SwiftUI + WKWebView, XcodeGen, AdMob); CI em `.github/workflows/android.yml` e `ios.yml`.
- Anúncios: `js/ads.js` + `js/ads-config.js` (desligados; IDs de teste). Marcas dentro do jogo são FICTÍCIAS.

## Decisões do CEO (não reabrir)
- Nome **Race Cities**; anúncios Google (sem patrocinadores por enquanto); nomes fictícios; advogado só UMA consulta antes de ligar anúncios reais; NÃO migrar para Unity (só reavaliar se for para consoles); iOS fora da categoria Kids (4+, família).
- Blender: o CEO escolheu o **caminho 2** — o diretor gera os monumentos por script do Blender (bpy, modo background, `.glb`), começando pelo Cristo Redentor, e compara com o procedural em peso (draw calls/triângulos) e aparência.

## Pendências
1. Acabamento das 6 cidades mais fracas (Roma, Agra, Pequim, Cairo, Dubai, Sydney): conferir capturas, simular corridas, medir desempenho (linha de base: Osasco ~317 draw calls / 252k triângulos; Sydney 392 calls), commit, push, confirmar CI e Pages. Uma sessão antiga pode estar terminando isso na branch `claude/mario-kart-style-game-q1df4g` — fazer pull de novo antes de mexer.
2. Teste real no iPhone/Android do CEO (nunca testado em aparelho); online com dois aparelhos.
3. Ícones do Android: **feito** nesta rodada (commit `119ee3d`), falta testar em aparelho.
4. `privacidade.html` antes dos anúncios reais: **rascunho pronto** em `docs/privacidade-com-anuncios.html` + `docs/privacidade-checklist.md` (12 dúvidas para o advogado). Falta e-mail de contato, datas e "Osasco, São Paulo" a confirmar.
5. Só o CEO pode fazer (ajudar com passo a passo): Apple Developer (US$ 99/ano) + chaves App Store Connect + segredos no GitHub (APPLE_TEAM_ID, ASC_KEY_ID, ASC_ISSUER_ID, ASC_KEY_P8); Google Play (US$ 25; 12 testadores por 14 dias) + keystore Android (criar NO MAC; segredos ANDROID_KEYSTORE_B64/PASSWORD/ALIAS/KEY_PASSWORD); AdMob e IDs reais (`android/ads.properties`, `ios/project.yml`, depois `enabled:true` e `test:false` em `js/ads-config.js`); domínio; marca no INPI.
6. "Marileo Studios — Plano do Estúdio" (https://claude.ai/artifact/CoJSQpekzvwKtMUiaHNLrD): **atualizado** nesta rodada.
7. Ideias futuras: mais cidades, arte de loja/trailer (Adobe/Magnific), servidor PeerJS/TURN próprio, app-ads.txt.

## Regras de trabalho
- Testes de navegador: Playwright + Chromium e `python3 -m http.server`; simular corridas chamando `race.update(1/60)` com AIDriver.
- Verificar antes de afirmar que funciona; dizer com franqueza o que não foi testado em aparelho real.
- Commits em português; NÃO criar Pull Request sem o CEO pedir.
- Ao começar: apresentar ao CEO em 5 linhas o que está pronto, o que falta e a ordem proposta, e delegar o primeiro lote.

## Situação em 13/11/2026 (sessão na nuvem, branch `claude/bold-dijkstra-nndig4`)
- Feitos: ícones Android, rascunho de privacidade, Plano do Estúdio.
- Em andamento na nuvem: QA/medição das 12 cidades; script do Cristo no Blender (`tools/blender/`, ainda não integrado ao jogo).
- A nuvem não alcança o Blender do Mac: o script `tools/blender/cristo.py` deve ser rodado no Mac com `blender --background --python tools/blender/cristo.py`.

## Situação em 13/11/2026 à tarde (sessão do Mac assumiu como diretor)
- Tudo da nuvem foi puxado para o Mac (branch `claude/bold-dijkstra-nndig4`, commit `666af6d`). A sessão da nuvem só precisa confirmar "nada pendente" e ser arquivada pelo CEO.
- **Blender no Mac:** versão 5.3.0, configuração rápida concluída (português do Brasil, Blender Dark). Caminho da linha de comando: `/Applications/Blender.app/Contents/MacOS/Blender` (o comando `blender` não está no PATH).
- **Cristo Redentor:** `tools/blender/cristo.py` rodou no Blender real sem erro (~2 s, 67 KB, 1.940 triângulos, 3 materiais). Comparação: 2.280 triângulos (marco completo) contra 648 do procedural; draw calls iguais (7). **Ainda não ligado ao jogo.** Decisão pendente do CEO: vale o custo de ~1.600 triângulos a mais? Antes, medir o Rio inteiro com o modelo.
- **Acabamento das cidades fracas, 1º lote:** Roma e Agra, cada uma num agente próprio, em cópias isoladas (worktrees `.claude/worktrees/agent-*`), sem push. Limites: Roma ≤ ~350 calls / 230k triângulos; Agra ≤ ~330 calls / 230k triângulos. Ao terminar, o diretor confere capturas e números, junta na branch e só então faz push.
- **2º lote (ainda não lançado):** Pequim, Cairo, Dubai e Sydney. Atenção: Cairo, Dubai, Pequim, Tóquio e Sydney compartilham `js/cities/lm-east.js`, então devem rodar em sequência ou com merge cuidadoso.
- Prompt para a sessão do Mac nova: "Leia docs/BRIEFING-DIRETOR.md e docs/QA-cidades-linha-de-base.md, faça git pull e assuma como diretor do Race Cities. Apresente ao CEO em 5 linhas o que está pronto e o que falta, e delegue o próximo lote."
