import matplotlib.pyplot as plt
import matplotlib.patches as patches
import os

fig, ax = plt.subplots(figsize=(11, 8.5), dpi=300)
ax.set_xlim(0, 100)
ax.set_ylim(0, 100)
ax.axis('off')

# Title & Subtitle
ax.text(50, 96.5, 'END-TO-END PATIENT CARE LIFECYCLE WORKFLOW', fontsize=15, fontweight='bold', ha='center', va='center', color='#0F172A')
ax.text(50, 93.8, 'Unified Healthcare Appointment, Immunization & Emergency Tracking System', fontsize=9.5, fontstyle='italic', ha='center', va='center', color='#475569')

# Category Legend Bar at top
def draw_legend_pill(ax, x, y, w, h, label, bg, border, text_color):
    rect = patches.FancyBboxPatch((x, y), w, h, boxstyle='round,pad=0.2,rounding_size=0.8', linewidth=1.2, edgecolor=border, facecolor=bg)
    ax.add_patch(rect)
    ax.text(x + w/2, y + h/2, label, fontsize=8.5, fontweight='bold', ha='center', va='center', color=text_color)

draw_legend_pill(ax, 5, 88.5, 20, 3.2, 'Blue: Patient Actions', '#EFF6FF', '#3B82F6', '#1E40AF')
draw_legend_pill(ax, 28, 88.5, 20, 3.2, 'Purple: ML Inference', '#F5F3FF', '#8B5CF6', '#5B21B6')
draw_legend_pill(ax, 51, 88.5, 21, 3.2, 'Green: Clinical Actions', '#ECFDF5', '#10B981', '#065F46')
draw_legend_pill(ax, 75, 88.5, 20, 3.2, 'Orange: System Schedulers', '#FFFBEB', '#F59E0B', '#92400E')

# Card Drawing Function (Exact Uniform Size W=27, H=14)
def draw_neat_card(ax, x, y, step_num, title, desc, bg, border, header_color):
    w, h = 27, 14
    rect = patches.FancyBboxPatch((x, y), w, h, boxstyle='round,pad=0.4,rounding_size=1.2', linewidth=1.6, edgecolor=border, facecolor=bg)
    ax.add_patch(rect)
    
    # Step Badge
    badge_rect = patches.FancyBboxPatch((x + 1.2, y + h - 3.2), 6.5, 2.2, boxstyle='round,pad=0.1,rounding_size=0.4', linewidth=1, edgecolor=border, facecolor='#FFFFFF')
    ax.add_patch(badge_rect)
    ax.text(x + 4.45, y + h - 2.1, f'Step {step_num}', fontsize=7.5, fontweight='bold', ha='center', va='center', color=header_color)
    
    # Title
    ax.text(x + w/2, y + h*0.58, title, fontsize=9.5, fontweight='bold', ha='center', va='center', color='#0F172A', wrap=True)
    
    # Description
    ax.text(x + w/2, y + h*0.25, desc, fontsize=7.8, ha='center', va='center', color='#475569', wrap=True)

# Grid Layout Coordinates (3 Columns x 3 Rows)

# ROW 1 (Steps 1, 2, 3 - Blue Patient Actions)
draw_neat_card(ax, 4, 69.5, 1, 'Registration & ABHA Auth', 'Login, verify ABHA Health ID\nSelect language (EN/HI/TA/TE/KN/ML)', '#EFF6FF', '#3B82F6', '#1E40AF')
draw_neat_card(ax, 36.5, 69.5, 2, 'Doctor & Slot Selection', 'Search nearby hospital providers\nSelect available consultation slot', '#EFF6FF', '#3B82F6', '#1E40AF')
draw_neat_card(ax, 69, 69.5, 3, 'Clinical Symptoms Entry', 'Enter symptoms & medical notes\nSubmit appointment request', '#EFF6FF', '#3B82F6', '#1E40AF')

# ROW 2 (Steps 4, 5, 6 - ML Triage & Clinical Consultation)
draw_neat_card(ax, 69, 49, 4, 'ML Urgency Triage', 'Gradient Boosting Classifier\nPredicts urgency & triage priority', '#F5F3FF', '#8B5CF6', '#5B21B6')
draw_neat_card(ax, 36.5, 49, 5, 'Doctor Consultation', 'Review consolidated medical history\nacross all past visited hospitals', '#ECFDF5', '#10B981', '#065F46')
draw_neat_card(ax, 4, 49, 6, 'Diagnosis & Emergency Transfer', 'Record diagnoses & prescriptions or\ndispatch emergency referral snapshot', '#ECFDF5', '#10B981', '#065F46')

