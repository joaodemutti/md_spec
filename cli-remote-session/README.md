# cli-remote-session

Duas peças independentes, para usar o Claude Code desta máquina de longe:

1. **Sessão Remote Control no logon.** Uma sessão do Claude Code sobe sozinha quando o usuário entra no Windows,
   sem janela, e reata sempre a mesma sessão, para ser usada do claude.ai ou do celular.
2. **Conversa entre sessões da mesma máquina.** `/claude` escolhe uma sessão do app desktop, `/c` manda o texto e
   `/p` traz a resposta. `/!` roda um comando cru e devolve a saída (terminal por procuração), e `/my-sessions`
   lista e busca os transcripts locais.

Requisitos: Windows, Claude Code CLI, Git Bash (os scripts dos comandos são bash) e Python 3 no PATH. O app
desktop do Claude é opcional; sem ele, o `/claude` lista sem as conversas fixadas.

## 1. Remote Control no logon

| Arquivo | O que é |
| --- | --- |
| `start-remote-control.ps1` | o launcher: mutex, reata pelo id gravado, cria sessão nova se reatar falhar |
| `remote-control-task.xml` | a tarefa agendada, com `{{USER}}`, `{{NAME}}`, `{{SCRIPT}}`, `{{WORKSPACE}}` e `{{CONHOST}}` |
| `install-remote-control-task.ps1` | preenche o XML e registra a tarefa; `-DryRun` só mostra o XML |

### Instalar

