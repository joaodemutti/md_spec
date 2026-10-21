# Setup do VS Code: extensões, configurações, atalhos e markdown

Retrato da máquina em 21/10/2026: VS Code 1.142.0, Node v25.8.1, npm 11.11.0, Windows 11. Os arquivos prontos
estão em `vscode/`; a lista de atalhos, em `atalhos.md`.

## Extensões (21)

`vscode/extensions.txt` tem todas, uma por linha, no formato `id@versão`.

**Claude e IA**

| Extensão | ID | Versão | Para que serve |
| --- | --- | --- | --- |
| Claude Code | `anthropic.claude-code` | 2.1.306 | Claude no painel do VS Code: conversa, diffs, @-menção |
| Codex (ChatGPT) | `openai.chatgpt` | 26.1007.21434 | Agente da OpenAI no editor |
| Codex Audio | `openai.codex-audio` | 26.1007.21434 | Complemento de áudio do Codex |

**Markdown**

| Extensão | ID | Versão | Para que serve |
| --- | --- | --- | --- |
| Markdown Extended | `jebbs.markdown-extended` | 1.1.5 | Sintaxes extras e exportação para PDF/HTML/PNG (Export to File) |
| GitHub Markdown Preview | `bierner.github-markdown-preview` | 0.4.0 | Pacote: deixa o preview igual ao do GitHub e instala as 4 abaixo |
| Markdown Preview Github Styling | `bierner.markdown-preview-github-styles` | 2.2.0 | Estilo do GitHub no preview |
| Markdown Checkboxes | `bierner.markdown-checkbox` | 0.4.0 | Mostra `- [ ]` e `- [x]` como checkbox no preview |
| Markdown Emoji | `bierner.markdown-emoji` | 0.3.1 | Sintaxe `:emoji:` no preview |
| Markdown Footnotes | `bierner.markdown-footnotes` | 0.1.1 | Notas de rodapé `[^nota]` no preview |
| Markdown Interactive Checkbox | `behnam.md-checkbox` | 1.0.2 | Checkbox clicável no preview, que marca o item no `.md` |

**PHP e Laravel**

| Extensão | ID | Versão | Para que serve |
| --- | --- | --- | --- |
| Intelephense | `bmewburn.vscode-intelephense-client` | 1.18.5 | Autocomplete, definição e diagnóstico de PHP |
| PHP Tools | `devsense.phptools-vscode` | 1.75.19379 | Depuração, testes e formatação de PHP (DEVSENSE) |
| PHP IntelliSense | `devsense.intelli-php-vscode` | 0.12.17700 | IntelliSense de PHP (DEVSENSE) |
| Composer | `devsense.composer-php-vscode` | 1.75.19379 | Comandos e `composer.json` (DEVSENSE) |
| PHP Profiler | `devsense.profiler-php-vscode` | 1.75.19379 | Leitura de perfis de execução de PHP (DEVSENSE) |
| Laravel | `laravel.vscode-laravel` | 2.0.1 | Extensão oficial: rotas, views, config e links entre eles |

**Front**

| Extensão | ID | Versão | Para que serve |
| --- | --- | --- | --- |
| Tailwind CSS IntelliSense | `bradlc.vscode-tailwindcss` | 0.16.0 | Autocomplete e preview das classes do Tailwind |
| Path Intellisense | `christian-kohler.path-intellisense` | 2.10.0 | Autocomplete de caminho de arquivo |
| HTML CSS Class Completion | `zignd.html-css-class-completion` | 1.20.0 | Autocomplete de classe CSS no HTML/JSX |

**Git**

| Extensão | ID | Versão | Para que serve |
| --- | --- | --- | --- |
| GitLens | `eamodio.gitlens` | 19.4.0 | Blame, histórico e comparação de commits |
| Git Blame | `solomonkinard.git-blame` | 0.2.128 | Autor e data da linha na barra de status |

## Instalar numa máquina nova

### 1. Extensões

Com o VS Code instalado, na pasta deste repo (as versões ficam fixas):

```powershell
Get-Content vscode\extensions.txt | ForEach-Object { code --install-extension $_ }
```

Para pegar a versão mais nova de cada uma, tire o `@versão`:

```powershell
Get-Content vscode\extensions.txt | ForEach-Object { code --install-extension ($_ -replace '@.*') }
```

Para conferir depois: `code --list-extensions --show-versions`.

### 2. Chromium do Markdown Extended

O Export to File em PDF usa o puppeteer e procura o Chromium da revisão 1108766. Sem ele, o erro é `Could not find Chromium (rev. 1108766)`.

```bash
npm install -g puppeteer@19.8.0
```

O Chromium fica em `%USERPROFILE%\.cache\puppeteer\chrome\win64-1108766\chrome-win\chrome.exe`.

O npm avisa que o puppeteer 19.8.0 está sem suporte. Aqui ele só serve para imprimir arquivos locais.

Alternativa sem baixar o Chromium, não testada aqui: apontar a extensão para o Chrome instalado, no `settings.json`:

```json
"markdownExtended.puppeteerExecutable": "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
```

