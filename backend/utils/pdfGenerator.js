/**
 * Kredibly Invoice PDF Generator
 * Uses pdfkit to build clean, professional invoice PDFs
 * and uploads them to Cloudinary for shareable URLs.
 */

const PDFDocument = require("pdfkit");
const cloudinary = require("cloudinary").v2;

// Configure Cloudinary (uses env vars set in index.js / .env)
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Generates an invoice PDF as a Buffer from a Sale document.
 * @param {Object} sale - The Sale mongoose document
 * @param {Object} business - The BusinessProfile mongoose document
 * @returns {Promise<Buffer>} PDF buffer
 */
const generateInvoicePDFBuffer = (sale, business) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50, size: "A4" });
        const buffers = [];

        doc.on("data", (chunk) => buffers.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(buffers)));
        doc.on("error", reject);

        const PRIMARY = "#1A1A2E";
        const ACCENT = "#6C63FF";
        const LIGHT_GRAY = "#F7F7F7";
        const TEXT_GRAY = "#666666";
        const APP_URL = process.env.FRONTEND_URL || "https://usekredibly.com";

        // ── HEADER BAR ───────────────────────────────────────────────────────
        doc.rect(0, 0, doc.page.width, 80).fill(ACCENT);
        doc.fillColor("white")
            .fontSize(22)
            .font("Helvetica-Bold")
            .text("INVOICE", 50, 28, { align: "left" });
        doc.fontSize(10)
            .font("Helvetica")
            .text(`#${sale.invoiceNumber || ""}`, 50, 54, { align: "left" });

        // Business name on right side of header
        const bizName = business?.displayName || "Kredibly Business";
        doc.fontSize(14)
            .font("Helvetica-Bold")
            .text(bizName, 0, 28, { align: "right", width: doc.page.width - 50 });
        doc.fontSize(9)
            .font("Helvetica")
            .text("Powered by Kredibly", 0, 50, { align: "right", width: doc.page.width - 50 });

        // ── INVOICE META ─────────────────────────────────────────────────────
        doc.fillColor(PRIMARY).fontSize(10).font("Helvetica");

        const metaY = 100;
        // Left: billed to
        doc.fontSize(8).fillColor(TEXT_GRAY).text("BILLED TO", 50, metaY);
        doc.fontSize(11).fillColor(PRIMARY).font("Helvetica-Bold")
            .text(sale.customerName || "Customer", 50, metaY + 15);
        if (sale.customerPhone) {
            doc.fontSize(9).font("Helvetica").fillColor(TEXT_GRAY)
                .text(sale.customerPhone, 50, metaY + 30);
        }

        // Right: dates
        const issueDate = sale.createdAt ? new Date(sale.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : new Date().toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
        const dueDate = sale.dueDate ? new Date(sale.dueDate).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "On Receipt";

        doc.fontSize(8).fillColor(TEXT_GRAY).text("INVOICE DATE", 350, metaY, { width: 200 });
        doc.fontSize(10).fillColor(PRIMARY).font("Helvetica-Bold").text(issueDate, 350, metaY + 14, { width: 200 });
        doc.fontSize(8).fillColor(TEXT_GRAY).font("Helvetica").text("DUE DATE", 350, metaY + 35, { width: 200 });
        doc.fontSize(10).fillColor(ACCENT).font("Helvetica-Bold").text(dueDate, 350, metaY + 49, { width: 200 });

        // ── DIVIDER ──────────────────────────────────────────────────────────
        doc.moveTo(50, metaY + 80).lineTo(doc.page.width - 50, metaY + 80)
            .strokeColor("#E0E0E0").lineWidth(1).stroke();

        // ── ITEMS TABLE HEADER ───────────────────────────────────────────────
        const tableTop = metaY + 98;
        doc.rect(50, tableTop - 8, doc.page.width - 100, 24).fill(LIGHT_GRAY);
        doc.fillColor(TEXT_GRAY).fontSize(9).font("Helvetica-Bold")
            .text("ITEM / DESCRIPTION", 60, tableTop)
            .text("QTY", 330, tableTop, { width: 50, align: "center" })
            .text("UNIT PRICE", 390, tableTop, { width: 80, align: "right" })
            .text("TOTAL", 480, tableTop, { width: 70, align: "right" });

        // ── ITEMS ────────────────────────────────────────────────────────────
        let y = tableTop + 26;
        const items = sale.items && sale.items.length > 0
            ? sale.items
            : [{ name: sale.description || "Services", quantity: 1, unitPrice: sale.totalAmount }];

        items.forEach((item, idx) => {
            const lineTotal = (item.quantity || 1) * (item.unitPrice || 0);
            if (idx % 2 === 1) {
                doc.rect(50, y - 5, doc.page.width - 100, 20).fill("#FAFAFA");
            }
            doc.fillColor(PRIMARY).font("Helvetica").fontSize(9)
                .text(item.name || item.description || "Item", 60, y, { width: 265 })
                .text(String(item.quantity || 1), 330, y, { width: 50, align: "center" })
                .text(`₦${(item.unitPrice || 0).toLocaleString()}`, 390, y, { width: 80, align: "right" })
                .text(`₦${lineTotal.toLocaleString()}`, 480, y, { width: 70, align: "right" });
            y += 22;
        });

        // ── TOTALS ───────────────────────────────────────────────────────────
        y += 10;
        doc.moveTo(50, y).lineTo(doc.page.width - 50, y).strokeColor("#E0E0E0").lineWidth(0.5).stroke();
        y += 12;

        const paidAmount = (sale.payments || []).reduce((s, p) => s + p.amount, 0);
        const balance = sale.totalAmount - paidAmount;

        const totalsX = 390;
        const totalsWidth = doc.page.width - 50 - totalsX;

        doc.fillColor(TEXT_GRAY).fontSize(9).font("Helvetica")
            .text("Subtotal:", totalsX, y, { width: totalsWidth, align: "right" });
        doc.fillColor(PRIMARY).font("Helvetica-Bold")
            .text(`₦${sale.totalAmount.toLocaleString()}`, totalsX, y, { width: totalsWidth, align: "right" });
        y += 18;

        if (paidAmount > 0) {
            doc.fillColor(TEXT_GRAY).font("Helvetica").text("Amount Paid:", totalsX, y, { width: totalsWidth, align: "right" });
            doc.fillColor("#27AE60").font("Helvetica-Bold").text(`-₦${paidAmount.toLocaleString()}`, totalsX, y, { width: totalsWidth, align: "right" });
            y += 18;
        }

        // Balance Due box
        doc.rect(totalsX - 10, y - 4, totalsWidth + 10, 28).fill(balance <= 0 ? "#27AE60" : ACCENT);
        doc.fillColor("white").fontSize(10).font("Helvetica-Bold")
            .text(balance <= 0 ? "FULLY PAID ✓" : "BALANCE DUE:", totalsX, y + 4, { width: totalsWidth, align: "right" });
        if (balance > 0) {
            doc.text(`₦${balance.toLocaleString()}`, totalsX, y + 4, { width: totalsWidth - 5, align: "right" });
        }
        y += 40;

        // ── BANK DETAILS ─────────────────────────────────────────────────────
        const bank = business?.bankDetails;
        if (bank && bank.accountName && bank.accountNumber) {
            doc.fontSize(8).fillColor(TEXT_GRAY).font("Helvetica-Bold").text("PAYMENT DETAILS", 50, y);
            y += 14;
            doc.fontSize(9).fillColor(PRIMARY).font("Helvetica")
                .text(`Bank: ${bank.bankName || ""}  |  Account: ${bank.accountNumber}  |  Name: ${bank.accountName}`, 50, y);
            y += 20;
        }

        // ── PAYMENT LINK ─────────────────────────────────────────────────────
        if (balance > 0 && sale.invoiceNumber) {
            doc.moveTo(50, y).lineTo(doc.page.width - 50, y).strokeColor("#E0E0E0").lineWidth(0.5).stroke();
            y += 12;
            doc.fontSize(9).fillColor(TEXT_GRAY).font("Helvetica")
                .text("Pay online:", 50, y);
            doc.fillColor(ACCENT).text(
                `${APP_URL}/i/${sale.invoiceNumber}`,
                50, y + 12,
                { link: `${APP_URL}/i/${sale.invoiceNumber}`, underline: true }
            );
            y += 34;
        }

        // ── FOOTER ───────────────────────────────────────────────────────────
        const footerY = doc.page.height - 50;
        doc.moveTo(50, footerY - 10).lineTo(doc.page.width - 50, footerY - 10)
            .strokeColor("#E0E0E0").lineWidth(0.5).stroke();
        doc.fontSize(7).fillColor(TEXT_GRAY)
            .text("Generated by Kredibly · usekredibly.com · Your Digital Business Partner 🛡️", 50, footerY, { align: "center" });

        doc.end();
    });
};

