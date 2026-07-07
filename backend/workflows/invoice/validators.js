/**
 * Invoice Creation Workflow Validators and Parsers
 *
 * NOTE: The V1 InvoiceEditParser.parse() regex command parser has been removed.
 * Field editing is now handled through guided button-driven steps (awaiting_edit_field
 * and awaiting_edit_value) in handlers.js. The static parsing helpers below remain
 * as they are used by the new handleEditValue() handler.
 */

class InvoiceEditParser {
    /**
     * Parse a currency amount from free text.
     * Supports: "15k", "200,000", "2m", "150000", "1.5k"
     *
     * @param {string} raw
     * @returns {number|null}
     */
    static parseAmountFromText(raw) {
        if (!raw) return null;
        const s = raw.toLowerCase().replace(/,/g, "").replace(/₦/g, "").trim();
        const numM = s.match(/^([\d\.]+)\s*(k|m|million|thousand)?$/);
        if (!numM) return null;
        let val = parseFloat(numM[1]);
        const suffix = numM[2] || "";
        if (suffix === "k" || suffix === "thousand") val *= 1000;
        else if (suffix === "m" || suffix === "million") val *= 1000000;
        return Math.round(val);
    }

    /**
     * Parse a Nigerian phone number from free text, including spoken digits.
     * Returns E.164 digits (no leading +) or empty string if unparseable.
     *
     * @param {string} text
     * @returns {string}
     */
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
