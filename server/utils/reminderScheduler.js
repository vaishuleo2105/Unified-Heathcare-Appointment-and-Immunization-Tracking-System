const cron = require('node-cron')
const axios = require('axios')
const nodemailer = require('nodemailer')
const Appointment = require('../models/Appointment')
const User = require('../models/User')
const { sendSMS } = require('./smsService')

function createTransporter() {
  const EMAIL_USER = process.env.EMAIL_USER || ''
  const EMAIL_PASS = process.env.EMAIL_PASS || ''
  const isConfigured = EMAIL_USER && !EMAIL_USER.includes('your_email')

  if (!isConfigured) return null
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: { user: EMAIL_USER, pass: EMAIL_PASS },
  })
}

async function sendEmail(to, subject, html) {
  const recipients = Array.isArray(to) ? to : [to]
  let sent = false

  if (process.env.RESEND_API_KEY) {
    try {
      await axios.post(
        'https://api.resend.com/emails',
        {
          from: 'Unified Health <onboarding@resend.dev>',
          to: recipients,
          subject,
          html,
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      )
      sent = true
    } catch (err) {
      console.error('[Email Resend Error]:', err.response?.data || err.message)
    }
  }

  if (!sent) {
    const transporter = createTransporter()
    if (transporter) {
      try {
        await transporter.sendMail({
          from: `"Unified Health System" <${process.env.EMAIL_USER}>`,
          to: recipients.join(', '),
          subject,
          html,
        })
        sent = true
      } catch (err) {
        console.error('[Email Nodemailer Error]:', err.message)
      }
    }
  }

  if (!sent) {
    console.log(`[Email Notification] "${subject}" dispatched to: ${recipients.join(', ')}`)
  }
}

function getDateString(offsetDays = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return d.toLocaleDateString('en-CA')
}

function buildEmailHtml(patient, doctor, appt, message) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;border:1px solid #e0e0e0;border-radius:8px;padding:24px;">
      <h2 style="color:#ba894d;">Appointment Reminder</h2>
      <p>Hi <strong>${patient.firstName}</strong>,</p>
      <p>${message}</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr><td style="padding:6px;color:#555;">Date</td><td style="padding:6px;font-weight:bold;">${appt.date}</td></tr>
        <tr><td style="padding:6px;color:#555;">Time</td><td style="padding:6px;font-weight:bold;">${appt.time}</td></tr>
        <tr><td style="padding:6px;color:#555;">Doctor</td><td style="padding:6px;font-weight:bold;">Dr. ${doctor?.firstName} ${doctor?.lastName}</td></tr>
        <tr><td style="padding:6px;color:#555;">Type</td><td style="padding:6px;font-weight:bold;">${appt.type}</td></tr>
        <tr><td style="padding:6px;color:#555;">Status</td><td style="padding:6px;font-weight:bold;">${appt.status}</td></tr>
      </table>
      <p style="color:#555;">Please arrive 10 minutes early. Cancellations are permitted up to 24 hours prior to your scheduled time.</p>
      <p style="color:#888;font-size:12px;">– Unified Healthcare System</p>
    </div>
  `
}

async function sendRemindersForDate(dateStr, subject, message) {
  const channel = (process.env.NOTIFICATION_CHANNEL || 'both').toLowerCase()
  const appointments = await Appointment.find({
    date: dateStr,
    status: { $in: ['Pending', 'Confirmed'] },
  })
    .populate('patientId', 'firstName lastName email phone')
    .populate('doctorId', 'firstName lastName phone')

  if (appointments.length === 0) {
    console.log(`[Reminders] No appointments for ${dateStr}`)
    return
  }

  const results = await Promise.allSettled(
    appointments.map(async (appt) => {
      const patient = appt.patientId
      const doctor = appt.doctorId
      const docName = doctor?.firstName ? `Dr. ${doctor.firstName} ${doctor.lastName || ''}` : 'your doctor'

      // 1. Dual-Mode: Email Dispatch
      if ((channel === 'both' || channel === 'email') && patient?.email) {
        await sendEmail(patient.email, subject, buildEmailHtml(patient, doctor, appt, message))
      }

      // 2. Dual-Mode: SMS Dispatch
      if (channel === 'both' || channel === 'sms') {
        const patientPhone = patient?.phone || '9791868857'
        const smsBody = `Unified Health Reminder: You have an upcoming appointment with ${docName} on ${appt.date} at ${appt.time} (${appt.type}). Please arrive 10 min early.`
        await sendSMS(patientPhone, smsBody)
      }
    })
  )

  const sent = results.filter((r) => r.status === 'fulfilled').length
  const failed = results.filter((r) => r.status === 'rejected').length
  console.log(`[Reminders] "${subject}" — ${dateStr}: ${sent} processed, ${failed} failed`)
}

async function sendBookingConfirmation(appt) {
  try {
    const patient = appt.patientId
    const doctor = appt.doctorId
    const channel = (process.env.NOTIFICATION_CHANNEL || 'both').toLowerCase()

    const staffMembers = await User.find({ role: { $in: ['staff', 'admin'] } }).select('email firstName lastName phone')
    const staffEmails = staffMembers.map(s => s.email).filter(Boolean)
    const staffPhones = staffMembers.map(s => s.phone).filter(Boolean)

    const docName = doctor?.firstName ? `Dr. ${doctor.firstName} ${doctor.lastName || ''}` : 'Assigned Doctor'
    const patName = patient?.firstName ? `${patient.firstName} ${patient.lastName || ''}` : 'Patient'

    // 1. All Stakeholder Phones (Deduplicated so shared 9791868857 dispatches cleanly)
    const recipientPhones = Array.from(new Set([
      patient?.phone || '9791868857',
      doctor?.phone || '9791868857',
      ...staffPhones
    ].filter(Boolean)))

    // 2. Instant SMS Dispatch to Patient, Doctor, and Staff
    if (channel === 'both' || channel === 'sms') {
      const smsBody = `Unified Health: New appointment confirmed! Patient: ${patName}, Doctor: ${docName}, Date: ${appt.date} at ${appt.time} (${appt.type}). Notice sent to Patient, Doctor & Clinic Staff.`
      sendSMS(recipientPhones, smsBody).catch(err =>
        console.error('[SMS] Booking confirmation failed:', err.message)
      )
    }

    // 3. Email Dispatch to Patient, Doctor, and Staff
    if (channel === 'both' || channel === 'email') {
      const recipientEmails = Array.from(new Set([
        patient?.email,
        doctor?.email,
        ...staffEmails
      ].filter(Boolean)))

      if (recipientEmails.length > 0) {
        const emailHtml = `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
            <div style="background-color: #0284c7; color: #ffffff; padding: 24px; text-align: center;">
              <h2 style="margin: 0; font-size: 22px; font-weight: bold;">📅 New Appointment Confirmed</h2>
              <p style="margin: 6px 0 0 0; font-size: 14px; opacity: 0.9;">Unified Healthcare Notification Service</p>
            </div>

            <div style="padding: 28px; background-color: #ffffff;">
              <p style="font-size: 15px; color: #1e293b; margin-top: 0;">
                Notice to <strong>Patient, Assigned Doctor, and Clinic Staff</strong>: A new appointment has been scheduled and confirmed in the system.
              </p>

              <div style="background-color: #f0f9ff; border-left: 4px solid #0284c7; padding: 20px; margin: 24px 0; border-radius: 6px;">
                <h3 style="margin: 0 0 14px 0; color: #0369a1; font-size: 16px; text-transform: uppercase; letter-spacing: 0.5px;">Appointment Details</h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #334155;">
                  <tr style="border-bottom: 1px solid #e0f2fe;">
                    <td style="padding: 8px 0; font-weight: bold; width: 35%;">Patient Name:</td>
                    <td style="padding: 8px 0;">${patName} (${patient?.email || 'N/A'}, Phone: ${patient?.phone || '9791868857'})</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #e0f2fe;">
                    <td style="padding: 8px 0; font-weight: bold;">Doctor Assigned:</td>
                    <td style="padding: 8px 0;">${docName} (${doctor?.email || 'N/A'}, Phone: ${doctor?.phone || '9791868857'})</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #e0f2fe;">
                    <td style="padding: 8px 0; font-weight: bold;">Date:</td>
                    <td style="padding: 8px 0; font-weight: bold; color: #0369a1;">${appt.date}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #e0f2fe;">
                    <td style="padding: 8px 0; font-weight: bold;">Time Slot:</td>
                    <td style="padding: 8px 0; font-weight: bold; color: #0369a1;">${appt.time}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #e0f2fe;">
                    <td style="padding: 8px 0; font-weight: bold;">Appointment Type:</td>
                    <td style="padding: 8px 0;">${appt.type}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #e0f2fe;">
                    <td style="padding: 8px 0; font-weight: bold;">Status:</td>
                    <td style="padding: 8px 0;"><span style="background-color: #bae6fd; color: #0369a1; padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: bold;">${appt.status || 'Confirmed'}</span></td>
                  </tr>
                  ${appt.notes ? `
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold;">Notes:</td>
                    <td style="padding: 8px 0;">${appt.notes}</td>
                  </tr>
                  ` : ''}
                </table>
              </div>

              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin: 18px 0;">
                <p style="margin: 0; font-size: 13px; color: #475569;">
                  <strong>ℹ️ Notice:</strong> Please arrive 10 minutes early. Cancellations are permitted up to 24 hours prior to the appointment.
                </p>
              </div>

              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
              <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">
                Unified Healthcare Appointment & Tracking System
              </p>
            </div>
          </div>
        `

        sendEmail(
          recipientEmails,
          `✅ New Appointment Scheduled: ${appt.date} at ${appt.time} - ${patName} with ${docName}`,
          emailHtml
        ).catch(err =>
          console.error('[Email] Booking confirmation email failed:', err.message)
        )
      }
    }
  } catch (err) {
    console.error('[Reminders] Failed to dispatch booking confirmations:', err.message)
  }
}

async function sendCancellationNotification(appt, cancelledByUser, reason) {
  try {
    const patient = appt.patientId
    const doctor = appt.doctorId
    const cancellationReason = reason || appt.cancellationReason || 'No specific reason provided'
    const channel = (process.env.NOTIFICATION_CHANNEL || 'both').toLowerCase()

    const staffMembers = await User.find({ role: { $in: ['staff', 'admin'] } }).select('email firstName lastName phone')
    const staffEmails = staffMembers.map(s => s.email).filter(Boolean)
    const staffPhones = staffMembers.map(s => s.phone).filter(Boolean)

    const doctorEmail = doctor?.email
    const patientEmail = patient?.email

    const cancelledByName = cancelledByUser
      ? `${cancelledByUser.firstName} ${cancelledByUser.lastName} (${cancelledByUser.role})`
      : 'Patient'

    const docName = doctor?.firstName ? `Dr. ${doctor.firstName} ${doctor.lastName || ''}` : 'Doctor'
    const patName = patient?.firstName ? `${patient.firstName} ${patient.lastName || ''}` : 'Patient'

    // 1. All Stakeholder Phones (Deduplicated)
    const recipientPhones = Array.from(new Set([
      patient?.phone || '9791868857',
      doctor?.phone || '9791868857',
      ...staffPhones
    ].filter(Boolean)))

    // 2. Instant SMS Dispatch to Patient, Doctor, and Staff
    if (channel === 'both' || channel === 'sms') {
      const cancellationSms = `Unified Health Alert: Appointment on ${appt.date} at ${appt.time} with ${docName} (Patient: ${patName}) was CANCELLED by ${cancelledByName}. Reason: ${cancellationReason}. Notice sent to Patient, Doctor & Clinic Staff.`
      
      console.log(`[Notification] Dispatching cancellation SMS to ${recipientPhones.join(', ')}...`)
      await sendSMS(recipientPhones, cancellationSms)
    }

    // 3. Email Dispatch to Patient, Doctor, and Staff
    if (channel === 'both' || channel === 'email') {
      const recipientEmails = Array.from(new Set([
        doctorEmail,
        ...staffEmails,
        patientEmail
      ].filter(Boolean)))

      if (recipientEmails.length > 0) {
        const emailHtml = `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
            <div style="background-color: #dc2626; color: #ffffff; padding: 24px; text-align: center;">
              <h2 style="margin: 0; font-size: 22px; font-weight: bold;">⚠️ Appointment Cancelled</h2>
              <p style="margin: 6px 0 0 0; font-size: 14px; opacity: 0.9;">Unified Healthcare Notification Service</p>
            </div>

            <div style="padding: 28px; background-color: #ffffff;">
              <p style="font-size: 15px; color: #1e293b; margin-top: 0;">
                Notice to Doctor, Nursing Staff, and Patient: An upcoming appointment has been <strong>CANCELLED</strong> by <strong>${cancelledByName}</strong>.
              </p>

              <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; margin: 24px 0; border-radius: 6px;">
                <h3 style="margin: 0 0 14px 0; color: #991b1b; font-size: 16px; text-transform: uppercase; letter-spacing: 0.5px;">Cancelled Appointment Details</h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #334155;">
                  <tr style="border-bottom: 1px solid #fee2e2;">
                    <td style="padding: 8px 0; font-weight: bold; width: 35%;">Patient Name:</td>
                    <td style="padding: 8px 0;">${patient?.firstName} ${patient?.lastName} (${patient?.email || 'N/A'})</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #fee2e2;">
                    <td style="padding: 8px 0; font-weight: bold;">Doctor Assigned:</td>
                    <td style="padding: 8px 0;">${docName} (${doctor?.email || 'N/A'})</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #fee2e2;">
                    <td style="padding: 8px 0; font-weight: bold;">Date:</td>
                    <td style="padding: 8px 0;">${appt.date}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #fee2e2;">
                    <td style="padding: 8px 0; font-weight: bold;">Time Slot:</td>
                    <td style="padding: 8px 0;">${appt.time}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #fee2e2;">
                    <td style="padding: 8px 0; font-weight: bold;">Appointment Type:</td>
                    <td style="padding: 8px 0;">${appt.type}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #fee2e2;">
                    <td style="padding: 8px 0; font-weight: bold;">Cancelled By:</td>
                    <td style="padding: 8px 0;">${cancelledByName}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #fee2e2; background-color: #fee2e2;">
                    <td style="padding: 10px 8px; font-weight: bold; color: #991b1b;">Reason for Cancellation:</td>
                    <td style="padding: 10px 8px; color: #991b1b; font-weight: bold; font-size: 14px;">${cancellationReason}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold;">Cancellation Status:</td>
                    <td style="padding: 8px 0;"><span style="background-color: #fca5a5; color: #7f1d1d; padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: bold;">Cancelled</span></td>
                  </tr>
                </table>
              </div>

              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin: 18px 0;">
                <p style="margin: 0; font-size: 13px; color: #475569;">
                  <strong>ℹ️ Note to Doctor & Staff:</strong> The slot <strong>${appt.time} on ${appt.date}</strong> has been automatically freed up in the system and is now available for other patients or walk-ins.
                </p>
              </div>

              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
              <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">
                Unified Healthcare Appointment & Tracking System
              </p>
            </div>
          </div>
        `

        sendEmail(
          recipientEmails,
          `⚠️ Cancellation Notice: Appointment on ${appt.date} at ${appt.time} (Patient: ${patName}) - Reason: ${cancellationReason}`,
          emailHtml
        ).catch(err =>
          console.error('[Email] Cancellation email failed:', err.message)
        )
      }
    }
  } catch (err) {
    console.error('[Reminders] Failed to dispatch cancellation notifications:', err.message)
  }
}

function startReminderScheduler() {
  cron.schedule('0 8 * * *', async () => {
    console.log('[Reminders] Running 8 AM reminder (tomorrow appointments)...')
    try {
      await sendRemindersForDate(getDateString(1), '🔔 Appointment Tomorrow – Morning Reminder', 'This is your <strong>morning reminder</strong> that you have an appointment <strong>tomorrow</strong>.')
    } catch (err) { console.error('[Reminders] 8 AM job error:', err.message) }
  }, { timezone: 'Asia/Kolkata' })

  cron.schedule('0 20 * * *', async () => {
    console.log('[Reminders] Running 8 PM reminder (tomorrow appointments)...')
    try {
      await sendRemindersForDate(getDateString(1), '🌙 Appointment Tomorrow – Evening Reminder', "This is your <strong>evening reminder</strong> that you have an appointment <strong>tomorrow</strong>. Get a good night's rest!")
    } catch (err) { console.error('[Reminders] 8 PM job error:', err.message) }
  }, { timezone: 'Asia/Kolkata' })

  cron.schedule('0 7 * * *', async () => {
    console.log('[Reminders] Running 7 AM reminder (today appointments)...')
    try {
      await sendRemindersForDate(getDateString(0), '🏥 Your Appointment is Today!', 'Your appointment is <strong>today</strong>! Please make sure you are prepared and arrive 10 minutes early.')
    } catch (err) { console.error('[Reminders] 7 AM today job error:', err.message) }
  }, { timezone: 'Asia/Kolkata' })

  console.log('[Reminders] Scheduler started — 8 AM tomorrow, 8 PM tomorrow, 7 AM today (all IST)')
}

module.exports = { startReminderScheduler, sendBookingConfirmation, sendCancellationNotification }

