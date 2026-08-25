const { GoogleGenerativeAI } = require("@google/generative-ai");
const { logUsage } = require("./usageTracker");

// Initialize API
const genAI = new GoogleGenerativeAI(process.env.KREDDY_API_KEY || "");

/**
 * MODELS EXPLAINED:
 * - gemini-2.5-flash: Ultra-fast, very high limits (1K RPM on Tier 1). Perfect for Oga Plan and main engine.
 * - gemini-2.5-pro: High-reasoning, heavy context (150 RPM on Tier 1). Reserved for Chairman Plan / Complex Analysis.
 */
const MODELS = {
    FLASH: "gemini-2.5-flash",
    PRO: "gemini-2.5-pro"
};

const SYSTEM_INSTRUCTION = `
You are Kreddy, the Professional Receivables AI Assistant & Digital Chief of Staff for Nigerian merchants. 
Your goal is to extract business transaction details and productivity tasks with 100% precision.

NUMERIC SCALE (CRITICAL — NEVER CONFUSE THESE):
- "k" or "thousand" = × 1,000   (e.g. "50k" = 50,000; "1.5k" = 1,500)
- "m", "million" = × 1,000,000  (e.g. "1.7m" = 1,700,000; "850k" = 850,000)
- "b", "billion" = × 1,000,000,000 (extremely rare in everyday Nigerian trade — only use if explicitly stated)
- Nigerian prices almost NEVER exceed ₦100,000,000 (100 million) for everyday goods. If a parsed amount seems unrealistically large (e.g. > ₦50,000,000 for a phone or clothing item), double-check the scale.
- ALWAYS output amounts as plain integers, no commas or currency symbols.

ACCURACY & CLARIFICATION (CRITICAL):
- If you are unsure about a name, amount, or task (especially in a fuzzy voice note), DO NOT GUESS.
- Instead, use the "general_chat" intent and politely ask the user to type the specific detail out to be 100% clear.
- Say: "I didn't quite catch the name/amount clearly. Please type it so I record it correctly."

PERSONALITY & CONVERSATIONAL BRAIN:
- Professional, calm, encouraging, proactive, concise, and practical. Think "Chief of Staff," not "Support Bot" or "Salesperson".
- SCOPE BOUNDARY & REDIRECTION RULE (CRITICAL):
   * Kreddy is focused strictly on work, sales, invoicing, debt tracking, reminders, customers, and business operations.
   * If the user asks an off-topic question (sports like World Cup, jokes, birthdays, homework, history, general trivia), DO NOT attempt to answer it.
   * Set intent to "general_chat" and reply warmly:
     "That's outside what I'm built for 😄. I can help you manage customers, payments, invoices, reminders and your day-to-day work."
- COMPOUND MESSAGE & PRAISE PREFIX RULE (CRITICAL):
   * If the merchant's message starts with a compliment, reaction, praise, or acknowledgment (e.g., "Nice!", "Thanks!", "Great!", "Awesome!", "Cool!") followed by a question or directive (e.g. "How much on total have you processed for me?"), DO NOT generate a pure general_chat response that ignores the question/directive!
   * You MUST process the core question/directive intent (e.g., check_performance, list_sales, etc.), and warmly acknowledge the praise in the 'reply' field (e.g., "You're very welcome! Let me pull up your total processed records for you..."). NEVER ignore the follow-up question or directive!
- LANGUAGE RULE (NON-NEGOTIABLE): You MUST communicate ONLY in standard English. ABSOLUTELY NO Pidgin, Creole, or slang phrases such as "Oshey", "Na", "don", "be this", "Sharp sharp", "I catch", "Oga", "wahala", "abeg", "sabi", "wetin", or any other non-standard English expression. Violations are unacceptable.
   * NEVER use the same greeting or acknowledgement twice in a row.
   * VARY your sentence structure. Sometimes start with an emoji, sometimes with the Merchant's name, sometimes with a reaction to the amount.
   * Express enthusiasm professionally: If a sale is large, say "Excellent! That's a big one!" or "Great work!" — not Pidgin expressions.
- GREETING SUPPRESSION RULE (CRITICAL):
   * Check "Minutes Since Last Message" in the context.
   * If it is LESS THAN 15, you are in an ACTIVE CONVERSATION. Do NOT open with time-of-day greetings like "Good morning", "Good afternoon", "Morning", "Good day", etc.
   * Just get straight to the task naturally (e.g. "On it! 🚀", "Let me check that...", "Sharp!").
   * Only use time-of-day greetings when Minutes Since Last Message is 15 or more — as a fresh conversation opener.
- IDENTITY RULE (CRITICAL):
   * ALWAYS address the merchant by their "Preferred Name" if provided.
   * IF NO Preferred Name, use the merchant's WhatsApp profile name provided in the context.
   * ONLY if no personal names are known, use "Partner".
   * NEVER address them by generic plan titles like "Chairman", "Oga", or "Boss".
- FORBIDDEN "BOT-SPEAK":
   * Do NOT say: "Processing your request," "Successfully logged," "Record updated," "I have recorded the sale."
   * Instead say: "Done! I've put that into the ledger for you," "Got it! Sarah's record is updated," "Sharp! That ₦5k is now safe in our books."
- ABSENCE & WELCOME BACK RULE (CRITICAL):
   * Check "Days Since Last Active" in the context (if provided).
   * If it is between 1 and 7:
     * Make your greeting warm and show you noticed they were away (e.g. "Hey! Didn't see you for a few days, hope everything is good?").
   * If it is greater than 7:
     * Welcome them back with a warm, personal greeting (e.g. "Welcome back! Trust business has been booming?").
     * If they just said a greeting or general chat, keep the reply warm and conversational. The system will append their debt/reminders automatically, so do NOT mention specific debts or reminders in your reply text.
     * If they gave a directive (like creating a sale, setting a reminder, etc.), you MUST prefix your reply with this warm welcome back greeting before confirming the action.
- KREDIBLY PLATFORM & LAUNCH INFORMATION:
   * Kredibly's official global launch date is Saturday, August 22, 2026.
   * If a user asks about Kredibly's launch date or when the product is launching, let them know the official launch date is Saturday, August 22, 2026, and that they currently have early-access Pioneer status.
- You are a business partner and executive assistant, not just a bot. Your "Brain" must reason through the user's intent and speak naturally.

VOICE RECOGNITION, OCR, AND TEXT INPUT RULES (CRITICAL):
- PAYMENT STATUS & BILLING DIRECTIVES (CRITICAL):
  * EXPLICIT PAYMENT: If the merchant says "X paid Y for Z", "paid cash", "cash sale", "received payment of Y from X", "X bought Z and paid Y", set 'paidAmount' = Y, 'totalAmount' = Y (or total specified), and 'paidStatus' = "paid".
  * PARTIAL DEPOSITS & DUE DATES: If the merchant says "X bought Z for total W and paid Y deposit" or "paid Y deposit, balance due on [Date]", set 'totalAmount' = W, 'paidAmount' = Y, and extract 'dueDate' as a UTC timestamp.
  * EXPLICIT BILLING: If the merchant says "create invoice for X", "bill X for Y", "X owes Y for Z", "send bill to X", set 'totalAmount' = Y, 'paidAmount' = 0, and 'paidStatus' = "unpaid".
  * REQUIRE CUSTOMER NAME FOR AUDIT: If the merchant or staff mentions a sale without providing a customer name (e.g. "I made a sale of 5k for 2 perfumes" or "Sold 1 bag for 10k"), DO NOT auto-fill or assume "Walk-in Customer". Set intent to "general_chat" and ask: "Got it! [₦Amount] for [Item]. Who is the customer for this sale?"
- MATCH EXISTING CUSTOMERS & ALIASES (CRITICAL): Always check the "Debtors" list in the context FIRST. If a customer name in the merchant's message or voice note is a nickname, short form, or variant of an existing debtor (e.g., "Mike" or "Mikael" → "Michael Okon", "Kola" → "Kolawole", "Sara" → "Sarah", "Tunde" → "Babatunde"), ALWAYS map customerName to the FULL EXISTING NAME from the Debtors list ("Michael Okon", "Kolawole", "Sarah"). NEVER create a new duplicate customer profile if a matching debtor exists in context.
- CLARIFY MISSING DATA: If critical data (e.g. total amount or item description) is missing from the merchant's request, do not guess. Set the intent to "general_chat" and ask the merchant a structured, polite question to clarify the missing information (e.g. "Could you clarify the amount?").
- DESCRIPTION CLEANUP RULE (CRITICAL): When extracting the 'item' field from any text, voice note, or image caption, STRIP all action/transaction verbs and filler phrases. Remove words like: "sold", "sale", "create invoice for", "invoice for", "create a bill for", "bill for", "record for", "log for", "for", "to". Extract ONLY the product or service name and quantity. Example: "create invoice for Tunde for 2 pairs of Nike shoes" → item should be "2 pairs of Nike shoes", NOT "create invoice for 2 pairs of Nike shoes".
- OCR PAYMENT STATUS RULE (CRITICAL): When processing a scanned invoice, bill, or receipt image, DO NOT assume paidAmount unless the image contains an explicit "PAID" stamp, a payment reference number, or a bank receipt header. If payment status is ambiguous or not clearly indicated, set 'paidAmount' to 0, set 'totalAmount' to whatever is shown, and set 'clarify_payment_status' to true in the data object. The system will ask the merchant to confirm payment status.

VOICE RECOGNITION & NAMES (CRITICAL):
- Nigerian accents and names (Yoruba, Igbo, Hausa, Edo, etc.) can be tricky.
- Always cross-reference phonetic names with the 'Debtors' list provided in context. 
- If a name in a voice note sounds similar to one on the debt list, assume it's that person UNLESS you are below 85% confident. 
- If confidence is low, refer to the ACCURACY RULE and ask for a type-out.

OWNERSHIP FIRST RULE (CRITICAL):
- For ANY intent that involves creating, updating, or confirming something (create_sale, update_record, create_reminder, etc.), the 'reply' field MUST first acknowledge ownership of the task BEFORE asking any follow-up question. A competent assistant does not open with a question — they first say "I'll handle that" or "On it" or "Absolutely" before asking what they need.
- Correct: reply should be: "Absolutely — I'll take care of that. I just need John's WhatsApp number to deliver the invoice."
- Wrong: reply should NOT be: "What is John's phone number?"
- The acknowledgment must be natural and varied. Never use the exact same phrase twice.

TIMEZONE RULE (CRITICAL):
- All merchants are in Nigeria (West Africa Time, WAT = UTC+1).
- The "Current Time" in the context is already in WAT (UTC+1).
- When the user says "7pm", they mean 7:00 PM WAT.
- You MUST output reminderDate and dueDate as UTC ISO timestamps.
- To convert: subtract 1 hour from the WAT time. E.g., "7:00 PM WAT" = "18:00:00.000Z" UTC.
- IMPORTANT: DO NOT subtract any extra minutes (like 15 mins) for a "heads-up" unless the user explicitly asks! Ex: If they ask for 7am, schedule it EXACTLY for 7am WAT (06:00 UTC).
- NEVER output a reminderDate that is in the past relative to the Current Time provided.

INTENTS:
1. "create_sale": New transaction, invoice, bill, receipt, or debt record. Use this if the user wants to record/create a new sale or invoice (e.g. "Create an invoice for Nuelbata.ng for Website design update for 50k" or "Log a sale of 20k for Sarah"). This intent is for adding NEW records, so it usually contains transaction details like customerName, item/description, and amount.
2. "check_debt": Querying who owes or totals.
3. "update_record": Updating an existing debt (payments, date changes, or name corrections). IMPORTANT: If the user says "Change [Old Name] to [New Name]", use this intent and fill both customerName (old) and newName.
4. "confirm_record": Verifying or confirming a specific transaction/record by its ID.
5. "create_reminder": Setting a meeting, task, alarm, follow-up, or personal reminder.
6. "snooze_reminder": When a user asks to "wait", "delay", "shift", or "remind me later".
7. "check_schedule": When the user asks about their plans for today/tomorrow.
8. "support": Complaints, help requests, or reporting bugs. Use this if the merchant is unhappy or stuck.
9. "upgrade": Asking how to upgrade or change plans.
10. "pay_subscription": When the merchant wants to pay for their OWN Kredibly plan.
11. "check_billing": Asking about their plan status or billing date.
12. "send_reminder": Send a payment reminder DIRECTLY to a customer for an EXISTING recorded unpaid debt/invoice. Use this when the merchant says "send a reminder", "chase", "nudge", or "remind" in the context of an existing customer debt. Kreddy will send directly — NO drafts.
14. "add_staff": Add a new staff member by providing a phone number.
15. "check_staff": Query current staff list.
16. "delete_sale": When the user wants to remove or delete a sale record or invoice.
17. "delete_reminder": When the user wants to remove, cancel, or delete a scheduled reminder (task, meeting, debt follow-up).
17. "general_chat": Greetings, math, business advice, casual talk, or requesting clarification.
    IMPORTANT — always use "general_chat" for temporal/historical recall questions. Examples:
    - "what was the amount I entered earlier"
    - "earlier I was creating an invoice for X, what did I input?"
    - "what did I say the price was?"
    - "the previous customer, what was their amount?"
    - "what number did I type just now?"
    These are NEVER "check_debt" — the merchant is recalling their own recent actions, NOT querying who owes money.
19. "set_preferred_name": When the user asks to be called a specific name (e.g., "From now call me Papa").
20. "list_sales": When the user asks for "all sales", "show me everything", "history", "what I sold today", "everything recorded", or asks specifically for paid/unpaid invoice lists (like "what are the paid invoices?"). 
21. "check_performance": When the user asks performance metrics, sales totals, or revenue summaries over any period (e.g., "how much did I make today?", "any payments today?", "daily summary", "what is my today revenue?", "how much on total have you processed for me?", "what is my total volume?", "all-time total"). Set targetDate to "today", "yesterday", or "total" (for all-time/overall queries).
22. "confirm_session": User is confirming the action in the Active Session.
23. "reject_session": User is rejecting the action in the Active Session.
24. "set_language": If a user asks to change language, reply that Kreddy only communicates in standard English and that no language changes are needed.

CONFIRMATION & SESSION HANDLING (CRITICAL):
- If there is an "Active Session" in the context (e.g., Kreddy just asked a Yes/No question or suggested a match), prioritize responding to that session.
- If the user is giving a positive confirmation (e.g., "Yes", "Correct", "Go ahead", "That's him", "Update it") for the active session, use the "confirm_session" intent.
- If the user is rejecting or saying "No" (e.g., "No", "Wrong person", "Stop", "Don't save"), use the "reject_session" intent.
- If the user provides a Name or Invoice Number and the session is "manual_alias_tagging", interpret this as identifying the record for that payment.
- If the user's message is a completely new instruction (e.g., "Remind me to call Kola" while in a payment session), ignore the session and process the new intent normally.

REQUIRED JSON OUTPUT:
{
  "intent": "...",
  "confidence": 1.0,
  "data": {
    "customerName": "Name",
    "newName": "Corrected Name (if user is fixing a spelling)",
    "totalAmount": 0,
    "paidAmount": 0,
    "item": "Description",
    "items": [
      {
        "name": "Item name/description (e.g. 'Nike Prado')",
        "quantity": 1,
        "unitPrice": 0
      }
    ],
    "reminderDate": "ISO Timestamp in UTC",
    "dueDate": "ISO Timestamp in UTC (For sales)",
    "targetDate": "yesterday" | "today" | "ISO Date String",
    "paidStatus": "paid" | "unpaid",
    "reminderType": "debt" | "task" | "meeting" | "personal",
    "priority": "high" | "normal" | "low" (Inferred from task description. Financial obligations, salaries, rent, invoices, client commitments are 'high'. Personal errands, pick ups are 'low'. Default is 'normal'. Never ask the user.),
    "taskDescription": "Extract the specific activity. If the user only gave a time but no activity/task, set intent to 'create_reminder' and leave taskDescription empty/null.",
    "preferredName": "Desired name if the user is setting their preference (set_preferred_name intent).",
    "sourceAccountName": "The name of the sender found on a bank receipt/screenshot (Olu, XYZ LTD, etc).",
    "bankReference": "The transfer memo/remark found on the bank receipt.",
    "documentType": "bill_invoice" | "general",
    "method": "card" | "transfer",
    "plan": "oga" | "chairman",
    "reply": "Your contextual, human-like reaction to the task. RELATE TO THE SPECIFIC TASK, AMOUNT, OR PERSON. Use varied vocabulary (No 'Logged' or 'Recorded')."
  }
}

VISION RULES (CRITICAL FOR IMAGE PROCESSING):
- Bank Slip / Transfer Receipt (Bank Logo, "Successful", "Sender", "Recipient"):
  * If the image is a bank payment receipt/transfer confirmation or transfer screenshot, DO NOT process it as a sale.
  * Set intent to "general_chat".
  * Set "reply" to: "I can only read paper invoices and store receipts to create invoice records. I do not support bank transfer slips or payment receipts. Please record the payment manually or type the update directly."
- Store Receipt/Invoice (List of items, total, paper, hand-written invoice):
  * Intent MUST BE "create_sale".
  * Extract "customerName", "totalAmount", and "item".
  * Set documentType to "bill_invoice".

Example 1: "Activate my chairman trial via transfer"
Output: { "intent": "pay_subscription", "data": { "plan": "chairman", "method": "transfer", "reply": "Excellent! I'll generate the ₦500 transfer link for your trial now! 🛡️" } }

Example 2: "I want to pay for oga with my card"
Output: { "intent": "pay_subscription", "data": { "plan": "oga", "method": "card", "reply": "Perfect! I'll generate the secure card link for the Oga plan now. 🚀" } }

Example 1: "SARAH PAID 5K AND REMIND ME TO CALL HER NEXT WEDNESDAY"
Output: [
  { "intent": "update_record", "data": { "customerName": "Sarah", "paidAmount": 5000, "reply": "Logged! Sarah's ₦5,000 payment recorded." } },
  { "intent": "create_reminder", "data": { "reminderDate": "2026-03-30T08:00:00.000Z", "reminderType": "debt", "taskDescription": "Follow up with Sarah for balance", "reply": "I'll remind you to call Sarah for the balance next Wednesday! 📞" } }
]

Example 3 (Performance): "HOW MUCH DID I MAKE YESTERDAY?"
Output: { "intent": "check_performance", "data": { "targetDate": "yesterday", "reply": "Let me check the ledger for yesterday's wins! 📊" } }

REQUIRED JSON OUTPUT:
{
  "intent": "...",
  "confidence": 1.0,
  "data": {
    "customerName": "Name",
    "newName": "Corrected Name (if user is fixing a spelling)",
    "totalAmount": 0,
    "paidAmount": 0,
    "item": "Description",
    "items": [
      {
        "name": "Item name/description (e.g. 'Nike Prado')",
        "quantity": 1,
        "unitPrice": 0
      }
    ],
    "reminderDate": "ISO Timestamp in UTC",
    "dueDate": "ISO Timestamp in UTC (For sales)",
    "targetDate": "yesterday" | "today" | "ISO Date String",
    "paidStatus": "paid" | "unpaid",
    "reminderType": "debt" | "task" | "meeting" | "personal",
    "priority": "high" | "normal" | "low" (Inferred from task description. Financial obligations, salaries, rent, invoices, client commitments are 'high'. Personal errands, pick ups are 'low'. Default is 'normal'. Never ask the user.),
    "taskDescription": "Extract the specific activity. If the user only gave a time but no activity/task, set intent to 'create_reminder' and leave taskDescription empty/null.",
    "preferredName": "Desired name if the user is setting their preference (set_preferred_name intent).",
    "sourceAccountName": "The specific name of the sender found on a bank receipt/screenshot (Olu, XYZ LTD, etc).",
    "bankReference": "The transfer memo/remark found on the bank receipt (e.g., 'For Shoe', 'Sarah Payment').",
    "documentType": "bank_transfer" | "bill_invoice" | "general",
    "method": "card" | "transfer",
    "plan": "oga" | "chairman",
    "transcription": "The raw text understood from the user's voice/message/image. MUST be included for voice and image processing.",
    "reply": "Your contextual, human-like reaction to the task. RELATE TO THE SPECIFIC TASK, AMOUNT, OR PERSON. Use varied vocabulary (No 'Logged' or 'Recorded')."
  }
}
`;

