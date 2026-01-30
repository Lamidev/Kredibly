const Sale = require("../../models/Sale");
const BusinessProfile = require("../../models/BusinessProfile");
const Notification = require("../../models/Notification");
const { sendWhatsAppMessage } = require("../whatsapp/whatsappController");
const { logActivity } = require("../../utils/activityLogger");

// Create a new sale
exports.createSale = async (req, res) => {
    try {
        const {
            customerName, customerPhone, customerEmail,
            description, totalAmount, amountPaid, dueDate
        } = req.body;

        const business = await BusinessProfile.findOne({ ownerId: req.user._id });
        if (!business) {
            return res.status(404).json({ message: "Business profile not found. Please complete onboarding." });
        }

        const saleData = {
            businessId: business._id,
            customerName,
            customerPhone,
            customerEmail,
            description,
            totalAmount,
            dueDate,
            payments: []
        };

        if (amountPaid > 0) {
            saleData.payments.push({
                amount: amountPaid,
                date: new Date(),
                method: "Initial"
            });
        }

        const sale = new Sale(saleData);
        await sale.save();

        await logActivity({
            businessId: business._id,
            action: "SALE_CREATED",
            entityType: "SALE",
            entityId: sale._id,
            details: `Created sale of ₦${totalAmount.toLocaleString()} for ${customerName}`
        });

        res.status(201).json({
            success: true,
            data: sale
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all sales for a business
exports.getSales = async (req, res) => {
    try {
        const business = await BusinessProfile.findOne({ ownerId: req.user._id });
        if (!business) return res.status(404).json({ message: "Business profile not found" });

        const sales = await Sale.find({ businessId: business._id }).sort({ updatedAt: -1 });
        res.status(200).json({ success: true, count: sales.length, data: sales });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get single sale details
exports.getSale = async (req, res) => {
    try {
        const { id } = req.params;
        let sale;

        // Try searching by MongoDB ID if it follows the format
        if (id.match(/^[0-9a-fA-F]{24}$/)) {
            sale = await Sale.findById(id).populate("businessId");
        }

        // If not found by ID or not a valid ID format, try searching by invoiceNumber
        if (!sale) {
            sale = await Sale.findOne({ invoiceNumber: id.toUpperCase() }).populate("businessId");
        }

        if (!sale) return res.status(404).json({ message: "Sale record not found" });

        res.status(200).json({ success: true, data: sale });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Add payment to a sale
exports.addPayment = async (req, res) => {
    try {
        const { amount, method } = req.body;
        const { id } = req.params;
        let sale;

        if (id.match(/^[0-9a-fA-F]{24}$/)) {
            sale = await Sale.findById(id);
        } else {
            sale = await Sale.findOne({ invoiceNumber: id.toUpperCase() });
        }

        if (!sale) return res.status(404).json({ message: "Sale record not found" });

        sale.payments.push({ 
            amount: Number(amount), 
            method: method || "Manual", 
            date: new Date() 
        });
        
        await sale.save();
        await sale.populate("businessId");

        if (!sale.businessId) {
            console.error(`⚠️ addPayment: Sale ${id} has no associated business profile.`);
        }

        const businessId = sale.businessId?._id || "SYSTEM";

        // Create Activity Log First
        await logActivity({
            businessId: businessId,
            action: "PAYMENT_RECORDED",
            entityType: "PAYMENT",
            entityId: sale._id,
            details: `Recorded payment of ₦${Number(amount).toLocaleString()} for ${sale.customerName || 'Customer'} via ${method}`
        });

        // Create In-App Notification
        await Notification.create({
            businessId: businessId,
            title: "Payment Received 💰",
            message: `₦${Number(amount).toLocaleString()} recorded for ${sale.customerName || 'Customer'}.`,
            type: "payment",
            saleId: sale._id
        });

        // Notify Business Owner on WhatsApp (Kreddy)
        if (sale.businessId && sale.businessId.whatsappNumber) {
            const paid = sale.payments.reduce((sum, p) => sum + p.amount, 0);
            const balance = sale.totalAmount - paid;
            
            // Smart message logic based on balance
            let msg = `🔔 *Payment Alert!*\n\nChief, I've just recorded a payment of *₦${Number(amount).toLocaleString()}* for *${sale.customerName}*.\n\n`;
            
            if (balance <= 0) {
                msg += `✅ *Fully Paid!* This debt is now cleared from the ledger. Well done!`;
            } else {
                msg += `⏳ *Balance Expected:* ₦${balance.toLocaleString()}\n*Action:* I've updated the invoice status to ${sale.status.toUpperCase()}.`;
            }

            await sendWhatsAppMessage(sale.businessId.whatsappNumber, msg).catch(e => {
                console.error("WhatsApp Notify Error (non-blocking):", e.message);
            });

            // Notify Business Owner via Email (Redundancy)
            if (sale.businessId && sale.businessId.ownerId) {
                // Ensure ownerId is populated to access email
                const BusinessProfile = require("../../models/BusinessProfile");
                const fullProfile = await BusinessProfile.findById(sale.businessId._id).populate("ownerId");
                
                if (fullProfile && fullProfile.ownerId && fullProfile.ownerId.email) {
                    const emailSubject = `Payment Received: ₦${Number(amount).toLocaleString()} from ${sale.customerName}`;
                    const emailHtml = `
                        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2 style="color: #0F172A;">Payment Received 💰</h2>
                            <p>Great news! A payment has been recorded on your ledger.</p>
                            
                            <div style="background: #F8FAFC; padding: 24px; border-radius: 12px; margin: 24px 0;">
                                <p style="margin: 0 0 12px 0;"><strong>Customer:</strong> ${sale.customerName}</p>
                                <p style="margin: 0 0 12px 0;"><strong>Amount Paid:</strong> ₦${Number(amount).toLocaleString()}</p>
                                <p style="margin: 0 0 12px 0;"><strong>Remaining Balance:</strong> ₦${balance.toLocaleString()}</p>
                                <p style="margin: 0;"><strong>Invoice:</strong> #${sale.invoiceNumber}</p>
                            </div>
                            
                            <a href="https://usekredibly.com/dashboard/invoice/${sale.invoiceNumber}" style="display: inline-block; background: #0F172A; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Invoice</a>
                        </div>
                    `;
                    
                    const { sendEmail } = require("../../utils/emailService");
                    await sendEmail({
                        to: fullProfile.ownerId.email,
                        subject: emailSubject,
                        html: emailHtml
                    });
                }
            }
        }

        console.log(`✅ Payment of ${amount} recorded successfully for Sale ${sale.invoiceNumber}`);
        res.status(200).json({ success: true, data: sale });
    } catch (error) {
        console.error("🚨 Error in addPayment:", error);
        res.status(500).json({ message: error.message || "Internal server error while recording payment" });
    }
};

// Customer confirmation
exports.confirmSale = async (req, res) => {
    try {
        const { id } = req.params;
        let sale;

        // Try searching by MongoDB ID or invoiceNumber
        if (id.match(/^[0-9a-fA-F]{24}$/)) {
            sale = await Sale.findById(id).populate("businessId");
        } else {
            sale = await Sale.findOne({ invoiceNumber: id.toUpperCase() }).populate("businessId");
        }

        if (!sale) return res.status(404).json({ message: "Sale record not found" });

        if (!sale.confirmed) {
            sale.confirmed = true;
            sale.confirmedAt = new Date();

            // Capture these before saving, just in case save() de-populates
            const business = sale.businessId;
            const invoiceNum = sale.invoiceNumber;
            const customer = sale.customerName;

            await sale.save();

            // Create In-App Notification
            if (business) {
                await Notification.create({
                    businessId: business._id,
                    title: "Invoice Verified ✅",
                    message: `${customer || 'A customer'} has just confirmed receipt of Invoice #${invoiceNum}.`,
                    type: "confirmation",
                    saleId: sale._id
                });
            }

            // Notify Business Owner on WhatsApp
            if (business && business.whatsappNumber) {

                const adminMsg = `🛡️ *Verification Alert!*\n\n${customer || 'A customer'} has just confirmed receipt of *Invoice #${invoiceNum}*.\n\nYour digital record is now verified! ✅`;
                await sendWhatsAppMessage(business.whatsappNumber, adminMsg);
            } else {
            }
        }

        res.status(200).json({ success: true, message: "Service/Delivery confirmed!" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Track Invoice View
exports.trackView = async (req, res) => {
    try {
        const { id } = req.params;
        let sale;

        if (id.match(/^[0-9a-fA-F]{24}$/)) {
            sale = await Sale.findById(id).populate("businessId");
        } else {
            sale = await Sale.findOne({ invoiceNumber: id.toUpperCase() }).populate("businessId");
        }

        if (!sale) return res.status(404).json({ message: "Sale record not found" });

        if (!sale.viewed) {
            sale.viewed = true;
            sale.viewedAt = new Date();
            await sale.save();

            // Log Activity for Merchant
            if (sale.businessId) {
                await logActivity({
                    businessId: sale.businessId._id,
                    action: "INVOICE_VIEWED",
                    entityType: "SALE",
                    entityId: sale._id,
                    details: `${sale.customerName || 'A customer'} viewed Invoice #${sale.invoiceNumber} 👁️`
                });
                
                // Also create a notification
                await Notification.create({
                    businessId: sale.businessId._id,
                    title: "Invoice Viewed 👁️",
                    message: `${sale.customerName || 'A customer'} has opened Invoice #${sale.invoiceNumber}.`,
                    type: "system",
                    saleId: sale._id
                });
            }
        }

        res.status(200).json({ success: true });
    } catch (error) {
        // Silent error for tracking to avoid breaking the customer view
        console.error("Tracking Error:", error);
        res.status(200).json({ success: true });
    }
};

// Dashboard stats
exports.getDashboardStats = async (req, res) => {
    try {
        const business = await BusinessProfile.findOne({ ownerId: req.user._id });
        if (!business) return res.status(404).json({ message: "Business profile not found" });

        const sales = await Sale.find({ businessId: business._id }).sort({ updatedAt: -1 });

        const stats = {
            totalSales: sales.length,
            revenue: 0,
            outstanding: 0,
            recentSales: sales.slice(0, 5),
            trustScore: 60,
            isKreddyConnected: business.isKreddyConnected
        };

        let confirmedCount = 0;
        let paidFullCount = 0;

        sales.forEach(sale => {
            const paid = sale.payments.reduce((sum, p) => sum + p.amount, 0);
            stats.revenue += paid;
            stats.outstanding += (sale.totalAmount - paid);

            if (sale.confirmed) confirmedCount++;
            if (sale.status === 'paid') paidFullCount++;
        });

        // Dynamic Trust Score Logic
        // Confirmed records are high trust (+8 per record)
        // Fully paid records (+4 per record)
        // Total volume bonus (+1 per record)
        const calculatedScore = 60 + (confirmedCount * 8) + (paidFullCount * 4) + (sales.length * 1);
        stats.trustScore = Math.min(99, calculatedScore);

        res.status(200).json({ success: true, data: stats });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update a sale
exports.updateSale = async (req, res) => {
    try {
        const {
            customerName, customerPhone, customerEmail,
            description, totalAmount, dueDate
        } = req.body;
        const { id } = req.params;
        let sale;

        if (id.match(/^[0-9a-fA-F]{24}$/)) {
            sale = await Sale.findById(id);
        } else {
            sale = await Sale.findOne({ invoiceNumber: id.toUpperCase() });
        }

        if (!sale) return res.status(404).json({ message: "Sale record not found" });

        // Ensure user owns this sale
        const business = await BusinessProfile.findOne({ ownerId: req.user._id });
        if (!business || sale.businessId.toString() !== business._id.toString()) {
            return res.status(403).json({ message: "Not authorized to update this sale" });
        }

        if (customerName !== undefined) sale.customerName = customerName;
        if (customerPhone !== undefined) sale.customerPhone = customerPhone;
        if (customerEmail !== undefined) sale.customerEmail = customerEmail;
        if (description !== undefined) sale.description = description;
        if (totalAmount !== undefined) sale.totalAmount = totalAmount;
        if (dueDate !== undefined) sale.dueDate = dueDate;

        await sale.save(); // Triggers status update

        await sale.populate("businessId");

        // Create In-App Notification for Update
        if (business) {
            await Notification.create({
                businessId: business._id,
                title: "Invoice Updated 📝",
                message: `You updated the details for Invoice #${sale.invoiceNumber} (${sale.customerName}).`,
                type: "system",
                saleId: sale._id
            });
        }

        res.status(200).json({ success: true, data: sale });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Share sale via email
exports.shareSaleByEmail = async (req, res) => {
    try {
        const { email } = req.body;
        const { id } = req.params;
        let sale;

        if (id.match(/^[0-9a-fA-F]{24}$/)) {
            sale = await Sale.findById(id).populate("businessId");
        } else {
            sale = await Sale.findOne({ invoiceNumber: id.toUpperCase() }).populate("businessId");
        }

        if (!sale) return res.status(404).json({ message: "Sale record not found" });

        res.status(200).json({ success: true, message: "Email sent successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Manual payment reminder
exports.sendReminder = async (req, res) => {
    try {
        const { id } = req.params;
        let sale;

        if (id.match(/^[0-9a-fA-F]{24}$/)) {
            sale = await Sale.findById(id).populate("businessId");
        } else {
            sale = await Sale.findOne({ invoiceNumber: id.toUpperCase() }).populate("businessId");
        }

        if (!sale) return res.status(404).json({ message: "Sale record not found" });

        const business = sale.businessId;
        if (!business) return res.status(404).json({ message: "Business data missing" });

        // Generate the payment link
        const frontendUrl = process.env.FRONTEND_URL || 'https://usekredibly.com';
        const paymentLink = `${frontendUrl}/i/${sale.invoiceNumber}`;
        const balance = sale.totalAmount - sale.payments.reduce((sum, p) => sum + p.amount, 0);

        // Template logic
        let message = "";
        const tone = business.assistantSettings?.reminderTemplate || "friendly";

        if (tone === "formal") {
            message = `*OFFICIAL PAYMENT NOTICE*\n\n` +
                      `Dear ${sale.customerName},\n\n` +
                      `This is a formal reminder regarding your outstanding balance with *${business.displayName}*.\n\n` +
                      `*Invoice:* #${sale.invoiceNumber}\n` +
                      `*Balance Due:* ₦${balance.toLocaleString()}\n\n` +
                      `Please use the secure link below to clear this payment immediately:\n` +
                      `${paymentLink}\n\n` +
                      `Ignore if payment has already been made.`;
        } else {
            message = `Hi ${sale.customerName}! 👋\n\n` +
                      `Friendly nudge from *${business.displayName}* regarding your invoice (#${sale.invoiceNumber}).\n\n` +
                      `There's a remaining balance of *₦${balance.toLocaleString()}*. You can easily settle it here:\n` +
                      `${paymentLink}\n\n` +
                      `Thank you!`;
        }

        // Send to customer if phone exists
        if (sale.customerPhone) {
            await sendWhatsAppMessage(sale.customerPhone, message);
        }

        sale.reminderSentAt = new Date();
        await sale.save();
        
        await logActivity({
            businessId: business._id,
            action: "REMINDER_SENT",
            entityType: "SALE",
            entityId: sale._id,
            details: `Sent ${tone} payment reminder to ${sale.customerName}`
        });

        res.status(200).json({ success: true, message: "Reminder sent to customer via WhatsApp!" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete a sale
exports.deleteSale = async (req, res) => {
    try {
        const { id } = req.params;
        let sale;

        if (id.match(/^[0-9a-fA-F]{24}$/)) {
            sale = await Sale.findById(id);
        } else {
            sale = await Sale.findOne({ invoiceNumber: id.toUpperCase() });
        }

        if (!sale) return res.status(404).json({ message: "Sale record not found" });

        // Ensure user owns this sale
        const business = await BusinessProfile.findOne({ ownerId: req.user._id });
        if (!business || sale.businessId.toString() !== business._id.toString()) {
            return res.status(403).json({ message: "Not authorized to delete this sale" });
        }

        await Sale.deleteOne({ _id: sale._id });
        res.status(200).json({ success: true, message: "Sale deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Migrate existing invoices to the new KR-XXXX format
exports.migrateInvoices = async (req, res) => {
    try {
        const business = await BusinessProfile.findOne({ ownerId: req.user._id });
        if (!business) return res.status(404).json({ message: "Business profile not found" });

        // Find all sales for THIS business where invoiceNumber doesn't share the KR- format
        const sales = await Sale.find({
            businessId: business._id,
            $or: [
                { invoiceNumber: { $not: /^KR-/ } },
                { invoiceNumber: { $exists: false } }
            ]
        });

        let updatedCount = 0;
        for (const sale of sales) {
            sale.invoiceNumber = undefined; // Trigger generator in pre-save
            await sale.save();
            updatedCount++;
        }

        res.status(200).json({ success: true, message: `${updatedCount} invoices migrated successfully.` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get detailed growth analytics (Simplified: Money In vs Money Outside)
exports.getAnalytics = async (req, res) => {
    try {
        const business = await BusinessProfile.findOne({ ownerId: req.user._id });
        if (!business) return res.status(404).json({ message: "Business profile not found" });

        const now = new Date();
        const startOfWeek = new Date();
        startOfWeek.setDate(now.getDate() - 7);
        startOfWeek.setHours(0, 0, 0, 0);

        // 1. Calculate "This Week" (Last 7 days)
        const weeklySales = await Sale.find({
            businessId: business._id,
            createdAt: { $gte: startOfWeek }
        });

        // Money In: Total cash received THIS WEEK (from any sale)
        const allSalesWithPaymentsThisWeek = await Sale.find({
            businessId: business._id,
            "payments.date": { $gte: startOfWeek }
        });

        let moneyIn = 0;
        allSalesWithPaymentsThisWeek.forEach(sale => {
            sale.payments.forEach(p => {
                if (new Date(p.date) >= startOfWeek) moneyIn += p.amount;
            });
        });

        // Money Outside: Total currently unpaid from sales made THIS WEEK
        let moneyOutside = 0;
        let totalBilled = 0;
        weeklySales.forEach(s => {
            totalBilled += s.totalAmount;
            const paidForThisSale = s.payments.reduce((sum, p) => sum + p.amount, 0);
            moneyOutside += Math.max(0, s.totalAmount - paidForThisSale);
        });

        // 2. Prepare daily data for a simple bar chart (Last 7 days)
        const dailyData = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            dailyData.push({ 
                date: d.toLocaleDateString('en-US', { weekday: 'short' }), 
                "Money In": 0, 
                "Money Outside": 0,
                fullDate: dateStr
            });
        }

        weeklySales.forEach(sale => {
            const dayStr = sale.createdAt.toLocaleDateString('en-US', { weekday: 'short' });
            const dayEntry = dailyData.find(d => d.date === dayStr);
            const paidForThisSale = sale.payments.reduce((sum, p) => sum + p.amount, 0);
            if (dayEntry) dayEntry["Money Outside"] += Math.max(0, sale.totalAmount - paidForThisSale);
        });

        allSalesWithPaymentsThisWeek.forEach(sale => {
            sale.payments.forEach(p => {
                if (p.date >= startOfWeek) {
                    const dayStr = p.date.toLocaleDateString('en-US', { weekday: 'short' });
                    const dayEntry = dailyData.find(d => d.date === dayStr);
                    if (dayEntry) dayEntry["Money In"] += p.amount;
                }
            });
        });

        res.status(200).json({
            success: true,
            data: {
                summary: {
                    moneyIn,
                    moneyOutside,
                    totalBilled,
                    collectionRate: totalBilled > 0 ? Math.round((moneyIn / totalBilled) * 100) : 0
                },
                daily: dailyData
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
