const BusinessProfile = require("../../models/BusinessProfile");
const Sale = require("../../models/Sale");
const Notification = require("../../models/Notification");
const WhatsAppSession = require("../../models/WhatsAppSession");
const SupportTicket = require("../../models/SupportTicket");
const Reminder = require("../../models/Reminder");
const User = require("../../models/User");
const axios = require("axios");
const { logActivity } = require("../../utils/activityLogger");
const { processMessageWithAI, processAudioWithAI, processImageWithAI } = require("../../utils/aiService");
const { logUsage } = require("../../utils/usageTracker");
const { initializePayment } = require("../../utils/paystack");
const { getPlanPrice } = require("../../config/pricing");
const { sendWhatsAppMessage } = require("./whatsappController"); // For recursive calls if needed, though we are in the file. Wait. 
// Note: sendWhatsAppMessage is exported below, but for internal use, we use it directly.


// Duplicate Shield: Store message IDs to prevent double-processing (cleared every 10 mins)
const processedMessages = new Set();
setInterval(() => processedMessages.clear(), 10 * 60 * 1000); // 10 minutes

/**
 * OGA MONITOR: Helper to calculate today's total revenue for a business.
 * Sums all payments recorded across all sales for the current calendar day.
 */
const getTodayRevenue = async (businessId) => {
    try {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const sales = await Sale.find({
            businessId,
            "payments.date": { $gte: startOfToday }
        });

        let total = 0;
        sales.forEach(sale => {
            sale.payments.forEach(p => {
                if (new Date(p.date) >= startOfToday) total += p.amount;
            });
        });
        return total;
    } catch (err) {
        console.error("Revenue Aggregation Error:", err);
        return 0;
    }
};

const APP_URL = process.env.FRONTEND_URL || "https://usekredibly.com";
const BACKEND_URL = process.env.BACKEND_URL || "https://api.usekredibly.com";

/**
 * SMART LOGIC: Rule-based parser for when AI is offline.
 * Imitates "Kreddy's" street-smart personality.
 */
const extractInfoRobust = (text, context = {}) => {
    const lower = text.toLowerCase().trim();
    
    let result = {
        intent: "general_chat",
        confidence: 0.8,
        data: {
            customerName: "Customer",
            totalAmount: 0,
            paidAmount: 0,
            item: "Item",
            dueDate: null,
            reply: ""
        }
    };

    // Helper: Extract specific clock time ("by 7pm", "at 3pm", "for 1pm") from text
    const extractClockTime = (txt) => {
        const timeMatch = txt.match(/(?:by|at|for|around)\s*(\d{1,2})\s*[:.]?\s*(\d{2})?\s*(am|pm)/i);
        if (timeMatch) {
            let hours = parseInt(timeMatch[1]);
            const minutes = parseInt(timeMatch[2] || '0');
            const ampm = timeMatch[3].toLowerCase();
            if (ampm === 'pm' && hours !== 12) hours += 12;
            if (ampm === 'am' && hours === 12) hours = 0;
            const date = new Date();
            date.setHours(hours, minutes, 0, 0);
            // If time is in the past, assume tomorrow
            if (date <= new Date()) date.setDate(date.getDate() + 1);
            return date;
        }
        return null;
    };

    // 1. Intent Detection
    if (lower.includes("who owe") || lower.includes("who is owing") || lower.includes("list my debtor") || lower.includes("total debt") || lower.includes("show me who owe")) {
        result.intent = "check_debt";
        return result;
    }

    // CHECK SCHEDULE: "what are my plans", "my schedule", "what's on today", "do I have anything"
    if (lower.includes("my plan") || lower.includes("my schedule") || lower.includes("what's on") || lower.includes("do i have") || lower.includes("my tasks") || lower.includes("my reminders") || lower.includes("what do i have")) {
        result.intent = "check_schedule";
        const bossTitle = (context.plan || "hustler") === "chairman" ? "Chairman" : ((context.plan || "hustler") === "oga" ? "Oga" : "Boss");
        result.data.reply = `Let me check your schedule, ${bossTitle}! 📋`;
        return result;
    }

    if (lower.includes("draft") || lower.includes("message for")) {
        result.intent = "draft_reminder";
        result.data.reply = "I'm on it, Chief! 🫡 Let me draft a sharp message you can send to your customer...";
    } else if (lower.includes("remind") || lower.includes("reminder") || lower.includes("due") || 
               (lower.includes("i have") && (lower.includes("meeting") || lower.includes("session") || lower.includes("appointment") || lower.includes("call")))) {
        // Detect reminders: explicit ("remind me") OR implicit ("I have a meeting by 7pm")
        result.intent = lower.includes("debt") || lower.includes("owe") ? "update_record" : "create_reminder";
        result.data.reminderType = lower.includes("meet") ? "meeting" : (lower.includes("gym") || lower.includes("session") ? "personal" : "task");
        
        // Extract task description from the message
        const taskMatch = text.match(/(?:remind(?:er)?(?:\s+me)?\s+(?:to|about|for)\s+)(.+?)(?:\s+(?:by|at|on|for|tomorrow|today|next)\s|$)/i);
        const implicitMatch = text.match(/(?:i have|i've got|there'?s)\s+(?:a\s+)?(.+?)(?:\s+(?:by|at|on)\s|$)/i);
        if (taskMatch) result.data.taskDescription = taskMatch[1].trim();
        else if (implicitMatch) result.data.taskDescription = implicitMatch[1].trim();
        else result.data.taskDescription = text.replace(/remind(?:er)?|set|help|me|to|please/gi, '').trim() || "Task";

        // Extract time: clock time first, then durations, then relative dates
        const clockTime = extractClockTime(lower);
        if (clockTime) {
            result.data.reminderDate = clockTime;
        } else if (lower.includes("today")) {
            result.data.reminderDate = new Date();
        } else if (lower.includes("tomorrow")) {
            result.data.reminderDate = new Date(Date.now() + 86400000);
        } else {
            // Handle durations: "5 mins", "2 hours"
            const durationMatch = text.match(/(\d+)\s*(min|hour)/i);
            if (durationMatch) {
                const val = parseInt(durationMatch[1]);
                const unit = durationMatch[2].toLowerCase();
                const date = new Date();
                if (unit.startsWith("min")) date.setMinutes(date.getMinutes() + val);
                if (unit.startsWith("hour")) date.setHours(date.getHours() + val);
                result.data.reminderDate = date;
            }
        }
    } else if (lower.includes("snooze") || lower.includes("wait") || lower.includes("later")) {
        result.intent = "snooze_reminder";
        const minMatch = text.match(/(\d+)/);
        result.data.snoozeDuration = minMatch ? parseInt(minMatch[1]) : 30;
    } else if (lower.includes(" paid") || lower.includes(" pay") || lower.includes(" brought") || lower.includes(" sent") || lower.includes("received") || lower.includes("collect")) {
        result.intent = "update_record";
    } else if (lower.includes("sold") || lower.includes("selling") || lower.includes("sale") || lower.includes("record") || lower.includes("bought")) {
        result.intent = "create_sale";
    }

    // 2. Extract Amounts (handle 10k, 10000, 245k) ignoring time/durations
    let safeTextForAmounts = text.replace(/\b\d+(?:\.\d+)?\s*(am|pm|hrs|hours|mins|minutes|days|weeks|months)\b/gi, '');
    const amountRegex = /(\d+(?:\.\d+)?)\s*(k|thousand|million|m|naira|ngn)?/gi;
    const matches = [...safeTextForAmounts.matchAll(amountRegex)];
    const amounts = matches.map(m => {
        let val = parseFloat(m[1].replace(/,/g, ''));
        const unit = m[2]?.toLowerCase();
        if (unit === 'k' || unit === 'thousand') val *= 1000;
        if (unit === 'm' || unit === 'million') val *= 1000000;
        return val;
    });

    if (amounts.length > 0) {
        if (result.intent === "general_chat") {
            result.intent = (lower.includes("for") || lower.includes("from")) ? "update_record" : "create_sale";
        }
        
        if (amounts.length >= 2) {
            result.data.totalAmount = Math.max(amounts[0], amounts[1]);
            result.data.paidAmount = Math.min(amounts[0], amounts[1]);
        } else {
            const isRepayment = lower.includes("paid") || lower.includes("received") || lower.includes("brought") || lower.includes("sent");
            const isReminder = lower.includes("remind") || lower.includes("reminder") || lower.includes("to pay") || lower.includes("owing");

            if (result.intent === "update_record") {
                if (isRepayment && !isReminder) {
                    result.data.paidAmount = amounts[0];
                    result.data.totalAmount = 0;
                } else {
                    // It's likely just identifying the debt amount for a reminder
                    result.data.totalAmount = amounts[0];
                    result.data.paidAmount = 0;
                }
            } else {
                result.data.totalAmount = amounts[0];
                if (lower.includes("paid all") || lower.includes("fully paid")) result.data.paidAmount = amounts[0];
            }
        }
    }

    // 3. Precise Customer Name Extraction
    const stopWords = ["who", "paid", "pay", "which", "is", "was", "will", "with", "that", "gave", "sent", "he", "she", "they", "it", "today", "tomorrow", "at", "for", "to", "just", "bought", "sold", "item", "for", "from"];
    const stoppersJoin = stopWords.join("|");
    
    // Pattern A: After "to", "for", etc.
    const customerRegex = new RegExp(`(?:to|for|from|of|reminder|remind)\\s+(?:for|to|from)?\\s*([a-z0-9\\s’'&-]+)(?=[\\s.,!]|\\b(?:${stoppersJoin})\\b|$)`, "i");
    const customerMatch = text.match(customerRegex);
    
    if (customerMatch) {
        let name = customerMatch[1].replace(/\s+/g, ' ').trim();
        result.data.customerName = name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    } 
    else if (text.split(' ').length > 2 && !stopWords.includes(text.split(' ')[0].toLowerCase())) {
        const startRegex = new RegExp(`^([a-z0-9\\s’'&-]+?)(?=\\s+(?:\\b(?:${stoppersJoin})\\b)|$)`, "i");
        const startMatch = text.match(startRegex);
        if (startMatch && startMatch[1].trim().split(' ').length <= 4) {
             let name = startMatch[1].trim();
             if (!stopWords.includes(name.toLowerCase())) {
                result.data.customerName = name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
             }
        }
    }
    
    if (result.data.customerName === "Customer" && context.currentSession?.data?.customerName && (lower.includes("he ") || lower.includes("she ") || lower.includes("they "))) {
        result.data.customerName = context.currentSession.data.customerName;
    }

    // 4. Extract Item
    const itemRegex = /(?:sold|selling|record|for|bought)\s+(?:a|an)?\s*(.*?)\s+(?:for|to|at|paid|who)\s+/i;
    const itemMatch = text.match(itemRegex);
    if (itemMatch) result.data.item = itemMatch[1].trim();

    // 5. WITTY PIDGIN REPLIES
    const bal = result.data.totalAmount - result.data.paidAmount;
    const tone = context.preferredTone || "friendly";
    const plan = context.plan || "hustler";
    
    // Character Mapping based on plan
    const bossTitle = plan === "chairman" ? "Chairman" : (plan === "oga" ? "Oga" : "Boss");

    if (result.intent === "update_record") {
        if (result.data.dueDate) {
            result.data.reply = tone === "friendly" 
                ? `I catch am! 🗓️ Setting a reminder for *${result.data.customerName}* for today. I go update the ledger? (Reply Yes/No)`
                : `Understood, ${bossTitle}. I have scheduled a collection reminder for ${result.data.customerName} for today. Proceed?`;
        } else {
            result.data.reply = tone === "friendly"
                ? `Oshey! 🥳 I've spotted the *₦${result.data.paidAmount?.toLocaleString()}* for *${result.data.customerName}*. Making I update the record? (Reply Yes/No)`
                : `Payment detected. I've noted ₦${result.data.paidAmount?.toLocaleString()} from ${result.data.customerName}. Should I finalize?`;
        }
    } else if (result.intent === "create_sale" && result.data.totalAmount > 0) {
        if (result.data.item === "Item" || !result.data.item) result.data.item = "Purchase"; 
        result.data.reply = tone === "friendly" 
            ? `I catch the work! 🛡️ Recording *${result.data.item}* for *${result.data.customerName}*. \nTotal: *₦${result.data.totalAmount.toLocaleString()}* \nPaid: *₦${result.data.paidAmount.toLocaleString()}* \nCorrect? (Reply 'Yes' to confirm)`
            : `Infrastructure Update: Recording *${result.data.item}* for ${result.data.customerName}. \nValue: ₦${result.data.totalAmount.toLocaleString()} \nCleared: ₦${result.data.paidAmount.toLocaleString()} \nConfirm?`;
    } else if (result.intent === "check_debt") {
        result.data.reply = `Omo, debtors plenty for street! 😅 Give me one second make I check the ledger...`;
    } else if (result.intent === "general_chat") {
        if (context.currentSession?.data?.customerName) {
            result.data.reply = tone === "friendly"
                ? `I'm with you, ${bossTitle}! 🫡 Are we still talking about *${context.currentSession.data.customerName}*?`
                : `Acknowledged, ${bossTitle}. Continuing context for ${context.currentSession.data.customerName}. How can I help?`;
        } else {
            result.data.reply = tone === "friendly"
                ? `I'm with you, ${bossTitle}! 🫡 But I need small more info. Tell me like: _'Sold a watch for 20k to Kola'_`
                : `I am standing by, ${bossTitle}. Please provide transaction details to continue.`;
        }
    }

    return result;
};