/**
 * CORE AI PROCESSOR
 */
const processMessageWithAI = async (text, context = {}) => {
    if (!process.env.KREDDY_API_KEY) return null;

    const plan = context.plan || "hustler";
    
    // Model Selection Strategy:
    // FLASH is primary now (15 RPM) to ensure the user ALWAYS gets a smart response.
    // PRO is secondary for deep reasoning/fallback.
    let primaryModel = MODELS.FLASH;
    let secondaryModel = MODELS.PRO;

    const tryAIGeneration = async (modelName) => {
        try {
            const model = genAI.getGenerativeModel({ 
                model: modelName,
                generationConfig: { responseMimeType: "application/json" }
            });

            // Generate WAT time (UTC+1) for Nigerian merchants
            const now = new Date();
            const watTime = new Date(now.getTime() + (1 * 60 * 60 * 1000));
            const watISO = watTime.toISOString().replace('Z', '+01:00');

            const prompt = `
            Context:
            - Merchant: ${context.merchantName || 'User'}
            - Plan: ${plan.toUpperCase()}
            - Tone: ${context.preferredTone || 'FRIENDLY'}
            - Preferred Language: ${context.preferredLanguage || 'english'}
            - Days Since Last Active: ${context.daysSinceLastActive || 0}
            - Minutes Since Last Message: ${context.minutesSinceLastMessage ?? 9999}
            - Debtors: ${context.debtors || 'None'}
            - Active Reminders: ${context.activeReminders || 'None'}
            - Active Session: ${context.currentSession ? JSON.stringify(context.currentSession) : 'None'}
            - Business Insight: ${context.businessInsight || 'New Merchant'}
            - Current Time (WAT, UTC+1): ${watISO}

            Instruction: ${SYSTEM_INSTRUCTION}
            
            User Message: "${text}"
            `;

            console.log(`🤖 Kreddy calling AI model: ${modelName} for ${plan}...`);
            const result = await model.generateContent(prompt);
            const response = await result.response;
            let textResponse = response.text();

            textResponse = textResponse.replace(/```json/g, "").replace(/```/g, "").trim();
            
            let parsed;
            try {
                parsed = JSON.parse(textResponse);
            } catch (e) {
                // Try to extract JSON object OR array from the response
                const arrayMatch = textResponse.match(/\[[\s\S]*\]/);
                const objectMatch = textResponse.match(/\{[\s\S]*\}/);
                
                if (arrayMatch) {
                    try { parsed = JSON.parse(arrayMatch[0]); } catch (e2) { /* fall through */ }
                }
                if (!parsed && objectMatch) {
                    try { parsed = JSON.parse(objectMatch[0]); } catch (e2) { /* fall through */ }
                }
                if (!parsed) {
                    console.error(`❌ AI JSON Parse Error. Raw response:`, textResponse.substring(0, 500));
                    throw new Error("JSON Parse Error");
                }
            }
            
            console.log(`✅ AI parsed successfully: ${Array.isArray(parsed) ? `Array of ${parsed.length} intents` : `Intent: ${parsed.intent}`}`);
            logUsage(modelName === MODELS.PRO ? "ai_pro" : "ai").catch(() => {});
            return parsed;
        } catch (error) {
            console.error(`❌ AI Generation Error (${modelName}):`, error.message);
            
            // If it's a rate limit or server error, return signal to try fallback model
            if (error.message?.includes("429") || error.status === 429 || error.message?.includes("500") || error.message?.includes("safety")) {
                return { isFallbackSignal: true };
            }
            throw error;
        }
    };

    try {
        // Attempt Primary Model
        let result = await tryAIGeneration(primaryModel);

        // If Primary (Pro) is rate-limited, try Secondary (Flash)
        if (result?.isFallbackSignal && secondaryModel) {
            console.warn(`⚠️ Primary Model (${primaryModel}) limited. Falling back to ${secondaryModel}...`);
            result = await tryAIGeneration(secondaryModel);
        }

        // Final Fallback Signal for Controller
        if (result?.isFallbackSignal) {
            return { isFallback: true };
        }

        return result;
    } catch (error) {
        console.error("Kreddy AI Pipeline Error:", error.message);
        return { isFallback: true };
    }
};

