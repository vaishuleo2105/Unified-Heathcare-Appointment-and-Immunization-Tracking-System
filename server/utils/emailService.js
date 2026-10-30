const nodemailer = require('nodemailer')
const axios = require('axios')
const dns = require('dns')

// Enforce IPv4 DNS resolution across Node to prevent IPv6 ENETUNREACH in cloud hosting (Render, AWS, etc.)
if (dns.setDefaultResultOrder) {
  try {
    dns.setDefaultResultOrder('ipv4first')
  } catch (e) {}
}

function getCredentials() {
  const EMAIL_USER = (process.env.EMAIL_USER || '').trim()
  const EMAIL_PASS = (process.env.EMAIL_PASS || '').trim().replace(/\s+/g, '')
  const isConfigured = EMAIL_USER && !EMAIL_USER.includes('your_email') && !!EMAIL_PASS
  return { EMAIL_USER, EMAIL_PASS, isConfigured }
}

function createTransporter(port = 465, secure = true) {
  const { EMAIL_USER, EMAIL_PASS, isConfigured } = getCredentials()
  if (!isConfigured) return null

  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port,
    secure,
    family: 4, // Explicitly force IPv4 socket to avoid IPv6 ENETUNREACH
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  })
}

async function sendEmail(to, subject, html) {
  const rawRecipients = Array.isArray(to) ? to : [to]
  const recipients = Array.from(new Set(
    rawRecipients
      .map(e => (typeof e === 'string' ? e.trim() : ''))
      .filter(e => e && e.includes('@') && !e.endsWith('@unifiedhealth.com'))
  ))

  if (recipients.length === 0) {
    console.log(`[Email] No external recipients for: "${subject}"`)
    return { success: false, reason: 'no_recipients' }
  }

  // 1. Try Resend if API key is provided (standard HTTP port 443)
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
          timeout: 10000,
        }
      )
      console.log(`[Email] Delivered via Resend to: ${recipients.join(', ')}`)
      return { success: true, provider: 'resend' }
    } catch (err) {
      console.warn('[Email Resend Warn]:', err.response?.data || err.message)
    }
  }

  const { EMAIL_USER, isConfigured } = getCredentials()
  if (!isConfigured) {
    console.warn('[Email] Email credentials (EMAIL_USER / EMAIL_PASS) not configured in .env')
    return { success: false, reason: 'not_configured' }
  }

  // 2. Try Gmail SMTP Port 465 (SSL + IPv4)
  try {
    const t465 = createTransporter(465, true)
    if (t465) {
      for (const recipient of recipients) {
        await t465.sendMail({
          from: `"Unified Health System" <${EMAIL_USER}>`,
          to: recipient,
          subject,
          html,
        })
      }
      console.log(`[Email] Delivered via Gmail (Port 465 IPv4) to: ${recipients.join(', ')}`)
      return { success: true, provider: 'gmail_465' }
    }
  } catch (err465) {
    console.warn('[Email] Port 465 attempt failed, trying Port 587:', err465.message)
  }

  // 3. Fallback: Try Gmail SMTP Port 587 (STARTTLS + IPv4)
  try {
    const t587 = createTransporter(587, false)
    if (t587) {
      for (const recipient of recipients) {
        await t587.sendMail({
          from: `"Unified Health System" <${EMAIL_USER}>`,
          to: recipient,
          subject,
          html,
        })
      }
      console.log(`[Email] Delivered via Gmail (Port 587 IPv4) to: ${recipients.join(', ')}`)
      return { success: true, provider: 'gmail_587' }
    }
  } catch (err587) {
    console.error('[Email] Port 587 attempt failed:', err587.message)
    throw new Error(`Gmail delivery failed: ${err587.message}`)
  }

  throw new Error('Could not establish SMTP connection')
}

async function sendOtpEmail(to, otp, subject = 'Your Health ID Verification OTP', title = 'Health ID Verification') {
  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e0e0e0;border-radius:12px;background:#ffffff">
      <h2 style="color:#1a73e8;margin-bottom:8px">${title}</h2>
      <p style="color:#555;margin-bottom:24px">Use the OTP below to verify your identity and complete your request.</p>
      <div style="background:#f0f4ff;border-radius:8px;padding:20px;text-align:center;letter-spacing:8px;font-size:32px;font-weight:bold;color:#1a73e8">
        ${otp}
      </div>
      <p style="color:#888;font-size:12px;margin-top:20px">This OTP is valid for 10 minutes. Do not share it with anyone.</p>
    </div>
  `
  return await sendEmail(to, subject, html)
}

module.exports = {
  sendEmail,
  sendOtpEmail,
  createTransporter,
}