const cleanPhone = (num) => {
    if (!num) return num;
    let clean = String(num).replace(/\D/g, ''); // Remove all non-digits
    if (clean.startsWith('0') && clean.length === 11) {
        clean = '234' + clean.slice(1);
    }
    return clean;
};

const HUMANIZE = {
    greetings: {
        hustler: [
            "Boss {name}! 🫡 How can I help your hustle today?",
            "Good to see you, {name}! 🚀 Ready to record some wins?",
            "Kreddy is online, {name}. What's the latest update?"
        ],
        oga: [
            "Good day, Oga {name}! 💼 Your smart assistant is ready. What are we tracking today?",
            "Oga {name}! 🚀 High power! Kreddy is online and locked in for your business.",
            "Welcome back, Oga {name}! 🛡️ Need to track a payment or record a sale?"
        ],
        chairman: [
            "Good morning, Chairman {name}! 👑 Your empire is growing. I'm standing by for your instructions.",
            "Chairman {name}! 💎 Respect! Your business is moving fast. How can I help you lead today?",
            "Greetings, Chairman {name}! 🦁 Your records are safe and the ledger is ready for more wins."
        ]
    },
    success: [
        "Nice one! 🎈 I've logged that for you.",
        "Got it, Chief! ✅ Record is safe and sound.",
        "Record saved! 🚀 Keep that momentum going.",
        "Done! 🛡️ I've updated your ledger."
    ],
    celebration: [
        "🔥 *Woah, that's a big one! Congrats!* 🥂",
        "🚀 *Absolute win! Your business is moving fast!*",
        "💎 *That's what I like to see! Profit secured!*",
        "🌟 *Big energy! Keep scaling!*"
    ]
};

const getRandom = (arr, data = {}, plan = "hustler") => {
    let pool = Array.isArray(arr) ? arr : (arr[plan] || arr["hustler"]);
    let pick = pool[Math.floor(Math.random() * pool.length)];
    for (let [k, v] of Object.entries(data)) {
        pick = pick.replace(new RegExp(`{${k}}`, 'g'), v);
    }
    return pick;
};

const KREDDY_FAQS = [
    {
        keywords: ["sale", "record", "invoice", "how to"],
        answer: "To record a sale, just tell me: _'Sold a watch to Kola for 15k'_. I'll do the math and create a digital invoice link for you! 🚀"
    },
    {
        keywords: ["trust", "score", "verified", "why"],
        answer: "Your Trust Score is like your business reputation. High scores lead to more sales! You grow it by getting customers to verify their receipts and paying off debts. 🛡️"
    },
    {
        keywords: ["share", "send", "customer", "link"],
        answer: "Type *D [Customer Name]* to get a payment link you can copy and send to your debtors! 🔗"
    },
    {
        keywords: ["bank", "account", "details", "change"],
        answer: "You can update your bank details in the *Settings* page on your Kredibly dashboard. This info appears on all invoices! 🏦"
    },
    {
        keywords: ["notification", "alert", "whatsapp"],
        answer: "I send you alerts whenever someone pays, confirms a receipt, or when a debt is due. You're always in the loop! 🔔"
    }
];

// Helper to extract dates from strings
const extractDate = (text) => {
    const lowerText = text.toLowerCase();
    let dueDate = null;

    if (lowerText.includes("month end") || lowerText.includes("end of month") || lowerText.includes("end of the month")) {
        dueDate = new Date();
        dueDate.setMonth(dueDate.getMonth() + 1);
        dueDate.setDate(0);
        return dueDate;
    }

    const dateKeywords = {
        "tomorrow": 1,
        "next week": 7,
        "two weeks": 14,
        "one week": 7,
    };

    for (let [key, days] of Object.entries(dateKeywords)) {
        if (lowerText.includes(key)) {
            dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + days);
            return dueDate;
        }
    }

    const daysOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    for (let i = 0; i < daysOfWeek.length; i++) {
        if (lowerText.includes(`on ${daysOfWeek[i]}`) || lowerText.includes(`by ${daysOfWeek[i]}`)) {
            dueDate = new Date();
            const currentDay = dueDate.getDay();
            let daysToAdd = (i - currentDay + 7) % 7;
            if (daysToAdd === 0) daysToAdd = 7;
            dueDate.setDate(dueDate.getDate() + daysToAdd);
            return dueDate;
        }
    }
    return null;
};

const sendReadReceipt = async (messageId) => {
    try {
        const phoneId = process.env.WHATSAPP_PHONE_ID || process.env.PHONE_ID;
        const accessToken = process.env.WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_TOKEN || process.env.ACCESS_TOKEN;

        if (!accessToken || !phoneId || !messageId) return;

        await axios.post(
            `https://graph.facebook.com/v21.0/${phoneId}/messages`,
            {
                messaging_product: "whatsapp",
                status: "read",
                message_id: messageId,
            },
            {
                headers: { Authorization: `Bearer ${accessToken}` },
            }
        );
    } catch (error) {
        // Silent error for read receipts
    }
};

const sendReply = async (to, text) => {
    try {
        const phoneId = process.env.WHATSAPP_PHONE_ID || process.env.PHONE_ID;
        const accessToken = process.env.WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_TOKEN || process.env.ACCESS_TOKEN;

        if (!accessToken || !phoneId) return;

        let cleanTo = String(to).replace(/[\s+]/g, '');
        if (cleanTo.startsWith('0') && cleanTo.length === 11) {
            cleanTo = '234' + cleanTo.slice(1);
        }

        await axios.post(
            `https://graph.facebook.com/v21.0/${phoneId}/messages`,
            {
                messaging_product: "whatsapp",
                to: cleanTo,
                type: "text",
                text: { 
                    body: text,
                    preview_url: true
                },
            },
            {
                headers: { Authorization: `Bearer ${accessToken}` },
            }
        );

        // LOG USAGE (Async, don't wait for it)
        logUsage("whatsapp").catch(e => console.error("Logger fail:", e));

    } catch (error) {
        console.error("WhatsApp Send Error:", error.response?.data || error.message);
    }
};