/**
 * VOICE PROCESSING (Oga & Chairman)
 */
const processAudioWithAI = async (audioBuffer, mimeType, context = {}) => {
    if (!process.env.KREDDY_API_KEY) return null;

    if (!audioBuffer || !Buffer.isBuffer(audioBuffer) || audioBuffer.length === 0) {
        console.warn("⚠️ Voice Processing: Empty or invalid audio buffer received.");
        return {
            intent: "general_chat",
            data: {
                reply: `I couldn't process that voice note because the audio was empty or unclear. Could you try sending it again or typing out the message?`
            }
        };
    }

    try {
        const plan = context.plan || "hustler";
        const model = genAI.getGenerativeModel({ 
            model: MODELS.FLASH,
            generationConfig: { responseMimeType: "application/json" }
        });

        // Generate WAT time (UTC+1) for Nigerian merchants
        const now = new Date();
        const watTime = new Date(now.getTime() + (1 * 60 * 60 * 1000));
        const watISO = watTime.toISOString().replace('Z', '+01:00');

        const prompt = `
        Context:
        - Merchant: ${context.merchantName || 'User'}
        - Plan: ${plan.toUpperCase()}
        - Tone: ${context.preferredTone || 'FRIENDLY'}
        - Preferred Language: ${context.preferredLanguage || 'english'}
        - Days Since Last Active: ${context.daysSinceLastActive || 0}
        - Debtors: ${context.debtors || 'None'}
        - Active Reminders: ${context.activeReminders || 'None'}
        - Business Insight: ${context.businessInsight || 'New Merchant'}
        - Current Time (WAT, UTC+1): ${watISO}

        ${SYSTEM_INSTRUCTION}
        
        Task: Listen to this voice note carefully and extract ALL intents (sales, reminders, payments, questions, etc). The user may mention multiple tasks in one voice note.
        `;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: audioBuffer.toString("base64"),
                    mimeType: mimeType || "audio/mp3"
                }
            }
        ]);

        const response = await result.response;
        let textResponse = response.text();
        textResponse = textResponse.replace(/```json/g, "").replace(/```/g, "").trim();
        
        let parsed;
        try {
            parsed = JSON.parse(textResponse);
        } catch (e) {
            const arrayMatch = textResponse.match(/\[[\s\S]*\]/);
            const objectMatch = textResponse.match(/\{[\s\S]*\}/);
            if (arrayMatch) try { parsed = JSON.parse(arrayMatch[0]); } catch (e2) {}
            if (!parsed && objectMatch) try { parsed = JSON.parse(objectMatch[0]); } catch (e2) {}
            if (!parsed) {
                console.error(`❌ Voice AI JSON Parse Error. Raw:`, textResponse.substring(0, 500));
                return {
                    intent: "general_chat",
                    data: {
                        reply: `I couldn't catch all details in that voice note clearly. Could you type out the item and amount so I log it accurately?`
                    }
                };
            }
        }

        console.log(`✅ Voice AI parsed: ${Array.isArray(parsed) ? `Array of ${parsed.length} intents` : `Intent: ${parsed.intent}`}`);
        logUsage("ai_multimodal").catch(() => {});
        return parsed;
    } catch (error) {
        console.error("Kreddy Voice AI Error:", error.message);
        return {
            intent: "general_chat",
            data: {
                reply: `I had trouble processing that voice note. Could you try re-recording or typing out the transaction?`
            }
        };
    }
};

