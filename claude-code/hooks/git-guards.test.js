// Pipe-tests for block-git-commit-push.js and block-destructive-merge.js: feeds
// synthetic PreToolUse payloads to each hook and checks the decision.
// Run: node git-guards.test.js (from this folder, or with the full path).
'use strict';
const { spawnSync } = require('child_process');
const path = require('path');

const COMMIT = path.join(__dirname, 'block-git-commit-push.js');
const MERGE = path.join(__dirname, 'block-destructive-merge.js');

const cases = [
  [COMMIT, 'git commit', 'git commit -m "fix: x"', 'ask'],
  [COMMIT, 'git push', 'git push origin feat-x', 'ask'],
  [COMMIT, 'git -C <repo> push', 'git -C api push', 'ask'],
  [COMMIT, 'git status', 'git status', 'allow'],
  [COMMIT, 'git log', 'git log --oneline -5', 'allow'],
  [COMMIT, 'echo citando git commit (falso positivo aceito)', 'echo git commit de exemplo', 'ask'],
  [COMMIT, 'git commit entre aspas, colado na aspa (nao casa)', 'echo "git commit"', 'allow'],
  [MERGE, 'checkout --ours', 'git checkout --ours src/a.js', 'deny'],
  [MERGE, 'checkout <ref> -- <arquivo>', 'git checkout main -- src/a.js', 'deny'],
  [MERGE, 'restore --source', 'git restore --source=main src/a.js', 'deny'],
  [MERGE, 'merge -X theirs', 'git merge -X theirs feat-x', 'deny'],
  [MERGE, 'show redirecionado por cima do arquivo', 'git show main:src/a.js > src/a.js', 'deny'],
  [MERGE, 'show sem redirecionar', 'git show main:src/a.js', 'allow'],
  [MERGE, 'checkout -- <arquivo>', 'git checkout -- src/a.js', 'ask'],
  [MERGE, 'reset --hard', 'git reset --hard HEAD~1', 'ask'],
  [MERGE, 'clean -fd', 'git clean -fd', 'ask'],
  [MERGE, 'merge --abort', 'git merge --abort', 'ask'],
  [MERGE, 'checkout -b', 'git checkout -b feat-x', 'allow'],
  [MERGE, 'grep pelo texto (nao e git)', 'grep -rn "checkout --ours" .', 'allow'],
  [MERGE, 'payload invalido', null, 'allow'],
];

let fail = 0;
for (const [hook, name, command, expect] of cases) {
  const stdin = command === null ? 'not json' : JSON.stringify({ tool_name: 'Bash', tool_input: { command } });
  const r = spawnSync('node', [hook], { input: stdin, encoding: 'utf8' });
  const out = r.stdout || '';
  const got = out.includes('"deny"') ? 'deny' : out.includes('"ask"') ? 'ask' : 'allow';
  const ok = got === expect && r.status === 0;
  if (!ok) fail++;
  console.log((ok ? 'PASS' : 'FAIL') + '  ' + path.basename(hook) + '  ' + name + '  -> ' + got);
}
console.log(fail ? fail + ' FALHA(S)' : 'todos os ' + cases.length + ' casos passaram');
process.exit(fail ? 1 : 0);
