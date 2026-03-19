const BusinessProfile = require("../../models/BusinessProfile");
const Sale = require("../../models/Sale");
const Notification = require("../../models/Notification");
const WhatsAppSession = require("../../models/WhatsAppSession");
const SupportTicket = require("../../models/SupportTicket");
const Reminder = require("../../models/Reminder");
const axios = require("axios");
const { logActivity } = require("../../utils/activityLogger");
const { processMessageWithAI, processAudioWithAI, processImageWithAI } = require("../../utils/aiService");
const { logUsage } = require("../../utils/usageTracker");

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

    // 1. Intent Detection
    if (lower.includes("who owe") || lower.includes("who is owing") || lower.includes("list my debtor") || lower.includes("total debt") || lower.includes("show me who owe")) {
        result.intent = "check_debt";
        // result.data.reply will be handled by the main controller to fetch actual debts
        return result;
    }

    if (lower.includes("draft") || lower.includes("message for")) {
        result.intent = "draft_reminder";
        result.data.reply = "I'm on it, Chief! 🫡 Let me draft a sharp message you can send to your customer...";
    } else if (lower.includes("remind") || lower.includes("reminder") || lower.includes("due")) {
        // Default to a productivity task if no customer name or debt context is clear
        result.intent = lower.includes("debt") || lower.includes("owe") ? "update_record" : "create_reminder";
        result.data.reminderType = lower.includes("meet") ? "meeting" : "task";
        
        if (lower.includes("today")) result.data.reminderDate = new Date();
        else if (lower.includes("tomorrow")) result.data.reminderDate = new Date(Date.now() + 86400000);
        
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
    } else if (lower.includes("snooze") || lower.includes("wait") || lower.includes("later")) {
        result.intent = "snooze_reminder";
        const minMatch = text.match(/(\d+)/);
        result.data.snoozeDuration = minMatch ? parseInt(minMatch[1]) : 30;
    } else if (lower.includes(" paid") || lower.includes(" pay") || lower.includes(" brought") || lower.includes(" sent") || lower.includes("received") || lower.includes("collect")) {
        result.intent = "update_record";
    } else if (lower.includes("sold") || lower.includes("selling") || lower.includes("sale") || lower.includes("record") || lower.includes("bought")) {
        result.intent = "create_sale";
    }

    // 2. Extract Amounts (handle 10k, 10000, 245k)
    const amountRegex = /(\d+(?:\.\d+)?)\s*(k|thousand|million|m|naira|ngn)?/gi;
    const matches = [...text.matchAll(amountRegex)];
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
                        sale.payments.push({ amount: selected.amount, method: "WhatsApp Quick Select" });
                        await sale.save();
                        const balance = sale.totalAmount - sale.payments.reduce((s, p) => s + p.amount, 0);
                        await Notification.create({
                            businessId: profile._id,
                            title: "Quick Payment ✅",
                            message: `₦${selected.amount.toLocaleString()} recorded for ${sale.customerName}.`,
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
                        const bal = sale.totalAmount - sale.payments.reduce((s, p) => s + p.amount, 0);
                        const link = `${BACKEND_URL}/api/payments/share/${sale.invoiceNumber}`;
                        const draft = `Hi ${sale.customerName}, this is a friendly reminder for your balance of ₦${bal.toLocaleString()} with ${profile.displayName}. You can view and pay here: ${link}`;
                        await WhatsAppSession.deleteOne({ _id: session._id });
                        return await sendReply(from, `📝 *Draft for ${sale.customerName}:* \n\n_"${draft}"_\n\n(You can copy and forward this to them! 🚀)`);
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
        } else if (
            lowerText.includes("mistake") || 
            lowerText.includes("correct name") || 
            lowerText.includes("change name") || 
            lowerText.includes("buyer is") ||
            lowerText.startsWith("actually") || 
            lowerText.startsWith("his name is") || 
            lowerText.startsWith("her name is")
        ) {
            console.log("🛠️ Name Correction Triggered:", lowerText);
            // Extract the name from the end of the sentence
            const nameParts = text.split(/is|for|to|it's|its|be/i);
            const newName = nameParts.pop().trim().replace(/[.!?]$/, "");
            const session = await WhatsAppSession.findOne({ whatsappNumber: cleanFrom });
            
            let saleToUpdate = null;

            // Priority 1: Use the last sale ID from session memory
            if (session?.data?.lastSaleId) {
                saleToUpdate = await Sale.findById(session.data.lastSaleId);
            }

            // Priority 2: If no session, find the MOST RECENT sale named "Customer" for this business
            if (!saleToUpdate) {
                saleToUpdate = await Sale.findOne({ 
                    businessId: profile._id, 
                    customerName: { $regex: /^Customer$/i } 
                }).sort({ createdAt: -1 });
            }

            if (saleToUpdate) {
                const oldName = saleToUpdate.customerName;
                saleToUpdate.customerName = newName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
                await saleToUpdate.save();

                await logActivity({
                    businessId: profile._id,
                    action: "WHATSAPP_NAME_UPDATED",
                    details: `Changed name from ${oldName} to ${newName} via WhatsApp Correction`
                });

                return await sendReply(from, `✅ *Name Corrected!* \n\nI've updated the record. The name is now *${saleToUpdate.customerName}* instead of *${oldName}*. 🫡`);
            }
            
            await sendReply(from, `I hear you, ${plan === 'chairman' ? 'Chairman' : 'Boss'}! I want to change the name to *${newName}*, but I couldn't find a recent record to update.`);
        } else if (["help", "?"].includes(lowerText)) {
            const title = plan === "chairman" ? "Chairman" : "Boss";
            await sendReply(from, `💡 *Kreddy Quick Help Hub (${title} Edition)*\n\n1️⃣ *Record a sale:* Tell me _"Sold a bag to Funke for 20k"_\n2️⃣ *Trust Score:* Grow your reputation by verifying receipts. 🛡️\n3️⃣ *Invoices:* Type *D [Name]* for a private payment link. 🔗\n4️⃣ *Support:* Tell me your issue (e.g., _"Account issue"_) to open a ticket. 🚀\n\n*Quick Keys:* \n📊 *S*: Performance  |  ⏳ *D*: Debtors`);
        } else if (["status", "s"].includes(lowerText)) {
            const sales = await Sale.find({ businessId: profile._id });
            let rev = 0, debt = 0, confirmed = 0, paidFull = 0;
            sales.forEach(s => {
                const paid = s.payments.reduce((sum, p) => sum + p.amount, 0);
                rev += paid;
                debt += (s.totalAmount - paid);
                if (s.confirmed) confirmed++;
                if (s.status === 'paid') paidFull++;
            });

            const trustScore = Math.min(99, 60 + (confirmed * 8) + (paidFull * 4) + (sales.length * 1));

            await sendReply(from, `📊 *${entityLabel} Overview*\n\n💰 *Processed Revenue:* ₦${rev.toLocaleString()}\n⏳ *Total Owed to You:* ₦${debt.toLocaleString()}\n📑 *Total Records:* ${sales.length}\n\n🛡️ *Verifiable Trust Score:* ${trustScore}/100\n_(Your score grows as customers verify your receipts!)_`);
        } else if (lowerText === "debt" || lowerText === "d" || lowerText.startsWith("debt ") || lowerText.startsWith("d ")) {
            const parts = text.split(" ");
            const searchName = parts.slice(1).join(" ").trim();

            if (!searchName) {
                const sales = await Sale.find({ businessId: profile._id });
                let msg = `⏳ *Outstanding Balances:*\n\n`;
                let count = 0;
                sales.forEach(s => {
                    const bal = s.totalAmount - s.payments.reduce((sum, p) => sum + p.amount, 0);
                    if (bal > 0) {
                        msg += `• *${s.customerName}*: ₦${bal.toLocaleString()} (#${s.invoiceNumber})\n`;
                        count++;
                    }
                });
                if (count === 0) msg = "🎉 Amazing! Nobody owes you any money right now.";
                else msg += `\n_To get a payment link, type "D [Customer Name]"_`;
                await sendReply(from, msg);
            } else {
                const matches = await Sale.find({ businessId: profile._id, customerName: { $regex: new RegExp(searchName, "i") }, status: { $ne: "paid" } });
                if (matches.length === 0) return await sendReply(from, `🔍 I couldn't find an unpaid record for *${searchName}*.`);

                const sale = matches[0];
                const bal = sale.totalAmount - sale.payments.reduce((s, p) => s + p.amount, 0);
                const link = `${APP_URL}/i/${sale.invoiceNumber}`;

                let msg = `🤝 *Payment Link for ${sale.customerName}*\n💰 Balance: *₦${bal.toLocaleString()}*\n\n*Copy & Forward this to them:* \n------------------\n"Hi ${sale.customerName}, here is the secure update and payment link for your balance with ${profile.displayName}: ${link}"\n------------------`;
                await sendReply(from, msg);
            }
        } else if (lowerText.startsWith("pay ") || lowerText.startsWith("c ") || lowerText.startsWith("confirm ")) {
            const parts = text.split(/\s+/);
            const cmd = parts[0].toLowerCase();
            const ref = parts[1]?.toUpperCase();

            if (cmd === "pay") {
                const amount = parseFloat(parts[2]);
                if (!ref || isNaN(amount)) return await sendReply(from, "❌ Sorry, I need the format: *PAY [ID] [Amount]*");
                const sale = await Sale.findOne({ businessId: profile._id, invoiceNumber: ref });
                if (!sale) return await sendReply(from, `🔍 I couldn't find an invoice with ID *${ref}*.`);

                sale.payments.push({ amount, method: "WhatsApp" });
                await sale.save();

                // Notify Oga (Oga Monitor)
                if (isStaff && profile.whatsappNumber) {
                    const todayRev = await getTodayRevenue(profile._id);
                    const ogaMessage = `💰 *Payment Alert (Staff)* \n\nYour staff (*${cleanFrom}*) just recorded a manual payment of *₦${amount.toLocaleString()}* for *${sale.customerName}* (ID: ${ref}).\n\n📊 *Total Cash In Today:* ₦${todayRev.toLocaleString()}\n\n_Kredibly keeping your records straight!_ 🛡️`;
                    await sendReply(profile.whatsappNumber, ogaMessage);
                }

                await logActivity({
                    businessId: profile._id,
                    action: "WHATSAPP_PAYMENT_RECORDED",
                    entityType: "PAYMENT",
                    entityId: sale._id,
                    details: `Recorded payment of ₦${amount.toLocaleString()} for ${sale.customerName} via WhatsApp ID ${ref}`
                });

                const bal = sale.totalAmount - sale.payments.reduce((s, p) => s + p.amount, 0);

                return await sendReply(from, `✅ *Payment Recorded!* \n\nI've updated the ledger for ${sale.customerName}. Their new balance is *₦${bal.toLocaleString()}*.`);
            } else {
                const sale = await Sale.findOne({ businessId: profile._id, invoiceNumber: ref });
                if (!sale) return await sendReply(from, `🔍 I couldn't find an invoice with ID *${ref}*.`);

                sale.confirmed = true;
                sale.confirmedAt = new Date();
                await sale.save();
                return await sendReply(from, `🛡️ *Record Verified!* \n\nInvoice *${ref}* has been officially confirmed. This boost your Trust Score! 🚀`);
            }
        } else {
            // PERSISTENT SESSION HANDLING (Fetch before AI)
            const session = await WhatsAppSession.findOne({ whatsappNumber: cleanFrom });

            // Fetch some context about debtors to help the AI be "Brainy"
            const unpaidSales = await Sale.find({ businessId: profile._id, status: { $ne: "paid" } }).limit(10);
            const debtorContext = unpaidSales.map(s => {
                const bal = s.totalAmount - s.payments.reduce((sum, p) => sum + p.amount, 0);
                return `${s.customerName}: ₦${bal.toLocaleString()} (Invoice #${s.invoiceNumber})`;
            }).join(", ");

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
                console.log("⚡ Plan: Hustler (Using Regex/Robust Logic)");
                aiResponse = extractInfoRobust(text, { 
                    merchantName: profile.displayName,
                    plan: plan,
                    entityType: profile.entityType,
                    preferredTone: profile.assistantSettings?.reminderTemplate || "friendly",
                    currentSession: session || null 
                });
            } else {
                console.log(`💎 Plan: ${plan.toUpperCase()} (Using Gemini AI)`);
                aiResponse = await processMessageWithAI(text, { 
                    merchantName: profile.displayName,
                    plan: plan,
                    entityType: profile.entityType,
                    preferredTone: preferredTone,
                    debtors: debtorContext || "No active debtors yet.",
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
            // 🧠 INTENT PROCESSING PIPELINE
            // -------------------------------------------------------------------------
            let isProcessed = false;

            // 1. UPDATE RECORD (Check this first so we can re-route if no record found)
            if (!isProcessed && aiResponse && aiResponse.intent === "update_record") {
                 console.log("📝 Handling update_record intent...");
                 
                 // Look for match using last session context if available
                 if (session?.data?.lastSaleId && (aiResponse.data.paidAmount > 0 || aiResponse.data.dueDate)) {
                     const sale = await Sale.findById(session.data.lastSaleId);
                     if (sale && sale.status !== 'paid') {
                         if (aiResponse.data.paidAmount > 0) sale.payments.push({ amount: aiResponse.data.paidAmount, method: "WhatsApp Context Update" });
                         if (aiResponse.data.dueDate) sale.dueDate = new Date(aiResponse.data.dueDate);
                         await sale.save();
                         await sendReply(from, `✅ *Record Updated!* \n\nI've updated the ledger for *${sale.customerName}*.`);
                         isProcessed = true;
                     }
                 } 
                 
                 // Global search if not processed
                 if (!isProcessed && aiResponse.data.customerName && aiResponse.data.customerName !== "Customer") {
                     const matches = await Sale.find({ 
                        businessId: profile._id, 
                        customerName: { $regex: new RegExp(`^${aiResponse.data.customerName.replace(/\s+/g, '\\s+')}$`, "i") },
                        status: { $ne: "paid" }
                     });

                     if (matches.length === 1) {
                        const sale = matches[0];
                        if (aiResponse.data.paidAmount > 0) sale.payments.push({ amount: aiResponse.data.paidAmount, method: "WhatsApp Global Update" });
                        if (aiResponse.data.dueDate) sale.dueDate = new Date(aiResponse.data.dueDate);
                        await sale.save();
                        await sendReply(from, `✅ *Update Successful!* \n\nRecorded for *${sale.customerName}*. Receipt updated. 🛡️`);
                        isProcessed = true;
                     } else if (matches.length > 1) {
                        let disambigMsg = `🤔 I found *${matches.length}* people named *${aiResponse.data.customerName}* with unpaid debts. Which one should I update?\n\n`;
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
                                    dueDate: aiResponse.data.dueDate,
                                    paidAmount: aiResponse.data.paidAmount
                                },
                                expiresAt: new Date(Date.now() + 5 * 60 * 1000)
                            },
                            { upsert: true }
                        );
                        await sendReply(from, disambigMsg);
                        isProcessed = true;
                     }
                 }

                 // RE-ROUTE: If intent was update but it failed to find a record & we have transaction data, switch to CREATE
                 if (!isProcessed && (aiResponse.data.totalAmount > 0 || (aiResponse.data.paidAmount && aiResponse.data.paidAmount > 0))) {
                     console.log("🔄 Re-routing: No record found to update, switching to create_sale...");
                     aiResponse.intent = "create_sale";
                     // We DON'T set isProcessed = true, so the next block (Create Sale) picks it up.
                 }
            }

            // 2. CREATE SALE
            if (!isProcessed && aiResponse && aiResponse.intent === "create_sale" && aiResponse.data.totalAmount) {
                const { customerName, totalAmount, paidAmount, item, dueDate } = aiResponse.data;
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
                
                await sendReply(from, reply + `\n\n🔗 *Invoice Link:* ${APP_URL}/i/${newSale.invoiceNumber}`);
                
                if (isStaff && profile.whatsappNumber) {
                    await sendReply(profile.whatsappNumber, `📢 *Staff Activity Report* \n\nA new sale was just recorded by your staff (*${cleanFrom}*):\n\n👤 Customer: ${newSale.customerName}\n💰 Amount: ₦${totalAmount.toLocaleString()}\n📑 Invoice: #${newSale.invoiceNumber}`);
                }
                isProcessed = true;
            }

            // 3. OTHER INTENTS
            if (!isProcessed) {
                if (aiResponse && aiResponse.intent === "check_debt") {
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
                } else if (aiResponse.intent === "draft_reminder") {
                    const searchName = (aiResponse.data.customerName || "").replace(/\s+/g, ' ').trim();
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
                } else if (aiResponse && aiResponse.intent === "upgrade") {
                    const bossTitle = plan === "chairman" ? "Chairman" : (plan === "oga" ? "Oga" : "Boss");
                    const upgradeUrl = `${process.env.FRONTEND_URL || 'https://usekredibly.com'}/pricing`;
                    await sendReply(from, `${bossTitle}! 💎 You want to level up your hustle? \n\nYou can see all our plans and upgrade directly here: ${upgradeUrl}\n\nLet's get your business to the next level! 🚀`);
                    isProcessed = true;
                } else if (aiResponse && aiResponse.intent === "create_reminder") {
                    const reminderDateStr = aiResponse.data.reminderDate;
                    const taskDescription = aiResponse.data.taskDescription;
                    const reminderType = aiResponse.data.reminderType || "task";
                    const recurrence = aiResponse.data.recurrence || "none";
                    
                    if (!reminderDateStr || !taskDescription) {
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
                            // Check limits
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
                                await Reminder.create({
                                    businessId: profile._id,
                                    whatsappNumber: cleanFrom,
                                    description: taskDescription,
                                    triggerDate: triggerDate,
                                    type: reminderType,
                                    recurrence: recurrence
                                });

                                // Increment usage
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
                } else if (aiResponse && aiResponse.intent === "snooze_reminder") {
                    const snoozeMins = aiResponse.data.snoozeDuration || 30;
                    const lastReminder = await Reminder.findOne({
                        whatsappNumber: cleanFrom,
                        status: "delivered"
                    }).sort({ updatedAt: -1 });

                    if (lastReminder) {
                        lastReminder.triggerDate = new Date(Date.now() + snoozeMins * 60000);
                        lastReminder.status = "pending";
                        lastReminder.snoozeCount += 1;
                        await lastReminder.save();
                        await sendReply(from, `Understood, ${plan === 'chairman' ? 'Chairman' : 'Boss'}! 😴 I've snoozed that for ${snoozeMins} minutes. Talk soon!`);
                    } else {
                        await sendReply(from, "I'm not sure which reminder you want to snooze, Chief. I don't see any recent alerts.");
                    }
                    isProcessed = true;
                } else if (aiResponse && (aiResponse.intent === "reply_ticket" || aiResponse.intent === "support" || (aiResponse.intent === "general_chat" && (text.toLowerCase().includes("problem") || text.toLowerCase().includes("issue"))))) {
                    if (openTicket && aiResponse.intent !== "new_support_ticket") {
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
                } else if (aiResponse.intent === "general_chat") {
                    await sendReply(from, aiResponse.data.reply || "I'm here, Chief! What's happening? 🚀");
                    isProcessed = true;
                } else {
                    // FALLBACK
                    const sessionData = {
                        description: aiResponse?.data?.item || text,
                        customerName: aiResponse?.data?.customerName || session?.data?.customerName || "Customer",
                        totalAmount: aiResponse?.data?.totalAmount || session?.data?.totalAmount || null
                    };

                    await WhatsAppSession.findOneAndUpdate(
                        { whatsappNumber: cleanFrom },
                        { type: 'collect_sale_info', data: sessionData, expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
                        { upsert: true }
                    );

                    let fallbackMsg = aiResponse?.data?.reply || "I'm listening, Chief! 🫡 ";
                    if (session?.data?.customerName && !text.includes(session.data.customerName)) {
                        fallbackMsg += `Are we still talking about *${session.data.customerName}*? \n(Type 'Yes' or tell me something new!)`;
                    } else {
                        fallbackMsg += "I didn't quite catch the specifics. Try like: _'Sold a bag to Funke for 10k'_ 💰";
                    }
                    await sendReply(from, fallbackMsg);
                    isProcessed = true;
                }
            }
        }
    } catch (err) {
        console.error("WhatsApp Assistant Error:", err);
        await sendReply(from, "Ouch! My brain had a small glitch. 😵‍ Give me a moment to recover and try again! 🛡️");
    }
};

