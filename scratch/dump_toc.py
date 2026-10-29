import docx

doc = docx.Document(r'D:\Unified_Healthcare_Project_Report (1).docx')
toc_table = doc.tables[0]

with open('scratch/toc_dump.txt', 'w', encoding='utf-8') as f:
    for idx, row in enumerate(toc_table.rows):
        cells = [c.text.strip().replace('\n', ' ') for c in row.cells]
        f.write(f"Row {idx:2d}: {cells[0]:<50} | {cells[1]}\n")

print("TOC dumped.")
