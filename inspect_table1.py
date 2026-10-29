import docx
import sys

sys.stdout.reconfigure(encoding='utf-8')

doc = docx.Document(r'D:\Unified_Healthcare_Project_Report (1).docx')
t1 = doc.tables[1]

print(f"Table 1 Rows: {len(t1.rows)}")
for i, row in enumerate(t1.rows):
    print(f"Row {i}: Tech='{row.cells[0].text.strip()}' | Purpose='{row.cells[1].text.strip()[:60]}...'")
