const axios = require('axios')
const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')

// Ensure latest .env is loaded
dotenv.config({ path: path.join(__dirname, '../.env') })

const DEBUG_LOG = path.join(__dirname, '../sms_debug.log')

function writeDebug(msg) {
  try {
    const entry = `[${new Date().toISOString()}] ${msg}\n`
    fs.appendFileSync(DEBUG_LOG, entry)
    console.log(msg)
  } catch {}
}

/**
 * Normalizes phone numbers to standard 10-digit or E.164 format
 */
function normalizePhoneNumber(phone) {
  if (!phone) return '9791868857'
  const cleaned = String(phone).trim()
  if (cleaned.startsWith('+91')) return cleaned
  if (cleaned.startsWith('+')) return cleaned
  if (/^\d{10}$/.test(cleaned)) {
    return `+91${cleaned}`
  }
  return cleaned
}

let cachedTwilioFrom = null

async function resolveTwilioSender(twilioSid, twilioToken, explicitFrom) {
  if (explicitFrom && !explicitFrom.includes('your_')) {
    return explicitFrom
  }
  if (cachedTwilioFrom) {
    return cachedTwilioFrom
  }
  try {
    const authHeader = `Basic ${Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64')}`
    const resp = await axios.get(
      `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/IncomingPhoneNumbers.json`,
      {
        headers: { 'Authorization': authHeader },
        timeout: 7000,
      }
    )
    const numbers = resp.data?.incoming_phone_numbers || []
    if (numbers.length > 0 && numbers[0].phone_number) {
      cachedTwilioFrom = numbers[0].phone_number
      writeDebug(`[SMS Gateway (Twilio)] Automatically resolved sender number: ${cachedTwilioFrom}`)
      return cachedTwilioFrom
    }
  } catch (err) {
    writeDebug(`[SMS Gateway (Twilio)] Failed to auto-resolve phone number: ${err.response?.data?.message || err.message}`)
  }
  return null
}

let cachedTelegramChatId = null

