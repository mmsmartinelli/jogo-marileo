# Monetização do Race Cities — plano para o CEO

Escrito em 13/11/2026 (agente Monetização). Linguagem simples, de propósito.
Convenções: **[F#]** = fonte na lista do fim (todas consultadas em 13/11/2026). **⚠️ não verificado** = não consegui confirmar em fonte confiável; trate como hipótese. Marcas dentro do jogo são fictícias; parcerias reais acontecem só por fora (cartão de patrocinador, loja, mídia kit).
**Este texto não é parecer jurídico nem contábil.** Onde diz "advogado" ou "contador", é porque a decisão final é deles.

---

## 1. Resumo (10 linhas)

1. Renda realista só com anúncio, em jogo infantil: **centavos por jogador**. Com 1.000 jogadores ativos por dia, algo como **R$ 60 a R$ 400 por mês**; com 10.000, **R$ 600 a R$ 4.000** (premissas na seção 2.1; os valores de eCPM são hipótese, não medida).
2. Por isso, nos primeiros meses o objetivo é **aprender e provar audiência**, não "viver do jogo". A conta de loja (Apple US$ 99/ano + Google US$ 25 uma vez) já consome o que 1.000 jogadores/dia rendem em anúncio.
3. Caminho mais curto: **(a)** ligar o que já existe (intervalo após a corrida, AdMob nos apps, AdSense no site) depois da consulta ao advogado; **(b)** ajustar a frequência (hoje aparece após quase toda corrida — seção 3); **(c)** testar 1 portal (CrazyGames ou Poki) para ganhar público; **(d)** piloto com 1 a 3 comércios locais.
4. Patrocínio local paga mais por exibição que o Google, mas **só vale se medirmos** (hoje a contagem fica no aparelho de cada jogador) e **só com anúncio feito para adultos**, não para crianças (Resolução 163 do Conanda; seção 4).
5. Segunda fonte, mais para frente: **"remover anúncios"** (compra única) e **personagens/visuais de preço fixo**. **Nunca "caixa-surpresa"**: o ECA Digital proíbe em jogo que crianças acessam (art. 20) [F11].
6. Lojas: no Brasil o Google Play segue em 15% até US$ 1 mi/ano e 30% depois (a nova tabela chega ao Brasil só até 30/09/2027) [F1][F2]; a Apple anunciou em 18/06/2026 taxa de 10% para quem está no Small Business Program, 21% para os demais, mais 5% de processamento (⚠️ detalhes: confira a tabela oficial) [F3].
7. Impostos: abrir empresa (MEI ou ME) **antes** de ligar os anúncios reais; contador deve confirmar enquadramento, nota fiscal e recebimento do exterior (seção 5).
8. Riscos que pedem decisão cedo: iPhone (Apple restringe anúncio de terceiros em app voltado a crianças), cartão de patrocinador dentro de app (Google Play Famílias), modo online com crianças (ECA Digital art. 21). Levar à **única consulta ao advogado**.
9. Plano de 90 dias na seção 6; 6 perguntas para você na seção 7.
10. Regra de ouro: **nunca prometer ao patrocinador número que o jogo não mediu**.

---

## 2. Modelos de receita, comparados para ESTE jogo

### 2.0 Regras para crianças que valem para tudo (resumo)

- **Google Play (Famílias):** anúncio para criança ou idade desconhecida só de SDK autocertificado para Famílias, sem anúncio por interesse nem remarketing; anúncio que atrapalha o jogo, inclusive "premiado", precisa poder ser fechado após 5 s; nada de intersticial ao abrir o app [F5]. AdMob está na lista (já descrito em `docs/ANUNCIOS.md`, seção 6).
- **App Store:** categoria "Crianças" não pode ter anúncio de terceiros; apps "principalmente para crianças" também não devem (diretrizes 1.3 e 5.1.4) — por isso a decisão já tomada: jogo "para toda a família", 4+, fora de Kids (`docs/ANUNCIOS.md`, seção 6). ⚠️ Se um anúncio de patrocinador local conta como "de terceiros" para a Apple, é pergunta para o advogado.
- **LGPD, art. 14:** dado de criança só "em seu melhor interesse"; consentimento específico de um dos pais; não condicionar o jogo a dar mais dados que o estritamente necessário [F12]. Hoje o jogo não coleta nada seu; o SDK do Google coleta o que está na seção 6 de `ANUNCIOS.md`.
- **ECA Digital (Lei 15.211/2025), em vigor desde 17/03/2026** [F11]: proíbe perfilar criança para publicidade (art. 22 e 26), proíbe caixas de recompensa (art. 20), exige que jogos com interação entre usuários limitem essas funções por padrão e assegurem consentimento dos pais (art. 21); multa até 10% do faturamento do grupo no Brasil, limitada a R$ 50 milhões por infração (art. 35). Nossos anúncios são sem personalização — bom — mas o **modo online** (sala de até 8 amigos) precisa ser analisado no art. 21 (⚠️ não analisei o texto completo; entra na consulta).
- **COPPA (EUA, menores de 13):** regra revisada, prazo geral de adequação terminou em 22/04/2026 [F13]. Só importa se publicarmos nas lojas dos EUA. Opção simples: restringir a distribuição ao Brasil no início (já está como dúvida 6 da checklist de privacidade).
- **Publicidade infantil no Brasil:** CDC art. 37 §2º (abusiva a publicidade que se aproveita da falta de julgamento da criança) e Resolução 163/2014 do Conanda (seção 4) [F9][F10].

### 2.1 Anúncio depois de cada fase (Google AdMob nos apps, AdSense H5 no site)

- **Como é:** intervalo comercial entre corridas. Já programado e desligado.
- **Prós:** nenhum trabalho comercial; paga sozinho; quanto mais gente joga, mais rende.
- **Contras:** com tratamento de criança e sem personalização, o valor por exibição cai e o preenchimento também (só entra anúncio "família"). Um profissional de jogos infantis relata eCPM 2 a 3 vezes menor que em jogo comum (relato isolado, não pesquisa) [F21]. AdSense H5 é **por solicitação** e a aprovação não é garantida [F24].
- **Referência de preço (eCPM = quanto o Google paga por 1.000 exibições):** média global de intersticial US$ 2,50–5,00 e, em países ricos, US$ 5–8 (Playwire, 17/09/2025; fonte comercial, "direcional") [F6]. Brasil: um resumo de busca cita ~US$ 2 no início de 2024 (⚠️ não verificado, fonte secundária). **Para o Race Cities uso as hipóteses US$ 0,30 / 1,00 / 2,00** (pessimista / central / otimista), ⚠️ todas não verificadas — **o número real só sai do painel do AdMob depois de 2 a 4 semanas de uso real**.
- **Quanto rende (conta):** receita/mês = jogadores ativos por dia (DAU) × 30 × anúncios pagos por dia × eCPM ÷ 1.000.
  Premissas: **2 anúncios exibidos por jogador/dia**, **60% de preenchimento** (⚠️ ambos suposição) → 1,2 pagos/dia; dólar a R$ 5,50 (fechamento de 09/11/2026) [F19].

| Jogadores ativos/dia | Pessimista (US$ 0,30) | Central (US$ 1,00) | Otimista (US$ 2,00) |
|---|---|---|---|
| 100 | R$ 6 | R$ 20 | R$ 40 |
| 1.000 | R$ 59 | R$ 198 | R$ 396 |
| 10.000 | R$ 594 | R$ 1.980 | R$ 3.960 |

  Antes de impostos. O AdMob só paga ao chegar a **US$ 100** acumulados (tabela em dólar) [F17]: com 1.000 jogadores/dia no cenário central (≈ US$ 36/mês) isso leva uns 3 meses. Dados de pagamento no Brasil: seção 5.
- **Nota:** a premissa de 2 anúncios/dia é **conservadora de propósito**. Uma corrida dura cerca de 2 min (110 a 130 s no QA, `docs/QA-cidades-linha-de-base.md`), então com a regra atual sairia anúncio após quase toda corrida e a receita subiria — mas o jogador se irritaria (seção 3).

### 2.2 Anúncio premiado ("assista e ganhe")

- **Prós:** costuma pagar bem mais por exibição (média global US$ 8–18 de eCPM, Playwire [F6]) e o jogador escolhe ver.
- **Contras:** para criança, o Google exige poder fechar em 5 s; ⚠️ **não verifiquei** se todo vídeo premiado servido com tratamento de criança respeita isso. Hoje **o jogo não tem botão de recompensa**. Fica fácil de ser lido como "assista para ganhar" dirigido a criança (ECA Digital art. 6º, V, veda prática publicitária "predatória, injusta ou enganosa" [F11]).
- **Recomendação:** **deixar desligado** (`rewardedEnabled: false`) até confirmar com o advogado e com o suporte do AdMob. Mesma cautela já escrita em `ANUNCIOS.md`.

### 2.3 "Remover anúncios" (compra única)

- **Prós:** quem paga é o responsável (adulto), uma vez; combina com a promessa "jogo seguro para família"; o jogo já respeita a marca `marileo_noads` (nenhum anúncio aparece).
- **Contras:** **ainda não existe** a compra de verdade (falta ligar Google Play Billing e StoreKit); a política de privacidade precisa citar pagamentos (dúvida 9 da checklist); ⚠️ não achei benchmark confiável de quantos jogadores compram (só achei taxa geral de compra em apps, ~3% do total, de agregador fraco [F20b]); loja cobra: Google Play 15% no Brasil até US$ 1 mi/ano [F1]; Apple 10% no Small Business Program no Brasil + 5% de processamento (⚠️ confira) [F3].
- **Conta de exemplo (hipótese):** preço R$ 9,90; 0,5%–2% dos jogadores do mês compram; loja fica com 15%. Para cada **1.000 jogadores/mês** → 5 a 20 compras → **R$ 42 a R$ 168, uma única vez** por grupo de 1.000 (R$ 9,90 × 0,85 = R$ 8,40 por compra).
- **Decisão:** vale como complemento depois do lançamento; exige trabalho de programação e compra via loja com controle dos pais.

### 2.4 Jogo pago

- **Prós:** sem anúncio nenhum; mensagem forte para pais.
- **Contras:** quase ninguém baixa jogo pago de estúdio novo; mata o crescimento orgânico; no site e nos portais não se aplica; as lojas ficam com 15%–30%.
- **Recomendação:** **não agora.** Reavaliar só com marca conhecida (ex.: pacote "Race Cities Deluxe" com tudo liberado).

### 2.5 Cosméticos e personagens (preço fixo)

- **Prós:** boa receita por pagante em jogos de família; combina com bichinhos Leo, Mari etc.
- **Contras:** custo de arte e programação; precisa de **portão dos pais** na compra (ECA Digital art. 18: pais gerenciam e restringem compras) [F11]; **proibido sorteio/caixa-surpresa** (art. 20) [F11]; seguir a regra "não condicionar a participação a mais dados do que o necessário" (LGPD art. 14 §4º) [F12].
- **Recomendação:** segundo passo depois de "remover anúncios"; só vender itens com **preço fixo e visível**.

### 2.6 Patrocínio local (cartão de patrocinador próprio)

- **Prós:** valor por exibição pode ser maior; relacionamento local; já existe a ferramenta; funciona sem internet.
- **Contras:** trabalho manual; audiência pequena e **sem segmentação por local** (o jogo não coleta localização); risco legal em publicidade infantil (seção 4); hoje **falta medição central** (seção 3); no app talvez conflite com regras das lojas (⚠️ pergunta ao advogado).
- **Recomendação:** começar pelo **site** como piloto, com poucos parceiros e anúncio dirigido a adultos.

### 2.7 Portais (CrazyGames, Poki) com divisão de receita

| | Poki | CrazyGames |
|---|---|---|
| Divisão | Jogador que chega por fora (busca, redes sociais, sua comunidade) = **100% seu**; jogador que chega pelo Poki = **50/50** [F7] | ⚠️ **não publicada** na documentação; só vi o número 60% (anúncio) / 70% (compras) nos termos de uma competição de 2026, em guia de terceiros [F8] |
| Exclusividade | Pede **exclusividade na web aberta** (não publicar o mesmo jogo em outros portais); lojas e consoles livres [F7] | ⚠️ não verificado |
| Anúncio | Só o SDK deles (já tem adaptador no jogo) | Só o SDK deles; **máx. 1 anúncio de intervalo a cada 3 min** [F8] |
| Pagamento | ⚠️ não verificado | Mínimo **€ 100**; mensal ou ao atingir € 100; prazo **NET 60** [F8] |

- **Prós:** entrega **público** (a parte mais difícil) sem gastar com marketing; já há adaptador no `js/ads.js`.
- **Contras:** nesses portais **não pode misturar** patrocinador próprio; a aprovação é seletiva ("cada jogo é escolhido a dedo" no Poki [F7]); ⚠️ não verifiquei como tratam jogo para criança nem o nosso **modo online** (PeerJS) lá dentro; a exclusividade do Poki pode atrapalhar o site próprio — **perguntar antes de assinar**.
- **Recomendação:** submeter ao CrazyGames **ou** ao Poki, **um de cada vez**, como teste de audiência. Não é renda garantida.

---

## 3. Comerciais depois de cada fase

### 3.1 Como funciona hoje (já pronto, desligado)
Acabou a corrida → o jogador toca em "Próxima" ou "Correr de novo" → aparece o intervalo → o jogo segue. Nunca durante a corrida, nunca em sala online, nunca depois da 1ª corrida, mínimo de 90 s entre anúncios, máximo de 8 por sessão. Se falhar, o jogo segue. Detalhes em `docs/ANUNCIOS.md`.

### 3.2 Frequência ideal sem irritar
- **Referência da tarefa:** 1 a cada 2–3 corridas e mínimo de 90 s. **Não consegui encontrar estudo confiável** que prove "a cada 2–3 fases"; os guias de mercado dizem que depende do jogo e mandam **testar** [F20]. Apontam como mais importante **não mostrar nos primeiros 30 s** e começar do 3º ao 8º nível [F20]. O CrazyGames limita a 1 por 3 min [F8], mas isso é regra deles, não ideal para retenção.
- **Descoberta importante (olhei o código):** a regra de hoje é só **tempo (90 s) + pular a 1ª corrida + teto de 8**. Como uma corrida dura ~2 min, na prática **sai anúncio depois de TODA corrida a partir da 2ª**. Isso é mais agressivo que "1 a cada 2–3". **Falta:** uma regra "a cada N corridas" (sugestão: N = 2, com 90 s mínimos). É mudança pequena para o engenheiro.
- **Não mostrar** para jogador que "removeu anúncios"; **não mostrar** logo depois de derrota seguida (ideia a testar).

### 3.3 Tipos de anúncio
| Tipo | Quando | Situação |
|---|---|---|
| Intervalo (intersticial) | entre corridas | pronto |
| Premiado | botão opcional do jogador | desligar por ora (2.2) |
| Banner | — | não usar (atrapalha o jogo, rende pouco) |
| Cartão de patrocinador (house) | entre corridas | pronto; hoje só aparece se o Google **não** mostrar nada (`['native','house']`) |

### 3.4 Como medir
- **eCPM** (receita por 1.000 exibições): painel do AdMob/AdSense.
- **Preenchimento** (fill rate): % de pedidos que viram anúncio — painel do Google; no jogo, `nofill.*` em `__marileoAds.stats()`.
- **Retenção:** D1 (voltou no dia seguinte) e D7. Painel das lojas/analytics do site. ⚠️ não verifiquei benchmarks de jogos infantis; compare **antes e depois** de ligar os anúncios.
- **Anúncios por jogador/dia**: `stats()` nos aparelhos de teste.
- **Regra:** olhe receita e retenção **juntas**; mais receita com menos gente voltando é prejuízo.

### 3.5 O que já está pronto e o que falta
**Pronto:** intervalo após corrida; regras de frequência; cartão próprio com portão dos pais; AdMob nos dois apps (IDs de teste); AdSense H5 no site; adaptadores dos portais; estatística local; chave geral de liga/desliga.
**Falta:**
1. Regra "a cada N corridas" (3.2).
2. Contas reais (AdMob, AdSense/H5) e IDs; `app-ads.txt`; política de privacidade nova (`docs/privacidade-checklist.md`).
3. **Contagem central e anônima** para o relatório do patrocinador: hoje `stats()` guarda os números **no aparelho de cada jogador** (`ANUNCIOS.md`, seção 7). Ver 4.6.
4. **Prioridade do patrocinador:** hoje ele só entra se o Google falhar. Para vender "X exibições", é preciso uma regra do tipo "patrocinador em P% dos intervalos".
5. Compra "remover anúncios" e botão de recompensa (se algum dia).
6. Teste real em aparelho (nunca feito) e conferência dos formulários das lojas.

---

## 4. Parcerias com comércio local e marcas (passo a passo)

### 4.1 Antes de sair vendendo
1. Consulta ao advogado feita (inclui perguntas da seção 4.5 abaixo).
2. Jogo publicado e com **números reais** de 2–4 semanas (jogadores ativos, anúncios por jogador).
3. Empresa aberta (seção 5) para emitir nota fiscal.
4. Cartão de patrocinador testado em celular deitado (`ads-test.html`).

### 4.2 Quem procurar (Osasco e região)
**Prioridade (falam com adultos/pais, risco menor):** clínicas (odontologia, pediatria), escolas de idiomas e reforço (**anúncio externo; nunca dentro de escola**), papelarias e livrarias, ótica, pet shop, supermercado/hortifruti, academias, serviços de lazer familiar (boliche, parque), imobiliárias e concessionárias, shopping (central de eventos), lojas de bairro.
**Cuidado extra (alimento, doce, brinquedo, fast-food):** são os mais questionados quando o público inclui crianças. Se aceitar, o texto precisa falar **com o adulto** (ver 4.5) e o advogado deve aprovar o modelo. Padaria, por exemplo, só com texto para o adulto ("café da manhã da família"), **sem** brinde ou desconto para a criança.
Ordem prática: comércios que você já conhece → vizinhos do seu bairro → associação comercial de Osasco (⚠️ não pesquisei contato) → redes e shoppings (processo mais lento).

### 4.3 Mídia kit de 1 página (modelo para copiar)
> **RACE CITIES — Marileo Studios (Osasco, SP)**
> **O que é:** jogo de corrida de kart, grátis, para jogar no celular e no navegador, com pistas inspiradas em cidades do mundo. Para a família toda.
> **Quem joga (preencher só com números medidos, mês de [MÊS/ANO]):** [___] jogadores ativos por dia · [___] partidas por jogador/dia · [___] exibições de patrocinadores por mês.
> **Seu anúncio:** cartão em tela cheia entre as corridas, com selo "Patrocinado", seu nome, uma frase e uma foto/logo. Dura 5 segundos até aparecer "Continuar". O link do seu site fica atrás de um portão para adultos.
> **Segurança:** sem coleta de dados pessoais; sem rastreamento; nenhum anúncio durante a corrida; texto para adultos e aprovado por nós.
> **Pacotes:** (tabela da seção 4.4)
> **Relatório:** todo mês, por WhatsApp/e-mail, com exibições estimadas e cliques de adultos.
> **Como fechar:** [WhatsApp] [e-mail] · contrato simples e nota fiscal.
Obs.: **não escreva número que você não mediu.** Se ainda não há, diga "piloto de 30 dias, sem custo, para medirmos juntos".

### 4.4 Tabela de preços sugerida (ponto de partida — a testar)
**Raciocínio:** preço = exibições × CPM (preço por 1.000 exibições) com mínimo mensal.
- **CPM de referência:** Meta Ads (Facebook/Instagram) no Brasil em 2026, de R$ 8 a R$ 45, com feed ~R$ 15–35 e stories/reels ~R$ 8–20 (blogs de agências, estimativas, ⚠️ não são pesquisa oficial) [F18]. Nosso cartão é tela cheia com 5 s de atenção, **mas** sem segmentação por região e com audiência pequena → **não cobrar acima dessa faixa**; começar em **R$ 20–30**.
- **Mínimo mensal** de R$ 150 cobre o trabalho de arte, configuração e relatório.

| Pacote | Exibições estimadas/mês | Preço | CPM implícito |
|---|---|---|---|
| Piloto | até 5.000 | R$ 0 (30 dias, em troca de depoimento e relatório) | — |
| Local | até 5.000 | R$ 150 | R$ 30 |
| Família | até 15.000 | R$ 350 | ≈ R$ 23 |
| Destaque | até 40.000 + exclusividade da categoria | R$ 800 | R$ 20 |

**Garantia honesta:** "até X exibições estimadas; se ficar abaixo de 70% do combinado, prorrogamos sem custo."

**Como calcular com os números do jogo (`__marileoAds.stats()`):**
1. Em celulares de teste/beta, rode `__marileoAds.stats()` e anote **intervalos mostrados por jogador por dia (B)** — chaves `interstitial.race_end.house` e outras.
2. **Jogadores ativos por dia (JA):** vem do console da loja, do AdMob ou do site.
3. **Parcela do patrocinador (S):** a % dos intervalos que a regra de prioridade entrega ao patrocinador (depende do ajuste do item 4 da seção 3.5). Se há 3 campanhas ativas de pesos iguais, divide-se por 3.
4. **Exibições/mês ≈ JA × B × S × 30.**
5. **Preço = (Exibições ÷ 1.000) × CPM,** nunca menos que o mínimo.
*Exemplo (números inventados só para mostrar a conta, não medidos):* JA 500, B 2, S 40% → 500×2×0,4×30 = 12.000 exibições; a R$ 25 → R$ 300/mês.
Cliques: `campaign.<id>.click` (só adultos que passaram pelo portão); **ao vender, trate clique como bônus, não como promessa**.

### 4.5 Cuidados com publicidade para crianças (o mais importante)
- **CDC art. 37 §2º:** é abusiva a publicidade que se aproveita da deficiência de julgamento e experiência da criança [F10]. O STJ aplicou isso em condenação conhecida (REsp 1.613.561/SP; fonte secundária, ⚠️ leia o acórdão) [F10].
- **Resolução 163/2014 do Conanda** (texto no site LegisWeb, sem registro de alteração posterior na página consultada) [F9]: considera abusiva a publicidade **dirigida à criança** "com a intenção de persuadi-la" ao consumo; os incisos listam sinais: linguagem infantil, efeitos especiais, trilha infantil, criança no anúncio, celebridade com apelo infantil, personagens e desenhos, bonecos, promoção com prêmios/brindes ou apelo infantil, competições ou jogos com apelo infantil; vale em qualquer meio e lugar; **dentro de creches e escolas** (infantil e fundamental) é abusiva (inclusive uniformes e material). O art. 3º traz princípios para o adolescente. ⚠️ A força jurídica da Resolução é discutida na doutrina (há quem diga que só vincula a administração pública); **não use isso como argumento para ignorar**: na prática, o jogo para crianças vira alvo fácil.
- **CONAR (autorregulamentação):** criança = até 12 anos; princípio geral de que anúncio não tenha crianças como público-alvo em categorias sensíveis (⚠️ texto exato do art. 37 do código **não** foi obtido: o site do CONAR bloqueou a leitura automática; peça ao advogado). Há anexos próprios para **bebidas alcoólicas** e **apostas (Anexo X)** [F14].
- **ECA Digital:** proíbe perfilar criança para publicidade (art. 22, 26) e prática publicitária "predatória, injusta ou enganosa" (art. 6º, V) [F11]. Anúncios sem personalização e texto verdadeiro ajudam.
- **Regras práticas para todo patrocinador (colocar no contrato):**
  1. Texto **para o adulto**, não para a criança ("para a família", "pais").
  2. **Sem** personagem de desenho, mascote infantil, linguagem infantil, trilha, efeitos de brinquedo.
  3. **Sem** brinde, prêmio, sorteio, desconto ou promoção direcionados à criança; **sem** competição.
  4. **Sem** comando direto à criança ("compre", "peça").
  5. **Nada** de escola/creche (anúncio dentro) e nada de coleta de dados pelo patrocinador.
  6. Nós aprovamos a arte antes e podemos tirar a qualquer momento.
- **Perguntas específicas ao advogado:** o cartão do patrocinador dentro do app Android/iPhone fere a política Famílias (que exige SDK certificado para anúncio a criança) ou a diretriz 5.1.4 da Apple? ⚠️ Ainda **não verifiquei** a leitura das lojas para "anúncio próprio".

### 4.6 O que NÃO aceitar (lista fechada)
- Bebida alcoólica, cigarro, vape, qualquer produto de uso proibido a menor.
- **Apostas e "bets"**, jogos de azar, loteria, rifas, cassino, "cassino social" (o CONAR tem anexo específico e proíbe criança como público ou participante nas apostas [F14]).
- Política partidária, religião proselitista, conteúdo adulto/sensual, armas.
- Empréstimo/crédito consignado, "dinheiro fácil", investimento/criptomoeda.
- Produto de saúde com promessa de cura, suplemento, emagrecimento.
- Alimento ultraprocessado/doce/brinquedo **dirigido à criança** (só com texto para adulto e aprovado pelo advogado).
- Concorrente direto de jogo infantil que peça dados de criança; qualquer anunciante que queira coletar dado pessoal pelo jogo.
- Qualquer coisa que o Google Play/Apple/AdMob proíba para anúncios a menores.
- Anúncio que **imita** o jogo (botão falso de "Continuar", "Fechar").

### 4.7 Script de abordagem por WhatsApp (3 mensagens curtas)
*Envie para o número comercial que a loja já divulga; uma pessoa de cada vez; respeite se disserem "não". Nome entre colchetes.*

**Mensagem 1 (apresentação):**
> Oi, [Nome]! Aqui é o Marcos, da Marileo Studios, aqui de Osasco. Fiz um jogo de corrida de kart para a família, o Race Cities, e estou abrindo vagas de patrocinadores locais, com preço bem acessível. Posso te mandar uma página de 1 minuto explicando?

**Mensagem 2 (2 dias depois, se não responder; com o mídia kit anexo):**
> Oi, [Nome], tudo bem? Segue a página do patrocínio no Race Cities (a [Loja] aparece em tela cheia para quem joga, com texto para os pais). Começamos com um mês de teste sem custo, para você ver os números. Quer que eu passe aí na [Loja] [dia]?

**Mensagem 3 (5 dias depois; última):**
> Oi, [Nome]! Última mensagem para não incomodar: mantenho a vaga do mês de teste até [data]. Se fizer sentido, é só me chamar aqui. Obrigado e sucesso com a [Loja]!

### 4.8 Modelo de proposta (e-mail ou PDF)
> **Proposta de patrocínio — Race Cities**
> Para: [Empresa] · De: Marileo Studios · Data: [__/__/____]
> **O que oferecemos:** cartão de patrocinador no jogo Race Cities, em tela cheia entre as corridas, com selo "Patrocinado".
> **Período:** [início] a [fim]. **Pacote:** [Local/Família/Destaque]. **Exibições estimadas:** até [___]. **Valor:** R$ [___] por mês, via [Pix/boleto], com nota fiscal.
> **Materiais que precisamos de vocês:** nome, frase de até 90 caracteres para os pais, logo ou foto (JPG/PNG, proporção 3:2, até ~150 KB), site (opcional). Nós aprovamos a arte.
> **Relatório:** mensal, com exibições estimadas e cliques de adultos.
> **Condições:** texto dirigido ao adulto, sem apelo infantil (seção 4.5); sem garantia de vendas.
> Aceite: ____ (nome, data).

### 4.9 Modelo de contrato simples (**o advogado revisa antes de usar**)
> **CONTRATO DE PATROCÍNIO PUBLICITÁRIO — [rascunho]**
> **1. Partes:** Marileo Studios [razão social/CNPJ/endereço] ("ESTÚDIO") e [Patrocinador] [razão social/CNPJ/endereço] ("PATROCINADOR").
> **2. Objeto:** exibição de cartão de patrocinador no jogo Race Cities, em [site/app/ambos], de [data] a [data].
> **3. Preço e pagamento:** R$ [___] [mensais/único], até o dia [__], por [Pix/boleto]; o ESTÚDIO emite nota fiscal.
> **4. Entrega:** exibições **estimadas** de até [___] no período; não há garantia de vendas, cliques ou público; se a entrega ficar abaixo de 70% do estimado, o período é prorrogado sem custo.
> **5. Material:** o PATROCINADOR fornece o material e responde pela veracidade e por direitos de uso. O ESTÚDIO aprova a arte e pode recusar ou retirar a qualquer momento por motivo legal, de política de loja ou de segurança para crianças.
> **6. Conteúdo:** o anúncio deve ser dirigido a adultos e **não** conter apelo infantil, brinde ou promoção para crianças, comando direto à criança, nem categoria vedada (Anexo A).
> **7. Dados:** o ESTÚDIO não repassa dados pessoais ao PATROCINADOR; só relatórios agregados.
> **8. Prazo e rescisão:** qualquer parte pode rescindir com [__] dias de aviso; devolução proporcional do valor do período não prestado.
> **9. Foro:** Osasco/SP.
> Local, data, assinaturas e duas testemunhas. **Anexo A:** lista "O que NÃO aceitar" (4.6).
> ⚠️ *Modelo informativo; não substitui o advogado.*

### 4.10 Relatório mensal para o patrocinador
Uma página: período; **exibições estimadas** (JA × B × S × 30, com o método em uma linha); cliques de adultos (se houver); foto de como o cartão apareceu; comparação com o combinado; próxima renovação. **Diga "estimado"** enquanto não houver contagem central.
**Contagem central, o que falta:** hoje cada aparelho conta o seu. Para somar de todos, seria preciso um contador **anônimo** (só "cartão X apareceu 1 vez", sem identificar ninguém). Isso **muda a política de privacidade e o texto das lojas**, então é decisão do advogado. Alternativa sem coletar nada: estimar por (jogadores ativos informados pelas lojas) × (média dos aparelhos de teste).

---

## 5. Aspectos fiscais básicos no Brasil (para o CONTADOR confirmar)

Não sou contador. Abaixo, o que descobri e **o que o contador deve decidir**.

1. **Abrir empresa antes de receber.** Lojas e AdMob pagam em nome do cadastro; misturar pessoa física e empresa gera problema. Google Play exige dados de empresa/CPF-CNPJ para pagar vendas no Brasil (resumo de busca em ajuda do Google; ⚠️ confira no Play Console).
2. **MEI:** limite de **R$ 81 mil/ano** (R$ 6.750/mês); até 20% acima paga DAS complementar; propostas para subir o teto (PLP 67/2025) ⚠️ **não confirmei aprovação** [F15]. **Contador confirma:** se a atividade de "desenvolvimento/edição de jogos" é **permitida ao MEI** — não achei CNAE de jogos na lista consultada. Novos CNAEs de jogos (**6211-3/00** desenvolvimento e **5821-3/00** edição/licenciamento) foram noticiados em 16/10/2026 como **ainda não em vigor** (blog contábil; ⚠️ não verificado em fonte oficial) [F16]. Lei 14.852/2024 (Marco Legal dos Games) é a base.
3. **ME no Simples Nacional:** se passar do teto do MEI ou se a atividade não for permitida a MEI. **Contador define** o anexo e a alíquota.
4. **Receber do exterior (Google AdMob/AdSense, Apple, Google Play):** quem paga é empresa estrangeira. Fontes de contadores dizem que MEI/ME podem emitir **NFS-e para tomador no exterior** e que o recebimento deve ir para a **conta PJ**, com documentos do câmbio; para MEI há campo "mecanismo de apoio ao comércio exterior" na nota [F22] (⚠️ fontes não oficiais, resumo de busca). **Contador confirma:** se a receita é "exportação de serviços", ISS (município: Osasco), PIS/Cofins, IOF, e qual **nota emitir por pagamento** (AdMob, Apple, Google).
5. **Comissão das lojas:** é custo, separado dos impostos. Google Play 15% (até US$ 1 mi/ano) [F1]; Apple no Brasil 10%/21% + 5% de processamento (⚠️ confira a tabela oficial) [F3]. Contador define como lançar.
6. **Patrocinador local:** emite-se **NFS-e de Osasco** em reais (município e prefeitura definem o serviço/código). Contador confirma o **código do serviço** (publicidade) e a retenção de ISS/IR que o patrocinador possa aplicar.
7. **AdMob:** só paga ao chegar a US$ 100; exige verificação de identidade/endereço e forma de pagamento nos limites US$ 0–10 [F17]; tabela em reais não apareceu na página consultada (⚠️ não verificado).
8. **Apple Developer / Google Play:** custos fixos (US$ 99/ano e US$ 25) viram despesa da empresa; guarde nota/recibo.
9. **Perguntas prontas para o contador:** (a) MEI ou ME? (b) CNAE e anexo? (c) NFS-e para Google/Apple/AdMob? (d) conta bancária PJ para receber dólar? (e) pró-labore se virar ME? (f) quando migrar? (g) como cobrar de patrocinador (Pix com nota)? Honorário mensal estimado: ⚠️ não pesquisei.

---

## 6. Plano de 90 dias (semana a semana)
Início sugerido: **semana 1 = 16/11/2026**; fim ≈ 14/02/2027. Ajuste conforme o andamento das lojas. Quem faz: **CEO** (decide/assina), **Diretor/engenheiro** (código), **Monetização** (textos/contas).

| Sem. | O que fazer |
|---|---|
| 1 | CEO responde às 6 perguntas (seção 7). Marcar contador e advogado. Definir e-mail do estúdio. |
| 2 | Consulta ao **contador** (seção 5) e ao **advogado** (checklist de privacidade + perguntas das seções 2.0, 4.5, 3.5). Decidir MEI/ME. |
| 3 | Abrir empresa se preciso. Criar contas AdMob (apps Android e iOS), solicitar AdSense/H5. Contas de loja (Apple, Google). |
| 4 | Engenheiro: regra "a cada N corridas"; regra de prioridade do patrocinador; (opcional) contador anônimo. Privacidade nova pronta. |
| 5 | Teste fechado do Google Play (12 testadores por 14 dias, conforme briefing) com anúncios **de teste**; anotar anúncios por jogador. |
| 6 | **Lançamento suave** (site + Android) com anúncios reais, `test: false`. iPhone só se o advogado liberar. |
| 7 | Primeiros números de eCPM, preenchimento e retenção. Ajustar frequência. Montar mídia kit com números reais. Lista de 20 comércios. |
| 8 | Enviar mensagens 1 (WhatsApp) para 10 comércios; visitar 3. |
| 9 | Mensagens 2 e 3; propostas. Meta: 2–3 reuniões. |
| 10 | Fechar 1–3 pilotos de 30 dias (site). Colocar campanhas no `ads-config.js` com datas. |
| 11 | Pilotos rodando; acompanhar. Decidir se submete a um portal (CrazyGames **ou** Poki). |
| 12 | Relatório de 1 página aos pilotos; oferecer pacote pago. Planejar "remover anúncios". |
| 13 | Balanço: receita real × custos; decidir próximos 90 dias. |

**Métricas de sucesso (90 dias — metas a calibrar com o CEO; ⚠️ são sugestões, sem benchmark):**
- Jogadores ativos/dia: ≥ 300 (mínimo para a conversa com patrocinador).
- Retenção D1/D7: ≥ 25% / ≥ 8%, **sem queda** depois de ligar anúncios (⚠️ não verificado como benchmark para jogos infantis).
- eCPM real e preenchimento: registrar; comparar com US$ 0,30–2,00 e 60%.
- Anúncios por jogador/dia: ≤ 3. Reclamação por anúncio: 0 em loja.
- Patrocínio: 20 contatos, 6 reuniões, 3 pilotos, 1 pago.
- Receita acumulada ≥ custos fixos (Apple + Google + contador). Meta honesta; não esperar mais.

---

## 7. Perguntas que o CEO precisa decidir (máx. 6)
1. **Ordem de lançamento:** site + Android primeiro (e iPhone depois da consulta ao advogado)? ☐ Sim ☐ Tudo junto.
2. **Patrocínio local:** começa já como piloto só no **site**, ou espera a consulta ao advogado antes de qualquer cartão?
3. **Empresa:** abrir **MEI** ou **ME/Simples** (contador decide, mas você aceita pagar contador mensal)?
4. **Portal:** testar **CrazyGames** ou **Poki** (Poki pede exclusividade na web aberta) ou ficar só no site próprio por enquanto?
5. **Segunda fonte de renda:** qual primeiro, "remover anúncios" (compra única) ou personagens/visuais de preço fixo? (Nada de caixa-surpresa.)
6. **Orçamento e meta:** quanto aceita gastar nos 90 dias (Apple US$ 99, Google US$ 25, advogado, contador) e qual renda mínima considera sucesso?

---

## Fontes (todas consultadas em 13/11/2026)
- **F1** Google Play, tabela de taxas — support.google.com/googleplay/android-developer/answer/112622 (15% no 1º US$ 1 mi/ano e 30% acima para mercados ainda não atualizados; nova tabela com 20% + 5% de faturamento já em vigor em EEA, UK e US desde 30/06/2026). A página não nomeia o Brasil.
- **F2** Android Developers Blog, 04/03/2026, "A new era for choice and openness" — cronograma: resto do mundo até 30/09/2027.
- **F3** Apple Brasil, 18/06/2026 — apple.com/br/newsroom/2026/06/apple-announces-changes-to-ios-in-brazil/ (⚠️ a página cita iOS 26.2; outras reportagens citam 26.5).
- **F4** (não usada no texto) Small Business Program global: 15% — resultados de busca; no Brasil vale a tabela da F3.
- **F5** Google Play, Política para Famílias — support.google.com/googleplay/android-developer/answer/9893335 (sem data de atualização exibida).
- **F6** Playwire, "AdMob eCPM Benchmarks", 17/09/2025 — playwire.com/blog/admob-ecpm-benchmarks-what-publishers-should-expect (não cita Brasil nem América Latina).
- **F7** Poki for Developers — developers.poki.com/guide/working-with-poki.
- **F8** CrazyGames Docs — docs.crazygames.com/payouts/ e /requirements/ads/ (divisão não publicada; 60/70% só em guia de terceiros do app.cinevva.com, ⚠️).
- **F9** Resolução Conanda 163/2014 — legisweb.com.br/legislacao/?id=268725 (também mpba.mp.br, santos.sp.gov.br).
- **F10** CDC art. 37 §2º — resumo em conjur.com.br e nota técnica MPF (midia.mpf.mp.br/pfdc); REsp 1.613.561/SP (jus.com.br). Fontes secundárias.
- **F11** Lei 15.211/2025 (ECA Digital) — planalto.gov.br/ccivil_03/_ato2023-2026/2025/lei/L15211.htm; vigência 17/03/2026 (Machado Meyer e outros).
- **F12** LGPD art. 14 — planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm.
- **F13** COPPA revisada — federalregister.gov (22/04/2025); prazo geral 22/04/2026 (Davis Polk e outros).
- **F14** CONAR — Anexo X (apostas) e anexos de bebidas: resultados de busca (mattosfilho.com.br e outros). ⚠️ Data da atualização do Anexo X sem ano nas fontes.
- **F15** Limite MEI — omie.com.br/blog; simplifique.contmatic.com.br (blogs, 2026).
- **F16** CNAEs de jogos — amdjus.com.br/games-ganham-cnaes-proprios..., 16/10/2026 (blog).
- **F17** AdMob, limites de pagamento — support.google.com/admob/answer/2772208 (USD).
- **F18** CPM Meta Ads Brasil 2026 — viniensina.com.br e trafius.com.br (blogs de agência).
- **F19** Dólar a R$ 5,51 em 09/11/2026 — brasil61.com.
- **F20** Frequência de anúncio — revenueflex.com, unity.com (blog), airflux.ai, docs.crazygames.com/resources/midgame-ads-pacing/ (guias comerciais). **F20b** conversão de pagantes — gitnux.org (⚠️ fonte fraca).
- **F21** Relato sobre eCPM 2–3× menor em jogo infantil — post no LinkedIn (profissional de jogos); **não é pesquisa**.
- **F22** MEI/ME recebendo do exterior — contabilizei.com.br, wise.com/br/blog (blogs; ⚠️ não oficiais).
- **F24** AdSense H5 Games Ads (beta por solicitação) — developers.google.com/ad-placement/docs/beta.

Documentos internos: `docs/ANUNCIOS.md`, `docs/privacidade-checklist.md`, `docs/BRIEFING-DIRETOR.md`, `docs/QA-cidades-linha-de-base.md`, `js/ads-config.js`.
