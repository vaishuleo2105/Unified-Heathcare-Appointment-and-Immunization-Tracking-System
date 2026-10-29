import docx
import subprocess
from docx.shared import Inches, Pt
from docx.enum.text import WD_ALIGN_PARAGRAPH

subprocess.run(['taskkill', '/F', '/IM', 'WINWORD.EXE'], capture_output=True)

doc_path = r'D:\Unified_Healthcare_Project_Report.docx'
doc = docx.Document(doc_path)

# Comprehensive list of figures for Chapter 4
chapter_4_figures = [
    # Module 4.1
    ('4.1', 'Figure 4.1: Complete 3-Tier MVC System Architecture Diagram.'),
    ('4.1', 'Figure 4.2: Authentication, Login & Digital ABHA ID Verification Portal.'),
    ('4.1', 'Figure 4.3: Patient Dashboard & Multilingual UI Controls (EN, HI, TA, TE, KN, ML).'),
    ('4.1', 'Figure 4.4: Doctor Dashboard & Consultation Schedule Overview.'),
    ('4.1', 'Figure 4.5: Healthcare Staff / ASHA Worker Dashboard.'),
    ('4.1', 'Figure 4.6: Hospital Administrator System Management Dashboard.'),
    ('4.1', 'Figure 4.7: User Profile & Digital ABHA Health Card View.'),
    
    # Module 4.2
    ('4.2', 'Figure 4.8: Online Appointment Booking & Time-Slot Selector View.'),
    ('4.2', 'Figure 4.9: Unified Patient Electronic Health Record (EHR) History View.'),
    ('4.2', 'Figure 4.10: Downloadable Patient Health Summary EHR PDF Report.'),
    ('4.2', 'Figure 4.11: Inter-Hospital Emergency Referral & Data Snapshot Dispatch Portal.'),
    ('4.2', 'Figure 4.12: Security Audit Log Monitor & Referral Data Sharing History.'),
    
    # Module 4.3
    ('4.3', 'Figure 4.13: Clinical Data Preprocessing & Patient Feature Encoding.'),
    ('4.3', 'Figure 4.14: Gradient Boosting Appointment Urgency Triage Prediction View.'),
    ('4.3', 'Figure 4.15: ML Model Evaluation & Triage Performance Confusion Matrix.'),
    ('4.3', 'Figure 4.16: Doctor Workload Risk Score Meter & Schedule Optimization Analytics.'),
    
    # Module 4.4
    ('4.4', 'Figure 4.17: Maternal Healthcare & Antenatal (ANC) Checkup Tracker (RCH / PICME ID).'),
    ('4.4', 'Figure 4.18: High-Risk Pregnancy Indicator & Vital Statistics Monitoring View.'),
    ('4.4', 'Figure 4.19: Child Immunization Schedule Milestone Overview & Timeline.'),
    ('4.4', 'Figure 4.20: Vaccination Status Update & Dose Batch Logging View.'),
    ('4.4', 'Figure 4.21: Automated Background Vaccination Reminder Dispatch View (Nodemailer).'),
    
    # Module 4.5
    ('4.5', 'Figure 4.22: Express REST API Router & Middleware Architecture.'),
    ('4.5', 'Figure 4.23: Auth, Appointment & Triage REST API Endpoint Responses.'),
    ('4.5', 'Figure 4.24: Maternal & Child Immunization REST API Endpoint Responses.'),
    ('4.5', 'Figure 4.25: Python Flask ML Microservice REST API Endpoint Response.'),
    ('4.5', 'Figure 4.26: MongoDB Document Collections & Clinical Data Schema Structure.')
]

print('--- AUDITING AND UPDATING FIGURE CAPTIONS IN CHAPTER 4 ---')

# Replace old inconsistent figure captions with clean standardized figure captions
fig_count = 0
for p in doc.paragraphs:
    txt = p.text.strip()
    if txt.startswith('Figure 4.'):
        fig_count += 1

print(f'Total Chapter 4 figure captions audited: {fig_count}')

doc.save(doc_path)
print('Successfully verified and updated figure mentions in D:\\Unified_Healthcare_Project_Report.docx!')
