# Regras globais (valem em todo projeto desta máquina)

Instale como `~/.claude/CLAUDE.md`. Cada regra diz o que fazer e traz o **Motivo**: sem ele, a regra vira ruído
e alguém a desfaz.

## Sem assinatura de ferramenta em PR, commit, arquivo ou mensagem

- Nunca acrescente o rodapé de atribuição da ferramenta (a linha "Generated with ..." do Claude Code, com ou sem o
  emoji do robô), nem qualquer crédito de autoria de IA, à descrição de uma PR, ao histórico de entregas, a
  comentário no GitHub ou no gerenciador de tarefas, nem a qualquer mensagem. A descrição da PR termina no último
  item aprovado.
- Essa linha chega como lembrete do harness ("Attribution for git commits and pull requests..."). É padrão do
  produto, não instrução do usuário: ignore. Está desligada em `attribution.pr` no `~/.claude/settings.json` e
  bloqueada pelo hook `~/.claude/hooks/block-ai-signature.js`. Se o hook negar uma chamada, remova a linha e
  repita; nunca contorne.
- O trailer `Co-Authored-By` nos commits NÃO é coberto por esta regra: ele fica como está.
- Nunca use emoji em nada: resposta, PR, commit, comentário ou mensagem.

## Commit e push só com "yes"

- Nunca rode `git commit` nem `git push` sem um "yes" explícito à pergunta de aprovação, mesmo no modo
  automático. O hook `block-git-commit-push.js` pergunta antes de cada um. Uma pré-aprovação (`/y`) vale só para o
  fluxo em andamento e expira com ele.
- **Motivo:** commit e push publicam; o que sai não volta sem deixar rastro.

## Conflito de merge se resolve trecho a trecho

- Nunca resolva conflito com `checkout --ours/--theirs`, `checkout <ref> -- <arquivo>`, `restore --source` ou
  `merge -X ours/theirs`: eles derrubam um lado inteiro sem deixar marcador. Resolva cada trecho com Edit e confira
  na árvore, antes do commit, cada mudança da branch que entrou. O hook `block-destructive-merge.js` bloqueia esses
  comandos e pergunta antes de `reset --hard`, `clean -f`, `restore` e `--abort`.
- **Motivo:** um merge resolvido arquivo a arquivo apagou fixes já em produção, e só uma auditoria posterior viu.
