# Atalhos: VS Code e Claude Code (Windows)

Retrato de 21/10/2026: VS Code 1.142.0 e Claude Code 2.1.306 (extensão), Windows 11. No macOS, Ctrl vira Cmd e
Alt vira Option.

- **Seção 1** são os atalhos pessoais (o `vscode/keybindings.json` deste repo).
- **Seção 2** são padrões do VS Code que valem a pena decorar.
- **Seções 3 a 5** são do Claude Code: extensão, terminal e app desktop.

A lista completa do VS Code está no PDF oficial: https://code.visualstudio.com/shortcuts/keyboard-shortcuts-windows.pdf
(e em Ctrl+Alt+K, que aqui abre o editor de atalhos).

## 1. Atalhos pessoais

| Atalho | O que faz | Onde vale | Padrão que sai |
| --- | --- | --- | --- |
| `Ctrl+E` | Abre o Explorer | Qualquer lugar | Quick Open (continua no `Ctrl+P`) |
| `Ctrl+Shift+E` | Exporta o `.md` (Markdown Extended, Export to File) | Editor de markdown | Explorer (foi para o `Ctrl+E`) |
| `Ctrl+Shift+E` | Abre o `.md` no lugar do preview e exporta | Preview de markdown | |
| `Ctrl+Shift+V` | Alterna preview e `.md` no mesmo lugar, e devolve o foco ao editor | Editor de markdown e preview | Abrir preview (sem a volta e sem o foco) |
| `Ctrl+Alt+V` | Abre o preview ao lado | Editor de markdown | Ditado no editor (foi para o `Alt+V`) |
| `Alt+V` | Ditado no editor | Editor | |
| `Ctrl+Alt+T` | Move o editor para uma janela nova | Qualquer editor | |
| `Ctrl+Shift+T` | Copia o editor para uma janela nova | Com editor ativo, fora do merge editor | Reabrir aba fechada (só vale sem editor ativo) |
| `Ctrl+Shift+T` | Alterna entre os dois lados | Merge editor | |
| `Ctrl+Shift+T` `Ctrl+Shift+T` | Copia o editor para uma janela nova | Merge editor | |
| `Ctrl+Alt+K` | Abre o editor de atalhos | Qualquer lugar | `Ctrl+K Ctrl+S` (removido) e o "insert @-mentioned" do Claude Code |
| `Ctrl+Alt+O` | Nada: só libera a tecla | Qualquer lugar | Menu Remote |

- "Editor de markdown" inclui os arquivos de prompt, instructions, chatagent e skill, que o VS Code trata como
  markdown.
- No preview, o `Ctrl+Shift+E` abre o `.md` antes de exportar porque o Export to File, chamado do preview, não
  acha o arquivo (detalhe em `setup-vscode.md`).
- O `Ctrl+Shift+T` pessoal também vence o "reabrir sessão do Claude fechada" da extensão quando há editor ativo
  (seção 3): atalho do usuário tem precedência sobre o da extensão.

## 2. VS Code: padrões úteis

Os marcados com * foram trocados aqui (seção 1).

**Geral**

| Atalho | O que faz |
| --- | --- |
| `Ctrl+Shift+P` ou `F1` | Paleta de comandos |
| `Ctrl+P` | Abrir arquivo pelo nome (com `:` vai para a linha; com `@`, para o símbolo) |
| `Ctrl+R` | Abrir recente |
| `Ctrl+,` | Configurações |
| `Ctrl+K Ctrl+S` * | Editor de atalhos (aqui: `Ctrl+Alt+K`) |
| `Ctrl+Shift+N` | Janela nova |
| `Ctrl+K Ctrl+T` | Tema de cor |
| `Ctrl+=` / `Ctrl+-` | Zoom |

**Painéis**

| Atalho | O que faz |
| --- | --- |
| `Ctrl+B` | Mostra/esconde a barra lateral |
| `Ctrl+J` | Mostra/esconde o painel de baixo |
| `Ctrl+Shift+E` * | Explorer (aqui: `Ctrl+E`) |
| `Ctrl+Shift+F` / `Ctrl+Shift+H` | Buscar / substituir em todos os arquivos |
| `Ctrl+Shift+G` | Source Control |
| `Ctrl+Shift+X` | Extensões |
| `Ctrl+Shift+M` | Problems |
| `Ctrl+Shift+U` | Output |
| `Ctrl+K Z` | Zen mode (`Esc Esc` sai) |

