const BusinessProfile = require("../../models/BusinessProfile");
const Sale = require("../../models/Sale");
const Notification = require("../../models/Notification");
const WhatsAppSession = require("../../models/WhatsAppSession");
const SupportTicket = require("../../models/SupportTicket");
const axios = require("axios");
const { logActivity } = require("../../utils/activityLogger");
const { processMessageWithAI } = require("../../utils/aiService");

// Duplicate Shield: Store message IDs to prevent double-processing (cleared every 10 mins)
const processedMessages = new Set();
setInterval(() => processedMessages.clear(), 10 * 60 * 1000); // 10 minutes

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

const cleanPhone = (num) => {
    if (!num) return num;
    let clean = String(num).replace(/\D/g, ''); // Remove all non-digits
    if (clean.startsWith('0') && clean.length === 11) {
        clean = '234' + clean.slice(1);
    }
    return clean;
};

const HUMANIZE = {
    greetings: [
        "Chief {name}! 🫡 How can I help your hustle today?",
        "Good to see you, {name}! 🚀 What's the latest update?",
        "Hey {name}! Kreddy is online. Ready to record some wins?",
        "Welcome back, {name}! 🛡️ Need to track a payment or record a sale?"
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
        "🌟 *Big energy! Keep scaling!*"
    ]
};