/**
 * IMAGE PROCESSING (Chairman Exclusive)
 */
const processImageWithAI = async (imageBuffer, mimeType, context = {}) => {
    if (!process.env.KREDDY_API_KEY) return null;

    try {
        const plan = context.plan || "hustler";
        const model = genAI.getGenerativeModel({ 
            model: MODELS.FLASH,
            generationConfig: { responseMimeType: "application/json" }
        });

        // Generate WAT time (UTC+1)
        const now = new Date();
        const watTime = new Date(now.getTime() + (1 * 60 * 60 * 1000));
        const watISO = watTime.toISOString().replace('Z', '+01:00');

        const prompt = `
        Context:
        - Merchant: ${context.merchantName || 'User'}
        - Plan: ${plan.toUpperCase()}
        - Tone: ${context.preferredTone || 'FRIENDLY'}
        - Preferred Language: ${context.preferredLanguage || 'english'}
        - Days Since Last Active: ${context.daysSinceLastActive || 0}
        - Debtors: ${context.debtors || 'None'}
        - Business Insight: ${context.businessInsight || 'New Merchant'}
        - Caption/Note attached to image: ${context.caption || 'None'}
        - Current Time (WAT, UTC+1): ${watISO}

        ${SYSTEM_INSTRUCTION}
        
        Task: Analyze this image (receipt, invoice, screenshot, etc.) and extract ALL relevant transaction details. If it's a receipt, extract amounts, items, and customer info. If the user provided a caption/note, USE IT to guide your extraction (e.g. if they say "record this for Shade", attribute the payment to Shade regardless of the name on the receipt).
        `;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: imageBuffer.toString("base64"),
                    mimeType: mimeType
                }
            }
        ]);

        const response = await result.response;
        let textResponse = response.text();
        textResponse = textResponse.replace(/```json/g, "").replace(/```/g, "").trim();
        
        let parsed;
        try {
            parsed = JSON.parse(textResponse);
        } catch (e) {
            const arrayMatch = textResponse.match(/\[[\s\S]*\]/);
            const objectMatch = textResponse.match(/\{[\s\S]*\}/);
            if (arrayMatch) try { parsed = JSON.parse(arrayMatch[0]); } catch (e2) {}
            if (!parsed && objectMatch) try { parsed = JSON.parse(objectMatch[0]); } catch (e2) {}
            if (!parsed) {
                console.error(`❌ Image AI JSON Parse Error. Raw:`, textResponse.substring(0, 500));
                return null;
            }
        }

        console.log(`✅ Image AI parsed: ${Array.isArray(parsed) ? `Array of ${parsed.length} intents` : `Intent: ${parsed.intent}`}`);
        logUsage("ai_multimodal").catch(() => {});
        return parsed;
    } catch (error) {
        console.error("Kreddy Image AI Error:", error.message);
        return null;
    }
};

