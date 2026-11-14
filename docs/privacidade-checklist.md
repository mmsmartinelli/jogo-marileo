# Checklist da nova política de privacidade (para o CEO e o advogado)

Rascunho: `docs/privacidade-com-anuncios.html`. O `privacidade.html` atual continua valendo (diz "não coleta dados", correto enquanto `enabled: false` em `js/ads-config.js`).

**Só troque o arquivo público quando, no mesmo dia, os anúncios reais forem ligados.** Passos: revisar, preencher os `[PREENCHER]`/`[CONFIRMAR]`, copiar o conteúdo para `privacidade.html` (tirando o comentário do topo), e só então `enabled: true`.

## 1. O que o CEO preenche
- [x] E-mail de contato: mmsmartinelli@gmail.com (confirmado pelo CEO; já está em `privacidade-com-anuncios.html`). Falta só copiar para `privacidade.html` na troca do dia. Pergunta ao advogado: e-mail pessoal serve como canal oficial?
- [ ] `[PREENCHER]` data de vigência e de atualização.
- [ ] Nome/cargo do responsável por pedidos de dados (encarregado, art. 41 da LGPD) e prazo de resposta.
- [ ] Endereço/CNPJ da Marileo Studios, se o advogado quiser que conste (hoje só consta "Osasco, SP" no rascunho, vindo da descrição da tarefa; não está no `privacidade.html` atual).

## 2. Fatos confirmados no código (base do texto)
- Armazenamento local (`localStorage`): `marileo_settings`, `marileo_stars`, `marileo_infinite`, `marileo_tt` (recordes), `marileo_online` (apelido e personagem), `marileo_mute`, `marileo_ads` (contadores de anúncios, 45 dias), `marileo_noads` (futuro). Nada é enviado a servidor nosso.
- Não há analytics, Firebase, cadastro nem compra no código (busca por analytics/firebase/gtag: nada).
- Android (`AndroidManifest.xml`, `GameAds.java`): permissões só INTERNET e ACCESS_NETWORK_STATE; `AD_ID`, `ACCESS_ADSERVICES_*` removidas; `AgeRestrictedTreatment.CHILD`, classificação máxima G, personalização desligada.
- iOS (`GameAds.swift`, `project.yml`): mesmo tratamento de criança, G, personalização desligada, localização aproximada desligada, sem `NSUserTrackingUsageDescription` (sem ATT).
- Site (`js/ads.js`, `ads-config.js`, AdSense H5): `childDirected`, `underAgeOfConsent`, `nonPersonalized`, frequência 60 s. A classificação "G" do site depende do painel do AdSense (manual).
- Anúncios só com `enabled: true`; apps só iniciam o SDK nesse caso. Sem anúncio em sala online, nem após a 1ª corrida, mínimo de 90 s entre anúncios, máximo 8 por sessão.
- Modo online (`js/net.js`): PeerJS 1.5.4 carregado de `cdn.jsdelivr.net`; STUN `stun.l.google.com:19302` e `stun1.l.google.com:19302`; código da sala de 4 caracteres; sem `host` definido, então usa o servidor de sinalização padrão do PeerJS (a biblioteca decide; ver dúvida 3.3). Parâmetro `?peerhost=` existe só para testes.
- O site carrega three.js e PeerJS do jsDelivr e fontes do Google Fonts; nos apps essas peças são embutidas (`ios/build-web.mjs`).
- Patrocinador próprio ("house"): sem coleta; links atrás de portão dos pais (3 s).

## 3. Dúvidas para a ÚNICA consulta ao advogado
1. **Crianças e consentimento:** o jogo atrai crianças (Lei 13.709/2018, art. 14; ECA Digital). Anúncios do Google com tratamento de criança, sem personalização, bastam? Precisa de consentimento específico de um dos pais para o IP/dados do SDK? Como redigir? O jogo não tem como verificar idade nem "portão de pais" para os anúncios do Google (só para links de patrocinador).
2. **Papel do Google (controlador x operador)** para os dados do AdMob/AdSense, e se o texto sobre "nós não recebemos os dados" está correto.
3. **Servidor PeerJS:** confirmar qual servidor de sinalização é usado por padrão (PeerJS Cloud, `0.peerjs.com`) e sua política de privacidade/localização. Isso não está nos nossos arquivos, vem da biblioteca; precisa ser verificado antes de afirmar no texto final. Considerar um servidor próprio.
4. **Transferência internacional** (Google, PeerJS, jsDelivr): precisa de menção específica (art. 33 LGPD)?
5. **IP do jogador exposto a outros jogadores** no modo online (WebRTC direto): o aviso atual é suficiente, ou deve haver aviso dentro do jogo antes de criar/entrar na sala? Há opção de relay (TURN)? Hoje não há TURN no código.
6. **COPPA (EUA) e GDPR/GDPR-K (Europa):** o rascunho só deixa um marcador. Se o app for publicado nos EUA/UE (lojas globais), é preciso seção própria? Decidir se restringimos a distribuição ao Brasil.
7. **Declarações das lojas** (coerentes com a política): App Store Connect, "vinculado à identidade" e "usado para rastreamento" (nossa leitura: não); Google Play, Segurança dos dados e Público-alvo (Política para Famílias). Tabelas em `docs/ANUNCIOS.md`, seção 6.
8. **Recompensa e Política para Famílias:** vídeo com recompensa não pode ser fechado depois de 5 s? Hoje `rewardedEnabled: true` mas não há botão de recompensa no jogo; se for criado, atualizar a política.
9. **"Remover anúncios" (compra futura):** se vier, a política precisa citar pagamentos (hoje diz que não há compras).
10. **Contato por issues do GitHub:** aceitável para pedidos de titulares, ou exige e-mail/formulário?
11. **Fontes do Google Fonts e jsDelivr no site:** citar na política (rascunho cita) ou embutir os arquivos no site e remover a menção?
12. **Idade mínima/classificação:** a política cita "toda a família"; a classificação indicativa no Brasil (ClassInd) e a das lojas (4+/Livre) estão alinhadas?

## 4. Antes de publicar
- [ ] Revisão do advogado aplicada e marcadores `[...]` removidos.
- [ ] Painel AdSense: classificação "G" configurada (manual); AdMob: apps marcados como direcionados a crianças, classificação G.
- [ ] Mesma descrição nos formulários das lojas, App Store Connect e Google Play.
- [ ] Link de privacidade informado nas lojas (a URL pública do `privacidade.html`).
- [ ] Remover o comentário de rascunho do topo do HTML; atualizar também "Última atualização".
- [ ] Revisar também o texto do `ios/AppStore/textos.md` e o aviso sobre a política.
