---
description: Puxa a resposta que o alvo deu ao que o /c mandou, lendo o transcript local dele. Não manda nada — o /claude escolhe o alvo, o /c manda, o /p traz de volta.
argument-hint: "vazio = lê o que já tem. `wait` = espera o turno fechar. `<alvo>` = lê de outra sessão sem trocar o alvo travado."
---

# /p — puxa a resposta

`SendMessage` entrega e **não devolve**. O aviso de idle diz que o alvo fechou o
turno, nunca o que saiu dele: a resposta fica gravada no transcript **dele**, em
`~/.claude/projects/<workspace>/<sessionId>.jsonl`, que é arquivo desta máquina.
O `/p` lê esse arquivo. Não envia nada, não escreve nada, não sai da máquina.

Autoteste: a sua **primeira** ferramenta é o `Bash` do Passo 2. Chamou
`SendMessage`? Comando errado — quem manda é o `/c`.

---

## Passo 1 — Qual alvo

O alvo é o do marcador `[claude → <alvo>]` da minha última resposta, o mesmo que
o `/c` usa.

**Sem marcador, use `-`.** Aqui isso é seguro (diferente do `/c`): `-` faz o
script procurar sozinho o transcript mais recente que recebeu mensagem **desta**
sessão. Ler transcript errado não queima contexto de ninguém — só devolve texto
que não é meu, e o script avisa quando isso acontece.

`$ARGUMENTS` é **modo e alvo**, nunca prompt. `/p wait` espera; `/p meu-projeto-98`
lê daquela sessão sem trocar o alvo travado. Barra depois de `/p` não é skill pra
rodar aqui — se eu quis mandar, eu digito `/c`.

---

## Passo 2 — Rode

Uma linha. Troque a palavra `ALVO` pelo nome do Passo 1 (ou `-`) e não mexa em mais nada.

```bash
python ~/.claude/refs/peer-pull.py ALVO
```

Esperando o alvo terminar — polling de 4 em 4 segundos, para sozinho quando o
turno fecha:

```bash
python ~/.claude/refs/peer-pull.py ALVO wait
```

O `wait` corta em 100s de propósito, pra caber no timeout padrão do `Bash`. Ainda
trabalhando quando ele volta? **Rode de novo**, não aumente o limite na mão. Se eu
pedir espera longa de verdade, é `... ALVO wait 500` **e** `timeout: 540000` na
chamada do `Bash` — os dois, senão o harness mata no meio.

| `$ARGUMENTS` | Linha |
| --- | --- |
| vazio | `python ~/.claude/refs/peer-pull.py ALVO` |
| `wait` ou `w` | `python ~/.claude/refs/peer-pull.py ALVO wait` |
| `<outro-alvo>` | mesma linha, com esse nome no lugar de `ALVO` |
| `<outro-alvo> wait` | idem, com `wait` no fim |

---

## Passo 3 — Entregue a saída

O script imprime um cabeçalho e um bloco entre `--- RESPOSTA ---` e `--- FIM ---`.
A linha `ESTADO:` decide o que dizer:

**`ESTADO: terminou`** — cole o bloco `RESPOSTA` **verbatim**, dizendo de qual
sessão veio. Sem resumo, sem comentário, sem análise. Se eu quiser análise, eu
peço.

**`ESTADO: trabalhando`** — o turno está aberto. Diga isso em uma linha, repasse a
`ULTIMA ACAO` como está e ofereça o `wait`. O texto que veio junto é parcial: pode
mostrar, **desde que diga que é parcial**. Não trate parcial como resposta final.

**`NADA.`** — cole as duas linhas do script e pare. Não invente que a resposta
existe em outro lugar, não saia varrendo transcript na mão.

**`AVISO: esta mensagem NAO saiu desta sessao`** — o script achou uma mensagem de
outro remetente. Diga isso **antes** do bloco e não a apresente como resposta ao
que eu mandei. Acontece quando o `/c` desta conversa ainda não chegou lá.

Nunca afirme que o alvo respondeu sem ter lido `ESTADO: terminou` nesta execução.
Rodada anterior não vale — o arquivo muda embaixo.

Feche a resposta com o marcador, sozinho na última linha, do mesmo jeito que o
`/c`:

```
[claude → <alvo>]
```

---

## Limites

- **Daqui não sai `SendMessage`.** Nem "já que o alvo está claro". Quem manda é o
  `/c`; quem escolhe é o `/claude`.
- **Só alcança sessão desta máquina.** Sessão cloud ou de outra máquina não deixa
  transcript aqui — o `/p` não a lê, e não há como ler. Diga isso em vez de tentar.
- **Alvo morto ainda pode ser lido.** O transcript sobrevive ao processo, então o
  `/p` traz a resposta de uma sessão que já encerrou. Isso é o contrário do `/c`,
  que exige sessão viva com named pipe.
- O `/p` **não** trava, destrava nem troca alvo — `/p meu-projeto-98` é leitura
  avulsa e o marcador continua apontando pro alvo de antes.
- Leitura apenas. O script nunca escreve no transcript nem no store do app.
- Nunca usar isto pra ler conversa que não é resposta a mim. O filtro é o socket
  desta sessão; quando ele não casa, o script avisa — respeite o aviso.
