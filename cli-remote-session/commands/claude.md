---
description: Escolhe e trava a sessão do Claude Desktop desta máquina com quem esta conversa vai falar. Ele não manda nada — quem encaminha é o /c. Serve pra quando eu estou no Remote Control (CLI) e quero usar o desktop, que é de outra conta.
argument-hint: "<alvo> — trava nessa sessão. Vazio, resolve sozinho. `list` pra listar, `new` pra conversa nova, `cli` pro sentido inverso, `exit` pra destravar."
---

# /claude — trava a sessão do Claude Desktop

Esta máquina roda dois ambientes de contas diferentes: o **Claude Desktop** e esta
sessão **CLI / Remote Control**. Eles não compartilham nada pela API, mas a
entrega na mesma máquina é named pipe por sessão, restrito ao **usuário do
Windows** e nunca pelos servidores da Anthropic — por isso atravessa as contas: o
que importa é o usuário do SO, não a conta.

Os três comandos: **`/claude` escolhe o alvo, `/c` manda, `/p` puxa a resposta.**
Este arquivo é o primeiro terço. Siga os passos na ordem, não improvise.

---

## Passo 0 — `/claude` não manda nada

Este comando **escolhe e trava** a sessão de destino. Ele nunca chama
`SendMessage`. Quem encaminha é o `/c`, e só ele.

Daí sai tudo o mais: `$ARGUMENTS` aqui é **alvo**, nunca prompt.
`/claude meu-projeto-17` trava naquela sessão. `/claude revisa o diff` procura uma
sessão chamada "revisa o diff", não acha, e **pergunta** — não manda nada pra
lugar nenhum. Se eu queria mandar, eu digito `/c revisa o diff`.

Barra depois de `/claude` também não é skill pra rodar aqui — `/claude
/minha-skill` não roda a skill nesta sessão nem encaminha coisa alguma;
não casa com alvo nenhum e vira pergunta. Rodar lá é `/c /minha-skill`.

Travado, o alvo vale pras mensagens seguintes: cada `/c` vai pra ele até eu rodar
`/claude exit`. É por isso que **não existe parâmetro `on`** — invocar o comando
já é ligar.

Autoteste antes de agir: a sua **primeira** ferramenta é o script do Passo 1.
Chamou `SendMessage`? Comando errado, isso é o `/c`. Chamou `Skill`, `Read` ou
`Edit` de trabalho? Errou também — `/claude` não faz trabalho de código.

---

## Passo 1 — Liste as sessões

Rode isto e use a saída. É a fonte da verdade: o campo `name` **é** o endereço do
`SendMessage`.

Existe listagem nativa — `/list-agents`, alias `/peers`, e o próprio `ListAgents`
— e ela é autoritativa sobre **quem consegue receber**: lista quem tem inbox
(inclusive `claude -p`, background e, com Remote Control, cloud e outras
máquinas). Ela não sabe nada da camada do app desktop: não traz título de
conversa, marca de fixada, última atividade nem o filtro por `claude-desktop`. Use
o script abaixo pra escolher; cruze com o nativo quando um nome não bater.

O script é **cego pra tudo que não é desta máquina** — ele lê arquivos locais.
Sessão cloud ou de outra máquina aparece só no nativo, e só enquanto esta sessão
estiver conectada ao Remote Control. Medido em 01/09/2026: esta sessão é
`sdk-cli` com bridge de RC e o nativo listou só peers locais, todos
`claude-desktop` — nenhuma linha `cloud` nem de outra máquina. O caminho existe no
protocolo e está vazio aqui; não prometa alcance que ninguém viu.

