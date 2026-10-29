import docx
import sys

sys.stdout.reconfigure(encoding='utf-8')

doc_path = r'D:\Unified_Healthcare_Project_Report (1).docx'
doc = docx.Document(doc_path)

p41 = doc.paragraphs[41]
print("Total runs in P41:", len(p41.runs))
for i, r in enumerate(p41.runs):
    print(f"Run {i}: text='{r.text[:30]}...', font={r.font.name}")