# ROW 3 (Steps 7, 8, 9 - Maternal, Immunization & Workload Risk)
draw_neat_card(ax, 4, 28.5, 7, 'Maternal RCH ID Linking', 'Link pregnancy, antenatal ANC checkups\nand delivery details under RCH ID', '#ECFDF5', '#10B981', '#065F46')
draw_neat_card(ax, 36.5, 28.5, 8, 'Child Immunization & Reminders', 'Generate vaccination milestones\nnode-cron background email alerts', '#FFFBEB', '#F59E0B', '#92400E')
draw_neat_card(ax, 69, 28.5, 9, 'Workload Risk Optimization', 'Flask ML updates doctor risk score (0-100)\nOptimizes clinical queue allocation', '#F5F3FF', '#8B5CF6', '#5B21B6')

# BOTTOM FOUNDATION LAYER (Database & Email Service)
# Shared MongoDB Cylinder Box
rect_db = patches.FancyBboxPatch((4, 8), 45, 14, boxstyle='round,pad=0.4,rounding_size=1.2', linewidth=1.6, edgecolor='#64748B', facecolor='#F1F5F9')
ax.add_patch(rect_db)
ax.text(26.5, 17, 'Shared MongoDB EHR Repository', fontsize=10, fontweight='bold', ha='center', va='center', color='#1E293B')
ax.text(26.5, 11.5, 'Consolidated Patient Profiles, Medical History, Prescriptions,\nMaternal RCH Records, Immunizations & Emergency Transfer Logs', fontsize=8, ha='center', va='center', color='#475569')

# Nodemailer Service Box
rect_mail = patches.FancyBboxPatch((51.5, 8), 44.5, 14, boxstyle='round,pad=0.4,rounding_size=1.2', linewidth=1.6, edgecolor='#F59E0B', facecolor='#FFFBEB')
ax.add_patch(rect_mail)
ax.text(73.75, 17, 'Nodemailer Notification Gateway', fontsize=10, fontweight='bold', ha='center', va='center', color='#92400E')
ax.text(73.75, 11.5, 'Automated Vaccine Due Date Alerts, Appointment Confirmations,\nFollow-Up Reminders & Emergency Referral Email Dispatches', fontsize=8, ha='center', va='center', color='#78350F')

# ARROWS (Clean directional flow)
arr_main = dict(arrowstyle='->,head_width=0.35,head_length=0.55', lw=1.8, color='#334155')

# Row 1 (Step 1 -> Step 2 -> Step 3)
ax.annotate('', xy=(35.5, 76.5), xytext=(31, 76.5), arrowprops=arr_main)
ax.annotate('', xy=(68, 76.5), xytext=(63.5, 76.5), arrowprops=arr_main)

# Step 3 Down to Step 4
ax.annotate('', xy=(82.5, 63.5), xytext=(82.5, 69.5), arrowprops=arr_main)

# Row 2 (Step 4 <- Step 5 <- Step 6)
ax.annotate('', xy=(64, 56), xytext=(69, 56), arrowprops=arr_main)
ax.annotate('', xy=(31.5, 56), xytext=(36.5, 56), arrowprops=arr_main)

# Step 6 Down to Step 7
ax.annotate('', xy=(17.5, 43), xytext=(17.5, 49), arrowprops=arr_main)

# Row 3 (Step 7 -> Step 8 -> Step 9)
ax.annotate('', xy=(35.5, 35.5), xytext=(31, 35.5), arrowprops=arr_main)
ax.annotate('', xy=(68, 35.5), xytext=(63.5, 35.5), arrowprops=arr_main)

# Step 7 Down to DB
ax.annotate('', xy=(26.5, 22.5), xytext=(26.5, 28.5), arrowprops=dict(arrowstyle='<->,head_width=0.35,head_length=0.55', lw=1.8, color='#64748B'))

# Step 8 Down to Nodemailer
ax.annotate('', xy=(73.75, 22.5), xytext=(73.75, 28.5), arrowprops=dict(arrowstyle='->,head_width=0.35,head_length=0.55', lw=1.8, color='#F59E0B'))

# Footer note
ax.text(50, 3, 'Note: Numbers 1 through 9 indicate the sequential patient care lifecycle. Database maintains record continuity throughout all steps.', fontsize=8, fontstyle='italic', ha='center', va='center', color='#64748B')

out_path = r'd:\College\PG\SEM III\Miniproject\project\Unified-Heathcare-Appointment-and-Immunization-Tracking-System\diagram_workflow_neat_a4.png'
plt.tight_layout()
plt.savefig(out_path, dpi=300, bbox_inches='tight', pad_inches=0.2)
plt.close()
print('Successfully generated clean, neat A4 workflow diagram without warnings:', out_path)