```bash
S=~/.claude/sessions
DS=$(ls -d ~/AppData/Local/Packages/Claude_*/LocalCache/Roaming/Claude/claude-code-sessions 2>/dev/null | head -1)
LIVE=$(powershell.exe -NoProfile -Command "(Get-Process claude -ErrorAction SilentlyContinue).Id" 2>/dev/null | tr -d '\r')
SELF=$(basename "${CLAUDE_CODE_MESSAGING_SOCKET:-__nenhum__}")   # cc-msg-<hash> = EU

STAR=""
for f in $(grep -l '"isStarred":true' $DS/*/*/local_*.json 2>/dev/null); do
  grep -q '"isArchived":true' "$f" && continue
  cs=$(grep -o '"cliSessionId":"[^"]*"' "$f" | cut -d'"' -f4)
  ti=$(grep -o '"title":"[^"]*","titleSource"' "$f" | cut -d'"' -f4)
  la=$(grep -o '"lastActivityAt":[0-9]*' "$f" | cut -d: -f2)
  lid=$(basename "$f" .json)
  STAR="$STAR$cs|$ti|$la|$lid
"
done

ROWS=""; SIDS=""
for f in $S/*.json; do
  pid=$(basename $f .json); case "$pid" in *.*) continue;; esac
  echo "$LIVE" | grep -qx "$pid" || continue
  grep -qF "$SELF" "$f" && continue
  ep=$(grep -o '"entrypoint":"[^"]*"' $f | cut -d'"' -f4)
  [ "$ep" = "claude-desktop" ] || continue
  nm=$(grep -o '"name":"[^"]*"' $f | cut -d'"' -f4)
  sid=$(grep -o '"sessionId":"[^"]*"' $f | cut -d'"' -f4)
  SIDS="$SIDS $sid"
  ct=$(echo "$STAR" | grep "^$sid|" | cut -d'|' -f2)
  mk=" "; [ -n "$ct" ] && mk="*"
  tf=$(ls ~/.claude/projects/*/"$sid".jsonl 2>/dev/null | head -1)
  [ -n "$ct" ] || ct=$(head -60 "$tf" 2>/dev/null | grep -o '"customTitle":"[^"]*"' | head -1 | cut -d'"' -f4)
  ts=$(date -r "$tf" '+%s' 2>/dev/null)
  ROWS="$ROWS$mk|${ts:-0}|$nm|$(date -d @${ts:-0} '+%d/%m %H:%M' 2>/dev/null)|${ct:-(sem titulo)}
"
done
printf '%s' "$ROWS" | sort -t'|' -k1,1r -k2,2nr | awk -F'|' 'NF{printf "%s %-16s %s  %s\n",$1,$3,$4,$5}'

DORM=$(echo "$STAR" | while IFS='|' read cs ti la lid; do
  [ -n "$cs" ] || continue
  case " $SIDS " in *" $cs "*) continue;; esac
  printf '%s|* %s  %-8s %s\n' "$la" "$(date -d @$((la/1000)) '+%d/%m %H:%M' 2>/dev/null)" "$(echo "${lid#local_}" | cut -c1-8)" "$ti"
done | sort -t'|' -k1,1nr | cut -d'|' -f2-)
[ -n "$DORM" ] && { echo "-- fixadas sem sessao viva (nao da pra mandar) --"; echo "$DORM"; }
```

Saída esperada — marca de fixada, nome, última atividade, assunto:

```
* meu-projeto-17   31/08 18:29  Ajuste do fluxo de worktree
  meu-projeto-5f   31/08 18:29  Skills padrões em memória automática
  meu-projeto-98   31/08 17:46  Configuração dos hooks
  meu-projeto-ea   31/08 16:56  Centralizar modo automático no comando /y
  meu-projeto-6f   31/08 11:03  Relatório de vendas
-- fixadas sem sessao viva (nao da pra mandar) --
* 31/08 18:08  511ad10f Importação de planilha
* 31/08 17:55  43c29151 Painel de clientes: escopo
```

A coluna do meio no bloco de baixo é o **id de acordar** (o `local_<uuid>` do
app, cortado em 8). Ver "Acordar uma conversa".

Regras deste passo:

- PID morto não entra (o script já filtra). Registro órfão existe.
- **Atividade traz o dia, e a lista vem ordenada por ela.** A coluna é o mtime do
  `.jsonl` — a última escrita daquela sessão. Sem o `%d/%m`, sessão parada desde
  ontem se disfarça de recente; sem a ordenação, a mais quente some no meio.
  Fixadas viva primeiro, e dentro de cada grupo a mais recente no topo.
- Recente **não** quer dizer que só ela existe: sessão com atividade nova cujo
  processo morreu não aparece aqui (a menos que esteja fixada, e aí cai no bloco
  de baixo). A tabela é quem está **vivo**, não quem trabalhou hoje. Pra ver a
  atividade toda, inclusive de sessão encerrada, é `/my-sessions`.