**Editores e navegação**

| Atalho | O que faz |
| --- | --- |
| `Ctrl+Tab` | Alterna entre os editores abertos |
| `Ctrl+PageDown` / `Ctrl+PageUp` | Próximo / anterior editor |
| `Ctrl+W` | Fecha o editor |
| `Ctrl+K Ctrl+W` | Fecha todos os editores |
| `Ctrl+Shift+T` * | Reabre o editor fechado (aqui: só sem editor ativo) |
| `Ctrl+\` | Divide o editor |
| `Ctrl+1` / `Ctrl+2` / `Ctrl+3` | Foca o grupo de editores |
| `Alt+Left` / `Alt+Right` | Volta / avança na navegação |
| `Ctrl+G` | Vai para a linha |
| `Ctrl+Shift+O` | Vai para um símbolo do arquivo |
| `Ctrl+T` | Vai para um símbolo do workspace |
| `F12` / `Alt+F12` | Vai para a definição / espia a definição |
| `Shift+F12` | Referências |
| `F8` / `Shift+F8` | Próximo / anterior problema |
| `Ctrl+K P` | Copia o caminho do arquivo ativo |
| `Ctrl+K R` | Mostra o arquivo ativo no Explorer do Windows |

**Edição**

| Atalho | O que faz |
| --- | --- |
| `Alt+Up` / `Alt+Down` | Move a linha |
| `Shift+Alt+Up` / `Shift+Alt+Down` | Duplica a linha |
| `Ctrl+Shift+K` | Apaga a linha |
| `Ctrl+Enter` / `Ctrl+Shift+Enter` | Linha nova abaixo / acima, de qualquer ponto da linha |
| `Ctrl+/` | Comenta/descomenta a linha |
| `Shift+Alt+A` | Comentário de bloco |
| `Shift+Alt+F` | Formata o documento |
| `Ctrl+K Ctrl+F` | Formata a seleção |
| `Ctrl+]` / `Ctrl+[` | Indenta / desindenta |
| `Ctrl+Shift+[` / `Ctrl+Shift+]` | Dobra / desdobra o bloco |
| `Ctrl+K Ctrl+0` / `Ctrl+K Ctrl+J` | Dobra tudo / desdobra tudo |
| `Ctrl+Shift+\` | Vai para o par do colchete |
| `F2` | Renomeia o símbolo em todo o projeto |
| `Ctrl+.` | Quick fix |
| `Ctrl+Space` | Sugestões |
| `Ctrl+K Ctrl+X` | Apaga espaço sobrando no fim das linhas |

**Seleção e multicursor**

| Atalho | O que faz |
| --- | --- |
| `Ctrl+D` | Seleciona a próxima ocorrência (repita para somar) |
| `Ctrl+Shift+L` | Seleciona todas as ocorrências da seleção |
| `Ctrl+F2` | Seleciona todas as ocorrências da palavra |
| `Alt+clique` | Cursor extra |
| `Ctrl+Alt+Up` / `Ctrl+Alt+Down` | Cursor extra acima / abaixo |
| `Shift+Alt+I` | Um cursor no fim de cada linha selecionada |
| `Shift+Alt+arrastar` | Seleção em coluna |
| `Ctrl+L` | Seleciona a linha (repita para somar) |
| `Shift+Alt+Right` / `Shift+Alt+Left` | Expande / encolhe a seleção |
| `Ctrl+U` | Desfaz o último movimento de cursor |

**Busca no arquivo**

| Atalho | O que faz |
| --- | --- |
| `Ctrl+F` / `Ctrl+H` | Buscar / substituir |
| `F3` / `Shift+F3` | Próxima / anterior |
| `Alt+Enter` | Seleciona todas as ocorrências da busca |

**Terminal**

| Atalho | O que faz |
| --- | --- |
| `` Ctrl+` `` | Mostra/esconde o terminal |
| ``Ctrl+Shift+` `` | Terminal novo |
| `Ctrl+Shift+5` | Divide o terminal |
| `Ctrl+Shift+C` | Abre um terminal externo na pasta |

**Debug**

| Atalho | O que faz |
| --- | --- |
| `F5` / `Shift+F5` | Inicia / para |
| `F9` | Breakpoint |
| `F10` / `F11` / `Shift+F11` | Passa por cima / entra / sai |

**Markdown**

| Atalho | O que faz |
| --- | --- |
| `Ctrl+K V` | Preview ao lado (aqui também `Ctrl+Alt+V`) |
| `Ctrl+Shift+V` * | Preview no lugar (aqui: alterna e devolve o foco) |

## 3. Claude Code: extensão do VS Code

Conferido no `package.json` da extensão instalada, com o comportamento descrito na documentação.

| Atalho | O que faz | Quando vale |
| --- | --- | --- |
| `Ctrl+Esc` | Foca o painel do Claude; de novo, volta ao editor | Painel no modo padrão (não terminal) |
| `Ctrl+Shift+Esc` | Abre uma conversa nova numa aba do editor | Idem |
| `Alt+K` | Insere a @-menção do arquivo e das linhas selecionadas (`@arquivo.ts#5-10`) | Editor com foco |
| `Ctrl+Alt+K` | "Insert @-mentioned" (versão antiga do anterior) | Removido aqui: a tecla abre o editor de atalhos |
| `Ctrl+N` | Conversa nova | Só com `claudeCode.enableNewConversationShortcut` ligado e o painel com foco |
| `Ctrl+Alt+F` | Focus view: esconde chamadas de ferramenta, resultados e raciocínio | Painel do Claude |
| `Ctrl+Shift+T` | Reabre a última aba de sessão fechada | Com `enableReopenClosedSessionShortcut` (padrão ligado); o pessoal vence com editor ativo |
| `Esc` | Encerra a vez atual do Claude | Prompt do painel |
| `Shift+Enter` | Linha nova sem enviar | Prompt do painel |
| `Ctrl+O` | Expande/recolhe os blocos de raciocínio | Painel do Claude |

- Sem atalho, pela paleta (`Ctrl+Shift+P`, "Claude Code"): abrir na barra lateral, no terminal ou em janela
  nova, aceitar/rejeitar a mudança no cursor, renomear a aba da sessão.
- Modo de permissão: clique no indicador embaixo do prompt.
- Anexar arquivo: arraste para o prompt segurando Shift.
- Não confirmado: `Ctrl+Esc` e `Ctrl+Shift+Esc` são também atalhos do Windows (menu Iniciar e Gerenciador de
  Tarefas). Se não responderem, o Windows pegou a tecla antes; troque pelo editor de atalhos ("Claude Code").

## 4. Claude Code no terminal (CLI)

Da documentação oficial (interactive-mode, keybindings, terminal-config). Os marcados com **(vN)** exigem essa
versão ou mais nova.

| Atalho | O que faz |
| --- | --- |
| `Esc` | Interrompe a resposta; o que já foi feito fica |
| `Esc` `Esc` (prompt vazio) | Menu de rewind: volta código e/ou conversa a um prompt anterior (o mesmo que `/rewind`) |
| `Esc` `Esc` (prompt com texto) | Limpa o prompt e guarda o rascunho no histórico (`Up` recupera) |
| `Ctrl+C` | Interrompe; com nada rodando, limpa o prompt e, na segunda, sai |
| `Ctrl+D` | Sai (duas vezes em até 800 ms) |
| `Shift+Tab` | Cicla o modo de permissão (manual, acceptEdits, plan; auto e bypass quando habilitados) |
| `Alt+M` | O mesmo, no Windows, quando o `Shift+Tab` não chega |
| `Enter` | Envia; com o Claude trabalhando, entra na fila |
| `Ctrl+J`, `\`+`Enter` ou `Shift+Enter` | Linha nova (`Shift+Enter` no terminal do VS Code pede `/terminal-setup` uma vez) |
| `Ctrl+X Ctrl+S` ou `Ctrl+Enter` | Envia já a fila e o rascunho **(v2.1.275)** |
| `Ctrl+G` ou `Ctrl+X Ctrl+E` | Edita o prompt no editor padrão |
| `Up` / `Down` | Histórico de prompts (por pasta) |
| `Ctrl+R` | Busca no histórico |
| `Alt+V` | Cola imagem da área de transferência (no Windows; `Ctrl+V` nos outros) |
| `Ctrl+S` | Guarda o prompt e limpa; com o prompt vazio, devolve |
| `Ctrl+B` | Manda o comando ou agente para segundo plano |
| `Ctrl+O` | Transcript detalhado (ferramentas, horários, modelo) |
| `Ctrl+T` | Lista de tarefas do Claude |
| `Ctrl+X Ctrl+K` | Para todos os subagentes em segundo plano (duas vezes em 3 s) |
| `Alt+P` | Troca de modelo sem perder o prompt |
| `Alt+T` | Liga/desliga extended thinking |
| `Alt+O` | Liga/desliga fast mode |
| `Ctrl+L` | Redesenha a tela |
| `Ctrl+_` | Desfaz a última edição do prompt |
| `Ctrl+U` / `Ctrl+K` / `Ctrl+W` / `Ctrl+Y` | Apaga até o início / até o fim / a palavra; cola o que apagou |
| `?` (prompt vazio) | Mostra os atalhos |

Prefixos no início do prompt: `/` comando ou skill; `!` modo shell (roda o comando e a saída entra na conversa);
`@` caminho de arquivo (e, com letras depois, as outras sessões da máquina).

- No Windows não existe `Ctrl+Z` (suspender é só Unix).
- Se cada Backspace apagar uma palavra inteira, defina `CLAUDE_CODE_BS_AS_CTRL_BACKSPACE=0`.
- O `/terminal-setup` também desliga `terminal.integrated.gpuAcceleration` no VS Code; para desfazer, volte para
  `"auto"`.
- O atalho `#` para memória não aparece na documentação atual: use `/memory`, ou peça "lembre que...".

## 5. Claude Code: app desktop (aba Code)

Da documentação (seção "Keyboard shortcuts" do desktop), já convertidos para Windows. `Ctrl+/` mostra a lista no
próprio app.

| Atalho | O que faz |
| --- | --- |
| `Ctrl+N` / `Ctrl+W` | Sessão nova / fecha a sessão |
| `Ctrl+Tab` / `Ctrl+Shift+Tab` | Próxima / anterior sessão |
| `Esc` | Para a resposta |
| `Ctrl+Shift+D` | Painel de diff |
| `Ctrl+Shift+B` | Painel do navegador |
| `` Ctrl+` `` | Painel de terminal |
| `Ctrl+\` | Fecha o painel em foco |
| `Ctrl+;` | Chat lateral (ou `/btw`) |
| `Ctrl+O` | Modo de visualização (na CLI, o mesmo atalho abre o transcript) |
| `Ctrl+Shift+M` | Menu do modo de permissão (no app, `Shift+Tab` não cicla) |
| `Ctrl+Shift+I` | Menu de modelo |
| `Ctrl+Shift+E` | Menu de esforço |

Não confirmado: a doc também lista `Ctrl+Shift+]` / `Ctrl+Shift+[` para trocar de sessão. Teste antes de contar
com eles.

## Personalizar

- **VS Code:** `Ctrl+Alt+K` (aqui) abre o editor; o arquivo é `%APPDATA%\Code\User\keybindings.json`. Para tirar
  um padrão, a entrada leva `-` antes do comando (ver `vscode/keybindings.json`).
- **Claude Code (CLI):** `/keybindings` cria e abre `~/.claude/keybindings.json`; vale sem reiniciar. Cada bloco
  tem um `context` (`Chat`, `Global`, `Confirmation`...) e os pares tecla → ação; `null` desliga um padrão.
  `Ctrl+C`, `Ctrl+D`, `Ctrl+M`, `Ctrl+[`, `Ctrl+I` e `Ctrl+H` não podem ser remapeados. `claude --debug` mostra os
  erros do arquivo. Não está documentado se ele vale para a extensão e o app.

```json
{
  "$schema": "https://www.schemastore.org/claude-code-keybindings.json",
  "bindings": [
    { "context": "Chat", "bindings": { "ctrl+e": "chat:externalEditor", "ctrl+s": null } }
  ]
}
```

## Fontes

- https://code.claude.com/docs/en/interactive-mode
- https://code.claude.com/docs/en/keybindings
- https://code.claude.com/docs/en/terminal-config
- https://code.claude.com/docs/en/vs-code
- https://code.claude.com/docs/en/desktop
- `package.json` da extensão `anthropic.claude-code` 2.1.306 (`contributes.keybindings`)
