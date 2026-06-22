/**
 * Kredibly Invoice PDF Generator
 *
 * Builds a premium, professional invoice PDF with:
 *  - Merchant logo (fetched from logoUrl) in the header
 *  - Kredibly logo in the footer ("Powered by Kredibly")
 *  - Clean two-column meta block (FROM | BILL TO | DATES)
 *  - Properly column-aligned items table
 *  - Clear Subtotal / Amount Paid / Balance Due totals
 *  - No bank details or pay-online links on the PDF
 *
 * Uploads to Cloudinary and returns a publicly accessible URL.
 */

"use strict";

const path         = require("path");
const PDFDocument  = require("pdfkit");
const cloudinary   = require("cloudinary").v2;
const axios        = require("axios");

// ── Cloudinary config (env vars already set in index.js) ──────────────────────
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// ── Paths ─────────────────────────────────────────────────────────────────────
const KREDIBLY_LOGO = path.join(__dirname, "../assets/krediblyrevamped.png");
const FONT_REGULAR  = path.join(__dirname, "../assets/fonts/Roboto-Regular.ttf");
const FONT_BOLD     = path.join(__dirname, "../assets/fonts/Roboto-Bold.ttf");

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
    PURPLE:      "#6C63FF",
    PURPLE_DARK: "#4B44CC",
    DARK:        "#1A1A2E",
    GRAY:        "#888888",
    GRAY_LIGHT:  "#F5F5F7",
    GRAY_MID:    "#E2E2E8",
    GREEN:       "#1DB954",
    WHITE:       "#FFFFFF",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Format a phone number to always start with a plus prefix.
 */
const formatPhone = (phone) => {
    if (!phone) return "";
    let cleaned = String(phone).trim();
    if (!cleaned.startsWith("+") && cleaned.length > 0) {
        cleaned = "+" + cleaned;
    }
    return cleaned;
};

/**
 * Parse a description string to extract a potential quantity and clean item name.
 */
const parseDescription = (desc, totalAmount) => {
    if (!desc) return { name: "Services", quantity: 1, unitPrice: totalAmount };
    const match = desc.match(/^(\d+)\s*(?:pairs?\s+of|pcs?|pcs?\s+of|x|packs?\s+of|bags?\s+of|boxes?\s+of)?\s*(.+)$/i);
    if (match) {
        const quantity = parseInt(match[1], 10);
        let name = match[2].trim();
        if (name) {
            name = name.charAt(0).toUpperCase() + name.slice(1);
        }
        const unitPrice = quantity > 0 ? totalAmount / quantity : totalAmount;
        return { name, quantity, unitPrice };
    }
    return { name: desc, quantity: 1, unitPrice: totalAmount };
};

/**
 * Download a remote image and return it as a Buffer.
 * Returns null silently on any error.
 */
const fetchImageBuffer = async (url) => {
    if (!url || typeof url !== "string" || !url.startsWith("http")) return null;
    try {
        const res = await axios.get(url, {
            responseType: "arraybuffer",
            timeout: 8000,
            headers: { "User-Agent": "Kredibly-PDF/2.0" }
        });
        return Buffer.from(res.data);
    } catch (err) {
        console.warn(`⚠️  Could not fetch logo from ${url}: ${err.message}`);
        return null;
    }
};

/**
 * Draw a horizontal rule at a given Y.
 */
const rule = (doc, margin, pageW, y, color = C.GRAY_MID, width = 0.5) => {
    doc.moveTo(margin, y)
       .lineTo(pageW - margin, y)
       .strokeColor(color)
       .lineWidth(width)
       .stroke();
};

// ── Core PDF builder ──────────────────────────────────────────────────────────

/**
 * Generates an invoice PDF as a Buffer.
 * @param {Object} sale      Mongoose Sale document
 * @param {Object} business  Mongoose BusinessProfile document
 * @returns {Promise<Buffer>}
 */
