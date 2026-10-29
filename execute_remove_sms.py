import docx
import re
from docx.shared import Pt
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
import sys

sys.stdout.reconfigure(encoding='utf-8')

doc_path = r'D:\Unified_Healthcare_Project_Report (1).docx'
doc = docx.Document(doc_path)
print(f"Loaded {len(doc.paragraphs)} paragraphs and {len(doc.tables)} tables.")

def set_run_arial(run, font_size_pt=11.5):
    run.font.name = 'Arial'
    run.font.size = Pt(font_size_pt)
    r = run._element
    rPr = r.get_or_add_rPr()
    rFonts = rPr.find(qn('w:rFonts'))
    if rFonts is None:
        rFonts = OxmlElement('w:rFonts')
        rPr.insert(0, rFonts)
    rFonts.set(qn('w:ascii'), 'Arial')
    rFonts.set(qn('w:hAnsi'), 'Arial')
    rFonts.set(qn('w:cs'), 'Arial')

def update_para(p, new_text, font_size_pt=11.5):
    if 'w:drawing' in p._element.xml:
        return
    for r in list(p.runs):
        p._element.remove(r._element)
    run = p.add_run(new_text)
    set_run_arial(run, font_size_pt)
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY

# 1. Update Paragraphs with clean, SMS-free, Telegram & Email text
p_sms_updates = {
    43: (
        "For urgent inter-hospital transfers, an emergency referral data exchange securely transmits structured diagnostic "
        "summaries, current medications, and known allergies between healthcare facilities in real time. Maternal care is "
        "tracked across trimesters using government-issued RCH / PICME registration identifiers, while an automated pediatric "
        "engine calculates developmental vaccine milestones from birth onward. A proactive notification infrastructure combines "
        "node-cron background daemons with real-time Telegram push alerts and structured HTML emails to deliver timely booking "
        "receipts, 24-hour visit reminders, and dose schedules. An intelligent cancellation protocol captures patient-provided "
        "reasons, updates clinic dashboards immediately, and recycles the freed consultation slot for waiting patients."
    ),
    79: (
        "Operational continuity is fortified by a multi-channel communication infrastructure. The platform pairs automated "
        "node-cron schedule listeners with instantaneous push alerts dispatched across Telegram bot feeds and structured HTML emails. "
        "Patients can easily link their Telegram handle during account setup or profile management to receive real-time schedule "
        "updates. When cancellations occur, the platform captures explicit patient justifications, immediately releases the reserved "
        "slot for waiting patients, and alerts clinic personnel, ensuring optimal hospital resource utilization."
    ),
    85: (
        "Specific engineering objectives include: (1) Constructing an intelligent cancellation engine that captures structured patient "
        "reasoning, immediately recycles open appointment slots, and updates clinical staff; (2) Establishing a real-time notification "
        "pipeline combining Telegram bot push alerts and responsive HTML emails for instantaneous booking confirmations and scheduled "
        "reminders; and (3) Integrating government RCH tracking with pediatric vaccination milestone calculators to safeguard child health."
    ),
    92: (
        "Within preventive healthcare, the platform encompasses maternal health registries linked to government RCH references and an "
        "automated pediatric immunization engine that calculates developmental vaccination milestones. Notification gateways dispatch "
        "automated reminders via background cron tasks, direct Telegram bot notifications, and transactional emails. The clinical "
        "intelligence layer incorporates an asynchronous Python Flask microservice executing Gradient Boosting Classifiers for symptom "
        "triage and doctor workload risk scoring. Comprehensive security practices, including bcrypt password salting, JSON Web Token "
        "validation, and encrypted payload transmission, govern all system transactions."
    ),
    113: (
        "To overcome these operational barriers, the platform deploys an automated notification gateway managed by background scheduler "
        "workers and dedicated communication services. The framework dispatches real-time booking confirmations, 24-hour reminder alerts, "
        "and cancellation notices across two synchronized channels: real-time Telegram bot push messages and structured HTML emails. "
        "Patients can link their Telegram account during onboarding or update preferences via their profile, ensuring dependable message "
        "delivery. Furthermore, when an appointment is cancelled, the application requires a clear cancellation justification (via "
        "pre-configured reason chips or custom input), immediately recycles the open slot back into the doctor's available pool, and "
        "dispatches real-time notifications to the affected physician and clinic staff."
    ),
    125: "Pediatric immunization tracking with automated milestone calculation and multi-channel Telegram bot and email reminders.",
    166: (
        "Algorithm 2: Automated Notification & Reasoned Cancellation Dispatch\n"
        "----------------------------------------------------------------------------------------------------\n"
        "Input: Appointment ID aid, User Session U, Cancellation Reason R, Channel Config NOTIFICATION_CHANNEL\n"
        "Output: Atomic database status transition, Slot state reset, Dispatched notification receipts\n"
        "1: Retrieve Appointment record A from MongoDB using aid\n"
        "2: If A.status == 'Cancelled' or (CurrentTime > A.appointmentTime - 24 hours), reject request with 400 Policy Error\n"
        "3: Update Appointment in MongoDB: A.status = 'Cancelled', A.cancellationReason = R,\n"
        "   A.cancelledBy = U._id, A.cancelledAt = CurrentTimestamp\n"
        "4: Update Doctor Slot record: Set isBooked = false to immediately release slot for other patients\n"
        "5: Compile message template stating Patient Name, Doctor, Date, Time, and Cancellation Reason R\n"
        "6: If NOTIFICATION_CHANNEL in ['both', 'telegram'] and U.telegramChatId exists:\n"
        "       Dispatch instant interactive push alert via Telegram Bot API (telegramService.js)\n"
        "7: If NOTIFICATION_CHANNEL in ['both', 'email']:\n"
        "       Render responsive HTML template; Dispatch email via Nodemailer SMTP to Patient, Doctor & Staff\n"
        "8: Return HTTP 200 { success: true, message: 'Appointment cancelled and alerts dispatched' }\n"
        "----------------------------------------------------------------------------------------------------"
    ),
    180: "Automated background schedulers (node-cron) continuously evaluate upcoming due dates to dispatch Telegram bot and email alerts.",
    211: "Step 8 – Reminder Dispatch: Background scheduler triggers automated reminders via Telegram bot push alerts and rich HTML email.",
    235: (
        "This chapter documents the concrete engineering realization, component integration, and programmatic execution of the Unified "
        "Healthcare platform. It details the end-to-end implementation across the React 18 presentation layer, Node.js and Express.js REST "
        "API services, Python Flask machine learning microservices, and MongoDB Atlas persistence. Crucial focus is placed on the deployment "
        "of interactive appointment cancellation reasoning, real-time Telegram bot push notifications, rich HTML email gateways, and emergency "
        "inter-hospital referral protocols."
    ),
    444: (
        "When an infant is registered under the mother's RCH profile, a standardized immunization calendar is generated. Healthcare workers "
        "log administered doses with batch numbers and administration timestamps. An automated background scheduler (reminderScheduler.js) "
        "powered by node-cron routinely evaluates upcoming dose deadlines, dispatching instant push notifications via Telegram bot and "
        "structured HTML emails."
    ),
    463: "Figure 4.18 exhibits the automated background notification service delivering scheduled vaccination reminders and appointment alerts through Telegram bot push alerts and email.",
    509: (
        "Inter-service communication was thoroughly tested across the full application stack: React frontend components dispatching booking "
        "requests to Express REST endpoints, validating against MongoDB collections, executing asynchronous Flask ML triage predictions, and "
        "triggering simultaneous Telegram bot push notifications and email alerts."
    ),
    529: (
        "By uniting portable electronic medical records, predictive clinical intelligence, maternal-child health tracking, and proactive "
        "notifications (Telegram bot and email), the system establishes a dependable technological foundation for modern digital healthcare delivery."
    )
}

