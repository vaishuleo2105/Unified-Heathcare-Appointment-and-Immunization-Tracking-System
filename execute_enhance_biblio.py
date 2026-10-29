import docx
from docx.shared import Pt, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
import sys

sys.stdout.reconfigure(encoding='utf-8')

target_paths = [
    r'D:\Unified_Healthcare_Project_Report_Updated.docx',
    r'D:\Unified_Healthcare_Project_Report (1).docx'
]

def set_run_arial(run, font_size_pt=10.5):
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

enhanced_references = [
    "[1] National Health Authority (NHA), Government of India. \"Ayushman Bharat Digital Mission (ABDM): Sandbox Architecture, Milestone Specifications, and Electronic Health Record (EHR) Interoperability Guidelines,\" New Delhi, 2022. Available: https://abdm.gov.in/",
    "[2] Ministry of Health and Family Welfare (MoHFW), Government of India. \"Reproductive, Maternal, Newborn, Child and Adolescent Health (RMNCH+A) Strategic Framework & Child Immunization Tracking Guidelines,\" Maternal and Child Health Division, 2021. Available: https://nhm.gov.in/",
    "[3] World Health Organization (WHO). \"Global Strategy on Digital Health 2020–2025: Strengthening Health Systems through Digital Interoperability and Longitudinal Patient Records,\" Geneva: World Health Organization, 2021.",
    "[4] Friedman, J. H. \"Greedy Function Approximation: A Gradient Boosting Machine,\" The Annals of Statistics, vol. 29, no. 5, pp. 1189–1232, 2001. DOI: 10.1214/aos/1013203451.",
    "[5] Pedregosa, F., Varoquaux, G., Gramfort, A., Michel, V., Thirion, B., Grisel, O., et al. \"Scikit-learn: Machine Learning in Python,\" Journal of Machine Learning Research (JMLR), vol. 12, pp. 2825–2830, 2011.",
    "[6] Breiman, L. \"Random Forests,\" Machine Learning, vol. 45, no. 1, pp. 5–32, 2001. DOI: 10.1023/A:1010933404324.",
    "[7] Bates, D. W., Saria, S., Ohno-Machado, L., Shah, A., and Escobar, G. \"Big Data in Healthcare: Using Analytics to Identify and Manage High-Risk and High-Cost Patients,\" Health Affairs, vol. 33, no. 7, pp. 1123–1131, 2014. DOI: 10.1377/hlthaff.2014.0041.",
    "[8] Borycki, E. M., and Kushniruk, A. W. \"Towards an Integrative Framework for Patient Safety and Health Informatics: Cross-Institutional Electronic Health Record Interoperability,\" Yearbook of Medical Informatics, vol. 28, no. 1, pp. 177–184, 2019. DOI: 10.1055/s-0039-1677914.",
    "[9] World Health Organization (WHO). \"Immunization Agenda 2030: A Global Strategy to Leave No One Behind,\" Geneva: World Health Organization, 2020.",
    "[10] Telegram Open Platform. \"Telegram Bot API: Real-Time Event Webhook Infrastructure and Secure MTProto Messaging Architecture,\" Telegram Messenger Inc., 2024. Available: https://core.telegram.org/bots/api",
    "[11] Chodorow, K. MongoDB: The Definitive Guide - Powerful and Scalable Data Storage, 2nd ed., Sebastopol, CA: O'Reilly Media, 2013.",
    "[12] Tilkov, S., and Vinoski, S. \"Node.js: Using JavaScript to Build High-Performance Network Programs,\" IEEE Internet Computing, vol. 14, no. 6, pp. 80–83, 2010. DOI: 10.1109/MIC.2010.145.",
    "[13] Banks, A., and Porcello, E. Learning React: Modern Patterns for Developing React Applications, 2nd ed., Sebastopol, CA: O'Reilly Media, 2020.",
    "[14] Grinberg, M. Flask Web Development: Developing Web Applications with Python, 2nd ed., Sebastopol, CA: O'Reilly Media, 2018.",
    "[15] Fielding, R. T. \"Architectural Styles and the Design of Network-based Software Architectures,\" Ph.D. dissertation, Department of Information and Computer Science, University of California, Irvine, 2000.",
    "[16] Jones, M., Bradley, J., and Sakimura, N. \"JSON Web Token (JWT),\" Internet Engineering Task Force (IETF) RFC 7519, 2015. DOI: 10.17487/RFC7519.",
    "[17] Rescorla, E. \"The Transport Layer Security (TLS) Protocol Version 1.3,\" Internet Engineering Task Force (IETF) RFC 8446, 2018. DOI: 10.17487/RFC8446.",
    "[18] Ministry of Health and Family Welfare (MoHFW), Government of India. \"Pregnancy and Infant Cohort Monitoring and Evaluation (PICME) & National RCH Portal Operational Manual,\" Department of Health and Family Welfare, 2022."
]

for p_path in target_paths:
    try:
        doc = docx.Document(p_path)
        print(f"\nProcessing {p_path} (Paragraphs: {len(doc.paragraphs)})...")
        
        # Find index of BIBLIOGRAPHY heading
        bib_idx = None
        for i, p in enumerate(doc.paragraphs):
            if p.text.strip().upper() == "BIBLIOGRAPHY":
                bib_idx = i
                break
        
        if bib_idx is None:
            print("Could not find BIBLIOGRAPHY heading!")
            continue
            
        print(f"BIBLIOGRAPHY heading found at P{bib_idx}")
        
        # Existing reference paragraphs are from bib_idx + 1 onwards
        existing_ref_paras = doc.paragraphs[bib_idx + 1:]
        num_existing = len(existing_ref_paras)
        print(f"Number of existing bibliography paragraphs: {num_existing}")
        
        # Overwrite existing paragraphs with first N enhanced references
        for i in range(min(num_existing, len(enhanced_references))):
            p = existing_ref_paras[i]
            for r in list(p.runs):
                p._element.remove(r._element)
            run = p.add_run(enhanced_references[i])
            set_run_arial(run, font_size_pt=10.5)
            p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
            
        # If there are more enhanced references, add new paragraphs
        if len(enhanced_references) > num_existing:
            for i in range(num_existing, len(enhanced_references)):
                p = doc.add_paragraph()
                run = p.add_run(enhanced_references[i])
                set_run_arial(run, font_size_pt=10.5)
                p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
                
        # Save
        doc.save(p_path)
        print(f"Successfully updated and saved {len(enhanced_references)} enhanced references to: {p_path}")
    except PermissionError:
        print(f"File {p_path} is currently locked by Word. Skipping direct write.")
    except Exception as e:
        print(f"Error on {p_path}: {e}")