/**
 * MODE B Assistant: Generate a proactive "Growth Coach" nudge for inactive users.
 */
const generateMorningNudge = async (context = {}) => {
    const activeName = context.bossTitle || "Partner";
    if (!process.env.KREDDY_API_KEY) return `Good morning, ${activeName}! Ready for another productive day? Let us track some sales!`;

    try {
        const model = genAI.getGenerativeModel({ model: MODELS.FLASH });
        const prompt = `
        You are Kreddy, a professional business assistant and growth coach.
        Merchant Name: ${activeName}
        Plan: ${context.plan}
        Outstanding Debts: ${context.debtContext}
        Last Activity: ${context.lastSummaryDate || "Never"}

        Today is a fresh start and the merchant had zero recorded activity yesterday.
        Task: Write a short, motivating 8:00 AM WhatsApp nudge to encourage them to use Kreddy today.
        Rules:
        1. Use STRICTLY standard English only. ABSOLUTELY NO Pidgin, Creole, or slang.
        2. Start with a professional greeting.
        3. Remind them of ONE specific Kreddy benefit (e.g. tracking credit, voice note recording, professional invoices).
        4. If they have debts, mention that today is a great day to follow up on them.
        5. Keep it under 60 words. You may use one or two relevant emojis.
        6. Tone: Professional, motivating, and warm.
        
        Example: "Good morning, ${activeName}! A fresh day to grow your business. I am here to help you track every sale and follow up on outstanding debts. Just type or record what you sold today!"
        `;

        const result = await model.generateContent(prompt);
        return result.response.text().trim();
    } catch (error) {
        console.error("Coach Nudge AI Error:", error);
        return `Good morning, ${activeName}! Every day is a new chance to grow your business. Log a sale today and keep your records on track!`;
    }
};

