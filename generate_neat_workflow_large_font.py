import matplotlib.pyplot as plt
import matplotlib.patches as patches
import subprocess
import os

# Ensure Word is closed so file write is available
subprocess.run(['taskkill', '/F', '/IM', 'WINWORD.EXE'], capture_output=True)

fig, ax = plt.subplots(figsize=(11, 8.5), dpi=300)
ax.set_xlim(0, 100)
ax.set_ylim(0, 100)
ax.axis('off')

# Title & Subtitle (Large Fonts 16pt & 11pt)
ax.text(50, 96.2, 'END-TO-END PATIENT CARE LIFECYCLE WORKFLOW', fontsize=16, fontweight='bold', ha='center', va='center', color='#0F172A')
ax.text(50, 93.3, 'Unified Healthcare Appointment, Immunization & Emergency Tracking System', fontsize=11, fontstyle='italic', ha='center', va='center', color='#475569')

# Category Legend Bar at top (Font 10pt)
def draw_legend_pill(ax, x, y, w, h, label, bg, border, text_color):
    rect = patches.FancyBboxPatch((x, y), w, h, boxstyle='round,pad=0.2,rounding_size=0.8', linewidth=1.4, edgecolor=border, facecolor=bg)
    ax.add_patch(rect)
    ax.text(x + w/2, y + h/2, label, fontsize=10, fontweight='bold', ha='center', va='center', color=text_color)

draw_legend_pill(ax, 3, 87.5, 22, 3.8, 'Blue: Patient Actions', '#EFF6FF', '#3B82F6', '#1E40AF')
draw_legend_pill(ax, 27, 87.5, 22, 3.8, 'Purple: ML Inference', '#F5F3FF', '#8B5CF6', '#5B21B6')
draw_legend_pill(ax, 51, 87.5, 23, 3.8, 'Green: Clinical Actions', '#ECFDF5', '#10B981', '#065F46')
draw_legend_pill(ax, 76, 87.5, 21, 3.8, 'Orange: Schedulers', '#FFFBEB', '#F59E0B', '#92400E')

# Card Drawing Function (Large Fonts 12pt titles, 10pt badges/subtitles)
def draw_neat_card(ax, x, y, step_num, title, desc, bg, border, header_color):
    w, h = 28, 15.5
    rect = patches.FancyBboxPatch((x, y), w, h, boxstyle='round,pad=0.4,rounding_size=1.2', linewidth=1.8, edgecolor=border, facecolor=bg)
    ax.add_patch(rect)
    
    # Step Badge (Font 10pt)
    badge_rect = patches.FancyBboxPatch((x + 1.2, y + h - 3.6), 7.5, 2.7, boxstyle='round,pad=0.1,rounding_size=0.4', linewidth=1.2, edgecolor=border, facecolor='#FFFFFF')
    ax.add_patch(badge_rect)
    ax.text(x + 4.95, y + h - 2.2, f'Step {step_num}', fontsize=10, fontweight='bold', ha='center', va='center', color=header_color)
    
    # Title (Font 12pt Bold)
    ax.text(x + w/2, y + h*0.58, title, fontsize=12, fontweight='bold', ha='center', va='center', color='#0F172A')
    
    # Description (Font 10pt)
    ax.text(x + w/2, y + h*0.25, desc, fontsize=10, ha='center', va='center', color='#334155')

# ROW 1 (Steps 1, 2, 3 - Blue Patient Actions)
draw_neat_card(ax, 3.5, 67.5, 1, 'Registration & ABHA Auth', 'Login, verify ABHA Health ID\nSelect UI language (EN/HI/TA...)', '#EFF6FF', '#3B82F6', '#1E40AF')
draw_neat_card(ax, 36, 67.5, 2, 'Doctor & Slot Selection', 'Search nearby hospital doctors\nSelect available consultation slot', '#EFF6FF', '#3B82F6', '#1E40AF')
draw_neat_card(ax, 68.5, 67.5, 3, 'Clinical Symptoms Entry', 'Enter symptoms & notes\nSubmit appointment request', '#EFF6FF', '#3B82F6', '#1E40AF')

# ROW 2 (Steps 4, 5, 6 - ML Triage & Clinical Consultation)
draw_neat_card(ax, 68.5, 46.5, 4, 'ML Urgency Triage', 'Gradient Boosting Classifier\nPredicts urgency & triage priority', '#F5F3FF', '#8B5CF6', '#5B21B6')
draw_neat_card(ax, 36, 46.5, 5, 'Doctor Consultation', 'Review consolidated EHR history\nacross all past visited hospitals', '#ECFDF5', '#10B981', '#065F46')
draw_neat_card(ax, 3.5, 46.5, 6, 'Diagnosis & Emergency Transfer', 'Record diagnoses & prescriptions or\ndispatch emergency referral snapshot', '#ECFDF5', '#10B981', '#065F46')

