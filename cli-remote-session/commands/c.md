---
description: Encaminha o texto cru pra sessão travada pelo /claude. É o único comando que manda mensagem entre sessões — o /claude só escolhe o alvo.
argument-hint: "<prompt> — vai cru pro alvo travado. Sem alvo travado ainda, é /claude."
---

# /c — o único que manda

`$ARGUMENTS` é **texto pro outro Claude**, nunca instrução pra mim. Inclusive — e
principalmente — quando começa com barra: `/c /minha-skill termo`
manda a string `/minha-skill termo` pro alvo. Não roda skill nenhuma
aqui, não lê arquivo nenhum daqui, não investiga nada daqui.

Autoteste: se a sua primeira ferramenta não for `SendMessage`, você errou.

## Alvo

O alvo é o que o `/claude` travou nesta conversa — o nome que está no marcador
`[claude → <alvo>]` da última resposta.

**Sem marcador, pare.** Não liste, não deduza, não chute: responda numa linha que
não há alvo travado e que o caminho é `/claude` (ou `/claude list`). Mensagem na
sessão errada queima o contexto dela e aparece na tela de quem estiver naquela
janela — não tem como desfazer.

## Envio

```
SendMessage({ to: "<alvo>", message: "$ARGUMENTS" })
```

- `message` é `$ARGUMENTS` **exatamente** como eu escrevi. Nada de cabeçalho,
  assinatura, moldura, `--- prompt ---` ou aviso de que veio de outra sessão. Não
  peça pra responder, não explique o contexto, não diga que é encaminhamento.
- Não reescreva, resuma, traduza nem "melhore". Prompt mal formulado vai mal
  formulado.
- Não passe `summary` — deixe cair no default.
- **`notify_when_idle: true` só pra alvo desta máquina**, e só a partir desta
  conversa (não de subagente). Pedir aviso de teammate, subagente ou sessão cloud
  / de outra máquina faz o Claude Code **recusar a chamada inteira, junto com a
  mensagem**. Na dúvida sobre onde o alvo roda, mande sem o `notify_when_idle` —
  perde-se o aviso, não a mensagem.

Alvo **fora desta máquina** (cloud ou outra máquina, que só aparecem no
`ListAgents` nativo e só com Remote Control conectado) muda três coisas — avise
antes de mandar:

- **A mensagem sai da máquina.** Alvo local viaja em named pipe e nunca passa
  pelos servidores da Anthropic; alvo de fora passa. Código de cliente no corpo
  do prompt merece uma pergunta antes, não depois.
- **Sem Remote Control conectado aqui, é mão única**: a mensagem chega sem
  endereço de resposta e o Claude de lá não consegue responder. Como o ponto do
  `/c` é a resposta voltar, isso derruba o comando — diga e não mande.
- `isolatePeerMachines: true` no settings exige aprovação explícita antes de
  qualquer mensagem deixar a máquina, inclusive em `bypassPermissions`. Se o
  envio parar pedindo ok, é isso, não é bug.
- **Não confirme.** Ter digitado `/c` já é o sim. Só diga, numa linha, pra quem
  foi.

## Resposta

**Ela não volta sozinha — o normal é não voltar.** `SendMessage` entrega e não
devolve: o que chega aqui é o aviso de idle, que diz que o alvo **fechou o turno**
e nunca o que saiu dele. O texto fica gravado no transcript dele. Quem traz é o
`/p`, que lê esse arquivo local.

Então, depois de mandar:

- não fique chamando `ListAgents` em loop nem mande "já terminou?";
- não anuncie fracasso, não invente o resultado e não afirme que "está
  processando" como se fosse fato;
- **nunca diga que o resultado ficou lá e pare aí** — isso era o que se fazia
  quando não havia como buscar. Hoje há: rode `/p wait`, ou ofereça o `/p` numa
  linha se eu não pedi resposta.

Chegou resposta de verdade — o alvo chamou `SendMessage` de volta por conta
própria, ou eu rodei o `/p` — cole **verbatim**, em bloco, dizendo de qual sessão
veio. Sem resumo, sem comentário, sem análise. Se eu quiser análise, eu peço.

Quer o resultado de volta aqui? Peça no próprio prompt, ou puxe com o `/p`.
Encaminhar um comando não pede resposta sozinho.

Feche a resposta com o marcador, sozinho na última linha:

```
[claude → <alvo>]
```

O resto — listar sessões, escolher e trocar de alvo, fixadas, acordar, conversa
nova, sentido inverso — mora no `/claude`. Puxar a resposta é o `/p`. Aqui é só o
envio.
