import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
import os

doc_path = r'D:\Unified_Healthcare_Project_Report.docx'
doc = docx.Document(doc_path)

arch_img_path = r'd:\College\PG\SEM III\Miniproject\project\Unified-Heathcare-Appointment-and-Immunization-Tracking-System\diagram_architecture_clean_a4.png'
workflow_img_path = r'd:\College\PG\SEM III\Miniproject\project\Unified-Heathcare-Appointment-and-Immunization-Tracking-System\diagram_workflow_a4.png'

print('--- UPDATING TABLE OF CONTENTS (TABLE 0) ---')
t0 = doc.tables[0]

# 1. Update Chapter 5 Title in TOC
for row in t0.rows:
    if '5.  SYSTEM TESTING' in row.cells[0].text:
        row.cells[0].text = '5.  SYSTEM TESTING AND EXPERIMENTAL RESULTS'
        print('Updated TOC Chapter 5 title')

# 2. Group Chapter 4 Subsections in TOC (Rows 23 to 34)
# We will keep rows 22 (Chapter 4 heading), and replace rows 23-27 with 5 grouped modules, removing extra rows.
grouped_modules_toc = [
    ('4.1 User Portals & Multilingual Presentation Layer', '12'),
    ('4.2 Unified EHR & Emergency Inter-Hospital Referral Engine', '13'),
    ('4.3 Maternal & Child Immunization Tracking Module', '15'),
    ('4.4 Machine Learning Triage & Workload Risk Microservice', '16'),
    ('4.5 Core REST API & Security Infrastructure', '17'),
]

# Find row index of 4.1 Home / Dashboard
row_start_idx = None
for idx, row in enumerate(t0.rows):
    if '4.1 Home / Dashboard' in row.cells[0].text:
        row_start_idx = idx
        break

if row_start_idx is not None:
    # Update first 5 rows with grouped modules
    for i, (m_title, m_page) in enumerate(grouped_modules_toc):
        target_row = t0.rows[row_start_idx + i]
        target_row.cells[0].text = m_title
        target_row.cells[1].text = m_page
    
    # Remove remaining old rows (from row_start_idx + 5 up to before Chapter 5)
    # Delete rows from bottom to top
    end_idx = None
    for idx in range(row_start_idx + 5, len(t0.rows)):
        if '5.' in t0.rows[idx].cells[0].text:
            end_idx = idx
            break
    
    if end_idx is not None:
        for _ in range(end_idx - (row_start_idx + 5)):
            r = t0.rows[row_start_idx + 5]
            r._tr.getparent().remove(r._tr)
        print('Successfully grouped Chapter 4 TOC entries')

print('--- UPDATING TABLE 1 (TOOLS AND TECHNOLOGIES JUSTIFICATIONS) ---')
t1 = doc.tables[1]
justifications = {
    'React.js': 'Chosen for its component-based virtual DOM architecture, ensuring sub-second UI re-renders across multi-role dashboards and seamless integration with react-i18next for 6-language instant rendering without full page reloads.',
    'Node.js': 'Selected for its asynchronous, non-blocking I/O event loop, enabling efficient high-concurrency handling during peak appointment booking windows and real-time referral data dispatches.',
    'Express.js': 'Chosen for its lightweight routing pipeline, robust middleware support for JWT authentication, and seamless JSON serialization for REST API endpoints.',
    'MongoDB': 'Selected over rigid relational databases because patient EHRs, maternal trimester vitals, and immunization batch logs vary dynamically. Mongoose ODM enforces strict schema validation while retaining document flexibility.',
    'Python & Flask': 'Chosen to decouple computationally intensive ML model inference tasks from the main Node web server, providing lightweight microservice REST endpoints for real-time predictions.',
    'scikit-learn': 'Selected for its battle-tested, highly optimized implementations of Gradient Boosting and Random Forest algorithms, providing superior classification accuracy for clinical triage and workload risk scoring.',
    'TailwindCSS': 'Utility-first CSS framework selected to enforce Organic Modernist design principles, establishing clear typographic hierarchy and responsive grid layouts.',
    'pandas': 'Data manipulation framework chosen for clinical feature encoding, handling missing records, and preparing normalized feature vectors for model training.'
}

for row in t1.rows[1:]:
    tech_name = row.cells[0].text.strip()
    for key, just in justifications.items():
        if key.lower() in tech_name.lower():
            row.cells[1].text = f'{row.cells[1].text.strip()} Selection Justification: {just}'
            break

print('--- UPDATING DOCUMENT PARAGRAPHS ---')
# 1. Update Chapter 5 Heading in text
for p in doc.paragraphs:
    if p.text.strip() == 'SYSTEM TESTING':
        p.text = 'SYSTEM TESTING AND EXPERIMENTAL RESULTS'
        print('Updated Chapter 5 Heading in document text')

