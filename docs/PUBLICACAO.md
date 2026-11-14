# Publicação do Race Cities — guia para o CEO

Escrito em 13/11/2026 pelo agente "Publicação". Todas as fontes foram consultadas nesta data.
Marcação **⚠️ não verificado** = não consegui confirmar em fonte oficial; confirme antes de decidir.
Valores em US$ são os cobrados pela loja; o valor em R$ muda com o câmbio e impostos.

---

## 1. Resumo

**Onde publicar, em ordem:**
1. **Site próprio com domínio** (já existe no GitHub Pages; falta domínio e política de privacidade nova). Pronto em dias.
2. **Google Play** (Android). Começar já, porque conta pessoal nova exige 14 dias de teste.
3. **App Store** (iPhone/iPad). Em paralelo com o Google Play; o robô do GitHub já envia o app.
4. **itch.io** (grátis, vitrine extra, 1 tarde de trabalho).
5. **CrazyGames / Poki** (portais de jogos de navegador): só depois, e com ressalvas (veja seção 2.6).
6. **Steam, Microsoft Store, Epic**: não agora.

**Custo mínimo para estar nas duas lojas:** Google Play US$ 25 (uma vez) + Apple US$ 99 (por ano) + domínio .com.br cerca de R$ 40/ano = **cerca de US$ 124 + R$ 40 no primeiro ano**. Não incluí a consulta do advogado (valor ⚠️ não verificado) nem impostos/contador.

**Prazo realista:** Android público em **5 a 8 semanas** (conta pessoal: 14 dias de teste + até ~7 dias para Google liberar produção, mais a revisão do app). iPhone em **2 a 4 semanas** depois da conta Apple aprovada. Site e itch.io: **menos de 1 semana**.

**Renda mais rápida:** nenhuma é imediata. Anúncio só paga depois de acumular **US$ 100** no AdMob (fonte 9). O caminho mais rápido para o primeiro dinheiro é o app Android com AdMob, mas o valor por anúncio é baixo, pois o jogo usa anúncios sem personalização e com tratamento de criança. Não achei dados confiáveis de receita esperada: **⚠️ não verificado, não prometa número**.

**Melhor primeiro passo (esta semana):** criar a conta do Google Play e marcar a data dos 14 dias; no mesmo dia, pedir a conta Apple (a aprovação demora).

---

## 2. Plataformas, uma a uma

### 2.1 Google Play (Android)
- **Custo:** US$ 25 uma única vez (fonte 1). Taxa da loja só vale para vendas e compras; o jogo é grátis, então **não há taxa sobre anúncios** (a página de taxas não cita anúncios; ⚠️ não verificado de forma explícita). Se um dia vender algo: 15% sobre o 1º US$ 1 milhão do ano (fonte 2).
- **Requisitos:** app em formato AAB (o robô gera), `targetSdk` 36 (já está), política de privacidade com link, formulários: Anúncios, Segurança dos dados, Público-alvo, Classificação (IARC), ícone 512x512, imagem de destaque 1024x500, pelo menos 2 capturas de tela (jogos: recomendado 3+ em 1920x1080) e descrição curta de até 80 caracteres (fonte 3).
- **Prazo:** conta pessoal nova: 14 dias de teste fechado + análise do Google "geralmente até 7 dias, pode demorar mais" (fonte 4). Depois, a revisão de cada versão: ⚠️ não achei prazo oficial atual; conte alguns dias.
- **Riscos:**
  - Jogo "para toda a família" com público de crianças entra na **Política para Famílias** (seção 6).
  - App que é só um site embrulhado (WebView) pode ser recusado se não tiver autorização do dono do site (fonte 5). O nosso carrega o jogo **de dentro do pacote** e o site é nosso, o que ajuda; deixe isso claro na descrição de revisão.
  - O modo online exige **aviso de segurança online dentro do app** para quem tem crianças no público (fonte 5). O aviso já existe: tela "Jogue online com segurança" na 1ª vez de cada aparelho (antes de criar/entrar numa sala) e sempre disponível em "Como Jogar".
  - Verificação de desenvolvedor do Android: desde 30/09/2026 vale no Brasil; apps da Play são registrados automaticamente (fonte 6). Isso também afeta o APK solto de `baixar.html`: sem registro, o APK só instala por caminho avançado (fonte 6).