const generateInvoicePDFBuffer = async (sale, business) => {
    // Pre-fetch the merchant logo (before the sync PDFDocument stream starts)
    const merchantLogoBuffer = await fetchImageBuffer(business?.logoUrl);

    return new Promise((resolve, reject) => {
        const doc     = new PDFDocument({ margin: 0, size: "A4", autoFirstPage: true });
        const buffers = [];

        doc.on("data",  (c) => buffers.push(c));
        doc.on("end",   ()  => resolve(Buffer.concat(buffers)));
        doc.on("error", reject);

        // Register custom fonts
        doc.registerFont("Roboto", FONT_REGULAR);
        doc.registerFont("Roboto-Bold", FONT_BOLD);

        // ── Page geometry ─────────────────────────────────────────────────────
        const PAGE_W   = doc.page.width;   // 595.28
        const PAGE_H   = doc.page.height;  // 841.89
        const MARGIN   = 48;
        const INNER_W  = PAGE_W - MARGIN * 2;

        // ── ACCENT BAR (top) ──────────────────────────────────────────────────
        doc.rect(0, 0, PAGE_W, 5).fill(C.PURPLE);

        // ── HEADER ZONE (y: 5 → 100) ─────────────────────────────────────────
        const HDR_Y  = 20;
        const HDR_H  = 80;

        // Merchant logo — left side
        const LOGO_MAX_W = 140;
        const LOGO_MAX_H = 52;

        if (merchantLogoBuffer) {
            try {
                doc.image(merchantLogoBuffer, MARGIN, HDR_Y, {
                    fit:    [LOGO_MAX_W, LOGO_MAX_H],
                    valign: "center"
                });
            } catch (_) {
                // Fallback to text if image fails
                doc.fillColor(C.DARK).font("Roboto-Bold").fontSize(18);
                doc.text(business?.displayName || "Business", MARGIN, HDR_Y + 18, { lineBreak: false });
            }
        } else {
            // No logo — render business name as styled text
            doc.fillColor(C.DARK).font("Roboto-Bold").fontSize(18);
            doc.text(business?.displayName || "Business", MARGIN, HDR_Y + 16, { lineBreak: false });
            if (business?.displayName) {
                doc.fillColor(C.GRAY).font("Roboto").fontSize(10);
                doc.text("Business", MARGIN, HDR_Y + 38, { lineBreak: false });
            }
        }

        // "INVOICE" heading — right side
        doc.fillColor(C.PURPLE).font("Roboto-Bold").fontSize(34);
        doc.text("INVOICE", MARGIN, HDR_Y + 4, { width: INNER_W, align: "right", lineBreak: false });

        // Invoice number below heading
        doc.fillColor(C.GRAY).font("Roboto").fontSize(12);
        doc.text(`#${sale.invoiceNumber || ""}`, MARGIN, HDR_Y + 46, { width: INNER_W, align: "right", lineBreak: false });

        // ── RULE ─────────────────────────────────────────────────────────────
        const RULE1_Y = HDR_Y + HDR_H;
        rule(doc, MARGIN, PAGE_W, RULE1_Y, C.PURPLE, 1.5);

        // ── META BLOCK (y: RULE1_Y+14 → +72) ────────────────────────────────
        const META_Y = RULE1_Y + 16;

        // ── Column 1: FROM ────────────────────────────────────────────────────
        const COL1_X = MARGIN;
        doc.fillColor(C.GRAY).font("Roboto-Bold").fontSize(8);
        doc.text("FROM", COL1_X, META_Y, { lineBreak: false });

        doc.fillColor(C.DARK).font("Roboto-Bold").fontSize(13);
        doc.text(business?.displayName || "Business", COL1_X, META_Y + 12, { lineBreak: false, width: 155 });

        if (business?.phoneNumber || business?.whatsappNumber) {
            doc.fillColor(C.GRAY).font("Roboto").fontSize(10);
            doc.text(formatPhone(business.phoneNumber || business.whatsappNumber), COL1_X, META_Y + 28, { lineBreak: false, width: 155 });
        }

        // ── Column 2: BILLED TO ───────────────────────────────────────────────
        const COL2_X = MARGIN + 175;
        doc.fillColor(C.GRAY).font("Roboto-Bold").fontSize(8);
        doc.text("BILLED TO", COL2_X, META_Y, { lineBreak: false });

        doc.fillColor(C.DARK).font("Roboto-Bold").fontSize(13);
        doc.text(sale.customerName || "Customer", COL2_X, META_Y + 12, { lineBreak: false, width: 155 });

        if (sale.customerPhone) {
            doc.fillColor(C.GRAY).font("Roboto").fontSize(10);
            doc.text(formatPhone(sale.customerPhone), COL2_X, META_Y + 28, { lineBreak: false, width: 155 });
        }

        // ── Column 3: DATES ───────────────────────────────────────────────────
        const COL3_X = MARGIN + 370;
        const issueDate = sale.createdAt
            ? new Date(sale.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })
            : new Date().toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
        const dueDate = sale.dueDate
            ? new Date(sale.dueDate).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })
            : "On Receipt";

        doc.fillColor(C.GRAY).font("Roboto-Bold").fontSize(8);
        doc.text("INVOICE DATE", COL3_X, META_Y, { lineBreak: false });

        doc.fillColor(C.DARK).font("Roboto-Bold").fontSize(11);
        doc.text(issueDate, COL3_X, META_Y + 12, { lineBreak: false });

        doc.fillColor(C.GRAY).font("Roboto-Bold").fontSize(8);
        doc.text("DUE DATE", COL3_X, META_Y + 32, { lineBreak: false });

        doc.fillColor(C.PURPLE).font("Roboto-Bold").fontSize(11);
        doc.text(dueDate, COL3_X, META_Y + 44, { lineBreak: false });

        // ── RULE ─────────────────────────────────────────────────────────────
        const RULE2_Y = META_Y + 72;
        rule(doc, MARGIN, PAGE_W, RULE2_Y, C.GRAY_MID, 0.75);

        // ── ITEMS TABLE ───────────────────────────────────────────────────────
        //
        //  Columns (left-edge x, width):
        //   DESC:  x=48,  w=330
        //   QTY:   x=390, w=60   (center-align text)
        //   TOTAL: x=468, w=79   (right-align text) → right edge = 547 = PAGE_W - MARGIN

        const T_DESC_X  = MARGIN;         const T_DESC_W  = 330;
        const T_QTY_X   = 390;            const T_QTY_W   = 60;
        const T_TOTAL_X = 468;            const T_TOTAL_W = PAGE_W - MARGIN - 468; // ~79

        const TBL_Y = RULE2_Y + 12;

        // Header band
        doc.rect(MARGIN, TBL_Y, INNER_W, 22).fill(C.GRAY_LIGHT);

        // Column headers — each is a SEPARATE call (no chaining) to respect absolute coords
        doc.fillColor(C.GRAY).font("Roboto-Bold").fontSize(9);
        doc.text("ITEM / DESCRIPTION",  T_DESC_X,          TBL_Y + 7, { width: T_DESC_W,  lineBreak: false });

        doc.fillColor(C.GRAY).font("Roboto-Bold").fontSize(9);
        doc.text("QTY",                 T_QTY_X,           TBL_Y + 7, { width: T_QTY_W,  align: "center", lineBreak: false });

        doc.fillColor(C.GRAY).font("Roboto-Bold").fontSize(9);
        doc.text("AMOUNT",              T_TOTAL_X,         TBL_Y + 7, { width: T_TOTAL_W, align: "right", lineBreak: false });

        // Build item rows (fallback to single row when items[] is empty)
        let items = sale.items && sale.items.length > 0
            ? sale.items
            : [];

        if (items.length === 0) {
            const parsed = parseDescription(sale.description, sale.totalAmount);
            items = [parsed];
        }

        let rowY = TBL_Y + 28;
        const ROW_H = 32;

        items.forEach((item, idx) => {
            const qty = item.quantity || 1;
            // Use totalAmount directly to avoid floating-point rounding errors
            // For single items, use totalAmount; for multi-item, use stored unitPrice * qty
            const lineTotal = items.length === 1
                ? sale.totalAmount
                : Math.round((item.unitPrice || 0) * qty);

            // Subtle alternating stripe
            if (idx % 2 === 1) {
                doc.rect(MARGIN, rowY - 4, INNER_W, ROW_H).fill("#FAFAFA");
            }

            doc.fillColor(C.DARK).font("Roboto-Bold").fontSize(11);
            doc.text(item.name || item.description || "Item", T_DESC_X, rowY + 2, { width: T_DESC_W, lineBreak: false });

            doc.fillColor(C.DARK).font("Roboto-Bold").fontSize(11);
            doc.text(String(qty), T_QTY_X, rowY + 2, { width: T_QTY_W, align: "center", lineBreak: false });

            doc.fillColor(C.DARK).font("Roboto-Bold").fontSize(11);
            doc.text(`NGN ${lineTotal.toLocaleString()}`, T_TOTAL_X, rowY + 2, { width: T_TOTAL_W, align: "right", lineBreak: false });

            rowY += ROW_H;
        });

        // ── TOTALS BLOCK ──────────────────────────────────────────────────────
        const paidAmount = (sale.payments || []).reduce((s, p) => s + (p.amount || 0), 0);
        const balance    = sale.totalAmount - paidAmount;

        // Thin rule above totals
        rowY += 8;
        rule(doc, MARGIN, PAGE_W, rowY, C.GRAY_MID, 0.5);
        rowY += 16;

        // Totals columns: label right-aligns to VALUE_LABEL_RIGHT, value right-aligns to right margin
        const TOT_LABEL_X = 300;
        const TOT_LABEL_W = 150;  // label takes 150 pt right-aligned
        const TOT_VALUE_X = 462;
        const TOT_VALUE_W = PAGE_W - MARGIN - TOT_VALUE_X; // ~85 pt

        /** Draw one totals row at current rowY, then advance. */
        const totalsRow = (label, value, labelColor, valueColor, fontSize = 11, bold = false) => {
            doc.fillColor(labelColor).font("Roboto").fontSize(fontSize);
            doc.text(label, TOT_LABEL_X, rowY, { width: TOT_LABEL_W, align: "right", lineBreak: false });

            doc.fillColor(valueColor).font(bold ? "Roboto-Bold" : "Roboto").fontSize(fontSize);
            doc.text(value, TOT_VALUE_X, rowY, { width: TOT_VALUE_W, align: "right", lineBreak: false });

            rowY += fontSize + 10;
        };

        // Subtotal
        totalsRow("Subtotal:", `NGN ${sale.totalAmount.toLocaleString()}`, C.GRAY, C.DARK, 11, true);

        // Amount Paid (only when a payment exists)
        if (paidAmount > 0) {
            totalsRow("Amount Paid:", `- NGN ${paidAmount.toLocaleString()}`, C.GRAY, C.GREEN, 11, true);
        }

        rowY += 10;

        // ── Balance Due — no box, clean text styling ───────────────────────────
        const balanceLabel = balance <= 0 ? "FULLY PAID" : "BALANCE DUE:";
        const balanceValue = balance <= 0 ? "✓ PAID" : `NGN ${balance.toLocaleString()}`;
        const balanceColor = balance <= 0 ? C.GREEN : C.PURPLE;

        // Thin accent rule
        doc.moveTo(TOT_LABEL_X - 12, rowY)
           .lineTo(PAGE_W - MARGIN, rowY)
           .strokeColor(balanceColor)
           .lineWidth(1.5)
           .stroke();
        rowY += 10;

        doc.fillColor(balanceColor).font("Roboto-Bold").fontSize(11);
        doc.text(balanceLabel, TOT_LABEL_X, rowY, { width: TOT_LABEL_W, align: "right", lineBreak: false });

        doc.fillColor(balanceColor).font("Roboto-Bold").fontSize(16);
        doc.text(balanceValue, TOT_VALUE_X, rowY - 3, { width: TOT_VALUE_W, align: "right", lineBreak: false });

        rowY += 28;

        // ── FOOTER ────────────────────────────────────────────────────────────
        // Sit footer snugly 24pt below the last content row — keeps invoice on one page
        const FOOTER_Y = rowY + 24;

        rule(doc, MARGIN, PAGE_W, FOOTER_Y - 10, C.GRAY_MID, 0.5);

        // Center the "Powered by [Logo]" block — larger branding
        const POWERED_BY_TEXT = "Powered by";
        doc.font("Roboto-Bold").fontSize(13);
        const textWidth = doc.widthOfString(POWERED_BY_TEXT);
        const LOGO_W = 110;
        const LOGO_H = 28;
        const GAP = 9;
        const TOTAL_BLOCK_W = textWidth + GAP + LOGO_W;
        const BLOCK_X = (PAGE_W - TOTAL_BLOCK_W) / 2;

        // Draw "Powered by" text
        doc.fillColor(C.GRAY).font("Roboto-Bold").fontSize(13);
        doc.text(POWERED_BY_TEXT, BLOCK_X, FOOTER_Y + 6, { lineBreak: false });

        // Draw Logo next to it
        try {
            doc.image(KREDIBLY_LOGO, BLOCK_X + textWidth + GAP, FOOTER_Y, {
                fit:    [LOGO_W, LOGO_H],
                valign: "center"
            });
        } catch (_) {
            // Fallback text if logo file not found
            doc.fillColor(C.PURPLE).font("Roboto-Bold").fontSize(13);
            doc.text("Kredibly", BLOCK_X + textWidth + GAP, FOOTER_Y + 6, { lineBreak: false });
        }

        doc.end();
    });
};