- Nunca liste nem use a **sessão atual**. O script já a corta sozinho pelo
  `$SELF`: o Claude Code exporta `CLAUDE_CODE_MESSAGING_SOCKET` pro Bash
  (`\\.\pipe\LOCAL\cc-msg-<hash>` no Windows) e grava o mesmo valor no campo
  `messagingSocketPath` do registro — o arquivo que casa sou eu. Confere com o
  cabeçalho do `ListAgents` (`This session is meu-projeto-XX`) quando precisar do
  nome. Isso importa de verdade no `cli`: filtrando por `sdk-cli`, sem esse corte
  eu apareceria na minha própria lista, e mensagem pra si mesmo o Claude Code
  recusa.
- Se o script não devolver nada, diga que não há sessão de desktop viva e **pare**.
- Não deduza o alvo por idade do `ListAgents` nem por mtime. Use o `name` do
  arquivo.

Sobre as **fixadas** (a estrela do app desktop):

- O app guarda a conversa dele em
  `~/AppData/Local/Packages/Claude_*/LocalCache/Roaming/Claude/claude-code-sessions/<conta>/<workspace>/local_*.json`.
  Fixada é `"isStarred":true`; `"isArchived":true` fica de fora. O `cliSessionId`
  desse arquivo **é** o `sessionId` do registro de PID — é assim que as duas
  listas se cruzam.
- A tabela é `~/.claude/sessions` (quem está vivo) **cruzada com** essa estrela.
  As fixadas vivas sobem pro topo, marcadas com `*`, na mesma ordem em que o app
  as mostra. O `title` do app vence o `customTitle` do transcript quando existe —
  é o texto que eu leio na tela.
- **Fixada não é o mesmo que viva.** Fixada sem processo cai no bloco de baixo:
  ela não tem named pipe, então não recebe `SendMessage`. Não a ofereça como
  alvo direto — ofereça **acordar** (seção abaixo), que é o caminho pra ela
  virar alvo.
- Se o `$DS` não resolver (app fora, pacote renomeado), a tabela sai sem estrela
  nenhuma. Diga que não deu pra ler as fixadas — **não** afirme que não há
  nenhuma.

Trocar `claude-desktop` por `sdk-cli` na linha do filtro inverte o sentido (é o
que o argumento `cli` faz) — e aí não há estrela: fixar é coisa do app desktop.

É por aí que entra **sessão retomada ou forkada** (`claude --resume <id>`, com ou
sem `--fork-session`): ela sobe como `sdk-cli`, não como `claude-desktop`, então
só aparece no `cli`. O par funciona igual com ela — mesma máquina, mesmo named
pipe, `notify_when_idle` liberado, `/c` sem diferença nenhuma. O que muda é a
conta que paga e o título: sem `customTitle` no transcript novo, ela sai como
`(sem titulo)` e se identifica pelo nome.

### Paginação — `+`

A tabela acima é só quem está vivo. Quando eu não achar minha conversa nela e
responder `+`, abra a gaveta: **todas as conversas que o app conhece**, da mais
recente pra mais velha, 10 por vez. `+N` traz N páginas de uma vez (`+3` = 30).

