import docx
import subprocess

subprocess.run(['taskkill', '/F', '/IM', 'WINWORD.EXE'], capture_output=True)

doc_path = r'D:\Unified_Healthcare_Project_Report.docx'
doc = docx.Document(doc_path)

# Precise mapping for every heading in Chapter 4
heading_map = {
    221: '4.1 USER PORTALS & MULTILINGUAL PRESENTATION LAYER',
    260: '4.1.1 Digital ABHA ID Integration & Multilingual Support',
    281: '4.2 UNIFIED EHR & EMERGENCY INTER-HOSPITAL REFERRAL ENGINE',
    298: '4.3 MACHINE LEARNING TRIAGE & WORKLOAD RISK MICROSERVICE',
    313: '4.3.1 Appointment Urgency Triage Prediction Model',
    335: '4.3.2 ML Model Evaluation & Performance Metrics',
    356: '4.2.1 Inter-Hospital Referral & Emergency Data Sharing',
    371: '4.3.3 Doctor Workload Risk Scoring & Schedule Balancing',
    391: '4.4 MATERNAL & CHILD IMMUNIZATION TRACKING MODULE',
    406: '4.4.1 Child Immunization Milestone Tracker & Reminders',
    428: '4.5 CORE REST API & SECURITY INFRASTRUCTURE'
}

for idx, p in enumerate(doc.paragraphs):
    if idx in heading_map:
        p.text = heading_map[idx]
        print(f'P{idx} -> {p.text}')

doc.save(doc_path)
print('Successfully saved perfectly structured Chapter 4 headings!')
