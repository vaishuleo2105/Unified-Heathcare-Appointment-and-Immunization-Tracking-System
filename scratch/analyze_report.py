import json

with open('doc_paragraphs.json', 'r', encoding='utf-8') as f:
    paras = json.load(f)

with open('scratch/report_analysis.txt', 'w', encoding='utf-8') as out:
    out.write('=== CHAPTERS ===\n')
    for p in paras:
        if p['text'].startswith('CHAPTER '):
            idx = p['index']
            out.write(f"\n{p['text']} (at P{idx}):\n")
            for k in range(idx, min(idx+6, len(paras))):
                out.write(f"   P{k} [{paras[k]['style']}]: {paras[k]['text'][:100]}\n")

    out.write('\n=== ALL FIGURES ===\n')
    for p in paras:
        if 'figure ' in p['text'].lower():
            idx = p['index']
            prev_txt = paras[idx-1]['text'] if idx > 0 else ''
            next_txt = paras[idx+1]['text'] if idx+1 < len(paras) else ''
            out.write(f"P{idx}: {p['text']}\n")
            out.write(f"   PREV P{idx-1}: {prev_txt[:100]}\n")
            out.write(f"   NEXT P{idx+1}: {next_txt[:100]}\n")

    out.write('\n=== ALL TABLES ===\n')
    for p in paras:
        if 'table ' in p['text'].lower():
            out.write(f"P{p['index']}: {p['text'][:100]}\n")

    out.write('\n=== ALL ALGORITHMS ===\n')
    for p in paras:
        if 'algorithm' in p['text'].lower():
            out.write(f"P{p['index']}: {p['text'][:100]}\n")

print('Analysis completed.')