1. Copie `start-remote-control.ps1` para `%USERPROFILE%\.claude\`.
2. No PowerShell do próprio usuário (sem admin), nesta pasta:

   ```powershell
   .\install-remote-control-task.ps1 -Workspace C:\caminho\do\projeto
   ```

   O nome da sessão é a última pasta do workspace; `-Name outro-nome` troca. `-DryRun` mostra o XML sem registrar.
3. Saia e entre no Windows, ou rode `Start-ScheduledTask -TaskName '<nome> Remote Control'`.
4. Confira com `Get-ScheduledTaskInfo -TaskName '<nome> Remote Control'`: `LastTaskResult` 267009 (0x41301) quer
   dizer "rodando". O log fica em `%USERPROFILE%\.claude\remote-control-<nome>-startup.log`.
5. Deixe `"remoteControlAtStartup": false` no `~/.claude/settings.json` (ver Armadilhas).

Para tirar: `Unregister-ScheduledTask -TaskName '<nome> Remote Control' -Confirm:$false`.

### A tarefa agendada

| Item | Valor | Por quê |
| --- | --- | --- |
| Gatilho 1 | logon do usuário, sem atraso | sobe ao entrar no Windows |
| Gatilho 2 | evento 10000 de `Microsoft-Windows-NetworkProfile/Operational` (rede conectada) | se a sessão morreu, ela volta quando a rede volta |
| Programa | `conhost.exe --headless powershell.exe -NoLogo -ExecutionPolicy Bypass -File "<.claude>\start-remote-control.ps1" -Workspace "<pasta>" -Name "<nome>"` | o `--headless` roda sem janela; o Windows Terminal ignora `-WindowStyle Minimized` |
| Pasta inicial | o workspace | |
| Conta | o próprio usuário, `InteractiveToken` | roda só com o usuário logado e não guarda senha |
| Instância já rodando | `IgnoreNew` | gatilho com a tarefa no ar é ignorado |
| Limite de tempo | `PT0S` (nenhum) | a tarefa fica "rodando" enquanto a sessão vive |
| Bateria | não impede nem interrompe | notebook fora da tomada |
| Perdeu o horário | `StartWhenAvailable` | roda assim que puder |

Conferido em 21/10/2026: o XML que o instalador gera tem `Settings`, `Triggers` e `Principals` idênticos aos da
tarefa em uso; a ação só acrescenta `-Workspace` e `-Name`.

### O launcher

- Mutex `Local\claude-remote-control-<nome>`: uma sessão viva por workspace. O segundo disparo registra "ja existe
  sessao rodando" no log e sai.
- Roda o server mode (`claude remote-control`), não o interativo `claude --remote-control`, sempre com
  `--permission-mode auto`.
- Reata no id gravado em `remote-control-<nome>-session-id.txt` (`--session-id`). Se o processo morre em 20 s, apaga
  o id, cria sessão nova (`--name <nome>`) e grava o id novo, tirado da saída.
- Segura o mutex até a sessão morrer. Saída e erro do `claude` ficam em `remote-control-<nome>-out.log` e
  `-err.log`.
- Log vazio quer dizer que o launcher nem rodou: a primeira linha é escrita antes de qualquer acesso à rede.

### Armadilhas

- `-c`/`--continue` do server mode não serve para o logon diário: exige registro das últimas ~4 h.
- Sessões acumulam na conta e nome repetido não substitui (vira `<nome>-<sufixo>`). Não há limpeza automática nem
  comando para apagar: a remoção é à mão em claude.ai/code. Por isso o id fixo.
- Enquanto existir `~/.claude/projects/<pasta-achatada>/bridge-pointer.json`, "criar sessão nova" devolve a mesma
  sessão. Para forçar uma nova, apague esse arquivo e o `remote-control-<nome>-session-id.txt`. A sessão antiga fica
  órfã na conta.
- Atalho na pasta Inicializar (Startup) não disparou no logon em dois reboots; a tarefa agendada disparou. E não
  aponte nada para o `wt.exe` do WindowsApps: é um alias de 0 byte.
- A sessão sobrevive a suspensão e a queda de rede (reconecta sozinha), mas não restaura a conversa entre logons.
- `"remoteControlAtStartup": false` no escopo do usuário: nenhuma sessão interativa entra no Remote Control
  sozinha, só a da tarefa, que roda em server mode e não passa por essa flag. Ligar a flag só funciona no escopo do
  usuário; projeto e local só desligam.
- Arquivo de id ausente já derrubou o launcher (método chamado em valor nulo). A leitura atual,
  `"$(Get-Content ...)".Trim()`, sempre devolve texto.

## 2. Conversa entre sessões da mesma máquina

| Arquivo | Comando | O que faz |
| --- | --- | --- |
| `commands/claude.md` | `/claude [alvo\|list\|+\|new\|cli\|exit]` | lista as sessões vivas do app desktop e trava uma como alvo |
| `commands/c.md` | `/c <texto>` | manda o texto cru para o alvo travado |
| `commands/p.md` + `refs/peer-pull.py` | `/p [wait\|<alvo>]` | lê a resposta no transcript local do alvo; `wait` espera o turno fechar |
| `commands/!.md` | `/! <comando>` | roda o comando cru e devolve a saída literal |
| `commands/my-sessions.md` | `/my-sessions [termo\|id\|tudo\|sync]` | lista, busca e abre transcripts de `~/.claude/projects`; `sync` passa o estado de uma frente entre desktop e CLI |

### Instalar

Copie `commands/*` para `~/.claude/commands/` e `refs/peer-pull.py` para `~/.claude/refs/`: valem em todo
projeto. O `/p` chama `python ~/.claude/refs/peer-pull.py`; instalando num projeto só, troque o caminho no `p.md`.

### Como funciona

- O `SendMessage` entre sessões da mesma máquina vai por named pipe, restrito ao usuário do Windows: atravessa
  contas diferentes (o app desktop numa conta, a CLI em outra) sem passar pelos servidores. Sessão de outra máquina
  ou da nuvem passa pelos servidores, e o `/claude` avisa ao travar.
- O alvo travado vive no marcador `[claude → <alvo>]` da última resposta, não em disco: `/clear` o derruba de
  propósito.
- A resposta não volta pelo `SendMessage`: ela fica no transcript do alvo, e o `/p` a lê de lá.
- O `/!` para e pergunta antes de commit/push, de comando destrutivo e de escrita em banco ou ambiente remoto.

### Armadilhas

- **No Windows, `commands/claude.md` também é o `CLAUDE.md` da pasta.** Ao ler qualquer arquivo de
  `commands/`, o Claude Code pode carregar o `/claude` inteiro como instrução da pasta (visto em 21/10/2026).
- Deep link (`claude://code/new` ou `continue`) abre a conversa no app mas não cria sessão: sessão nasce da
  primeira mensagem, e alguém tem de dar Enter. O detalhe está em `claude.md`, "Acordar uma conversa".
- `claude --resume <id>` numa conversa aberta no app cria uma segunda cabeça sobre a mesma conversa. Releia o id
  na hora: ele muda a cada retomada.