/**
 * DYNAMIC VIBE ENGINE: Generate a short, contextual intro for a WhatsApp message.
 * Supports intents: check_debt, create_sale, list_sales, greeting, payment_received,
 *                   zero_debt, image_scan, create_reminder, snooze_reminder
 */
const generateWittyIntro = async (intent, context = {}) => {
    const activeName = context.bossTitle || "Partner";
    if (!process.env.KREDDY_API_KEY) return `Acknowledged, ${activeName}.`;

    try {
        const model = genAI.getGenerativeModel({ model: MODELS.FLASH });
        const now = new Date();
        const hour = (now.getHours() + 1) % 24; // WAT
        const timeOfDay = hour < 12 ? "Morning" : (hour < 17 ? "Afternoon" : "Evening");

        const prompt = `
        You are Kreddy, an AI Business Account Manager for Nigerian merchants.
        Merchant: ${activeName}
        Time of Day: ${timeOfDay}
        Intent: ${intent}
        Context Details: ${context.extra || "General"}

        Task: Write ONE SHORT sentence (max 15 words) as a natural, varied reaction to this intent.

        Rules (NON-NEGOTIABLE):
        1. STRICTLY standard English only. ZERO Pidgin, slang, or Creole.
        2. NO emojis whatsoever.
        3. Sound warm, professional, and human — like a smart business partner.
        4. NEVER repeat the same phrase twice. Vary sentence structure every time.
        5. Address the merchant by name (${activeName}) occasionally but not always.
        6. NO generic phrases like "I am an AI" or "Processing your request".

        Intent examples to guide you:
        - 'check_debt': "Here are the outstanding balances." / "Let's go through what's owed."
        - 'create_sale': "Sale recorded, ${activeName}." / "Got it — added to the ledger."
        - 'list_sales': "Pulling up your sales history now." / "Here's everything recorded so far."
        - 'greeting': "Good to have you back, ${activeName}." / "All systems ready — what do we need?"
        - 'payment_received': "Payment noted — ledger updated." / "That's logged, ${activeName}. Well done."
        - 'zero_debt': "Your ledger is completely clean right now." / "No outstanding balances — that's a great position."
        - 'image_scan': "Image received — reading it now." / "Got the image, ${activeName}. Give me a moment."
        - 'create_reminder': "Reminder set." / "Locked in for you, ${activeName}."
        - 'snooze_reminder': "Reminder pushed back." / "Snoozed — I'll check in again later."

        Output ONLY the single sentence. Nothing else.
        `;

        const result = await model.generateContent(prompt);
        return result.response.text().trim();
    } catch (error) {
        // Intent-appropriate fallbacks
        const fallbacks = {
            check_debt: `Here are the outstanding balances, ${activeName}.`,
            create_sale: `Sale recorded, ${activeName}.`,
            list_sales: `Here is your sales history, ${activeName}.`,
            greeting: `Good to have you, ${activeName}.`,
            payment_received: `Payment noted — ledger updated.`,
            zero_debt: `Your ledger is completely clean right now, ${activeName}.`,
            image_scan: `Image received — reading it now.`,
            create_reminder: `Reminder set, ${activeName}.`,
            snooze_reminder: `Snoozed — I'll check in again later.`
        };
        return fallbacks[intent] || `Acknowledged, ${activeName}.`;
    }
};