updated_paras = 0
for idx, text in p_sms_updates.items():
    if idx < len(doc.paragraphs):
        update_para(doc.paragraphs[idx], text, font_size_pt=11.5)
        updated_paras += 1
print(f"Updated {updated_paras} paragraphs to remove SMS references.")

# 2. Update Tables:
# Table 1: Row 14 & Row 15
t1 = doc.tables[1]
t1.rows[14].cells[0].text = "Telegram Bot API"
t1.rows[14].cells[1].text = (
    "Cloud-based messaging interface providing instantaneous push alerts for appointment booking receipts, 24-hour schedule "
    "reminders, dynamic cancellation notices, and child vaccination milestones. Selection Justification: Chosen for its zero per-message "
    "operational cost, sub-second delivery latency, robust encryption, and frictionless one-click account linking directly within the user "
    "profile without requiring carrier SMS credits."
)

t1.rows[15].cells[0].text = "Telegram & Email Alert Gateway"
t1.rows[15].cells[1].text = (
    "Centralized backend service (telegramService.js and reminderScheduler.js) orchestrating automated, parallel alert dispatches across "
    "Telegram bot push channels and styled HTML email (Nodemailer). Selection Justification: Guarantees dependable notification delivery: "
    "real-time Telegram bot alerts provide instant push updates with zero cost, while responsive HTML emails provide formal, documented "
    "clinical visit receipts."
)
print("Updated Table 1 (Rows 14 & 15) for Telegram & Email.")

# Table 2: Functional Requirements Row 17
t2 = doc.tables[2]
for row in t2.rows:
    if "SMS" in row.cells[1].text or "Dual-Mode" in row.cells[1].text:
        row.cells[1].text = "Telegram and Email Notifications"
        row.cells[2].text = (
            "The system shall deliver real-time push alerts via Telegram bot and styled HTML emails (via Nodemailer) for appointment "
            "confirmations, 24-hour visit reminders, and reasoned cancellations."
        )
        print("Updated Table 2 (FR Notification requirement).")

# Table 3: Non-Functional Requirements Row 8
t3 = doc.tables[3]
for row in t3.rows:
    if "SMS" in row.cells[2].text or "telecom" in row.cells[2].text:
        row.cells[2].text = row.cells[2].text.replace("SMS gateways", "WhatsApp gateways").replace("carrier SMS", "push notifications")
        print("Updated Table 3 NFR.")

# Table 5: Test Cases Row 20
t5 = doc.tables[5]
for row in t5.rows:
    if "SMS" in row.cells[1].text or "Dual-Mode Notification" in row.cells[1].text:
        row.cells[1].text = "Telegram & Email Notification Dispatch"
        row.cells[2].text = (
            "Trigger appointment booking and 24h reminder; system delivers Telegram bot push alert to linked user and HTML email to "
            "patient and doctor successfully."
        )
        print("Updated Table 5 (Test Cases).")

# Save document
updated_doc_path = r'D:\Unified_Healthcare_Project_Report_Updated.docx'
try:
    doc.save(doc_path)
    print(f"Successfully saved SMS-free document to: {doc_path}")
except PermissionError:
    doc.save(updated_doc_path)
    print(f"Word has '{doc_path}' open. Successfully saved SMS-free document to: {updated_doc_path}")