### 2.2 App Store (iPhone/iPad)
- **Custo:** US$ 99 por ano (fonte 7; um relato de usuário no fórum da Apple mostra cobranças de cerca de R$ 540 no Brasil, mas **não é preço oficial**). Isenção só para ONGs, escolas e governo (fonte 7). Programa para pequenos desenvolvedores: comissão de **15%** em vendas e compras no app se a receita for até US$ 1 milhão (fonte 8). Como o jogo é grátis com anúncios, a comissão quase não importa.
- **Requisitos:** conta Apple, app criado no App Store Connect, chave de API para o GitHub, build enviado pelo robô, textos e capturas (já existem em `ios/AppStore/`), questionário de privacidade e de classificação etária, política de privacidade. Passo a passo em `ios/LEIA-ME.md`.
- **Prazo:** aprovação da conta: de horas a ~2 dias segundo o LEIA-ME do repositório (⚠️ não verificado em fonte Apple hoje). Revisão do app: fontes de blogs falam em 1 a 3 dias normalmente, com relatos de semanas em 2026 (fonte 10, ⚠️ não são dados oficiais).
- **Riscos:**
  - Jogo com anúncios fora da categoria Crianças (decisão já tomada, diretrizes 1.3 e 5.1.4; ver `docs/ANUNCIOS.md` seção 6).
  - App que parece "só um site" pode levar recusa por pouca funcionalidade (diretriz 4.2) ⚠️ não verificado hoje; a defesa é o jogo ir dentro do pacote e funcionar offline (já é assim) e dizer isso nas notas de revisão (`ios/AppStore/textos.md`).
  - **Nunca foi testado em iPhone de verdade.** Usar o TestFlight antes de enviar.
  - O questionário de classificação etária da Apple foi renovado (faixas 4+, 9+, 13+, 16+, 18+): ⚠️ não verificado nesta pesquisa, a página oficial não abriu. Responda o questionário atual dentro do App Store Connect.

### 2.3 Site próprio / GitHub Pages (+ domínio)
- **Custo:** GitHub Pages grátis; domínio .com.br cerca de R$ 40/ano no Registro.br (fonte 11; revendedores mostram de R$ 26 a R$ 35 no 1º ano, ⚠️ promoções).
- **Limites do GitHub Pages:** site até 1 GB, "limite suave" de 100 GB de tráfego por mês, e **não é permitido usar como hospedagem grátis para tocar um negócio online** (fonte 12). A página não fala de anúncios: ⚠️ não verificado se jogo grátis com AdSense é aceito. **Risco real de suspensão** se o site crescer ou for visto como negócio. Plano B simples: mesma pasta numa hospedagem estática barata ou grátis (Cloudflare Pages, Netlify, Vercel); o diretor pode migrar em minutos, o site não tem build.
- **O que já está pronto:** site funcionando, PWA instalável (manifest + service worker), página `baixar.html`, `privacidade.html` (versão sem anúncios).
- **Para ganhar dinheiro no site:** AdSense para jogos (H5) já está no código desligado. ⚠️ Aprovação do AdSense para site de jogo infantil não verificada.
- **Prazo:** domínio ativo em 1 a 2 dias. **Risco:** ao trocar o endereço, o `app-ads.txt` do AdMob e as URLs de privacidade nas lojas precisam ser atualizados; escolha o domínio antes de preencher as lojas.

