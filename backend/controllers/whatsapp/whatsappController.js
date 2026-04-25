const BusinessProfile = require("../../models/BusinessProfile");
const Sale = require("../../models/Sale");
const Notification = require("../../models/Notification");
const WhatsAppSession = require("../../models/WhatsAppSession");
const SupportTicket = require("../../models/SupportTicket");
const Reminder = require("../../models/Reminder");
const User = require("../../models/User");
const Feedback = require("../../models/Feedback");
const CustomerAlias = require("../../models/CustomerAlias");
const axios = require("axios");
const { logActivity } = require("../../utils/activityLogger");
const { processMessageWithAI, processAudioWithAI, processImageWithAI } = require("../../utils/aiService");
const { logUsage } = require("../../utils/usageTracker");
const { initializePayment } = require("../../utils/paystack");
const { getPlanPrice } = require("../../config/pricing");
const { generateWittyIntro } = require("../../utils/aiService");
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
    debtors: [
        "Omo, debtors plenty for street! 😅",
        "Chai, people owe you o! Let's get your money back. 🛡️",
        "Oga, the debt list is long but we'll collect every kobo! 💰",
        "See as your money hang for outside... Don't worry, Kreddy is here. 🧐",
        "Wait, let me pull the list. These people must pay! 😤"
    ],
    history: [
        "Let's see what you've been cooking! Here's your full record history: 📊",
        "Tracking your progress... You're doing well! Here is everything recorded: 🚀",
        "Your business story is looking good! Check your full history: 🧾",
        "Searching the archives... Found your records! See them below: 📦"
    ],
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
        "🌟 *Big energy! Keep scaling!*",
        "Chairman move! 🚀",
        "Bag secured! 💰",
        "Level up! 📈",
        "You're doing well! 🎩",
        "Odogwu! 👑"
    ]
};

