import matplotlib.pyplot as plt
import matplotlib.patches as patches

# Set global matplotlib parameters for high quality white background & black text
plt.rcParams['figure.facecolor'] = 'white'
plt.rcParams['axes.facecolor'] = 'white'
plt.rcParams['text.color'] = 'black'
plt.rcParams['font.family'] = 'sans-serif'
plt.rcParams['font.sans-serif'] = ['DejaVu Sans', 'Arial', 'Calibri']

# 1. SYSTEM ARCHITECTURE DIAGRAM
def draw_architecture():
    fig, ax = plt.subplots(figsize=(10, 7), dpi=300)
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 7)
    ax.axis('off')
    
    # Title
    ax.text(5, 6.7, "Figure 3.1 – Unified Healthcare System Architecture", 
            ha='center', va='center', fontsize=14, fontweight='bold')
    
    # Layer 1: Presentation Layer
    rect1 = patches.FancyBboxPatch((0.5, 5.2), 9, 1.1, boxstyle="round,pad=0.1", ec="black", fc="#F8F9FA", lw=1.5)
    ax.add_patch(rect1)
    ax.text(5, 6.0, "PRESENTATION LAYER (Client Interface)", ha='center', va='center', fontsize=11, fontweight='bold')
    ax.text(5, 5.5, "React.js SPA  |  TailwindCSS  |  react-i18next (6 Regional Languages: EN, HI, TA, TE, KN, ML)\nPatient Dashboard  |  Doctor Portal  |  Staff Portal  |  Admin Dashboard  |  ABHA Management UI", 
            ha='center', va='center', fontsize=9)
    
    # Arrow Layer 1 -> Layer 2
    ax.annotate('', xy=(5, 4.3), xytext=(5, 5.1),
                arrowprops=dict(arrowstyle="<->", color="black", lw=1.5))
    ax.text(5.2, 4.7, "HTTPS / REST JSON API", fontsize=8, color="black")

    # Layer 2: API & Application Layer
    rect2 = patches.FancyBboxPatch((0.5, 3.1), 9, 1.1, boxstyle="round,pad=0.1", ec="black", fc="#F8F9FA", lw=1.5)
    ax.add_patch(rect2)
    ax.text(5, 3.9, "APPLICATION & API LAYER (Node.js & Express.js)", ha='center', va='center', fontsize=11, fontweight='bold')
    ax.text(5, 3.4, "Auth Middleware (JWT & bcryptjs)  |  node-cron Background Reminder Scheduler\nABHA Sandbox API Integration  |  Inter-Hospital Referral Service  |  RESTful Controllers", 
            ha='center', va='center', fontsize=9)

    # Arrow Layer 2 -> Layer 3 & Layer 4
    ax.annotate('', xy=(2.5, 2.2), xytext=(3.5, 3.0),
                arrowprops=dict(arrowstyle="<->", color="black", lw=1.5))
    ax.text(1.8, 2.6, "HTTP ML Inference", fontsize=8, color="black")
    
    ax.annotate('', xy=(7.5, 2.2), xytext=(6.5, 3.0),
                arrowprops=dict(arrowstyle="<->", color="black", lw=1.5))
    ax.text(7.2, 2.6, "Mongoose ODM", fontsize=8, color="black")

    # Layer 3: Machine Learning Microservice
    rect3 = patches.FancyBboxPatch((0.5, 0.8), 4.2, 1.3, boxstyle="round,pad=0.1", ec="black", fc="#F8F9FA", lw=1.5)
    ax.add_patch(rect3)
    ax.text(2.6, 1.8, "ML MICROSERVICE (Python Flask)", ha='center', va='center', fontsize=10, fontweight='bold')
    ax.text(2.6, 1.2, "Gradient Boosting Classifier Models\n• Model 1: Urgency Triage Prediction\n• Model 2: Doctor Workload Risk Scoring (0-100)", 
            ha='center', va='center', fontsize=8.5)

    # Layer 4: Database Layer
    rect4 = patches.FancyBboxPatch((5.3, 0.8), 4.2, 1.3, boxstyle="round,pad=0.1", ec="black", fc="#F8F9FA", lw=1.5)
    ax.add_patch(rect4)
    ax.text(7.4, 1.8, "DATABASE LAYER (MongoDB)", ha='center', va='center', fontsize=10, fontweight='bold')
    ax.text(7.4, 1.2, "Document Collections:\nUsers | Doctors | Appointments | Slots\nMaternalRecords | Immunizations | MedicalHistory", 
            ha='center', va='center', fontsize=8.5)

    plt.tight_layout()
    plt.savefig("diagram_architecture.png", dpi=300, bbox_inches='tight', facecolor='white')
    plt.close()
    print("Created diagram_architecture.png")

