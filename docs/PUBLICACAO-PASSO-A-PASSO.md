# Publicação do Race Cities — seu passo a passo (CEO)

Escrito em 13/11/2026 pela seção Publicação. Tudo o que o computador pode fazer sozinho já está pronto
(apps Android e iPhone, robôs do GitHub, textos, capturas). **Falta só o que exige você**: contas,
pagamentos, senhas e testadores. Ordem abaixo; cada passo diz quanto tempo leva.
Detalhes e fontes: `docs/PUBLICACAO.md`.

## O que já está pronto (verificado)
- Android: pacote `com.marileostudios.racecities`, robô que gera o AAB (arquivo da loja), ícones.
- iPhone: projeto e robô que envia para o TestFlight; 12 capturas e textos em `ios/AppStore/`.
- Textos da Google Play (PT e EN): `android/PlayStore/textos.md`.
- Aviso de segurança do online já existe no jogo.
- Anúncios estão **desligados** (seguro para publicar a 1ª versão sem anúncios).
- Lição do Hub Martinelli: a Apple recusou por ele ser app de público restrito (diretriz 3.2.0). O Race Cities é jogo público, então não cai nisso; nas notas de revisão, diga que é para qualquer pessoa.

## O que ainda NÃO foi testado
Nenhum app foi aberto em celular de verdade, e o robô nunca rodou com as suas chaves. Por isso o 1º envio é só para teste.

---

## Passo 1 — Decidir (10 min)
Responda ao diretor: **que e-mail** de contato do estúdio usar no Race Cities, e se lança **só no Brasil** (recomendo: menos regras). Como as contas já existem, o vendedor que aparece nas lojas já está definido.

## Passo 2 — Contas: você JÁ TEM as duas (nada a pagar)
Apple Developer e Google Play Console são os mesmos do Teleprompter Easy e do Hub Martinelli (confirmado nas anotações dessas sessões em 13/11/2026). Então **não** precisa pagar US$ 25 nem US$ 99. O que fazer:
- **Apple:** em appstoreconnect.apple.com → Apps → **+** → Novo app: nome **Race Cities**, ID `com.marileostudios.racecities`, SKU `racecities`. Se a Apple pedir para aceitar um novo contrato de licença, aceite (já aconteceu em 02/11).
- **Google Play:** Play Console → **Criar app** → "Race Cities", jogo, grátis.

## Passo 3 — A regra dos 12 testadores (o ponto mais importante)
- No Teleprompter Easy a produção na Play só libera por volta de **18/11/2026** (12 testadores por 14 dias, anotação de 12/11).
- ⚠️ **Não consegui confirmar** se a regra vale de novo para cada app novo da mesma conta pessoal (a página oficial fala "seu app"; relatos dizem que pode não valer depois da 1ª aprovação — fonte: https://support.google.com/googleplay/android-developer/answer/14151465). **Como saber:** ao criar o Race Cities, o painel mostra se pede teste fechado. Se pedir, reaproveite a lista "Testadores Teleprompter Easy" (29 e-mails): é só criar uma faixa de teste fechado no Race Cities e adicionar a mesma lista; cada pessoa precisa aceitar o novo link e instalar.
- **iPhone não tem essa regra**: dá para sair primeiro na App Store.

## Passo 4 — Chave do Android (5 min, no Mac)
Crie uma chave **só do Race Cities**; não reutilize nem mexa na do Teleprompter (`~/TeleprompterChaves`). Sugestão: guardar em `~/RaceCitiesChaves`. No Terminal:
```bash
keytool -genkeypair -v -keystore race-cities.jks -alias racecities -keyalg RSA -keysize 4096 -validity 10000
```
Guarde o arquivo `race-cities.jks` e as senhas em **2 lugares** (perder = nunca mais atualizar o app). Para copiar a chave em texto para o GitHub:
```bash
base64 -i race-cities.jks | tr -d '\n' | pbcopy
```
(o `base64 -w0` não funciona no Mac; o comentário do robô já foi corrigido.)

## Passo 5 — Segredos no GitHub (10 min)
Repositório jogo-marileo → Settings → Secrets and variables → Actions → **New repository secret**. Crie os 8:
| Nome | Valor |
|---|---|
| ANDROID_KEYSTORE_B64 | o que o `pbcopy` copiou (cole) |
| ANDROID_KEYSTORE_PASSWORD | senha da chave |
| ANDROID_KEY_ALIAS | `racecities` |
| ANDROID_KEY_PASSWORD | senha do alias |
| APPLE_TEAM_ID | Team ID da Apple |
| ASC_KEY_ID | Key ID |
| ASC_ISSUER_ID | Issuer ID |
| ASC_KEY_P8 | texto completo do arquivo `.p8` (abra no TextEdit e copie tudo) |

(Se você já tem uma chave de API do App Store Connect de outro app, pode reaproveitar a mesma: ela vale para a conta toda. Alternativa sem GitHub: enviar o build pelo Xcode no Mac, como foi feito no Teleprompter.)

**Nunca** cole senhas no chat; digite direto no GitHub.

## Passo 6 — Gerar e subir os apps (30 min)
- Android: GitHub → Actions → **Android** → Run workflow (versão 1.0). Baixe o `.aab` em "Artifacts". No Play Console: Teste → **Teste fechado** → Criar versão → subir o `.aab`.
- Convide **12 ou mais pessoas** (e-mail Google) para o teste fechado; elas precisam entrar e **abrir o jogo** durante 14 dias. O relógio começa quando elas aceitarem.
- iPhone: Actions → **iOS** → Run workflow. O build aparece no TestFlight; instale no seu iPhone e teste (inclusive online com 2 aparelhos).

## Passo 7 — Formulários e página das lojas (1 a 2 horas cada)
- Google Play: copie os textos de `android/PlayStore/textos.md`; responda Público-alvo, Anúncios (Não, por enquanto), Segurança dos dados, Classificação (IARC).
- App Store: copie `ios/AppStore/textos.md`; envie as 12 capturas. Antes, **confirme que as capturas estão no visual atual** das cidades (podem estar velhas).
- Faltam (seção Arte de loja): imagem de destaque 1024x500, capturas 1920x1080 para Android, vídeo.

## Passo 8 — Advogado e anúncios (depois, não bloqueia a 1ª versão)
Consulta única com `docs/privacidade-checklist.md`. Só depois: conta AdMob, IDs reais, política nova publicada e ligar anúncios **no mesmo dia**.
**Recomendação:** lance a 1ª versão **sem anúncios**; ligue depois do advogado, numa atualização.

## Passo 9 — Enviar para revisão
- Android: depois dos 14 dias, "Solicitar acesso à produção" (resposta em até ~7 dias) e publicar.
- iPhone: "Enviar para revisão" (de 1 a vários dias).

## Linha do tempo realista
Contas e chaves: esta semana. Android público: ~5 a 8 semanas (14 dias de teste + espera). iPhone: 2 a 4 semanas.

## O que eu NÃO posso fazer por você
Criar contas, pagar taxas, digitar senhas/chaves, aceitar termos das lojas, enviar para revisão e dar push. Eu preparo tudo ao redor e confiro cada passo quando você avisar.
