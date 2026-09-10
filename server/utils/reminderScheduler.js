const cron = require('node-cron')
const { BrevoClient } = require('@getbrevo/brevo')
const Appointment = require('../models/Appointment')

function sendEmail(to, subject, html) {
  const client = new BrevoClient({ apiKey: process.env.BREVO_API_KEY })
  return client.transactionalEmails.sendTransacEmail({
    sender: { name: 'Unified Health', email: process.env.EMAIL_FROM },
    to: [{ email: to }],
    subject,
    htmlContent: html,
  })
}

function getDateString(offsetDays = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return d.toLocaleDateString('en-CA') // YYYY-MM-DD in local timezone (IST)
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
      <p style="color:#555;">Please arrive 10 minutes early. If you need to cancel, do so through the portal.</p>
      <p style="color:#888;font-size:12px;">– Unified Healthcare System</p>
    </div>
  `
}

async function sendRemindersForDate(dateStr, subject, message) {
  const appointments = await Appointment.find({
    date: dateStr,
    status: { $in: ['Pending', 'Confirmed'] },
  })
    .populate('patientId', 'firstName lastName email')
    .populate('doctorId', 'firstName lastName')

  if (appointments.length === 0) {
    console.log(`[Reminders] No appointments for ${dateStr}`)
    return
  }

  const results = await Promise.allSettled(
    appointments.map((appt) => {
      const patient = appt.patientId
      const doctor = appt.doctorId
      if (!patient?.email) return Promise.resolve()
      return sendEmail(patient.email, subject, buildEmailHtml(patient, doctor, appt, message))
    })
  )

  const sent = results.filter((r) => r.status === 'fulfilled').length
  const failed = results.filter((r) => r.status === 'rejected').length
  console.log(`[Reminders] "${subject}" — ${dateStr}: ${sent} sent, ${failed} failed`)
}

async function sendBookingConfirmation(appt) {
  const patient = appt.patientId
  const doctor = appt.doctorId
  if (!patient?.email) return
  try {
    await sendEmail(
      patient.email,
      '✅ Appointment Booked – Unified Health',
      buildEmailHtml(patient, doctor, appt, 'Your appointment has been successfully booked. Here are your appointment details:')
    )
    console.log(`[Reminders] Booking confirmation sent to ${patient.email}`)
  } catch (err) {
    console.error(`[Reminders] Failed to send booking confirmation: ${err.message}`)
  }
}

function startReminderScheduler() {
  // 8:00 AM IST — morning reminder for tomorrow's appointments
  cron.schedule('0 8 * * *', async () => {
    console.log('[Reminders] Running 8 AM reminder (tomorrow appointments)...')
    try {
      await sendRemindersForDate(
        getDateString(1),
        '🔔 Appointment Tomorrow – Morning Reminder',
        'This is your <strong>morning reminder</strong> that you have an appointment <strong>tomorrow</strong>.'
      )
    } catch (err) {
      console.error('[Reminders] 8 AM job error:', err.message)
    }
  }, { timezone: 'Asia/Kolkata' })

  // 8:00 PM IST — evening reminder for tomorrow's appointments
  cron.schedule('0 20 * * *', async () => {
    console.log('[Reminders] Running 8 PM reminder (tomorrow appointments)...')
    try {
      await sendRemindersForDate(
        getDateString(1),
        '🌙 Appointment Tomorrow – Evening Reminder',
        "This is your <strong>evening reminder</strong> that you have an appointment <strong>tomorrow</strong>. Get a good night's rest!"
      )
    } catch (err) {
      console.error('[Reminders] 8 PM job error:', err.message)
    }
  }, { timezone: 'Asia/Kolkata' })

  // 7:00 AM IST — appointment day morning reminder
  cron.schedule('0 7 * * *', async () => {
    console.log('[Reminders] Running 7 AM reminder (today appointments)...')
    try {
      await sendRemindersForDate(
        getDateString(0),
        '🏥 Your Appointment is Today!',
        'Your appointment is <strong>today</strong>! Please make sure you are prepared and arrive 10 minutes early.'
      )
    } catch (err) {
      console.error('[Reminders] 7 AM today job error:', err.message)
    }
  }, { timezone: 'Asia/Kolkata' })

  console.log('[Reminders] Scheduler started — 8 AM tomorrow, 8 PM tomorrow, 7 AM today (all IST)')
}

module.exports = { startReminderScheduler, sendBookingConfirmation }
