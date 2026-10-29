import docx

doc = docx.Document(r'D:\Unified_Healthcare_Project_Report (1).docx')

with open('scratch/verified_short_refs.txt', 'w', encoding='utf-8') as f:
    for i, p in enumerate(doc.paragraphs):
        txt = p.text.strip()
        if any(txt.startswith(x) for x in ["Figure ", "Table ", "Algorithm "]):
            # only print if it's a reference sentence (not a caption/code block)
            if any(w in txt for w in ["shows", "lists", "describes", "details"]):
                f.write(f"P{i}: {txt}\n")

print("Verified short references written.")
