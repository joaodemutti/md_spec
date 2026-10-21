---
description: Lista, busca e abre as sessões locais do Claude Code guardadas em ~/.claude/projects — de qualquer conta ou build que tenha rodado nesta máquina.
argument-hint: "vazio = sessões deste projeto | <termo> = busca | <id> = abre | tudo | aqui <termo>"
---

# Minhas sessões

Toda sessão do Claude Code que roda **local** grava transcript em
`~/.claude/projects/<projeto>/<uuid>.jsonl`. O store é do **usuário do Windows**,
não da conta: sessões do CLI, do app desktop e de builds diferentes caem todas no
mesmo lugar. É isso que faz este comando enxergar "entre contas".

**O que ele NÃO alcança**, e não adianta tentar: sessão que rodou na **nuvem**
(claude.ai) não deixa arquivo aqui. E isto é coisa separada do `ListAgents` —
aquele canal fala com sessão **viva** e é escopo de conta; este lê **arquivo** e
ignora conta. Não confunda os dois no relatório.

## Como ler os arquivos

- Cada linha do `.jsonl` é um JSON. Campos que importam: `type` (`user` /
  `assistant`), `message.content` (string **ou** array — pegue os itens
  `.type == 'text'`), `cwd`, `version`, `timestamp` e principalmente
  **`entrypoint`**.
- **`entrypoint` é a origem da sessão**, dita pelo próprio arquivo:
  `claude-desktop` (app desktop), `sdk-cli` (CLI). Use ele — não deduza origem a
  partir do número da `version`, que só diz o build e tem mais de um candidato.
- O `entrypoint` **não está na primeira linha**. Sessão com título próprio abre
  com um registro `type: custom-title` (e o `customTitle` é um título melhor que
  a primeira mensagem — prefira ele quando existir). Varra as ~60 primeiras
  linhas até achar um registro que tenha `entrypoint`.
- Filhos de uma sessão: `<uuid>/subagents/*.jsonl` e `<uuid>/tool-results/*.txt`.
  Contam como parte da sessão pai, não como sessão própria.
- **Ignore `memory/`** dentro da pasta do projeto — é auto-memória, não sessão.
- **UTF-8 sempre.** `Get-Content` sem `-Encoding utf8` transforma acento em
  `Ã§`. Se aparecer mojibake no seu output, o erro é da leitura, não do arquivo —
  releia certo em vez de reportar o texto corrompido.
- Transcript passa de 15 MB com facilidade. **Nunca despeje.** Extraia a fatia.
- **Pule `.jsonl` de 0 byte** — sessão que abriu e não escreveu nada. Não tem
  `entrypoint` nem título; só suja a lista.

## 1. Resolva o modo a partir de **$ARGUMENTS**

- **vazio** → lista as sessões do projeto do diretório atual.
- **`tudo`** → lista de todos os projetos do store.
- **hex de 6+ caracteres** que casa com o começo de um uuid → abre aquela sessão.
- **`aqui <termo>`** → busca `<termo>` só no projeto atual.
- **`sync ...`** → seção 5, passar o bastão entre os dois lados.
- **qualquer outra coisa** → busca esse termo em todos os projetos.

A pasta do projeto atual tem o caminho achatado (`C:\Users\jo\x` vira
`c--Users-jo-x`). Não monte o nome na mão — liste `~/.claude/projects` e case
pelo diretório que corresponde ao `cwd`.

## 2. Listar

Para cada sessão: **data da última escrita, id curto (8), `entrypoint`, tamanho,
título**. O título é o `customTitle`, se houver; senão a primeira mensagem
`type: user`, em uma linha, cortada em ~100 caracteres. Se essa mensagem for
invocação de comando (`<command-name>/foo</command-name>`), o título é
`/foo <args>`. Pule `<system-reminder>` e `<local-command-caveat>` — não são
fala minha.

Ordem: mais recente primeiro. Sem `tudo`, corte em 15 e diga quantas ficaram.

A coluna `entrypoint` é o ponto do comando: ela mostra que sessão do
`claude-desktop` e do `sdk-cli` convivem no mesmo store, inclusive de contas
diferentes. Diga a origem pelo campo, com todas as letras — ela é declarada, não
inferida.

## 3. Buscar

Use **Grep** (ripgrep) sobre `~/.claude/projects`, não `Select-String` — os
arquivos são grandes. `output_mode: count` primeiro, para ranquear por número de
ocorrências.

Apresente as sessões que casaram, ranqueadas, no formato da listagem, com a
contagem de hits. Se a mesma primeira mensagem aparecer em várias, diga que é a
mesma frente retomada — não liste como se fossem assuntos diferentes.

