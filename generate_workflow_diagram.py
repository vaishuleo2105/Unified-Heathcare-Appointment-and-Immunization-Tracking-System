import matplotlib.pyplot as plt
import matplotlib.patches as patches

fig, ax = plt.subplots(figsize=(10, 7), dpi=300)
ax.set_xlim(0, 100)
ax.set_ylim(0, 100)
ax.axis('off')

# Title
ax.text(50, 96, 'END-TO-END PATIENT & CLINICAL WORKFLOW', fontsize=14, fontweight='bold', ha='center', va='center', color='#1E293B')

def draw_step(ax, x, y, w, h, step_num, title, desc, color='#2563EB', bg='#EFF6FF'):
    rect = patches.FancyBboxPatch((x, y), w, h, boxstyle='round,pad=0.3,rounding_size=0.8',
                                 linewidth=1.5, edgecolor=color, facecolor=bg)
    ax.add_patch(rect)
    ax.text(x + 2, y + h - 2.5, f'Step {step_num}', fontsize=8, fontweight='bold', color=color)
    ax.text(x + w/2, y + h*0.55, title, fontsize=9.5, fontweight='bold', ha='center', va='center', color='#0F172A')
    ax.text(x + w/2, y + h*0.25, desc, fontsize=8, ha='center', va='center', color='#475569')

# Grid layout for steps (3x3 grid)
steps = [
    (1, 'Patient Reg & ABHA Auth', 'Login, ABHA ID verify, select language', 4, 78),
    (2, 'Doctor & Slot Selection', 'Search nearby providers & pick slot', 36, 78),
    (3, 'Clinical Detail Entry', 'Enter symptoms & appointment request', 68, 78),
    
    (4, 'ML Urgency Triage', 'Gradient Boosting classifies urgency', 68, 48),
    (5, 'Doctor Consultation', 'Review unified EHR history & records', 36, 48),
    (6, 'Diagnosis & Emergency Transfer', 'Record prescriptions or trigger referral', 4, 48),
    
    (7, 'Maternal RCH Linking', 'Track pregnancy & ANC checkups', 4, 18),
    (8, 'Immunization & Reminders', 'Auto-schedule doses & dispatch emails', 36, 18),
    (9, 'Workload & Risk Analytics', 'Update doctor risk score & clinic flow', 68, 18),
]

for s_num, s_title, s_desc, x, y in steps:
    draw_step(ax, x, y, 28, 14, s_num, s_title, s_desc)

# Arrows
arr = dict(arrowstyle='->,head_width=0.3,head_length=0.5', lw=2, color='#334155')

# Row 1 (Right ->)
ax.annotate('', xy=(34, 85), xytext=(32, 85), arrowprops=arr)
ax.annotate('', xy=(66, 85), xytext=(64, 85), arrowprops=arr)

# Down to Row 2
ax.annotate('', xy=(82, 64), xytext=(82, 76), arrowprops=arr)

# Row 2 (Left <-)
ax.annotate('', xy=(66, 55), xytext=(68, 55), arrowprops=arr)
ax.annotate('', xy=(34, 55), xytext=(36, 55), arrowprops=arr)

# Down to Row 3
ax.annotate('', xy=(18, 34), xytext=(18, 46), arrowprops=arr)

# Row 3 (Right ->)
ax.annotate('', xy=(34, 25), xytext=(32, 25), arrowprops=arr)
ax.annotate('', xy=(66, 25), xytext=(64, 25), arrowprops=arr)

out_path = r'd:\College\PG\SEM III\Miniproject\project\Unified-Heathcare-Appointment-and-Immunization-Tracking-System\diagram_workflow_a4.png'
plt.tight_layout()
plt.savefig(out_path, dpi=300, bbox_inches='tight', pad_inches=0.2)
plt.close()
print('Successfully generated workflow diagram:', out_path)