# 2. UML ACTIVITY DIAGRAM
def draw_uml_activity():
    fig, ax = plt.subplots(figsize=(8, 10), dpi=300)
    ax.set_xlim(0, 8)
    ax.set_ylim(0, 10)
    ax.axis('off')

    ax.text(4, 9.7, "Figure 3.2 – UML Activity Diagram of Unified Healthcare System", 
            ha='center', va='center', fontsize=13, fontweight='bold')

    # Start Node
    start = patches.Circle((4, 9.2), 0.15, fc="black", ec="black")
    ax.add_patch(start)
    
    steps = [
        ("User Login & Role Authentication (JWT)", 8.4),
        ("ABHA Health ID Registration / Verification", 7.5),
        ("Language Selection (EN, HI, TA, TE, KN, ML)", 6.6),
        ("Search Doctor & Select Consultation Slot", 5.7),
        ("Input Symptoms & Submit Booking Request", 4.8),
        ("Flask ML Microservice: Urgency Triage & Risk Score", 3.9),
        ("Doctor Consultation & Unified Medical History Review", 3.0),
        ("Record Diagnosis, Prescription / Emergency Referral", 2.1),
        ("Maternal RCH Linking & Child Immunization Scheduling", 1.2),
        ("node-cron Automated Background Reminder Dispatch", 0.3)
    ]

    prev_y = 9.2
    for text, y in steps:
        # Arrow from prev
        ax.annotate('', xy=(4, y + 0.3), xytext=(4, prev_y - (0.15 if prev_y==9.2 else 0.25)),
                    arrowprops=dict(arrowstyle="->", color="black", lw=1.5))
        
        box = patches.FancyBboxPatch((1.2, y - 0.25), 5.6, 0.5, boxstyle="round,pad=0.1", ec="black", fc="#FFFFFF", lw=1.5)
        ax.add_patch(box)
        ax.text(4, y, text, ha='center', va='center', fontsize=8.5, fontweight='bold')
        prev_y = y

    # End Node
    ax.annotate('', xy=(4, -0.2), xytext=(4, 0.05),
                arrowprops=dict(arrowstyle="->", color="black", lw=1.5))
    end_outer = patches.Circle((4, -0.35), 0.18, fc="white", ec="black", lw=1.5)
    end_inner = patches.Circle((4, -0.35), 0.11, fc="black", ec="black")
    ax.add_patch(end_outer)
    ax.add_patch(end_inner)

    plt.tight_layout()
    plt.savefig("diagram_uml_activity.png", dpi=300, bbox_inches='tight', facecolor='white')
    plt.close()
    print("Created diagram_uml_activity.png")