function extractTemplateVariables(msg) {
  const isCancel = msg.toLowerCase().includes('cancel')
  const dateMatch = msg.match(/\d{4}-\d{2}-\d{2}/)
  const timeMatch = msg.match(/\d{1,2}:\d{2}(?:\s*(?:AM|PM|am|pm))?/)
  const docMatch = msg.match(/Dr\.\s+[A-Za-z\s]+?(?=[,\(]|$)/)
  const patientMatch = msg.match(/Patient:\s*([A-Za-z\s]+?)(?=[,\(]|$)/)
  const reasonMatch = msg.match(/Reason:\s*([^.]+)/)

  const dateStr = dateMatch ? dateMatch[0] : new Date().toLocaleDateString('en-CA')
  const timeStr = timeMatch ? timeMatch[0] : '10:00 AM'
  const docStr = docMatch ? docMatch[0].trim() : 'Assigned Doctor'
  const patStr = patientMatch ? patientMatch[1].trim() : 'Patient'

  if (isCancel) {
    const reasonStr = reasonMatch ? reasonMatch[1].trim() : 'Emergency'
    return {
      "1": `CANCELLED: ${dateStr}`,
      "2": `${timeStr} with ${docStr} (${reasonStr})`,
      "3": "Cancelled"
    }
  }

  return {
    "1": `${dateStr}`,
    "2": `${timeStr} with ${docStr} (for ${patStr})`,
    "3": "Confirmed"
  }
}

function saveTelegramChatIdToEnv(chatId) {
  try {
    const envPath = path.join(__dirname, '../.env')
    if (fs.existsSync(envPath)) {
      let content = fs.readFileSync(envPath, 'utf8')
      if (content.includes('TELEGRAM_CHAT_ID=')) {
        content = content.replace(/TELEGRAM_CHAT_ID=.*$/m, `TELEGRAM_CHAT_ID=${chatId}`)
      } else {
        content += `\nTELEGRAM_CHAT_ID=${chatId}\n`
      }
      fs.writeFileSync(envPath, content, 'utf8')
      process.env.TELEGRAM_CHAT_ID = chatId
      writeDebug(`[Telegram] Automatically saved TELEGRAM_CHAT_ID=${chatId} to server/.env`)
    }
  } catch (e) {
    writeDebug(`[Telegram] Could not persist chat ID to .env: ${e.message}`)
  }
}

async function resolveTelegramChatId(token, explicitChatId) {
  if (explicitChatId && !explicitChatId.includes('your_')) {
    cachedTelegramChatId = explicitChatId
    return explicitChatId
  }
  if (cachedTelegramChatId) {
    return cachedTelegramChatId
  }
  try {
    const resp = await axios.get(`https://api.telegram.org/bot${token}/getUpdates`, { timeout: 12000 })
    const updates = resp.data?.result || []
    for (let i = updates.length - 1; i >= 0; i--) {
      const u = updates[i]
      const chat = u?.message?.chat || 
                   u?.edited_message?.chat || 
                   u?.channel_post?.chat || 
                   u?.my_chat_member?.chat || 
                   u?.chat_member?.chat || 
                   u?.callback_query?.message?.chat
      if (chat && chat.id) {
        cachedTelegramChatId = String(chat.id)
        writeDebug(`[Telegram] Successfully resolved chat ID: ${cachedTelegramChatId} (User: ${chat.first_name || ''} ${chat.username ? '@' + chat.username : ''})`)
        saveTelegramChatIdToEnv(cachedTelegramChatId)
        return cachedTelegramChatId
      }
    }
    writeDebug(`[Telegram] getUpdates checked ${updates.length} updates, but no active chat found yet.`)
  } catch (err) {
    writeDebug(`[Telegram] getUpdates error: ${err.message}`)
  }
  return null
}

/**
 * Dispatches an SMS message via Twilio, Fast2SMS, WhatsApp, Telegram, or Simulator
 */
async function sendSMS(to, message) {
  // Always reload directly from .env file to bypass any Node process.env caching
  const envPath = path.join(__dirname, '../.env')
  let currentEnv = { ...process.env }
  try {
    if (fs.existsSync(envPath)) {
      const parsed = dotenv.parse(fs.readFileSync(envPath))
      currentEnv = { ...currentEnv, ...parsed }
    }
  } catch (e) {
    writeDebug(`[SMS Service] Failed to read .env directly: ${e.message}`)
  }

  const target = to || '9791868857'
  let recipients = (Array.isArray(target) ? target : [target])
    .map(normalizePhoneNumber)
    .filter(Boolean)

  if (recipients.length === 0) {
    recipients = ['+919791868857']
  }

  const twilioSid = (currentEnv.TWILIO_ACCOUNT_SID || '').trim()
  const twilioToken = (currentEnv.TWILIO_AUTH_TOKEN || '').trim()
  const twilioFrom = (currentEnv.TWILIO_PHONE_NUMBER || '').trim()
  const fast2smsKey = (currentEnv.FAST2SMS_API_KEY || '').trim()
  const telegramToken = (currentEnv.TELEGRAM_BOT_TOKEN || '').trim()
  let telegramChatId = (currentEnv.TELEGRAM_CHAT_ID || '').trim()

  if (!telegramChatId) {
    try {
      const User = require('../models/User')
      const matched = await User.findOne({ telegramChatId: { $exists: true, $ne: '' } }).select('telegramChatId')
      if (matched && matched.telegramChatId) {
        telegramChatId = matched.telegramChatId
      }
    } catch (e) {}
  }

  writeDebug(`[SMS Dispatch Start] To: ${recipients.join(', ')} | From: ${twilioFrom || 'auto'} | Msg: "${message}"`)

  // 1. Telegram Bot Gateway (100% Free Forever, Unlimited Custom Text Alerts)
  if (telegramToken && !telegramToken.includes('your_')) {
    const activeChatId = await resolveTelegramChatId(telegramToken, telegramChatId)
    if (activeChatId) {
      try {
        const url = `https://api.telegram.org/bot${telegramToken}/sendMessage`
        const response = await axios.post(
          url,
          {
            chat_id: activeChatId,
            text: `📱 <b>Unified Health Alert (for 9791868857):</b>\n\n${message}`,
            parse_mode: 'HTML',
          },
          { timeout: 10000 }
        )
        writeDebug(`[Telegram Gateway] SUCCESS: Delivered custom notification to chat ${activeChatId}`)
        return { success: true, provider: 'telegram', count: 1, data: response.data }
      } catch (err) {
        writeDebug(`[Telegram Gateway Error]: ${err.response?.data?.description || err.message} -> Falling through to Twilio`)
      }
    } else {
      writeDebug(`[Telegram Gateway] Bot token present, waiting for user to click 'Start' in t.me/uni_h3alth_bot`)
    }
  }

  // 2. Twilio Gateway (Secondary)
  if (twilioSid && twilioToken && !twilioSid.includes('your_')) {
    const isWhatsApp = (currentEnv.TWILIO_CHANNEL || '').toLowerCase() === 'whatsapp'
    const contentSid = (currentEnv.TWILIO_CONTENT_SID || '').trim()
    const activeFrom = isWhatsApp 
      ? (twilioFrom ? (twilioFrom.startsWith('whatsapp:') ? twilioFrom : `whatsapp:${twilioFrom}`) : 'whatsapp:+17372508034')
      : await resolveTwilioSender(twilioSid, twilioToken, twilioFrom)

    if (activeFrom) {
      try {
        writeDebug(`[SMS Gateway (Twilio ${isWhatsApp ? 'WhatsApp' : 'SMS'})] Credentials detected. Dispatching via ${activeFrom}...`)

        const dispatchSingle = async (recipient, bodyContent, useTemplate = false) => {
          const finalTo = isWhatsApp ? (recipient.startsWith('whatsapp:') ? recipient : `whatsapp:${recipient}`) : recipient
          const params = new URLSearchParams()
          params.append('To', finalTo)
          params.append('From', activeFrom)

          if (isWhatsApp && contentSid && !useTemplate) {
            params.append('ContentSid', contentSid)
            const dynamicVars = extractTemplateVariables(bodyContent)
            params.append('ContentVariables', JSON.stringify(dynamicVars))
            writeDebug(`[Twilio WhatsApp] Sending with dynamic ContentVariables: ${JSON.stringify(dynamicVars)}`)
          } else {
            params.append('Body', bodyContent)
          }

          return axios.post(
            `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
            params.toString(),
            {
              headers: {
                'Authorization': `Basic ${Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64')}`,
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              timeout: 10000,
            }
          )
        }

        const results = await Promise.allSettled(
          recipients.map(async recipient => {
            try {
              return await dispatchSingle(recipient, message)
            } catch (err) {
              const errMsg = err.response?.data?.message || err.message
              writeDebug(`[SMS Gateway (Twilio)] Initial send error: ${errMsg}`)
              // If trial account enforces predefined template, retry with trial template
              if (errMsg.toLowerCase().includes('template') || errMsg.toLowerCase().includes('trial account')) {
                const trialTemplate = message.toLowerCase().includes('cancel') ? 'sms_account_alerts' : 'sms_appointment_reminders'
                writeDebug(`[SMS Gateway (Twilio)] Retrying with fallback template '${trialTemplate}'...`)
                return await dispatchSingle(recipient, trialTemplate, true)
              }
              throw err
            }
          })
        )

        const sentCount = results.filter(r => r.status === 'fulfilled').length
        const failed = results.filter(r => r.status === 'rejected')
        if (sentCount > 0) {
          writeDebug(`[SMS Gateway (Twilio)] SUCCESS: Delivered ${sentCount}/${recipients.length} SMS to: ${recipients.join(', ')}`)
          return { success: true, provider: 'twilio', count: sentCount, senderNumber: activeFrom }
        } else {
          const firstErr = failed[0]?.reason?.response?.data?.message || failed[0]?.reason?.message || 'Twilio send failed'
          writeDebug(`[SMS Gateway (Twilio) Error]: ${firstErr}`)
          return { success: false, provider: 'twilio', error: firstErr }
        }
      } catch (err) {
        writeDebug(`[SMS Gateway (Twilio) Fatal]: ${err.response?.data?.message || err.message}`)
        return { success: false, provider: 'twilio', error: err.response?.data?.message || err.message }
      }
    } else {
      writeDebug(`[SMS Gateway (Twilio)] Twilio Account SID and Auth Token found, but no active Twilio Phone Number.`)
      return { 
        success: false, 
        provider: 'twilio', 
        error: "Twilio Account SID & Token are connected, but you haven't clicked 'Get a phone number' in your Twilio dashboard yet. Click 'Send an SMS' -> 'Get a phone number' in your Twilio console!" 
      }
    }
  }

  // 2. Fast2SMS Gateway (Fallback if key provided and no 100 INR lock)
  if (fast2smsKey && !fast2smsKey.includes('your_')) {
    writeDebug(`[SMS Gateway (Fast2SMS)] Key detected (Length: ${fast2smsKey.length}). Preparing dispatch...`)
    const cleanedNumbers = recipients
      .map(p => p.replace(/^\+91/, '').replace(/\D/g, ''))
      .filter(p => /^\d{10}$/.test(p))

    if (cleanedNumbers.length > 0) {
      try {
        const payload = {
          route: 'q',
          message: message,
          language: 'english',
          flash: 0,
          numbers: cleanedNumbers.join(','),
        }

        const response = await axios.post(
          'https://www.fast2sms.com/dev/bulkV2',
          payload,
          {
            headers: {
              'authorization': fast2smsKey,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            timeout: 10000,
          }
        )

        writeDebug(`[SMS Gateway (Fast2SMS) Response] ${JSON.stringify(response.data)}`)
        if (response.data && response.data.return === false) {
          const errMsg = Array.isArray(response.data.message) ? response.data.message.join(', ') : String(response.data.message || 'Fast2SMS returned error')
          writeDebug(`[SMS Gateway (Fast2SMS) REJECTED] ${errMsg} -> Falling through to other providers`)
        } else {
          return { success: true, provider: 'fast2sms', count: cleanedNumbers.length, data: response.data }
        }
      } catch (err) {
        const errDetail = err.response ? JSON.stringify(err.response.data) : err.message
        writeDebug(`[SMS Gateway (Fast2SMS) ERROR] ${errDetail} -> Falling through to other providers`)
      }
    } else {
      writeDebug(`[SMS Gateway (Fast2SMS)] No valid 10-digit Indian numbers found in: ${recipients.join(', ')}`)
    }
  }

  // 3. CallMeBot WhatsApp Gateway (100% Free Forever, No Credit Card or Payment)
  const callmebotKey = (process.env.CALLMEBOT_API_KEY || '').trim()
  if (callmebotKey && !callmebotKey.includes('your_')) {
    try {
      const cleanPhone = (recipients[0] || '9791868857').replace(/\D/g, '')
      const phoneWithCountry = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`
      const url = `https://api.callmebot.com/whatsapp.php?phone=${phoneWithCountry}&text=${encodeURIComponent(message)}&apikey=${callmebotKey}`

      const response = await axios.get(url, { timeout: 10000 })
      writeDebug(`[WhatsApp Gateway (CallMeBot)] Delivered to ${phoneWithCountry} | Response: ${response.data}`)
      return { success: true, provider: 'whatsapp', count: 1, data: response.data }
    } catch (err) {
      writeDebug(`[WhatsApp Gateway (CallMeBot) Error]: ${err.response?.data || err.message}`)
      return { success: false, provider: 'whatsapp', error: err.response?.data || err.message }
    }
  }

  // 5. Fallback Dual-Mode Simulation
  const timestamp = new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })
  writeDebug(`[SMS SIMULATOR] To: ${recipients.join(', ')} at ${timestamp} IST | Msg: "${message}"`)

  return { success: true, provider: 'simulation', count: recipients.length }
}

module.exports = { sendSMS, normalizePhoneNumber, resolveTelegramChatId }
