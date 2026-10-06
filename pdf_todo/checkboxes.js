// Põe checkboxes clicáveis (AcroForm) em cima dos checkboxes que o Chromium desenhou
// no PDF exportado pelo Markdown Extended. O estado inicial (marcado ou não) vem do .md.
// Uso: node checkboxes.js <pasta> <prefixo do arquivo>   (ex.: node checkboxes.js "C:/minha/pasta" "Tarefas")
const fs = require('fs');
const path = require('path');
const pdfjs = require('pdfjs-dist/legacy/build/pdf.js');
const { PDFDocument, rgb } = require('pdf-lib');

const pasta = process.argv[2];
const prefixo = process.argv[3];
const md = fs.readdirSync(pasta).find((n) => n.startsWith(prefixo) && n.endsWith('.md'));
const pdfIn = path.join(pasta, md.replace(/\.md$/, '.pdf'));
const pdfOut = path.join(pasta, md.replace(/\.md$/, ' (chromium + checkboxes).pdf'));

// Estado de cada item de lista de tarefa, na ordem do .md.
const marcados = fs.readFileSync(path.join(pasta, md), 'utf8')
  .split(/\r?\n/)
  .filter((l) => /^\s*[-*] \[( |x|X)\]/.test(l))
  .map((l) => /\[(x|X)\]/.test(l));

const mult = (m, n) => [
  m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1],
  m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3],
  m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5],
];
const ponto = (m, x, y) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];

// Acha, numa página, os quadrados do tamanho de um checkbox (6 a 14 pt) desenhados como caminho.
async function quadrados(pagina, numero) {
  const ops = await pagina.getOperatorList();
  const { OPS } = pdfjs;
  let ctm = [1, 0, 0, 1, 0, 0];
  const pilha = [];
  const achados = [];
  ops.fnArray.forEach((fn, i) => {
    const args = ops.argsArray[i];
    if (fn === OPS.save) pilha.push(ctm);
    else if (fn === OPS.restore) ctm = pilha.pop() || ctm;
    else if (fn === OPS.transform) ctm = mult(ctm, args);
    else if (fn === OPS.constructPath && args[2]) {
      const [x0, x1, y0, y1] = args[2]; // o pdf.js guarda o minMax como [minX, maxX, minY, maxY]
      const cantos = [ponto(ctm, x0, y0), ponto(ctm, x1, y0), ponto(ctm, x0, y1), ponto(ctm, x1, y1)];
      const xs = cantos.map((c) => c[0]);
      const ys = cantos.map((c) => c[1]);
      const box = { pagina: numero, x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
      if (box.w >= 6 && box.w <= 14 && Math.abs(box.w - box.h) <= 1) achados.push(box);
    }
  });
  // Um checkbox é desenhado em mais de um caminho (borda, fundo, marca): junta pelo centro e fica com o maior.
  const unicos = [];
  for (const b of achados) {
    const cx = b.x + b.w / 2;
    const cy = b.y + b.h / 2;
    const igual = unicos.find((u) => Math.abs(u.x + u.w / 2 - cx) < 2 && Math.abs(u.y + u.h / 2 - cy) < 2);
    if (!igual) unicos.push(b);
    else if (b.w > igual.w) Object.assign(igual, b);
  }
  return unicos.sort((a, b) => (b.y - a.y) || (a.x - b.x));
}

(async () => {
  const bytes = fs.readFileSync(pdfIn);
  const leitura = await pdfjs.getDocument({ data: new Uint8Array(bytes), verbosity: 0 }).promise;
  let caixas = [];
  for (let n = 1; n <= leitura.numPages; n++) {
    caixas = caixas.concat(await quadrados(await leitura.getPage(n), n));
  }
  console.log(`checkboxes desenhados: ${caixas.length} | itens no .md: ${marcados.length}`);

  const doc = await PDFDocument.load(bytes);
  const form = doc.getForm();
  caixas.forEach((c, i) => {
    const cb = form.createCheckBox(`item_${String(i + 1).padStart(2, '0')}`);
    const folga = 1; // cobre a borda antialiasada do desenho de baixo
    cb.addToPage(doc.getPage(c.pagina - 1), {
      x: c.x - folga, y: c.y - folga, width: c.w + 2 * folga, height: c.h + 2 * folga,
      backgroundColor: rgb(1, 1, 1), borderColor: rgb(0.45, 0.49, 0.55), borderWidth: 1, textColor: rgb(0.1, 0.36, 0.86),
    });
    if (marcados[i]) cb.check();
  });
  fs.writeFileSync(pdfOut, await doc.save());
  console.log(`salvo: ${pdfOut}`);
})().catch((e) => { console.error(e); process.exit(1); });
