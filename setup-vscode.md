# Setup do VS Code para Markdown: extensões, configurações e PDF com checkboxes

Retrato da máquina em 06/10/2026: VS Code 1.140.0, Node v25.8.1, npm 11.11.0, Windows 11.

## Extensões de Markdown (7)

| Extensão | ID | Versão | Para que serve |
| --- | --- | --- | --- |
| Markdown Extended | `jebbs.markdown-extended` | 1.1.5 | Sintaxes extras no markdown e exportação para PDF/HTML/PNG (Export to File) |
| GitHub Markdown Preview | `bierner.github-markdown-preview` | 0.4.0 | Pacote: deixa o preview igual ao do GitHub e instala as 4 abaixo |
| Markdown Preview Github Styling | `bierner.markdown-preview-github-styles` | 2.2.0 | Estilo do GitHub no preview |
| Markdown Checkboxes | `bierner.markdown-checkbox` | 0.4.0 | Mostra `- [ ]` e `- [x]` como checkbox no preview |
| Markdown Emoji | `bierner.markdown-emoji` | 0.3.1 | Sintaxe `:emoji:` no preview |
| Markdown Footnotes | `bierner.markdown-footnotes` | 0.1.1 | Notas de rodapé `[^nota]` no preview |
| Markdown Interactive Checkbox | `behnam.md-checkbox` | 1.0.2 | Checkbox clicável no preview, que marca o item no `.md` |

## Instalar numa máquina nova

### 1. Extensões

Com o VS Code instalado, rode no terminal (as versões ficam fixas; tire o `@versão` para pegar a mais nova):

```bash
code --install-extension jebbs.markdown-extended@1.1.5
code --install-extension bierner.github-markdown-preview@0.4.0
code --install-extension bierner.markdown-preview-github-styles@2.2.0
code --install-extension bierner.markdown-checkbox@0.4.0
code --install-extension bierner.markdown-emoji@0.3.1
code --install-extension bierner.markdown-footnotes@0.1.1
code --install-extension behnam.md-checkbox@1.0.2
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

`%APPDATA%\Code\User\settings.json` (Ctrl+Shift+P, "Preferences: Open User Settings (JSON)"):

```json
"markdown-preview-github-styles.colorTheme": "light"
```

### 4. Atalhos (keybindings.json)

| Atalho | O que faz | Onde vale |
| --- | --- | --- |
| `Ctrl+Alt+V` | Abre o preview ao lado | Editor de markdown |
| `Ctrl+Shift+E` | Exporta o arquivo (Export to File) | Editor de markdown |
| `Ctrl+Shift+E` | Abre o `.md` no lugar do preview e exporta | Preview |
| `Ctrl+E` | Abre o Explorer, que saiu do `Ctrl+Shift+E` | Qualquer lugar |
| `Alt+V` | Ditado no editor, que saiu do `Ctrl+Alt+V` | Editor |

Os padrões do VS Code continuam valendo: `Ctrl+Shift+V` abre o preview no lugar do editor e `Ctrl+K V` abre ao lado.

`%APPDATA%\Code\User\keybindings.json` (Ctrl+Shift+P, "Preferences: Open Keyboard Shortcuts (JSON)"). Os 8 itens abaixo vão juntos: 3 são os atalhos de markdown e 5 tiram ou mudam os padrões que ocupavam essas teclas.

```json
{
    "key": "alt+v",
    "command": "workbench.action.editorDictation.start",
    "when": "editorDictation.inProgress && hasSpeechProvider && !editorReadonly || hasSpeechProvider && !editorReadonly && !speechToTextInProgress || chatIsEnabled && chatSpeechToTextConfigured && editorDictation.inProgress && !editorReadonly || chatIsEnabled && chatSpeechToTextConfigured && !editorReadonly && !speechToTextInProgress"
},
{
    "key": "ctrl+alt+v",
    "command": "-workbench.action.editorDictation.start",
    "when": "editorDictation.inProgress && hasSpeechProvider && !editorReadonly || hasSpeechProvider && !editorReadonly && !speechToTextInProgress || chatIsEnabled && chatSpeechToTextConfigured && editorDictation.inProgress && !editorReadonly || chatIsEnabled && chatSpeechToTextConfigured && !editorReadonly && !speechToTextInProgress"
},
{
    "key": "ctrl+alt+v",
    "command": "markdown.showPreviewToSide",
    "when": "editorFocus && !notebookEditorFocused && editorLangId =~ /^(markdown|prompt|instructions|chatagent|skill)$/"
},
{
    "key": "ctrl+shift+e",
    "command": "markdownExtended.export",
    "when": "editorTextFocus && !notebookEditorFocused && editorLangId =~ /^(markdown|prompt|instructions|chatagent|skill)$/"
},
{
    "key": "ctrl+shift+e",
    "command": "runCommands",
    "args": {
        "commands": [
            "markdown.showSource",
            "markdownExtended.export"
        ]
    },
    "when": "!terminalFocus && activeCustomEditorId == 'vscode.markdown.preview.editor'"
},
{
    "key": "ctrl+e",
    "command": "-workbench.action.quickOpen"
},
{
    "key": "ctrl+e",
    "command": "workbench.view.explorer",
    "when": "viewContainer.workbench.view.explorer.enabled"
},
{
    "key": "ctrl+shift+e",
    "command": "-workbench.view.explorer",
    "when": "viewContainer.workbench.view.explorer.enabled"
}
```

- O `Ctrl+E` deixa de abrir o Quick Open, que continua no `Ctrl+P`.
- No editor, o `Ctrl+Shift+E` exige o cursor no texto do `.md`. O painel Output e as células de notebook ficam de fora.
- No preview, o `Ctrl+Shift+E` usa o `runCommands`, que já vem no VS Code: abre o `.md` (`markdown.showSource`) e depois exporta. O preview dá lugar ao `.md`.
- O atalho do preview abre o `.md` antes porque o Export to File, chamado direto do preview, não acha o arquivo. Sem o `.md` como editor ativo, a extensão pega o primeiro editor de texto visível. Se for o painel Output, o erro é "please save file before export: extension-output-..."; se não houver nenhum, é "No document found."
- As extensões de markdown instaladas não trazem atalhos próprios.

### 5. Segurança do preview (Markdown Interactive Checkbox)

Para o checkbox do preview funcionar no clique, o preview precisa aceitar conteúdo local: Ctrl+Shift+P, "Markdown: Change Preview Security Settings", "Allow insecure local content". A opção marcada aparece com "•" na frente.

- A opção não fica no `settings.json`, então tem de ser feita à mão em cada máquina.
- Ela vale por pasta: a do workspace, ou a do próprio arquivo quando ele está fora de um workspace. Um `.md` aberto de outra pasta volta ao padrão "Strict".
- Com "Strict", o preview mostra "Some content has been disabled in this document" e o checkbox para de responder ao clique. Clicar nesse aviso abre a mesma lista de opções.

## Exportar para PDF

`Ctrl+Shift+E` no `.md` ou no preview (Export to File, PDF). Para um `.md` fora do workspace aberto, o PDF sai ao lado dele, com o mesmo nome. Para um `.md` dentro do workspace, sai em `<workspace>\out\<mesma subpasta>`.

Os checkboxes desse PDF saem só desenhados, sem clique. A abordagem para torná-los clicáveis está em `pdf-checkboxes.md`, nesta pasta.