### 3. settings.json

Copie `vscode/settings.json` para `%APPDATA%\Code\User\settings.json`, ou junte as chaves ao que já existe
(Ctrl+Shift+P, "Preferences: Open User Settings (JSON)"). Troque os `<...>` dos perfis de terminal pelos do
projeto.

| Chave | Valor | O que faz |
| --- | --- | --- |
| `terminal.integrated.profiles.windows` | 4 perfis | BACK (shell no container do back), FRONT (sobe o front), LOG (segue o log do back), OUTPUT (segue a saída do container) |
| `files.autoSave` | `afterDelay` | Salva sozinho depois de uma pausa na digitação |
| `claudeCode.preferredLocation` | `panel` | O Claude Code abre no painel de baixo |
| `git.showActionButton` | commit e publish sim, sync não | Botões do Source Control |
| `terminal.integrated.initialHint` | `false` | Terminal novo sem a dica inicial |
| `workbench.preferredLightColorTheme` | `Visual Studio Light` | Tema quando o sistema está no modo claro |
| `workbench.preferredHighContrastColorTheme` | `Monokai Dimmed` | Tema quando o sistema está em alto contraste |
| `markdown-preview-github-styles.colorTheme` | `light` | Preview do markdown sempre claro |
| `editor.editContext` | `false` | Contorno do painel de emoji e símbolos do Windows (ver abaixo) |

**Painel de emoji e símbolos do Windows (Win+. e Win+V).** Desde a 1.139, com o `editor.editContext` ligado
(o padrão), escolher um emoji ou símbolo no painel do Windows não insere nada no editor; colar com Ctrl+V
funciona. A Microsoft rastreou a causa até um bug do Chromium e prometeu levar a correção para o Electron
([microsoft/vscode#338128](https://github.com/microsoft/vscode/issues/338128); o
[#340466](https://github.com/microsoft/vscode/issues/340466) é o relato com o contorno). Com
`"editor.editContext": false`, o editor volta à entrada antiga e o painel insere de novo, sem reiniciar. Tire a
chave quando a correção chegar a uma versão estável.

Os perfis de terminal abrem já rodando o seu comando. Antes de rodar, cada um grava o comando no histórico do
PSReadLine (`Add-Content (Get-PSReadLineOption).HistorySavePath '<comando>'`): depois de um Ctrl+C, a seta para
cima traz o comando de volta. Exemplo de log num back Laravel: `storage/logs/laravel.log`.

### 4. keybindings.json

Copie `vscode/keybindings.json` para `%APPDATA%\Code\User\keybindings.json` (Ctrl+Shift+P, "Preferences: Open
Keyboard Shortcuts (JSON)"). São 19 entradas: as que começam com `-` tiram um padrão do VS Code para liberar a
tecla, e as outras são os atalhos pessoais. O que cada um faz está em `atalhos.md`, seção 1.

Notas sobre os atalhos de markdown:

- No editor, o `Ctrl+Shift+E` exige o cursor no texto do `.md`. O painel Output e as células de notebook ficam de fora.
- No preview, o `Ctrl+Shift+E` usa o `runCommands`, que já vem no VS Code: abre o `.md` (`markdown.showSource`) e depois exporta. O preview dá lugar ao `.md`.
- O atalho do preview abre o `.md` antes porque o Export to File, chamado direto do preview, não acha o arquivo. Sem o `.md` como editor ativo, a extensão pega o primeiro editor de texto visível. Se for o painel Output, o erro é "please save file before export: extension-output-..."; se não houver nenhum, é "No document found."
- O `Ctrl+Shift+V` também usa o `runCommands`: alterna entre o preview e o `.md` (`markdown.togglePreview`) e devolve o foco ao editor (`workbench.action.focusActiveEditorGroup`), para o teclado seguir funcionando.
- As extensões de markdown instaladas não trazem atalhos próprios.

### 5. Segurança do preview (Markdown Interactive Checkbox)

Para o checkbox do preview funcionar no clique, o preview precisa aceitar conteúdo local: Ctrl+Shift+P, "Markdown: Change Preview Security Settings", "Allow insecure local content". A opção marcada aparece com "•" na frente.

- A opção não fica no `settings.json`, então tem de ser feita à mão em cada máquina.
- Ela vale por pasta: a do workspace, ou a do próprio arquivo quando ele está fora de um workspace. Um `.md` aberto de outra pasta volta ao padrão "Strict".
- Com "Strict", o preview mostra "Some content has been disabled in this document" e o checkbox para de responder ao clique. Clicar nesse aviso abre a mesma lista de opções.

## Exportar para PDF

`Ctrl+Shift+E` no `.md` ou no preview (Export to File, PDF). Para um `.md` fora do workspace aberto, o PDF sai ao lado dele, com o mesmo nome. Para um `.md` dentro do workspace, sai em `<workspace>\out\<mesma subpasta>`.

Os checkboxes desse PDF saem só desenhados, sem clique. A abordagem para torná-los clicáveis está em `pdf-checkboxes.md`, nesta pasta.
