import docx
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
import re

def enhance_and_format_report():
    doc_path = r'D:\Unified_Healthcare_Project_Report.docx'
    doc = docx.Document(doc_path)
    print(f"Loaded document: {len(doc.paragraphs)} paragraphs, {len(doc.tables)} tables.")

    # 1. Alphabetically sort Bibliography entries
    bib_start_idx = None
    bib_entries = []
    for idx, p in enumerate(doc.paragraphs):
        if p.text.strip() == 'BIBLIOGRAPHY':
            bib_start_idx = idx
            break
    
    if bib_start_idx is not None:
        for idx in range(bib_start_idx + 1, len(doc.paragraphs)):
            text = doc.paragraphs[idx].text.strip()
            if text:
                bib_entries.append(text)
        
        # Sort bibliography entries in ascending order (case-insensitive)
        sorted_bib = sorted(bib_entries, key=lambda x: x.lower())
        
        for i, entry in enumerate(sorted_bib):
            target_idx = bib_start_idx + 1 + i
            if target_idx < len(doc.paragraphs):
                p = doc.paragraphs[target_idx]
                if p.runs:
                    p.runs[0].text = entry
                    for r in p.runs[1:]:
                        r.text = ''
                else:
                    p.text = entry

    # 2. Pronoun Elimination & Objective Academic Tone Replacement
    pronoun_map = {
        r'\bwe propose\b': 'the system proposes',
        r'\bWe propose\b': 'The system proposes',
        r'\bwe implemented\b': 'the implementation incorporates',
        r'\bWe implemented\b': 'The implementation incorporates',
        r'\bwe use\b': 'the application utilizes',
        r'\bWe use\b': 'The application utilizes',
        r'\bwe have\b': 'the project features',
        r'\bWe have\b': 'The project features',
        r'\bour system\b': 'the proposed system',
        r'\bOur system\b': 'The proposed system',
        r'\bour platform\b': 'the platform',
        r'\bOur platform\b': 'The platform',
        r'\byou can\b': 'users can',
        r'\bYou can\b': 'Users can',
    }

    for p in doc.paragraphs:
        if not p.text.strip():
            continue
        original_text = p.text
        updated_text = original_text
        for pattern, replacement in pronoun_map.items():
            updated_text = re.sub(pattern, replacement, updated_text)
        
        if updated_text != original_text and p.runs:
            p.runs[0].text = updated_text
            for r in p.runs[1:]:
                r.text = ''

    # 3. Apply Rigorous Font, Size, Line Spacing & Alignment Formatting Rules
    for p in doc.paragraphs:
        text = p.text.strip()
        if not text:
            continue

        # Default Paragraph Formatting Rules
        p.paragraph_format.line_spacing = 1.5
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(4)
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY

        # Rule A: CHAPTER HEADINGS -> Times New Roman, 16 pt, Bold, Centered
        if text.startswith('CHAPTER ') or text in ['ABSTRACT', 'TABLE OF CONTENTS', 'ACKNOWLEDGEMENT', 'BONAFIDE CERTIFICATE']:
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.space_before = Pt(14)
            p.paragraph_format.space_after = Pt(14)
            for r in p.runs:
                r.font.name = 'Times New Roman'
                r.font.size = Pt(16)
                r.bold = True

        # Rule B: TITLE / SECTION HEADINGS (1.1, 2.1, 3.1, etc., & BIBLIOGRAPHY) -> Times New Roman, 14 pt, Bold, Left
        elif any(text.startswith(f'{ch}.{sec} ') or text.startswith(f'{ch}.{sec}\t') or text == f'{ch}.{sec}' for ch in range(1, 7) for sec in range(1, 20)) or text == 'BIBLIOGRAPHY':
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            p.paragraph_format.space_before = Pt(12)
            p.paragraph_format.space_after = Pt(6)
            for r in p.runs:
                r.font.name = 'Times New Roman'
                r.font.size = Pt(14)
                r.bold = True

        # Rule C: SUBHEADINGS (1.1.1, 4.3.1, etc.) -> Times New Roman, 12 pt, Bold, Left
        elif any(text.startswith(f'{ch}.{sec}.{sub}') for ch in range(1, 7) for sec in range(1, 20) for sub in range(1, 15)):
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            p.paragraph_format.space_before = Pt(8)
            p.paragraph_format.space_after = Pt(4)
            for r in p.runs:
                r.font.name = 'Times New Roman'
                r.font.size = Pt(12)
                r.bold = True

        # Rule D: FIGURE CAPTIONS -> Times New Roman, 11 pt, Bold, Centered, Placed BELOW figures
        elif text.startswith('Figure '):
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.space_before = Pt(6)
            p.paragraph_format.space_after = Pt(12)
            for r in p.runs:
                r.font.name = 'Times New Roman'
                r.font.size = Pt(11)
                r.bold = True
                r.italic = False

        # Rule E: TABLE CAPTIONS -> Times New Roman, 11 pt, Bold, Left/Centered, Placed ABOVE tables
        elif text.startswith('Table '):
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            p.paragraph_format.space_before = Pt(12)
            p.paragraph_format.space_after = Pt(4)
            for r in p.runs:
                r.font.name = 'Times New Roman'
                r.font.size = Pt(11)
                r.bold = True

        # Rule F: CODE SNIPPETS -> Consolas / Courier New, 10 pt, Single Spacing, Indented
        elif text.startswith('//') or text.startswith('const ') or text.startswith('import ') or text.startswith('def ') or text.startswith('@app') or text.startswith('router.') or text.startswith('module.exports'):
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            p.paragraph_format.line_spacing = 1.0
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(2)
            p.paragraph_format.left_indent = Inches(0.4)
            for r in p.runs:
                r.font.name = 'Consolas'
                r.font.size = Pt(10)
                r.bold = False

        # Rule G: REGULAR CONTENT PARAGRAPHS -> Times New Roman, 12 pt, Regular, Justified, Line Spacing 1.5
        else:
            p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
            for r in p.runs:
                r.font.name = 'Times New Roman'
                r.font.size = Pt(12)

    # 4. Table Formatting (TNR 10.5pt, 1.15 spacing, Centered alignment)
    for table in doc.tables:
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        for r_idx, row in enumerate(table.rows):
            for cell in row.cells:
                for p in cell.paragraphs:
                    p.paragraph_format.line_spacing = 1.15
                    p.paragraph_format.space_before = Pt(2)
                    p.paragraph_format.space_after = Pt(2)
                    for r in p.runs:
                        r.font.name = 'Times New Roman'
                        r.font.size = Pt(10.5)
                        if r_idx == 0:
                            r.bold = True

    doc.save(doc_path)
    print("Report enhanced and formatted successfully!")

if __name__ == '__main__':
    enhance_and_format_report()