# 3. BPMN DIAGRAM
def draw_bpmn():
    fig, ax = plt.subplots(figsize=(10, 7), dpi=300)
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 7)
    ax.axis('off')

    ax.text(5, 6.7, "Figure 3.3 – BPMN Diagram of Unified Healthcare System", 
            ha='center', va='center', fontsize=13, fontweight='bold')

    # Lanes
    lanes = [
        ("PATIENT SWIMLANE", 5.2, 1.1),
        ("DOCTOR / STAFF SWIMLANE", 3.4, 1.1),
        ("SYSTEM & ML microservice SWIMLANE", 1.6, 1.1)
    ]
    for title, y, h in lanes:
        rect = patches.Rectangle((0.2, y), 9.6, h, ec="black", fc="#FAFAFA", lw=1.2)
        ax.add_patch(rect)
        ax.text(0.4, y + h/2, title, rotation=90, ha='center', va='center', fontsize=8, fontweight='bold')

    # Process Nodes
    # Patient lane
    b1 = patches.FancyBboxPatch((1.2, 5.4), 1.6, 0.7, boxstyle="round,pad=0.05", ec="black", fc="white", lw=1.2)
    ax.add_patch(b1)
    ax.text(2.0, 5.75, "1. Authenticate ABHA\n& Book Slot", ha='center', va='center', fontsize=7.5)

    b2 = patches.FancyBboxPatch((4.0, 5.4), 1.6, 0.7, boxstyle="round,pad=0.05", ec="black", fc="white", lw=1.2)
    ax.add_patch(b2)
    ax.text(4.8, 5.75, "2. Provide Clinical\nSymptoms", ha='center', va='center', fontsize=7.5)

    b3 = patches.FancyBboxPatch((7.6, 5.4), 1.6, 0.7, boxstyle="round,pad=0.05", ec="black", fc="white", lw=1.2)
    ax.add_patch(b3)
    ax.text(8.4, 5.75, "5. Receive Background\nCron Reminders", ha='center', va='center', fontsize=7.5)

    # System lane
    s1 = patches.FancyBboxPatch((4.0, 1.8), 1.6, 0.7, boxstyle="round,pad=0.05", ec="black", fc="white", lw=1.2)
    ax.add_patch(s1)
    ax.text(4.8, 2.15, "3. ML Urgency Triage\n& Workload Scoring", ha='center', va='center', fontsize=7.5)

    # Doctor lane
    d1 = patches.FancyBboxPatch((5.8, 3.6), 1.6, 0.7, boxstyle="round,pad=0.05", ec="black", fc="white", lw=1.2)
    ax.add_patch(d1)
    ax.text(6.6, 3.95, "4. Review History &\nLog Consultation / Referral", ha='center', va='center', fontsize=7.5)

    # Connectors
    ax.annotate('', xy=(4.0, 5.75), xytext=(2.8, 5.75), arrowprops=dict(arrowstyle="->", color="black", lw=1.2))
    ax.annotate('', xy=(4.8, 2.5), xytext=(4.8, 5.4), arrowprops=dict(arrowstyle="->", color="black", lw=1.2))
    ax.annotate('', xy=(5.8, 3.95), xytext=(4.8, 2.15), arrowprops=dict(arrowstyle="->", color="black", lw=1.2))
    ax.annotate('', xy=(8.4, 5.4), xytext=(7.4, 3.95), arrowprops=dict(arrowstyle="->", color="black", lw=1.2))

    plt.tight_layout()
    plt.savefig("diagram_bpmn.png", dpi=300, bbox_inches='tight', facecolor='white')
    plt.close()
    print("Created diagram_bpmn.png")

# 4. DATABASE SCHEMA (ERD)
def draw_db_schema():
    fig, ax = plt.subplots(figsize=(10, 8), dpi=300)
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 8)
    ax.axis('off')

    ax.text(5, 7.7, "Figure 3.4 – Healthcare System Database Schema (MongoDB)", 
            ha='center', va='center', fontsize=13, fontweight='bold')

    tables = [
        ("User Collection", 0.5, 5.2, ["_id: ObjectId", "name: String", "email: String", "role: Patient|Doctor|Staff|Admin", "abhaId: String", "language: String"]),
        ("Doctor Collection", 3.7, 5.2, ["_id: ObjectId", "userId: Ref(User)", "specialization: String", "department: String", "workloadScore: Number"]),
        ("Slot Collection", 6.9, 5.2, ["_id: ObjectId", "doctorId: Ref(Doctor)", "date: Date", "time: String", "isBooked: Boolean"]),
        ("Appointment Collection", 0.5, 1.5, ["_id: ObjectId", "patientId: Ref(User)", "doctorId: Ref(Doctor)", "triageType: Emergency|Consultation...", "status: Pending|Completed|Referred", "riskScore: Number"]),
        ("Maternal Record", 3.7, 1.5, ["_id: ObjectId", "patientId: Ref(User)", "rchId: String", "ancVisits: Array", "deliveryDetails: Object"]),
        ("Immunization Record", 6.9, 1.5, ["_id: ObjectId", "childId: Ref(User)", "rchId: String", "vaccineName: String", "status: Scheduled|Administered", "dueDate: Date"])
    ]

    for title, x, y, fields in tables:
        rect = patches.Rectangle((x, y), 2.6, 2.0, ec="black", fc="#FFFFFF", lw=1.2)
        ax.add_patch(rect)
        rect_head = patches.Rectangle((x, y + 1.6), 2.6, 0.4, ec="black", fc="#F0F0F0", lw=1.2)
        ax.add_patch(rect_head)
        ax.text(x + 1.3, y + 1.8, title, ha='center', va='center', fontsize=8.5, fontweight='bold')
        
        fy = y + 1.4
        for f in fields:
            ax.text(x + 0.1, fy, f, ha='left', va='center', fontsize=7.5)
            fy -= 0.26

    # Relationships
    ax.annotate('', xy=(3.7, 6.2), xytext=(3.1, 6.2), arrowprops=dict(arrowstyle="->", color="black", lw=1.2))
    ax.annotate('', xy=(6.9, 6.2), xytext=(6.3, 6.2), arrowprops=dict(arrowstyle="->", color="black", lw=1.2))
    ax.annotate('', xy=(1.8, 3.5), xytext=(1.8, 5.2), arrowprops=dict(arrowstyle="->", color="black", lw=1.2))
    ax.annotate('', xy=(5.0, 3.5), xytext=(1.8, 5.2), arrowprops=dict(arrowstyle="->", color="black", lw=1.2))
    ax.annotate('', xy=(8.2, 3.5), xytext=(1.8, 5.2), arrowprops=dict(arrowstyle="->", color="black", lw=1.2))

    plt.tight_layout()
    plt.savefig("diagram_db_schema.png", dpi=300, bbox_inches='tight', facecolor='white')
    plt.close()
    print("Created diagram_db_schema.png")

