export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? "https://api.usekredibly.com/api" : "http://localhost:7050/api");

export const KREDDY_CONFIG = {
    // Kreddy WhatsApp Business Number
    PHONE_NUMBER: "2347071238658", 
    
    // The link format for deep linking
    getLink: (text = "Hi Kreddy") => `https://wa.me/2347071238658?text=${encodeURIComponent(text)}`
};

export default API_BASE_URL;