const getRandom = (arr, data = {}) => {
    let pick = arr[Math.floor(Math.random() * arr.length)];
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
                text: { body: text },
            },
            {
                headers: { Authorization: `Bearer ${accessToken}` },
            }
        );
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
        const profile = await BusinessProfile.findOne({ whatsappNumber: cleanFrom });

        if (profile && !profile.isKreddyConnected) {
            profile.isKreddyConnected = true;
            await profile.save();
        }

        await logActivity({
            businessId: profile?._id || "SYSTEM",
            action: "WHATSAPP_MSG_RECEIVED",
            entityType: "WHATSAPP",
            details: `From: ${from} | Msg: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`
        });

        if (!profile) {
            await sendReply(from, "Welcome to Kredibly! 🚀 \n\nI don't recognize this number. Please log in to dashboard and link your number.");
            return;
        }

        if (msgType === "audio" || msgType === "voice" || msgType !== "text") {
            await sendReply(from, "I can only process text commands for now! ✍️");
            return;
        }

        const lowerText = text.toLowerCase();

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
                }
            }

            // CONVERSATIONAL FLOW: Collecting missing info
            // CONVERSATIONAL FLOW: Collecting missing info
            // (Legacy 'collect_sale_info' block removed to allow AI to handle conversation)

        }

        // ROUTER
        const entityLabel = profile.entityType === 'business' ? 'Business' : 'Hustle';

        if (["hi", "hello", "h", "connect", "kreddy"].includes(lowerText)) {
            const hour = new Date().getHours();
            let timeGreeting = "Hi";
            if (hour >= 22 || hour < 5) timeGreeting = "Working late? I'm here for you! 🌙";
            else if (hour < 12) timeGreeting = "Good morning! Let's make today productive ☀️";

            const personalizedGreeting = getRandom(HUMANIZE.greetings, { name: profile.displayName });
            await sendReply(from, `${personalizedGreeting} \n\nI'm *Kreddy*, your Kredibly partner. I'm here to make sure you never lose track of a single Naira. 🚀\n\n*What's the plan for today?*\n📊 *S*: See Performance\n⏳ *D*: See Debtors\n💡 *HELP*: Learn how to use Kreddy`);
        } else if (["thanks", "thank you", "merci", "jazakallah", "gracias"].includes(lowerText)) {
            await sendReply(from, "You're very welcome, Chief! 🫡 Always happy to help your business grow. Let me know if you need anything else!");
        } else if (["help", "?"].includes(lowerText)) {
            await sendReply(from, `💡 *Kreddy Quick Help Hub*

1️⃣ *How to record a sale?*
Just tell me: _"Sold a bag to Funke for 20k"_ or _"Received 5k from Ali for shoes"_

2️⃣ *What is Trust Score?*
It's your reliability rating. It grows when customers verify receipts. High scores = more business! 🛡️

3️⃣ *How to share invoices?*
Type *D [Customer Name]* to get a private payment link you can forward to them! 🔗

4️⃣ *Need Support?*
Just text me your problem (e.g., _"Kreddy, I have an issue with my bank details"_) and I'll open a ticket for the team. 🚀

*Quick Keys:*
📊 *S*: See Performance
⏳ *D*: See Debtors`);
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
                const link = `${FRONTEND_URL}/i/${sale.invoiceNumber}`;
                const bankInfo = profile.bankDetails?.accountNumber ? `\n\nBank: ${profile.bankDetails.bankName}\nAcc: ${profile.bankDetails.accountNumber}` : '';

                let msg = `🤝 *Payment Link for ${sale.customerName}*\n💰 Balance: *₦${bal.toLocaleString()}*\n\n*Copy & Forward this to them:* \n------------------\n"Hi ${sale.customerName}, here is the secure update and payment link for your balance with ${profile.displayName}: ${link}${bankInfo ? '\n' + bankInfo : ''}"\n------------------`;
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

            // 🧠 GEMINI AI ("The Brain")
            const aiResponse = await processMessageWithAI(text, { 
                merchantName: profile.displayName,
                entityType: profile.entityType,
                debtors: debtorContext || "No active debtors yet.",
                currentSession: session || null
            });

            if (aiResponse && (aiResponse.intent === "create_sale" || aiResponse.intent === "update_record") && aiResponse.data.customerName && aiResponse.data.customerName.toLowerCase() !== "customer") {
                const searchName = aiResponse.data.customerName;
                const matches = await Sale.find({ 
                    businessId: profile._id, 
                    customerName: { $regex: new RegExp(searchName, "i") },
                    status: { $ne: "paid" }
                });

                // DISAMBIGUATION: If multiple records exist for this name, ask which one!
                if (matches.length > 1) {
                    const options = matches.map(m => ({ 
                        id: m._id, 
                        name: m.customerName, 
                        amount: m.totalAmount - m.payments.reduce((s, p) => s + p.amount, 0) 
                    }));

                    await WhatsAppSession.findOneAndUpdate(
                        { whatsappNumber: cleanFrom },
                        {
                            type: aiResponse.data.dueDate ? 'due_date_disambiguation' : 'payment_disambiguation',
                            data: { options, date: aiResponse.data.dueDate, amount: aiResponse.data.paidAmount },
                            expiresAt: new Date(Date.now() + 5 * 60 * 1000)
                        },
                        { upsert: true }
                    );

                    let disambigMsg = `🤔 I found *${matches.length}* people named *${searchName}* with unpaid debts. Which one are you talking about?\n\n`;
                    options.forEach((opt, i) => {
                        disambigMsg += `${i + 1}. *${opt.name}* (Owes ₦${opt.amount.toLocaleString()})\n`;
                    });
                    disambigMsg += `\n_Type the number (1-${options.length}) to pick one!_`;
                    return await sendReply(from, disambigMsg);
                }
            }

            if (aiResponse && aiResponse.intent === "create_sale" && aiResponse.data.totalAmount) {
                const { customerName, totalAmount, paidAmount, item, dueDate } = aiResponse.data;
                
                const newSale = new Sale({
                    businessId: profile._id,
                    customerName: customerName || (session?.data?.customerName) || "Customer",
                    description: item || (session?.data?.description) || text,
                    totalAmount: totalAmount,
                    payments: [{ amount: paidAmount || 0, method: "WhatsApp" }],
                    dueDate: dueDate && !isNaN(new Date(dueDate).getTime()) ? new Date(dueDate) : undefined
                });

                await newSale.save();

                // Persist this customer in session for a few minutes so "She/He" works in next message
                await WhatsAppSession.findOneAndUpdate(
                    { whatsappNumber: cleanFrom },
                    {
                        type: 'active_context',
                        data: {
                            customerName: newSale.customerName,
                            lastSaleId: newSale._id,
                            description: newSale.description
                        },
                        expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 mins context
                    },
                    { upsert: true }
                );

                await logActivity({
                    businessId: profile._id,
                    action: "WHATSAPP_SALE_CREATED",
                    entityType: "SALE",
                    entityId: newSale._id,
                    details: `Recorded sale of ₦${totalAmount.toLocaleString()} to ${newSale.customerName} via WhatsApp (AI)`
                });

                // Create Dashboard Notification
                await Notification.create({
                    businessId: profile._id,
                    title: "New Sale via WhatsApp 🚀",
                    message: `₦${totalAmount.toLocaleString()} recorded for ${newSale.customerName}.`,
                    type: "sale",
                    saleId: newSale._id
                });

                const bal = totalAmount - (paidAmount || 0);
                const link = `${FRONTEND_URL}/i/${newSale.invoiceNumber}`;

                const celebration = totalAmount >= 50000 ? getRandom(HUMANIZE.celebration) + "\n\n" : "Great job! 🚀\n\n";
                let reply = `✅ *Record Saved!* (#${newSale.invoiceNumber})\n\n${celebration}I've logged *₦${totalAmount.toLocaleString()}* for ${customerName}.\n`;
                
                if (bal > 0) {
                    reply += `⏳ They still owe you *₦${bal.toLocaleString()}*`;
                    if (newSale.dueDate) reply += ` which is due on *${newSale.dueDate.toLocaleDateString()}*.`;
                    else reply += `.`;
                } else {
                    reply += `✅ *Fully Paid!*`;
                }

                reply += `\n\n🔗 *Invoice Link:* ${link}`;
                await sendReply(from, reply);

            } else if (aiResponse && aiResponse.intent === "check_debt") {
                 const msg = aiResponse.data.reply || "To see your debtors, just type 'D' or 'Debtors'! 📉";
                 await sendReply(from, msg);
                 
            } else if (aiResponse && aiResponse.intent === "update_record") {
                 // Check if we have an active context to update the LAST sale
                 if (session?.data?.lastSaleId && (aiResponse.data.paidAmount !== undefined || aiResponse.data.dueDate)) {
                     const sale = await Sale.findById(session.data.lastSaleId);
                     if (sale) {
                         if (aiResponse.data.paidAmount !== undefined) {
                             // Replace the initial payment or add to it? 
                             // Usually "She paid 20k" means the payment was actually 20k, not 50k.
                             sale.payments = [{ amount: aiResponse.data.paidAmount, method: "WhatsApp Update" }];
                         }
                         if (aiResponse.data.dueDate) sale.dueDate = new Date(aiResponse.data.dueDate);
                         await sale.save();

                         // Notification for update
                         await Notification.create({
                             businessId: profile._id,
                             title: "Sale Updated 📝",
                             message: `${sale.customerName}'s record was updated via WhatsApp.`,
                             type: "sale",
                             saleId: sale._id
                         });

                         const bal = sale.totalAmount - (aiResponse.data.paidAmount || 0);
                         let reply = `✅ *Updated ${sale.customerName}'s record!* \n\nI've changed the payment to *₦${aiResponse.data.paidAmount.toLocaleString()}*. \n⏳ Balance is now *₦${bal.toLocaleString()}*.`;
                         return await sendReply(from, reply);
                     }
                 }

                 const msg = aiResponse.data.reply || "I've noted the update, Chief! I'll adjust the records on your dashboard. 🫡";
                 await sendReply(from, msg);
                 
            } else if (aiResponse && (aiResponse.intent === "support" || (aiResponse.intent === "general_chat" && (text.toLowerCase().includes("problem") || text.toLowerCase().includes("issue"))))) {
                // Check if we have a pre-answered question first
                const matchedFAQ = KREDDY_FAQS.find(faq =>
                    faq.keywords.some(k => text.toLowerCase().includes(k))
                );

                if (matchedFAQ) {
                    return await sendReply(from, `💡 *I might have the answer to that!* \n\n${matchedFAQ.answer} \n\n_If you still need help, tell me exactly what the concern is and I'll notify the team!_`);
                }

                // Trigger ticket logic
                const newTicket = new SupportTicket({
                    userId: profile.ownerId,
                    businessId: profile._id,
                    message: text,
                    status: "open"
                });
                await newTicket.save();
                
                await Notification.create({
                    businessId: profile._id,
                    title: "Support Ticket Logged 🛡️",
                    message: `Concern received: Ticket #${newTicket._id.toString().slice(-6)} is now open.`,
                    type: "system"
                });

                await sendReply(from, "🛡️ *Support Ticket Opened*\n\nI couldn't find a quick answer for that, so I've logged it as Ticket #" + newTicket._id.toString().slice(-6) + ". The team will look into it! 🚀");

            } else if (aiResponse && aiResponse.intent === "general_chat") {
                await sendReply(from, aiResponse.data.reply || "I'm here, Chief! What's happening? 🚀");
            } else {
                // FALLBACK: AI didn't understand enough to create a sale or intent was ambiguous
                
                // Store session to capture potential missing info
                await WhatsAppSession.findOneAndUpdate(
                    { whatsappNumber: cleanFrom },
                    {
                        type: 'collect_sale_info',
                        data: {
                            description: aiResponse?.data?.item || text,
                            customerName: aiResponse?.data?.customerName || "Customer",
                            totalAmount: aiResponse?.data?.totalAmount || null
                        },
                        expiresAt: new Date(Date.now() + 5 * 60 * 1000)
                    },
                    { upsert: true, new: true }
                );

                const fallbackMsg = aiResponse?.data?.reply || "I didn't quite catch the specifics of that. Try telling me like: _'Sold a watch to Kola for 10k'_ 💰";
                await sendReply(from, fallbackMsg);
            }
        }
    } catch (err) {
        console.error("WhatsApp Assistant Error:", err);
        await sendReply(from, "Ouch! My brain had a small glitch. 😵‍C Give me a moment to recover and try again! 🛡️");
    }
};

