const BusinessProfile = require("../../models/BusinessProfile");
const Sale = require("../../models/Sale");
const Notification = require("../../models/Notification");
const WhatsAppSession = require("../../models/WhatsAppSession");
const SupportTicket = require("../../models/SupportTicket");
const axios = require("axios");
const { logActivity } = require("../../utils/activityLogger");

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
        console.log("Incoming WhatsApp Payload:", JSON.stringify(req.body, null, 2));
        const entry = req.body.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;
        const message = value?.messages?.[0];

        if (!message) return;

        const messageId = message.id;
        const from = message.from;
        const msgType = message.type;
        const text = message.text?.body?.trim() || "";

        if (processedMessages.has(messageId)) return;
        processedMessages.add(messageId);

        const cleanFrom = cleanPhone(from);
        const profile = await BusinessProfile.findOne({ whatsappNumber: cleanFrom });

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
            if (session.type === 'collect_sale_info') {
                const data = session.data;
                if (!data.totalAmount) {
                    const numMatch = text.replace(/,/g, '').replace(/(\d+)k\b/gi, (m, p) => parseInt(p) * 1000).match(/\d+/);
                    if (numMatch) {
                        data.totalAmount = parseFloat(numMatch[0]);
                        data.paidAmount = data.paidAmount || data.totalAmount; // Default paid to total if just amount given
                    } else {
                        return await sendReply(from, "I need an amount, Chief! 😅 How much did they pay or how much is the total?");
                    }
                } else if (!data.customerName || data.customerName === "Someone") {
                    data.customerName = text.trim();
                }

                // If we have enough now, save it!
                if (data.totalAmount && data.customerName && data.customerName !== "Someone") {
                    await WhatsAppSession.deleteOne({ _id: session._id });
                    const newSale = new Sale({
                        businessId: profile._id,
                        customerName: data.customerName,
                        description: data.description || "WhatsApp Sale",
                        totalAmount: data.totalAmount,
                        payments: [{ amount: data.paidAmount || data.totalAmount, method: "WhatsApp" }]
                    });
                    await newSale.save();
                    const bal = newSale.totalAmount - (data.paidAmount || data.totalAmount);
                    let reply = `✅ *Got it! Record Saved.* \n\n${getRandom(HUMANIZE.success)} \nI've logged *₦${data.totalAmount.toLocaleString()}* for ${data.customerName}.`;
                    if (bal > 0) reply += `\n⏳ They still owe you *₦${bal.toLocaleString()}*.`;
                    reply += `\n\n🔗 *Invoice Link:* ${FRONTEND_URL}/i/${newSale.invoiceNumber}`;
                    return await sendReply(from, reply);
                } else {
                    // Still missing something?
                    await session.save();
                    if (!data.customerName || data.customerName === "Someone") {
                        return await sendReply(from, "And who is the customer buying from you? 👤");
                    }
                }
            }
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
        } else if (lowerText.includes("complain") || lowerText.includes("issue") || lowerText.includes("report") || lowerText.includes("problem") || lowerText.includes("help") || lowerText.includes("assist")) {
            // 1. Check if we have a pre-answered question first
            const matchedFAQ = KREDDY_FAQS.find(faq =>
                faq.keywords.some(k => lowerText.includes(k))
            );

            if (matchedFAQ) {
                return await sendReply(from, `💡 *I might have the answer to that!* \n\n${matchedFAQ.answer} \n\n_If you still need help, tell me exactly what the "problem" is and I'll notify the team!_`);
            }

            // 2. Handle Direct Complaints via Kreddy (Create Dashboard Ticket)
            const newTicket = new SupportTicket({
                userId: profile.ownerId,
                businessId: profile._id,
                message: text,
                status: "open"
            });
            await newTicket.save();

            // Create notification for Admin/System
            await Notification.create({
                businessId: profile._id,
                title: "Support Ticket Logged 🛡️",
                message: `You started a conversation with support via WhatsApp. Ticket #${newTicket._id.toString().slice(-6)} is now open.`,
                type: "system"
            });

            await logActivity({
                businessId: profile._id,
                action: "SUPPORT_TICKET_CREATED",
                details: `Complaint received via WhatsApp: "${text.substring(0, 30)}..."`,
                entityType: "WHATSAPP"
            });

            await sendReply(from, "🛡️ *Security Protocol Triggered*\n\nI couldn't find a quick answer, so I've logged your concern as an *Official Ticket* (#" + newTicket._id.toString().slice(-6) + "). \n\nIt's already visible in your **Dashboard Support Hub**, and the founder has been notified. We'll get back to you here ASAP! 🚀");
        } else {
            // Natural Language Processing (Kreddy's Brain)
            let cleanText = text.replace(/,/g, '').replace(/(\d+)k\b/gi, (m, p) => parseInt(p) * 1000);
            let totalAmount = 0, paidAmount = 0, customerName = "Customer", description = text;

            // Common transaction words to ignore when looking for names
            const stopWords = ['sold', 'bought', 'paid', 'received', 'for', 'to', 'from', 'and', 'the', 'a', 'an', 'in', 'at', 'with'];

            // 1. Extract Amounts
            const nums = cleanText.match(/\d+/g);
            if (nums && nums.length >= 1) {
                // Look for amount specifically after "for" or "at"
                const priceMatch = cleanText.match(/(?:for|at|recorded|costing)\s*(\d+)/i) || cleanText.match(/(\d+)\s*(?:naira|ngn|n)/i);
                totalAmount = priceMatch ? parseFloat(priceMatch[priceMatch.length - 1]) : parseFloat(nums[0]);

                // If there's a second number, it's likely the paid amount (e.g., "paid 5k")
                const paidMatch = cleanText.match(/(?:paid|received|downpayment|giving)\s*(\d+)/i);
                paidAmount = paidMatch ? parseFloat(paidMatch[1]) : (nums.length >= 2 ? parseFloat(nums[1]) : totalAmount);
            }

            // 2. Extract Name (Look after "to", "from", or "for")
            const namePattern = /(?:to|from|for|by)\s+([a-z]+(?:\s+[a-z]+)*)/i;
            const nameMatch = text.match(namePattern);
            if (nameMatch) {
                const potentialName = nameMatch[1].trim();
                const words = potentialName.split(/\s+/);
                // Filter out stop words and keep the first 2 words as the name
                const filtered = words.filter(w => !stopWords.includes(w.toLowerCase()));
                if (filtered.length > 0) {
                    customerName = filtered.slice(0, 2).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
                }
            }

            if (totalAmount) {
                const dueDate = extractDate(lowerText);
                const newSale = new Sale({
                    businessId: profile._id,
                    customerName,
                    description,
                    totalAmount,
                    payments: [{ amount: paidAmount, method: "WhatsApp" }],
                    dueDate
                });
                await newSale.save();

                await logActivity({
                    businessId: profile._id,
                    action: "WHATSAPP_SALE_CREATED",
                    entityType: "SALE",
                    entityId: newSale._id,
                    details: `Recorded sale of ₦${totalAmount.toLocaleString()} to ${customerName} via WhatsApp`
                });

                const bal = totalAmount - paidAmount;
                const link = `${FRONTEND_URL}/i/${newSale.invoiceNumber}`;

                // Kreddy Personality: Congratulate on big sales!
                const celebration = totalAmount >= 50000 ? "🔥 *Woah, that's a big one! Congrats!* 🥂\n\n" : "Great job on the sale! 🚀\n\n";

                let reply = `✅ *Got it! Record Saved.* (#${newSale.invoiceNumber})\n\n${celebration}I've logged *₦${totalAmount.toLocaleString()}* for ${customerName}.\n`;
                if (bal > 0) {
                    reply += `⏳ They still owe you *₦${bal.toLocaleString()}*`;
                    if (dueDate) reply += ` which I'll remind you about on *${dueDate.toLocaleDateString()}*.`;
                    else reply += `.`;
                }
                reply += `\n\n🔗 *Invoice Link:* ${link}`;

                await sendReply(from, reply);
            } else {
                // FALLBACK: Start a conversation if we didn't get enough info
                const potentialName = text.split(" ").slice(-2).join(" ");
                await WhatsAppSession.create({
                    whatsappNumber: cleanFrom,
                    type: 'collect_sale_info',
                    data: {
                        description: text,
                        customerName: "Someone"
                    },
                    expiresAt: new Date(Date.now() + 5 * 60 * 1000)
                });

                await sendReply(from, `I hear you, Chief! I'm trying to record that sale for you. 🚀\n\n*Quick questions:*\n1. Who did you sell to? 👤\n2. How much was the total amount? 💰\n\n_(You can just reply with the name or amount now!)_`);
            }
        }
    } catch (err) {
        console.error("WhatsApp Assistant Error:", err);
        await sendReply(from, "Ouch! Something went wrong on my end. 😵‍💫 Give me a moment to recover and try again, or check your dashboard for the record.");
    }
};
