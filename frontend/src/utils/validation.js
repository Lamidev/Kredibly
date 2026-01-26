export const isValidNigerianPhone = (phone) => {
    // Remove all non-digit characters except +
    const cleaned = phone.replace(/[^\d+]/g, '');
    
    // Regex for Nigerian numbers:
    // 0 followed by 7, 8, or 9 and then 0 or 1, and 8 more digits (Total 11)
    // OR +234/234 followed by 7, 8, or 9 and then 0 or 1, and 8 more digits
    const regex = /^(?:\+234|234|0)[789][01]\d{8}$/;
    
    return regex.test(cleaned);
};

export const formatPhoneForDB = (phone) => {
    let cleaned = phone.replace(/[^\d]/g, '');
    
    // If it starts with 0, replace with 234
    if (cleaned.startsWith('0')) {
        cleaned = '234' + cleaned.substring(1);
    }
    
    // If it starts with 234 and is 13 digits long, it's correct
    return cleaned;
};