```bash
SKIP=0; TAKE=10    # SKIP = quantas ja mostrei (o rodape diz o proximo); TAKE = 10 * N
S=~/.claude/sessions
DS=$(ls -d ~/AppData/Local/Packages/Claude_*/LocalCache/Roaming/Claude/claude-code-sessions 2>/dev/null | head -1)
LIVE=$(powershell.exe -NoProfile -Command "(Get-Process claude -ErrorAction SilentlyContinue).Id" 2>/dev/null | tr -d '\r')
SIDS=$(for f in $S/*.json; do pid=$(basename $f .json); case "$pid" in *.*) continue;; esac
  echo "$LIVE" | grep -qx "$pid" || continue; grep -o '"sessionId":"[^"]*"' $f | cut -d'"' -f4; done)
grep -oH -e '"cliSessionId":"[^"]*"' -e '"title":"[^"]*","titleSource"' -e '"lastActivityAt":[0-9]*' -e '"isArchived":true' -e '"isStarred":true' $DS/*/*/local_*.json 2>/dev/null \
| awk -v live="$SIDS" '
{ i=index($0,".json:"); f=substr($0,1,i+4); m=substr($0,i+6)
  if (m ~ /^"cliSessionId"/)       { split(m,a,"\""); cs[f]=a[4]; seen[f]=1 }
  else if (m ~ /^"title"/)         { split(m,a,"\""); ti[f]=a[4] }
  else if (m ~ /^"lastActivityAt"/){ split(m,a,":");  la[f]=a[2] }
  else if (m ~ /^"isArchived"/)    { ar[f]=1 }
  else if (m ~ /^"isStarred"/)     { st[f]=1 } }
END { n=split(live,L,"\n"); for (k in L) LV[L[k]]=1
      for (f in seen) { if (ar[f] || st[f] || LV[cs[f]]) continue
        m=split(f,PP,"/"); b=PP[m]; sub(/^local_/,"",b); sub(/\.json$/,"",b)
        printf "%s|%s|%s\n", la[f], ti[f], substr(b,1,8) } }' > /tmp/rest.txt
TOT=$(wc -l < /tmp/rest.txt)
sort -t'|' -k1,1nr /tmp/rest.txt | sed -n "$((SKIP+1)),$((SKIP+TAKE))p" \
| while IFS='|' read la ti cs; do printf '  %s  %-8s %s\n' "$(date -d @$((la/1000)) '+%d/%m %H:%M')" "$cs" "$ti"; done
END=$((SKIP+TAKE)); [ $END -gt $TOT ] && END=$TOT
echo "-- outras conversas do app: $((SKIP+1))-$END de $TOT --"
[ $END -lt $TOT ] && echo "-- + pra proxima, +N pra N paginas (SKIP=$END) --" || echo "-- fim da lista --"
```

```
  28/08 18:09  db5b8bfc Tela de cadastro
  28/08 11:56  7e27c31c Remote control
  27/08 15:18  9e355ff5 Ajuste do relatório
-- outras conversas do app: 1-10 de 171 --
-- + pra proxima, +N pra N paginas (SKIP=10) --
```

Regras da gaveta:

- **O rodapé é o estado.** Não guarde página na cabeça nem conte de memória: o
  `SKIP=` que saiu na última execução é o `SKIP` da próxima. `+3` é o mesmo
  `SKIP`, com `TAKE=30`.
- A gaveta é **por conversa, não por transcript**. O app guarda um registro por
  conversa e ela troca de `cliSessionId` a cada retomada. Medido em 2026-09-01:
  "Configuração dos hooks" são **10 transcripts no `/my-sessions` e 1 linha
  aqui**. É o que eu quero — achar a conversa, não o pedaço. Corolário: a gaveta
  tem conversa cujo transcript já não existe (178 registros contra 129 `.jsonl`),
  então achar aqui não garante que dá pra ler lá.
- Fixadas e vivas **não** se repetem aqui — elas já saíram na tabela do Passo 1.
  Arquivadas ficam de fora.
- A data é o `lastActivityAt` do app, que é quando a conversa se mexeu **no
  app**. Conversa tocada por fora (`--resume` do CLI, Remote Control) pode ter
  transcript mais novo que essa data. Serve pra ordenar e achar; não trate como
  carimbo exato — pra isso é o `/my-sessions`.
- A coluna do meio é o **id de acordar**: o `local_<uuid>` do app (nome do
  arquivo = campo `sessionId`), cortado em 8. Não é o `cliSessionId`, e não
  serve pro `/my-sessions` — serve pro deep link da seção seguinte.
- Nada da gaveta é alvo de `SendMessage` **enquanto dorme**. Achou a sua? Diga a
  página e o id, e ofereça acordar. Não tente mandar antes.
- 171 conversas dão 18 páginas. Se eu estiver claramente caçando por assunto e
  não navegando, ofereça o `/my-sessions <termo>` numa linha — mas só depois de
  entregar a página que eu pedi.

### Acordar uma conversa

Conversa dormindo não recebe prompt porque `SendMessage` entrega em **named
pipe**, e o pipe é servido pelo processo. Sem processo, não há ouvinte: as
dormentes não têm sequer registro em `~/.claude/sessions/`. Não existe fila em
disco — o `.jsonl` é log, não caixa de entrada.

O que existe é **acordar**. O app registra o protocolo `claude://` e a rota de
continuar aceita conversa específica, não só a última:

```
claude://code/continue?session=local_<uuid-completo>
```

Validador, do próprio bundle do app:

```js
var fQt=/^local_[A-Za-z0-9-]{1,64}$/
function hQt(e){ return e===`last` || e!==null && fQt.test(e) }
```

