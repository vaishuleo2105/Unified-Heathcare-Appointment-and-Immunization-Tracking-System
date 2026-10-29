import json

with open('doc_paragraphs.json', 'r', encoding='utf-8') as f:
    paras = json.load(f)

with open('scratch/chapter4_ml.txt', 'w', encoding='utf-8') as f:
    for p in paras[295:360]:
        f.write(f"P{p['index']} [{p['style']}]: {p['text']}\n\n")

print("ML section written.")
