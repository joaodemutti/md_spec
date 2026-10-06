# PDF com checkboxes clicáveis a partir do Markdown

Status: script em verificação.

## O problema

O Export to File do Markdown Extended gera o PDF imprimindo o preview pelo Chromium (puppeteer). O Chromium não grava campo de formulário em PDF: o checkbox do `- [ ]` sai como desenho em vetor, sem nada para clicar. Nenhuma configuração da extensão muda isso.

## A abordagem

Exportar normalmente e, depois, abrir o PDF e colocar um checkbox de formulário (AcroForm) em cima de cada checkbox desenhado.

1. **Exportar:** Export to File gera o PDF do `.md` (Chromium).
2. **Achar os checkboxes:** o script lê as operações de desenho de cada página com o `pdfjs-dist` e separa os caminhos quadrados de 6 a 14 pt. Um checkbox é desenhado em mais de um caminho (borda, fundo, marca), então os caminhos com o mesmo centro viram um só.
3. **Casar com o `.md`:** a ordem dos checkboxes na página (de cima para baixo) é a mesma ordem dos itens `- [ ]`/`- [x]` no `.md`. É de lá que sai o estado inicial, marcado ou não.
4. **Pôr o campo clicável:** com o `pdf-lib`, cada checkbox ganha um campo AcroForm um pouco maior que o desenho, com fundo branco, para cobrir o de baixo. Assim, desmarcar no PDF não deixa aparecendo o desenho marcado.
5. **Salvar** como `<nome> (chromium + checkboxes).pdf`, ao lado do original.

## Onde está e como rodar

Pasta `pdf_todo/`, ao lado deste arquivo:

- `checkboxes.js`: o script.
- `package.json` e `package-lock.json`: as dependências, fixas em `pdf-lib` 1.17.1 e `pdfjs-dist` 3.11.174.
- `.gitignore`: deixa o `node_modules` fora do repositório.

Precisa do Node instalado. Depois de clonar, instale as dependências uma vez, dentro de `pdf_todo/`:

```bash
npm install
```

Outra opção é copiar a pasta `pdf_todo` inteira, com o `node_modules`, de uma máquina onde ela já funciona. As dependências são todas JavaScript puro, sem módulo compilado, então funcionam copiadas.

Para rodar:

```bash
node checkboxes.js "C:/minha/pasta" "Tarefas"
```

O primeiro argumento é a pasta onde ficam o `.md` e o PDF exportado. O segundo é o começo do nome do arquivo: `"Tarefas"` acha `Tarefas da semana.md` e `Tarefas da semana.pdf`.

## Limites

- **A ordem precisa bater.** Se o `.md` mudou depois do export, o script casa o checkbox errado com o item. Exporte de novo antes de rodar.
- **Mesma pasta.** O script procura o `.md` e o PDF juntos. Um `.md` de dentro de um workspace aberto é exportado para `<workspace>\out\`, e aí é preciso juntar os dois antes.
- **Sobrescreve a saída.** Rodar de novo apaga as marcações salvas no `(chromium + checkboxes).pdf`. Renomeie antes, se já tiver marcado.
- **Depende do desenho do Chromium.** Se uma versão nova da extensão ou do Chromium mudar o tamanho ou o jeito de desenhar o checkbox, o script para de achar as posições. O sinal é a contagem: ele imprime `checkboxes desenhados: N | itens no .md: M`, e os dois números têm de ser iguais.
- **Visual do campo.** O checkbox clicável usa o estilo do `pdf-lib` (borda cinza, marca azul), um pouco diferente do desenho do Chromium.

## Abordagem alternativa testada

Gerar o PDF direto do `.md` com o mPDF (biblioteca PHP), que cria os checkboxes como campos de formulário desde o início. Funciona sem depender do desenho do Chromium, mas o visual é outro, não o do Markdown Extended. Esse caminho não está neste repositório.
