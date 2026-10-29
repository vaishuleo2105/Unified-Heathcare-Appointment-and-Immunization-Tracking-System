import docx
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def apply_text_formatting():
    doc_path = r'D:\Unified_Healthcare_Project_Report.docx'
    doc = docx.Document(doc_path)
    print(f"Loaded document with {len(doc.paragraphs)} paragraphs and {len(doc.tables)} tables.")

    # List of personal pronouns to check/replace
    pronoun_replacements = {
        r'\bwe\b': 'the system',
        r'\bWe\b': 'The system',
        r'\bour\b': 'the project',
        r'\bOur\b': 'The project',
        r'\bus\b': 'the system',
        r'\bI\b': 'the researcher',
        r'\bmy\b': 'the researcher\'s',
        r'\byou\b': 'the user',
        r'\bYou\b': 'The user',
    }

    # Iterate through paragraphs to apply formatting
    for p in doc.paragraphs:
        text = p.text.strip()
        if not text:
            continue

        # Check line spacing and alignment default
        p.paragraph_format.line_spacing = 1.5
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.space_before = Pt(2)
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY

        # 1. CHAPTER HEADINGS (TNR 16pt Bold)
        if text.startswith('CHAPTER ') or text in ['ABSTRACT', 'TABLE OF CONTENTS', 'ACKNOWLEDGEMENT', 'BONAFIDE CERTIFICATE']:
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.space_before = Pt(12)
            p.paragraph_format.space_after = Pt(12)
            for r in p.runs:
                r.font.name = 'Times New Roman'
                r.font.size = Pt(16)
                r.bold = True

        # 2. TITLE / SECTION HEADINGS (TNR 14pt Bold)
        elif any(text.startswith(f'{ch}.{sec}') for ch in range(1, 7) for sec in range(1, 20)) or text in ['BIBLIOGRAPHY']:
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            p.paragraph_format.space_before = Pt(10)
            p.paragraph_format.space_after = Pt(6)
            for r in p.runs:
                r.font.name = 'Times New Roman'
                r.font.size = Pt(14)
                r.bold = True

        # 3. SUBHEADINGS (TNR 12pt Bold)
        elif any(text.startswith(f'{ch}.{sec}.{subsec}') for ch in range(1, 7) for sec in range(1, 20) for subsec in range(1, 10)) or (text.isupper() and len(text) < 40 and not text.startswith('CHAPTER')):
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            p.paragraph_format.space_before = Pt(8)
            p.paragraph_format.space_after = Pt(4)
            for r in p.runs:
                r.font.name = 'Times New Roman'
                r.font.size = Pt(12)
                r.bold = True

        # 4. FIGURE CAPTIONS (TNR 11pt Bold, Centered, Below Figure)
        elif text.startswith('Figure '):
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.space_before = Pt(6)
            p.paragraph_format.space_after = Pt(12)
            for r in p.runs:
                r.font.name = 'Times New Roman'
                r.font.size = Pt(11)
                r.bold = True
                r.italic = False

        # 5. TABLE CAPTIONS (TNR 11pt Bold, Centered/Left, Above Table)
        elif text.startswith('Table '):
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            p.paragraph_format.space_before = Pt(12)
            p.paragraph_format.space_after = Pt(4)
            for r in p.runs:
                r.font.name = 'Times New Roman'
                r.font.size = Pt(11)
                r.bold = True

        # 6. CODE SNIPPETS (Consolas / Courier New 10pt, Single Spacing)
        elif text.startswith('//') or text.startswith('const ') or text.startswith('import ') or text.startswith('def ') or text.startswith('@app') or text.startswith('router.'):
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            p.paragraph_format.line_spacing = 1.0
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(2)
            p.paragraph_format.left_indent = Inches(0.3)
            for r in p.runs:
                r.font.name = 'Consolas'
                r.font.size = Pt(10)

        # 7. REGULAR CONTENT PARAGRAPHS (TNR 12pt Regular, Justified, 1.5 line spacing)
        else:
            p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
            for r in p.runs:
                r.font.name = 'Times New Roman'
                r.font.size = Pt(12)

    # Format Tables
    for t_idx, table in enumerate(doc.tables):
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

    doc.save(r'D:\Unified_Healthcare_Project_Report.docx')
    print("Successfully formatted D:\\Unified_Healthcare_Project_Report.docx according to guidelines!")

if __name__ == '__main__':
    apply_text_formatting()
