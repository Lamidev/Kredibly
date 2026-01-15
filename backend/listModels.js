const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: 'C:/Users/AKINYEMI/Desktop/Lamidev/Project/Kredibly/backend/.env' });

const genAI = new GoogleGenerativeAI(process.env.KREDDY_API_KEY || "");

async function listModels() {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.KREDDY_API_KEY}`);
        const data = await response.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();
