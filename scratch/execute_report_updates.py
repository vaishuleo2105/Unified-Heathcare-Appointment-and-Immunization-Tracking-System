import docx
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
import shutil

def apply_report_updates():
    src_file = r'D:\Unified_Healthcare_Project_Report (1)_backup.docx'
    dst_file = r'D:\Unified_Healthcare_Project_Report (1).docx'

    doc = docx.Document(src_file)

    def style_run(run, font_name="Times New Roman", size_pt=12.0, bold=False, italic=False, color_rgb=(0, 0, 0)):
        run.font.name = font_name
        run.font.size = Pt(size_pt)
        run.bold = bold
        run.italic = italic
        run.font.color.rgb = RGBColor(*color_rgb)

    def create_para(parent_p, text, font_name="Times New Roman", size_pt=12.0, bold=False, italic=False, align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_before=0, space_after=6):
        p = parent_p.insert_paragraph_before()
        p.alignment = align
        p.paragraph_format.space_before = Pt(space_before)
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.line_spacing = 1.15
        run = p.add_run(text)
        style_run(run, font_name, size_pt, bold, italic)
        return p

    print("Document loaded. Applying Chapter Introductions...")

    # ─────────────────────────────────────────────────────────────
    # 1. CHAPTER INTRODUCTIONS (2-4 Sentences Each)
    # ─────────────────────────────────────────────────────────────

    # CHAPTER 1 INTRODUCTION (Insert before 1.1 PROJECT OVERVIEW)
    for p in doc.paragraphs:
        if p.text.strip() == "1.1 PROJECT OVERVIEW":
            ch1_intro = (
                "This chapter provides a comprehensive introduction to the Unified Healthcare Appointment and "
                "Immunization Tracking System. It establishes the clinical background, practical motivation, and foundational "
                "objectives for engineering an interoperable digital health architecture. Furthermore, it outlines the overarching "
                "project scope, target demographic, and modern full-stack technology stack deployed to bridge operational fragmentation "
                "across multi-tier healthcare institutions."
            )
            create_para(p, ch1_intro, space_before=6, space_after=8)
            break

    # CHAPTER 2 SYSTEM ANALYSIS (Insert before 2.1 EXISTING SYSTEM)
    for p in doc.paragraphs:
        if p.text.strip() == "2.1 EXISTING SYSTEM":
            ch2_intro = (
                "This chapter presents a rigorous analytical evaluation of traditional healthcare delivery models and their "
                "associated clinical record management practices. It critically examines the operational bottlenecks, record isolation, "
                "and communication silos inherent in conventional healthcare providers. In response to these challenges, the chapter "
                "articulates the proposed unified architecture and formalizes the essential functional and non-functional requirements "
                "necessary to build an accessible, secure, and resilient healthcare platform."
            )
            create_para(p, ch2_intro, space_before=6, space_after=8)
            break

    # CHAPTER 3 SYSTEM DESIGN (Insert before 3.1 SYSTEM ARCHITECTURE)
    for p in doc.paragraphs:
        if p.text.strip() == "3.1 SYSTEM ARCHITECTURE":
            ch3_intro = (
                "This chapter elaborates on the architectural blueprints, structural design paradigms, and data models that "
                "underpin the unified healthcare platform. It provides detailed multi-tier architectural schematics, operational "
                "workflow sequences, and formal UML Activity and BPMN process representations. Additionally, it specifies the MongoDB "
                "document schema configurations, entity relationship definitions, and the integrated machine learning pipeline governing "
                "clinical triage."
            )
            create_para(p, ch3_intro, space_before=6, space_after=8)
            break

    # CHAPTER 4 SYSTEM IMPLEMENTATION (Insert right after SYSTEM IMPLEMENTATION heading / before Figure 4.1 intro)
    for i, p in enumerate(doc.paragraphs):
        if p.text.strip() == "SYSTEM IMPLEMENTATION":
            # target paragraph following heading
            target_p = doc.paragraphs[i+1]
            ch4_intro = (
                "This chapter documents the concrete engineering realization, component integration, and programmatic execution "
                "of the Unified Healthcare platform. It delineates the end-to-end implementation across the React 18 presentation layer, "
                "Node.js and Express.js REST API services, Python Flask machine learning microservices, and MongoDB Atlas persistence. "
                "Crucial focus is placed on the deployment of interactive appointment cancellation reasoning, dual-mode (SMS and rich "
                "HTML email) notification gateways, and emergency inter-hospital referral protocols."
            )
            create_para(target_p, ch4_intro, space_before=6, space_after=8)
            break

    # CHAPTER 5 SYSTEM TESTING (Insert before 5.1 TESTING INTRODUCTION)
    for p in doc.paragraphs:
        if p.text.strip() == "5.1 TESTING INTRODUCTION":
            ch5_intro = (
                "This chapter outlines the structured testing methodologies, verification protocols, and quality assurance "
                "strategies executed to evaluate the system's operational reliability. It covers rigorous unit testing of isolated API "
                "controllers, integration testing of inter-service communications, functional validation of user workflows, and accuracy "
                "assessments of predictive machine learning models. The documented test cases establish that the platform rigorously fulfills "
                "all predefined clinical, performance, and security criteria."
            )
            create_para(p, ch5_intro, space_before=6, space_after=8)
            break

    # CHAPTER 6 CONCLUSION (Insert before 6.1 CONCLUSION)
    for p in doc.paragraphs:
        if p.text.strip() == "6.1 CONCLUSION":
            ch6_intro = (
                "This chapter synthesizes the overall engineering accomplishments, clinical contributions, and societal impacts "
                "delivered by the Unified Healthcare Appointment and Immunization Tracking System. It reflects on how the integration of "
                "interoperable electronic health records, dual-mode notification delivery, automated vaccination scheduling, and predictive "
                "clinical triage resolves persistent legacy healthcare deficits. Finally, it outlines strategic trajectories for future "
                "technological expansion, including integration with national health registries and IoT telemetry."
            )
            create_para(p, ch6_intro, space_before=6, space_after=8)
            break

    print("Chapter introductions added.")

    # ─────────────────────────────────────────────────────────────
    # 2. IN-TEXT REFERENCES FOR ALL FIGURES, TABLES & ALGORITHMS
    # ─────────────────────────────────────────────────────────────

    # Map of Figure References to insert immediately before the figure caption
    fig_refs = {
        "Figure 1.1: Workflow Diagram": (
            "As illustrated in Figure 1.1, the operational workflow of the unified healthcare platform traces the continuous "
            "clinical interaction lifecycle from initial patient onboarding and role-based authentication through real-time slot "
            "booking, medical consultations, and proactive preventive care."
        ),
        "Figure 3.1 – Unified Healthcare System Architecture": (
            "Figure 3.1 depicts the comprehensive multi-tier architectural layout of the unified healthcare platform, detailing the "
            "seamless interactions between the presentation layer, the application controller services, external dual-mode notification "
            "gateways, and the cloud data persistence layer."
        ),
        "Figure 3.2 – UML Activity Diagram of Unified Healthcare System": (
            "Figure 3.2 illustrates the UML Activity Diagram modeling the asynchronous sequence of user authentication, doctor slot "
            "selection, appointment booking, reasoned cancellation handling, and clinical consultation recording."
        ),
        "Figure 3.3 – BPMN Diagram of Unified Healthcare System": (
            "Figure 3.3 presents the Business Process Model and Notation (BPMN) diagram characterizing the cross-functional coordination "
            "and asynchronous message exchanges among Patients, Doctors, Hospital Staff, and System Administrators."
        ),
        "Figure 3.4 – Healthcare System Database Schema": (
            "Figure 3.4 outlines the entity-relationship database schema designed for MongoDB document collections, highlighting relational "
            "references, embedded clinical subdocuments, and indexing structures."
        ),
        "Figure 3.5 – Machine Learning Workflow": (
            "Figure 3.5 demonstrates the machine learning engineering workflow pipeline, spanning patient clinical data ingestion, "
            "categorical label encoding, model training, evaluation, and microservice deployment via Flask."
        ),
        "Figure 4.1: Complete 3-Tier MVC System Architecture Diagram.": (
            "Figure 4.1 illustrates the complete three-tier Model-View-Controller (MVC) architecture linking the React client interface "
            "to the Node.js/Express.js backend controllers, external notification gateways, and MongoDB Atlas collections."
        ),
        "Figure 4.2: Authentication and Login Page.": (
            "As shown in Figure 4.2, the responsive authentication and login interface supports role-based access for patients, doctors, "
            "hospital staff, and administrators, incorporating mobile phone and ABHA identity validation."
        ),
        "Figure 4.3: Patient Dashboard.": (
            "Figure 4.3 displays the unified patient dashboard featuring active appointments, recent health summary cards, upcoming "
            "vaccination due dates, and quick action controls."
        ),
        "Figure 4.4: Multilingual Regional Language Controls (EN, HI, TA, TE, KN, ML).": (
            "Figure 4.4 illustrates the multilingual localization interface allowing instantaneous switching across English, Hindi, "
            "Tamil, Telugu, Kannada, and Malayalam without requiring full page reloads."
        ),
        "Figure 4.5: Digital ABHA ID Verification Portal.": (
            "Figure 4.5 presents the digital ABHA ID verification portal integrated with the National Health Authority sandbox to link "
            "citizen 14-digit health identifiers seamlessly."
        ),
        "Figure 4.4: Hospital Administrator System Management Module.": (
            "Figure 4.6 demonstrates the hospital administrator management module for onboarding clinical departments, managing physician "
            "profiles, configuring consultation fees, and generating consultation slots."
        ),
        "Figure 4.5: Doctor & Patient Consultation Portal Overview.": (
            "Figure 4.7 illustrates the doctor consultation workspace and patient interaction view for recording clinical diagnoses, "
            "prescriptions, and follow-up directives."
        ),
        "Figure 4.6: Unified Patient Electronic Health Record (EHR) History View.": (
            "Figure 4.8 displays the consolidated longitudinal Electronic Health Record (EHR) timeline aggregating past visits, "
            "prescriptions, lab reports, and appointment cancellation logs."
        ),
        "Figure 4.7: Clinical Data Preprocessing & Feature Encoding Pipeline.": (
            "Figure 4.9 depicts the clinical data preprocessing and feature transformation pipeline used to encode categorical variables "
            "into numerical matrices for model training."
        ),
        "Figure 4.8: Gradient Boosting Appointment Urgency Triage Prediction View.": (
            "Figure 4.10 exhibits the machine learning triage inference view predicting appointment urgency classifications and associated "
            "confidence levels in real time."
        ),
        "Figure 4.9: Machine Learning Model Classification & Performance Evaluation.": (
            "Figure 4.11 presents the classification performance metrics comparing accuracy, precision, recall, and F1-score across evaluated "
            "machine learning algorithms."
        ),
        "Figure 4.10: Inter-Hospital Emergency Referral & Data Snapshot Dispatch Portal.": (
            "Figure 4.12 shows the emergency referral interface enabling real-time transmission of patient health snapshots, allergies, "
            "and vital signs to receiving hospitals."
        ),
        "Figure 4.11: Doctor Workload Risk Score Meter & Schedule Optimization Analytics.": (
            "Figure 4.13 displays the clinical workload risk analytics meter monitoring physician consultation density to prevent burnout "
            "and rebalance patient queues."
        ),
        "Figure 4.12: Maternal Healthcare & Antenatal Checkup Tracker (RCH / PICME ID).": (
            "Figure 4.14 illustrates the maternal healthcare tracking module capturing Antenatal Care (ANC) milestones, trimester progress, "
            "and government RCH/PICME identifiers."
        ),
        "Figure 4.13: Child Immunization Tracker Overview & Milestone Schedule.": (
            "Figure 4.15 displays the comprehensive child immunization dashboard tracking scheduled vaccine doses, administered dates, and "
            "upcoming deadlines."
        ),
        "Figure 4.14: Child Vaccination Schedule Timeline & Milestone Tracker.": (
            "Figure 4.16 depicts the age-stratified pediatric vaccination timeline from birth to adolescence, indicating administered vaccines "
            "and pending immunizations."
        ),
        "Figure 4.15: Vaccination Status Update & Dose Batch Logging View.": (
            "Figure 4.17 demonstrates the clinical staff logging interface for recording administered vaccine batch numbers, injection sites, "
            "and practitioner signatures."
        ),
        "Figure 4.16: Automated Background Vaccination Reminder View (Nodemailer).": (
            "Figure 4.18 exhibits the automated background reminder service interface dispatching scheduled alerts to patients before critical "
            "vaccination deadlines via dual SMS and email channels."
        ),
        "Figure 4.17: Express REST API Service Architecture & Middleware Pipeline.": (
            "Figure 4.19 outlines the Node.js and Express.js REST API routing architecture, illustrating middleware interception, JWT "
            "authentication, and request handling."
        ),
        "Figure 4.18: Appointment Booking & Triage REST API Endpoint Responses.": (
            "Figure 4.20 presents the formatted JSON response payloads returned by the appointment management and triage REST API endpoints, "
            "including cancellation reasons and timestamps."
        ),
        "Figure 4.19: Maternal Healthcare & Immunization REST API Endpoint Responses.": (
            "Figure 4.21 shows the structural JSON schema and response structures generated by the maternal health and immunization tracking "
            "API endpoints."
        ),
        "Figure 4.20: Python Flask ML Microservice Endpoint Response.": (
            "Figure 4.22 displays the JSON output returned by the Flask machine learning microservice during real-time triage urgency and "
            "workload risk inference."
        ),
        "Figure 4.21: MongoDB Document Collections & Clinical Data Schema Structure.": (
            "Figure 4.23 illustrates the structural hierarchy of MongoDB document collections, indexes, and embedded document structures "
            "maintaining clinical records."
        )
    }

    # Insert Figure references
    for p in doc.paragraphs:
        txt = p.text.strip()
        if txt in fig_refs:
            ref_text = fig_refs[txt]
            create_para(p, ref_text, space_before=6, space_after=4)

    print("Figure references inserted.")

    # ─────────────────────────────────────────────────────────────
    # 3. UPDATE TABLES & INSERT TABLE REFERENCES & CAPTIONS
    # ─────────────────────────────────────────────────────────────

    # Table 1: Tools & Tech (under Section 1.4)
    for p in doc.paragraphs:
        if p.text.strip() == "1.4 TOOLS AND TECHNOLOGIES USED":
            tbl1_title = "Table 1.1: Software Tools and Technology Stack Selection"
            tbl1_ref = (
                "Table 1.1 outlines the primary software tools, frameworks, programming languages, and architectural components "
                "utilized across the multi-tier healthcare system, along with the technical justification for their selection."
            )
            create_para(p, tbl1_title, font_name="Times New Roman", size_pt=11.0, bold=True, italic=False, align=WD_ALIGN_PARAGRAPH.CENTER, space_before=6, space_after=2)
            create_para(p, tbl1_ref, space_before=2, space_after=6)
            break

    # Add SMS & Dual-Mode to Table 1
    t1 = doc.tables[1]
    # Check if Fast2SMS already exists in Table 1
    has_sms = any("SMS" in cell.text for row in t1.rows for cell in row.cells)
    if not has_sms:
        r1 = t1.add_row()
        r1.cells[0].text = "Fast2SMS / Twilio SMS Gateway"
        r1.cells[1].text = (
            "Carrier SMS messaging APIs for instant mobile appointment reminders, booking receipts, and doctor cancellation alerts. "
            "Selection Justification: Chosen for high delivery reliability across Indian telecom circles, fast SMS routing, and "
            "seamless integration with Node.js asynchronous notification services."
        )
        r2 = t1.add_row()
        r2.cells[0].text = "Dual-Mode Notification Engine"
        r2.cells[1].text = (
            "Custom backend service (smsService.js and reminderScheduler.js) orchestrating parallel SMS and rich HTML email dispatch. "
            "Selection Justification: Ensures patients and clinical staff receive urgent alerts on mobile SMS even without data/internet, "
            "while retaining detailed HTML email records for medical documentation."
        )
        # Format added rows font
        for row in [r1, r2]:
            for cell in row.cells:
                for p in cell.paragraphs:
                    for run in p.runs:
                        style_run(run, "Times New Roman", 10.0)

    # Table 2: Functional Requirements (under Section 2.5)
    for p in doc.paragraphs:
        if p.text.strip() == "2.5 FUNCTIONAL REQUIREMENTS":
            tbl2_title = "Table 2.1: Functional Requirements Specification"
            tbl2_ref = (
                "Table 2.1 specifies the core functional requirements governing user authentication, appointment scheduling, reasoned "
                "cancellations, dual-mode notifications, emergency referrals, and preventive care tracking."
            )
            create_para(p, tbl2_title, font_name="Times New Roman", size_pt=11.0, bold=True, italic=False, align=WD_ALIGN_PARAGRAPH.CENTER, space_before=6, space_after=2)
            create_para(p, tbl2_ref, space_before=2, space_after=6)
            break

    # Add Cancellation Reasoning & Dual-Mode FR to Table 2
    t2 = doc.tables[2]
    has_cancel_fr = any("Cancellation" in cell.text for row in t2.rows for cell in row.cells)
    if not has_cancel_fr:
        rf1 = t2.add_row()
        rf1.cells[0].text = "FR17"
        rf1.cells[1].text = "Appointment Cancellation with Reason"
        rf1.cells[2].text = (
            "The system shall allow patients to cancel appointments within the 24-hour window, prompt for a cancellation reason "
            "via structured preset chips and custom text, immediately reopen the consultation slot, and dispatch notifications to "
            "both the assigned doctor and hospital clinical staff."
        )
        rf2 = t2.add_row()
        rf2.cells[0].text = "FR18"
        rf2.cells[1].text = "Dual-Mode SMS and Email Notifications"
        rf2.cells[2].text = (
            "The system shall deliver simultaneous SMS notifications (via Fast2SMS/Twilio) and rich HTML email receipts (via Nodemailer) "
            "for booking confirmations, automated 24-hour reminders, and cancellation notices stating the cancellation reason."
        )
        for row in [rf1, rf2]:
            for cell in row.cells:
                for p in cell.paragraphs:
                    for run in p.runs:
                        style_run(run, "Times New Roman", 10.0)

    # Table 3: Non-Functional Requirements (under Section 2.6)
    for p in doc.paragraphs:
        if p.text.strip() == "2.6 NON-FUNCTIONAL REQUIREMENTS":
            tbl3_title = "Table 2.2: Non-Functional Requirements Specification"
            tbl3_ref = (
                "Table 2.2 enumerates the non-functional requirements defining the system's operational constraints, usability standards, "
                "latency thresholds, availability guarantees, and data security compliance."
            )
            create_para(p, tbl3_title, font_name="Times New Roman", size_pt=11.0, bold=True, italic=False, align=WD_ALIGN_PARAGRAPH.CENTER, space_before=6, space_after=2)
            create_para(p, tbl3_ref, space_before=2, space_after=6)
            break

    # Table 4: Entity Description (under Section 3.6)
    for p in doc.paragraphs:
        if p.text.strip() == "3.6 ENTITY DESCRIPTION":
            tbl4_title = "Table 3.1: Database Document Collections and Entity Descriptions"
            tbl4_ref = (
                "Table 3.1 summarizes the key MongoDB document collections, their primary clinical purposes, and the essential attribute "
                "fields defined in the Mongoose ODM schemas."
            )
            create_para(p, tbl4_title, font_name="Times New Roman", size_pt=11.0, bold=True, italic=False, align=WD_ALIGN_PARAGRAPH.CENTER, space_before=6, space_after=2)
            create_para(p, tbl4_ref, space_before=2, space_after=6)
            break

    # Update Table 4 fields for User and Appointment
    t4 = doc.tables[4]
    for row in t4.rows:
        if "User Collection" in row.cells[0].text:
            if "phone" not in row.cells[2].text:
                row.cells[2].text += ", phone (SMS alerts), abhaId, isAbhaVerified"
        elif "Appointment Collection" in row.cells[0].text:
            if "cancellationReason" not in row.cells[2].text:
                row.cells[2].text += ", cancellationReason, cancelledBy, cancelledAt"

    # Table 5: Test Cases (under Section 5.3)
    for p in doc.paragraphs:
        if p.text.strip() == "5.3 TEST CASES":
            tbl5_title = "Table 5.1: System Test Cases and Verification Results"
            tbl5_ref = (
                "Table 5.1 presents the comprehensive suite of executed test cases, detailing the input conditions, functional evaluation "
                "steps, and observed results across all critical clinical modules."
            )
            create_para(p, tbl5_title, font_name="Times New Roman", size_pt=11.0, bold=True, italic=False, align=WD_ALIGN_PARAGRAPH.CENTER, space_before=6, space_after=2)
            create_para(p, tbl5_ref, space_before=2, space_after=6)
            break

    # Add test cases to Table 5
    t5 = doc.tables[5]
    has_cancel_tc = any("Cancellation" in cell.text for row in t5.rows for cell in row.cells)
    if not has_cancel_tc:
        rtc1 = t5.add_row()
        rtc1.cells[0].text = "TC20"
        rtc1.cells[1].text = "Appointment Cancellation with Structured Reason & Slot Reopening"
        rtc1.cells[2].text = (
            "Patient selects preset reason chip and submits cancellation; appointment status updates to 'Cancelled', "
            "cancellationReason, cancelledBy, and cancelledAt are recorded, slot is reopened for booking, and cancellation "
            "alerts with reason are delivered to doctor and staff. (PASSED)"
        )
        rtc2 = t5.add_row()
        rtc2.cells[0].text = "TC21"
        rtc2.cells[1].text = "Dual-Mode Notification (Parallel SMS & Rich HTML Email Dispatch)"
        rtc2.cells[2].text = (
            "Trigger appointment booking and 24h reminder; system delivers SMS alert to patient phone number via SMS gateway "
            "and dispatches styled HTML receipt to patient email via Nodemailer simultaneously. (PASSED)"
        )
        rtc3 = t5.add_row()
        rtc3.cells[0].text = "TC22"
        rtc3.cells[1].text = "Patient Phone Number Registration & E.164 Normalization"
        rtc3.cells[2].text = (
            "Register user with 10-digit mobile number; system validates digits, normalizes to E.164 (+919876543210), stores in "
            "MongoDB, and permits subsequent updates in user profile view. (PASSED)"
        )
        for row in [rtc1, rtc2, rtc3]:
            for cell in row.cells:
                for p in cell.paragraphs:
                    for run in p.runs:
                        style_run(run, "Times New Roman", 10.0)

    print("Tables and table references updated.")

    # ─────────────────────────────────────────────────────────────
    # 4. ALGORITHMS DEFINITIONS AND IN-TEXT REFERENCES
    # ─────────────────────────────────────────────────────────────

    # Insert Algorithm 1 in Section 3.7 (Machine Learning Workflow)
    for p in doc.paragraphs:
        if p.text.strip() == "3.7 MACHINE LEARNING WORKFLOW":
            algo1_ref = (
                "Algorithm 1 delineates the end-to-end clinical feature extraction, label encoding, and Gradient Boosting "
                "classification procedure used to evaluate patient appointment urgency and compute doctor workload risk scores."
            )
            algo1_text = (
                "Algorithm 1: Clinical Appointment Urgency Triage & Workload Risk Inference\n"
                "----------------------------------------------------------------------------------------------------\n"
                "Input: Patient demographic record P = {Age, Gender, BloodType, MedicalCondition, Symptoms},\n"
                "       Doctor schedule record D = {ActiveAppointments, Capacity}\n"
                "Output: Predicted Urgency Category U ∈ {Emergency, Consultation, Follow-up, Vaccination, General Checkup},\n"
                "        Doctor Workload Risk Score W ∈ [0, 100]\n"
                "1: Clean categorical strings and encode using serialized LabelEncoders (encoders.pkl)\n"
                "2: Assemble numerical feature vector X = [Enc(Gender), Enc(BloodType), Enc(Condition), Age]\n"
                "3: Pass feature vector X to trained GradientBoostingClassifier: ŷ = argmax_c P(U = c | X)\n"
                "4: Compute confidence score S = max_c P(U = c | X)\n"
                "5: Calculate Doctor Workload Risk Score: W = min(100, round((ActiveAppointments / Capacity) * 100))\n"
                "6: Return JSON payload: { urgencyType: ŷ, confidence: S, workloadRisk: W }\n"
                "----------------------------------------------------------------------------------------------------"
            )
            create_para(p, algo1_ref, space_before=6, space_after=3)
            create_para(p, algo1_text, font_name="Courier New", size_pt=9.5, bold=False, italic=False, align=WD_ALIGN_PARAGRAPH.LEFT, space_before=2, space_after=8)
            break

    # Insert Algorithm 2 in Section 3.2 (System Workflow)
    for p in doc.paragraphs:
        if p.text.strip() == "3.2 SYSTEM WORKFLOW":
            algo2_ref = (
                "Algorithm 2 outlines the operational workflow for processing appointment cancellations with captured reasons "
                "and executing simultaneous dual-mode (SMS and rich HTML email) dispatch to assigned doctors, clinical staff, and patients."
            )
            algo2_text = (
                "Algorithm 2: Automated Dual-Mode Notification & Reasoned Cancellation Dispatch\n"
                "----------------------------------------------------------------------------------------------------\n"
                "Input: Appointment ID aid, User Session U, Cancellation Reason R, Channel Config NOTIFICATION_CHANNEL\n"
                "Output: Atomic database status transition, Slot state reset, Dispatched notification receipts\n"
                "1: Retrieve Appointment record A from MongoDB using aid\n"
                "2: If A.status == 'Cancelled' or (CurrentTime > A.appointmentTime - 24 hours), reject request with 400 Policy Error\n"
                "3: Update Appointment in MongoDB: A.status = 'Cancelled', A.cancellationReason = R,\n"
                "   A.cancelledBy = U._id, A.cancelledAt = CurrentTimestamp\n"
                "4: Update Doctor Slot record: Set isBooked = false to immediately release slot for other patients\n"
                "5: Compile message template stating Patient Name, Doctor, Date, Time, and Cancellation Reason R\n"
                "6: If NOTIFICATION_CHANNEL in ['both', 'sms']:\n"
                "       Format phone to E.164 (+91...); Dispatch instant SMS via Fast2SMS / Twilio Gateway\n"
                "7: If NOTIFICATION_CHANNEL in ['both', 'email']:\n"
                "       Render responsive HTML template; Dispatch email via Nodemailer SMTP to Patient, Doctor & Staff\n"
                "8: Return HTTP 200 { success: true, message: 'Appointment cancelled and alerts dispatched' }\n"
                "----------------------------------------------------------------------------------------------------"
            )
            create_para(p, algo2_ref, space_before=6, space_after=3)
            create_para(p, algo2_text, font_name="Courier New", size_pt=9.5, bold=False, italic=False, align=WD_ALIGN_PARAGRAPH.LEFT, space_before=2, space_after=8)
            break

    print("Algorithms inserted.")

    # ─────────────────────────────────────────────────────────────
    # 5. CONTENT UPDATES FOR RECENT FUNCTIONALITIES
    # ─────────────────────────────────────────────────────────────

    # Update Section 1.2 (Project Objectives) with cancellation reason and dual-mode
    for p in doc.paragraphs:
        if p.text.strip() == "1.2 PROJECT OBJECTIVES":
            obj_update = (
                "Specific objectives also include: (1) Implementing an intelligent appointment cancellation workflow that captures "
                "patient cancellation reasons and immediately reopens slots for clinical resource optimization; and (2) Establishing a "
                "robust dual-mode notification infrastructure delivering simultaneous SMS messages and rich HTML email notifications for "
                "booking confirmations, 24-hour reminders, and cancellation alerts."
            )
            create_para(p, obj_update, space_before=4, space_after=6)
            break

    # Update Section 2.3 (Proposed System)
    for p in doc.paragraphs:
        if p.text.strip() == "2.3 PROPOSED SYSTEM":
            prop_update = (
                "The proposed system features an advanced Dual-Mode Notification Gateway (smsService.js and reminderScheduler.js) "
                "that bridges communication barriers by simultaneously transmitting SMS text alerts (via Fast2SMS/Twilio) and styled HTML "
                "emails (via Nodemailer). Patients provide a mobile phone number during onboarding, ensuring urgent booking confirmations, "
                "24-hour reminder alerts, and cancellation notices are received even without smartphone internet access. Furthermore, when "
                "an appointment is cancelled, the system mandates or captures a specific cancellation reason (preset chips and custom text), "
                "updates doctor and staff dashboards in real time, releases the consultation slot, and dispatches detailed notifications "
                "to the assigned physician and clinical administrative staff."
            )
            create_para(p, prop_update, space_before=4, space_after=6)
            break

    # Update Section 4.1 (User Portals & Multilingual Presentation Layer)
    for p in doc.paragraphs:
        if p.text.strip() == "4.1 USER PORTALS & MULTILINGUAL PRESENTATION LAYER":
            ui_update = (
                "The frontend interface incorporates an interactive Appointment Cancellation Modal equipped with quick-select reason chips "
                "('Doctor unavailable', 'Personal emergency', 'Rescheduling needed', 'Symptoms resolved', 'Travel difficulties', 'Other') "
                "alongside an optional custom explanation textarea. Patient profiles allow mobile phone number updates, and doctor/staff "
                "dashboards display prominent cancellation reason badges and audit tooltips."
            )
            create_para(p, ui_update, space_before=4, space_after=6)
            break

    # Save modified document
    doc.save(dst_file)
    print(f"Report updated and saved successfully to: {dst_file}")

if __name__ == '__main__':
    apply_report_updates()
