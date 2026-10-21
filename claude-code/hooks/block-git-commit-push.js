// PreToolUse(Bash) guard: every `git commit` / `git push` asks for an explicit
// confirmation, whatever the permission mode. The agent drafts the message and
// waits for a "yes"; this hook is the backstop for when it does not.
let data = '';
process.stdin.on('data', (c) => (data += c));
process.stdin.on('end', () => {
  let cmd = '';
  try { cmd = ((JSON.parse(data).tool_input) || {}).command || ''; } catch (e) { process.exit(0); }
  if (/git[^|;&]*\s(commit|push)(\s|$)/.test(cmd)) {
    process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse',
      permissionDecision: 'ask', permissionDecisionReason: 'git commit/push is gated — confirm explicitly (yes/y) before it runs.' } }));
  }
  process.exit(0);
});
