#!/usr/bin/env python3
"""Build assets/names.js: curated seeds + traditional compounds -> exactly 5000 names."""
import sys, re, json, random
sys.path.insert(0, '.')
from data import PREFIXES, SUFFIXES, BLOCKS, OVERRIDES
from seeds1 import SEEDS1
from seeds2 import SEEDS2
from seeds3 import SEEDS3
from transliterate import to_dev
from gloss import translate

TARGET = 5000
BLOCKSET = set(BLOCKS)

def syllables(latin):
    return len(re.findall(r'aa|ee|oo|ai|au|[aeiou]', latin.lower()))

DEITY_WORDS = ['vishnu','krishna','shiva','rama','durga','lakshmi','saraswati','parvati',
               'ganesh','hanuman','kartikeya','brahma','indra','surya','chandra','agni',
               'vayu','varuna','yama','sita','radha','kali','devi','dev']

def deity_tag(lat, en):
    t = (lat + ' ' + en).lower()
    for d in DEITY_WORDS:
        if d in t:
            return d.capitalize()
    return None

def sandhi(tr):
    """Basic Sanskrit vowel sandhi at the | morpheme boundary."""
    tr = tr.replace('aa|aa', 'aa')
    tr = tr.replace('aa|a', 'aa')
    tr = tr.replace('aa|eesh', 'esh')
    tr = tr.replace('a|eesh', 'esh')
    tr = tr.replace('aa|oo', 'o')
    tr = tr.replace('ee|eesh', 'eesh')
    tr = tr.replace('i|eesh', 'eesh')
    tr = tr.replace('oo|eesh', 'veesh')
    tr = tr.replace('u|eesh', 'veesh')
    tr = tr.replace('|aa', 'aa')
    tr = tr.replace('|eesh', 'esh')
    tr = tr.replace('|oo', 'oo')
    tr = tr.replace('|ai', 'ai')
    tr = tr.replace('|au', 'au')
    tr = tr.replace('|a', 'a')
    return tr

def join_latin(pdisp, sdisp):
    """Join display forms with matching vowel sandhi (Tara+eshwari -> Tareshwari)."""
    if sdisp[:1] in ('a', 'e'):
        v = 'a' if sdisp[0] == 'a' else 'e'
        if pdisp.endswith('aa'):
            return pdisp[:-2] + v + sdisp[1:]
        if pdisp.endswith('a'):
            return pdisp[:-1] + v + sdisp[1:]
        if pdisp.endswith('i') and v == 'e':
            return pdisp[:-1] + 'i' + sdisp[1:]
        if pdisp.endswith('u') and v == 'e':
            return pdisp[:-1] + 'vi' + sdisp[1:]
    return pdisp + sdisp

records = []
seen = set()

def add(lat, dev, g, en, hi, ne, tag, src):
    key = lat.lower()
    if key in seen:
        return False
    seen.add(key)
    if not re.match(r'^[\u0900-\u097f]+$', dev):
        raise ValueError('bad devanagari: %s -> %s' % (lat, dev))
    records.append({'n': lat, 'd': dev, 'g': g,
                    'm': {'hi': hi, 'en': en, 'ne': ne},
                    't': tag, 's': syllables(lat), 'src': src})
    return True

# ---- 1. curated seeds ----
n_seed = 0
for lat, dev, g, en in SEEDS1 + SEEDS2 + SEEDS3:
    g = 'both' if g == 'unisex' else g
    if add(lat, dev, g, en, translate(en, 'hi'), translate(en, 'ne'),
           deity_tag(lat, en), 'seed'):
        n_seed += 1
print('seeds kept:', n_seed)

# ---- 2. traditional compounds ----
compounds = []
for p in PREFIXES:
    pk, pdisp, ptr, ptr_esh, ptr_cons, pen, phi, pne, pg, deity = p
    for s_ in SUFFIXES:
        sk, sdisp, str_, sg, en_t, hi_t, ne_t = s_
        if (pk, sk) in BLOCKSET:
            continue
        if sg == 'boy' and pg == 'f':
            continue
        if sg == 'girl' and pg == 'm':
            continue
        ov = OVERRIDES.get((pk, sk))
        if ov:
            latin, tr = ov
            tr = sandhi(tr)
        else:
            latin = join_latin(pdisp, sdisp)
            base = ptr_cons if str_[0] not in 'aeiou' else ptr
            tr = sandhi(base + '|' + str_)
        dev = to_dev(tr)
        gender = 'girl' if sg == 'both' else sg  # -priya compounds are feminine
        compounds.append((latin, dev, gender,
                          en_t.replace('{p}', pen), hi_t.replace('{ph}', phi),
                          ne_t.replace('{pn}', pne), deity))
print('compounds generated:', len(compounds))

random.seed(42)
random.shuffle(compounds)
# balance: targets for the final 5000
want = {'boy': 2450, 'girl': 2450, 'both': 100}
have = {'boy': 0, 'girl': 0, 'both': 0}
for r in records:
    have[r['g']] += 1
n_comp = 0
for latin, dev, gender, en, hi, ne, deity in compounds:
    if len(records) >= TARGET:
        break
    if have[gender] >= want[gender]:
        continue
    if add(latin, dev, gender, en, hi, ne, deity, 'compound'):
        n_comp += 1
        have[gender] += 1
# fill any remainder (e.g. 'both' shortfall) with whatever is left
for latin, dev, gender, en, hi, ne, deity in compounds:
    if len(records) >= TARGET:
        break
    if latin.lower() in seen:
        continue
    if add(latin, dev, gender, en, hi, ne, deity, 'compound'):
        n_comp += 1
print('compounds kept:', n_comp)
print('total:', len(records))

# ---- validation ----
assert len(records) == TARGET, 'count %d != %d' % (len(records), TARGET)
assert len(set(r['n'].lower() for r in records)) == TARGET, 'latin dupes!'
for r in records:
    assert r['s'] >= 1, 'no syllable: %s' % r['n']
    assert r['g'] in ('boy', 'girl', 'both'), 'bad gender: %s' % r['n']
    for L in ('hi', 'en', 'ne'):
        assert r['m'][L], 'empty %s meaning: %s' % (L, r['n'])
from collections import Counter
print('gender:', dict(Counter(r['g'] for r in records)))
print('src:', dict(Counter(r['src'] for r in records)))
print('syllables:', dict(sorted(Counter(r['s'] for r in records).items())))

# ---- write names.js ----
with open('/home/hatch/workspace/garbha-jyoti/assets/names.js', 'w', encoding='utf-8') as f:
    f.write('// GarbhaJyoti baby names database: %d names (curated seeds + traditionally styled compounds).\n' % TARGET)
    f.write('// Compounds are honest Sanskrit-style formations; src:"compound" marks them.\n')
    f.write('window.NAMES=')
    json.dump(records, f, ensure_ascii=False, separators=(',', ':'))
    f.write(';')
print('wrote ../assets/names.js')