### 2.4 itch.io
- **Custo:** grátis para publicar. Você escolhe a fatia do itch.io (padrão 10%, de 0% a 100%) (fonte 13). Sem anúncios nativos: serve como vitrine, divulgação e recebimento de doações. Para jogo 100% grátis, não há renda direta.
- **Requisitos:** conta, página com capturas, jogo enviado como ZIP de HTML5 (a pasta do site, rodando por `index.html`) ou link. ⚠️ O modo online usa PeerJS de CDN: testar dentro do itch.io.
- **Prazo:** no mesmo dia. **Risco:** baixo.

### 2.5 CrazyGames
- **Como funciona:** anúncios via SDK deles; você divide a receita, mas a página oficial **não informa o percentual** (fonte 14, ⚠️ não verificado). Pagamento mensal a partir de € 100 (fonte 14).
- **Requisitos:** limite de 50 MB no download inicial e 250 MB no total (fonte 15), SDK deles integrado para ter anúncios, suporte a inglês, sem anúncios externos (fonte 14).
- **Risco grande:** a plataforma mira público de **13+ e exige conteúdo dentro do PEGI-12**; conteúdo "voltado a crianças" pode ser reprovado (fontes 14 e 15). O Race Cities é de família/crianças; o jogo pode ser aceito (kart cartoon sem violência), mas **a descrição não deve dizer "para crianças"**. Aprovação: sem prazo publicado (fonte 14).
- **Veredito:** testar depois do Android/iOS; custo zero, mas exige trabalho de código (SDK). Não dá para usar o AdMob/AdSense nosso lá.

### 2.6 Poki
- **Como funciona:** curadoria manual ("cada jogo é escolhido a dedo"). Quem chega por busca/redes/comunidade própria rende 100% para você; quem chega pelo Poki divide 50/50 (fonte 16).
- **Exclusividade:** o Poki pede **exclusividade na web aberta** (não pode estar em outros portais); lojas de app e Steam não entram (fonte 16). ⚠️ Não verificado se o nosso site próprio conta como "outro portal"; perguntar a eles antes de assinar.
- **Prazo e regras de crianças:** ⚠️ não verificados (páginas de requisitos e política de segurança não foram lidas).
- **Veredito:** só vale a pena se o jogo for aceito com exclusividade só web. Deixar para depois da Play/App Store.

### 2.7 Steam (navegador/Electron)
- **Custo:** US$ 100 por jogo, devolvido quando o título passar de US$ 1.000 em vendas; só se pode lançar 30 dias depois do pagamento (fonte 17).
- **Faz sentido?** **Não agora.** Jogo grátis com anúncios para famílias não combina com a Steam; seria preciso empacotar com Electron, trocar os anúncios do Google (não funcionam como no app) e gerenciar a página. O ganho é incerto. Reavalie se um dia houver versão paga/premium. ⚠️ Esta é uma opinião minha; sem dados de vendas.

### 2.8 Microsoft Store, Epic e outras
- **Microsoft Store:** registro de desenvolvedor passou a ser **grátis** (individual desde set/2025; empresa desde mai/2026, segundo notícias; fonte 18). Dá para publicar o site como PWA (ferramenta PWABuilder). ⚠️ não verificado: regras para PWAs e anúncios. Baixa prioridade; só se sobrar tempo.
- **Epic Games Store, Amazon, Samsung:** ⚠️ não pesquisados; não fazem sentido para um jogo grátis de navegador agora.

### Qual dá renda mais rápida e qual é o primeiro passo
| Ordem | O quê | Por quê |
|---|---|---|
| 1 | Google Play + AdMob | Maior público no Brasil (⚠️ não verifiquei participação de mercado), custo US$ 25, único fluxo com anúncio nativo |
| 2 | App Store | Já tem robô e textos; custo US$ 99/ano |
| 3 | Site + domínio | Ponte para tudo (política de privacidade, app-ads.txt, divulgação) |
| 4 | itch.io | Grátis, divulgação |
| 5 | CrazyGames/Poki | Depois, se o jogo for aceito |

---

## 3. Checklists: o que SÓ O CEO faz e o que já está pronto

