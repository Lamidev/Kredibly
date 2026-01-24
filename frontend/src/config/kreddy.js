export const KREDDY_CONFIG = {
    // TODO: Replace with the actual WhatsApp Business Number for Kreddy
    PHONE_NUMBER: "2347071238658", 
    
    // The link format for deep linking
    getLink: (text = "Hi Kreddy") => `https://wa.me/${KREDDY_CONFIG.PHONE_NUMBER}?text=${encodeURIComponent(text)}`
};
