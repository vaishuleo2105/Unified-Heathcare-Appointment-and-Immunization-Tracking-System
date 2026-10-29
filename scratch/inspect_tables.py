import docx

doc = docx.Document(r'D:\Unified_Healthcare_Project_Report (1).docx')
with open('scratch/tables_analysis.txt', 'w', encoding='utf-8') as f:
    f.write(f"Total tables: {len(doc.tables)}\n\n")
    for i, table in enumerate(doc.tables):
        f.write(f"=== TABLE {i} ({len(table.rows)} rows, {len(table.columns)} cols) ===\n")
        # Find where this table is located relative to paragraphs if possible, or print first 3 rows
        for r_idx in range(min(5, len(table.rows))):
            row_txt = [c.text.strip().replace('\n', ' ') for c in table.rows[r_idx].cells]
            f.write(f"  Row {r_idx}: {' | '.join(row_txt)}\n")
        f.write("\n")

print("Tables analyzed.")
