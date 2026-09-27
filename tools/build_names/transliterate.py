# Latin -> Devanagari transliterator for the GarbhaJyoti name scheme.
#
# Scheme: long vowels aa ee oo ai au, short a i u e o, vocalic ri/Ri,
# '~' = chandrabindu, 'M' = anusvara. Retroflex capitals: N T Th D Dh Sh.
# A consonant directly followed by another consonant forms a conjunct
# (halant). A word-final consonant keeps its inherent 'a' (no halant).
# 'a' between consonants is the inherent vowel.

CONS = {
    'ksh': '\u0915\u094d\u0937', 'jn': '\u091c\u094d\u091e', 'gy': '\u091c\u094d\u091e',
    'kh': '\u0916', 'gh': '\u0918', 'ng': '\u0919',
    'chh': '\u091b', 'ch': '\u091a', 'jh': '\u091d', 'ny': '\u0928\u094d\u092f',
    'Th': '\u0920', 'Dh': '\u0922', 'th': '\u0925', 'dh': '\u0927',
    'ph': '\u092b', 'bh': '\u092d',
    'Sh': '\u0937', 'sh': '\u0936',
    'k': '\u0915', 'g': '\u0917', 'j': '\u091c',
    'T': '\u091f', 'D': '\u0921\u093c', 'N': '\u0923',  # D = \u0921\u093c as in \u0917\u0930\u0941\u0921\u093c
    't': '\u0924', 'd': '\u0926', 'n': '\u0928',
    'p': '\u092a', 'b': '\u092c', 'm': '\u092e',
    'y': '\u092f', 'r': '\u0930', 'l': '\u0932', 'v': '\u0935', 'w': '\u0935',
    's': '\u0938', 'h': '\u0939', 'c': '\u0915',
}
# vowel -> (full letter, sign). 'R' is vocalic r (explicit, avoids r+i ambiguity).
VOW = {
    'aa': ('\u0906', '\u093e'), 'ee': ('\u0908', '\u0940'),
    'oo': ('\u090a', '\u0942'), 'ai': ('\u0910', '\u0948'),
    'au': ('\u0914', '\u094c'), 'R': ('\u090b', '\u0943'),
    'a': ('\u0905', ''), 'i': ('\u0907', '\u093f'),
    'u': ('\u0909', '\u0941'), 'e': ('\u090f', '\u0947'),
    'o': ('\u0913', '\u094b'),
}
MARKS = {'~': '\u0901', 'M': '\u0902', '|': ''}
HALANT = '\u094d'

CONS_KEYS = sorted(CONS.keys(), key=len, reverse=True)
VOW_KEYS = sorted(VOW.keys(), key=len, reverse=True)


def to_dev(word):
    w = word.strip()
    # tokenize
    toks = []
    i, n = 0, len(w)
    while i < n:
        ch = w[i]
        if ch in MARKS:
            toks.append(('mark', ch))
            i += 1
            continue
        hit = None
        for k in CONS_KEYS:
            if w.startswith(k, i):
                hit = ('c', k)
                break
        if hit is None:
            for k in VOW_KEYS:
                if w.startswith(k, i):
                    hit = ('v', k)
                    break
        if hit is None:
            i += 1  # skip unknown chars (spaces, hyphens)
            continue
        toks.append(hit)
        i += len(hit[1])
    out = []
    cons_open = False  # previous token was a consonant awaiting a vowel
    for idx, (typ, k) in enumerate(toks):
        if typ == 'c':
            if cons_open:
                out.append(HALANT)
            out.append(CONS[k])
            cons_open = True
        elif typ == 'v':
            if cons_open:
                out.append(VOW[k][1])
            else:
                out.append(VOW[k][0])
            cons_open = False
        else:  # mark
            out.append(MARKS[k])
            cons_open = False
    return ''.join(out)


if __name__ == '__main__':
    tests = {
        'shiv|prasaad': 'शिवप्रसाद', 'harinaath': 'हरिनाथ',
        'raaj|kumaar': 'राजकुमार', 'kRShNadaas': 'कृष्णदास',
        'mohan|laal': 'मोहनलाल', 'raam|laal': 'रामलाल',
        'jayamaalaa': 'जयमाला', 'haripriyaa': 'हरिप्रिया',
        'devesh': 'देवेश', 'suresh': 'सुरेश', 'gaNesh': 'गणेश',
        'lakshmee': 'लक्ष्मी', 'shaanti': 'शान्ति', 'aanand': 'आनन्द',
        'naaraayaN': 'नारायण', 'umaa|devee': 'उमादेवी', 'gyaan': 'ज्ञान',
        'shraddhaa': 'श्रद्धा', 'vallabh': 'वल्लभ', 'soorya': 'सूर्य',
        'chandra': 'चन्द्र', 'svarNa': 'स्वर्ण', 'paMkaj': 'पंकज',
        'chaa~danee': 'चाँदनी', 'haMs': 'हंस', 'garuD': 'गरुड़',
        'kaMchan': 'कंचन', 'shaMkar': 'शंकर', 'sharaN': 'शरण',
        'aravind': 'अरविन्द', 'sundar': 'सुन्दर', 'nand|laal': 'नन्दलाल',
        'satya|dev': 'सत्यदेव', 'kRShN|maayaa': 'कृष्णमाया',
        'dev|datt': 'देवदत्त', 'amaresh': 'अमरेश', 'sundar|naath': 'सुन्दरनाथ',
    }
    bad = 0
    for t, want in tests.items():
        got = to_dev(t)
        ok = got == want
        bad += not ok
        print(('OK  ' if ok else 'FAIL'), t, '->', got, '' if ok else ('want ' + want))
    print('failures:', bad)
