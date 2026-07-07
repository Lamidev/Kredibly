/**
 * Invoice Creation Workflow Validators and Parsers
 */

class InvoiceEditParser {
    /**
     * Parses an inline edit message from the merchant.
     *
     * @param {string} text - Message text
     * @returns {Object|null} - { field, value } if successfully parsed, null otherwise
     */
    static parse(text) {
        if (!text) return null;
        const lowerInput = text.toLowerCase().trim();

        const nameMatch = lowerInput.match(/^(?:change\s+(?:the\s+)?(?:customer\s+)?name\s+to|customer\s+(?:name\s+)?is|name\s+is)\s+(.+)$/i);
        const priceMatch = lowerInput.match(/^(?:change\s+(?:the\s+)?(?:total\s+|price\s+)?(?:to|is)|(?:total|price|amount)\s+is|it\s+(?:cost|costs)|correct\s+price\s+is)\s+([\d,\.k m]+)$/i);
        const paidMatch = lowerInput.match(/^(?:change\s+(?:the\s+)?paid\s+(?:to|amount\s+to)|paid\s+is|she\s+paid|he\s+paid|they\s+paid|deposit\s+is)\s+([\d,\.k m]+)$/i);
        const itemMatch = lowerInput.match(/^(?:change\s+(?:the\s+)?(?:item|description)\s+to|item\s+is|description\s+is|product\s+is)\s+(.+)$/i);
        const phoneEditMatch = lowerInput.match(/^(?:change\s+(?:the\s+)?(?:phone|number|whatsapp)\s+(?:to|number\s+to)|phone\s+is|number\s+is|their\s+(?:number|phone)\s+is)\s+(.+)$/i);

        if (nameMatch) {
            return {
                field: "customerName",
                value: nameMatch[1].trim().replace(/\b\w/g, c => c.toUpperCase())
            };
        }

        if (priceMatch) {
            const val = this.parseAmountFromText(priceMatch[1]);
            if (val !== null) return { field: "totalAmount", value: val };
        }

        if (paidMatch) {
            const val = this.parseAmountFromText(paidMatch[1]);
            if (val !== null) return { field: "paidAmount", value: val };
        }

        if (itemMatch) {
            return {
                field: "item",
                value: itemMatch[1].trim()
            };
        }

        if (phoneEditMatch) {
            const spokenPhone = this.parseSpokenPhoneNumber(phoneEditMatch[1]);
            if (spokenPhone.length >= 10) {
                let cp = spokenPhone;
                if (cp.startsWith("0") && cp.length === 11) cp = "234" + cp.slice(1);
                return { field: "customerPhone", value: cp };
            }
        }

        return null;
    }

    static parseAmountFromText(raw) {
        if (!raw) return null;
        const s = raw.toLowerCase().replace(/,/g, "").trim();
        const numM = s.match(/^([\d\.]+)\s*(k|m|million|thousand)?$/);
        if (!numM) return null;
        let val = parseFloat(numM[1]);
        const suffix = numM[2] || "";
        if (suffix === "k" || suffix === "thousand") val *= 1000;
        else if (suffix === "m" || suffix === "million") val *= 1000000;
        return Math.round(val);
    }

    static parseSpokenPhoneNumber(text) {
        if (!text) return "";
        const directDigits = text.replace(/[^0-9]/g, "");
        if (directDigits.length >= 10) return directDigits;

        const spokenDigitMap = {
            zero: "0", oh: "0", o: "0",
            one: "1", two: "2", three: "3", four: "4", five: "5",
            six: "6", seven: "7", eight: "8", nine: "9"
        };

        const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/);
        let converted = "";
        for (const word of words) {
            if (spokenDigitMap[word] !== undefined) {
                converted += spokenDigitMap[word];
            } else if (/^\d+$/.test(word)) {
                converted += word;
            }
        }
        return converted;
    }
}

module.exports = { InvoiceEditParser };
