const cloudinary = require("../config/cloudinary");
const fs = require('fs');
const path = require('path');

const escapeXml = (str) => {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
};

const splitStringIntoLines = (str, maxLen = 28) => {
    if (!str) return ["N/A"];
    if (str.length <= maxLen) return [str];
    
    const lines = [];
    let current = "";
    const parts = str.split(/([\s\-_])/);
    
    for (const part of parts) {
        if ((current + part).length > maxLen) {
            if (current) {
                lines.push(current);
                current = part;
            } else {
                lines.push(part.slice(0, maxLen));
                current = part.slice(maxLen);
            }
        } else {
            current += part;
        }
    }
    if (current) {
        lines.push(current);
    }
    return lines;
};

const renderDetailsRow = (label, value, y, maxLen = 28, valueColor = "#0F172A") => {
    const valStr = escapeXml(String(value || "N/A"));
    const lines = splitStringIntoLines(valStr, maxLen);

    if (lines.length === 1) {
        return `
      <text x="50" y="${y}" fill="#475569" font-size="13" font-weight="500" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">${escapeXml(label)}</text>
      <text x="470" y="${y}" fill="${valueColor}" font-size="13" font-weight="600" text-anchor="end" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">${lines[0]}</text>`;
    }
    if (lines.length === 2) {
        return `
      <text x="50" y="${y}" fill="#475569" font-size="13" font-weight="500" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">${escapeXml(label)}</text>
      <text x="470" y="${y - 6}" fill="${valueColor}" font-size="12" font-weight="600" text-anchor="end" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">${lines[0]}</text>
      <text x="470" y="${y + 10}" fill="${valueColor}" font-size="12" font-weight="600" text-anchor="end" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">${lines[1]}</text>`;
    }
    return `
      <text x="50" y="${y}" fill="#475569" font-size="13" font-weight="500" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">${escapeXml(label)}</text>
      <text x="470" y="${y - 12}" fill="${valueColor}" font-size="11" font-weight="600" text-anchor="end" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">${lines[0]}</text>
      <text x="470" y="${y + 2}" fill="${valueColor}" font-size="11" font-weight="600" text-anchor="end" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">${lines[1]}</text>
      <text x="470" y="${y + 16}" fill="${valueColor}" font-size="11" font-weight="600" text-anchor="end" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">${lines[2]}</text>`;
};

/**
 * Generates a branded payment confirmation image using dynamic SVG
 * and uploads it to Cloudinary, returning the PNG URL.
 */
