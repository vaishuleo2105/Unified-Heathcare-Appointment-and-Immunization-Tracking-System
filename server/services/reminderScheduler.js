const cron = require('node-cron')
const nodemailer = require('nodemailer')
const User = require('../models/User')
const Hospital = require('../models/Hospital')
const Appointment = require('../models/Appointment')

function createTransporter() {
  const EMAIL_USER = process.env.EMAIL_USER || ''
  const EMAIL_PASS = process.env.EMAIL_PASS || ''
  const isConfigured = EMAIL_USER && EMAIL_USER !== 'your_email@gmail.com' && EMAIL_USER !== 'your_gmail@gmail.com'

  if (!isConfigured) {
    return null
  }

  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: EMAIL_USER.trim(),
      pass: EMAIL_PASS.replace(/\s+/g, '').trim(),
    },
  })
}

/**
 * Returns tomorrow's date formatted as YYYY-MM-DD
 */
function getTomorrowDateString() {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const year = tomorrow.getFullYear()
  const month = String(tomorrow.getMonth() + 1).padStart(2, '0')
  const day = String(tomorrow.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Generates clean responsive HTML email template containing all appointment details
 */
function generateReminderEmailHTML(appointment) {
  const patientName = appointment.patientId
    ? `${appointment.patientId.firstName} ${appointment.patientId.lastName}`
    : 'Valued Patient'
  const doctorName = appointment.doctorId
    ? `Dr. ${appointment.doctorId.firstName} ${appointment.doctorId.lastName}`
    : 'Assigned Doctor'
  const doctorEmail = appointment.doctorId?.email || 'N/A'
  const appointmentDate = appointment.date || 'Tomorrow'
  const appointmentTime = appointment.time || 'Scheduled Slot'
  const appointmentType = appointment.type || 'General Checkup'
  const status = appointment.status || 'Confirmed'
  const notes = appointment.notes || 'None'

  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 24px; border-radius: 12px;">
      <div style="background-color: #0284c7; color: #ffffff; padding: 24px; border-top-left-radius: 12px; border-top-right-radius: 12px; text-align: center;">
        <h1 style="margin: 0; font-size: 22px; font-weight: bold; letter-spacing: 0.5px;">Appointment Reminder</h1>
        <p style="margin: 6px 0 0 0; font-size: 14px; opacity: 0.9;">Unified Healthcare System</p>
      </div>

      <div style="background-color: #ffffff; padding: 28px; border-bottom-left-radius: 12px; border-bottom-right-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        <p style="font-size: 16px; color: #1e293b; margin-top: 0;">Dear <strong>${patientName}</strong>,</p>
        <p style="font-size: 15px; color: #334155; line-height: 1.6;">
          This is an automated notification to remind you of your upcoming medical appointment scheduled for <strong>tomorrow (${appointmentDate})</strong>.
        </p>

        <div style="background-color: #f0f9ff; border-left: 4px solid #0284c7; padding: 18px; margin: 24px 0; border-radius: 6px;">
          <h3 style="margin: 0 0 14px 0; color: #0369a1; font-size: 16px; text-transform: uppercase; letter-spacing: 0.5px;">Appointment Details</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #334155;">
            <tr style="border-bottom: 1px solid #e0f2fe;">
              <td style="padding: 8px 0; font-weight: bold; width: 35%;">Doctor Name:</td>
              <td style="padding: 8px 0;">${doctorName} (${doctorEmail})</td>
            </tr>
            <tr style="border-bottom: 1px solid #e0f2fe;">
              <td style="padding: 8px 0; font-weight: bold;">Date:</td>
              <td style="padding: 8px 0;">${appointmentDate}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e0f2fe;">
              <td style="padding: 8px 0; font-weight: bold;">Time Slot:</td>
              <td style="padding: 8px 0;">${appointmentTime}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e0f2fe;">
              <td style="padding: 8px 0; font-weight: bold;">Appointment Type:</td>
              <td style="padding: 8px 0;">${appointmentType}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e0f2fe;">
              <td style="padding: 8px 0; font-weight: bold;">Status:</td>
              <td style="padding: 8px 0;"><span style="background-color: #bae6fd; color: #0369a1; padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: bold;">${status}</span></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Notes:</td>
              <td style="padding: 8px 0;">${notes}</td>
            </tr>
          </table>
        </div>

        <p style="font-size: 14px; color: #64748b; line-height: 1.5;">
          Please ensure to arrive 10 minutes prior to your time slot. If you need to reschedule or view further details, please log in to your patient portal.
        </p>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">
          This email was automatically generated by the Unified Healthcare Appointment System. Please do not reply directly to this message.
        </p>
      </div>
    </div>
  `
}

/**
 * Main routine to query tomorrow's appointments and send reminder emails
 */
async function checkAndSendReminders() {
  console.log('[Reminder System] Running automated check for upcoming appointments...')
  const tomorrowStr = getTomorrowDateString()

  try {
    // Find all active appointments scheduled for tomorrow that have not had a reminder sent yet
    const appointments = await Appointment.find({
      date: tomorrowStr,
      status: { $in: ['Pending', 'Confirmed'] },
      reminderSent: { $ne: true },
    })
      .populate('patientId', 'firstName lastName email')
      .populate('doctorId', 'firstName lastName email')

    console.log(`[Reminder System] Found ${appointments.length} appointment(s) scheduled for tomorrow (${tomorrowStr}) needing reminders.`)

    if (appointments.length === 0) {
      return { count: 0, sent: 0, tomorrowStr }
    }

    const transporter = createTransporter()
    let sentCount = 0

    for (const appt of appointments) {
      const patientEmail = appt.patientId?.email
      if (!patientEmail) {
        console.warn(`[Reminder System] Appointment ${appt._id} has no patient email associated. Skipping.`)
        continue
      }

      const emailHtml = generateReminderEmailHTML(appt)
      const doctorTitle = appt.doctorId ? `Dr. ${appt.doctorId.firstName} ${appt.doctorId.lastName}` : 'your doctor'

      if (transporter) {
        try {
          await transporter.sendMail({
            from: `"Unified Health System" <${process.env.EMAIL_USER}>`,
            to: patientEmail,
            subject: `Reminder: Your Appointment Tomorrow (${appt.date}) at ${appt.time} with ${doctorTitle}`,
            html: emailHtml,
          })
          console.log(`[Reminder System] Email successfully sent to ${patientEmail} for appointment ${appt._id}`)
        } catch (mailErr) {
          console.error(`[Reminder System] Failed to send email to ${patientEmail}:`, mailErr.message)
        }
      } else {
        console.log(`[Reminder System] [DEV / SIMULATION] Email prepared for ${patientEmail} (Appointment ID: ${appt._id}). Add valid EMAIL_USER & EMAIL_PASS to .env to deliver live emails.`)
      }

      // Mark reminder as sent in database to avoid duplicate emails
      appt.reminderSent = true
      appt.reminderSentAt = new Date()
      await appt.save()
      sentCount++
    }

    return { count: appointments.length, sent: sentCount, tomorrowStr }
  } catch (err) {
    console.error('[Reminder System] Error during reminder execution:', err)
    throw err
  }
}

/**
 * Initializes the node-cron scheduled job
 */
function initReminderScheduler() {
  console.log('[Reminder System] Initializing automated appointment reminder cron service...')

  // Run initial check upon server startup
  checkAndSendReminders().catch((err) => {
    console.error('[Reminder System] Startup reminder check error:', err.message)
  })

  // Schedule to run every hour at minute 0 (0 * * * *) so next-day appointments are automatically processed
  cron.schedule('0 * * * *', async () => {
    console.log('[Reminder System] Executing hourly scheduled reminder check...')
    try {
      await checkAndSendReminders()
    } catch (err) {
      console.error('[Reminder System] Scheduled cron job error:', err.message)
    }
  })
}

module.exports = {
  checkAndSendReminders,
  initReminderScheduler,
  getTomorrowDateString,
}