### 3.1 Antes de qualquer loja (valem para todas)
**Só o CEO:**
- [ ] Decidir se publica em nome de **pessoa física (CPF)** ou **empresa (CNPJ)** (pergunta 1 na seção 7).
- [ ] Criar um **e-mail do estúdio** (ex.: contato@seu-domínio) e comprar o **domínio**.
- [ ] Fazer a **consulta única com o advogado** (`docs/privacidade-checklist.md`, 12 dúvidas) antes de ligar anúncios reais.
- [ ] Preencher `[PREENCHER]` da política de privacidade (datas, responsável; e-mail já definido: mmsmartinelli@gmail.com) e aprovar a publicação do texto novo.
- [ ] Conta bancária/impostos para receber (AdMob pede dados fiscais; ⚠️ não verifiquei a exigência de CPF/CNPJ no AdMob; na Google Ads é exigido, fonte 9).

**Já pronto no repositório:**
- Jogo web, PWA, `privacidade.html` (versão sem anúncios) e rascunho com anúncios em `docs/privacidade-com-anuncios.html`.
- Apps `android/` e `ios/` com anúncios desligados e tratamento de criança; robôs `.github/workflows/android.yml` e `ios.yml`.
- Textos e 12 capturas de iPhone/iPad em `ios/AppStore/`.
- `docs/ANUNCIOS.md` (seção 6: regras das lojas; seção 8: passo a passo do AdMob).

### 3.2 Google Play
**Só o CEO:**
- [ ] Criar a conta em play.google.com/console e pagar US$ 25; verificar identidade (documento com foto, cartão no mesmo nome) (fonte 1).
- [ ] **Regra de contas pessoais novas** (texto atual, fonte 4): para contas pessoais criadas depois de 13/11/2023, é preciso rodar um **teste fechado com no mínimo 12 testadores, todos com adesão contínua por 14 dias seguidos**. Quem sai e volta não conta. Depois, pedir "acesso à produção" no painel; o Google responde normalmente em até 7 dias, e pode pedir mais teste se houver menos de 12 ou pouca atividade. **Contas de organização não aparecem nessa regra** na página; ⚠️ confirme no painel e saiba que organização exige número D-U-N-S (grátis, mas pode levar dias ou semanas; fonte 1).
- [ ] Conseguir **12+ pessoas** (família, amigos, colegas) com e-mail Google para entrar no teste e **realmente abrir o jogo** durante os 14 dias.
- [ ] Criar a chave de assinatura **no Mac**: `keytool -genkeypair -v -keystore race-cities.jks -alias racecities -keyalg RSA -keysize 4096 -validity 10000` (o Java já está no Mac). **Guardar o arquivo e as senhas em 2 lugares seguros: perder = nunca mais atualizar o app.**
- [ ] Criar os 4 segredos no GitHub (Settings > Secrets and variables > Actions): `ANDROID_KEYSTORE_B64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD` (explicação no topo de `.github/workflows/android.yml`).
- [ ] Rodar Actions > Android > Run workflow para gerar o AAB e subir no Play Console.
- [ ] Formulários: Público-alvo e conteúdo, Anúncios (Sim), Segurança dos dados, Classificação de conteúdo (IARC), categoria Jogos > Corrida, país de distribuição, e-mail de contato.
- [ ] Textos, ícone, imagem de destaque, capturas e vídeo (seção 5).
- [ ] Impostos/pagamentos do perfil de pagamentos do Google.

**Já pronto:** pacote `com.marileostudios.racecities`, `targetSdk 36`, ícones do app, AAB automático, permissões mínimas (sem AD_ID), SDK de anúncios na lista de Famílias (`docs/ANUNCIOS.md` seção 6).