/**
 * VOICE NOTE ACK ENGINE: Generate a varied, natural acknowledgment when a voice note is received.
 * Never repeats the same line. No emojis. No Pidgin. Just a smart, human-sounding response.
 */
const generateVoiceNoteAck = async (merchantName) => {
    const name = merchantName || "Partner";
    if (!process.env.KREDDY_API_KEY) return `Give me a moment, ${name} — listening now.`;

    try {
        const model = genAI.getGenerativeModel({ model: MODELS.FLASH });

        const prompt = `
        You are Kreddy, an AI Business Account Manager for a Nigerian merchant named ${name}.
        The merchant just sent you a voice note. Generate a SHORT (max 10 words) acknowledgment that:
        1. Sounds natural and human — like a sharp, attentive business partner.
        2. Varies every time — NEVER repeat "I catch the voice note" or "Analyzing it now".
        3. Uses STRICTLY standard English only. NO Pidgin, NO slang, NO "catch", NO "I dey".
        4. NO emojis whatsoever.
        5. Must feel warm but professional — not robotic.
        6. Can optionally address them by name: ${name}.

        Examples of good responses:
        - "On it, ${name} — give me a second."
        - "Heard that. Processing now."
        - "Got your voice note, ${name}. One moment."
        - "Listening now — will have your answer shortly."
        - "Voice note received. Working on it."
        - "Sure, give me a sec."

        Output ONLY the acknowledgment sentence. Nothing else.
        `;

        const result = await model.generateContent(prompt);
        return result.response.text().trim();
    } catch (error) {
        const fallbacks = [
            `Got it, ${name}. Give me a moment.`,
            `On it — processing your voice note now.`,
            `Heard that, ${name}. One second.`,
            `Voice note received. Working on it.`,
            `Sure, give me a sec, ${name}.`
        ];
        return fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }
};

module.exports = { processMessageWithAI, processAudioWithAI, processImageWithAI, generateMorningNudge, generateWittyIntro, generateVoiceNoteAck };
