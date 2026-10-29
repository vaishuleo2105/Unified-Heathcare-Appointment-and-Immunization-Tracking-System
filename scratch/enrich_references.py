import docx
from docx.shared import Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH

def enrich_references():
    doc_path = r'D:\Unified_Healthcare_Project_Report (1).docx'
    doc = docx.Document(doc_path)

    def style_run(run, font_name="Times New Roman", size_pt=12.0, bold=False, italic=False, color_rgb=(0, 0, 0)):
        run.font.name = font_name
        run.font.size = Pt(size_pt)
        run.bold = bold
        run.italic = italic
        run.font.color.rgb = RGBColor(*color_rgb)

    # Detailed, rich, single-sentence references with substantive content
    enriched_refs = {
        "Figure 1.1 shows the overall workflow": (
            "Figure 1.1 illustrates the end-to-end clinical workflow connecting user registration, slot booking, "
            "doctor consultations, and preventive immunization tracking."
        ),
        "Table 1.1 lists the software tools": (
            "Table 1.1 summarizes the foundational libraries, frameworks, cloud databases, and notification services "
            "comprising the full-stack system architecture."
        ),
        "Table 2.1 lists the functional requirements": (
            "Table 2.1 specifies the core functional requirements covering user authentication, appointment scheduling, "
            "reasoned cancellations, and emergency referrals."
        ),
        "Table 2.2 lists the non-functional requirements": (
            "Table 2.2 defines the non-functional performance benchmarks, responsive design standards, security protocols, "
            "and system availability constraints."
        ),
        "Figure 3.1 shows the system architecture": (
            "Figure 3.1 depicts the three-tier system architecture showing the interaction between the React presentation tier, "
            "Express API services, and MongoDB database."
        ),
        "Algorithm 2 details the dual-mode notification": (
            "Algorithm 2 defines the sequential procedure for validating cancellation time windows, updating slot availability, "
            "and triggering dual SMS and email notifications."
        ),
        "Figure 3.2 shows the UML activity diagram": (
            "Figure 3.2 illustrates the UML activity diagram modeling patient decision flows from login and doctor discovery "
            "to appointment booking and cancellation."
        ),
        "Figure 3.3 shows the BPMN diagram": (
            "Figure 3.3 presents the BPMN process model detailing cross-departmental coordination among patients, doctors, "
            "hospital staff, and system administrators."
        ),
        "Figure 3.4 shows the database schema": (
            "Figure 3.4 illustrates the entity-relationship database schema showing collections, primary foreign key references, "
            "and embedded clinical subdocuments."
        ),
        "Table 3.1 describes the database collections": (
            "Table 3.1 describes the primary MongoDB collections, schema purposes, and key field attributes including "
            "contact numbers and cancellation audit details."
        ),
        "Algorithm 1 details the appointment urgency triage": (
            "Algorithm 1 delineates the feature extraction, label encoding, and Gradient Boosting classification steps used "
            "to predict appointment urgency and doctor workload."
        ),
        "Figure 3.5 shows the machine learning workflow": (
            "Figure 3.5 demonstrates the machine learning engineering pipeline spanning data ingestion, categorical feature encoding, "
            "model evaluation, and Flask deployment."
        ),
        "Figure 4.1 shows the complete 3-tier MVC": (
            "Figure 4.1 illustrates the complete Model-View-Controller architecture connecting frontend React views with backend "
            "Express controllers and Mongoose data models."
        ),
        "Figure 4.2 shows the authentication and login": (
            "Figure 4.2 displays the responsive login and registration portal supporting role-based access control, mobile phone validation, "
            "and ABHA identity verification."
        ),
        "Figure 4.3 shows the patient dashboard": (
            "Figure 4.3 shows the unified patient dashboard displaying upcoming appointments, health summary metric cards, "
            "and immunization due dates."
        ),
        "Figure 4.4 shows the regional language selection": (
            "Figure 4.4 illustrates the regional language switching interface enabling instantaneous multilingual translation "
            "across six supported Indian languages."
        ),
        "Figure 4.5 shows the digital ABHA ID": (
            "Figure 4.5 presents the digital ABHA verification portal integrated with the National Health Authority sandbox "
            "to link citizen 14-digit health IDs."
        ),
        "Figure 4.6 shows the hospital administrator": (
            "Figure 4.6 shows the hospital administration workspace for onboarding doctors, configuring department consultation fees, "
            "and managing appointment slots."
        ),
        "Figure 4.7 shows the doctor and patient consultation": (
            "Figure 4.7 displays the doctor consultation workspace used for recording clinical diagnoses, issuing digital prescriptions, "
            "and tracking patient encounters."
        ),
        "Figure 4.8 shows the unified patient EHR": (
            "Figure 4.8 exhibits the consolidated longitudinal health record view aggregating diagnoses, past prescriptions, lab reports, "
            "and appointment cancellation logs."
        ),
        "Figure 4.9 shows the clinical data preprocessing": (
            "Figure 4.9 depicts the clinical preprocessing pipeline that encodes categorical patient features into structured numerical "
            "arrays for model training."
        ),
        "Figure 4.10 shows the urgency triage prediction": (
            "Figure 4.10 demonstrates the machine learning triage inference view predicting appointment urgency classifications along with "
            "model confidence scores."
        ),
        "Figure 4.11 shows the machine learning model performance": (
            "Figure 4.11 presents the classification performance metrics comparing accuracy, precision, recall, and F1-scores across "
            "evaluated machine learning algorithms."
        ),
        "Figure 4.12 shows the emergency referral": (
            "Figure 4.12 shows the emergency referral module enabling real-time dispatch of patient clinical summaries, vital signs, "
            "and allergy records between hospitals."
        ),
        "Figure 4.13 shows the doctor workload risk": (
            "Figure 4.13 displays the clinical workload risk analytics meter monitoring doctor patient queues to balance consultation "
            "schedules and prevent physician burnout."
        ),
        "Figure 4.14 shows the maternal healthcare": (
            "Figure 4.14 illustrates the maternal health monitoring dashboard tracking antenatal checkups, expected delivery dates, "
            "and government RCH identifiers."
        ),
        "Figure 4.15 shows the child immunization tracker": (
            "Figure 4.15 displays the comprehensive pediatric immunization dashboard tracking scheduled vaccine doses, administered dates, "
            "and pending requirements."
        ),
        "Figure 4.16 shows the child vaccination schedule": (
            "Figure 4.16 illustrates the chronological vaccination milestone schedule tracking pediatric immunization progress from "
            "birth through early adolescence."
        ),
        "Figure 4.17 shows the vaccination status update": (
            "Figure 4.17 shows the staff logging interface for updating vaccination administration status, batch numbers, injection sites, "
            "and practitioner remarks."
        ),
        "Figure 4.18 shows the automated background vaccination": (
            "Figure 4.18 exhibits the automated background notification service delivering scheduled vaccination reminders and appointment "
            "alerts through SMS and email."
        ),
        "Figure 4.19 shows the Express REST API": (
            "Figure 4.19 outlines the Express.js REST API service architecture showing route middleware, JWT authentication validation, "
            "and request controllers."
        ),
        "Figure 4.20 shows the appointment booking REST API": (
            "Figure 4.20 displays the JSON response structures returned by the appointment booking, cancellation reasoning, "
            "and triage assessment REST endpoints."
        ),
        "Figure 4.21 shows the maternal and immunization": (
            "Figure 4.21 shows the JSON payloads generated by the maternal care and child immunization tracking REST API endpoints."
        ),
        "Figure 4.22 shows the Flask machine learning": (
            "Figure 4.22 presents the JSON response returned by the Flask machine learning microservice during real-time appointment "
            "triage classification."
        ),
        "Figure 4.23 shows the MongoDB collections": (
            "Figure 4.23 illustrates the structural hierarchy of MongoDB document collections, indexes, and relational references "
            "supporting clinical data persistence."
        ),
        "Table 5.1 lists the test cases and execution": (
            "Table 5.1 details the comprehensive validation test cases covering authentication, appointment scheduling, cancellation reasoning, "
            "and dual-mode alerts."
        )
    }

    count = 0
    for p in doc.paragraphs:
        txt = p.text.strip()
        for prefix, new_txt in enriched_refs.items():
            if txt.startswith(prefix):
                p.text = new_txt
                p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
                p.paragraph_format.space_before = Pt(4)
                p.paragraph_format.space_after = Pt(4)
                p.paragraph_format.line_spacing = 1.15
                if p.runs:
                    style_run(p.runs[0], font_name="Times New Roman", size_pt=12.0)
                count += 1
                break

    doc.save(doc_path)
    print(f"Successfully enriched {count} references with meaningful content in {doc_path}")

if __name__ == '__main__':
    enrich_references()