const generatePaymentConfirmationCard = async ({
    businessName,
    merchantName,
    invoiceNumber,
    amountPaid,
    balance = 0,
    reference,
    date,
    method,
    customerName,
    senderName,
    bankName,
    beneficiaryAccountNumber
}) => {
    try {
        const finalBusinessName = businessName || merchantName || "Merchant";
        const finalCustomerName = customerName || senderName || "Customer";
        const finalMethod = method || "Bank Transfer";
        const finalDate = date || new Date();
        const numBalance = Number(balance || 0);
        const isFullyPaid = numBalance <= 0;
        
        const formattedAmount = Number(amountPaid || 0).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const formattedBalance = numBalance.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        
        const formattedDate = new Date(finalDate).toLocaleString("en-NG", {
            timeZone: "Africa/Lagos",
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
        });

        // Load Kredibly Revamped logo and encode as base64
        let logoBase64 = "";
        try {
            const logoPath = path.resolve(__dirname, "../assets/krediblyrevamped.png");
            if (fs.existsSync(logoPath)) {
                const logoBuffer = fs.readFileSync(logoPath);
                logoBase64 = `data:image/png;base64,${logoBuffer.toString("base64")}`;
            }
        } catch (err) {
            console.error("⚠️ Failed to load logo from local path:", err.message);
        }

        const statusText = isFullyPaid ? "Fully Paid" : "Partial Payment";
        const statusBg = isFullyPaid ? "#DCFCE7" : "#FEF3C7";
        const statusColor = isFullyPaid ? "#15803D" : "#B45309";

        const svgString = `
<svg width="520" height="740" viewBox="0 0 520 740" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="cardShadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#0F172A" flood-opacity="0.06"/>
    </filter>
  </defs>

  <!-- Background Canvas -->
  <rect width="520" height="740" fill="#F8FAFC"/>

  <!-- Top Decorative Header Band -->
  <rect x="0" y="0" width="520" height="215" fill="#EEF2F6"/>

  <!-- Logo -->
  ${logoBase64 ? `<image href="${logoBase64}" x="175" y="24" width="170" height="46" preserveAspectRatio="xMidYMid meet"/>` : `<text x="260" y="55" fill="#0F172A" font-size="24" font-weight="800" text-anchor="middle" font-family="-apple-system, sans-serif">KREDIBLY</text>`}

  <!-- Business Header -->
  <text x="260" y="98" fill="#1E293B" font-size="14" font-weight="700" text-anchor="middle" font-family="-apple-system, sans-serif">${escapeXml(finalBusinessName)}</text>
  <text x="260" y="117" fill="#64748B" font-size="11" font-weight="600" text-anchor="middle" letter-spacing="1" font-family="-apple-system, sans-serif">OFFICIAL PAYMENT RECEIPT</text>

  <!-- Amount Display -->
  <text x="260" y="176" fill="#0F172A" font-size="36" font-weight="800" text-anchor="middle" font-family="-apple-system, sans-serif">&#x20A6;${formattedAmount}</text>

  <!-- Section Title -->
  <text x="260" y="238" fill="#94A3B8" font-size="11" font-weight="700" text-anchor="middle" letter-spacing="1.5" font-family="-apple-system, sans-serif">TRANSACTION DETAILS</text>

  <!-- Main Card -->
  <rect x="25" y="254" width="470" height="405" rx="16" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5" filter="url(#cardShadow)"/>

  <!-- Row 1: Status Badge -->
  <text x="50" y="296" fill="#475569" font-size="13" font-weight="500" font-family="-apple-system, sans-serif">Payment Status</text>
  <rect x="345" y="278" width="125" height="26" rx="13" fill="${statusBg}"/>
  <text x="407" y="295" fill="${statusColor}" font-size="11" font-weight="700" text-anchor="middle" font-family="-apple-system, sans-serif">✓ ${statusText}</text>
  <line x1="45" y1="316" x2="475" y2="316" stroke="#F1F5F9" stroke-width="1.5"/>

  <!-- Row 2: Invoice Number -->
  ${renderDetailsRow("Invoice Number", `#${invoiceNumber || "N/A"}`, 345, 28, "#4F46E5")}
  <line x1="45" y1="365" x2="475" y2="365" stroke="#F1F5F9" stroke-width="1.5"/>

  <!-- Row 3: Paid To (Merchant) -->
  ${renderDetailsRow("Paid To", finalBusinessName, 394, 26)}
  <line x1="45" y1="414" x2="475" y2="414" stroke="#F1F5F9" stroke-width="1.5"/>

  <!-- Row 4: Paid By (Customer) -->
  ${renderDetailsRow("Paid By", finalCustomerName, 443, 26)}
  <line x1="45" y1="463" x2="475" y2="463" stroke="#F1F5F9" stroke-width="1.5"/>

  <!-- Row 5: Method & Channel -->
  ${renderDetailsRow("Payment Channel", finalMethod, 492, 28)}
  <line x1="45" y1="512" x2="475" y2="512" stroke="#F1F5F9" stroke-width="1.5"/>

  <!-- Row 6: Outstanding Balance (if any) or Reference -->
  ${!isFullyPaid 
      ? `${renderDetailsRow("Outstanding Balance", `₦${formattedBalance}`, 541, 28, "#DC2626")}<line x1="45" y1="561" x2="475" y2="561" stroke="#F1F5F9" stroke-width="1.5"/>${renderDetailsRow("Reference", reference || "N/A", 590, 24, "#64748B")}`
      : `${renderDetailsRow("Balance Due", "₦0.00 (Cleared)", 541, 28, "#16A34A")}<line x1="45" y1="561" x2="475" y2="561" stroke="#F1F5F9" stroke-width="1.5"/>${renderDetailsRow("Reference", reference || "N/A", 590, 24, "#64748B")}`
  }
  <line x1="45" y1="610" x2="475" y2="610" stroke="#F1F5F9" stroke-width="1.5"/>

  <!-- Row 7: Date & Time -->
  ${renderDetailsRow("Date &amp; Time", formattedDate, 638, 30)}

  <!-- Footer Info -->
  <text x="260" y="688" fill="#94A3B8" font-size="11" font-weight="500" text-anchor="middle" font-family="-apple-system, sans-serif">Secured by Kredibly • Akinbyte Technologies Limited</text>
  <text x="260" y="708" fill="#94A3B8" font-size="10" font-weight="400" text-anchor="middle" font-family="-apple-system, sans-serif">Questions? Contact <tspan fill="#4F46E5" font-weight="600">support@usekredibly.com</tspan></text>
</svg>
`.trim();

        const cleanInvoice = (invoiceNumber || "inv").replace(/[^a-zA-Z0-9-]/g, "_");
        const cleanRef = (reference || "ref").replace(/[^a-zA-Z0-9-]/g, "_");
        const publicId = `kredibly/receipts/${cleanInvoice}_${cleanRef}_${Date.now()}`;

        const base64Data = Buffer.from(svgString).toString("base64");
        const uploadResult = await cloudinary.uploader.upload(`data:image/svg+xml;base64,${base64Data}`, {
            resource_type: "image",
            public_id: publicId,
            overwrite: true,
            format: "png"
        });

        console.log(`📸 Cloudinary confirmation card generated: ${uploadResult.secure_url}`);
        return uploadResult.secure_url;
    } catch (err) {
        console.error("❌ Failed to generate confirmation card image:", err);
        return null;
    }
};

module.exports = {
    generatePaymentConfirmationCard
};
