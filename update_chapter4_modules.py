import docx
import subprocess

# Ensure Word is closed
subprocess.run(['taskkill', '/F', '/IM', 'WINWORD.EXE'], capture_output=True)

doc_path = r'D:\Unified_Healthcare_Project_Report.docx'
doc = docx.Document(doc_path)

# Map old heading patterns to new grouped module headings
heading_updates = {
    '4.1 HOME / DASHBOARD': '4.1 USER PORTALS & MULTILINGUAL PRESENTATION LAYER',
    '4.2 ADMINISTRATOR MODULE': '',  # Merge into 4.1
    '4.3 DOCTOR & PATIENT PORTAL': '',  # Merge into 4.1
    '4.4 UNIFIED MEDICAL HISTORY': '4.2 UNIFIED EHR & EMERGENCY INTER-HOSPITAL REFERRAL ENGINE',
    '4.5 CLINICAL DATA PREPROCESSING': '4.4 MACHINE LEARNING TRIAGE & WORKLOAD RISK MICROSERVICE',
    '4.6 APPOINTMENT TYPE PREDICTION': '',  # Merge into 4.4
    '4.7 ML MODEL EVALUATION': '',  # Merge into 4.4
    '4.8 INTER-HOSPITAL REFERRAL': '',  # Merge into 4.2
    '4.9 DOCTOR WORKLOAD RISK': '',  # Merge into 4.4
    '4.10 MATERNAL & CHILD HEALTHCARE': '4.3 MATERNAL & CHILD IMMUNIZATION TRACKING MODULE',
    '4.11 CHILD IMMUNIZATION TRACKING': '',  # Merge into 4.3
    '4.12 REST API & ML MICROSERVICE': '4.5 CORE REST API & SECURITY INFRASTRUCTURE'
}

for p in doc.paragraphs:
    txt = p.text.strip().upper()
    if txt.startswith('4.'):
        for old_pattern, new_heading in heading_updates.items():
            if old_pattern in txt:
                if new_heading:
                    p.text = new_heading
                    print('Updated Heading ->', new_heading)
                else:
                    # Make into a clean subsection title without number
                    sub_title = txt.split(' ', 1)[1] if ' ' in txt else txt
                    p.text = sub_title.title()
                    print('Converted Subheading ->', p.text)
                break

doc.save(doc_path)
print('Successfully updated Chapter 4 module headings in D:\\Unified_Healthcare_Project_Report.docx!')