### 3.3 App Store
**Só o CEO:**
- [ ] Assinar o Apple Developer Program (US$ 99/ano) em developer.apple.com/programs/enroll com Apple ID (individual ou organização; organização exige D-U-N-S ⚠️ não verificado hoje).
- [ ] Criar o app no App Store Connect (nome Race Cities, ID `com.marileostudios.racecities`, SKU `racecities`).
- [ ] Gerar a chave da API do App Store Connect e criar os 4 segredos no GitHub: `APPLE_TEAM_ID`, `ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_KEY_P8`.
- [ ] Rodar Actions > iOS > Run workflow; instalar pelo TestFlight no iPhone e **testar de verdade** (online com dois aparelhos).
- [ ] Questionários de classificação etária e **Privacidade do app** (tabela em `docs/ANUNCIOS.md` seção 6; `textos.md` traz as duas respostas: "Dados não coletados" **só enquanto os anúncios estiverem desligados**, e a versão com AdMob para quando ligar).
- [ ] Colar textos, escolher o build, "Enviar para revisão".

**Já pronto:** projeto XcodeGen, robô de build e envio, textos e 12 capturas (iPhone 6,9" e iPad 13"), categoria Corrida, fora de Kids, sem pedido de rastreamento.
**Conferir antes de enviar:** as capturas atuais mostram Paris, Rio, Tóquio, Londres e Cairo; veja se estão no visual mais recente depois do acabamento das cidades.

### 3.4 Site, domínio e itch.io
**Só o CEO:** comprar o domínio (Registro.br ou revendedor), aprovar apontamento; criar conta no itch.io.
**Já pronto:** site, PWA, página de download, política atual.
**Falta (peço ao diretor):** configurar o domínio no GitHub Pages (arquivo `CNAME` + DNS), trocar as URLs de privacidade/suporte nos textos, gerar o ZIP do itch.io, publicar `app-ads.txt` quando o AdMob pedir.

### 3.5 AdMob (para ligar anúncios)
**Só o CEO:** conta AdMob, dados fiscais e de pagamento, cadastrar os 2 apps, marcar "direcionado a crianças" e classificação G, criar os blocos, colar os IDs (passo a passo em `docs/ANUNCIOS.md` seção 8). Pagamento sai quando passar **US$ 100** (fonte 9). Nunca clicar nos anúncios reais no próprio celular.

---

## 4. Softwares e ferramentas

**Precisa de algum software para montar e publicar o jogo? Para o que existe hoje: não, além do que o Mac já tem.** O jogo é um site sem etapa de compilação; o GitHub compila Android e iPhone na nuvem.

**Obrigatório:**
- Conta no **GitHub** (já existe) e navegador (Chrome).
- **Java/keytool** para criar a chave Android: já instalado no Mac (verificado: OpenJDK 17).
- Contas nas lojas (seções 3.2 e 3.3).
- Aparelhos reais para testar: um Android e um iPhone (⚠️ o CEO precisa confirmar se tem os dois).

**Opcional (ajuda, não bloqueia):**
- **Xcode** (já tem): abrir o projeto iOS para depurar. O GitHub faz o build sem ele.
- **Android Studio**: só se quiser depurar o app Android; o robô compila sem ele.
- **Adobe (Photoshop/Express/Premiere) e Magnific**: arte de loja e trailer (seção 5).
- **Blender 5.3**: só para modelar monumentos (Cristo etc.). **Não tem papel na publicação.**
- **Node.js**: já usado pelo robô na nuvem; no Mac não está instalado (`node` não encontrado) e só é preciso se quiser rodar `ios/build-web.mjs` localmente. ⚠️ Os testes do diretor (Playwright) podem exigir Node; confirmar.

**NÃO precisa:**
- **Unity ou outra engine** (decisão do CEO: não migrar; só reavaliar se for para consoles).
- Servidor próprio, banco de dados ou analytics (o jogo não coleta dados).
- Mac para o iOS (o GitHub faz), nem Android Studio para o AAB.

---

## 5. Arte de loja e marketing mínimo

