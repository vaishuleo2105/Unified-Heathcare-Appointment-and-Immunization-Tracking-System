import json

with open('doc_paragraphs.json', 'r', encoding='utf-8') as f:
    paras = json.load(f)

print('=== CHAPTERS ===')
for p in paras:
    if p['text'].startswith('CHAPTER '):
        idx = p['index']
        print(f"\n{p['text']} (at P{idx}):")
        for k in range(idx, min(idx+8, len(paras))):
            print(f"   P{k} [{paras[k]['style']}]: {paras[k]['text'][:100]}")

print('\n=== ALL FIGURES ===')
for p in paras:
    if 'Figure ' in p['text']:
        idx = p['index']
        prev_txt = paras[idx-1]['text'] if idx > 0 else ''
        next_txt = paras[idx+1]['text'] if idx+1 < len(paras) else ''
        print(f"P{idx}: {p['text']}")
        print(f"   PREV P{idx-1}: {prev_txt[:80]}")
        print(f"   NEXT P{idx+1}: {next_txt[:80]}")

print('\n=== ALGORITHM REFERENCES ===')
for p in paras:
    if 'algorithm' in p['text'].lower():
        print(f"P{p['index']}: {p['text'][:100]}")