const sendTypingIndicator = async (to) => {
    try {
        const phoneId = process.env.WHATSAPP_PHONE_ID || process.env.PHONE_ID;
        const accessToken = process.env.WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_TOKEN || process.env.ACCESS_TOKEN;

        if (!accessToken || !phoneId) return;

        let cleanTo = String(to).replace(/[\s+]/g, '');
        if (cleanTo.startsWith('0') && cleanTo.length === 11) {
            cleanTo = '234' + cleanTo.slice(1);
        }

        await axios.post(
            `https://graph.facebook.com/v21.0/${phoneId}/messages`,
            {
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: cleanTo,
                sender_action: "typing_on",
            },
            {
                headers: { Authorization: `Bearer ${accessToken}` },
            }
        );
    } catch (error) {
        // Silent error
    }
};

exports.sendWhatsAppMessage = sendReply;

exports.verifyWebhook = (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode && token) {
        if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
            res.status(200).send(challenge);
        } else {
            res.sendStatus(403);
        }
    }
};

const downloadWhatsAppMedia = async (mediaId) => {
    try {
        const accessToken = process.env.WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_TOKEN || process.env.ACCESS_TOKEN;
        if (!accessToken || !mediaId) return null;

        // 1. Get Media URL
        const { data: mediaData } = await axios.get(
            `https://graph.facebook.com/v21.0/${mediaId}`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        if (!mediaData.url) return null;

        // 2. Download Media Content
        const response = await axios.get(mediaData.url, {
            headers: { Authorization: `Bearer ${accessToken}` },
            responseType: 'arraybuffer'
        });

        return {
            buffer: Buffer.from(response.data),
            mimeType: mediaData.mime_type
        };
    } catch (error) {
        console.error("Media Download Error:", error.response?.data || error.message);
        return null;
    }
};

exports.handleIncoming = async (req, res) => {
    res.sendStatus(200);

    try {
        const entry = req.body.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;
        const message = value?.messages?.[0];

        if (!message) {
            // Log status updates briefly if needed, or ignore
            // const status = value?.statuses?.[0];
            // if (status) console.log(`👉 Status Update: ${status.status} for ${status.recipient_id}`);
            return;
        }

        const messageId = message.id;
        const from = message.from;
        const msgType = message.type;
        const text = message.text?.body?.trim() || "";
        
        console.log(`📩 Message from ${from}: "${text}"`);

        // Send Read Receipt (The "Blue Ticks")
        await sendReadReceipt(messageId);
        // Note: Typing indicator is not supported by WhatsApp Cloud API (v15+)
        // await sendTypingIndicator(from);

        if (processedMessages.has(messageId)) return;
        processedMessages.add(messageId);

        const cleanFrom = cleanPhone(from);
        
        // Find profile where either the owner or staff matches this number
        const profile = await BusinessProfile.findOne({ 
            $or: [
                { whatsappNumber: cleanFrom },
                { staffNumbers: cleanFrom }
            ]
        });

        if (!profile) {
            await sendReply(from, "Welcome to Kredibly! 🚀 \n\nI don't recognize this number. Please log in to dashboard and link your number.");
            return;
        }

        const isStaff = profile.whatsappNumber !== cleanFrom;
        let plan = profile.plan || "hustler";

        const isTrialing = profile.planStatus === 'trialing';
        // BETA OVERRIDE: Force Chairman logic for all active testers to show off AI
        plan = "chairman"; 
        const isTrialExpired = false; 
        
        console.log(`👤 User: ${cleanFrom} | Beta Forced: ${plan.toUpperCase()} | Original: ${profile.plan}`);
        
        // Usage Reset Logic (Monthly)
        if (!profile.monthlyUsage) {
            profile.monthlyUsage = { reminders: 0, voiceNotes: 0, images: 0, lastReset: new Date() };
            // don't await save yet, we'll save later if needed or just use this in memory
        } else {
            const lastReset = new Date(profile.monthlyUsage.lastReset);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            if (lastReset < thirtyDaysAgo) {
                profile.monthlyUsage = { reminders: 0, voiceNotes: 0, images: 0, lastReset: new Date() };
                await profile.save();
            }
        }

        const isHustler = plan === "hustler"; 
        const preferredTone = "friendly";

        if (profile && !profile.isKreddyConnected && !isStaff) {
            profile.isKreddyConnected = true;
            await profile.save();
        }

        await logActivity({
            businessId: profile._id,
            action: "WHATSAPP_MSG_RECEIVED",
            entityType: "WHATSAPP",
            details: `From: ${from} | Msg: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`
        });

        // HUSTLER LIMIT CHECK (Trial Cap: 5 Invoices)
        if (isHustler && (text.toLowerCase().includes("sold") || text.toLowerCase().includes("selling") || text.toLowerCase().includes("sale") || text.toLowerCase().includes("record"))) {
            const invoiceCount = await Sale.countDocuments({ businessId: profile._id });

            if (invoiceCount >= 5) {
                return await sendReply(from, `Wow, Chief! 📈 You've reached your free limit of 5 invoices on the *Hustler* plan! 

To record more sales and keep professionalizing your business, abeg upgrade to the *Oga Plan* now. No time to check time! 🚀 

Upgrade here: ${APP_URL}/pricing`);
            }
        }

        if (msgType !== "text" && msgType !== "audio" && msgType !== "voice" && msgType !== "image") {
            return await sendReply(from, "I catch the message, but I only understand text, voice notes, and images (for Chairmen) right now! 🛡️");
        }

        const lowerText = text ? text.toLowerCase() : "";

        // Check for OPEN Support Ticket (Context Awareness)
        const openTicket = await SupportTicket.findOne({
            businessId: profile._id,
            status: { $in: ['open', 'replied'] }
        }).sort({ updatedAt: -1 });

        // PERSISTENT SESSION HANDLING
        const session = await WhatsAppSession.findOne({ whatsappNumber: cleanFrom });
        if (session) {
            // Check if it's a numeric choice for disambiguation
            const choice = parseInt(text);
            if (!isNaN(choice) && session.data.options && choice > 0 && choice <= session.data.options.length) {
                const selected = session.data.options[choice - 1];
                await WhatsAppSession.deleteOne({ _id: session._id });

                if (session.type === 'payment_disambiguation') {
                    const sale = await Sale.findById(selected.id);
                    if (sale) {
                        if (session.data.paidAmount > 0) sale.payments.push({ amount: session.data.paidAmount, method: "WhatsApp Quick Select" });
                        if (session.data.dueDate) sale.dueDate = new Date(session.data.dueDate);
                        await sale.save();
                        const balance = sale.totalAmount - sale.payments.reduce((s, p) => s + p.amount, 0);
                        const paidAmount = session.data.paidAmount || 0;
                        await Notification.create({
                            businessId: profile._id,
                            title: "Quick Payment ✅",
                            message: `₦${paidAmount.toLocaleString()} recorded for ${sale.customerName}.`,
                            type: "system",
                            saleId: sale._id
                        });
                        return await sendReply(from, `✅ *Payment Recorded!* \n\n👤 Customer: ${sale.customerName}\n💰 New Balance: *₦${balance.toLocaleString()}*`);
                    }
                } else if (session.type === 'rename_disambiguation') {
                    const sale = await Sale.findById(selected.id);
                    if (sale) {
                        const oldName = sale.customerName;
                        sale.customerName = session.data.newName;
                        await sale.save();
                        return await sendReply(from, `✅ *Name Updated!* \n\nChanged from *${oldName}* to *${session.data.newName}*.`);
                    }
                } else if (session.type === 'due_date_disambiguation') {
                    const sale = await Sale.findById(selected.id);
                    if (sale) {
                        sale.dueDate = session.data.date;
                        await sale.save();
                        return await sendReply(from, `🗓️ *Reminder Set!* \n\nUpdated for *${sale.customerName}*.`);
                    }
                } else if (session.type === 'draft_disambiguation') {
                    const sale = await Sale.findById(selected.id);
                    if (sale) {
                        const APP_URL = process.env.FRONTEND_URL || "https://usekredibly.com";
                        const bal = sale.totalAmount - sale.payments.reduce((s, p) => s + p.amount, 0);
                        const link = `${APP_URL}/i/${sale.invoiceNumber}`;
                        let draft = "";

                        if (session.data && session.data.isReminder) {
                            draft = `Hi ${sale.customerName}, this is a friendly reminder to settle your balance of ₦${bal.toLocaleString()} with ${profile.displayName}. You can view your invoice and pay here: ${link}`;
                        } else {
                            draft = `Hi ${sale.customerName}, here is your secure invoice and payment link from ${profile.displayName} for ₦${bal.toLocaleString()}: ${link}`;
                        }
                        
                        await WhatsAppSession.deleteOne({ _id: session._id });
                        await sendReply(from, `📝 *Draft for ${sale.customerName}* (Copy the message below):`);
                        return await sendReply(from, draft);
                    }
                }
            }

            // Handle "Yes" for Smart Logic Drafts
            if (['yes', 'y', 'confirm', 'correct', 'true', 'sure'].includes(lowerText) && session.type === 'collect_sale_info') {
                const { customerName, totalAmount, paidAmount, item, intent, dueDate } = session.data;
                await WhatsAppSession.deleteOne({ _id: session._id });

                if (intent === 'create_sale') {
                    const newSale = new Sale({
                        businessId: profile._id,
                        customerName,
                        description: item,
                        totalAmount,
                        payments: [{ amount: paidAmount || 0, method: "WhatsApp" }],
                        dueDate: dueDate ? new Date(dueDate) : undefined,
                        recordedBy: cleanFrom
                    });
                    await newSale.save();

                    // Notify Dashboard
                    await Notification.create({
                        businessId: profile._id,
                        title: "Smart Sale ✅",
                        message: `₦${totalAmount.toLocaleString()} recorded for ${customerName}.`,
                        type: "sale",
                        saleId: newSale._id
                    });

                    // Notify Oga (Oga Monitor)
                    if (isStaff && profile.whatsappNumber) {
                        const todayRev = await getTodayRevenue(profile._id);
                        const ogaMessage = `📢 *Staff Activity Report* \n\nA new sale was just recorded by your staff (*${cleanFrom}*):\n\n👤 Customer: ${newSale.customerName}\n💰 Amount: ₦${totalAmount.toLocaleString()}\n📑 Invoice: #${newSale.invoiceNumber}\n\n📊 *Total Cash In Today:* ₦${todayRev.toLocaleString()}\n\n_Kredibly keeping your business secure!_ 🛡️`;
                        await sendReply(profile.whatsappNumber, ogaMessage);
                    }

                    const bal = totalAmount - (paidAmount || 0);
                    const successMsg = getRandom(HUMANIZE.success, {}, plan);
                    return await sendReply(from, `${successMsg} \n\nI've logged Invoice *#${newSale.invoiceNumber}* for *${customerName}*.\n💰 Paid: ₦${paidAmount.toLocaleString()}\n⏳ Balance: ₦${bal.toLocaleString()}\n\n🔗 View & Share Preview: ${BACKEND_URL}/api/payments/share/${newSale.invoiceNumber}`);
                } else if (intent === 'update_record') {
                    // 🧠 ROBUST SEARCH: Find the best match for the customer
                    let cleanName = customerName.replace(/^(for|to|from|of)\s+/i, '').trim();
                    
                    const normalizedName = cleanName.replace(/\s+/g, ' ').trim();
                    let sale = await Sale.findOne({ 
                        businessId: profile._id, 
                        customerName: { $regex: new RegExp(`^${normalizedName.replace(/’|'/g, "['’]?").replace(/\s/g, "\\s+")}`, "i") }, 
                        status: { $ne: "paid" } 
                    });

                    // If not found by prefix, try a "contains" search
                    if (!sale) {
                        sale = await Sale.findOne({ 
                            businessId: profile._id, 
                            customerName: { $regex: new RegExp(normalizedName.replace(/\s/g, "\\s+"), "i") }, 
                            status: { $ne: "paid" } 
                        });
                    }

                    if (sale) {
                        if (paidAmount > 0) sale.payments.push({ amount: paidAmount, method: "WhatsApp Update" });
                        if (dueDate) sale.dueDate = new Date(dueDate);
                        await sale.save();
                        
                        // Notify Oga (Oga Monitor)
                        if (isStaff && profile.whatsappNumber && (paidAmount > 0)) {
                            const todayRev = await getTodayRevenue(profile._id);
                            const ogaMessage = `💰 *Payment Alert (Staff)* \n\nYour staff (*${cleanFrom}*) just recorded a payment of *₦${paidAmount.toLocaleString()}* from *${sale.customerName}*.\n\n📊 *Total Cash In Today:* ₦${todayRev.toLocaleString()}\n📑 Invoice: #${sale.invoiceNumber}\n\n_Safe and secure!_ 🛡️`;
                            await sendReply(profile.whatsappNumber, ogaMessage);
                        }

                        const bal = sale.totalAmount - sale.payments.reduce((s, p) => s + p.amount, 0);
                        let finalMsg = `✅ *Record Updated!* \n\nI've updated the ledger for *${sale.customerName}*.`;
                        if (paidAmount > 0) finalMsg += `\n💰 Payment: ₦${paidAmount.toLocaleString()}`;
                        if (dueDate) finalMsg += `\n🗓️ Reminder: ${new Date(dueDate).toLocaleDateString()}`;
                        finalMsg += `\n⏳ New Balance: *₦${bal.toLocaleString()}*`;
                        
                        return await sendReply(from, finalMsg);
                    }
                    return await sendReply(from, `🤔 I couldn't find an active debt for *${cleanName}* to update.`);
                } else if (session.type === 'alarm_confirmation') {
                    // Handle 'Yes' for Alarms
                    if (['yes', 'y', 'confirm', 'correct', 'true', 'sure'].includes(lowerText)) {
                        const { saleId, debtorMsg, customerName } = session.data;
                        await WhatsAppSession.deleteOne({ _id: session._id });

                        const sale = await Sale.findById(saleId);
                        
                        // ✅ SAFETY CHECK: Don't send reminders for fully paid debts
                        if (sale && sale.status === 'paid') {
                            return await sendReply(from, `🎉 *Good News!* \n\n*${customerName}* has already cleared this debt! No reminder needed. Keep winning! 🥂`);
                        }
                        
                        if (sale && sale.customerPhone) {
                            await sendReply(sale.customerPhone, debtorMsg);

                            // Notify Oga (Oga Monitor)
                            if (isStaff && profile.whatsappNumber) {
                                const ogaMessage = `🔔 *Reminder Alert (Staff)* \n\nYour staff (*${cleanFrom}*) just sent a payment reminder to *${customerName}* for Invoice #${sale.invoiceNumber}. \n\n_Active recovery in progress!_ 🚀`;
                                await sendReply(profile.whatsappNumber, ogaMessage);
                            }

                            return await sendReply(from, `✅ *Sent!* \n\nI've forwarded the reminder link directly to *${customerName}* on WhatsApp. 🚀`);
                        } else if (sale) {
                            return await sendReply(from, `📋 *Copy & Forward this to ${customerName}:* \n\n_"${debtorMsg}"_\n\n(I couldn't send it automatically because I don't have their WhatsApp number in my records yet)`);
                        } else {
                            return await sendReply(from, `🤔 I couldn't locate that record anymore. It might have been deleted.`);
                        }
                    }
                }
            }
        }

        // ROUTER: Keywords that trigger instant responses without AI
        const entityLabel = profile.entityType === 'business' ? 'Business' : 'Hustle';
        const isGreeting = /^hi|^hello|^hey|^h\b|^yo\b|kreddy/i.test(lowerText);
        const isThanks = /thanks|thank you|merci|jazak|nice/i.test(lowerText);
        
        if (isGreeting && lowerText.split(' ').length <= 3) {
            const personalizedGreeting = getRandom(HUMANIZE.greetings, { name: profile.displayName }, plan);
            const statusLabel = plan === "chairman" ? "📊 *EMPIRE STATUS*" : "📊 *STATS*";
            const bossRole = plan === "chairman" ? "your Digital Chief of Staff" : "your Kredibly partner";

            await sendReply(from, `${personalizedGreeting} \n\nI'm *Kreddy*, ${bossRole}. \n\n*What's the plan for today?*\n${statusLabel}: Type *S*\n⏳ *DEBTS*: Type *D*\n💡 *HELP*: Type *HELP*`);
            return;
        } else if (isThanks) {
            const title = plan === "chairman" ? "Chairman" : (plan === "oga" ? "Oga" : "Boss");
            await sendReply(from, `You're very welcome, ${title}! 🫡 Always happy to keep your records straight. Let me know if you need anything else!`);
            return;
        } else {
            // 🧠 100% AI-DRIVEN PIPELINE (No Regex)
            const session = await WhatsAppSession.findOne({ whatsappNumber: cleanFrom });

            // Fetch some context about debtors to help the AI be "Brainy"
            const unpaidSales = await Sale.find({ businessId: profile._id, status: { $ne: "paid" } }).sort({ createdAt: -1 }).limit(10);
            const debtorContext = unpaidSales.map(s => {
                const bal = s.totalAmount - s.payments.reduce((sum, p) => sum + p.amount, 0);
                return `${s.customerName}: ₦${bal.toLocaleString()} (Invoice #${s.invoiceNumber})`;
            }).join(", ");

            // Fetch active reminders for schedule context
            const activeReminders = await Reminder.find({ 
                businessId: profile._id, 
                status: "pending",
                triggerDate: { $gte: new Date() }
            }).sort({ triggerDate: 1 }).limit(10);
            const reminderContext = activeReminders.length > 0 
                ? activeReminders.map(r => {
                    const time = r.triggerDate.toLocaleString('en-NG', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                    return `"${r.description}" at ${time} (${r.type})`;
                }).join(", ")
                : "No active reminders";

            // 🧠 INTELLIGENCE SELECTION (Based on Plan)
            let aiResponse = null;

            if (msgType === "audio" || msgType === "voice") {
                if (plan !== "chairman" && plan !== "oga") {
                    return await sendReply(from, "Boss! 🛡️ Voice notes are an exclusive feature for the *Oga* and *Chairman* plans. Upgrade now to unlock Voice Sync! 🦁");
                }
                
                const mediaId = message.audio?.id || message.voice?.id;
                if (!mediaId) return;

                const bossTitle = plan === "chairman" ? "Chairman" : "Oga";

                await sendReply(from, `${bossTitle}, I catch the voice note! 💎 Analyzing it now... 🎧`);
                const media = await downloadWhatsAppMedia(mediaId);
                
                if (media) {
                    aiResponse = await processAudioWithAI(media.buffer, media.mimeType, {
                        merchantName: profile.displayName,
                        plan: plan,
                        entityType: profile.entityType,
                        preferredTone: profile.assistantSettings?.reminderTemplate || "friendly",
                        debtors: debtorContext || "No active debtors yet."
                    });

                    if (aiResponse) {
                        profile.monthlyUsage.voiceNotes = (profile.monthlyUsage.voiceNotes || 0) + 1;
                        await profile.save();
                    }
                }

                if (!aiResponse) {
                    return await sendReply(from, `${bossTitle}, my brain logic failed to hear that clearly. 😵‍ Please try again or type it for now.`);
                }
            } else if (msgType === "image") {
                if (plan !== "chairman") {
                    return await sendReply(from, "Boss! 📸 Image scanning (Receipts) is an exclusive feature for the *Chairman Plan*. \n\nUpgrade now so you can just snap pictures and let me do the work! 🦁");
                }
                
                const mediaId = message.image?.id;
                if (!mediaId) return;

                await sendReply(from, "Chairman, I catch the image! 💎 Scanning it now... 🔍");
                const media = await downloadWhatsAppMedia(mediaId);
                
                if (media) {
                    aiResponse = await processImageWithAI(media.buffer, media.mimeType, {
                        merchantName: profile.displayName,
                        plan: plan,
                        entityType: profile.entityType,
                        preferredTone: profile.assistantSettings?.reminderTemplate || "friendly",
                        debtors: debtorContext || "No active debtors yet."
                    });

                    if (aiResponse) {
                        profile.monthlyUsage.images = (profile.monthlyUsage.images || 0) + 1;
                        await profile.save();
                    }
                }

                if (!aiResponse) {
                    return await sendReply(from, "Chairman, my brain logic failed to read that image clearly. 😵‍ Please try again or type it for now.");
                }
            } else if (isHustler) {
                const aiUsed = profile.monthlyUsage?.aiRequests || 0;
                
                if (aiUsed < 50) {
                    console.log(`⚡ Plan: Hustler (Using AI - ${aiUsed}/50 used)`);
                    aiResponse = await processMessageWithAI(text, { 
                        merchantName: profile.displayName,
                        plan: plan,
                        entityType: profile.entityType,
                        preferredTone: preferredTone,
                        debtors: debtorContext || "No active debtors yet.",
                        activeReminders: reminderContext,
                        currentSession: session || null,
                        hasOpenTicket: !!openTicket
                    });
                    
                    if (aiResponse && !aiResponse.isFallback && !Array.isArray(aiResponse)) {
                        // Support multi-intent array too
                        const isArrayOfFallbacks = Array.isArray(aiResponse) ? aiResponse.some(a => a.isFallback) : false;
                        if(!isArrayOfFallbacks) {
                            if (!profile.monthlyUsage) profile.monthlyUsage = {};
                            profile.monthlyUsage.aiRequests = aiUsed + 1;
                            await profile.save();
                            
                            if (profile.monthlyUsage.aiRequests === 50) {
                                await sendReply(from, "⚠️ *AI Limit Reached*\n\nYou just used your 50th Smart AI action for the month! \n\nFrom now on, Kreddy will switch to 'dumb mode' (she will only understand strict formats like 'Record: Kola 5k'). \n\nTo get Kreddy's brain back, simply type _'Pay for Oga'_! 🚀");
                            } else if (profile.monthlyUsage.aiRequests === 45) {
                                await sendReply(from, "⚠️ *AI Limit Warning*\n\nYou have 5 Smart AI actions left for this month on the Hustler plan. Upgrade to Oga soon to keep Kreddy smart!");
                            }
                        }
                    } else {
                        aiResponse = extractInfoRobust(text, { 
                            merchantName: profile.displayName,
                            plan: plan,
                            entityType: profile.entityType,
                            preferredTone: profile.assistantSettings?.reminderTemplate || "friendly",
                            currentSession: session || null 
                        });
                    }
                } else {
                    console.log("⚡ Plan: Hustler (Out of Limit - Using Regex/Robust Logic)");
                    aiResponse = extractInfoRobust(text, { 
                        merchantName: profile.displayName,
                        plan: plan,
                        entityType: profile.entityType,
                        preferredTone: profile.assistantSettings?.reminderTemplate || "friendly",
                        currentSession: session || null 
                    });
                }
            } else {
                console.log(`💎 Plan: ${plan.toUpperCase()} (Using Gemini AI)`);
                aiResponse = await processMessageWithAI(text, { 
                    merchantName: profile.displayName,
                    plan: plan,
                    entityType: profile.entityType,
                    preferredTone: preferredTone,
                    debtors: debtorContext || "No active debtors yet.",
                    activeReminders: reminderContext,
                    currentSession: session || null,
                    hasOpenTicket: !!openTicket
                });
                
                // FALLBACK: If AI is rate-limited (429) or fails, switch to Regex logic
                if (!aiResponse || aiResponse.isFallback) {
                    const isExplicitFallback = aiResponse?.isFallback;
                    console.warn(isExplicitFallback ? "⚠️ Gemini Rate Limit Hit! Falling back to Regex..." : "⚠️ AI Error: Falling back to Regex...");
                    
                    aiResponse = extractInfoRobust(text, { 
                        merchantName: profile.displayName,
                        plan: plan,
                        entityType: profile.entityType,
                        preferredTone: preferredTone,
                        currentSession: session || null 
                    });

                    // Add hint if Gemini explicitly told us it's rate-limited
                    if (isExplicitFallback && aiResponse.data) {
                        aiResponse.data.reply = `(AI is sleeping 💤) ` + aiResponse.data.reply;
                    }
                } else {
                    console.log(`🤖 AI Result: Intent=${aiResponse.intent}, Confidence=${aiResponse.confidence}`);
                }
            }

            // -------------------------------------------------------------------------
            // 🧠 MULTI-INTENT HANDLING: AI may return an array of intents
            // -------------------------------------------------------------------------
            let intentQueue = [];
            if (Array.isArray(aiResponse)) {
                console.log(`🧠 Multi-intent detected: ${aiResponse.length} intents`);
                intentQueue = aiResponse;
            } else if (aiResponse) {
                intentQueue = [aiResponse];
            }

            // Process each intent in the queue
            for (const currentIntent of intentQueue) {
            const aiResponseItem = currentIntent;
            let isProcessed = false;

            // 1. UPDATE RECORD
            if (!isProcessed && aiResponseItem && aiResponseItem.intent === "update_record") {
                 console.log("📝 Handling update_record intent...");
                 
                 if (session?.data?.lastSaleId && (aiResponseItem.data.paidAmount > 0 || aiResponseItem.data.dueDate)) {
                     const sale = await Sale.findById(session.data.lastSaleId);
                     if (sale && sale.status !== 'paid') {
                         if (aiResponseItem.data.paidAmount > 0) sale.payments.push({ amount: aiResponseItem.data.paidAmount, method: "WhatsApp Context Update" });
                         if (aiResponseItem.data.dueDate) sale.dueDate = new Date(aiResponseItem.data.dueDate);
                         await sale.save();
                         await sendReply(from, `✅ *Record Updated!* \n\nI've updated the ledger for *${sale.customerName}*.`);
                         isProcessed = true;
                     }
                 } 
                 
                 if (!isProcessed && aiResponseItem.data.customerName && aiResponseItem.data.customerName !== "Customer") {
                     const matches = await Sale.find({ 
                        businessId: profile._id, 
                        customerName: { $regex: new RegExp(`^${aiResponseItem.data.customerName.replace(/\s+/g, '\\s+')}$`, "i") },
                        status: { $ne: "paid" }
                     });

                     if (matches.length === 1) {
                        const sale = matches[0];
                        if (aiResponseItem.data.paidAmount > 0) sale.payments.push({ amount: aiResponseItem.data.paidAmount, method: "WhatsApp Global Update" });
                        if (aiResponseItem.data.dueDate) sale.dueDate = new Date(aiResponseItem.data.dueDate);
                        await sale.save();
                        await sendReply(from, `✅ *Update Successful!* \n\nRecorded for *${sale.customerName}*. Receipt updated. 🛡️`);
                        isProcessed = true;
                     } else if (matches.length > 1) {
                        let disambigMsg = `🤔 I found *${matches.length}* people named *${aiResponseItem.data.customerName}* with unpaid debts. Which one should I update?\n\n`;
                        matches.forEach((opt, i) => {
                            const bal = opt.totalAmount - opt.payments.reduce((s,p)=>s+p.amount, 0);
                            disambigMsg += `${i + 1}. *${opt.customerName}* (Owes ₦${bal.toLocaleString()})\n`;
                        });
                        disambigMsg += `\n_Type the number (1-${matches.length}) to pick one!_`;
                        
                        await WhatsAppSession.findOneAndUpdate(
                            { whatsappNumber: cleanFrom },
                            {
                                type: 'payment_disambiguation',
                                data: { 
                                    options: matches.map(m => ({ id: m._id, name: m.customerName })),
                                    dueDate: aiResponseItem.data.dueDate,
                                    paidAmount: aiResponseItem.data.paidAmount
                                },
                                expiresAt: new Date(Date.now() + 5 * 60 * 1000)
                            },
                            { upsert: true }
                        );
                        await sendReply(from, disambigMsg);
                        isProcessed = true;
                     }
                 }

                 if (!isProcessed && (aiResponseItem.data.totalAmount > 0 || (aiResponseItem.data.paidAmount && aiResponseItem.data.paidAmount > 0))) {
                     console.log("🔄 Re-routing: No record found to update, switching to create_sale...");
                     aiResponseItem.intent = "create_sale";
                 }
            }

            // 2. CREATE SALE
            if (!isProcessed && aiResponseItem && aiResponseItem.intent === "create_sale" && aiResponseItem.data.totalAmount) {
                const { customerName, totalAmount, paidAmount, item, dueDate } = aiResponseItem.data;
                const newSale = new Sale({
                    businessId: profile._id,
                    customerName: customerName || (session?.data?.customerName) || "Customer",
                    description: item && item !== "Item" ? item : "Purchase recorded via WhatsApp",
                    totalAmount: totalAmount,
                    payments: [{ amount: paidAmount || 0, method: "WhatsApp" }],
                    dueDate: dueDate && !isNaN(new Date(dueDate).getTime()) ? new Date(dueDate) : undefined,
                    recordedBy: cleanFrom
                });
                await newSale.save();

                await WhatsAppSession.findOneAndUpdate(
                    { whatsappNumber: cleanFrom },
                    {
                        type: 'active_context',
                        data: { customerName: newSale.customerName, lastSaleId: newSale._id, description: newSale.description },
                        expiresAt: new Date(Date.now() + 10 * 60 * 1000)
                    },
                    { upsert: true }
                );

                await logActivity({
                    businessId: profile._id,
                    action: "WHATSAPP_SALE_CREATED",
                    entityType: "SALE",
                    entityId: newSale._id,
                    details: `Recorded sale of ₦${totalAmount.toLocaleString()} to ${newSale.customerName} via WhatsApp`
                });

                const bal = totalAmount - (paidAmount || 0);
                const notificationTitle = totalAmount >= 50000 ? "🔥 Big Sale Recorded!" : "New Sale via WhatsApp 🚀";
                
                await Notification.create({
                    businessId: profile._id,
                    title: notificationTitle,
                    message: `₦${totalAmount.toLocaleString()} logged for ${newSale.customerName}.`,
                    type: "sale",
                    saleId: newSale._id
                });

                const celebration = totalAmount >= 50000 ? getRandom(HUMANIZE.celebration) + "\n\n" : "Nice one! 🚀\n\n";
                let reply = `✅ *Record Saved!* (#${newSale.invoiceNumber})\n\n${celebration}I've logged *₦${totalAmount.toLocaleString()}* for ${newSale.customerName}.\n`;
                if (bal > 0) reply += `⏳ They still owe you *₦${bal.toLocaleString()}*`;
                else reply += `✅ *Fully Paid!*`;
                
                await sendReply(from, reply);
                
                // Immediately provide a copy-paste draft for the merchant
                const draftLink = `${APP_URL}/i/${newSale.invoiceNumber}`;
                const draftMsg = `Hi ${newSale.customerName}, here is your secure receipt/invoice from ${profile.displayName} for ₦${totalAmount.toLocaleString()}: ${draftLink}`;
                
                await sendReply(from, `📝 *Forward this to ${newSale.customerName}* (Copy the message below):`);
                await sendReply(from, draftMsg);

                if (isStaff && profile.whatsappNumber) {
                    await sendReply(profile.whatsappNumber, `📢 *Staff Activity Report* \n\nA new sale was just recorded by your staff (*${cleanFrom}*):\n\n👤 Customer: ${newSale.customerName}\n💰 Amount: ₦${totalAmount.toLocaleString()}\n📑 Invoice: #${newSale.invoiceNumber}`);
                }
                isProcessed = true;
            }

            // 3. OTHER INTENTS
            if (!isProcessed) {
                if (aiResponseItem && aiResponseItem.intent === "check_debt") {
                    const searchName = (aiResponseItem.data.customerName || "").trim();
                    
                    if (!searchName || searchName.toLowerCase() === "customer") {
                        const sales = await Sale.find({ businessId: profile._id });
                        let msg = `Omo, debtors plenty for street! 😅 \n\n⏳ *Outstanding Balances:*\n\n`;
                        let count = 0;
                        sales.forEach(s => {
                            const bal = s.totalAmount - s.payments.reduce((sum, p) => sum + p.amount, 0);
                            if (bal > 0) {
                                msg += `• *${s.customerName}*: ₦${bal.toLocaleString()} (#${s.invoiceNumber})\n`;
                                count++;
                            }
                        });
                        await sendReply(from, count === 0 ? "🎉 Amazing! Nobody owes you any money right now." : msg);
                    } else {
                        const matches = await Sale.find({ 
                            businessId: profile._id, 
                            customerName: { $regex: new RegExp(searchName, "i") }, 
                            status: { $ne: "paid" } 
                        });

                        if (matches.length === 0) {
                            await sendReply(from, `🔍 I couldn't find an unpaid record for *${searchName}*.`);
                        } else {
                            const sale = matches[0];
                            const bal = sale.totalAmount - sale.payments.reduce((s, p) => s + p.amount, 0);
                            const link = `${APP_URL}/i/${sale.invoiceNumber}`;

                            let msg1 = `🤝 *Payment Link for ${sale.customerName}*\n💰 Balance: *₦${bal.toLocaleString()}*\n\n*Just forward the message below directly to them:* 👇`;
                            let msg2 = `Hi ${sale.customerName}, here is the secure update and payment link for your outstanding balance of ₦${bal.toLocaleString()} with ${profile.displayName}: ${link}`;
                            await sendReply(from, msg1);
                            setTimeout(async () => { await sendReply(from, msg2); }, 100);
                        }
                    }
                    isProcessed = true;
                } else if (aiResponseItem && aiResponseItem.intent === "confirm_record") {
                    const ref = aiResponseItem.data.invoiceNumber || aiResponseItem.invoiceNumber;
                    if (!ref) { await sendReply(from, "Boss, I catch that you want to verify a record, but I need the Invoice Number (like KR-XXXX)."); }
                    else {
                        let invoiceId = ref.toUpperCase().trim();
                        if (!invoiceId.startsWith("KR-")) invoiceId = "KR-" + invoiceId;
                        const sale = await Sale.findOne({ businessId: profile._id, invoiceNumber: invoiceId });
                        if (!sale) { await sendReply(from, `🔍 I couldn't find a record with ID *${invoiceId}*.`); }
                        else {
                            sale.confirmed = true;
                            sale.confirmedAt = new Date();
                            await sale.save();
                            await sendReply(from, `🛡️ *Record Verified!* \n\nInvoice *${invoiceId}* has been officially confirmed. This boosts your Trust Score! 🚀`);
                        }
                    }
                    isProcessed = true;
                } else if (aiResponseItem && aiResponseItem.intent === "draft_reminder") {
                    const searchName = (aiResponseItem.data.customerName || "").replace(/\s+/g, ' ').trim();
                    const matches = await Sale.find({
                        businessId: profile._id,
                        customerName: { $regex: new RegExp(searchName.replace(/\s+/g, '\\s+'), "i") },
                        status: { $ne: "paid" }
                    });

                    if (matches.length === 0) {
                        await sendReply(from, `🤔 I couldn't find an active debt for *${searchName || 'them'}* to draft a message for.`);
                    } else if (matches.length === 1) {
                        const sale = matches[0];
                        const bal = sale.totalAmount - sale.payments.reduce((s, p) => s + p.amount, 0);
                        const link = `${APP_URL}/i/${sale.invoiceNumber}`;
                        const draft = `Hi ${sale.customerName}, this is a friendly reminder for your balance of ₦${bal.toLocaleString()} with ${profile.displayName}. You can view and pay here: ${link}`;
                        await sendReply(from, `📝 *Draft for ${sale.customerName}:* \n\n_"${draft}"_\n\n(You can copy and forward this to them! 🚀)`);
                    } else {
                        let reply = `🤔 I found *${matches.length}* people named *${searchName}*. Which one should I draft for?\n\n`;
                        matches.forEach((m, i) => {
                            const bal = m.totalAmount - m.payments.reduce((s,p)=>s+p.amount, 0);
                            reply += `${i+1}. *${m.customerName}* (Owes ₦${bal.toLocaleString()})\n`;
                        });
                        await WhatsAppSession.findOneAndUpdate(
                            { whatsappNumber: cleanFrom },
                            {
                                type: 'draft_disambiguation',
                                data: { options: matches.map(m => ({ id: m._id, name: m.customerName })) },
                                expiresAt: new Date(Date.now() + 5 * 60 * 1000)
                            },
                            { upsert: true }
                        );
                        await sendReply(from, reply);
                    }
                    isProcessed = true;
                } else if (aiResponseItem && aiResponseItem.intent === "upgrade") {
                    const bossTitle = plan === "chairman" ? "Chairman" : (plan === "oga" ? "Oga" : "Boss");
                    const upgradeUrl = `${process.env.FRONTEND_URL || 'https://usekredibly.com'}/pricing`;
                    await sendReply(from, `${bossTitle}! 💎 You want to level up your hustle? \n\nYou can see all our plans and upgrade directly here: ${upgradeUrl}\n\nLet's get your business to the next level! 🚀`);
                    isProcessed = true;
                } else if (aiResponseItem && aiResponseItem.intent === "create_reminder") {
                    const data = aiResponseItem.data || {};
                    const reminderDateStr = data.reminderDate || aiResponseItem.reminderDate || data.dueDate || data.date;
                    const taskDescription = data.taskDescription || aiResponseItem.taskDescription || data.item || data.description;
                    const reminderType = data.reminderType || aiResponseItem.reminderType || "task";
                    const recurrence = data.recurrence || aiResponseItem.recurrence || "none";
                    
                    if (!reminderDateStr || !taskDescription) {
                        console.warn(`⚠️ Partial Reminder Captured: Date=${reminderDateStr}, Task=${taskDescription}`);
                        await sendReply(from, "I catch the task, but I'm not entirely sure *when* you want me to remind you. Try say: _'Remind me to call Kola by 4pm'_");
                    } else {
                        const triggerDate = new Date(reminderDateStr);
                        if (isNaN(triggerDate.getTime())) {
                            await sendReply(from, "I catch the task, but the time isn't clear to me. 😵‍ Please try again with a clear time.");
                        } else if (triggerDate <= new Date()) {
                            await sendReply(from, "I hear you, but you can't set a reminder for the past! 😅 Give me a future time.");
                        } else if ((triggerDate.getTime() - new Date().getTime()) < 5 * 60 * 1000) {
                            await sendReply(from, "Boss, give me at least 5 minutes notice! 😂 Try a time slightly further ahead.");
                        } else {
                            let canSet = true;
                            const usedReminders = (profile.monthlyUsage?.reminders) || 0;

                            if (plan === "oga") {
                                if (usedReminders >= 60) {
                                    canSet = false;
                                    await sendReply(from, "Oga! 🧠 Your brain is moving fast! But you've reached your limit of 60 Task Reminders for this month. \n\nUpgrade to the *Chairman Plan* for unlimited reminders and AI planning! 🚀");
                                }
                            } else if (plan === "hustler" || !plan) {
                                if (usedReminders >= 5) {
                                    canSet = false;
                                    await sendReply(from, "Chief! 📈 You've used your 5 free Task Reminders for this month. 👏 \n\nUpgrade to the *Oga Plan* for just ₦5,000 to get 60 reminders and unlock Voice Notes! 🚀");
                                }
                            }

                            if (canSet) {
                                let linkedSaleId = null;
                                const searchName = data.customerName || aiResponseItem.customerName;
                                
                                if (searchName && searchName.toLowerCase() !== "customer") {
                                    const sale = await Sale.findOne({ 
                                        businessId: profile._id, 
                                        customerName: { $regex: new RegExp(searchName.replace(/\s+/g, '\\s+'), "i") }, 
                                        status: { $ne: "paid" } 
                                    }).sort({ createdAt: -1 });
                                    if (sale) linkedSaleId = sale._id;
                                }

                                await Reminder.create({
                                    businessId: profile._id,
                                    whatsappNumber: cleanFrom,
                                    description: taskDescription,
                                    triggerDate: triggerDate,
                                    type: reminderType,
                                    recurrence: recurrence,
                                    saleId: linkedSaleId
                                });

                                if (!profile.monthlyUsage) profile.monthlyUsage = { reminders: 0, voiceNotes: 0, images: 0, lastReset: new Date() };
                                profile.monthlyUsage.reminders = usedReminders + 1;
                                await profile.save();

                                const FriendlyDate = triggerDate.toLocaleString('en-NG', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                                const recLabel = recurrence !== 'none' ? ` (${recurrence} repeat)` : "";
                                await sendReply(from, `✅ *Task Saved!* \n\nI will remind you to *"${taskDescription}"* on ${FriendlyDate}${recLabel}. 🫡`);
                            }
                        }
                    }
                    isProcessed = true;
                } else if (aiResponseItem && aiResponseItem.intent === "snooze_reminder") {
                    const data = aiResponseItem.data || {};
                    const reminderDateStr = data.reminderDate || aiResponseItem.reminderDate;
                    const snoozeMins = data.snoozeDuration || 30;
                    const snoozeAll = data.snoozeAll || false;
                    
                    const bossTitle = plan === "chairman" ? "Chairman" : (plan === "oga" ? "Oga" : "Boss");

                    if (snoozeAll) {
                        // Find all pending reminders for today and snooze them
                        const todayStart = new Date(); todayStart.setHours(0,0,0,0);
                        const todayEnd = new Date(); todayEnd.setHours(23,59,59,999);
                        
                        const remindersToSnooze = await Reminder.find({
                            businessId: profile._id,
                            status: { $in: ["pending", "delivered"] },
                            triggerDate: { $gte: todayStart, $lte: todayEnd }
                        });

                        if (remindersToSnooze.length > 0) {
                            let newTriggerDate;
                            if (reminderDateStr) {
                                newTriggerDate = new Date(reminderDateStr);
                            } else {
                                newTriggerDate = new Date(Date.now() + snoozeMins * 60000);
                            }

                            for (const r of remindersToSnooze) {
                                r.triggerDate = newTriggerDate;
                                r.status = "pending";
                                r.snoozeCount += 1;
                                await r.save();
                            }

                            const friendly = newTriggerDate.toLocaleString('en-NG', { hour: '2-digit', minute: '2-digit' });
                            await sendReply(from, `Understood, ${bossTitle}! 😴 I've snoozed ALL *${remindersToSnooze.length}* tasks until *${friendly}*. talk soon!`);
                        } else {
                            await sendReply(from, `I don't see any active tasks to snooze right now, ${bossTitle}.`);
                        }
                    } else {
                        const lastReminder = await Reminder.findOne({
                            whatsappNumber: cleanFrom,
                            status: "delivered"
                        }).sort({ updatedAt: -1 });

                        if (lastReminder) {
                            let newTriggerDate;
                            let displayMsg;

                            if (reminderDateStr) {
                                newTriggerDate = new Date(reminderDateStr);
                                if (isNaN(newTriggerDate.getTime())) {
                                    newTriggerDate = new Date(Date.now() + 30 * 60000);
                                    displayMsg = "I couldn't catch the exact time, so I've snoozed it for 30 minutes. 😴";
                                } else {
                                    const friendly = newTriggerDate.toLocaleString('en-NG', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                                    displayMsg = `I've snoozed that until *${friendly}*. 🫡`;
                                }
                            } else {
                                newTriggerDate = new Date(Date.now() + snoozeMins * 60000);
                                displayMsg = `I've snoozed that for ${snoozeMins} minutes. 🫡`;
                            }

                            lastReminder.triggerDate = newTriggerDate;
                            lastReminder.status = "pending";
                            lastReminder.snoozeCount += 1;
                            await lastReminder.save();
                            await sendReply(from, `Understood, ${bossTitle}! 😴 ${displayMsg}`);
                        } else {
                            await sendReply(from, `I'm not sure which reminder you want to snooze, ${bossTitle}. I don't see any recent alerts.`);
                        }
                    }
                    isProcessed = true;
                } else if (aiResponseItem && aiResponseItem.intent === "check_schedule") {
                    // 📋 NEW: CHECK SCHEDULE - Show user their pending reminders/tasks
                    const bossTitle = plan === "chairman" ? "Chairman" : (plan === "oga" ? "Oga" : "Boss");
                    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
                    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
                    
                    const todayReminders = await Reminder.find({
                        businessId: profile._id,
                        status: "pending",
                        triggerDate: { $gte: todayStart, $lte: todayEnd }
                    }).sort({ triggerDate: 1 });

                    const upcomingReminders = await Reminder.find({
                        businessId: profile._id,
                        status: "pending",
                        triggerDate: { $gt: todayEnd }
                    }).sort({ triggerDate: 1 }).limit(5);

                    let scheduleMsg = `📋 *Your Schedule, ${bossTitle}!*\n\n`;
                    
                    if (todayReminders.length > 0) {
                        scheduleMsg += `🗓️ *Today:*\n`;
                        todayReminders.forEach(r => {
                            const time = r.triggerDate.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
                            const typeIcon = r.type === 'meeting' ? '📅' : (r.type === 'personal' ? '🏋️' : (r.type === 'debt' ? '💰' : '📌'));
                            scheduleMsg += `${typeIcon} *${time}* — ${r.description}\n`;
                        });
                    } else {
                        scheduleMsg += `🗓️ *Today:* Nothing scheduled yet!\n`;
                    }

                    if (upcomingReminders.length > 0) {
                        scheduleMsg += `\n📆 *Coming Up:*\n`;
                        upcomingReminders.forEach(r => {
                            const date = r.triggerDate.toLocaleString('en-NG', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                            scheduleMsg += `• ${r.description} — ${date}\n`;
                        });
                    }

                    scheduleMsg += `\n_To add a task, say: "Remind me to [task] by [time]"_ 💡`;
                    await sendReply(from, scheduleMsg);
                    isProcessed = true;
                } else if (aiResponseItem && aiResponseItem.intent === "pay_subscription") {
                    const targetPlan = (aiResponseItem.data.plan || "oga").toLowerCase();
                    const cycle = (aiResponseItem.data.billingCycle || "monthly").toLowerCase();
                    const bossTitle = plan === "chairman" ? "Chairman" : (plan === "oga" ? "Oga" : "Boss");

                    const user = await User.findById(profile.ownerId);
                    if (!user) {
                        await sendReply(from, `Sorry ${bossTitle}, I couldn't find your account details to generate a payment link. Please contact support!`);
                    } else {
                        const price = getPlanPrice(targetPlan, cycle);
                        if (!price) {
                            await sendReply(from, `I’m sorry ${bossTitle}, I couldn't fetch the price for the ${targetPlan} plan. Try the dashboard!`);
                        } else {
                            const reference = `KREDDY_SUB_${Date.now()}`;
                            const metadata = { 
                                paymentType: 'subscription', 
                                plan: targetPlan, 
                                billingCycle: cycle, 
                                businessId: profile._id.toString(),
                                email: user.email 
                            };
                            
                            try {
                                const paystackData = await initializePayment(user.email, price, reference, metadata);
                                await sendReply(from, `🚀 *${bossTitle}, your upgrade is ready!* \n\nI've generated a secure payment link for the *${targetPlan.toUpperCase()}* (${cycle}) plan.\n\n💰 Amount: *₦${price.toLocaleString()}*\n🔗 Pay here: ${paystackData.authorization_url}\n\nOnce you pay, I'll instantly unlock your new powers! 🛡️`);
                            } catch (e) {
                                console.error("Paystack Init Error:", e.message);
                                await sendReply(from, `Ouch! I had trouble generating that payment link. Please try again or use the website dashboard!`);
                            }
                        }
                    }
                    isProcessed = true;
                } else if (aiResponseItem && aiResponseItem.intent === "check_billing") {
                    const bossTitle = plan === "chairman" ? "Chairman" : (plan === "oga" ? "Oga" : "Boss");
                    const nextDate = profile.nextBillingDate ? new Date(profile.nextBillingDate).toLocaleDateString() : (profile.trialExpiresAt ? new Date(profile.trialExpiresAt).toLocaleDateString() + " (Trial)" : "Not set");
                    const lastPaid = profile.lastPaidAt ? new Date(profile.lastPaidAt).toLocaleDateString() : "No record";
                    
                    let msg = `💳 *Billing Details for ${profile.displayName}*\n\n`;
                    msg += `⭐ *Current Plan:* ${plan.toUpperCase()}\n`;
                    msg += `⏳ *Next Payment:* ${nextDate}\n`;
                    msg += `📑 *Last Payment:* ${lastPaid}\n\n`;
                    msg += `Need to upgrade or renew? Just say _"I want to pay for Oga"_! 🚀`;
                    
                    await sendReply(from, msg);
                    isProcessed = true;
                } else if (aiResponseItem && aiResponseItem.intent === "check_staff") {
                    const bossTitle = plan === "chairman" ? "Chairman" : (plan === "oga" ? "Oga" : "Boss");
                    if (!profile.staffNumbers || profile.staffNumbers.length === 0) {
                        await sendReply(from, `${bossTitle}, you currently have no staff members registered to your account.`);
                    } else {
                        let msg = `📋 *Your Registered Staff:*\n\n`;
                        profile.staffNumbers.forEach((num, i) => {
                            msg += `${i+1}. ${num}\n`;
                        });
                        await sendReply(from, msg);
                    }
                    isProcessed = true;
                } else if (aiResponseItem && aiResponseItem.intent === "add_staff") {
                    const bossTitle = plan === "chairman" ? "Chairman" : (plan === "oga" ? "Oga" : "Boss");
                    
                    if (plan === "hustler" || !plan) {
                        await sendReply(from, `${bossTitle}! 🛑 Adding staff via WhatsApp is a premium feature. \n\nUpgrade to the *Oga Plan* to add up to 2 staff, or the *Chairman Plan* for unlimited branch tracking! 🚀`);
                    } else {
                        const newPhoneRaw = aiResponseItem.data.phoneNumber || "";
                        const newPhone = newPhoneRaw.replace(/\D/g, "");
                        
                        if (!newPhone || newPhone.length < 10) {
                            await sendReply(from, `I couldn't catch the exact phone number for the new staff, ${bossTitle}. Please tell me their number clearly, like "Add 08123456789".`);
                        } else {
                            if (!profile.staffNumbers) profile.staffNumbers = [];
                            
                            const staffLimit = plan === "oga" ? 2 : (plan === "chairman" ? 9999 : 0);
                            
                            if (profile.staffNumbers.length >= staffLimit) {
                                if (plan === "oga") {
                                    await sendReply(from, `${bossTitle}! You've reached your limit of ${staffLimit} staff members on the Oga plan. Upgrade to the *Chairman Plan* to add an unlimited number of staff! 🚀`);
                                } else {
                                    await sendReply(from, `You've reached your maximum staff limit, ${bossTitle}!`);
                                }
                            } else {
                                let formattedNewPhone = newPhone;
                                if (formattedNewPhone.startsWith("0")) formattedNewPhone = "234" + formattedNewPhone.substring(1);
                                else if (!formattedNewPhone.startsWith("234") && formattedNewPhone.length === 10) formattedNewPhone = "234" + formattedNewPhone;
                                
                                if (profile.staffNumbers.includes(formattedNewPhone) || profile.whatsappNumber === formattedNewPhone) {
                                    await sendReply(from, `That number is already registered to your business, ${bossTitle}!`);
                                } else {
                                    profile.staffNumbers.push(formattedNewPhone);
                                    await profile.save();
                                    
                                    const staffName = aiResponseItem.data.staffName || "your team member";
                                    await sendReply(from, `✅ *Staff Added!* \n\nI've successfully added ${staffName} (${formattedNewPhone}) to your team. They can now record sales and update receipts by chatting with me directly! 🤝`);
                                    
                                    // Send welcome message to new staff
                                    await sendWhatsAppMessage(formattedNewPhone, `👋 Hello! Your boss (${profile.displayName}) has added you to their Kredibly team.\n\nYou can now chat with me (Kreddy AI) here to record sales and check records on their behalf!\n\n_Try saying: "I just sold a pair of shoes to David for 20k"_`);
                                }
                            }
                        }
                    }
                    isProcessed = true;
                } else if (aiResponseItem && (aiResponseItem.intent === "draft_invoice" || aiResponseItem.intent === "draft_reminder" || aiResponseItem.intent === "send_invoice" || aiResponseItem.intent === "send_reminder")) {
                    const bossTitle = plan === "chairman" ? "Chairman" : (plan === "oga" ? "Oga" : "Boss");
                    
                    const searchName = (aiResponseItem.data.customerName || aiResponseItem.customerName || "").replace(/\s+/g, ' ').trim();
                    if (!searchName || searchName.toLowerCase() === "customer") {
                        await sendReply(from, `Who do you want to draft this for, ${bossTitle}? Please mention the customer's name.`);
                        isProcessed = true;
                        continue;
                    }

                    const matches = await Sale.find({ 
                        businessId: profile._id, 
                        customerName: { $regex: new RegExp(searchName.replace(/\s+/g, '\\s+'), "i") },
                        status: { $ne: "paid" }
                    }).sort({ createdAt: -1 });

                    if (matches.length === 0) {
                        await sendReply(from, `I couldn't find an active debt for *${searchName}*, ${bossTitle}.`);
                    } else if (matches.length > 1) {
                        let disambigMsg = `🤔 I found *${matches.length}* people named *${searchName}*. Which one should I draft this for?\n\n`;
                        matches.forEach((opt, i) => {
                            const bal = opt.totalAmount - opt.payments.reduce((s,p)=>s+p.amount, 0);
                            disambigMsg += `${i + 1}. *${opt.customerName}* (Owes ₦${bal.toLocaleString()})\n`;
                        });
                        disambigMsg += `\n_Type the number to pick one!_`;
                        
                        await WhatsAppSession.findOneAndUpdate(
                            { whatsappNumber: cleanFrom },
                            {
                                type: 'draft_disambiguation',
                                data: { 
                                    options: matches.map(m => ({ id: m._id, name: m.customerName })),
                                    isReminder: aiResponseItem.intent.includes("reminder")
                                },
                                expiresAt: new Date(Date.now() + 5 * 60 * 1000)
                            },
                            { upsert: true }
                        );
                        await sendReply(from, disambigMsg);
                    } else {
                        const sale = matches[0];
                        const APP_URL = process.env.FRONTEND_URL || "https://usekredibly.com";
                        const bal = sale.totalAmount - sale.payments.reduce((s,p)=>s+p.amount, 0);
                        const link = `${APP_URL}/i/${sale.invoiceNumber}`;
                        
                        let targetMsg = "";
                        if (aiResponseItem.intent.includes("reminder")) {
                            targetMsg = `Hi ${sale.customerName}, this is a friendly reminder to settle your balance of ₦${bal.toLocaleString()} with ${profile.displayName}. You can view your invoice and pay here: ${link}`;
                        } else {
                            targetMsg = `Hi ${sale.customerName}, here is your secure invoice and payment link from ${profile.displayName} for ₦${bal.toLocaleString()}: ${link}`;
                        }
                        
                        await sendReply(from, `📝 *Draft ready for ${sale.customerName}* (Copy the message below to forward it):`);
                        await sendReply(from, targetMsg);
                    }
                    isProcessed = true;
                } else if (aiResponseItem && (aiResponseItem.intent === "reply_ticket" || aiResponseItem.intent === "support" || (aiResponseItem.intent === "general_chat" && (text.toLowerCase().includes("problem") || text.toLowerCase().includes("issue"))))) {
                    if (openTicket && aiResponseItem.intent !== "new_support_ticket") {
                         openTicket.replies.push({ message: text, sender: "user" });
                         openTicket.status = "open";
                         await openTicket.save();
                         await sendReply(from, "📨 *Reply Sent!* \n\nI've forwarded your message to the support team. They'll see it on your dashboard ticket.");
                    } else {
                        const newTicket = new SupportTicket({
                            userId: profile.ownerId,
                            businessId: profile._id,
                            message: text,
                            status: "open"
                        });
                        await newTicket.save();
                        
                        try {
                            const { sendNewTicketEmail } = require("../../emailLogic/emails");
                            const adminEmail = process.env.ADMIN_EMAIL || "support@usekredibly.com"; 
                            await sendNewTicketEmail(adminEmail, profile.displayName, text, newTicket._id);
                        } catch (e) { console.error("Email fail", e); }

                        await Notification.create({
                            businessId: profile._id,
                            title: "Support Ticket Logged 🛡️",
                            message: `Ticket #${newTicket._id.toString().slice(-6)} is now open.`,
                            type: "system"
                        });

                        await sendReply(from, "🛡️ *Support Ticket Opened*\n\nI'll have the team look into this for you! 🚀 (Ticket #" + newTicket._id.toString().slice(-6) + ")");
                    }
                    isProcessed = true;
                } else if (aiResponseItem && aiResponseItem.intent === "general_chat") {
                    // Clear stale session context so follow-up messages don't get stuck
                    if (session) {
                        await WhatsAppSession.deleteOne({ _id: session._id });
                    }
                    await sendReply(from, aiResponseItem.data.reply || "I'm here, Chief! What's happening? 🚀");
                    isProcessed = true;
                } else {
                    // FALLBACK — Don't blindly reference old session context
                    let fallbackMsg = aiResponseItem?.data?.reply || "I'm listening, Chief! 🫡 ";
                    fallbackMsg += "I didn't quite catch the specifics. Try like: _'Sold a bag to Funke for 10k'_ or _'Remind me to call Kola by 4pm'_ 💰";
                    await sendReply(from, fallbackMsg);
                    isProcessed = true;
                }
            }
            } // END of for loop (multi-intent)
        }
    } catch (err) {
        console.error("WhatsApp Assistant Error:", err);
        await sendReply(from, "Ouch! My brain had a small glitch. 😵‍ Give me a moment to recover and try again! 🛡️");
    }
};

