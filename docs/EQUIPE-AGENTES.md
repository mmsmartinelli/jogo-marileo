# Equipe de agentes do Race Cities

O **diretor** (esta sessão do Mac) fala com o CEO e delega o trabalho a agentes. Cada agente tem uma função, um modelo de inteligência e um nível de esforço escolhidos pelo tipo de tarefa. As definições ficam em `.claude/agents/`.

**Regra de ouro:** o agente faz, o diretor confere (capturas, números, testes) e só então junta na branch. Push e Pull Request só quando o CEO pedir.

## Como escolhemos inteligência e esforço

| Tipo de tarefa | Modelo | Esforço |
|---|---|---|
| Arte 3D e código difíceis, mexe em muitos arquivos | Opus | alto |
| Estratégia com dinheiro e regras (monetização) | Sonnet | alto |
| Pesquisa na web, lojas, testes, textos, ajustes simples | Sonnet | médio |

## Seções (quem faz o quê)

| Seção | Agente | Modelo / esforço | O que entrega | Onde mexe |
|---|---|---|---|---|
| 1. Cidades e visual | `arte-cidades` | Opus / alto | Marcos, bairros, fachadas e vida de rua; capturas e medição de peso | `js/cities/` |
| 2. Modelos 3D (Blender) | `modelagem-blender` | Opus / alto | Monumentos em `.glb` por script; comparação de peso com o procedural | `tools/blender/`, `assets/models/` |
| 3. Fases infinitas, Grande Prêmio e jogabilidade | `gameplay-fases` | Opus / alto | Pistas infinitas válidas, copas, desbloqueios, desafios, IA e online | `js/trackgen.js`, `tracks.js`, `main.js`, `race.js`, `ai.js`, `netrace.js` |
| 4. Testes e qualidade | `qa-testes` | Sonnet / médio | Tabela das 12 cidades (calls, triângulos, terminou?), erros e capturas; não altera código | só relatório |
| 5. Publicação nas lojas | `publicacao-lojas` | Sonnet / médio + web | Plano e passo a passo das lojas; apps Android e iOS; CI | `docs/PUBLICACAO.md`, `android/`, `ios/`, `.github/` |
| 6. Monetização e comerciais | `monetizacao-anuncios` | Sonnet / alto + web | Anúncios após cada fase, premiados, remover anúncios, patrocinadores; números com fonte | `docs/MONETIZACAO.md`, `docs/ANUNCIOS.md`, `js/ads*.js` |
| 7. Privacidade e conformidade | `juridico-privacidade` | Sonnet / médio + web | Política de privacidade e lista de dúvidas para a consulta ao advogado (não é parecer jurídico) | `docs/privacidade-*` |
| 8. Arte de loja e marketing | `arte-marketing` | Sonnet / médio | Ícone, capturas 1920x1080, trailer curto, textos PT/EN | material de loja |

## Decisões do CEO que todos respeitam

- Jogo **grátis com anúncios** (Google) depois das corridas; **patrocinadores locais só depois de ter jogadores**.
- Nome **Race Cities**; nomes de lojas e marcas dentro do jogo são **fictícios**.
- Não migrar para Unity. iOS fora da categoria Kids (4+, família).
- Advogado: **uma única consulta** antes de ligar anúncios reais.
- Contas de App Store e Google Play: o CEO já tem.

## Fila de trabalho (ordem proposta)

1. Verificar a junta das cidades (`qa-testes`) e publicar a branch, com o OK do CEO.
2. Ajustes que o estudo de lojas apontou (`publicacao-lojas` + `monetizacao-anuncios` + `juridico-privacidade`): aviso de segurança online para crianças, anúncio "a cada 2 corridas", texto de privacidade do iOS, palavras-chave da Apple.
3. Cristo do Blender: medir o Rio inteiro e decidir (`modelagem-blender`).
4. Sydney mais leve e Pequim, Cairo e Dubai revisados (`arte-cidades`).
5. Retenção e progressão: desbloqueios, desafios e ranking (`gameplay-fases`).
6. Material de loja e trailer (`arte-marketing`).
7. Teste no celular do CEO (iPhone e Android): o diretor prepara o passo a passo.
