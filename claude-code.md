# Claude Code: configurações, travas e regras

Retrato de 21/10/2026: Claude Code 2.1.306 (extensão do VS Code e CLI), Windows 11, Node v25.8.1. Os atalhos
estão em `atalhos.md`; a sessão de Remote Control no logon e os comandos entre sessões, em `cli-remote-session/`.

## Arquivos

| Arquivo deste repo | Vai para | O que é |
| --- | --- | --- |
| `claude-code/settings.json` | `~/.claude/settings.json` | configurações do usuário e o registro das travas |
| `claude-code/CLAUDE.user.md` | `~/.claude/CLAUDE.md` | regras globais, que valem em todo projeto |
| `claude-code/hooks/block-git-commit-push.js` | `~/.claude/hooks/` | trava de commit e push |
| `claude-code/hooks/block-destructive-merge.js` | `~/.claude/hooks/` | trava de merge que descarta um lado |
| `claude-code/hooks/block-ai-signature.js` | `~/.claude/hooks/` | trava de rodapé de IA e emoji no que sai |
| `claude-code/hooks/git-guards.test.js` | `~/.claude/hooks/` | teste das duas travas de git |

## Instalar

1. Copie `claude-code/hooks/` para `~/.claude/hooks/` e rode o teste. Tem de terminar em "todos os ... casos
   passaram":

   ```bash
   node ~/.claude/hooks/git-guards.test.js
   ```

2. Copie `claude-code/CLAUDE.user.md` para `~/.claude/CLAUDE.md`, ou junte ao que já existe.
3. Junte as chaves de `claude-code/settings.json` ao `~/.claude/settings.json` à mão. O modo automático do Claude
   Code nega Write e Edit nesse arquivo, então quem edita é o usuário.
4. Abra uma sessão nova e confira: `git status` roda direto e `git commit` pergunta antes.

## settings.json

| Chave | Valor | O que faz |
| --- | --- | --- |
| `attribution.pr` | `""` | Tira o rodapé de atribuição das PRs. O trailer `Co-Authored-By` dos commits continua |
| `permissions.defaultMode` | `"auto"` | Começa no modo automático de permissão |
| `model` | `"opus[1m]"` | Opus com janela de contexto de 1M |
| `effortLevel` | `"xhigh"` | Esforço padrão |
| `modelSettings.<modelo>.effortLevel` | `"low"` | Esforço de um modelo específico, por cima do padrão |
| `autoUpdatesChannel` | `"latest"` | Canal de atualização |
| `tui` | `"fullscreen"` | CLI em tela cheia |
| `theme` | `"dark"` | Tema da CLI |
| `skipWorkflowUsageWarning` | `true` | Não avisa do custo antes de rodar um workflow |
| `remoteControlAtStartup` | `false` | Nenhuma sessão interativa entra no Remote Control sozinha (ver `cli-remote-session/`) |
| `inputNeededNotifEnabled` | `false` | Sem notificação quando a sessão espera resposta |
| `agentPushNotifEnabled` | `true` | Notificação push quando o agente pede |
| `hooks.PreToolUse` | 3 blocos | As travas abaixo |

## Travas (hooks PreToolUse)

O hook roda antes da ferramenta, recebe a chamada em JSON pela entrada padrão e devolve uma decisão: `ask`
pergunta e segue com o "yes"; `deny` barra e devolve o motivo ao modelo, que tem de refazer a chamada. Vale em
qualquer modo de permissão, inclusive no automático.

| Hook | Quando dispara | Decisão |
| --- | --- | --- |
| `block-git-commit-push.js` | Bash com `git ... commit` ou `git ... push` (inclusive `git -C <pasta>`) | `ask` |
| `block-destructive-merge.js` | `checkout`/`restore --ours\|--theirs`, `checkout <ref> -- <arquivo>`, `restore --source`, `merge -X\|-s ours\|theirs`, `git show <ref>:<arquivo> > <arquivo>` | `deny` |
| `block-destructive-merge.js` | `checkout -- <arquivo>`, `restore <arquivo>`, `reset --hard`, `clean -f`, `merge\|rebase\|cherry-pick --abort` | `ask` |
| `block-ai-signature.js` | rodapé de atribuição de IA, link do site da ferramenta ou emoji do robô em comando, arquivo gravado ou entrada de ferramenta MCP | `deny` |
| `block-ai-signature.js` | qualquer emoji em comando que publica (`gh pr/api/issue/release`, `git commit/notes`), no `HISTORY.md` ou em ferramenta MCP que escreve | `deny` |

