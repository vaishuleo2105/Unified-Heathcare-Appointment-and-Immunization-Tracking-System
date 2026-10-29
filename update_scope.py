import docx
import subprocess

# Ensure Word is closed so write permission is available
subprocess.run(['taskkill', '/F', '/IM', 'WINWORD.EXE'], capture_output=True)

doc_path = r'D:\Unified_Healthcare_Project_Report.docx'
doc = docx.Document(doc_path)

# Locate 1.3 SCOPE OF THE PROJECT
p_scope_idx = None
for i, p in enumerate(doc.paragraphs):
    if '1.3 SCOPE OF THE PROJECT' in p.text:
        p_scope_idx = i
        break

if p_scope_idx is not None:
    p1 = (
        'The scope of this project encompasses a full-stack MERN (MongoDB, Express.js, React.js, Node.js) web application '
        'serving four distinct user roles: Patients, Doctors, Hospital Staff, and Hospital Administrators. The core functionality '
        'centers on a consolidated electronic health record (EHR) module that tracks patient diagnoses, active prescriptions, '
        'laboratory results, and documented allergies across participating facilities. Additionally, the scope includes an '
        'inter-hospital referral data transfer module that allows emergency medical summaries to be shared instantly between '
        'hospitals during critical care patient transfers, alongside digital health identity verification using national ABHA Sandbox API standards.'
    )
    p2 = (
        'To support preventive healthcare delivery, the system includes dedicated maternal health tracking linked with government-issued '
        'RCH / PICME registration IDs, as well as a child immunization tracking module featuring automated dose milestone scheduling '
        'and background node-cron email reminders. Accessibility is enhanced through multi-language UI localization across six regional '
        'languages (English, Hindi, Tamil, Telugu, Kannada, and Malayalam). Furthermore, the scope integrates a Python Flask Machine '
        'Learning microservice executing trained Gradient Boosting Classifiers to predict appointment urgency triage types and compute '
        'clinical doctor workload risk scores (0-100) for schedule optimization. All data transactions are secured using JSON Web '
        'Tokens (JWT), bcryptjs password hashing, and role-based access control.'
    )
    p3 = (
        'The present scope is based on the implemented MERN and Flask application. Advanced capabilities such as AI-driven radiology '
        'image diagnosis, wearable IoT health data syncing, and cloud microservice deployment are identified as future enhancements.'
    )
    
    # Replace bullet paragraphs with continuous text
    doc.paragraphs[p_scope_idx + 1].text = p1
    doc.paragraphs[p_scope_idx + 2].text = p2
    doc.paragraphs[p_scope_idx + 3].text = p3
    
    # Clear remaining bullet lines (from p_scope_idx + 4 up to before 1.4)
    for j in range(p_scope_idx + 4, p_scope_idx + 15):
        if j < len(doc.paragraphs) and not doc.paragraphs[j].text.startswith('1.4'):
            doc.paragraphs[j].text = ''

    doc.save(doc_path)
    print('Successfully removed bullet points in Section 1.3 Scope of the Project!')
