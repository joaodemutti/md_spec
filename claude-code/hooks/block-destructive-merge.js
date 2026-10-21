// PreToolUse(Bash|PowerShell) guard: blocks the merge resolutions that drop one
// side of a conflict WITHOUT leaving a marker behind, and gates the working-tree
// destroyers. Enforces the merge protocol: a conflict is resolved hunk by hunk
// with Edit — never by overwriting a whole file with one side.
//
// Origin: a merge resolved file-by-file wiped 7 files of 3 fixes already in
// production. Nothing flagged it; only a later audit caught it.
let data = '';
process.stdin.on('data', (c) => (data += c));
process.stdin.on('end', () => {
  let cmd = '';
  try {
    cmd = ((JSON.parse(data).tool_input) || {}).command || '';
  } catch (e) {
    process.exit(0); // unparseable payload -> stay out of the way
  }

  // Match inside a SINGLE command segment (never across | ; &), so an `echo`
  // or a grep for one of these strings is not flagged. `git\b[^|;&]*?` absorbs
  // `-C <dir>` and friends between `git` and the subcommand.
  const seg = '[^|;&\\n]*';
  const git = `git\\b${seg}?`;
  const rx = (body) => new RegExp(`${git}${body}`);

  // Silently discards one side of a conflict. No escape hatch here on purpose.
  const DENY = [
    [rx(`\\bcheckout\\b${seg}--(ours|theirs)\\b`), 'git checkout --ours/--theirs'],
    [rx(`\\brestore\\b${seg}--(ours|theirs)\\b`), 'git restore --ours/--theirs'],
    [rx(`\\bcheckout\\b\\s+(?!-)[^\\s|;&]+\\s+--\\s+\\S`), 'git checkout <ref> -- <arquivo>'],
    [rx(`\\brestore\\b${seg}(--source[= ]|\\s-s\\s)`), 'git restore --source=<ref>'],
    [rx(`\\bmerge\\b${seg}(-X\\s*|--strategy-option[= ])(ours|theirs)\\b`), 'git merge -X ours/theirs'],
    [rx(`\\bmerge\\b${seg}(-s\\s*|--strategy[= ])(ours|theirs)\\b`), 'git merge -s ours/theirs'],
    // only when redirected onto a file — a plain `git show ref:file` (or piped) is fine.
    [
      rx(`\\bshow\\b${seg}:${seg}`),
      'git show <ref>:<arquivo> redirecionado por cima do arquivo',
      /(?:^|[^0-9&>])>{1,2}\s*(?!\/dev\/null)\S/,
    ],
  ];

  // Destroys work in the tree / throws away a resolution already made. Legit
  // sometimes, so it asks instead of blocking.
  const ASK = [
    [rx(`\\bcheckout\\b\\s+--\\s+\\S`), 'git checkout -- <arquivo> descarta a árvore de trabalho'],
    [rx(`\\brestore\\b\\s+\\S`), 'git restore descarta a árvore de trabalho'],
    [rx(`\\breset\\b${seg}--hard\\b`), 'git reset --hard descarta commits e a árvore'],
    [rx(`\\bclean\\b${seg}-[a-z]*f`), 'git clean -f apaga arquivo não rastreado'],
    [rx(`\\b(merge|rebase|cherry-pick)\\b${seg}--abort\\b`), 'abortar joga fora a resolução já feita'],
  ];

  const emit = (decision, reason) => {
    process.stdout.write(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          permissionDecision: decision,
          permissionDecisionReason: reason,
        },
      })
    );
    process.exit(0);
  };

  for (const [re, label, extra] of DENY) {
    if (re.test(cmd) && (!extra || extra.test(cmd))) {
      emit(
        'deny',
        `BLOQUEADO — ${label}: derruba um lado do conflito sem deixar marcador, e a perda fica ` +
          `invisível para quem revisar depois (foi assim que 3 fixes já em produção sumiram num merge). ` +
          `Resolva hunk a hunk com Edit, seguindo o protocolo de merge do projeto, e verifique cada ` +
          `mudança da branch na árvore antes do commit. Se for mesmo para descartar esse lado inteiro, ` +
          `quem roda o comando é o usuário, no terminal dele.`
      );
    }
  }

  for (const [re, label] of ASK) {
    if (re.test(cmd)) {
      emit('ask', `${label} — sem marcador nenhum. Confirme explicitamente (yes/y) antes de rodar.`);
    }
  }

  process.exit(0);
});
