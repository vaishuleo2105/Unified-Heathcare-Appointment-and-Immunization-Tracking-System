import matplotlib.pyplot as plt
import matplotlib.patches as patches

def generate_diagram():
    # A4 Landscape (11.69 x 8.27 inches) at 300 DPI
    fig, ax = plt.subplots(figsize=(11.69, 8.27), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')

    # Color Tokens
    c_bg = '#F8FAFC'
    fig.patch.set_facecolor(c_bg)

    # Layer Color Schemes
    col_view = {'bg': '#F0F7FF', 'border': '#2563EB', 'ribbon': '#1D4ED8', 'badge_bg': '#DBEAFE', 'badge_txt': '#1E40AF', 'sub': '#1E3A8A', 'body': '#334155'}
    col_ctrl = {'bg': '#ECFDF5', 'border': '#059669', 'ribbon': '#047857', 'badge_bg': '#D1FAE5', 'badge_txt': '#065F46', 'sub': '#064E3B', 'body': '#334155'}
    col_ext  = {'bg': '#FFFBEB', 'border': '#D97706', 'ribbon': '#B45309', 'badge_bg': '#FEF3C7', 'badge_txt': '#92400E', 'sub': '#78350F', 'body': '#334155'}
    col_mod  = {'bg': '#FAF5FF', 'border': '#7C3AED', 'ribbon': '#6D28D9', 'badge_bg': '#EDE9FE', 'badge_txt': '#5B21B6', 'sub': '#4C1D95', 'body': '#334155'}

    # ─────────────────────────────────────────────────────────────
    # Top Titles
    # ─────────────────────────────────────────────────────────────
    ax.text(50, 97.5, 'UNIFIED HEALTHCARE SYSTEM — ARCHITECTURE & WORKFLOW SPECIFICATION',
            fontsize=13.5, fontweight='bold', ha='center', va='center', color='#0F172A')
    ax.text(50, 95.3, 'Integrated MVC Architecture Mapped to 5-Phase Clinical Lifecycle with Dual-Mode (SMS + Email) & Cancellation Auditing',
            fontsize=8.0, fontstyle='italic', ha='center', va='center', color='#475569')

    # ─────────────────────────────────────────────────────────────
    # Top Workflow Pipeline Tracker (Phases 1 to 5)
    # ─────────────────────────────────────────────────────────────
    pipe_rect = patches.FancyBboxPatch((2.5, 89.6), 95.0, 3.8, boxstyle='round,pad=0.2,rounding_size=0.6',
                                       linewidth=1.2, edgecolor='#94A3B8', facecolor='#FFFFFF')
    ax.add_patch(pipe_rect)

    phases = [
        ('1', 'Discovery & Auth', 'Phone Registration & ABHA', '#2563EB', '#EFF6FF'),
        ('2', 'Scheduling & Slots', 'Booking & Reasoned Cancel', '#059669', '#ECFDF5'),
        ('3', 'Clinical Encounter', 'Doctor Consult & Transfers', '#D97706', '#FFFBEB'),
        ('4', 'Preventive Care', 'Maternal ANC & Vaccines', '#7C3AED', '#FAF5FF'),
        ('5', 'Notifications & EHR', 'Dual SMS+Email & Audited EHR', '#0284C7', '#F0F9FF')
    ]

    p_w = 17.2
    p_gap = 2.05
    p_start = 3.6
    for idx, (num, p_title, p_sub, b_col, bg_col) in enumerate(phases):
        px = p_start + idx * (p_w + p_gap)
        py = 90.1
        # Pill box
        p_box = patches.FancyBboxPatch((px, py), p_w, 2.8, boxstyle='round,pad=0.15,rounding_size=0.4',
                                       linewidth=1.0, edgecolor=b_col, facecolor=bg_col)
        ax.add_patch(p_box)
        # Number badge
        num_circle = patches.FancyBboxPatch((px + 0.4, py + 0.4), 2.0, 2.0, boxstyle='round,pad=0.1,rounding_size=0.3',
                                           linewidth=0.8, edgecolor=b_col, facecolor='#FFFFFF')
        ax.add_patch(num_circle)
        ax.text(px + 1.4, py + 1.4, f'#{num}', fontsize=6.8, fontweight='bold', ha='center', va='center', color=b_col)
        # Texts
        ax.text(px + 2.8, py + 1.8, p_title, fontsize=6.8, fontweight='bold', va='center', color='#0F172A')
        ax.text(px + 2.8, py + 0.8, p_sub, fontsize=5.4, fontstyle='italic', va='center', color='#475569')

        # Arrow to next phase
        if idx < 4:
            ax.annotate('', xy=(px + p_w + 1.6, py + 1.4), xytext=(px + p_w + 0.3, py + 1.4),
                        arrowprops=dict(arrowstyle='->,head_width=0.22,head_length=0.4', lw=1.2, color='#64748B'))

    # ─────────────────────────────────────────────────────────────
    # Reusable Card Component
    # ─────────────────────────────────────────────────────────────
    def render_card(x, y, w, h, step, title, subtitle, bullets, theme):
        # Card outer frame
        card = patches.FancyBboxPatch((x, y), w, h, boxstyle='round,pad=0.2,rounding_size=0.6',
                                      linewidth=1.2, edgecolor=theme['border'], facecolor='#FFFFFF')
        ax.add_patch(card)

        # Header ribbon
        rib_h = 3.0
        ribbon = patches.FancyBboxPatch((x + 0.1, y + h - rib_h - 0.1), w - 0.2, rib_h,
                                        boxstyle='round,pad=0.15,rounding_size=0.4',
                                        linewidth=0, facecolor=theme['bg'])
        ax.add_patch(ribbon)

        # Step badge inside header
        if step:
            badge_w = 2.4
            badge = patches.FancyBboxPatch((x + 0.5, y + h - rib_h + 0.4), badge_w, rib_h - 0.9,
                                           boxstyle='round,pad=0.1,rounding_size=0.25',
                                           linewidth=0.8, edgecolor=theme['border'], facecolor=theme['badge_bg'])
            ax.add_patch(badge)
            ax.text(x + 0.5 + badge_w / 2, y + h - rib_h / 2, f'#{step}',
                    fontsize=6.4, fontweight='bold', ha='center', va='center', color=theme['badge_txt'])
            tx = x + 3.4
        else:
            tx = x + 0.8

        ax.text(tx, y + h - rib_h / 2, title, fontsize=7.2, fontweight='bold', va='center', color='#0F172A')

        # Subtitle / Tagline
        sub_y = y + h - rib_h - 1.2
        ax.text(x + 0.8, sub_y, subtitle, fontsize=6.2, fontweight='bold', va='center', color=theme['sub'])

        # Divider line
        div_y = sub_y - 0.8
        ax.plot([x + 0.8, x + w - 0.8], [div_y, div_y], color='#E2E8F0', lw=0.8)

        # Bullets
        curr_y = div_y - 1.3
        line_step = 1.35
        for b in bullets:
            # Bullet icon / symbol
            ax.text(x + 0.8, curr_y, '•', fontsize=6.5, fontweight='bold', color=theme['border'])
            ax.text(x + 1.8, curr_y, b, fontsize=5.8, va='center', color=theme['body'])
            curr_y -= line_step

    # ─────────────────────────────────────────────────────────────
    # LAYER 1: PRESENTATION LAYER (VIEW)
    # ─────────────────────────────────────────────────────────────
    l1_y = 63.2
    l1_h = 24.5
    layer1_box = patches.FancyBboxPatch((2.5, l1_y), 95.0, l1_h, boxstyle='round,pad=0.3,rounding_size=0.8',
                                        linewidth=1.5, edgecolor=col_view['border'], facecolor=col_view['bg'])
    ax.add_patch(layer1_box)

    # Layer 1 Headers
    ax.text(4.2, l1_y + l1_h - 1.6, 'LAYER 1: PRESENTATION LAYER (CLIENT / VIEW)',
            fontsize=9.8, fontweight='bold', va='center', color=col_view['ribbon'])
    ax.text(37.5, l1_y + l1_h - 1.6, 'React 18 SPA • Vite Bundler • Tailwind CSS Design System • Multilingual i18n (6 Languages)',
            fontsize=6.8, fontstyle='italic', va='center', color='#475569')

    # Layer 1 Cards (5 Workflow columns)
    c_w = 17.2
    c_gap = 1.35
    c_start = 4.3
    c_y = l1_y + 1.2
    c_h = 19.5

    # L1-Card 1
    render_card(c_start + 0 * (c_w + c_gap), c_y, c_w, c_h, '1',
                'Auth & Onboarding', 'Role-Based Authentication',
                ['Registration with Phone No',
                 '14-Digit ABHA ID Validation',
                 'Role Gate: Patient/Doc/Staff',
                 'JWT Session Token Persistence',
                 'Profile Edit (Phone & Details)'],
                col_view)

    # L1-Card 2
    render_card(c_start + 1 * (c_w + c_gap), c_y, c_w, c_h, '2',
                'Booking & Cancellation', 'Interactive Scheduling UI',
                ['Department & Doctor Selection',
                 'Real-Time Slot Picker Grid',
                 '24h Cancellation Enforcement',
                 'Cancel Modal: Reason Chips',
                 'Custom Free-Text Reason Box'],
                col_view)

    # L1-Card 3
    render_card(c_start + 2 * (c_w + c_gap), c_y, c_w, c_h, '3',
                'Clinical Consultations', 'Doctor Encounter & Triage',
                ['Doctor Encounter Workspace',
                 'Diagnosis & Treatment Notes',
                 'Digital Prescription Generator',
                 'Emergency Inter-Hospital Triage',
                 'Bed Availability Live Tracker'],
                col_view)

    # L1-Card 4
    render_card(c_start + 3 * (c_w + c_gap), c_y, c_w, c_h, '4',
                'Maternal & Vaccines', 'Preventive Health Portal',
                ['Child Immunization Timeline',
                 'Dose Due Dates & Status Badges',
                 'Maternal ANC Trimester Cards',
                 'Govt RCH ID Integration',
                 'High-Risk Pregnancy Alerts'],
                col_view)

    # L1-Card 5
    render_card(c_start + 4 * (c_w + c_gap), c_y, c_w, c_h, '5',
                'History & EHR Vault', 'Consolidated Patient Portal',
                ['Lifetime Encounters Timeline',
                 'Cancellation Reason Callouts',
                 'Downloadable PDF Health Card',
                 'Vaccination Certificate Export',
                 'Multi-Hospital Patient History'],
                col_view)

    # Layer 1 horizontal workflow arrows
    for i in range(4):
        ax.annotate('', xy=(c_start + (i + 1) * (c_w + c_gap) - 0.2, c_y + c_h / 2),
                    xytext=(c_start + i * (c_w + c_gap) + c_w + 0.2, c_y + c_h / 2),
                    arrowprops=dict(arrowstyle='->,head_width=0.25,head_length=0.45', lw=1.3, color=col_view['ribbon']))

    # ─────────────────────────────────────────────────────────────
    # Layer 1 <-> Layer 2 Communication Arrows
    # ─────────────────────────────────────────────────────────────
    arr_l1_l2 = dict(arrowstyle='<->,head_width=0.3,head_length=0.5', lw=1.5, color='#334155')
    ax.annotate('', xy=(20.0, 59.2), xytext=(20.0, 63.2), arrowprops=arr_l1_l2)
    ax.text(21.2, 61.2, 'REST API / JSON (Bearer JWT Auth) • Phone & Auth Payloads',
            fontsize=6.8, fontweight='bold', va='center', color='#1E293B')

    ax.annotate('', xy=(68.0, 59.2), xytext=(68.0, 63.2), arrowprops=arr_l1_l2)
    ax.text(69.2, 61.2, 'POST /cancel with Reason • Slot Updates • PDF Exports',
            fontsize=6.8, fontweight='bold', va='center', color='#1E293B')

    # ─────────────────────────────────────────────────────────────
    # LAYER 2: APPLICATION & CONTROLLER LAYER + EXTERNAL SERVICES
    # ─────────────────────────────────────────────────────────────
    l2_y = 34.0
    l2_h = 24.5
    # Controller Box (left)
    layer2_box = patches.FancyBboxPatch((2.5, l2_y), 67.5, l2_h, boxstyle='round,pad=0.3,rounding_size=0.8',
                                        linewidth=1.5, edgecolor=col_ctrl['border'], facecolor=col_ctrl['bg'])
    ax.add_patch(layer2_box)

    ax.text(4.2, l2_y + l2_h - 1.6, 'LAYER 2: APPLICATION & CONTROLLER LAYER (Node.js & Express.js REST API)',
            fontsize=9.5, fontweight='bold', va='center', color=col_ctrl['ribbon'])
    ax.text(50.0, l2_y + l2_h - 1.6, 'Modular Routes • JWT Gate • Audit Loggers',
            fontsize=6.6, fontstyle='italic', va='center', color='#475569')

    # 4 Controller Cards
    ctrl_w = 15.0
    ctrl_gap = 1.2
    ctrl_start = 4.3
    ctrl_h = 19.5
    ctrl_y = l2_y + 1.2

    # L2-Card 1
    render_card(ctrl_start + 0 * (ctrl_w + ctrl_gap), ctrl_y, ctrl_w, ctrl_h, '1',
                'Auth & RBAC Route', 'auth.js & JWT Middleware',
                ['bcrypt Password Hashing',
                 'Phone & Email Validation',
                 'Role Authorization Guard',
                 'PUT /profile (Phone Updates)',
                 'Secure Token Issuance'],
                col_ctrl)

    # L2-Card 2
    render_card(ctrl_start + 1 * (ctrl_w + ctrl_gap), ctrl_y, ctrl_w, ctrl_h, '2',
                'Appointments API', 'appointments.js Controller',
                ['Double-Booking Verification',
                 'Atomic Slot Reservation',
                 'POST /:id/cancel Handler',
                 'Records cancellationReason',
                 'Logs cancelledBy & Timestamp'],
                col_ctrl)

    # L2-Card 3
    render_card(ctrl_start + 2 * (ctrl_w + ctrl_gap), ctrl_y, ctrl_w, ctrl_h, '3',
                'Clinical & Transfer', 'consultations.js & transfers.js',
                ['Consultation Outcome Router',
                 'Prescription Storing Engine',
                 'Emergency Transfer Dispatch',
                 'Source/Dest Hospital Handshake',
                 'Vitals at Transfer Capture'],
                col_ctrl)

    # L2-Card 4
    render_card(ctrl_start + 3 * (ctrl_w + ctrl_gap), ctrl_y, ctrl_w, ctrl_h, '4',
                'Preventive & Jobs', 'reminderScheduler.js & Cron',
                ['node-cron 24h Reminder Loop',
                 'Child Vaccine Due-Date Calc',
                 'Maternal ANC Milestones',
                 'Triggers Dual-Mode Dispatch',
                 'Cancellation Alerts to Staff'],
                col_ctrl)

    # Horizontal arrows in Controller
    for i in range(3):
        ax.annotate('', xy=(ctrl_start + (i + 1) * (ctrl_w + ctrl_gap) - 0.2, ctrl_y + ctrl_h / 2),
                    xytext=(ctrl_start + i * (ctrl_w + ctrl_gap) + ctrl_w + 0.2, ctrl_y + ctrl_h / 2),
                    arrowprops=dict(arrowstyle='->,head_width=0.25,head_length=0.45', lw=1.3, color=col_ctrl['ribbon']))

    # ─────────────────────────────────────────────────────────────
    # LAYER 2B: EXTERNAL SERVICES & DUAL-MODE GATEWAYS (Right side)
    # ─────────────────────────────────────────────────────────────
    ext_x = 71.5
    ext_w = 26.0
    layer_ext = patches.FancyBboxPatch((ext_x, l2_y), ext_w, l2_h, boxstyle='round,pad=0.3,rounding_size=0.8',
                                       linewidth=1.5, edgecolor=col_ext['border'], facecolor=col_ext['bg'])
    ax.add_patch(layer_ext)

    ax.text(ext_x + 1.6, l2_y + l2_h - 1.6, 'EXTERNAL & NOTIFICATION SERVICES',
            fontsize=9.2, fontweight='bold', va='center', color=col_ext['ribbon'])

    # Dual-Mode Card (Top)
    render_card(ext_x + 1.2, l2_y + 11.2, ext_w - 2.4, 10.4, '5',
                'Dual-Mode Notification Gateway', 'Parallel SMS + Email Dispatch',
                ['smsService.js: Fast2SMS & Twilio Carrier APIs',
                 'Nodemailer: HTML Receipts to Patient & Staff',
                 'Booking Confirmations & 24h Alert Reminders',
                 'Cancellation Alerts with Reason to Doctor & Staff',
                 'Config: NOTIFICATION_CHANNEL=both | sms | email'],
                col_ext)

    # ABDM & PDF Card (Bottom)
    render_card(ext_x + 1.2, l2_y + 1.2, ext_w - 2.4, 9.2, '',
                'ABDM & Client Export Services', 'National Health Sandbox & Reports',
                ['ABDM Sandbox: M1 (ABHA), M2 & M3 Integration',
                 'Ayushman Bharat Digital Mission Standards',
                 'html2canvas & jsPDF: Digital Health Card Export',
                 'Audit-Compliant Secure Transfer Reports'],
                col_ext)

    # Dispatch arrow from Controller Layer to Dual-Mode Gateway
    ax.annotate('', xy=(ext_x, l2_y + 16.4), xytext=(ext_x - 3.8, l2_y + 16.4),
                arrowprops=dict(arrowstyle='->,head_width=0.3,head_length=0.5', lw=1.6, color=col_ext['ribbon']))
    ax.text(ext_x - 1.9, l2_y + 17.5, 'Trigger Alerts', fontsize=6.2, fontweight='bold', ha='center', color=col_ext['ribbon'])

    # ─────────────────────────────────────────────────────────────
    # Layer 2 <-> Layer 3 Communication Arrows
    # ─────────────────────────────────────────────────────────────
    arr_l2_l3 = dict(arrowstyle='<->,head_width=0.3,head_length=0.5', lw=1.5, color='#334155')
    ax.annotate('', xy=(20.0, 29.8), xytext=(20.0, 34.0), arrowprops=arr_l2_l3)
    ax.text(21.2, 31.8, 'Mongoose ODM Queries, Validations & Aggregations (find, create, updateOne)',
            fontsize=6.8, fontweight='bold', va='center', color='#1E293B')

    ax.annotate('', xy=(68.0, 29.8), xytext=(68.0, 34.0), arrowprops=arr_l2_l3)
    ax.text(69.2, 31.8, 'Audit Trail Persistence • Reason Storage • Atomic Slot Release',
            fontsize=6.8, fontweight='bold', va='center', color='#1E293B')

    # ─────────────────────────────────────────────────────────────
    # LAYER 3: DATA LAYER (MODEL - MongoDB Atlas & Mongoose ODM)
    # ─────────────────────────────────────────────────────────────
    l3_y = 4.6
    l3_h = 24.5
    layer3_box = patches.FancyBboxPatch((2.5, l3_y), 95.0, l3_h, boxstyle='round,pad=0.3,rounding_size=0.8',
                                        linewidth=1.5, edgecolor=col_mod['border'], facecolor=col_mod['bg'])
    ax.add_patch(layer3_box)

    ax.text(4.2, l3_y + l3_h - 1.6, 'LAYER 3: DATA LAYER (MODEL - MongoDB Atlas Cloud Database)',
            fontsize=9.8, fontweight='bold', va='center', color=col_mod['ribbon'])
    ax.text(43.5, l3_y + l3_h - 1.6, 'Mongoose Schemas • Multi-Tenant Partitioning • Indexing & ACID Guarantees',
            fontsize=6.8, fontstyle='italic', va='center', color='#475569')

    # 5 Model Cards
    m_w = 17.2
    m_gap = 1.35
    m_start = 4.3
    m_h = 19.5
    m_y = l3_y + 1.2

    # L3-Card 1
    render_card(m_start + 0 * (m_w + m_gap), m_y, m_w, m_h, '1',
                'User & Hospital Models', 'User.js & Hospital.js',
                ['phone: String (SMS recipient)',
                 'email, password (bcrypt hash)',
                 'abhaId, isAbhaVerified: Boolean',
                 'role: [patient, doctor, staff]',
                 'Hospital: district, totalBeds, icu'],
                col_mod)

    # L3-Card 2
    render_card(m_start + 1 * (m_w + m_gap), m_y, m_w, m_h, '2',
                'Appointment & Slots', 'Appointment.js & Slot.js',
                ['status: Pending | Confirmed | Cancelled',
                 'cancellationReason: String (Reason)',
                 'cancelledBy: ObjectId (User Ref)',
                 'cancelledAt: Date (Timestamp)',
                 'Slot: doctorId, date, time, isBooked'],
                col_mod)

    # L3-Card 3
    render_card(m_start + 2 * (m_w + m_gap), m_y, m_w, m_h, '3',
                'Emergency & Transfer', 'EmergencyTransfer.js',
                ['sourceHospital, targetHospital',
                 'patientSnapshot: vitals, history',
                 'priority: Critical | High | Normal',
                 'transferStatus: Initiated | Accepted',
                 'vitalsAtTransfer: bp, pulse, spO2'],
                col_mod)

    # L3-Card 4
    render_card(m_start + 3 * (m_w + m_gap), m_y, m_w, m_h, '4',
                'Maternal & Vaccines', 'Immunization & MaternalRecord',
                ['Immunization: vaccine, dose, status',
                 'scheduledDate, administeredDate',
                 'MaternalRecord: rchId, lmpDate, edd',
                 'ancCheckups: [visitNo, bp, weight]',
                 'highRiskFlags: gestationalDiabetes'],
                col_mod)

    # L3-Card 5
    render_card(m_start + 4 * (m_w + m_gap), m_y, m_w, m_h, '5',
                'Audit & Health Records', 'AuditLog.js & MedicalHistory',
                ['action: TRANSFER_*, CANCEL_*',
                 'performedBy: ObjectId, userRole',
                 'metadata: cancellationReason capture',
                 'ipAddress, timestamp, userAgent',
                 'Immutable Compliance Audit Trail'],
                col_mod)

    # ─────────────────────────────────────────────────────────────
    # Footer Workflow Legend
    # ─────────────────────────────────────────────────────────────
    ax.text(50, 1.8, 'END-TO-END WORKFLOW PIPELINE:   ① User Onboarding (Phone/ABHA) ➔ ② Slot Booking & Reasoned Cancellation ➔ ③ Clinical Consultation & Transfer ➔ ④ Maternal & Vaccine Tracking ➔ ⑤ Dual-Mode Notifications (SMS + Email) & Audited EHR',
            fontsize=7.0, fontweight='bold', fontstyle='italic', ha='center', va='center', color='#1E293B')

    out_file = r'd:\College\PG\SEM III\Miniproject\project\Unified-Heathcare-Appointment-and-Immunization-Tracking-System\diagram_architecture_clean_a4.png'
    plt.tight_layout()
    plt.savefig(out_file, dpi=300, bbox_inches='tight', pad_inches=0.15)
    plt.close()
    print('Generated diagram successfully at:', out_file)

if __name__ == '__main__':
    generate_diagram()
