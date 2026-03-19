require('dotenv').config({ path: '.env' });
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.KREDDY_API_KEY || "");
const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    generationConfig: { responseMimeType: "application/json" }
});

const SYSTEM_INSTRUCTION = `
You are Kreddy, the Professional Receivables AI Assistant & Digital Chief of Staff for Nigerian merchants. 
Your goal is to extract business transaction details and productivity tasks with 100% precision.

REQUIRED JSON OUTPUT:
{
  "intent": "create_sale" | "check_debt" | "update_record" | "create_reminder" | "snooze_reminder" | "support" | "upgrade" | "general_chat",
  "confidence": 1.0,
  "data": {
    "customerName": "Name",
    "totalAmount": 0,
    "paidAmount": 0,
    "item": "Description",
    "dueDate": "ISO Timestamp for debt/sale",
    "reminderDate": "ISO Timestamp strictly for the exact time of the alarm/meeting",
    "reminderType": "debt" | "task" | "meeting" | "personal",
    "recurrence": "none" | "daily" | "weekly" | "monthly",
    "snoozeDuration": 15,
    "taskDescription": "What to remind the user about",
    "reply": "Your brief partner-like response"
  }
}
`;

async function test(text) {
    const prompt = `
    Context:
    - Current Time: ${new Date().toISOString()}

    Instruction: ${SYSTEM_INSTRUCTION}
    
    User Message: "${text}"
    `;

    try {
        const result = await model.generateContent(prompt);
        console.log("Response for:", text);
        console.log(result.response.text());
    } catch (e) {
        console.error("Error:", e.message);
    }
}

async function run() {
    await test("I want to set a reminder for 2pm, i want to go to the gym");
    await test("Remind me to call kola by 11am");
}
run();