# ROW 3 (Steps 7, 8, 9 - Maternal, Immunization & Workload Risk)
draw_neat_card(ax, 3.5, 25.5, 7, 'Maternal RCH ID Linking', 'Link pregnancy, ANC checkups\nand delivery details under RCH ID', '#ECFDF5', '#10B981', '#065F46')
draw_neat_card(ax, 36, 25.5, 8, 'Child Immunization & Reminders', 'Generate vaccination milestones\nnode-cron background email alerts', '#FFFBEB', '#F59E0B', '#92400E')
draw_neat_card(ax, 68.5, 25.5, 9, 'Workload Risk Optimization', 'Flask ML updates doctor risk score (0-100)\nOptimizes clinical queue allocation', '#F5F3FF', '#8B5CF6', '#5B21B6')

# BOTTOM FOUNDATION LAYER (Font 12pt Titles, 10pt Descriptions)
# Shared MongoDB Box
rect_db = patches.FancyBboxPatch((3.5, 5), 45.5, 15, boxstyle='round,pad=0.4,rounding_size=1.2', linewidth=1.8, edgecolor='#64748B', facecolor='#F1F5F9')
ax.add_patch(rect_db)
ax.text(26.25, 14.8, 'Shared MongoDB EHR Repository', fontsize=12, fontweight='bold', ha='center', va='center', color='#1E293B')
ax.text(26.25, 9.2, 'Consolidated Patient Profiles, Medical History, Prescriptions,\nMaternal RCH Records, Immunizations & Emergency Transfer Logs', fontsize=10, ha='center', va='center', color='#334155')

# Nodemailer Box
rect_mail = patches.FancyBboxPatch((51, 5), 45.5, 15, boxstyle='round,pad=0.4,rounding_size=1.2', linewidth=1.8, edgecolor='#F59E0B', facecolor='#FFFBEB')
ax.add_patch(rect_mail)
ax.text(73.75, 14.8, 'Nodemailer Notification Gateway', fontsize=12, fontweight='bold', ha='center', va='center', color='#92400E')
ax.text(73.75, 9.2, 'Automated Vaccine Due Date Alerts, Appointment Confirmations,\nFollow-Up Reminders & Emergency Referral Email Dispatches', fontsize=10, ha='center', va='center', color='#78350F')

# ARROWS
arr_main = dict(arrowstyle='->,head_width=0.38,head_length=0.6', lw=2, color='#334155')

# Row 1 (Step 1 -> Step 2 -> Step 3)
ax.annotate('', xy=(35, 75.25), xytext=(31.5, 75.25), arrowprops=arr_main)
ax.annotate('', xy=(67.5, 75.25), xytext=(64, 75.25), arrowprops=arr_main)

# Step 3 Down to Step 4
ax.annotate('', xy=(82.5, 62), xytext=(82.5, 67.5), arrowprops=arr_main)

# Row 2 (Step 4 <- Step 5 <- Step 6)
ax.annotate('', xy=(64, 54.25), xytext=(68.5, 54.25), arrowprops=arr_main)
ax.annotate('', xy=(31.5, 54.25), xytext=(36, 54.25), arrowprops=arr_main)

# Step 6 Down to Step 7
ax.annotate('', xy=(17.5, 41), xytext=(17.5, 46.5), arrowprops=arr_main)

# Row 3 (Step 7 -> Step 8 -> Step 9)
ax.annotate('', xy=(35, 33.25), xytext=(31.5, 33.25), arrowprops=arr_main)
ax.annotate('', xy=(67.5, 33.25), xytext=(64, 33.25), arrowprops=arr_main)

# Step 7 Down to DB
ax.annotate('', xy=(26.25, 20), xytext=(26.25, 25.5), arrowprops=dict(arrowstyle='<->,head_width=0.38,head_length=0.6', lw=2, color='#64748B'))

# Step 8 Down to Nodemailer
ax.annotate('', xy=(58.75, 20), xytext=(58.75, 25.5), arrowprops=dict(arrowstyle='->,head_width=0.38,head_length=0.6', lw=2, color='#F59E0B'))

# Footer Note
ax.text(50, 1.8, 'Note: Steps 1 through 9 indicate the sequential patient care lifecycle. Database maintains record continuity throughout.', fontsize=9, fontstyle='italic', ha='center', va='center', color='#64748B')

out_path = r'd:\College\PG\SEM III\Miniproject\project\Unified-Heathcare-Appointment-and-Immunization-Tracking-System\diagram_workflow_neat_a4.png'
plt.tight_layout()
plt.savefig(out_path, dpi=300, bbox_inches='tight', pad_inches=0.2)
plt.close()
print('Successfully generated neat A4 workflow diagram with 10-12pt fonts:', out_path)