// ── Cloudinary upload ─────────────────────────────────────────────────────────

/**
 * Upload a PDF Buffer to Cloudinary and return the secure URL.
 * @param {Buffer} pdfBuffer
 * @param {string} invoiceNumber
 * @returns {Promise<string>} Cloudinary secure URL
 */
const uploadPDFToCloudinary = (pdfBuffer, invoiceNumber) => {
    return new Promise((resolve, reject) => {
        const publicId = `kredibly/invoices/${invoiceNumber.replace(/[^a-zA-Z0-9-]/g, "_")}`;
        const stream = cloudinary.uploader.upload_stream(
            {
                resource_type: "auto",
                public_id:     publicId,
                format:        "pdf",
                overwrite:     true,
                type:          "upload"
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result.secure_url);
            }
        );
        stream.end(pdfBuffer);
    });
};

/**
 * Generate invoice PDF and upload to Cloudinary.
 * Returns the download URL, or null on failure.
 */
const generateAndUploadInvoicePDF = async (sale, business) => {
    try {
        const buffer = await generateInvoicePDFBuffer(sale, business);
        const url    = await uploadPDFToCloudinary(buffer, sale.invoiceNumber || `inv_${sale._id}`);
        console.log(`📄 Invoice PDF uploaded: ${url}`);
        return url;
    } catch (err) {
        console.error("❌ PDF Generation/Upload Error:", err.message);
        return null;
    }
};

module.exports = { generateInvoicePDFBuffer, uploadPDFToCloudinary, generateAndUploadInvoicePDF };