- A busca é por segmento de comando, sem atravessar `|`, `;` e `&`: `grep -rn "checkout --ours" .` passa. Falso
  positivo conhecido: `echo git commit de exemplo` pergunta (está no teste).
- O `block-ai-signature.js` isenta arquivos dentro de uma pasta `.claude/` e o `CLAUDE.md`, para a regra poder
  ser documentada e o hook mantido. Fora disso, ele barra até a cópia do próprio hook: por isso esta cópia descreve
  o rodapé sem citá-lo, e a suíte de teste dele (cujos casos contêm o rodapé) fica só ao lado do hook instalado,
  em `~/.claude/hooks/`.
- As três travas podem ficar no usuário (valem em todo projeto, como em `claude-code/settings.json`) ou no
  `.claude/settings.json` de um projeto, com `node "$CLAUDE_PROJECT_DIR/.claude/hooks/<hook>.js"`. Registradas nos
  dois lugares, disparam duas vezes.
- Para testar uma trava à mão, mande o JSON pela entrada padrão:

  ```bash
  echo '{"tool_name":"Bash","tool_input":{"command":"git push"}}' | node ~/.claude/hooks/block-git-commit-push.js
  ```

## Regras globais (CLAUDE.md)

`claude-code/CLAUDE.user.md` traz as regras que valem em todo projeto: sem rodapé de IA nem emoji, commit e push
só com "yes", conflito resolvido trecho a trecho. Cada regra que importa tem par: o `CLAUDE.md` diz o que fazer e
o hook garante quando a regra é esquecida.

Formato de regra nova: o que fazer, e **Motivo:** o incidente que a criou, em uma linha.

## Padrão opcional: lembrete por endereço

Para projeto com base de conhecimento que deve ser lida antes do código. Dois hooks de uma linha no
`.claude/settings.json` do projeto, sem script:

- `SessionStart` com matcher `startup|resume|clear|compact` imprime a regra. O `compact` faz a regra voltar
  depois de o contexto ser resumido.
- `PreToolUse` em `Read|Grep|Bash|PowerShell` (e outro em `Glob`) procura o nome dos repos do produto no campo de
  endereço da chamada e, só se achar, injeta o lembrete como `additionalContext`. Olha o endereço (`file_path`,
  `path`, `command`; no Glob, `path` e `pattern`), nunca o termo buscado.

```json
"SessionStart": [{ "matcher": "startup|resume|clear|compact", "hooks": [{ "type": "command", "shell": "bash",
  "command": "printf '%s\\n' '<regra: base antes de codigo>'" }] }],
"PreToolUse": [{ "matcher": "Read|Grep|Bash|PowerShell", "hooks": [{ "type": "command", "shell": "bash",
  "command": "grep -qiE '\"(file_path|path|command)\"[[:space:]]*:[[:space:]]*\"([^\"]|\\\\\")*(<repo-back>|<repo-front>)' && printf '%s' '{\"hookSpecificOutput\":{\"hookEventName\":\"PreToolUse\",\"additionalContext\":\"<lembrete>\"}}'; exit 0" }] }]
```

## Skills de terceiros

- `i-have-adhd` (github.com/ayghri/i-have-adhd) e `ponytail` (github.com/DietrichGebert/ponytail), copiadas à mão
  para `~/.claude/skills/`. O `ponytail` também fica em `~/.claude/ponytail/{hooks,skills}`, no layout do plugin:
  o hook dele procura a skill em `../skills/`, e separar as pastas quebra.
- O `i-have-adhd` tem `disable-model-invocation: true`: só entra digitando `/i-have-adhd` na sessão.
- Com a CLI instalada, os dois também podem vir pelo `/plugin`.

## Armadilhas

- **No Windows, `commands/claude.md` também é o `CLAUDE.md` da pasta.** O sistema de arquivos não diferencia
  maiúsculas, e o Claude Code carrega o `CLAUDE.md` da pasta do arquivo que lê. Ao ler um arquivo de
  `.claude/commands/`, o comando `/claude` inteiro entrou como instrução da pasta (visto em 21/10/2026).
- O modo automático nega Write e Edit no `~/.claude/settings.json`: a edição é do usuário.
- `remoteControlAtStartup` só liga no escopo do usuário; projeto e local só conseguem desligar.
