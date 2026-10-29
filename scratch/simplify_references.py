import docx
from docx.shared import Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH

def simplify_references():
    doc_path = r'D:\Unified_Healthcare_Project_Report (1).docx'
    doc = docx.Document(doc_path)

    def style_run(run, font_name="Times New Roman", size_pt=12.0, bold=False, italic=False, color_rgb=(0, 0, 0)):
        run.font.name = font_name
        run.font.size = Pt(size_pt)
        run.bold = bold
        run.italic = italic
        run.font.color.rgb = RGBColor(*color_rgb)

    # Replacement mapping: startswith -> simplified short 1-line text
    replacements = {
        "As illustrated in Figure 1.1": "Figure 1.1 shows the overall workflow of the unified healthcare system.",
        "Table 1.1 outlines the primary software tools": "Table 1.1 lists the software tools and technologies used in the project.",
        "Table 2.1 specifies the core functional requirements": "Table 2.1 lists the functional requirements of the system.",
        "Table 2.2 enumerates the non-functional requirements": "Table 2.2 lists the non-functional requirements of the system.",
        "Figure 3.1 depicts the comprehensive multi-tier": "Figure 3.1 shows the system architecture of the unified healthcare platform.",
        "Algorithm 2 outlines the operational workflow": "Algorithm 2 details the dual-mode notification and cancellation workflow.",
        "Figure 3.2 illustrates the UML Activity Diagram": "Figure 3.2 shows the UML activity diagram of the system.",
        "Figure 3.3 presents the Business Process Model": "Figure 3.3 shows the BPMN diagram of the system workflow.",
        "Figure 3.4 outlines the entity-relationship database schema": "Figure 3.4 shows the database schema of the healthcare system.",
        "Table 3.1 summarizes the key MongoDB document collections": "Table 3.1 describes the database collections and schema entities.",
        "Algorithm 1 delineates the end-to-end clinical feature extraction": "Algorithm 1 details the appointment urgency triage classification algorithm.",
        "Figure 3.5 demonstrates the machine learning engineering": "Figure 3.5 shows the machine learning workflow pipeline.",
        "Figure 4.1 illustrates the complete three-tier": "Figure 4.1 shows the complete 3-tier MVC architecture diagram.",
        "As shown in Figure 4.2": "Figure 4.2 shows the authentication and login interface.",
        "Figure 4.3 displays the unified patient dashboard": "Figure 4.3 shows the patient dashboard interface.",
        "Figure 4.4 illustrates the multilingual localization": "Figure 4.4 shows the regional language selection controls.",
        "Figure 4.5 presents the digital ABHA ID verification portal": "Figure 4.5 shows the digital ABHA ID verification portal.",
        "Figure 4.6 demonstrates the hospital administrator": "Figure 4.6 shows the hospital administrator management module.",
        "Figure 4.7 illustrates the doctor consultation workspace": "Figure 4.7 shows the doctor and patient consultation portal.",
        "Figure 4.8 displays the consolidated longitudinal": "Figure 4.8 shows the unified patient EHR history view.",
        "Figure 4.9 depicts the clinical data preprocessing": "Figure 4.9 shows the clinical data preprocessing and encoding pipeline.",
        "Figure 4.10 exhibits the machine learning triage": "Figure 4.10 shows the urgency triage prediction view.",
        "Figure 4.11 presents the classification performance metrics": "Figure 4.11 shows the machine learning model performance evaluation.",
        "Figure 4.12 shows the emergency referral interface": "Figure 4.12 shows the emergency referral and data dispatch portal.",
        "Figure 4.13 displays the clinical workload risk analytics": "Figure 4.13 shows the doctor workload risk score meter.",
        "Figure 4.14 illustrates the maternal healthcare tracking": "Figure 4.14 shows the maternal healthcare and antenatal tracker.",
        "Figure 4.15 displays the comprehensive child immunization": "Figure 4.15 shows the child immunization tracker overview.",
        "Figure 4.16 depicts the age-stratified pediatric": "Figure 4.16 shows the child vaccination schedule timeline.",
        "Figure 4.17 demonstrates the clinical staff logging": "Figure 4.17 shows the vaccination status update and batch logging view.",
        "Figure 4.18 exhibits the automated background reminder": "Figure 4.18 shows the automated background vaccination reminder view.",
        "Figure 4.19 outlines the Node.js and Express.js REST API": "Figure 4.19 shows the Express REST API service architecture.",
        "Figure 4.20 presents the formatted JSON response payloads": "Figure 4.20 shows the appointment booking REST API responses.",
        "Figure 4.21 shows the structural JSON schema": "Figure 4.21 shows the maternal and immunization REST API responses.",
        "Figure 4.22 displays the JSON output returned by the Flask": "Figure 4.22 shows the Flask machine learning microservice API response.",
        "Figure 4.23 illustrates the structural hierarchy of MongoDB": "Figure 4.23 shows the MongoDB collections and data schema structure.",
        "Table 5.1 presents the comprehensive suite of executed test": "Table 5.1 lists the test cases and execution results of the system."
    }

    count = 0
    for p in doc.paragraphs:
        txt = p.text.strip()
        for prefix, new_txt in replacements.items():
            if txt.startswith(prefix):
                # Clear runs and set simplified text
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
    print(f"Successfully simplified {count} references to short 1-line text in {doc_path}")

if __name__ == '__main__':
    simplify_references()