**O que cada loja pede** (Google Play, fonte 3; Apple: capturas já existentes no repositório):
| Item | Medida / limite | Situação |
|---|---|---|
| Ícone Google Play | 512x512 PNG com transparência, até 1 MB | `icons/icon-512.png` existe; conferir se serve |
| Imagem de destaque Google Play | 1024x500 PNG/JPG sem transparência | **falta** |
| Capturas Google Play | mínimo 2; jogos: recomendado 3+ em 1920x1080 | **falta** (as do iOS são 2868x1320 e precisam de recorte/versão 1920x1080) |
| Capturas App Store | iPhone 6,9" e iPad 13" | **12 prontas** em `ios/AppStore/screenshots/` |
| Vídeo | YouTube público/não restrito; só os 30 primeiros segundos tocam | **falta**; jogos são "fortemente incentivados" a ter |
| Descrição curta (Play) | até 80 caracteres | **falta** |
| Título | Play: ⚠️ limite não verificado (costuma ser 30); Apple: 30 | Race Cities cabe |

**O que dá para produzir com as ferramentas disponíveis:**
- **Capturas**: o diretor gera com Playwright em 1920x1080 e 1080x1920 (já foi usado para as do iOS). Para moldura e texto ("Corra por 12 cidades!"), usar Adobe Express ou Photoshop.
- **Imagem de destaque 1024x500**: Adobe Express/Photoshop com logo, personagens (Leo, Mari) e uma captura. Magnific para arte de apoio; **a arte não pode mostrar marca real nem personagem protegido**.
- **Trailer de 20 a 30 s**: gravar a tela do jogo (QuickTime ou captura automática do diretor), cortar no Adobe Premiere ou Express, música e efeitos do próprio jogo (já são gerados) ou Magnific. Publicar no YouTube em "não listado".
- **Descrições PT/EN**: PT já existe em `ios/AppStore/textos.md`; falta o **EN** e a versão Android (curta de 80 caracteres + completa). Peço ao diretor para redigir; recomendo revisão do CEO.

**Palavras-chave** (App Store, até 100 caracteres): `kart,corrida,cidades,mundo,família,multiplayer,amigos,online,offline,leão,gatinha,turbo`. "Crianças" já foi retirado do campo de palavras e da descrição (regras 2.3.8, 1.3 e 5.1.4; anotado em `ios/LEIA-ME.md`). Para Play, as palavras vão naturalmente na descrição; para EN usar `kart racing, family game, race around the world, multiplayer, offline`.

**Marketing mínimo, sem custo:** página única no site com link das lojas; vídeo no YouTube; posts curtos nas redes (ferramenta Metricool já conectada ao diretor ⚠️ confirmar se o CEO quer usar); pedir avaliações a amigos e família depois do lançamento.

---

## 6. Conformidade (só o que muda para quem mostra anúncios a crianças)

