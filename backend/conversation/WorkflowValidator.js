const chrono = require("chrono-node");

class WorkflowValidator {
    /**
     * Validate input against step configuration.
     *
     * @param {string} text            - Raw message text body
     * @param {string} buttonId        - Tapped button ID (if interactive/button message)
     * @param {Object} stepConfig      - Configuration of the current step
     * @returns {Object}               - { isValid: boolean, parsedValue: any, feedback: string|null }
     */
    static validate(text, buttonId, stepConfig) {
        if (!stepConfig) {
            return { isValid: true, parsedValue: text, feedback: null };
        }

        const accepted = stepConfig.acceptedInputs || ["any"];

        // 1. Button tap (matched against specific buttons if declared)
        if (accepted.includes("button_tap") && buttonId) {
            if (stepConfig.buttons && stepConfig.buttons.length > 0) {
                const isValidButton = stepConfig.buttons.some(btn => btn.id === buttonId || buttonId.startsWith(btn.id + ":"));
                if (isValidButton) {
                    return { isValid: true, parsedValue: buttonId, feedback: null };
                }
            } else {
                return { isValid: true, parsedValue: buttonId, feedback: null };
            }
        }

        // 2. Phone number parsing
        if (accepted.includes("phone")) {
            const phone = this.parsePhone(text);
            if (phone && phone.length >= 10) {
                return { isValid: true, parsedValue: phone, feedback: null };
            }
        }

        // 3. Yes/No confirmation synonyms
        if (accepted.includes("yes_no_confirmation")) {
            const lower = text.toLowerCase().trim();
            const isYes = ["yes", "y", "confirm", "correct", "true", "sure", "do it", "go ahead", "sharp"].includes(lower);
            const isNo = ["no", "n", "wrong", "stop", "cancel", "reject"].includes(lower);
            if (isYes) {
                return { isValid: true, parsedValue: "yes", feedback: null };
            }
            if (isNo) {
                return { isValid: true, parsedValue: "no", feedback: null };
            }
        }

        // 4. Date and duration parsing
        if (accepted.includes("date")) {
            const parsedDate = chrono.parseDate(text);
            if (parsedDate && parsedDate > new Date()) {
                return { isValid: true, parsedValue: parsedDate, feedback: null };
            }
        }

        // 5. Currency / numeric amount parsing
        if (accepted.includes("currency")) {
            const amount = this.parseAmount(text);
            if (amount !== null && amount > 0) {
                return { isValid: true, parsedValue: amount, feedback: null };
            }
        }

        // 6. Loose text / any input fallback
        if (accepted.includes("any") || accepted.includes("text")) {
            if (text && text.trim().length > 0) {
                return { isValid: true, parsedValue: text.trim(), feedback: null };
            }
        }

        // 7. General button tap fallback
        if (accepted.includes("button_tap") && buttonId) {
            return { isValid: true, parsedValue: buttonId, feedback: null };
        }

        // --- Rejection Re-prompt Construction ---
        if (accepted.includes("phone")) {
            return { 
                isValid: false, 
                parsedValue: null, 
                feedback: "That doesn't look like a valid phone number. Please reply with a valid phone number (e.g. 08012345678)." 
            };
        }
        if (accepted.includes("date")) {
            return { 
                isValid: false, 
                parsedValue: null, 
                feedback: "I couldn't understand that date/time or it's in the past. Please reply with a valid future date (e.g. '5pm today' or 'Friday 10am')." 
            };
        }
        if (accepted.includes("currency")) {
            return { 
                isValid: false, 
                parsedValue: null, 
                feedback: "Please enter a valid amount (e.g. 50k, 15000, or 2.5m)." 
            };
        }
        if (accepted.includes("yes_no_confirmation")) {
            return { 
                isValid: false, 
                parsedValue: null, 
                feedback: "Please confirm by replying 'yes' or 'no', or tap one of the buttons." 
            };
        }

        return {
            isValid: false,
            parsedValue: null,
            feedback: "I didn't quite catch that. Please check your input and try again."
        };
    }

    static parsePhone(text) {
        if (!text) return null;
        const clean = text.replace(/\D/g, "");
        if (clean.length >= 10) return clean;
        return null;
    }

    static parseAmount(text) {
        if (!text) return null;
        const s = text.toLowerCase().replace(/,/g, '').trim();
        const numM = s.match(/^([\d\.]+)\s*(k|m|million|thousand)?$/);
        if (!numM) return null;
        let val = parseFloat(numM[1]);
        const suffix = numM[2] || '';
        if (suffix === 'k' || suffix === 'thousand') val *= 1000;
        else if (suffix === 'm' || suffix === 'million') val *= 1000000;
        return Math.round(val);
    }
}

module.exports = WorkflowValidator;