E o resolvedor procura `n.find(t => t.sessionId === e)` dentro de
`getAllSessions().filter(e => !e.isArchived)`. Ou seja: **qualquer conversa não
arquivada**, pelo id. Acordada, ela ganha processo, pipe e nome — e só então
entra na tabela do Passo 1 e vira alvo.

Como fazer:

1. Expanda o id curto pro completo:
   `ls $DS/*/*/local_<curto>*.json` → o `basename` sem `.json` é o id.
2. Mostre o alvo e **pare pedindo o ok** — disparar isso abre janela na tela de
   quem estiver no app. Mesma disciplina do Passo 3.
   `Start-Process "claude://code/continue?session=local_<uuid>"`
3. Acordou: rode o Passo 1 de novo pra pegar o **nome** novo. Só aí mande o
   prompt. Não presuma o nome nem mande no mesmo fôlego.

Limites honestos desta seção:

- **Medido em 01/09/2026: a URI chega no app — e mesmo assim nada abre.** Com a
  sandbox desligada, `claude://code/new?folder=…` e
  `claude://code/continue?session=local_…` fazem nascer 4 processos `claude` em
  2s, as duas rotas. O controle fecha a conta: 16s sem disparar nada não produzem
  processo nenhum. A ativação acontece.
- **E não vira sessão.** Depois dos dois disparos: nenhuma janela nova (só a de
  sempre), nenhum registro novo em `~/.claude/sessions` (o mais recente continuou
  sendo anterior ao teste), nenhuma conversa nova no store do app, e o
  `local_*.json` da fixada nem foi tocado. Os processos são churn de ativação e
  morrem — nenhum sobrevive com `StartTime` do horário do disparo.
- **A causa é confirmação humana, não gate.** Descoberto em 03/09/2026: a rota
  `new` **abre a conversa** e para no prompt de confiar no workspace, dentro da
  janela do app. Ninguém clica, nenhuma sessão sobe, nada se registra — assinatura
  idêntica à de uma rota bloqueada. Eu li isso como o gate do bundle
  (`if (!await wZt()) ... 'code entry deep link gated off'`) e **estava errado**;
  aquela flag nunca foi lida, só inferida. Não repita a inferência.
- **Confiar remotamente não resolve.** A confiança do Claude Code já está dada:
  `~/.claude.json` → `projects` → `hasTrustDialogAccepted: true` para
  a pasta do workspace (nas duas formas de barra). O
  prompt é do **app**, e o estado dele não está em JSON algum — a string só existe
  dentro dos binários, logo vive no LevelDB/IndexedDB do Electron. **Não escreva
  ali**: corromper o store de um app aberto custa mais do que o clique economiza.
- Testado com `folder=` e **sem** `folder=`, 45 a 60s cada. Os dois param no
  prompt, então não é o caminho externo que desperta a desconfiança — é abrir
  conversa nova por deep link, ponto.
- Duas teorias já **descartadas**, não repita nenhuma: não é a sandbox (com ela
  desligada o comportamento é idêntico) e não é falta de registro do protocolo no
  Windows — o pacote de fato não aparece em
  `HKCU\Software\Classes\Extensions\ContractId\Windows.Protocol\PackageId`, mas a
  ativação chega assim mesmo, logo essa ausência não é o que trava.
- **A causa real é que sessão nasce de prompt.** Conversa em branco não tem
  processo: o `claude.exe` só sobe quando chega a primeira mensagem. Todo polling
  meu em `~/.claude/sessions` depois de um deep link achou nada por isso — não
  havia quem registrar, porque ninguém tinha digitado. Deep link e `SendMessage`
  são canais diferentes: o pipe entrega porque tem processo escutando; a URI abre
  a conversa e para. A rota `new` **aceita `prompt=`**, o que ataca isso de frente
  — ver "Conversa nova".
- **Reteste de 60s, com o id certo: também não acorda.** O primeiro teste foi
  curto e comparava o id errado (ver abaixo). Refeito na conversa fixada
  "Painel de clientes": `cliSessionId` idêntico no fim dos 60s e nenhum
  registro vivo com ele. Não é questão de esperar mais.