| Tema | O que muda para o Race Cities | Fonte |
|---|---|---|
| **Classificação etária** | Responder honestamente: sem violência realista; "violência de desenho animado leve" (banana, foguete). Play usa IARC (questionário); Apple, questionário no App Store Connect. No Brasil, as lojas fazem a classificação indicativa a partir das respostas (⚠️ não verificado como é no Brasil hoje). | `ios/AppStore/textos.md` |
| **Google Play: Políticas para Famílias** | Se marcar público com menos de 13 anos: **só SDKs de anúncio certificados para Famílias** (o AdMob está na lista), **sem anúncios por interesse nem remarketing**, anúncios apropriados; **proibido**: tela cheia sem jeito de fechar, anúncio premiado que não fecha em 5 s, intersticial ao abrir o app, vários anúncios na mesma tela, anúncio disfarçado de conteúdo. Apps só para crianças **não podem enviar ID de publicidade** (já removido). Políticas e declarações (Segurança dos dados, Público-alvo, IARC) precisam bater. **Social/online:** mostrar aviso de segurança online e exigir ação de adulto antes de trocar dados pessoais (hoje o jogo usa só apelido e código de sala; o aviso ainda não existe). | fonte 5 |
| **App Store 1.3 e 5.1.4** | Categoria **Crianças** não pode ter anúncios de terceiros; por isso fica **fora** de Kids (4+ família). Evitar "para crianças/infantil" em nome, subtítulo e palavras-chave. Privacidade do app deixa de ser "Dados não coletados" quando os anúncios ligam. Sem ATT. | `docs/ANUNCIOS.md` seção 6 (⚠️ texto das diretrizes não reaberto hoje) |
| **ECA Digital (Lei 15.211/2025)** | Em vigor desde **17/03/2026**; aplica-se a jogos e lojas, inclusive empresas de fora; **proíbe perfilamento para publicidade a crianças e adolescentes** (anúncios não personalizados ajudam); **proíbe "caixas de recompensa" (loot boxes)** em jogos para crianças (o jogo tem "caixas surpresa", mas são itens de corrida gratuitos, **não compras com sorteio**; confirmar com o advogado); verificação de idade por mecanismo confiável, **autodeclaração não basta**, com cronograma da ANPD em 3 fases (as lojas têm obrigações próprias). Multa até R$ 50 milhões por infração. Fonte são escritórios e imprensa, não o texto da lei: ⚠️ conferir o Decreto 12.880/2026 e o cronograma da ANPD com o advogado. | fonte 19 |
| **LGPD (art. 14)** | Dados de criança exigem melhor interesse e consentimento específico de um dos pais; o rascunho de privacidade e as 12 dúvidas estão em `docs/privacidade-checklist.md`. | repo |
| **COPPA (EUA) / GDPR** | Se a loja for global, entram regras dos EUA e da Europa; a Play exige cumprir COPPA/GDPR (fonte 5). **Mais simples: limitar a distribuição ao Brasil no início** (dúvida 6 do checklist do advogado). | fonte 5 |
| **Recompensa** | Vídeo premiado: só liberar depois de confirmar que fecha em até 5 s (Play). Hoje não há botão, deixar desligado. | fonte 5 |

---

## 7. Cronograma de 8 semanas (a partir de 16/11/2026)

| Semana | Foco | Quem |
|---|---|---|
| **1** (16-22/11) | Decidir as 6 perguntas abaixo. Criar conta Google Play e conta Apple. Comprar domínio, criar e-mail. Criar a chave Android no Mac e os segredos. Marcar consulta do advogado. | CEO |
| **2** (23-29/11) | Gerar o 1º AAB e subir no **teste fechado**; convidar 12+ testadores (**relógio de 14 dias começa**). Primeiro build iOS no TestFlight; testar em iPhone e Android reais (online com 2 aparelhos). Diretor: aviso de segurança online, domínio no GitHub Pages, ZIP do itch.io. | CEO + diretor |
| **3** (30/11-6/12) | Capturas 1920x1080, imagem de destaque, textos EN/PT; publicar no **itch.io**. Consulta do advogado; ajustar política. Acabamento das cidades em andamento. | Diretor + CEO |
| **4** (7-13/12) | Conta AdMob, IDs de teste na loja. Trailer de 30 s. Preencher formulários da Play (público-alvo, anúncios, segurança dos dados). | CEO + diretor |
| **5** (14-20/12) | Fim dos 14 dias de teste (se o início foi na semana 2); **pedir acesso à produção** (Google responde em até ~7 dias). Enviar iOS para revisão. | CEO |
| **6** (21-27/12) | Corrigir o que a Apple/Google pedirem. Política nova publicada e **anúncios reais ligados no mesmo dia** (`enabled:true`, `test:false`). Fim de ano: lojas podem demorar mais ⚠️. | Diretor + CEO |
| **7** (28/12-3/1) | Lançamento Android (produção) e iPhone; publicar `app-ads.txt`; vincular apps ao AdMob. | CEO + diretor |
| **8** (4-10/1) | Medir (AdMob, painéis das lojas), corrigir falhas, decidir sobre CrazyGames/Poki. | Todos |