# 2. Update Section 1.1 Workflow (Replace P57-P66 with Workflow Diagram)
p_wf_idx = None
for i, p in enumerate(doc.paragraphs):
    if 'Example workflow:' in p.text:
        p_wf_idx = i
        break

if p_wf_idx is not None:
    # Replace P57 header
    doc.paragraphs[p_wf_idx].text = '1.1.1 End-to-End System Clinical Workflow'
    doc.paragraphs[p_wf_idx].style = 'Heading 3' if 'Heading 3' in [s.name for s in doc.styles] else 'Normal'
    
    # Replace step 1 (P58) with explanation and insert image
    p_img = doc.paragraphs[p_wf_idx + 1]
    p_img.text = ''
    run = p_img.add_run()
    run.add_picture(workflow_img_path, width=Inches(6.2))
    p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
    
    p_cap = doc.paragraphs[p_wf_idx + 2]
    p_cap.text = 'Figure 1.1: End-to-End Patient Registration, Triage, Clinical Consultation, Emergency Referral, and Immunization Workflow.'
    p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_cap.runs[0].font.italic = True
    p_cap.runs[0].font.size = Pt(9.5)

    # Clear old bullet points (P59 to P66)
    for j in range(p_wf_idx + 3, p_wf_idx + 10):
        if j < len(doc.paragraphs) and doc.paragraphs[j].text.startswith(('2.', '3.', '4.', '5.', '6.', '7.', '8.', '9.')):
            doc.paragraphs[j].text = ''

print('--- UPDATING SECTION 1.2 OBJECTIVES (PARAPHRASING BULLETS) ---')
p_obj_idx = None
for i, p in enumerate(doc.paragraphs):
    if '1.2 PROJECT OBJECTIVES' in p.text:
        p_obj_idx = i
        break

if p_obj_idx is not None:
    # Paraphrase objectives into continuous academic prose
    obj_p1 = (
        'The primary objective of this project is to construct a unified digital healthcare platform that eliminates data '
        'fragmentation across medical facilities. By maintaining a single portable Electronic Health Record (EHR) accessible across '
        'authorized institutions, the system aims to improve clinical decision-making speed during emergency referrals, prevent '
        'duplicate diagnostic testing, and ensure uninterrupted long-term patient care continuity.'
    )
    obj_p2 = (
        'Additionally, the platform integrates automated preventive care management for maternal and pediatric health. By linking '
        'government-issued registration references (such as RCH / ABHA IDs) with automated dose calculators and notification schedulers, '
        'the system ensures timely antenatal checkups and child immunization tracking regardless of where care is delivered. '
        'Multi-language UI localization (across 6 regional languages) and machine-learning triage models further optimize patient '
        'accessibility and clinical doctor workload balancing.'
    )
    
    doc.paragraphs[p_obj_idx + 1].text = obj_p1
    doc.paragraphs[p_obj_idx + 2].text = obj_p2
    
    # Clear remaining old bullet lines
    for j in range(p_obj_idx + 3, p_obj_idx + 13):
        if j < len(doc.paragraphs) and not doc.paragraphs[j].text.startswith('1.3'):
            doc.paragraphs[j].text = ''

print('--- UPDATING SECTION 4 IMPLEMENTATION & ADDING ARCHITECTURE DIAGRAM ---')
p_impl_idx = None
for i, p in enumerate(doc.paragraphs):
    if p.text.strip() == 'SYSTEM IMPLEMENTATION':
        p_impl_idx = i
        break

if p_impl_idx is not None:
    # Insert architecture diagram right under Chapter 4 title
    p_arch_desc = doc.paragraphs[p_impl_idx + 1]
    p_arch_desc.text = (
        'The system implementation follows a 3-Tier Model-View-Controller (MVC) architecture connecting React.js single-page applications, '
        'Express.js RESTful API services, Python Flask machine learning microservices, and MongoDB document databases.'
    )
    
    p_arch_img = doc.paragraphs[p_impl_idx + 2]
    p_arch_img.text = ''
    run_arch = p_arch_img.add_run()
    run_arch.add_picture(arch_img_path, width=Inches(6.2))
    p_arch_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
    
    p_arch_cap = doc.paragraphs[p_impl_idx + 3]
    p_arch_cap.text = 'Figure 4.1: Complete 3-Tier MVC System Architecture Diagram.'
    p_arch_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_arch_cap.runs[0].font.italic = True
    p_arch_cap.runs[0].font.size = Pt(9.5)

# Save updated Word Document
output_path = r'D:\Unified_Healthcare_Project_Report.docx'
doc.save(output_path)
print(f'Successfully updated and saved document to {output_path}!')
