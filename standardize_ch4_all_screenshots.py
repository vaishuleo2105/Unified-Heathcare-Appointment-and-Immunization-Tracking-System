import docx
import subprocess

subprocess.run(['taskkill', '/F', '/IM', 'WINWORD.EXE'], capture_output=True)

doc_path = r'D:\Unified_Healthcare_Project_Report.docx'
doc = docx.Document(doc_path)

# Map old figure paragraph indices to clean standardized sequential captions
figure_updates = {
    220: 'Figure 4.1: Complete 3-Tier MVC System Architecture Diagram.',
    243: 'Figure 4.2: Authentication, Login & Digital ABHA ID Verification Portal.',
    245: 'Figure 4.3: Patient Dashboard & Multilingual Regional Language Controls (EN, HI, TA, TE, KN, ML).',
    259: 'Figure 4.4: Hospital Administrator System Management Module.',
    279: 'Figure 4.5: Doctor & Patient Consultation Portal Overview.',
    297: 'Figure 4.6: Unified Patient Electronic Health Record (EHR) History View.',
    312: 'Figure 4.7: Clinical Data Preprocessing & Feature Encoding Pipeline.',
    333: 'Figure 4.8: Gradient Boosting Appointment Urgency Triage Prediction View.',
    354: 'Figure 4.9: Machine Learning Model Classification & Performance Evaluation.',
    369: 'Figure 4.10: Inter-Hospital Emergency Referral & Data Snapshot Dispatch Portal.',
    388: 'Figure 4.11: Doctor Workload Risk Score Meter & Schedule Optimization Analytics.',
    404: 'Figure 4.12: Maternal Healthcare & Antenatal Checkup Tracker (RCH / PICME ID).',
    420: 'Figure 4.13: Child Immunization Tracker Overview & Milestone Schedule.',
    422: 'Figure 4.14: Child Vaccination Schedule Timeline & Milestone Tracker.',
    424: 'Figure 4.15: Vaccination Status Update & Dose Batch Logging View.',
    426: 'Figure 4.16: Automated Background Vaccination Reminder View (Nodemailer).',
    446: 'Figure 4.17: Express REST API Service Architecture & Middleware Pipeline.',
    448: 'Figure 4.18: Appointment Booking & Triage REST API Endpoint Responses.',
    450: 'Figure 4.19: Maternal Healthcare & Immunization REST API Endpoint Responses.',
    452: 'Figure 4.20: Python Flask ML Microservice Endpoint Response.',
    454: 'Figure 4.21: MongoDB Document Collections & Clinical Data Schema Structure.'
}

updated_count = 0
for idx, p in enumerate(doc.paragraphs):
    if idx in figure_updates:
        p.text = figure_updates[idx]
        p.runs[0].font.italic = True
        updated_count += 1
        print(f'P{idx} -> {p.text}')

doc.save(doc_path)
print(f'Successfully standardized {updated_count} figure captions in D:\\Unified_Healthcare_Project_Report.docx!')
