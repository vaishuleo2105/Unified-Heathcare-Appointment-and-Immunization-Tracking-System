import docx
from docx.oxml.ns import qn
import sys

sys.stdout.reconfigure(encoding='utf-8')

doc_path = r'D:\Unified_Healthcare_Project_Report (1).docx'
doc = docx.Document(doc_path)

p41 = doc.paragraphs[41]
run = p41.runs[0]
rPr = run._element.find(qn('w:rPr'))
rFonts = rPr.find(qn('w:rFonts')) if rPr is not None else None

print("rFonts element:", rFonts)
if rFonts is not None:
    print("w:ascii:", rFonts.get(qn('w:ascii')))
    print("w:hAnsi:", rFonts.get(qn('w:hAnsi')))
    print("w:cs:", rFonts.get(qn('w:cs')))
print("run text:", run.text[:50])