- **O id da conversa não é o id da sessão.** `local_<uuid>` é a conversa no app;
  o `~/.claude/sessions/<pid>.json` guarda `sessionId`, que é o `cliSessionId` —
  outro uuid, que **muda a cada retomada**. Pra saber se acordou, leia o
  `cliSessionId` de dentro do `local_*.json` e procure **esse** valor nos
  registros vivos. Comparar o `local_<uuid>` contra o `sessionId` nunca casa, e o
  falso "ainda dormindo" parece resultado.
- Na prática: **pode disparar** (é barato e não quebra nada), mas confira o Passo
  1 depois. Sem nome novo, diga que falhou e mande abrir na mão no app. Nunca
  anuncie que abriu sem ter visto o nome novo.

#### Antes de tentar acordar qualquer coisa

**O app não restaura conversa ao iniciar.** Medido em 03/09/2026: boot às 04:36,
app aberto 04:37, e das 4 fixadas só estava viva a que foi aberta na mão. Não
espere que reboot devolva sessão — depois de reiniciar, existe só o que foi
aberto manualmente. Isso é o que torna "sessão sempre ativa" impossível de
garantir sozinho: nenhum caminho daqui recria sessão na conta do app.

**Registro novo não é prova de que foi você.** Errei isso duas vezes em 03/09:
processos transitórios lidos como sessão nascendo, e depois duas sessões novas em
`~/.claude/sessions` anunciadas como resultado do meu deep link — eram conversas
antigas voltando a viver enquanto o usuário clicava no app (transcripts de 5,3
MB e 1,6 MB, começando em assunto que não era o meu). Antes de dizer que
funcionou: **abra o transcript e confirme que o seu prompt está lá**. Tamanho do
`.jsonl` já denuncia — conversa nova nasce pequena.

Duas travas, aprendidas quebrando uma sessão viva em 01/09/2026:

- **Releia o `cliSessionId` no momento do uso, sempre.** Ele muda a cada
  retomada. Id capturado antes nesta mesma conversa está velho, e `--resume` num
  id velho **não acorda nada**: abre uma segunda cabeça com uma cópia antiga da
  conversa, por cima do trabalho de quem estiver com ela aberta. Foi exatamente o
  que aconteceu — a conversa estava viva e eu ressuscitei o fantasma dela.
- **Confira se ela já não está viva.** Leia o `cliSessionId` do `local_*.json`
  agora e procure no Passo 1. Achou: **é alvo, não é candidata a acordar** —
  trave e use. "Fixada dormindo" é conclusão que exige o id fresco; com id velho
  ela é sempre falsa.
- Nunca dar `--resume` numa conversa aberta no app. Duas cabeças no mesmo id não
  se coordenam.

E se ainda assim for pra subir uma sessão daqui: `claude` filho de uma sessão do
Claude Code herda `CLAUDE_CODE_CHILD_SESSION`, roda com **transcript desligado** e
por isso **não se registra** em `~/.claude/sessions` — nunca vira alvo. Ele avisa
na tela e sugere `CLAUDE_CODE_FORCE_SESSION_PE…`. Sem tratar isso, o polling dá
"não acordou" mesmo quando a janela abriu e carregou a conversa.

#### No lugar do deep link

Duas saídas reais, nesta ordem:

1. **Abrir na conversa no app, na mão.** É o caminho normal: ela ganha processo,
   pipe e nome, e aí entra no Passo 1 como qualquer outra.
2. **`claude --resume <cliSessionId>`** num terminal. O transcript da conversa
   mora em `~/.claude/projects/<workspace>/<cliSessionId>.jsonl` e o CLI retoma
   por id. Sobe sessão viva, com inbox e nome — vira alvo.

O `--resume` tem um preço que não dá pra esconder: a sessão retomada roda sob a
conta do **CLI**, não a do app desktop. Ele não acorda a sessão de lá, ele
**traz a conversa pra cá**. Isso muda a conta que paga, some do app, e ela passa
a aparecer como `sdk-cli` no Passo 1, não como `claude-desktop`. Use `--fork-session`
se eu não quiser mexer no id original. Diga isso antes de sugerir, não depois.

Remote Control **não** acorda nada: ele conecta ao claude.ai/celular uma sessão
que já está rodando nesta máquina (`claude --remote-control` sobe uma nova,
`/remote-control` publica a atual). Não existe rota dele pra sessão parada.
- **Arquivada não acorda** por aqui de todo jeito: o resolvedor filtra `!isArchived`.
- Rotas irmãs: `claude://code/new?folder=<caminho>` abre conversa nova na pasta;
  `claude://code/needs-input?session=<local_uuid>` (ou sem `session`) pula pra
  quem está travada esperando resposta de permissão. `claude://resume` existe
  mas **eu não confirmei os parâmetros dele** — não use como se soubesse.