const getRandom = (arr, data = {}, plan = "hustler") => {
    let pool = Array.isArray(arr) ? arr : (arr[plan] || arr["hustler"]);
    let pick = pool[Math.floor(Math.random() * pool.length)];
    if (typeof pick !== 'string') return "";
    for (let [k, v] of Object.entries(data)) {
        pick = pick.replace(new RegExp(`{${k}}`, 'g'), v);
    }
    return pick;
};

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
            invoiceType: "billing",
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

    if (lower.includes("all sales") || lower.includes("show me everything") || lower.includes("full history") || lower.includes("all my records") || (lower.includes("history") && !lower.includes("debt"))) {
        result.intent = "list_sales";
        return result;
    }

    if (lower.includes("who owe") || lower.includes("who is owing") || lower.includes("list my debtor") || lower.includes("total debt") || lower.includes("show me who owe") || lower.includes("debt list") || lower.includes("debtors")) {
        result.intent = "check_debt";
        return result;
    }

    // CHECK SCHEDULE: "what are my plans", "my schedule", "what's on today", "do I have anything"
    if (lower.includes("my plan") || lower.includes("my schedule") || lower.includes("what's on") || lower.includes("do i have") || lower.includes("my tasks") || lower.includes("my reminders") || lower.includes("what do i have")) {
        result.intent = "check_schedule";
        const planT = (context.plan || "hustler") === "chairman" ? "Chairman" : ((context.plan || "hustler") === "oga" ? "Oga" : "Boss");
        const nameToUse = context.preferredName || planT;
        result.data.reply = `Let me check your schedule, ${nameToUse}! 📋`;
        return result;
    }

    // CALL ME / SET NAME: "kreddy call me Tunde", "call me Boss", "from now call me The Chairman"
    const callMeMatch = text.match(/(?:call me|from now (?:on )?call me|my name is|i am)\s+([a-z0-9\s''-]{2,30})/i);
    if (callMeMatch) {
        const newName = callMeMatch[1].trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
        result.intent = "set_preferred_name";
        result.data.preferredName = newName;
        result.data.reply = `Got it, *${newName}*! 🫡 From now on you are my *${newName}*. Your Kreddy knows her own. 👑`;
        return result;
    }

    // CUSTOMER NAME CORRECTION: "Change Samuel Mews to Samuel Mills"
    const renameMatch = text.match(/(?:change|rename|correct|update)\s+([a-z0-9\s''-]{2,30})\s+(?:to|as)\s+([a-z0-9\s''-]{2,30})/i);
    if (renameMatch) {
        result.intent = "update_record";
        result.data.customerName = renameMatch[1].trim();
        result.data.newName = renameMatch[2].trim();
        result.data.reply = `I'll update *${result.data.customerName}* to *${result.data.newName}* in the records immediately! 🛡️`;
        return result;
    }

    // DELETE REMINDER: "delete my 3pm reminder", "cancel my call with David", "remove task"
    if (lower.includes("delete") || lower.includes("cancel") || lower.includes("remove")) {
        if (lower.includes("reminder") || lower.includes("task") || lower.includes("call") || lower.includes("meeting")) {
            result.intent = "delete_reminder";
            result.data.taskDescription = text.replace(/delete|cancel|remove|reminder|task|my/gi, '').trim();
            return result;
        } else if (lower.includes("sale") || lower.includes("invoice") || lower.includes("record") || lower.includes("kr-")) {
            result.intent = "delete_sale";
            return result;
        }
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
    } else if (lower.includes(" paid") || lower.includes(" pay") || lower.includes(" brought") || lower.includes(" sent") || lower.includes("received") || lower.includes("collect") || lower.includes("already paid")) {
        result.intent = "update_record";
        if (lower.includes("paid outside") || lower.includes("outside") || lower.includes("already") || lower.includes("money received already") || lower.includes("cash in hand")) {
            result.data.invoiceType = "record";
        }
    } else if (lower.includes("sold") || lower.includes("selling") || lower.includes("sale") || lower.includes("record") || lower.includes("bought") || lower.includes("asking for money")) {
        result.intent = "create_sale";
        if (lower.includes("already paid") || lower.includes("record past") || lower.includes("ledger only") || lower.includes("money received already")) {
            result.data.invoiceType = "record";
        }
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
    
    // Character Mapping: use preferredName if set, else plan-based title
    const planDefaultTitle = plan === "chairman" ? "Chairman" : (plan === "oga" ? "Oga" : "Boss");
    const bossTitle = context.preferredName || planDefaultTitle;

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
        const label = result.data.invoiceType === 'record' ? 'Record (Already Paid)' : 'Invoice (Request Payment)';
        result.data.reply = tone === "friendly" 
            ? `I catch the work! 🛡️ Recording *${result.data.item}* for *${result.data.customerName}* as a *${label}*. \nTotal: *₦${result.data.totalAmount.toLocaleString()}* \nPaid: *₦${result.data.paidAmount.toLocaleString()}* \nCorrect? (Reply 'Yes' to confirm)`
            : `Infrastructure Update: Recording *${result.data.item}* for ${result.data.customerName} [${label}]. \nValue: ₦${result.data.totalAmount.toLocaleString()} \nCleared: ₦${result.data.paidAmount.toLocaleString()} \nConfirm?`;
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

// Date utilities follow...

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

const sendReply = async (to, text, retryCount = 0) => {
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 3000; // 3 seconds

    try {
        const phoneId = process.env.WHATSAPP_PHONE_ID || process.env.PHONE_ID;
        const accessToken = process.env.WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_TOKEN || process.env.ACCESS_TOKEN;

        if (!accessToken || !phoneId) return false;

        let cleanTo = String(to).replace(/\D/g, ''); 
        if (cleanTo.startsWith('0') && cleanTo.length === 11) {
            cleanTo = '234' + cleanTo.slice(1);
        }

        await axios.post(
            `https://graph.facebook.com/v21.0/${phoneId}/messages`,
            {
                messaging_product: "whatsapp",
                to: cleanTo,
                type: "text",
                text: { body: text, preview_url: true },
            },
            {
                headers: { Authorization: `Bearer ${accessToken}` },
                timeout: 10000 // 10s safety timeout
            }
        );

        logUsage("whatsapp").catch(e => {});
        return true;

    } catch (error) {
        const status = error.response?.status;
        const errorData = error.response?.data;

        // Retry on 429 (Rate Limit) or 500+ (Server Error) or Network Timeout
        const isNetworkError = !status || status >= 500;
        const isRateLimited = status === 429;
        
        if (retryCount < MAX_RETRIES && (isNetworkError || isRateLimited)) {
            const nextDelay = RETRY_DELAY * (retryCount + 1);
            console.warn(`⏳ WhatsApp Delay (Attempt ${retryCount + 1}): Retrying ${to} in ${nextDelay/1000}s...`);
            await new Promise(res => setTimeout(res, nextDelay));
            return await sendReply(to, text, retryCount + 1);
        }

        console.error("❌ WhatsApp Final Failure:", JSON.stringify(errorData || error.message, null, 2));
        return false;
    }
};

const sendTemplateMessage = async (to, templateName, components = [], retryCount = 0) => {
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 3000;

    try {
        const phoneId = process.env.WHATSAPP_PHONE_ID || process.env.PHONE_ID;
        const accessToken = process.env.WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_TOKEN || process.env.ACCESS_TOKEN;

        if (!accessToken || !phoneId) return false;

        let cleanTo = String(to).replace(/\D/g, ''); 
        if (cleanTo.startsWith('0') && cleanTo.length === 11) {
            cleanTo = '234' + cleanTo.slice(1);
        }

        const payload = {
            messaging_product: "whatsapp",
            to: cleanTo,
            type: "template",
            template: {
                name: templateName,
                language: { code: "en" }
            }
        };

        if (components && components.length > 0) {
            payload.template.components = components;
        }

        await axios.post(
            `https://graph.facebook.com/v21.0/${phoneId}/messages`,
            payload,
            {
                headers: { Authorization: `Bearer ${accessToken}` },
                timeout: 10000
            }
        );

        logUsage("whatsapp").catch(e => {});
        return true;

    } catch (error) {
        const status = error.response?.status;
        const errorData = error.response?.data;

        // Retry on 429 (Rate Limit) or 500+ (Server Error) or Network Timeout
        const isNetworkError = !status || status >= 500;
        const isRateLimited = status === 429;
        
        if (retryCount < MAX_RETRIES && (isNetworkError || isRateLimited)) {
            const nextDelay = RETRY_DELAY * (retryCount + 1);
            console.warn(`⏳ WhatsApp Template Delay (Attempt ${retryCount + 1}): Retrying ${to} in ${nextDelay/1000}s...`);
            await new Promise(res => setTimeout(res, nextDelay));
            return await sendTemplateMessage(to, templateName, components, retryCount + 1);
        }

        console.error(`❌ WhatsApp Template [${templateName}] Final Failure:`, JSON.stringify(errorData || error.message, null, 2));
        return false;
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
exports.sendWhatsAppTemplate = sendTemplateMessage;

const sendWhatsAppAlert = async (to, bossTitle, textMessage, invoiceNumber = null) => {
    try {
        const cleanTo = String(to).replace(/\D/g, '');
        
        // Normalize to international format for lookup (try both formats)
        let normalizedTo = cleanTo;
        if (normalizedTo.startsWith('0') && normalizedTo.length === 11) {
            normalizedTo = '234' + normalizedTo.slice(1);
        }

        // 🛡️ COST SAVING: Check if the 24-hour customer service window is open
        // Try multiple number formats since numbers may be stored differently
        const altTo = cleanTo.startsWith('234') ? '0' + cleanTo.slice(3) : null;
        const plusTo = '+' + cleanTo;
        const senderNumber = process.env.WHATSAPP_SENDER_NUMBER || '2347071238658';

        // 🛡️ SELF-MESSAGE PROTECTION: Meta blocks sending to self
        if (cleanTo === senderNumber.replace(/\D/g, '')) {
            console.warn(`🛑 Self-Notification Blocked: Number ${cleanTo} is the SENDER. Cannot send to self.`);
            return false;
        }

        const profile = await BusinessProfile.findOne({ 
            whatsappNumber: { $in: [cleanTo, normalizedTo, to.toString(), altTo, plusTo].filter(Boolean) }
        });
        
        const now = new Date();
        const isWindowOpen = profile?.lastInboundAt && (now - new Date(profile.lastInboundAt)) < (24 * 60 * 60 * 1000);

        if (isWindowOpen) {
            console.log(`💡 WhatsApp Session Open for ${normalizedTo} — Sending free session message`);
            // Format as a bold message with person's title
            let sessionText = `*${bossTitle}!* 🚀\n\n${textMessage}`;
            
            // If invoiceNumber provided but not in text, append it as a link
            if (invoiceNumber && !textMessage.includes(invoiceNumber)) {
                sessionText += `\n\n📄 *Receipt Link:* https://usekredibly.com/r/${invoiceNumber}`;
            }

            return await sendReply(normalizedTo, sessionText);
        }

        // Window Closed or Profile not found: Use official Template (Paid)
        console.log(`🔔 WhatsApp Session Closed for ${normalizedTo} — Sending paid template message`);
        
        // Meta template body parameters are capped at 1024 chars
        const safeMessage = String(textMessage).substring(0, 1024);
        
        const components = [
            {
                type: "body",
                parameters: [
                    { type: "text", text: String(bossTitle).substring(0, 60) },
                    { type: "text", text: safeMessage }
                ]
            }
        ];

        // 🚀 SMART DYNAMIC BUTTON ROUTING
        // Since Meta requires the parameter if the template has a dynamic button, we ALWAYS send one.
        // We configure the Meta template base URL to: https://usekredibly.com/
        // If it's an invoice alert, we append "r/KR-XXXX". If it's generic, we append "dashboard".
        const buttonPath = invoiceNumber ? `r/${invoiceNumber}` : `dashboard`;

        components.push({
            type: "button",
            sub_type: "url",
            index: "0",
            parameters: [
                { type: "text", text: buttonPath }
            ]
        });
        
        // ✅ Use normalizedTo (digits-only international format) for template
        return await sendTemplateMessage(normalizedTo, 'kreddy_system_alert', components);
    } catch (err) {
        console.error("❌ sendWhatsAppAlert Error:", err.message);
        return false;
    }
};

const sendWhatsAppPaymentAlert = async (to, amount, invoiceNumber, customerName, customText, bossTitle = 'Boss', sessionTextMsg = null) => {
    try {
        const cleanTo = String(to).replace(/\D/g, '');
        let normalizedTo = cleanTo;
        if (normalizedTo.startsWith('0') && normalizedTo.length === 11) {
            normalizedTo = '234' + normalizedTo.slice(1);
        }

        const altTo = cleanTo.startsWith('234') ? '0' + cleanTo.slice(3) : null;
        const plusTo = '+' + cleanTo;
        const senderNumber = process.env.WHATSAPP_SENDER_NUMBER || '2347071238658';

        if (cleanTo === senderNumber.replace(/\D/g, '')) {
            console.warn(`🛑 Self-Notification Blocked: Number ${cleanTo} is the SENDER.`);
            return false;
        }

        const profile = await BusinessProfile.findOne({ 
            whatsappNumber: { $in: [cleanTo, normalizedTo, to.toString(), altTo, plusTo].filter(Boolean) }
        });
        
        const now = new Date();
        const isWindowOpen = profile?.lastInboundAt && (now - new Date(profile.lastInboundAt)) < (24 * 60 * 60 * 1000);

        if (isWindowOpen) {
            console.log(`💡 WhatsApp Session Open for ${normalizedTo} — Sending free payment session message`);
            
            let message = sessionTextMsg;
            if (!message) {
                // Formatting it similarly to the template for consistency
                message = `💰 *Payment Received!*\n\nHigh power, ${bossTitle}! You just received a payment of *₦${amount.toLocaleString()}* for Invoice #${invoiceNumber} from *${customerName}*.\n\n${customText}\n\nYour Kredibly ledger has been updated automatically!`;
            }
            
            // Append receipt URL if absent
            if (!message.includes('usekredibly.com/r/')) {
                message += `\n\n📄 *Receipt:* https://usekredibly.com/r/${invoiceNumber}`;
            }

            return await sendReply(normalizedTo, message);
        }

        // Window Closed: Use official Paid Template
        console.log(`🔔 WhatsApp Session Closed for ${normalizedTo} — Sending paid payment template [kreddy_payment_alert]`);

        // 🛡️ Variable Hardening: Ensure no 'undefined' or 'null' hits the Meta API
        const safeAmount = String(amount || '0.00').substring(0, 60);
        const safeInvoice = String(invoiceNumber || 'N/A').substring(0, 60);
        const safeCustomer = String(customerName || 'Valued Customer').substring(0, 60);
        
        // 🛡️ META STRICTNESS FIX: Strip newlines, tabs, and excessive spaces from parameters
        const safeText = String(customText || 'Your payment has been received.')
            .replace(/[\n\r\t]/g, ' ') // Remove newlines and tabs
            .replace(/\s\s+/g, ' ')    // Collapse multiple spaces to one
            .trim()
            .substring(0, 1024);

        const components = [
            {
                type: "body",
                parameters: [
                    { type: "text", text: safeAmount },
                    { type: "text", text: safeInvoice },
                    { type: "text", text: safeCustomer },
                    { type: "text", text: safeText }
                ]
            }
        ];

        // Push button variable blindly to support cases where the merchant adds it.
        components.push({
            type: "button",
            sub_type: "url",
            index: "0",
            parameters: [
                { type: "text", text: safeInvoice }
            ]
        });

        const success = await sendTemplateMessage(normalizedTo, 'kreddy_payment_alert', components);
        if (!success) {
            console.error(`❌ Meta Template rejection for ${normalizedTo}. Check template name and variables.`);
        }
        return success;
    } catch (err) {
        console.error("❌ sendWhatsAppPaymentAlert Error:", err.message);
        return false;
    }
};

exports.sendWhatsAppAlert = sendWhatsAppAlert;
exports.sendWhatsAppPaymentAlert = sendWhatsAppPaymentAlert;

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
        const whatsappProfileName = value?.contacts?.[0]?.profile?.name || "";
        
        console.log(`📩 Message from ${whatsappProfileName} (${from}): "${text}"`);

        // Send Read Receipt (The "Blue Ticks")
        await sendReadReceipt(messageId);
        // Note: Typing indicator is not supported by WhatsApp Cloud API (v15+)
        // await sendTypingIndicator(from);

        if (processedMessages.has(messageId)) return;
        processedMessages.add(messageId);

        const cleanFrom = cleanPhone(from);
        const plusFrom = '+' + cleanFrom;
        const altFrom = cleanFrom.startsWith('234') ? '0' + cleanFrom.slice(3) : null;
        
        // Find profile where either the owner or staff matches this number
        const profile = await BusinessProfile.findOne({ 
            $or: [
                { whatsappNumber: { $in: [cleanFrom, plusFrom, altFrom].filter(Boolean) } },
                { staffNumbers: { $in: [cleanFrom, plusFrom, altFrom].filter(Boolean) } }
            ]
        }).populate("ownerId", "name");

        // 🧠 SMART NAMING LOGIC: Determine how Kreddy should address this user
        // Priority: Preferred Name > Registered Name > WhatsApp Profile Name > Plan Tier > "Boss"
        const resolvedPlan = profile?.plan || "hustler";
        const tierTitle = resolvedPlan === "chairman" ? "Chairman" : (resolvedPlan === "oga" ? "Oga" : "Boss");
        
        // Extract first name from various sources
        const registeredName = profile?.ownerId?.name ? profile.ownerId.name.split(' ')[0] : null;
        const profileName = whatsappProfileName ? whatsappProfileName.split(' ')[0] : null;
        
        const merchantFirstName = registeredName || profileName || tierTitle;
        const bossTitle = profile?.assistantSettings?.preferredName || merchantFirstName;

        if (!profile) {
            // Pre-launch Phase: Force Registration for all unknown numbers
            const APP_URL = process.env.FRONTEND_URL || "https://usekredibly.com";
            const welcomeMsg = `*Welcome to Kredibly (Pre-Launch)!* 🚀\n\nI am *Kreddy*, your new Digital Chief of Staff. I handle your sales records, debtors, and automated invoices directly from this WhatsApp chat!\n\n_I don't recognize your number as a registered merchant yet._ 🧐\n\nTap the link below to create your free account in 30 seconds, and let's get you set up for our May launch: 👇\n\n🔗 *${APP_URL}/signup*`;
            await sendReply(from, welcomeMsg);
            return;
        }

        // 🛡️ COST SAVING: Track the 24-hour window
        profile.lastInboundAt = new Date();
        await profile.save();

        const isStaff = profile.whatsappNumber !== cleanFrom;
        const plan = profile.plan || "hustler";

        // 🛡️ PRE-LAUNCH EXPENSE MANAGEMENT (Capped AI messages)
        const usedMessages = profile.monthlyUsage?.messages || 0;
        const msgLimit = plan === "hustler" ? 50 : 150; // Trial Oga gets more bandwidth

        if (usedMessages >= msgLimit) {
            const limitMsg = `⚠️ *Monthly AI Usage Limit Met*\n\nHigh power, ${bossTitle}! 🚀 You've used up your *${msgLimit}* AI-powered messages for this month.\n\nYou can still record sales & manage your dashboard on the website, but my brain needs a rest! 🧠💤\n\nNeed unlimited Kreddy? Upgrade or check your plan here: ${APP_URL}/pricing`;
            await sendReply(from, limitMsg);
            return;
        }

        const isTrialing = profile.planStatus === 'trialing';
        const isTrialExpired = false; 
        
        console.log(`👤 User: ${cleanFrom} | Plan: ${plan.toUpperCase()} | Demo Used: ${profile.demoMessagesUsed}/30`);
        
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

        let isFirstTime = false;
        if (profile && !profile.isKreddyConnected && !isStaff) {
            profile.isKreddyConnected = true;
            isFirstTime = true;
            await profile.save();
        }

        if (isFirstTime) {
            const planDefaultTitle = plan === "chairman" ? "Chairman" : (plan === "oga" ? "Oga" : "Boss");
            const bossTitleToUse = profile.assistantSettings?.preferredName || whatsappProfileName || planDefaultTitle;
            
            // Initial save of preferred name if found
            if (whatsappProfileName && !profile.assistantSettings?.preferredName) {
                if (!profile.assistantSettings) profile.assistantSettings = {};
                profile.assistantSettings.preferredName = whatsappProfileName;
                await profile.save();
            }

            const introMsg = `🫡 *Connection Successful, ${bossTitleToUse}!* \n\nI am Kreddy, and I am officially clocked in as your Digital Chief of Staff. \n\nI'll call you *${bossTitleToUse}* for now, but you can change this anytime—just say _"Kreddy, call me Boss"_ or any name you prefer! 👑\n\nHere is what you can ask me to do right now:\n\n🎤 *Send a Voice Note:* _"Sarah just bought a bag for 15k, she paid 5k, remind me on Friday to collect the balance."_\n\n📸 *Send a Picture:* Send a pic of a receipt and tell me to log it.\n\n💡 *Ask a Question:* _"What do I have planned for today?"_\n\nTalk to me like a real person. Let's make some money! 💰`;
            await sendReply(from, introMsg);
            
            // If they just said a basic greeting, stop here. Otherwise, keep processing the payload.
            if (["hi", "hello", "hey", "start", "test"].includes(text.toLowerCase())) {
                return;
            }
        }

        await logActivity({
            businessId: profile._id,
            action: "WHATSAPP_MSG_RECEIVED",
            entityType: "WHATSAPP",
            details: `From: ${from} | Msg: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`
        });

        // HUSTLER LIMIT CHECK (10 Sales limit per month)
        if (isHustler && (text.toLowerCase().includes("sold") || text.toLowerCase().includes("selling") || text.toLowerCase().includes("sale") || text.toLowerCase().includes("record"))) {
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0,0,0,0);
            
            const invoiceCount = await Sale.countDocuments({ 
                businessId: profile._id,
                createdAt: { $gte: startOfMonth }
            });

            if (invoiceCount >= 10) {
                return await sendReply(from, `Wow, Chief! 📈 You've reached your free limit of 10 sales/invoices for this month! 

To record unlimited sales, add staff, and unlock Voice Notes, abeg upgrade to the *Oga Plan* now. No time to check time! 🚀 

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
                const { customerName, totalAmount, paidAmount, item, intent, dueDate, invoiceType } = session.data;
                await WhatsAppSession.deleteOne({ _id: session._id });

                if (intent === 'create_sale') {
                    const newSale = new Sale({
                        businessId: profile._id,
                        customerName,
                        description: item,
                        totalAmount,
                        payments: [{ amount: paidAmount || 0, method: "WhatsApp" }],
                        dueDate: dueDate ? new Date(dueDate) : undefined,
                        recordedBy: cleanFrom,
                        invoiceType: invoiceType || 'billing'
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
                    
                    const paymentLink = `${FRONTEND_URL}/i/${newSale.publicSlug || newSale.invoiceNumber}`;
                    const template = newSale.invoiceType === 'record' 
                        ? `Hello ${customerName}, here is your verified digital receipt for the payment of ₦${totalAmount.toLocaleString()} to ${profile.displayName}. View/Download here: ${paymentLink}`
                        : `Hello ${customerName}, this is your official digital invoice from ${profile.displayName} for ₦${totalAmount.toLocaleString()}. You can view and pay securely here: ${paymentLink}`;

                    await sendReply(from, `${successMsg} \n\nI've logged Invoice *#${newSale.invoiceNumber}* for *${customerName}*.\n💰 Status: ${newSale.invoiceType === 'record' ? '*FULLY PAID (Receipt)*' : '*PENDING (Invoice)*'}\n⏳ Balance: ₦${bal.toLocaleString()}\n\n📝 *Draft Message for Customer* (Copy & Send): \n\n_"${template}"_`);
                    
                    return await sendReply(from, `🛡️ *Note:* I didn't send this to them directly to avoid spam. You hold the power, Boss!`);
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
                } else if (session.type === 'recovery_followup') {
                    if (lowerText.includes('yes') || lowerText.includes('y')) {
                        // Ask if full or partial
                        await WhatsAppSession.findOneAndUpdate(
                            { _id: session._id },
                            {
                                type: 'recovery_payment_amount',
                                data: { ...session.data }
                            }
                        );
                        await sendReply(from, `Nice! 💎 Was it the full *₦${session.data.balance.toLocaleString()}* payment, or just a partial amount? \n\n_(Reply *"Full"* or just type the amount they paid)_`);
                    } else {
                        await WhatsAppSession.deleteOne({ _id: session._id });
                        await sendReply(from, `No problem! 🛡️ Shall I resend the link to *${session.data.customerName}* for you, or should we give them another day? \n\n_(Tip: Just say "Send link to ${session.data.customerName}")_`);
                    }
                    return;
                } else if (session.type === 'recovery_payment_amount') {
                    let amountPaid = session.data.balance;
                    const numMatch = lowerText.match(/\d+/);
                    if (numMatch && !lowerText.includes('full')) {
                        amountPaid = parseInt(numMatch[0]);
                    }

                    const sale = await Sale.findById(session.data.saleId);
                    if (sale) {
                        sale.payments.push({
                            amount: amountPaid,
                            date: new Date(),
                            method: "Cash (Outside)",
                            reference: "Logged via WhatsApp Followup"
                        });
                        await sale.save();

                        const newBal = sale.totalAmount - sale.payments.reduce((s, p) => s + p.amount, 0);
                        let msg = `🛡️ *Payment Recorded!* \n\nI've updated the ledger. `;
                        if (newBal > 0) {
                            msg += `*${sale.customerName}* still owes *₦${newBal.toLocaleString()}*. When should I ask about the balance again? 📅`;
                            await WhatsAppSession.findOneAndUpdate(
                                { _id: session._id },
                                {
                                    type: 'due_date_disambiguation',
                                    data: { saleId: sale._id, customerName: sale.customerName }
                                }
                            );
                        } else {
                            msg += `*${sale.customerName}* is now fully paid up! 💎 Dashboard updated.`;
                            await WhatsAppSession.deleteOne({ _id: session._id });
                        }
                        await sendReply(from, msg);
                    }
                    return;
                } else if (session.type === 'intent_clarification') {
                    const isFeedback = lowerText.includes('feedback') || lowerText.includes('suggestion') || lowerText.includes('idea') || lowerText.includes('admin');
                    const isTask = lowerText.includes('reminder') || lowerText.includes('task') || lowerText.includes('debt') || lowerText.includes('delete') || lowerText.includes('sale') || lowerText.includes('record');

                    if (isFeedback) {
                        const feedbackMsgText = session.data.originalText;
                        await Feedback.create({
                            userId: profile.ownerId,
                            businessId: profile._id,
                            whatsappNumber: cleanFrom,
                            message: feedbackMsgText,
                            category: "Confirmed Suggestion via WhatsApp"
                        });
                        await WhatsAppSession.deleteOne({ _id: session._id });
                        await sendReply(from, `✅ *Feedback Logged!* \n\nGot it, ${bossTitle}. I've sent that suggestion directly to the Dev Team. Thanks for helping us build Kredibly! 🛡️🚀`);
                    } else if (isTask) {
                        await WhatsAppSession.deleteOne({ _id: session._id });
                        await sendReply(from, `🛡️ *Understood, Boss!* \n\nI catch that it's a core task. Please just say it again or send a new voice note so I can process it with 100% focus! 🫡`);
                    } else {
                        await sendReply(from, `🤔 I catch you, but I'm still not sure. \n\nReply *"Feedback"* to send it to the Admin, or *"Task"* if I should treat it as a reminder/record. 🛡️`);
                    }
                    return;
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
                        
                        if (sale) {
                            // Focus on DRAFTING only (Per strategic update)
                            const paymentLink = `${FRONTEND_URL}/i/${sale.publicSlug || sale.invoiceNumber}`;
                            const nudgeDraft = `Hi ${customerName}, this is a friendly nudge from ${profile.displayName} regarding your balance of ₦${(sale.totalAmount - sale.paidAmount).toLocaleString()} for ${sale.description}. You can view the details and pay securely here: ${paymentLink}`;
                            
                            return await sendReply(from, `📝 *Draft Reminder for ${customerName}* (Copy & Send): \n\n_"${nudgeDraft}"_ \n\n🛡️ *Kreddy Tip:* Personal messages from you convert 4x better than automated ones!`);
                        } else {
                            return await sendReply(from, `🤔 I couldn't locate that record anymore. It might have been deleted.`);
                        }
                    }
                } else if (session.type === 'alias_confirmation') {
                    if (['yes', 'y', 'correct', 'confirm'].includes(lowerText)) {
                        const { saleId, sourceName, customerName, paidAmount } = session.data;
                        await WhatsAppSession.deleteOne({ _id: session._id });

                        const sale = await Sale.findById(saleId);
                        if (sale) {
                            sale.payments.push({ amount: paidAmount, method: "WhatsApp Screenshot (Confirmed Alias)" });
                            await sale.save();

                            // 🧠 LEARN: Save this alias for the future
                            if (sourceName) {
                                await CustomerAlias.findOneAndUpdate(
                                    { businessId: profile._id, sourceName },
                                    { targetName: customerName, lastUsedAt: new Date() },
                                    { upsert: true, new: true }
                                );
                            }

                            await sendReply(from, `✅ *Logged & Learned!* \n\nRecorded for *${customerName}*. I've also memorized that *"${sourceName}"* is one of their account names! 🛡️💎`);
                        }
                    } else {
                        await WhatsAppSession.deleteOne({ _id: session._id });
                        await sendReply(from, `No problem! I'll keep the payment as pending. Tell me who it belongs to whenever you're ready! 🫡`);
                    }
                    return;
                } else if (session.type === 'manual_alias_tagging') {
                    const choice = parseInt(text);
                    let selectedSale = null;
                    
                    if (!isNaN(choice) && session.data.options && choice > 0 && choice <= session.data.options.length) {
                        selectedSale = await Sale.findById(session.data.options[choice - 1].id);
                    } else if (text.length > 2) {
                        selectedSale = await Sale.findOne({ 
                            businessId: profile._id, 
                            customerName: { $regex: new RegExp(text.trim(), "i") },
                            status: { $ne: "paid" }
                        });
                    }

                    if (selectedSale) {
                        const { sourceName, paidAmount } = session.data;
                        await WhatsAppSession.deleteOne({ _id: session._id });

                        selectedSale.payments.push({ amount: paidAmount, method: "WhatsApp Screenshot (Manual Tag)" });
                        await selectedSale.save();

                        if (sourceName) {
                            await CustomerAlias.findOneAndUpdate(
                                { businessId: profile._id, sourceName },
                                { targetName: selectedSale.customerName, lastUsedAt: new Date() },
                                { upsert: true, new: true }
                            );
                        }

                        await sendReply(from, `✅ *Perfectly Handled!* \n\nI've credited *${selectedSale.customerName}* with the ₦${paidAmount.toLocaleString()} payment. \n\nMemory Bank Updated: I've linked *"${sourceName}"* to them! 🧠💎`);
                    } else {
                        await sendReply(from, `🤔 I didn't catch that. Please type the **Number** or the **Customer Name** to credit this payment.`);
                    }
                    return;
                }
            }
        }

        // ROUTER: Keywords that trigger instant responses without AI
        const entityLabel = profile.entityType === 'business' ? 'Business' : 'Hustle';
        const isGreeting = /^hi|^hello|^hey|^h\b|^yo\b|kreddy/i.test(lowerText);
        const isThanks = /thanks|thank you|merci|jazak|nice/i.test(lowerText);
        
        if (isGreeting && lowerText.split(' ').length <= 3) {
            const planDefaultTitle = plan === "chairman" ? "Chairman" : (plan === "oga" ? "Oga" : "Boss");
            const bossTitle = profile.assistantSettings?.preferredName || planDefaultTitle;
            
            const wittyGreeting = await generateWittyIntro("greeting", { bossTitle });
            const statusLabel = plan === "chairman" ? "📊 *EMPIRE STATUS*" : "📊 *STATS*";
            const bossRole = plan === "chairman" ? "your Digital Chief of Staff" : "your Kredibly partner";

            await sendReply(from, `${wittyGreeting} \n\nI'm *Kreddy*, ${bossRole}. \n\n*What's the plan for today?*\n${statusLabel}: Type *S*\n⏳ *DEBTS*: Type *D*\n💡 *HELP*: Type *HELP*`);
            return;
        } else if (isThanks) {
            const planDefaultTitle = plan === "chairman" ? "Chairman" : (plan === "oga" ? "Oga" : "Boss");
            const bossTitle = profile.assistantSettings?.preferredName || planDefaultTitle;
            
            await sendReply(from, `You're very welcome, ${bossTitle}! 🫡 Always happy to keep your records straight. Let me know if you need anything else!`);
            return;        } else {
            // 🔒 SECURITY & COST CHECK: Enforce AI Message Limits (Monthly Reset)
            const msgLimit = plan === "hustler" ? 50 : 150;
            const currentUsage = profile.monthlyUsage?.messages || 0;

            if (currentUsage >= msgLimit) {
                const bossTitle = profile.assistantSettings?.preferredName || (plan === "chairman" ? "Chairman" : (plan === "oga" ? "Oga" : "Boss"));
                const upgradePlan = plan === "hustler" ? "Oga" : "Chairman";
                const upgradeLink = `https://usekredibly.com/settings`;
                
                let limitMsg = `⚠️ *Brain Overload, ${bossTitle}!* \n\nI've used up my monthly AI brainpower for your current plan (Limit: ${msgLimit} messages). \n\nUpgrade to the *${upgradePlan} Plan* now to get *UNLIMITED* access and keep your records sharp! 🦁\n\n🔗 *Upgrade Here:* ${upgradeLink}`;
                if (plan !== "hustler") {
                     limitMsg = `🚀 *Limit Reached, ${bossTitle}!* \n\nYou've hit your 150-message monthly quota. This is amazing growth! To continue using my AI for unlimited insights, click here to refresh your subscription or move to *Chairman Priority*: ${upgradeLink}`;
                }

                return await sendReply(from, limitMsg);
            }

            // 🧠 100% AI-DRIVEN PIPELINE
            const session = await WhatsAppSession.findOne({ whatsappNumber: cleanFrom });
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

                const planDefaultTitle = plan === "chairman" ? "Chairman" : "Oga";
                const bossTitle = profile.assistantSettings?.preferredName || planDefaultTitle;

                await sendReply(from, `${bossTitle}, I catch the voice note! 💎 Analyzing it now... 🎧`);
                const media = await downloadWhatsAppMedia(mediaId);
                
                if (media) {
                    aiResponse = await processAudioWithAI(media.buffer, media.mimeType, {
                        merchantName: profile.assistantSettings?.preferredName || profile.displayName,
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

                const planDefaultTitle = plan === "chairman" ? "Chairman" : "Oga";
                const bossTitle = profile.assistantSettings?.preferredName || planDefaultTitle;

                await sendReply(from, `${bossTitle}, I catch the image! 💎 Scanning it now... 🔍`);
                const media = await downloadWhatsAppMedia(mediaId);
                
                if (media) {
                    aiResponse = await processImageWithAI(media.buffer, media.mimeType, {
                        merchantName: profile.assistantSettings?.preferredName || profile.displayName,
                        plan: plan,
                        entityType: profile.entityType,
                        preferredTone: profile.assistantSettings?.reminderTemplate || "friendly",
                        debtors: debtorContext || "No active debtors yet."
                    });

                    if (aiResponse) {
                        profile.monthlyUsage.images = (profile.monthlyUsage.images || 0) + 1;
                        profile.monthlyUsage.messages = (profile.monthlyUsage.messages || 0) + 1;
                        await profile.save();
                    }
                }

                if (!aiResponse) {
                    return await sendReply(from, "Chairman, my brain logic failed to read that image clearly. 😵‍ Please try again or type it for now.");
                }
            } else {
                console.log(`💎 Plan: ${plan.toUpperCase()} (Using Gemini AI)`);
                aiResponse = await processMessageWithAI(text, { 
                    merchantName: profile.assistantSettings?.preferredName || profile.displayName,
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
                        preferredName: profile.assistantSettings?.preferredName || "",
                        currentSession: session || null 
                    });

                    // Add hint if Gemini explicitly told us it's rate-limited
                    if (isExplicitFallback && aiResponse.data) {
                        aiResponse.data.reply = `(AI is sleeping 💤) ` + aiResponse.data.reply;
                    }
                } else {
                    console.log(`🤖 AI Result: Intent=${aiResponse.intent}, Confidence=${aiResponse.confidence}`);
                    profile.monthlyUsage.messages = (profile.monthlyUsage.messages || 0) + 1;
                    await profile.save();
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
                 
                 if (session?.data?.lastSaleId && (aiResponseItem.data.paidAmount > 0 || aiResponseItem.data.dueDate || aiResponseItem.data.newName)) {
                     const sale = await Sale.findById(session.data.lastSaleId);
                     if (sale && sale.status !== 'paid') {
                         let updatedConfirm = `I've updated the record for *${sale.customerName}*.`;
                         
                         if (aiResponseItem.data.paidAmount > 0) sale.payments.push({ amount: aiResponseItem.data.paidAmount, method: "WhatsApp Context Update" });
                         if (aiResponseItem.data.dueDate) sale.dueDate = new Date(aiResponseItem.data.dueDate);
                         if (aiResponseItem.data.newName) {
                             const oldN = sale.customerName;
                             sale.customerName = aiResponseItem.data.newName;
                             updatedConfirm = `✅ *Name Correction:* Changed from *${oldN}* to *${sale.customerName}*. Invoice updated. 🛡️`;
                             
                             // SYNC-RENAME: Update ALL pending reminders for this business matching the old name in description
                             try {
                                 const pendingRems = await Reminder.find({ 
                                     businessId: profile._id, 
                                     status: 'pending',
                                     description: { $regex: new RegExp(oldN.replace(/\s+/g, '\\s+'), "gi") }
                                 });
                                 for (const r of pendingRems) {
                                     r.description = r.description.replace(new RegExp(oldN, "gi"), sale.customerName);
                                     await r.save();
                                 }
                             } catch (err) { console.error("Sync Rename Error:", err); }
                         }
                         
                         await sale.save();
                         await sendReply(from, `✅ *Record Updated!* \n\n${updatedConfirm}`);
                         isProcessed = true;
                     }
                 } 
                 
                 if (!isProcessed && aiResponseItem.data.customerName && aiResponseItem.data.customerName !== "Customer") {
                     const searchName = aiResponseItem.data.customerName.replace(/\s+/g, '\\s+');
                     let matches = await Sale.find({ 
                        businessId: profile._id, 
                        customerName: { $regex: new RegExp(`^${searchName}$`, "i") },
                        status: { $ne: "paid" }
                     });

                     // If no exact match, try broad matching (contains) for easier corrections
                     if (matches.length === 0) {
                        matches = await Sale.find({ 
                            businessId: profile._id, 
                            customerName: { $regex: new RegExp(searchName, "i") },
                            status: { $ne: "paid" }
                        });
                     }

                     if (matches.length === 1) {
                        const sale = matches[0];
                        if (aiResponseItem.data.paidAmount > 0) sale.payments.push({ amount: aiResponseItem.data.paidAmount, method: "WhatsApp Global Update" });
                        if (aiResponseItem.data.dueDate) sale.dueDate = new Date(aiResponseItem.data.dueDate);
                        
                        // Check for Name Correction
                        if (aiResponseItem.data.newName) {
                           const oldN = sale.customerName;
                           sale.customerName = aiResponseItem.data.newName;
                           await sale.save();
                           
                           // SYNC-RENAME: Update pending reminders for this sale
                           try {
                               const pendingRems = await Reminder.find({ 
                                    businessId: profile._id, 
                                    status: 'pending',
                                    description: { $regex: new RegExp(oldN.replace(/\s+/g, '\\s+'), "gi") }
                               });
                               for (const r of pendingRems) {
                                   r.description = r.description.replace(new RegExp(oldN, "gi"), sale.customerName);
                                   await r.save();
                               }
                           } catch (err) { console.error("Sync Global Rename Error:", err); }

                           await sendReply(from, `✅ *Update Successful!* \n\nChanged from *${oldN}* to *${sale.customerName}*. Receipt updated. 🛡️`);
                        } else {
                           await sale.save();
                           await sendReply(from, `✅ *Update Successful!* \n\nRecorded for *${sale.customerName}*. Receipt updated. 🛡️`);
                        }
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

                 if (!isProcessed && aiResponseItem.intent === "update_record" && aiResponseItem.sourceAccountName && plan === 'chairman') {
                    const escapedSource = aiResponseItem.sourceAccountName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    const aliasMatch = await CustomerAlias.findOne({
                        businessId: profile._id,
                        sourceName: { $regex: new RegExp(`^${escapedSource}$`, "i") }
                    });

                    if (aliasMatch) {
                        console.log(`🧠 Alias found: ${aiResponseItem.sourceAccountName} -> ${aliasMatch.targetName}`);
                        aiResponseItem.data.customerName = aliasMatch.targetName;
                        // Trigger re-run of this intent with the correct name
                        const escapedTarget = aliasMatch.targetName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                        const sale = await Sale.findOne({ businessId: profile._id, customerName: { $regex: new RegExp(`^${escapedTarget}$`, "i") }, status: { $ne: "paid" } });
                        if (sale) {
                            if (aiResponseItem.data.paidAmount > 0) sale.payments.push({ amount: aiResponseItem.data.paidAmount, method: "WhatsApp Alias Match" });
                            await sale.save();
                            await sendReply(from, `✅ *Payment Recorded (Alias Match)!* \n\nI recognized the account name *"${aiResponseItem.sourceAccountName}"* as *${sale.customerName}*. Record updated! 🛡️`);
                            isProcessed = true;
                        }
                    } else if (aiResponseItem.data.paidAmount > 0) {
                        // 🧐 SMART TRIAGE: Search by Amount if name is mystery
                        const potentialSales = await Sale.find({
                            businessId: profile._id,
                            status: { $ne: "paid" }
                        }).sort({ createdAt: -1 });

                        const filteredByAmount = potentialSales.filter(s => {
                            const balance = s.totalAmount - s.payments.reduce((sum, p) => sum + p.amount, 0);
                            return balance === aiResponseItem.data.paidAmount;
                        });

                        if (filteredByAmount.length === 1) {
                            const sale = filteredByAmount[0];
                            await WhatsAppSession.findOneAndUpdate(
                                { whatsappNumber: cleanFrom },
                                {
                                    type: 'alias_confirmation',
                                    data: {
                                        saleId: sale._id,
                                        customerName: sale.customerName,
                                        sourceName: aiResponseItem.sourceAccountName,
                                        paidAmount: aiResponseItem.data.paidAmount
                                    },
                                    expiresAt: new Date(Date.now() + 5 * 60 * 1000)
                                },
                                { upsert: true }
                            );
                            await sendReply(from, `🧐 *Smart Match Detected, ${bossTitle}!* \n\nI catch a ₦${aiResponseItem.data.paidAmount.toLocaleString()} transfer from *"${aiResponseItem.sourceAccountName}"*. \n\nI don't have that name, but *${sale.customerName}* owes that exact amount. Is this for her? 🛡️`);
                            isProcessed = true;
                        } else if (potentialSales.length > 0) {
                            // Manual Tagging Request
                            let msg = `🧐 *Mystery Payment Detected, ${bossTitle}!* \n\nI catch the ₦${aiResponseItem.data.paidAmount.toLocaleString()} transfer from *"${aiResponseItem.sourceAccountName}"*, but I don't recognize the name. \n\nWho should I credit this to?\n\n`;
                            potentialSales.slice(0, 5).forEach((s, i) => {
                                const bal = s.totalAmount - s.payments.reduce((sum,p)=>sum+p.amount, 0);
                                msg += `${i+1}. *${s.customerName}* (Owes ₦${bal.toLocaleString()})\n`;
                            });
                            msg += `\n_Reply with the Number (1-5) or Name!_ 🫡`;

                            await WhatsAppSession.findOneAndUpdate(
                                { whatsappNumber: cleanFrom },
                                {
                                    type: 'manual_alias_tagging',
                                    data: {
                                        sourceName: aiResponseItem.sourceAccountName,
                                        paidAmount: aiResponseItem.data.paidAmount,
                                        options: potentialSales.slice(0, 5).map(s => ({ id: s._id, name: s.customerName }))
                                    },
                                    expiresAt: new Date(Date.now() + 5 * 60 * 1000)
                                },
                                { upsert: true }
                            );
                            await sendReply(from, msg);
                            isProcessed = true;
                        }
                    }
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

                const wittyIntro = await generateWittyIntro("create_sale", { bossTitle, extra: `₦${totalAmount.toLocaleString()} to ${newSale.customerName}` });
                let reply = `✅ *Record Saved!* (#${newSale.invoiceNumber})\n\n${wittyIntro}\n`;
                if (bal > 0) reply += `\n⏳ They still owe you *₦${bal.toLocaleString()}*`;
                else reply += `\n✅ *Fully Paid!*`;

                // 📢 HUSTLER NUDGE
                if (plan === "hustler" || !plan) {
                    reply += `\n\n_P.S. Upgrade to Oga so I can keep sending your reports here even when you are away! 🛡️_`;
                }
                
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
                if (aiResponseItem && aiResponseItem.intent === "set_preferred_name") {
                    const newName = aiResponseItem.data.preferredName;
                    if (newName) {
                        if (!profile.assistantSettings) profile.assistantSettings = {};
                        profile.assistantSettings.preferredName = newName;
                        await profile.save();
                        
                        let reply = aiResponseItem.data.reply || `Got it, *${newName}*! 🫡 I'll call you that from now on.`;
                        
                        await sendReply(from, reply);
                    } else {
                        await sendReply(from, "I catch that you want me to call you something else, but I didn't get the name clearly. 😵‍ Try say: _'Kreddy, call me Boss'_");
                    }
                    isProcessed = true;
                } else if (aiResponseItem && aiResponseItem.intent === "check_debt") {
                    const searchName = (aiResponseItem.data.customerName || "").trim();
                    
                    if (!searchName || searchName.toLowerCase() === "customer") {
                        const sales = await Sale.find({ businessId: profile._id });
                        let debtLines = "";
                        let count = 0;
                        sales.forEach(s => {
                            const bal = s.totalAmount - s.payments.reduce((sum, p) => sum + p.amount, 0);
                            if (bal > 0) {
                                debtLines += `• *${s.customerName}*: ₦${bal.toLocaleString()} (#${s.invoiceNumber})\n`;
                                count++;
                            }
                        });

                        if (count === 0) {
                            return await sendReply(from, `🎉 Amazing, ${bossTitle}! Nobody owes you any money right now. Your ledger is 100% clean!`);
                        }

                        const wittyIntro = await generateWittyIntro("check_debt", { bossTitle, extra: `Found ${count} debtors` });
                        let msg = `${wittyIntro}\n\n⏳ *Outstanding Balances:*\n\n${debtLines}`;
                        await sendReply(from, msg);
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
                            await sendReply(from, msg2);
                        }
                    }
                    isProcessed = true;
                } else if (aiResponseItem && aiResponseItem.intent === "list_sales") {
                    // 📜 FULL HISTORY: Show all sales, categorized
                    const sales = await Sale.find({ businessId: profile._id }).sort({ createdAt: -1 }).limit(15);
                    
                    if (sales.length === 0) {
                        await sendReply(from, "Boss, the records are empty! Let's record your first sale today. 🚀");
                    } else {
                        const wittyIntro = await generateWittyIntro("list_sales", { bossTitle, extra: `Last 15 records` });
                        let msg = `${wittyIntro}\n\n`;
                        
                        sales.forEach((s, i) => {
                            const bal = s.totalAmount - s.payments.reduce((sum, p) => sum + p.amount, 0);
                            const status = bal <= 0 ? "✅ Paid" : `⏳ Owes ₦${bal.toLocaleString()}`;
                            msg += `${i+1}. *${s.customerName}* - ₦${s.totalAmount.toLocaleString()}\n   (${status})\n\n`;
                        });
                        
                        await sendReply(from, msg);
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
                        await sendReply(from, `📝 *Draft for ${sale.customerName}:* (Copy the message below to forward it) 🚀`);
                        await sendReply(from, draft);
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
                    
                    if (profile.hasUsedTrial) {
                        const upgradeUrl = `${process.env.FRONTEND_URL || 'https://usekredibly.com'}/pricing`;
                        await sendReply(from, `💎 *${bossTitle}, want to Level Up?* \n\nYour free trial is over, but you can still upgrade to **OGA** or **CHAIRMAN** here: ${upgradeUrl}\n\nLet's get your business to the next level! 🚀`);
                    } else {
                        const trialMsg = `💎 *${bossTitle}, want to unlock my full brain?* \n\nYou can now try our **CHAIRMAN** powers for **7 Days FREE**! 🚀\n\n🎁 *Launch Special:* 50% OFF for your first few months. \n\n*Choose how to activate:* \n1️⃣ **CARD (Recommended):** ₦50 verification. Enables auto-billing on Day 8. \n2️⃣ **TRANSFER:** ₦500 deposit. Held as wallet credit for your first month. \n\nJust say _"Activate Chairman Trial"_ to start! 🛡️`;
                        await sendReply(from, trialMsg);
                    }
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
                                    await sendReply(from, `Chief ${bossTitle}! 📈 You've used your 5 free Task Reminders for this month. 👏 \n\nUpgrade to the *Oga Plan* for just ₦5,000 to get 60 reminders and unlock Voice Notes! 🚀`);
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

                                if (!profile.monthlyUsage) profile.monthlyUsage = { reminders: 0, voiceNotes: 0, images: 0, lastReset: new Date() };
                                profile.monthlyUsage.reminders = usedReminders + 1;
                                await profile.save();

                                const recLabel = recurrence !== 'none' ? ` (${recurrence} repeat)` : "";

                                // SMART NOTIFICATION LOGIC: Dual-Reminders for Meetings
                                if (reminderType === "meeting" || reminderType === "personal") {
                                    const eventTimeStr = triggerDate.toLocaleString('en-NG', { timeZone: 'Africa/Lagos', weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
                                    
                                    // 1. The On-Time Reminder
                                    await Reminder.create({
                                        businessId: profile._id,
                                        whatsappNumber: cleanFrom,
                                        description: `🚀 *START NOW:* ${taskDescription}`,
                                        triggerDate: new Date(triggerDate),
                                        type: reminderType,
                                        recurrence: recurrence,
                                        saleId: linkedSaleId
                                    });

                                    // 2. The 15-Minute Heads-Up
                                    const nudgeDate = new Date(triggerDate.getTime() - 15 * 60 * 1000);
                                    if (nudgeDate > new Date()) {
                                        await Reminder.create({
                                            businessId: profile._id,
                                            whatsappNumber: cleanFrom,
                                            description: `🔔 *HEADS UP (15m):* ${taskDescription}`,
                                            triggerDate: nudgeDate,
                                            type: reminderType,
                                            recurrence: recurrence,
                                            saleId: linkedSaleId
                                        });
                                        const nudgeTime = nudgeDate.toLocaleString('en-NG', { timeZone: 'Africa/Lagos', hour: '2-digit', minute: '2-digit', hour12: true });
                                        await sendReply(from, `🫡 *Locked in!* \n\nI'll remind you to *"${taskDescription}"* at *${eventTimeStr}*${recLabel}. I'll also give you a heads-up 15 mins early (at *${nudgeTime}*). 🚀 \n\n${(plan === "hustler" || !plan) ? "_Tip: Upgrade to Oga for instant WhatsApp alerts everywhere! 🛡️_" : ""}`);
                                    } else {
                                        await sendReply(from, `✅ *Task Saved!* \n\nI will remind you to *"${taskDescription}"* at exactly *${eventTimeStr}*${recLabel}. (Too close for a 15m heads-up!) 🫡 \n\n${(plan === "hustler" || !plan) ? "_Tip: Upgrade to Oga for instant WhatsApp alerts everywhere! 🛡️_" : ""}`);
                                    }
                                } else {
                                    // Tasks and Debts: Exact Match
                                    await Reminder.create({
                                        businessId: profile._id,
                                        whatsappNumber: cleanFrom,
                                        description: taskDescription,
                                        triggerDate: triggerDate,
                                        type: reminderType,
                                        recurrence: recurrence,
                                        saleId: linkedSaleId
                                    });

                                    // NEW: If it's a debt reminder linked to a sale, sync the sale's dueDate
                                    if (reminderType === "debt" && linkedSaleId) {
                                        const sale = await Sale.findById(linkedSaleId);
                                        if (sale && (!sale.dueDate || sale.dueDate < triggerDate)) {
                                            sale.dueDate = triggerDate;
                                            await sale.save();
                                        }
                                    }

                                    const FriendlyDate = triggerDate.toLocaleString('en-NG', { timeZone: 'Africa/Lagos', weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
                                    
                                    let successMsg = `✅ *Task Saved!* \n\nI will remind you to *"${taskDescription}"* at exactly *${FriendlyDate}*${recLabel}. 🫡`;
                                    
                                    if (plan === "hustler" || !plan) {
                                        successMsg += `\n\n🛡️ *Plan Note:* Since you're on the Hustler plan, I'll send this reminder to your **Email** at the set time. Upgrade to Oga for instant WhatsApp alerts! 🚀`;
                                    }

                                    await sendReply(from, successMsg);
                                }
                            }
                        }
                    }
                    isProcessed = true;
                } else if (aiResponseItem && aiResponseItem.intent === "snooze_reminder") {
                    const data = aiResponseItem.data || {};
                    const reminderDateStr = data.reminderDate || aiResponseItem.reminderDate;
                    const snoozeMins = data.snoozeDuration || 30;
                    const snoozeAll = data.snoozeAll || false;
                    
                    const taskTarget = data.taskTarget || "";

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

                            const friendly = newTriggerDate.toLocaleString('en-NG', { hour: '2-digit', minute: '2-digit', hour12: true });
                            await sendReply(from, `Understood, ${bossTitle}! 😴 I've snoozed ALL *${remindersToSnooze.length}* tasks until *${friendly}*. talk soon!`);
                        } else {
                            await sendReply(from, `I don't see any active tasks to snooze right now, ${bossTitle}.`);
                        }
                    } else {
                        let filter = {
                            whatsappNumber: cleanFrom,
                            status: { $in: ["delivered", "pending"] }
                        };
                        
                        // If AI extracted a specific task to target
                        if (taskTarget && taskTarget.toLowerCase() !== "task") {
                            filter.description = { $regex: new RegExp(taskTarget, "i") };
                        } else {
                            // Default behavior: just the last handled one
                            filter.status = "delivered";
                        }

                        const targetReminders = await Reminder.find(filter).sort({ updatedAt: -1 }).limit(1);

                        if (targetReminders.length > 0) {
                            const targetReminder = targetReminders[0];
                            let newTriggerDate;
                            let displayMsg;

                            if (reminderDateStr) {
                                newTriggerDate = new Date(reminderDateStr);
                                if (isNaN(newTriggerDate.getTime())) {
                                    newTriggerDate = new Date(Date.now() + 30 * 60000);
                                    displayMsg = "I couldn't catch the exact time, so I've snoozed it for 30 minutes. 😴";
                                } else {
                                    const friendly = newTriggerDate.toLocaleString('en-NG', { timeZone: 'Africa/Lagos', weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
                                    displayMsg = `I've snoozed that until *${friendly}*. 🫡`;
                                }
                            } else {
                                newTriggerDate = new Date(Date.now() + snoozeMins * 60000);
                                displayMsg = `I've snoozed that for ${snoozeMins} minutes. 🫡`;
                            }

                            targetReminder.triggerDate = newTriggerDate;
                            targetReminder.status = "pending";
                            targetReminder.snoozeCount += 1;
                            await targetReminder.save();
                            await sendReply(from, `Understood, ${bossTitle}! 😴 ${displayMsg}`);
                        } else {
                            await sendReply(from, `I'm not sure which reminder you want to snooze, ${bossTitle}. I couldn't find a task matching that description.`);
                        }
                    }
                    isProcessed = true;
                } else if (aiResponseItem && aiResponseItem.intent === "check_schedule") {
                    // 📋 NEW: CHECK SCHEDULE - Show user their pending reminders/tasks
                    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
                    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
                    
                    const todayReminders = await Reminder.find({
                        businessId: profile._id,
                        status: "pending",
                        triggerDate: { $gte: todayStart, $lte: todayEnd }
                    }).sort({ triggerDate: 1 }).populate('saleId');

                    const upcomingReminders = await Reminder.find({
                        businessId: profile._id,
                        status: "pending",
                        triggerDate: { $gt: todayEnd }
                    }).sort({ triggerDate: 1 }).limit(5).populate('saleId');

                    let scheduleMsg = `📋 *Your Schedule, ${bossTitle}!*\n\n`;
                    
                    if (todayReminders.length > 0) {
                        const tasks = todayReminders.filter(r => r.type !== 'debt');
                        const debtCalls = todayReminders.filter(r => r.type === 'debt');

                        if (tasks.length > 0) {
                            scheduleMsg += `🗓️ *Meetings & Tasks Today:*\n`;
                            tasks.forEach(r => {
                                const time = r.triggerDate.toLocaleTimeString('en-NG', { timeZone: 'Africa/Lagos', hour: '2-digit', minute: '2-digit', hour12: true });
                                const icon = r.type === 'meeting' ? '📅' : (r.type === 'personal' ? '🏋️' : '📌');
                                scheduleMsg += `${icon} *${time}* — ${r.description}\n`;
                            });
                            scheduleMsg += `\n`;
                        }

                        if (debtCalls.length > 0) {
                            scheduleMsg += `💰 *Collection Calls Today:*\n`;
                            for (const r of debtCalls) {
                                const time = r.triggerDate.toLocaleTimeString('en-NG', { timeZone: 'Africa/Lagos', hour: '2-digit', minute: '2-digit', hour12: true });
                                let displayDesc = r.description;
                                
                                // Late-Link Sync: Try to get latest data from Sale
                                let sale = r.saleId;
                                if (!sale && r.type === 'debt') {
                                    // Try fuzzy match on the fly if not linked
                                    const rawName = r.description.replace(/^Call\s+/i, '').split(/\s+for\s+/i)[0].trim();
                                    if (rawName) {
                                        sale = await Sale.findOne({ 
                                            businessId: profile._id, 
                                            customerName: { $regex: new RegExp(rawName.replace(/\s+/g, '\\s+'), "i") },
                                            status: { $ne: 'paid' }
                                        }).sort({ updatedAt: -1 });
                                    }
                                }

                                if (sale) {
                                    const balance = sale.totalAmount - sale.payments.reduce((s,p)=>s+p.amount, 0);
                                    displayDesc = `Call *${sale.customerName}* for the ₦${balance.toLocaleString()} balance`;
                                }
                                scheduleMsg += `☎️ *${time}* — ${displayDesc}\n`;
                            }
                            scheduleMsg += `\n`;
                        }
                    } else {
                        scheduleMsg += `🗓️ *Today:* Nothing scheduled yet!\n\n`;
                    }

                    if (upcomingReminders.length > 0) {
                        scheduleMsg += `📆 *Coming Up:*\n`;
                        for (const r of upcomingReminders) {
                            const date = r.triggerDate.toLocaleString('en-NG', { timeZone: 'Africa/Lagos', weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
                            let displayDesc = r.description;
                            
                            // Late-Link Sync: Try to get latest data from Sale
                            let sale = r.saleId;
                            if (!sale && r.type === 'debt') {
                                const rawName = r.description.replace(/^Call\s+/i, '').split(/\s+for\s+/i)[0].trim();
                                if (rawName) {
                                    sale = await Sale.findOne({ 
                                        businessId: profile._id, 
                                        customerName: { $regex: new RegExp(rawName.replace(/\s+/g, '\\s+'), "i") },
                                        status: { $ne: 'paid' }
                                    }).sort({ updatedAt: -1 });
                                }
                            }

                            if (sale) {
                                const balance = sale.totalAmount - sale.payments.reduce((s,p)=>s+p.amount, 0);
                                displayDesc = `Call *${sale.customerName}* for the ₦${balance.toLocaleString()} balance`;
                            }
                            scheduleMsg += `* ${displayDesc} — ${date}\n`;
                        }
                    }

                    scheduleMsg += `\n_To add a task, say: "Remind me to [task] by [time]"_ 💡`;
                    await sendReply(from, scheduleMsg);
                    isProcessed = true;
                } else if (aiResponseItem && aiResponseItem.intent === "check_performance") {
                    // 💰 NEW: PERFORMANCE CHECK - "How much did I make today?"
                    const startOfToday = new Date();
                    startOfToday.setHours(0, 0, 0, 0);

                    // 1. Get Today's Sales
                    const salesToday = await Sale.find({
                        businessId: profile._id,
                        createdAt: { $gte: startOfToday }
                    });

                    // 2. Get Today's Cash Collected (Verified + Manual)
                    const salesWithPaymentsToday = await Sale.find({
                        businessId: profile._id,
                        "payments.date": { $gte: startOfToday }
                    });

                    let totalCashIn = 0;
                    salesWithPaymentsToday.forEach(s => {
                        s.payments.forEach(p => {
                            if (new Date(p.date) >= startOfToday) totalCashIn += p.amount;
                        });
                    });

                    // 3. Resolve boss title
                    const bossTitle = profile.assistantSettings?.preferredName || (plan === "chairman" ? "Chairman" : (plan === "oga" ? "Oga" : "Boss"));

                    let performanceMsg = `📊 *Today's Performance, ${bossTitle}!*\n\n`;
                    performanceMsg += `💰 Cash Collected: *₦${totalCashIn.toLocaleString()}*\n`;
                    performanceMsg += `📑 New Invoices: *${salesToday.length}* (₦${salesToday.reduce((sum, s) => sum + s.totalAmount, 0).toLocaleString()})\n\n`;

                    if (totalCashIn > 0) {
                        performanceMsg += `Excellent! Your cash position is looking stronger. 💎`;
                    } else if (salesToday.length > 0) {
                        performanceMsg += `Sales are moving! Let's ensure these turn into cash soon. 🛡️`;
                    } else {
                        performanceMsg += `Zero records so far today. Remember to log every kobo to build your Trust Score! 🚀`;
                    }

                    await sendReply(from, performanceMsg);
                    isProcessed = true;
                } else if (aiResponseItem && aiResponseItem.intent === "pay_subscription") {
                    const targetPlan = (aiResponseItem.data.plan || "oga").toLowerCase();

                    const user = await User.findById(profile.ownerId);
                    if (!user) {
                        await sendReply(from, `Sorry ${bossTitle}, I couldn't find your account details to generate a payment link. Please contact support!`);
                    } else if (profile.hasUsedTrial) {
                         const upgradeUrl = `${process.env.FRONTEND_URL || 'https://usekredibly.com'}/pricing`;
                         await sendReply(from, `${bossTitle}, you've already used your trial! You can upgrade anytime on your dashboard: ${upgradeUrl} 🛡️`);
                    } else {
                        // LAUNCH PROMO: 7-Day Trial + 50% Off (Card vs Transfer)
                        const rawMethod = (aiResponseItem.data?.method || "").toLowerCase();
                        const method = rawMethod.includes("transfer") ? "transfer" : "card"; 
                        const authFee = method === "card" ? 50 : 500;
                        const targetPlan = "chairman"; // Trial is always Chairman at launch
                        const fullPrice = getPlanPrice(targetPlan, "monthly");
                        const discountPrice = getPlanPrice(targetPlan, "launch");

                        const reference = `KREDDY_TRIAL_${Date.now()}`;
                        const metadata = { 
                            paymentType: 'subscription_trial', 
                            plan: targetPlan, 
                            billingCycle: 'monthly', 
                            businessId: profile._id.toString(),
                            email: user.email,
                            isLaunchPromo: true,
                            fullPrice: fullPrice,
                            discountPrice: discountPrice,
                            method: method
                        };
                        
                        try {
                            const paystackData = await initializePayment(user.email, authFee, reference, metadata);
                            
                            let promoMsg = "";
                            if (method === "card") {
                                promoMsg = `🚀 *${bossTitle}, 7-Day Chairman Trial Ready!* \n\nI'll unlock my full scan and voice powers for you now. \n\n🛡️ *Verify Card:* Pay ₦50 below to start. (This enables **Auto-Billing** on Day 8 so your hustle never stops). \n🔗 *Start Trial:* ${paystackData.authorization_url}`;
                            } else {
                                promoMsg = `🚀 *${bossTitle}, 7-Day Chairman Trial Ready!* \n\n🎁 *Transfer Activation:* Pay ₦500 below. This ₦500 stays in your Wallet and counts towards your first month! \n🔗 *Start Trial:* ${paystackData.authorization_url}`;
                            }
                            await sendReply(from, promoMsg);
                        } catch (e) {
                            console.error("Paystack Init Error:", e.message);
                            await sendReply(from, `Ouch! I had trouble setting up your trial. Please try again!`);
                        }
                    }
                    isProcessed = true;
                } else if (aiResponseItem && aiResponseItem.intent === "check_billing") {
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
                                    await sendWhatsAppAlert(formattedNewPhone, "Team Member", `Your boss (${profile.displayName}) has added you to their Kredibly team.\n\nYou can now chat with me (Kreddy AI) here to record sales and check records on their behalf!\n\n_Try saying: "I just sold a pair of shoes to David for 20k"_`);
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
                } else if (aiResponseItem && aiResponseItem.intent === "reply_ticket") {
                    if (openTicket) {
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
                } else if (aiResponseItem && aiResponseItem.intent === "delete_reminder") {
                    const data = aiResponseItem.data || {};
                    const taskTarget = data.taskDescription || data.customerName || text;
                    const reminderDateStr = data.reminderDate;

                    let filter = {
                        businessId: profile._id,
                        status: "pending"
                    };

                    if (taskTarget && taskTarget.toLowerCase() !== "task" && taskTarget.toLowerCase() !== "reminder") {
                        filter.description = { $regex: new RegExp(taskTarget.trim(), "i") };
                    }

                    if (reminderDateStr) {
                        const targetDate = new Date(reminderDateStr);
                        if (!isNaN(targetDate.getTime())) {
                            const start = new Date(targetDate); start.setMinutes(start.getMinutes() - 60);
                            const end = new Date(targetDate); end.setMinutes(end.getMinutes() + 60);
                            filter.triggerDate = { $gte: start, $lte: end };
                        }
                    }

                    const matches = await Reminder.find(filter).sort({ triggerDate: 1 });

                    if (matches.length === 0) {
                        await sendReply(from, `🔍 I couldn't find any pending reminders for *"${taskTarget || 'that'}"*, ${bossTitle}.`);
                    } else if (matches.length === 1) {
                        const rem = matches[0];
                        rem.status = "cancelled";
                        await rem.save();
                        await sendReply(from, `🗑️ *Reminder Cancelled!* \n\nI've removed the task *"${rem.description}"* from your schedule. 🫡`);
                    } else {
                        let msg = `🤔 I found *${matches.length}* pending reminders that might match. Which one should I cancel?\n\n`;
                        matches.slice(0, 5).forEach((m, i) => {
                            const time = m.triggerDate.toLocaleString('en-NG', { hour: '2-digit', minute: '2-digit', hour12: true });
                            msg += `${i+1}. *${time}* — ${m.description}\n`;
                        });
                        
                        await WhatsAppSession.findOneAndUpdate(
                            { whatsappNumber: cleanFrom },
                            {
                                type: 'delete_reminder_disambiguation',
                                data: { options: matches.map(m => ({ id: m._id, name: m.description })) },
                                expiresAt: new Date(Date.now() + 5 * 60 * 1000)
                            },
                            { upsert: true }
                        );
                        await sendReply(from, msg);
                    }
                    isProcessed = true;
                } else if (aiResponseItem && aiResponseItem.intent === "support") {
                    // 🛡️ FORMAL SUPPORT TICKET (From WhatsApp Support Intent)
                    const supportMsgText = aiResponseItem.data?.reply || text;
                    
                    const newTicket = new SupportTicket({
                        userId: profile.ownerId,
                        businessId: profile._id,
                        message: supportMsgText,
                        status: "open"
                    });
                    await newTicket.save();
                    
                    try {
                        const { sendNewTicketEmail } = require("../../emailLogic/emails");
                        const adminEmail = process.env.ADMIN_EMAIL || "support@usekredibly.com"; 
                        await sendNewTicketEmail(adminEmail, profile.displayName, supportMsgText, newTicket._id);
                    } catch (e) { console.error("Support Email fail", e); }

                    await Notification.create({
                        businessId: profile._id,
                        title: "Support Ticket Logged 🛡️",
                        message: `Ticket #${newTicket._id.toString().slice(-6)} opened via WhatsApp.`,
                        type: "system"
                    });

                    await sendReply(from, `🛡️ *Support Ticket Opened*\n\nI've logged this as an official ticket (#${newTicket._id.toString().slice(-6)}) for the team to look into immediately. You can track its status on your Dashboard! 🚀`);
                    isProcessed = true;
                } else if (aiResponseItem && aiResponseItem.intent === "feedback") {
                    // 🚨 CLARIFICATION GUARD: If feedback contains core biz keywords, ask for confirmation
                    const coreKeywords = ['reminder', 'debt', 'sale', 'invoice', 'delete', 'money', 'task', 'call'];
                    const hasCoreKeywords = coreKeywords.some(k => text.toLowerCase().includes(k));

                    if (hasCoreKeywords && (aiResponseItem.confidence || 1.0) < 0.95) {
                         await sendReply(from, `🛡️ *Quick Question, ${bossTitle}:* \n\nI catch your message, but I'm not sure if you're giving me a **Suggestion for the App** or asking me to **Manage a Task/Debt**. \n\nWhich one is it? 🧐`);
                         await WhatsAppSession.findOneAndUpdate(
                             { whatsappNumber: cleanFrom },
                             {
                                 type: 'intent_clarification',
                                 data: { originalText: text, aiChoice: aiResponseItem.intent },
                                 expiresAt: new Date(Date.now() + 5 * 60 * 1000)
                             },
                             { upsert: true }
                         );
                         return;
                    }

                    // 🚀 FEEDBACK / BUG REPORT FORWARDER
                    const feedbackMsgText = aiResponseItem.data.reply || text;

                    // 🛠️ Save as official Feedback model entry
                    await Feedback.create({
                        userId: profile.ownerId,
                        businessId: profile._id,
                        whatsappNumber: cleanFrom,
                        message: feedbackMsgText,
                        category: "Roadmap Suggested via WhatsApp"
                    });

                    await Notification.create({
                        businessId: profile._id,
                        title: "Priority Feedback 📢",
                        message: `Merchant ${profile.displayName} shared an idea: ${feedbackMsgText.substring(0, 50)}...`,
                        type: "system"
                    });

                    // Log to SuperAdmin context
                    await logActivity({
                        businessId: profile._id,
                        action: "MERCHANT_FEEDBACK",
                        entityType: "AI_SUPPORT",
                        details: feedbackMsgText
                    });

                    await sendReply(from, `Got it, ${bossTitle}! 🫡 I've shared your idea directly with our Dev Team at the backend. We love hearing from you! 🚀🛡️`);
                    isProcessed = true;
                } else if (aiResponseItem && aiResponseItem.intent === "delete_feedback") {
                    // 🗑️ Handle "Cancel/Delete my suggestion"
                    const lastFeedback = await Feedback.findOne({ businessId: profile._id }).sort({ createdAt: -1 });
                    
                    if (lastFeedback && (new Date() - lastFeedback.createdAt) < 60 * 60 * 1000) { // Only delete if in last 60 mins
                        await lastFeedback.deleteOne();
                        await sendReply(from, `No problem, ${bossTitle}! 🛡️ I've removed that suggestion from our internal roadmap. Your feedback loop is clean! ⚖️`);
                    } else {
                        await sendReply(from, `${bossTitle}, I couldn't find a very recent suggestion to delete. If you want to change something on the roadmap, just let me know exactly what! 🫡`);
                    }
                    isProcessed = true;
                } else if (aiResponseItem && aiResponseItem.intent === "delete_sale") {
                    const searchRef = (aiResponseItem.data.invoiceNumber || aiResponseItem.data.customerName || "").trim();
                    if (!searchRef) {
                        await sendReply(from, `Boss, I catch that you want to delete a record, but I need the Customer Name or Invoice ID.`);
                    } else {
                        const matches = await Sale.find({
                            businessId: profile._id,
                            $or: [
                                { invoiceNumber: searchRef.toUpperCase() },
                                { customerName: { $regex: new RegExp(searchRef, "i") } }
                            ]
                        }).sort({ createdAt: -1 });

                        if (matches.length === 0) {
                            await sendReply(from, `🔍 I couldn't find a record for *${searchRef}* to delete.`);
                        } else if (matches.length === 1) {
                            const saleToDelete = matches[0];
                            
                            // Delete from DB
                            await Sale.deleteOne({ _id: saleToDelete._id });
                            
                            // 🧹 Cascade Delete Reminders
                            const Reminder = require("../../models/Reminder");
                            await Reminder.deleteMany({ saleId: saleToDelete._id });

                            // Activity Log
                            await logActivity({
                                businessId: profile._id,
                                action: "SALE_DELETED_WHATSAPP",
                                entityType: "SALE",
                                details: `Merchant deleted invoice #${saleToDelete.invoiceNumber} for ${saleToDelete.customerName} via Kreddy.`
                            });

                            await sendReply(from, `🛡️ *Record Deleted!* \n\nI've removed the invoice for *${saleToDelete.customerName}* and cancelled all scheduled reminders for it. Your dashboard is updated! ⚖️`);
                        } else {
                            let msg = `🤔 I found *${matches.length}* matches for "${searchRef}". Which one should I delete?\n\n`;
                            matches.slice(0, 5).forEach(m => {
                                msg += `• *#${m.invoiceNumber}* (${m.customerName})\n`;
                            });
                            msg += `\nPlease type the exact Invoice ID! 🛡️`;
                            await sendReply(from, msg);
                        }
                    }
                    isProcessed = true;
                } else if (aiResponseItem && aiResponseItem.intent === "general_chat") {
                    // Clear stale session context so follow-up messages don't get stuck
                    if (session) {
                        await WhatsAppSession.deleteOne({ _id: session._id });
                    }
                    let msg = aiResponseItem.data.reply || "I'm here, Chief! What's happening? 🚀";
                    
                    // Auto-Split if message contains a Draft marker
                    if (msg.includes("📝 Draft for") || msg.includes("📝 *Draft ready")) {
                        const parts = msg.split(/(?=📝 Draft for|📝 \*Draft ready)/g);
                        for (const part of parts) {
                            await sendReply(from, part.trim());
                        }
                    } else {
                        await sendReply(from, msg);
                    }
                    isProcessed = true;
                } else {
                    // FALLBACK — Only trigger if truly unknown
                    let fallbackMsg = aiResponseItem?.data?.reply || `I'm listening, ${bossTitle}! 🫡 `;
                    
                    if (!isProcessed) {
                        fallbackMsg += "\n\nTip: You can ask me to record sales, set reminders, or even suggest features for the dashboard! 💡";
                    }
                    
                    // Auto-Split if message contains a Draft marker
                    if (fallbackMsg.includes("📝 Draft for") || fallbackMsg.includes("📝 *Draft ready")) {
                        const parts = fallbackMsg.split(/(?=📝 Draft for|📝 \*Draft ready)/g);
                        for (const part of parts) {
                            await sendReply(from, part.trim());
                        }
                    } else {
                        await sendReply(from, fallbackMsg);
                    }
                    isProcessed = true;
                }
            }
        }
    }
    } catch (err) {
        console.error("WhatsApp Assistant Error:", err);
        await sendReply(from, "Ouch! My brain had a small glitch. 😵‍ Give me a moment to recover and try again! 🛡️");
    }
};

