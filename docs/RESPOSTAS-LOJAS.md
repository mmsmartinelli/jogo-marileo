# Respostas prontas para as lojas — versão 1 (SEM anúncios, Brasil, grátis)

Base: política em https://mmsmartinelli.github.io/jogo-marileo/privacidade.html (vigência 14/11/2026).
Rascunho preparado pela seção 7; **não é parecer jurídico**. Vale só enquanto `enabled: false` em `js/ads-config.js`.
Fatos conferidos no código: sem cadastro/conta, sem compras, sem chat livre, só `localStorage` (progresso, apelido, som, aviso online), permissões Android só INTERNET e ACCESS_NETWORK_STATE (AD_ID removido), iOS sem pedido de rastreamento. Online = PeerJS (jsDelivr) + STUN do Google, apelido/personagem/posição entre jogadores, nada guardado por nós.

⚠️ **Atenção:** o app ainda traz o SDK do Google AdMob dentro (Android e iOS), mas ele só inicia quando os anúncios são ligados (`GameAds.prepare` só roda com `enabled: true`). Por isso “não coleta dados” é verdadeiro **hoje**. Se alguém ligar os anúncios, TODAS as respostas abaixo mudam (ver fim).

## 1. Apple — App Privacy (rótulos)
- **Coleta dados deste app?** → **Não, não coletamos dados** (“Data Not Collected”).
  Por quê: o apelido e a posição só passam entre aparelhos da sala e não ficam conosco; IP em PeerJS/STUN é de terceiros e só na conexão. Risco: declarar “coleta” sem precisar exige explicar; declarar “não” e estar errado é pior.
- **Rastreamento (ATT)** → **Não**; não há `NSUserTrackingUsageDescription`.
- **URL da política:** a de cima. **URL de suporte:** …/privacidade.html#suporte

## 2. Apple — classificação etária (questionário novo)
- Violência de desenho animado/fantasia → **Pouco frequente/leve** (banana e foguete de brinquedo). Por quê: é honesto e mantém 4+.
- Violência realista, sexual, nudez, terror, drogas, álcool, apostas (inclusive simuladas), linguagem imprópria, armas realistas → **Nenhum**.
- Conteúdo gerado por usuários/mensagens/chat → **Não** (só apelido e código de sala; sem texto livre). Por quê: dizer “sim” aumenta a classificação e exige moderação.
- Controle dos pais / restrição de idade / compras → **Não**. Anúncios → **Não**.
- Resultado esperado: **4+**. **Não** marcar categoria Kids (exige regras extras).

## 3. Google Play — Segurança dos dados
- **Coleta ou compartilha dados do usuário?** → **Não**.
  Por quê: nada é enviado a servidor nosso; SDK de anúncios não inicia. Risco: o Play lê o SDK AdMob no pacote; se a Play questionar, a resposta é que está dormente (confirmar com o advogado/reanálise).
- **Criptografia em trânsito / exclusão de dados:** não se aplicam (sem coleta). URL de política: a de cima.
- **ID de publicidade:** → **Não usa** (permissão AD_ID já removida no manifesto).

## 4. Google Play — Público-alvo e conteúdo
- **Faixas etárias:** marcar **13–15, 16–17 e 18+**. **NÃO marcar “até 12 anos”** (5 e menores, 6–8, 9–12).
  Por quê: qualquer faixa <13 ativa a política **Famílias** (SDKs certificados, regras de anúncios, mais revisão), o que pesa por causa do AdMob e do modo online. Risco: o jogo é visualmente infantil; o Play pode considerar que “atrai crianças” e exigir Famílias mesmo assim. **Pergunta nº 1 ao advogado.**
- **O app atrai crianças?** → responder com cuidado: “Não” é o coerente com a escolha acima, mas arriscado; alternativa segura é escolher 9–12 e aceitar Famílias. **Decisão do CEO/advogado antes de enviar.**
- **Contém anúncios?** → **Não**.

## 5. Google Play — IARC (classificação de conteúdo)
- Categoria: **Jogo**. Violência: **só desenho animado/fantasia, sem sangue**. Sexo/nudez, drogas, apostas, linguagem imprópria, medo: **Não**.
- Compartilha localização? **Não**. Interação entre usuários/chat? **Não há texto livre** (só apelido e posição na sala). Compras? **Não**. Acesso à internet livre/navegador? **Não**.
- Resultado esperado: **Livre / 3+ (PEGI 3)**. Por quê: responder “interação entre usuários = sim” sobe a faixa; o apelido é escolhido pelo próprio jogador, então mencione na observação se o formulário permitir.

## 6. Google Play — Acesso ao app
- **Todas as funções disponíveis sem login** (“Não requer login/credenciais”). Por quê: não existe conta; o online só pede código de sala.

## 7. Anúncios
- **Play:** “Contém anúncios” → **Não**. **Apple:** sem anúncios. Por quê: `enabled: false`.

## Se os anúncios forem ligados depois
Tudo muda: Apple passa a declarar dados de publicidade/falhas/desempenho (identificadores, uso); Play passa a “Sim” em anúncios e em Segurança dos dados (ID do dispositivo, falhas, interações); reativar AD_ID só se necessário; trocar a política por `docs/privacidade-com-anuncios.html` no mesmo dia; e rever a decisão de faixa etária/Famílias. Isso é a consulta única ao advogado (`docs/privacidade-checklist.md`).