/**
 * Uploads a PDF buffer to Cloudinary and returns the secure URL.
 * @param {Buffer} pdfBuffer
 * @param {string} invoiceNumber - Used as Cloudinary public_id
 * @returns {Promise<string>} Cloudinary URL
 */
const uploadPDFToCloudinary = (pdfBuffer, invoiceNumber) => {
    return new Promise((resolve, reject) => {
        const publicId = `kredibly/invoices/${invoiceNumber.replace(/[^a-zA-Z0-9-]/g, "_")}`;
        const stream = cloudinary.uploader.upload_stream(
            {
                resource_type: "raw",
                public_id: publicId,
                format: "pdf",
                overwrite: true,
                type: "upload"
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
 * Generates invoice PDF and uploads to Cloudinary.
 * Returns the download URL.
 */
const generateAndUploadInvoicePDF = async (sale, business) => {
    try {
        const buffer = await generateInvoicePDFBuffer(sale, business);
        const url = await uploadPDFToCloudinary(buffer, sale.invoiceNumber || `inv_${sale._id}`);
        console.log(`📄 Invoice PDF uploaded: ${url}`);
        return url;
    } catch (err) {
        console.error("❌ PDF Generation/Upload Error:", err.message);
        return null;
    }
};

module.exports = { generateInvoicePDFBuffer, uploadPDFToCloudinary, generateAndUploadInvoicePDF };