- **A rota `new` aceita `prompt=`** (medido 03/09/2026 — ver "Conversa nova").
  As outras abrem e focam. `SendMessage` continua exigindo sessão viva, e sessão
  viva continua exigindo que alguém tenha mandado a primeira mensagem.

### Conversa nova — `new`

`/claude new` abre uma **conversa nova no app**, na pasta que eu disser:

```
/claude new             → raiz do workspace (o diretório desta sessão)
/claude new <caminho>   → naquela pasta — uma worktree, por exemplo
```

Como fazer:

1. Resolva a pasta e **pare pedindo o ok**: isto abre janela na tela de quem
   estiver no app. Mesma disciplina do Passo 3.
2. Dispare com a sandbox desligada e o caminho url-encoded:
   `Start-Process "claude://code/new?folder=C%3A%5CUsers%5C…"`
3. Rode o Passo 1 e procure **nome novo**. Apareceu: é o alvo, e só aí mande o
   prompt. Não apareceu: diga que falhou e ofereça abrir na mão. **Não invente
   que abriu.**

**`new` carrega prompt.** Descoberto em 03/09/2026, testando cinco nomes de
parâmetro de uma vez: o app honra **`prompt=`** e ignora `query`, `message`,
`text` e `input`. Forma canônica:

```
claude://code/new?folder=<path-url-encoded>&prompt=<texto-url-encoded>
```

O texto chega na caixa de mensagem — **e para ali. Não envia sozinho** (medido
03/09/2026). Isso importa porque **sessão nasce da primeira mensagem**: conversa
em branco não tem processo, não registra inbox, e por isso nunca vira alvo de
`SendMessage`. Sem o Enter humano, o deep link não cria sessão nenhuma.

Consequência, e é o fim da linha de "acordar remoto": **não existe caminho daqui
para criar sessão viva na conta do app.** Toda rota exige alguém na máquina — o
clique de confiança quando vai `folder=`, e o Enter sempre. Isso é intencional:
uma URI que abrisse, confiasse numa pasta e executasse um prompt sem humano seria
execução remota de código a partir de qualquer página web. Não procure contorno,
e **não escreva no LevelDB do app** tentando um.

Não tente a variante "deep link abre a sessão, `SendMessage` manda depois": ela
morre no primeiro passo. **Deep link cria conversa, não sessão** — sem inbox, o
`SendMessage` não tem endereço. Medido 03/09/2026 com detector sem filtro de
entrypoint, 25s, zero entradas novas. E não é limite da plataforma: na mesma
listagem havia uma sessão `claude-vscode` com transcript de **0 bytes** e inbox
registrado. O VS Code registra ao abrir; o app desktop espera a primeira
mensagem. Diferença de escolha do app, não de mecanismo.

O que o `prompt=` vale de verdade: com alguém **na máquina**, eu pré-carrego o
texto exato numa conversa nova e essa pessoa só dá Enter. Bom para passar
trabalho sem digitar; inútil para acesso remoto.

Nasceu com nome novo (depois do Enter): trave com `/claude <nome novo>` e mande
com `/c`.

Hoje, nesta máquina, o passo 3 falha: a rota entra no app e o gate come. Medido
duas vezes, em duas instâncias diferentes do app — 01/09 e 03/09, esta última
logo após reboot, com janela de 60s e comparação por `sessionId` novo em
`~/.claude/sessions`. Nenhuma sessão nasce. Corolário que importa: **não existe
caminho daqui para criar sessão na conta do app**, então "abrir uma temporária,
usar e fechar" depende de um clique em "Nova conversa" — o que dá pra automatizar
é só o depois (sondar e encerrar matando o processo daquele `sessionId`).

O parâmetro existe porque o disparo é barato e volta a funcionar sozinho se a flag
virar — até lá, o caminho real é abrir na mão no app. Ver os limites acima antes
de prometer qualquer coisa.

---

## Passo 2 — Escolha o alvo a partir de **$ARGUMENTS**

