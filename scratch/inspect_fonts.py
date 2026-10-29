import docx

doc = docx.Document(r'D:\Unified_Healthcare_Project_Report (1).docx')

with open('scratch/font_styles.txt', 'w', encoding='utf-8') as f:
    for i in [71, 72, 73, 74, 80, 91, 92, 94, 95, 137, 138, 140, 142, 210, 211, 215, 216, 218, 451, 452, 454, 471, 472, 474]:
        p = doc.paragraphs[i]
        runs_info = []
        for r in p.runs:
            runs_info.append(f"font={r.font.name}, size={r.font.size.pt if r.font.size else None}, bold={r.bold}, italic={r.italic}, text='{r.text}'")
        f.write(f"P{i} [{p.style.name}]:\n  " + "\n  ".join(runs_info) + "\n\n")

print("Font styles inspected.")
