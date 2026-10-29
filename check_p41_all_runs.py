import docx
from docx.oxml.ns import qn
import sys

sys.stdout.reconfigure(encoding='utf-8')

doc_path = r'D:\Unified_Healthcare_Project_Report (1).docx'
doc = docx.Document(doc_path)

p41 = doc.paragraphs[41]
print("Number of runs in p41:", len(p41.runs))
for i, r in enumerate(p41.runs):
    rPr = r._element.find(qn('w:rPr'))
    rFonts = rPr.find(qn('w:rFonts')) if rPr is not None else None
    print(f"Run {i}: text='{r.text[:30]}...', font={r.font.name}, rFonts={rFonts.attrib if rFonts is not None else None}")