| `$ARGUMENTS` | Faça |
| --- | --- |
| vazio | resolva o alvo pelas regras abaixo e **trave** nele |
| `list` ou `l` | imprima a tabela do Passo 1 e **pare** |
| `+`, `+1`, `+N` | próxima página da gaveta do Passo 1 e **pare** |
| `exit` ou `off` | **destrave** o alvo e pare |
| `new` ou `new <caminho>` | abre **conversa nova** no app (seção "Conversa nova"). Confirme antes |
| `cli` ou `cli <alvo>` | filtre por `sdk-cli` no Passo 1 e trave lá (sentido inverso) |
| `<alvo>`, `@<alvo>` ou `para <alvo>` | **trave** nessa sessão |
| não casou com sessão nenhuma | **pergunte**. Não é alvo, e daqui não sai mensagem — lembre numa linha que quem manda é `/c` |

Palavra de controle casa **exata**. `+` vale também **solto**, sem `/claude` na
frente, quando vem logo depois de uma listagem minha: é a página seguinte.

`<alvo>` casa por: nome inteiro (`meu-projeto-98`), prefixo de uuid de 6+
caracteres, ou termo contido no título.

Sem alvo explícito, nesta ordem:

1. já existe alvo travado **nesta conversa** → é ele, e diga qual em uma linha;
2. só existe **uma** sessão de desktop viva → é ela;
3. mais de uma → **mostre a tabela e pergunte**, em texto puro. Não chute.

Casou em mais de uma → mostre as candidatas e pergunte.

Estrela **não** decide alvo. Fixada é o que eu marquei no app, não o que eu quero
agora: ela sobe na tabela e pronto. Duas vivas, uma fixada → continua sendo o caso
3, pergunte. Uma viva só → é ela, fixada ou não.

`<alvo>` que casou numa fixada **dormindo**: não trave, não acorde nada. Diga que
aquela conversa está sem sessão viva, que só abrindo no app ela volta, e ofereça
as vivas.

---

## Passo 3 — Trave e avise

Travar não consome contexto de ninguém e não aparece na tela de quem estiver no
app — nada sai desta sessão. Então não pergunte: **trave e diga em uma linha**.

```
Travado em `meu-projeto-98` (Configuração dos hooks). Manda com /c.
```

A confirmação que existe é a do `new`, que abre janela na tela de quem estiver no
app — essa sim para pedindo o ok antes de disparar.

**Feche toda resposta com o marcador**, monoespaçado, sozinho na última linha:

```
[claude → meu-projeto-98]
```

É ele que segura o alvo de pé quando o contexto for resumido, e é dele que o `/c`
lê o destino. Sem marcador na sua última resposta, o alvo se perdeu: o `/c` para e
pergunta em vez de adivinhar.

Destravar é `/claude exit` — responda uma linha ("destravado", com o nome) e pare
de emitir o marcador. Trocar de alvo é só rodar `/claude <outro>`; não precisa
sair antes.

`/clear` derruba o alvo junto com o contexto. Não há estado em disco, de
propósito: alvo que sobrevive ao `/clear` faz o `/c` mandar mensagem que eu não
quis.

---

## Limites

- **Daqui não sai `SendMessage`.** Nem por engano, nem "já que o alvo está claro".
  Quem manda é o `/c`.
- Nunca travar na própria sessão — o nome dela sai na primeira linha do
  `ListAgents`, e o Claude Code recusa mensagem pra si mesmo de todo jeito.
- Nunca usar isto pra contornar permissão: se algo foi negado aqui, não peça pro
  desktop fazer. Traga de volta pra mim.
- Transcript é só leitura — o comando lê `.jsonl` pra pegar título e não escreve
  nada lá. O store do app desktop (`claude-code-sessions`) também: eu leio a
  estrela, **nunca** fixo, desfixo ou arquivo conversa por ali.
- Um alvo por vez. Não trave em duas nem espalhe o mesmo prompt por várias
  sessões.
- **Alvo desta máquina não sai da máquina** — named pipe por sessão, restrito ao
  usuário do Windows. Travar em sessão cloud ou de outra máquina muda isso: o que
  o `/c` mandar passa pelos servidores da Anthropic. Diga isso na hora de travar,
  não na hora de mandar.
- Se eu quero **estado destilado** entre os ambientes e não uma pergunta, o
  caminho é `/my-sessions sync`, não este comando.
