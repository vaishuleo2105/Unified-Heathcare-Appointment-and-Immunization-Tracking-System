import docx

doc = docx.Document(r'D:\FreightOpt_Project_Report.docx')

for idx, p in enumerate(doc.paragraphs):
    if 'w:drawing' in p._element.xml:
        runs_with_drawing = [r_idx for r_idx, r in enumerate(p.runs) if 'w:drawing' in r._element.xml]
        print(f"P[{idx}] text='{p.text.strip()}' has drawing in runs {runs_with_drawing}")
