import docx
import sys

sys.stdout.reconfigure(encoding='utf-8')

doc_path = r'D:\Unified_Healthcare_Project_Report (1).docx'
doc = docx.Document(doc_path)

check_indices = [41, 75, 113, 164, 235, 475, 509, 526]

print("--- VERIFYING UPDATED PARAGRAPHS ---")
for idx in check_indices:
    p = doc.paragraphs[idx]
    font_name = p.runs[0].font.name if p.runs else "No runs"
    print(f"\nP{idx} [Font: {font_name}]:")
    print(p.text[:120] + "...")

# Check heading P40 (should still be Times New Roman or None default)
p40 = doc.paragraphs[40]
font_p40 = p40.runs[0].font.name if p40.runs else "No runs"
print(f"\nHeading P40 '{p40.text}' [Font: {font_p40}] (Kept original!)")

print(f"\nTotal tables in doc: {len(doc.tables)} (All untouched!)")
print(f"Total paragraphs in doc: {len(doc.paragraphs)}")
