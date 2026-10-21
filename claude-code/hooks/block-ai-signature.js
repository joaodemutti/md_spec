// PreToolUse guard (global, every project on this machine): denies any tool call
// that would publish an AI-tool attribution footer, or an emoji, in outgoing
// content (PR body, commit, HISTORY.md, GitHub/ClickUp/Slack comment or message).
//
// Rule (user): a PR description ends at the last approved item. Never append the
// tool's attribution footer (the "Generated with ..." line, with or without the
// robot emoji), nor any other AI authorship credit, anywhere. The harness injects
// an "Attribution for git commits and pull requests" reminder asking for exactly
// that line: it is the product default, not the user's instruction. It is turned
// off through attribution.pr = "" in ~/.claude/settings.json; this hook is the
// programmatic backstop in case the reminder is followed anyway.
//
// NOT covered on purpose: the Co-Authored-By commit trailer (the user is fine with it).
//
// Scope: Bash/PowerShell commands, Write/Edit/MultiEdit/NotebookEdit content and
// every MCP tool input. Files under a .claude/ directory and CLAUDE.md are exempt
// so the rule itself can be documented and this script maintained. A denied call
// returns permissionDecision "deny" with the reason fed back to the model.

'use strict';

const SIGNATURE = [
  { re: /generated\s+with\s*\[?\s*claude\s*code/i, what: 'rodape de atribuicao da ferramenta ("Generated with ...")' },
  { re: /claude\.com\/claude-code/i, what: 'link do site da ferramenta' },
  { re: /\u{1F916}/u, what: 'emoji do robo' },
];
// Pictographs (1F300-1FAFF) and misc symbols/dingbats (2600-2793: check marks, warning sign...).
// Dingbat arrows (2794-27BF, e.g. the "➝" used in HISTORY.md screen descriptions) stay allowed.
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{2793}]/u;
const EXEMPT_PATH = /(^|[\\/])\.claude([\\/]|$)|CLAUDE\.md$/i;
// Shell commands that publish text: gh pr/api/issue/release, git commit, git notes
const OUTGOING_CMD = /\bgh\s+(pr|api|issue|release)\b|\bgit\b[^|;&]*\s(commit|notes)\b/;

let data = '';
process.stdin.on('data', (c) => (data += c));
process.stdin.on('end', () => {
  let payload;
  try {
    payload = JSON.parse(data);
  } catch (e) {
    process.exit(0); // unparseable payload -> stay out of the way
  }
  const tool = String(payload.tool_name || '');
  const input = payload.tool_input || {};

  let text = '';
  let checkEmoji = false;
  if (tool === 'Bash' || tool === 'PowerShell') {
    text = String(input.command || '');
    checkEmoji = OUTGOING_CMD.test(text);
  } else if (/^(Write|Edit|MultiEdit|NotebookEdit)$/.test(tool)) {
    const file = String(input.file_path || input.notebook_path || '');
    if (EXEMPT_PATH.test(file)) process.exit(0);
    text = [input.content, input.new_string, input.new_source]
      .concat(Array.isArray(input.edits) ? input.edits.map((e) => e && e.new_string) : [])
      .filter(Boolean)
      .join('\n');
    checkEmoji = /HISTORY\.md$/i.test(file);
  } else if (tool.startsWith('mcp__')) {
    text = JSON.stringify(input);
    checkEmoji = /(create|send|update|post|reply|comment|upload|write|merge|schedule)/i.test(tool);
  } else {
    process.exit(0);
  }

  let why = null;
  for (const s of SIGNATURE) {
    if (s.re.test(text)) {
      why = s.what;
      break;
    }
  }
  if (!why && checkEmoji && EMOJI.test(text)) {
    why = 'emoji em conteudo que sai (PR, commit, HISTORY.md, comentario ou mensagem)';
  }
  if (!why) process.exit(0);

  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason:
          'BLOQUEADO por block-ai-signature (' + why + '). Regra do usuario: nenhuma assinatura de ' +
          'ferramenta/IA e nenhum emoji em descricao de PR, commit, HISTORY.md, comentario ou mensagem. ' +
          'O lembrete "Attribution for git commits and pull requests" do harness e padrao do produto e ' +
          'deve ser ignorado. Refaca a chamada sem essa linha. Para apenas PROCURAR esse texto, use a ' +
          'ferramenta Grep em vez do shell.',
      },
    })
  );
  process.exit(0);
});