# 5. MACHINE LEARNING WORKFLOW
def draw_ml_workflow():
    fig, ax = plt.subplots(figsize=(10, 6), dpi=300)
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 6)
    ax.axis('off')

    ax.text(5, 5.7, "Figure 3.5 – Machine Learning Workflow (Gradient Boosting Microservice)", 
            ha='center', va='center', fontsize=13, fontweight='bold')

    boxes = [
        ("Clinical Dataset / Request Input", 0.5, 2.5, "Age, Gender, Symptoms,\nMedical History, Vitals"),
        ("Data Preprocessing & Encoding", 2.8, 2.5, "LabelEncoder, Scaling,\nCategorical Feature Vector"),
        ("Gradient Boosting Model 1", 5.1, 3.7, "Appointment Urgency Triage:\nEmergency | Consultation | Follow-up"),
        ("Gradient Boosting Model 2", 5.1, 1.3, "Doctor Workload Risk Scoring:\n0-100 Score (Low | High)"),
        ("Flask API Response JSON", 7.6, 2.5, "Returns Predicted Triage &\nWorkload Risk Score")
    ]

    for title, x, y, desc in boxes:
        rect = patches.FancyBboxPatch((x, y), 1.9, 1.2, boxstyle="round,pad=0.08", ec="black", fc="#FFFFFF", lw=1.2)
        ax.add_patch(rect)
        ax.text(x + 0.95, y + 0.9, title, ha='center', va='center', fontsize=8, fontweight='bold')
        ax.text(x + 0.95, y + 0.45, desc, ha='center', va='center', fontsize=7.5)

    # Connections
    ax.annotate('', xy=(2.8, 3.1), xytext=(2.4, 3.1), arrowprops=dict(arrowstyle="->", color="black", lw=1.2))
    ax.annotate('', xy=(5.1, 4.3), xytext=(4.7, 3.1), arrowprops=dict(arrowstyle="->", color="black", lw=1.2))
    ax.annotate('', xy=(5.1, 1.9), xytext=(4.7, 3.1), arrowprops=dict(arrowstyle="->", color="black", lw=1.2))
    ax.annotate('', xy=(7.6, 3.1), xytext=(7.0, 4.3), arrowprops=dict(arrowstyle="->", color="black", lw=1.2))
    ax.annotate('', xy=(7.6, 3.1), xytext=(7.0, 1.9), arrowprops=dict(arrowstyle="->", color="black", lw=1.2))

    plt.tight_layout()
    plt.savefig("diagram_ml_workflow.png", dpi=300, bbox_inches='tight', facecolor='white')
    plt.close()
    print("Created diagram_ml_workflow.png")

if __name__ == '__main__':
    draw_architecture()
    draw_uml_activity()
    draw_bpmn()
    draw_db_schema()
    draw_ml_workflow()
