const cloudinary = require("../config/cloudinary");
const fs = require('fs');
const path = require('path');

const splitStringIntoLines = (str, maxLen = 24) => {
    if (!str) return ["N/A"];
    if (str.length <= maxLen) return [str];
    
    const lines = [];
    let current = "";
    
    // Split by spaces, dashes, or underscores to preserve word boundaries
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

const renderDetailsRow = (label, value, y, maxLen = 24) => {
    const valStr = String(value || "N/A");
    const lines = splitStringIntoLines(valStr, maxLen);

    if (lines.length === 1) {
        return `
      <text x="45" y="${y}" fill="#6B7280" font-size="12" font-weight="500">${label}</text>
      <text x="455" y="${y}" fill="#111827" font-size="12" font-weight="600" text-anchor="end">${lines[0]}</text>`;
    }
    if (lines.length === 2) {
        return `
      <text x="45" y="${y}" fill="#6B7280" font-size="12" font-weight="500">${label}</text>
      <text x="455" y="${y - 5}" fill="#111827" font-size="11" font-weight="600" text-anchor="end">${lines[0]}</text>
      <text x="455" y="${y + 8}" fill="#111827" font-size="11" font-weight="600" text-anchor="end">${lines[1]}</text>`;
    }
    return `
      <text x="45" y="${y}" fill="#6B7280" font-size="12" font-weight="500">${label}</text>
      <text x="455" y="${y - 10}" fill="#111827" font-size="10" font-weight="600" text-anchor="end">${lines[0]}</text>
      <text x="455" y="${y + 1}" fill="#111827" font-size="10" font-weight="600" text-anchor="end">${lines[1]}</text>
      <text x="455" y="${y + 12}" fill="#111827" font-size="10" font-weight="600" text-anchor="end">${lines[2]}</text>`;
};

/**
 * Generates a branded payment confirmation image using dynamic SVG
 * and uploads it to Cloudinary, returning the PNG URL.
 */
const generatePaymentConfirmationCard = async ({
    businessName,
    merchantName, // backward compatibility
    invoiceNumber,
    amountPaid,
    reference,
    date,
    method,
    customerName,
    senderName // backward compatibility
}) => {
    try {
        const finalBusinessName = businessName || merchantName || "Merchant";
        const finalCustomerName = customerName || senderName || "Customer";
        const finalMethod = method || "Transfer";
        const finalDate = date || new Date();
        
        const formattedAmount = Number(amountPaid || 0).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const formattedDate = new Date(finalDate).toLocaleString("en-NG", {
            timeZone: "Africa/Lagos",
            day: "2-digit",
            month: "2-digit",
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

        const svgString = `
<svg width="500" height="670" viewBox="0 0 500 670" xmlns="http://www.w3.org/2000/svg">
 
  <!-- Background -->
  <rect width="500" height="670" fill="#F9FAFB"/>
 
  <!-- Light grey header -->
  <rect x="0" y="0" width="500" height="195" fill="#F3F4F6"/>
 
  <!-- Logo -->
  ${logoBase64 ? `<image href="${logoBase64}" x="165" y="22" width="170" height="46" preserveAspectRatio="xMidYMid meet"/>` : `<text x="250" y="55" fill="#111827" font-size="22" font-weight="800" text-anchor="middle">KREDIBLY</text>`}
 
  <!-- Business name + receipt label -->
  <text x="250" y="97" fill="#374151" font-size="13" font-weight="600" text-anchor="middle">Akinbyte Technologies Limited</text>
  <text x="250" y="115" fill="#6B7280" font-size="11" font-weight="500" text-anchor="middle" letter-spacing="0.5">E-receipt</text>
 
  <!-- Amount -->
  <text x="250" y="170" fill="#111827" font-size="34" font-weight="800" text-anchor="middle">&#x20A6;${formattedAmount}</text>
 
  <!-- Section label -->
  <text x="250" y="222" fill="#9CA3AF" font-size="10" font-weight="700" text-anchor="middle" letter-spacing="1.5">PAYMENT DETAILS</text>
 
  <!-- Dashed card -->
  <rect x="25" y="240" width="450" height="335" rx="14" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="1.5" stroke-dasharray="6,5"/>
 
  <!-- Row: Status -->
  <text x="45" y="278" fill="#6B7280" font-size="12" font-weight="500">Status</text>
  <rect x="350" y="262" width="86" height="22" rx="11" fill="#ECFDF5"/>
  <text x="393" y="277" fill="#10B981" font-size="11" font-weight="700" text-anchor="middle">Successful</text>
  <line x1="40" y1="296" x2="460" y2="296" stroke="#F3F4F6" stroke-width="1"/>
 
  <!-- Row: Payment Method -->
  ${renderDetailsRow("Payment Method", finalMethod, 325)}
  <line x1="40" y1="341" x2="460" y2="341" stroke="#F3F4F6" stroke-width="1"/>
 
  <!-- Row: Invoice Number -->
  ${renderDetailsRow("Invoice Number", invoiceNumber, 370)}
  <line x1="40" y1="386" x2="460" y2="386" stroke="#F3F4F6" stroke-width="1"/>
 
  <!-- Row: Paid To -->
  ${renderDetailsRow("Paid To", finalBusinessName, 415, 26)}
  <line x1="40" y1="431" x2="460" y2="431" stroke="#F3F4F6" stroke-width="1"/>
 
  <!-- Row: Paid By -->
  ${renderDetailsRow("Paid By", finalCustomerName, 460, 26)}
  <line x1="40" y1="476" x2="460" y2="476" stroke="#F3F4F6" stroke-width="1"/>
 
  <!-- Row: Date -->
  ${renderDetailsRow("Date", formattedDate, 505)}
  <line x1="40" y1="521" x2="460" y2="521" stroke="#F3F4F6" stroke-width="1"/>
 
  <!-- Row: Reference -->
  ${renderDetailsRow("Reference", reference || "N/A", 551, 22)}
 
  <!-- Footer date -->
  <text x="250" y="595" fill="#9CA3AF" font-size="11" font-weight="400" text-anchor="middle">${formattedDate}</text>
 
  <!-- Divider -->
  <line x1="80" y1="615" x2="420" y2="615" stroke="#E5E7EB" stroke-width="1"/>
 
  <!-- Support email -->
  <text x="250" y="638" fill="#9CA3AF" font-size="10" font-weight="400" text-anchor="middle">Questions? Contact us at <tspan fill="#4F46E5" font-weight="600">support@usekredibly.com</tspan></text>
 
</svg>
`.trim();

        const cleanInvoice = (invoiceNumber || "inv").replace(/[^a-zA-Z0-9-]/g, "_");
        const cleanRef = (reference || "ref").replace(/[^a-zA-Z0-9-]/g, "_");
        const publicId = `kredibly/receipts/${cleanInvoice}_${cleanRef}`;

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
