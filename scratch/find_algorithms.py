import json

with open('doc_paragraphs.json', 'r', encoding='utf-8') as f:
    paras = json.load(f)

with open('scratch/algo_search.txt', 'w', encoding='utf-8') as f:
    for p in paras:
        txt = p['text']
        if any(w in txt.lower() for w in ['algorithm', 'pseudo', 'step 1', 'input:', 'output:']):
            f.write(f"P{p['index']} [{p['style']}]: {txt}\n\n")

print("Algo search written.")