Se Marileo Studios tiver CNPJ e abrir **conta de organização** na Play (⚠️ confirmar que dispensa o teste de 14 dias), o Android pode sair 2 a 3 semanas antes.

### 6 perguntas para o CEO decidir
1. Publicar como **pessoa física (CPF)** ou **empresa (CNPJ)**? A empresa dispensa (⚠️ confirmar) os 12 testadores e mostra "Marileo Studios" como vendedor, mas pede número D-U-N-S.
2. Quem são os **12 testadores** (nomes e e-mails Google)? Consegue chegar a 12 em uma semana?
3. **Qual domínio** (ex.: racecities.com.br) e **qual e-mail de contato** do estúdio?
4. Lançar **só no Brasil** primeiro (menos regras de COPPA/GDPR) ou no mundo todo?
5. Quando fazer a **consulta do advogado** (precisa ser antes de ligar anúncios reais, semana 3 no plano)?
6. Tem **um Android e um iPhone** para testar de verdade? E aceita investir US$ 124 (Google + Apple) já nesta semana?

---

## Fontes (consultadas em 13/11/2026)
1. Google Play Console, taxa de registro e verificação: https://support.google.com/googleplay/android-developer/answer/6112435 e https://developer.android.com/developer-verification/guides/early-access (resultados de busca; taxa US$ 25 única; organização exige D-U-N-S).
2. Taxas de serviço do Google Play: https://support.google.com/googleplay/android-developer/answer/112622
3. Recursos da página da loja Play: https://support.google.com/googleplay/android-developer/answer/9866151
4. Requisitos de teste para contas pessoais novas: https://support.google.com/googleplay/android-developer/answer/14151465
5. Política para Famílias do Google Play: https://support.google.com/googleplay/android-developer/answer/9893335
6. Verificação de desenvolvedor Android: https://android-developers.googleblog.com/2026/06/android-developer-verification.html
7. Apple Developer Program (US$ 99 e isenções): https://developer.apple.com/support/compare-memberships/ e https://developer.apple.com/br/help/account/membership/fee-waivers/ (preço US$ 99 vindo de busca/termos citados, não da página aberta)
8. Apple Small Business Program: https://developer.apple.com/app-store/small-business-program/
9. Limiar de pagamento do AdMob (US$ 100): https://support.google.com/admob/answer/2772208
10. Prazos de revisão da App Store (blogs, não oficiais): https://stora.sh/blog/2026-04-30-app-store-review-delays-2026-release-planning-guide e https://www.lowcode.agency/blog/ios-app-review-delays-march-2026
11. Preço .br (NIC.br via Teletime): https://teletime.com.br/14/10/2026/br-6-milhoes/
12. Limites do GitHub Pages: https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits
13. itch.io pagamentos: https://itch.io/docs/creators/payments
14. CrazyGames FAQ: https://docs.crazygames.com/faq/
15. CrazyGames requisitos: https://docs.crazygames.com/requirements/intro/
16. Poki para desenvolvedores: https://developers.poki.com/guide/working-with-poki
17. Steam Direct: https://partner.steamgames.com/steamdirect e https://partner.steamgames.com/doc/gettingstarted/appfee
18. Microsoft Store gratuita para desenvolvedores: https://blogs.windows.com/windowsdeveloper/?p=57775 e https://alternativeto.net/news/2026/5/microsoft-drops-99-fee-for-organizations-to-publish-apps-on-the-microsoft-store/ (notícias; ⚠️ confirmar no cadastro)
19. ECA Digital: https://www.machadomeyer.com.br/pt/inteligencia-juridica/publicacoes-ij/direito-digital/estatuto-digital-da-crianca-e-do-adolescente-lei-n-15-211-2025-entra-em-vigor-em-17-de-marco-de-2026 e https://www.computerweekly.com/br/reportagen/ECA-Digital-obrigacoes-penalidades-e-o-que-muda-para-plataformas-digitais-no-Brasil
