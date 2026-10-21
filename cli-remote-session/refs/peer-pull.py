# -*- coding: utf-8 -*-
# peer-pull.py - le, no transcript local do alvo, a ultima resposta que ele deu no chat.
#
# uso: python ~/.claude/refs/peer-pull.py [alvo] [wait] [timeout_seg]
#   alvo   nome da sessao (meu-projeto-98). vazio ou "-" = a sessao com o transcript mexido mais recentemente.
#   wait   "wait" liga o polling ate o turno fechar; qualquer outra coisa = leitura unica.
#
# Sai 0 quando o turno fechou, 2 quando ainda esta trabalhando, 1 quando nao achou nada.
# So le arquivo local. Nunca escreve, nunca manda mensagem.

import sys, os, io, json, glob, time

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

NL = chr(10)

ALVO = (sys.argv[1] if len(sys.argv) > 1 else '').strip()
if ALVO == '-':
    ALVO = ''
WAIT = (sys.argv[2] if len(sys.argv) > 2 else '') == 'wait'
LIMITE = int(sys.argv[3]) if len(sys.argv) > 3 else 100   # cabe no timeout padrao do Bash

HOME = os.path.expanduser('~')


def registro(nome):
    for f in glob.glob(os.path.join(HOME, '.claude', 'sessions', '*.json')):
        if os.path.basename(f).count('.') != 1:
            continue
        try:
            r = json.load(open(f, encoding='utf-8'))
        except Exception:
            continue
        if r.get('name') == nome:
            return r
    return None


def nome_de(sid):
    for f in glob.glob(os.path.join(HOME, '.claude', 'sessions', '*.json')):
        try:
            r = json.load(open(f, encoding='utf-8'))
        except Exception:
            continue
        if r.get('sessionId') == sid:
            return r.get('name')
    return None


def transcript_de(sid):
    hits = glob.glob(os.path.join(HOME, '.claude', 'projects', '*', sid + '.jsonl'))
    return hits[0] if hits else None


def transcript_mais_recente():
    """Sem alvo: a sessao com o transcript mexido mais recentemente, exceto a minha propria."""
    eu = os.environ.get('CLAUDE_CODE_SESSION_ID', '')
    cand = []
    for f in glob.glob(os.path.join(HOME, '.claude', 'projects', '*', '*.jsonl')):
        if eu and os.path.basename(f) == eu + '.jsonl':
            continue
        try:
            cand.append((os.path.getmtime(f), f))
        except OSError:
            continue
    if not cand:
        return None, None
    cand.sort(reverse=True)
    f = cand[0][1]
    return f, os.path.basename(f)[:-6]


def ler(path):
    recs = []
    with open(path, encoding='utf-8', errors='replace') as fh:
        for ln in fh:
            if '"type"' not in ln:
                continue
            try:
                o = json.loads(ln)
            except Exception:
                continue
            t = o.get('type')
            ts = (o.get('timestamp') or '')[11:19]
            m = o.get('message') or {}
            c = m.get('content')
            if t == 'user' and isinstance(c, str):
                recs.append(('prompt', ts, c, None))
            elif t == 'assistant' and isinstance(c, list):
                sr = m.get('stop_reason')
                recs.append(('turno', ts, '', sr))
                for b in c:
                    if not isinstance(b, dict):
                        continue
                    if b.get('type') == 'text':
                        recs.append(('texto', ts, b.get('text', ''), sr))
                    elif b.get('type') == 'tool_use':
                        arg = json.dumps(b.get('input') or {}, ensure_ascii=False)
                        recs.append(('acao', ts, (b.get('name') or '') + ' ' + arg[:150], sr))
    return recs


def extrai(recs):
    """Devolve o turno que veio depois do ultimo prompt do chat, seja ele qual for."""
    inicio = -1
    for i, r in enumerate(recs):
        if r[0] == 'prompt':
            inicio = i
    if inicio < 0:
        return None

    enviado = recs[inicio][2].strip()

    texto, acao, fim, ultimo = [], None, False, recs[inicio][1]
    for r in recs[inicio + 1:]:
        if r[0] == 'prompt':
            break            # novo turno comecou
        ultimo = r[1] or ultimo
        if r[0] == 'texto':
            texto.append(r[2])
        elif r[0] == 'acao':
            acao = (r[1], r[2])
        elif r[0] == 'turno':
            fim = (r[3] == 'end_turn')
    return {
        'em': recs[inicio][1],
        'enviado': enviado,
        'texto': (NL + NL).join(t.strip() for t in texto if t.strip()),
        'acao': acao,
        'fim': fim,
        'ultimo': ultimo,
    }


# --- resolve o transcript do alvo -------------------------------------------
sid, path = None, None
if ALVO:
    reg = registro(ALVO)
    if reg:
        sid = reg.get('sessionId')
        path = transcript_de(sid)
if not path:
    path, sid = transcript_mais_recente()
if not path:
    alvo_txt = (' para "' + ALVO + '"') if ALVO else ''
    print('NADA. Nenhum transcript local encontrado' + alvo_txt + '.')
    print('Se o alvo encerrou, o texto some junto com a sessao. Confira com /claude list.')
    sys.exit(1)

nome = ALVO or nome_de(sid) or '?'

# --- le, com ou sem polling -------------------------------------------------
limite = time.time() + LIMITE
mtime, r = -1, None
while True:
    agora = os.path.getmtime(path)
    if agora != mtime:
        mtime, r = agora, extrai(ler(path))
    if not WAIT or (r and r['fim']) or time.time() > limite:
        break
    time.sleep(4)

if not r:
    print('NADA. O transcript de %s (%s) nao tem nenhuma mensagem registrada.' % (nome, (sid or '')[:8]))
    sys.exit(1)

parado = int(time.time() - mtime)
print('ALVO: %s (%s)' % (nome, (sid or '')[:8]))
print('ULTIMO PROMPT %s -> %s' % (r['em'], (r['enviado'] or '(vazio)').replace(NL, ' ')[:200]))
if r['fim']:
    print('ESTADO: terminou %s' % r['ultimo'])
else:
    print('ESTADO: trabalhando (turno aberto; ultima escrita ha %ds)' % parado)
    if r['acao']:
        print('ULTIMA ACAO: %s %s' % (r['acao'][0], r['acao'][1]))
print('--- RESPOSTA ---')
print(r['texto'] if r['texto'] else '(sem texto ate agora)')
print('--- FIM ---')
sys.exit(0 if r['fim'] else 2)
