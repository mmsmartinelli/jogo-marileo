# Instalar o Race Cities no seu iPhone (pelo cabo) — passo a passo

Feito em 14/11/2026. **Resultado em 14/11/2026:** instalado pelo Xcode no iPhone 17 Pro Max do CEO (v18). O CEO confirmou: abriu, funcionou e está fluido. Não conferido (o CEO não relatou): som, modo online com 2 aparelhos, e uso por mais tempo (aquecimento/bateria). Também testado no Simulador.
O Mac já enxerga o seu "Iphone Marileo" (iPhone 17 Pro Max) e o Xcode já tem um Apple ID e um Team. Versão do jogo: v18 (menus novos).

## Antes (o assistente já deixou pronto)
O projeto está em `ios/MarileoKart.xcodeproj` (já com o seu Team escolhido). Para refazer com o jogo mais novo, o assistente roda:
```bash
python3 ios/build-web.py && python3 ios/gerar-xcodeproj.py V4U7BP3U2R
```
(esta versão de teste não tem anúncios; a da loja tem.)

## Passos (você faz)
1. **Cabo:** ligue o iPhone no Mac, desbloqueie a tela e toque em **"Confiar neste computador"** (digite a senha do iPhone).
2. **Modo de Desenvolvedor no iPhone:** Ajustes → Privacidade e Segurança → **Modo de Desenvolvedor** → ligar → o iPhone reinicia → depois de reiniciar, confirme "Ligar" e digite a senha do iPhone. (Se a opção não aparecer, faça o passo 4 primeiro e volte aqui: ela só surge depois que o Xcode tenta instalar.)
3. **Apple ID no Xcode (só se pedir):** Xcode → Ajustes (⌘,) → **Contas**. Se o seu Apple ID já estiver na lista, não faça nada. Se não estiver, clique em **+** e entre. **A senha é você que digita; ninguém mais.**
4. **Abrir e rodar:** no Terminal, rode `open ios/MarileoKart.xcodeproj` (dentro da pasta do projeto), ou dê dois cliques no arquivo. No Xcode:
   - Em cima, ao lado do botão ▶, escolha **Iphone Marileo** como destino.
   - Clique em **MarileoKart** (ícone azul à esquerda) → aba **Signing & Capabilities** → confirme que **Team** é o seu e que "Automatically manage signing" está marcado.
   - Aperte **▶ (Run)**.
5. **Primeira abertura:** se o iPhone disser "Desenvolvedor não confiável": Ajustes → Geral → **VPN e Gerenciamento de Dispositivo** → toque no seu nome → **Confiar**. Depois abra o Race Cities pelo ícone.

## O que conferir (me diga o que viu)
- O jogo abre deitado (paisagem) e mostra o menu com as fontes certas?
- Corrida Rápida: a corrida começa, o kart responde ao toque?
- O som toca? (Se o iPhone estiver no silencioso, ligue o som.)
- Tela cheia sem barras estranhas nos cantos?
- Quantos quadros por segundo parece (fluido ou travando)? Esse número eu não consigo medir daqui.

## Se der erro
Copie a mensagem **exatamente** como aparece e mande ao assistente. Erros comuns: "Developer Mode disabled" (passo 2), "Untrusted Developer" (passo 5), "No account for team" (passo 3).

## Depois
Esta é só a instalação de teste. Para a TestFlight/loja é outro caminho (precisa do app criado no App Store Connect; ver `docs/PUBLICACAO-PASSO-A-PASSO.md`).

## Atualização (trilha nova + som com silencioso ligado)

- App refeito com a trilha nova (pasta `audio`, 10 faixas, app ~10 MB) e com a sessão de áudio "playback":
  o som toca mesmo com o botão de silencioso do iPhone ligado.
- Simulador: música do menu decodificou e tocou (sessão WebAudio "Playing").
- Instalado no iPhone do CEO pelo cabo. Falta o CEO ouvir e confirmar.
