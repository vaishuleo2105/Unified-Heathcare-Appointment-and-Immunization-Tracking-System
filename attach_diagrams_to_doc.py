import docx
from docx.shared import Inches
import os

doc_path = r'D:\Unified_Healthcare_Project_Report.docx'
doc = docx.Document(doc_path)

diagram_map = {
    "Figure 3.1": "diagram_architecture.png",
    "Figure 3.2": "diagram_uml_activity.png",
    "Figure 3.3": "diagram_bpmn.png",
    "Figure 3.4": "diagram_db_schema.png",
    "Figure 3.5": "diagram_ml_workflow.png"
}

print("Scanning paragraphs for figure captions...")

for idx, p in enumerate(doc.paragraphs):
    for fig_key, img_file in diagram_map.items():
        if fig_key in p.text and os.path.exists(img_file):
            print(f"Found {fig_key} at paragraph P[{idx}]: '{p.text}'")
            # Clear existing drawings in paragraph if any, or insert new run with picture
            # Create a new paragraph after or add run before/after caption
            p.alignment = docx.enum.text.WD_ALIGN_PARAGRAPH.CENTER
            
            # Remove old runs or old drawings in adjacent paragraph if empty
            # Add image in a paragraph right before or right after
            # Let's check if the previous or next paragraph is an image holder
            p_img = p.insert_paragraph_before()
            p_img.alignment = docx.enum.text.WD_ALIGN_PARAGRAPH.CENTER
            run = p_img.add_run()
            run.add_picture(img_file, width=Inches(5.8))
            print(f"Successfully attached {img_file} for {fig_key}!")

doc.save(doc_path)
print("Updated D:\\Unified_Healthcare_Project_Report.docx with new white-background black-text diagrams!")
