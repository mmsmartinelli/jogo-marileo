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

## O que ainda NÃO foi testado
Nenhum app foi aberto em celular de verdade, e o robô nunca rodou com as suas chaves. Por isso o 1º envio é só para teste.

---

## Passo 1 — Decidir (10 min)
Responda estas 3 coisas ao diretor: **CPF ou CNPJ** nas lojas? **Que e-mail** de contato do estúdio? **Só Brasil** no início? (Recomendo: só Brasil, para ter menos regras.)

## Passo 2 — Conta Google Play (30 min + espera)
1. Entre em https://play.google.com/console e clique em **Criar conta de desenvolvedor**.
2. Escolha **Pessoal** (CPF) ou **Organização** (CNPJ + número D-U-N-S).
3. Pague **US$ 25** (uma vez) e confirme sua identidade (documento com foto).
4. Conta **pessoal nova** exige teste fechado com **12 testadores por 14 dias seguidos** (ver passo 6).

## Passo 3 — Conta Apple (20 min + 1 a 2 dias de espera)
1. https://developer.apple.com/programs/enroll → entre com seu Apple ID.
2. Pague **US$ 99 por ano**. A aprovação demora de horas a uns 2 dias.
3. Depois: appstoreconnect.apple.com → Apps → **+** → Novo app. Nome **Race Cities**, ID `com.marileostudios.racecities`, SKU `racecities`.
4. appstoreconnect.apple.com → Usuários e Acesso → Integrações → **Chaves de API** → gerar chave com acesso "App Manager". Baixe o arquivo `AuthKey_XXXX.p8` (só baixa uma vez!). Anote o **Key ID** e o **Issuer ID**; o **Team ID** fica em developer.apple.com → Associação.

## Passo 4 — Chave do Android (5 min, no Mac)
No Terminal:
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