Arquivos de `subagents/` e `tool-results/` que casaram: some ao pai e mencione em
uma linha, sem listar um a um.

## 4. Abrir uma sessão

Mostre primeiro o cabeçalho (data, tamanho, linhas, `version`, `cwd`) e o
briefing/pedido inicial. Depois **pergunte o que extrair** — não invente um
resumo de 10.000 linhas por conta própria.

Quando eu disser o recorte, entregue **o que está no arquivo**, citando trecho
quando for decisão minha ou do modelo. Não preencha buraco com dedução: se a
sessão não diz, escreva que não diz.

Antes de escavar transcript grande, olhe se o projeto tem artefato mais novo que
já destile aquilo (`*.md` de plano/briefing com data posterior). Se tiver,
proponha ler o artefato primeiro — costuma responder melhor e mais barato.

## 5. `sync` — passar o bastão entre os dois lados

Serve para eu continuar a mesma frente ora no desktop, ora no CLI, sem perder o
progresso. **Não é merge de sessão.** É um arquivo de estado que qualquer lado
carrega e reescreve; eu alterno na mão, então o último a escrever manda e
conflito não existe.

O bastão mora em `~/.claude/projects/<projeto>/sync/<slug>.md` — a **mesma pasta
de projeto** que guarda os transcripts e a `memory/`, chaveada pelo `cwd`. É por
isso que funciona entre clientes e entre contas: quem abrir no mesmo
projeto acha, seja `claude-desktop` ou `sdk-cli`. Crie a pasta `sync/` se não existir.

### Subcomandos

- **`sync`** — lista os bastões existentes: slug, data, e a última sessão que
  escreveu.
- **`sync <slug>`** — **carrega**. Leia o arquivo e me devolva o estado por
  extenso. É com isso que a sessão nova começa sabendo onde a outra parou.
- **`sync <slug> update`** — **grava**. Destila ESTA conversa no arquivo.
- **`sync <slug> de <id>`** — grava a partir de **outra sessão do store** (pode
  ser do desktop). Extraia do transcript, não da sua memória da conversa.

### Formato do arquivo

Sempre estas seções, nesta ordem — reescreva o arquivo inteiro, não anexe solto:

```markdown
# <título da frente>

## Estado
O que já está feito, em pontos. Presente do indicativo.

## Pendências
O que falta, em ordem de ataque. Cada item acionável.

## Decisões
Decisão + o porquê. Sem o porquê, a próxima sessão desfaz sem saber.

## Arquivos
Caminhos tocados, com uma linha do que mudou em cada.

## Trilha
- <data> · <entrypoint> · <id curto> — o que essa sessão acrescentou
```

A **Trilha é append**: nunca apague linha de sessão anterior. É ela que me deixa
voltar ao transcript original com `claude --resume <id>` quando o destilado não
bastar.

### Regras

- No `update`, **releia o arquivo antes de reescrever.** Preserve Decisões e
  Trilha que não são suas. Você está atualizando um documento com dono anterior,
  não criando um novo.
- Destile, não transcreva. Se o item não muda o que a próxima sessão vai fazer,
  ele não entra.
- Pendência que virou feito **sai** de Pendências e entra em Estado. Não deixe
  as duas listas se contradizerem.
- Terminado o `update`, mostre o diff do que mudou — em uma linha por seção.
- Se o slug não existir num `sync <slug>`, não invente: liste os que existem.

### Quando NÃO usar o bastão

Se eu quiser o histórico **literal e completo** e não um destilado, o caminho é
`claude --resume <id> --fork-session` — carrega o transcript inteiro num id novo
e deixa o original intocado. O bastão é o inverso: barato, cross-conta,
cross-cliente, e só carrega o que importa. Diga qual dos dois serve quando eu
pedir de forma ambígua.

## 6. Limites

**Transcript é só leitura.** Este comando nunca apaga, move nem edita `.jsonl`.
A única coisa que ele escreve é o bastão em `sync/` — arquivo próprio, criado
para isso.

Escrever dentro de um transcript exigiria forjar `sessionId`, `uuid`,
`parentUuid` e timestamps num formato interno, num arquivo que outro cliente
pode estar escrevendo. **Se eu pedir isso, recuse e ofereça o `sync` ou o
`--fork-session`** — mesmo que eu insista que é rápido.

Se o recorte cair em sessão de **outra conta**, siga em frente — o arquivo é meu,
está na minha máquina —, mas diga o `entrypoint` dela em uma linha, para eu saber
a procedência do que estou lendo.
