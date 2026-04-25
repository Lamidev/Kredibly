const Sale = require("../../models/Sale");
const BusinessProfile = require("../../models/BusinessProfile");
const Notification = require("../../models/Notification");
const { sendWhatsAppMessage, sendWhatsAppAlert, sendWhatsAppTemplate } = require("../whatsapp/whatsappController");
const { logActivity } = require("../../utils/activityLogger");

// Create a new sale
exports.createSale = async (req, res) => {
    try {
        const {
            customerName, customerPhone, customerEmail,
            description, totalAmount, amountPaid, dueDate, invoiceType
        } = req.body;

        const business = await BusinessProfile.findOne({ ownerId: req.user._id });
        if (!business) {
            return res.status(404).json({ message: "Business profile not found. Please complete onboarding." });
        }

        // Plan Limit Enforcement (Monthly Reset for Hustlers)
        const isHustler = business.plan === 'hustler';
        const isTrialing = business.planStatus === 'trialing';

        if (isHustler && !isTrialing) {
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            const invoiceCount = await Sale.countDocuments({ 
                businessId: business._id,
                createdAt: { $gte: startOfMonth }
            });

            if (invoiceCount >= 10) {
                return res.status(403).json({ 
                    success: false, 
                    message: "Monthly Entry Limit Reached! Upgrade to Oga for unlimited records.",
                    code: "LIMIT_REACHED"
                });
            }
        }

        const saleData = {
            businessId: business._id,
            customerName,
            customerPhone,
            customerEmail,
            description,
            totalAmount,
            dueDate,
            invoiceType: invoiceType || 'billing',
            payments: []
        };

        if (amountPaid > 0) {
            saleData.payments.push({
                amount: parseFloat(amountPaid),
                date: new Date(),
                method: invoiceType === 'record' ? 'Past Settlement' : 'Initial'
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
        const safeId = String(id);
        let sale;

        // Try searching by MongoDB ID if it follows the format
        if (safeId.match(/^[0-9a-fA-F]{24}$/)) {
            sale = await Sale.findById(safeId).populate("businessId", "displayName logoUrl phoneNumber whatsappNumber bankDetails entityType address paystackSubaccountCode plan prefersGatewayFeeAbsorption");
        }

        // If not found by ID or not a valid ID format, try searching by invoiceNumber or publicSlug
        if (!sale) {
            sale = await Sale.findOne({ 
                $or: [
                    { invoiceNumber: safeId.toUpperCase() },
                    { publicSlug: safeId }
                ]
            }).populate("businessId", "displayName logoUrl phoneNumber whatsappNumber bankDetails entityType address paystackSubaccountCode plan prefersGatewayFeeAbsorption");
        }

        if (!sale) return res.status(404).json({ message: "Sale record not found" });

        // Ensure businessId has a default for prefersGatewayFeeAbsorption if missing
        if (sale.businessId && sale.businessId.prefersGatewayFeeAbsorption === undefined) {
            sale.businessId.prefersGatewayFeeAbsorption = true;
        }

        // SECURITY: If bank details were recently changed (24h lock), hide subaccount code
        // This forces payments to Kredibly escrow instead of the new (risky) bank account.
        if (sale.businessId?.bankDetails?.bankDetailsLockUntil && new Date() < sale.businessId.bankDetails.bankDetailsLockUntil) {
            console.warn(`🛡️ Payout Hold Active for ${sale.businessId.displayName}. Redirecting to Escrow.`);
            sale.businessId.paystackSubaccountCode = ""; 
        }

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
            let msg = `I've just recorded a payment of *₦${Number(amount).toLocaleString()}* for *${sale.customerName}*.\n\n`;
            
            if (balance <= 0) {
                msg += `✅ *Fully Paid!* This debt is now cleared from the ledger. Well done!`;
            } else {
                msg += `⏳ *Balance Expected:* ₦${balance.toLocaleString()}\n*Action:* I've updated the invoice status to ${sale.status.toUpperCase()}.`;
            }

            await sendWhatsAppAlert(sale.businessId.whatsappNumber, "Chief", msg, sale.invoiceNumber).catch(e => {
                console.error("WhatsApp Notify Error (non-blocking):", e.message);
            });

            // Notify Business Owner via Email (Redundancy)
            if (sale.businessId && sale.businessId.ownerId) {
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
                    }).catch(e => console.error("Email Error:", e.message));
                }
            }
        }


        // Emit socket event
        try {
            const { getIO } = require('../../utils/socket');
            const io = getIO();
            if (io && sale.businessId) {
                const paidNow = sale.payments.reduce((sum, p) => sum + p.amount, 0);
                const currentBalance = sale.totalAmount - paidNow;
                io.to(sale.businessId._id.toString()).emit('sale_updated', {
                    saleId: sale._id,
                    balance: currentBalance,
                    amountPaid: paidNow
                });
            }
        } catch (socketErr) {
            console.error("❌ Socket emit error in addPayment:", socketErr.message);
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

                const adminMsg = `${customer || 'A customer'} has just confirmed receipt of *Invoice #${invoiceNum}*.\n\nYour digital record is now verified! ✅`;
                await sendWhatsAppAlert(business.whatsappNumber, "Verification Alert", adminMsg, invoiceNum);
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

        if (!sale) return res.status(404).json({ success: false, message: "Sale record not found" });

        const now = new Date();
        const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
        
        // Smart decision: Should we alert the merchant again?
        // Trigger if: It's the first view EVER, OR it's been 30+ mins since last recorded view
        const isFirstView = !sale.viewed;
        const isNewEngagement = !sale.lastOpenedAt || sale.lastOpenedAt < thirtyMinutesAgo;

        if (isFirstView) {
            sale.viewed = true;
            sale.viewedAt = now;
        }
        
        // Always increment count and update timestamp
        sale.viewCount = (sale.viewCount || 0) + 1;
        sale.lastOpenedAt = now;
        
        // IMPORTANT: Use findOneAndUpdate or markModified if save() gives issues with virtuals
        await sale.save();

        // SMART NOTIFICATION FILTER:
        // 1. Log Activity: Always show in the 'Activity Feed' for first view OR return visits (busy dashboard)
        // 2. Notification Bell: ONLY ring for the very first view (prevent noise)
        if (sale.businessId) {
            // Log for Activity Feed (First view or 30min+ interval)
            if (isFirstView || isNewEngagement) {
                const countSuffix = sale.viewCount > 1 ? ` (Visit #${sale.viewCount})` : "";
                
                await logActivity({
                    businessId: sale.businessId._id,
                    action: "INVOICE_VIEWED",
                    entityType: "SALE",
                    entityId: sale._id,
                    details: `${sale.customerName || 'A customer'} viewed Invoice #${sale.invoiceNumber}${countSuffix} 👁️`
                });
            }

            // Create Notification Badge: ONLY for the very first milestone
            if (isFirstView) {
                await Notification.create({
                    businessId: sale.businessId._id,
                    title: "Invoice Viewed 👁️",
                    message: `${sale.customerName || 'A customer'} just opened Invoice #${sale.invoiceNumber}.`,
                    type: "system",
                    saleId: sale._id
                });
            }
        }

        res.status(200).json({ success: true, viewCount: sale.viewCount });
    } catch (error) {
        console.error("Tracking Error:", error);
        res.status(200).json({ success: true }); // Silent fail to not break user UI
    }
};

// Dashboard stats
exports.getDashboardStats = async (req, res) => {
    try {
        const business = await BusinessProfile.findOne({ ownerId: req.user._id });
        if (!business) return res.status(404).json({ message: "Business profile not found" });

        const sales = await Sale.find({ businessId: business._id }).sort({ updatedAt: -1 });

        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0,0,0,0);
        const monthlySalesCount = await Sale.countDocuments({ 
            businessId: business._id, 
            createdAt: { $gte: startOfMonth } 
        });

        const stats = {
            totalSales: sales.length,
            monthlySalesCount,
            revenue: 0,
            kreddyRevenue: 0, 
            outstanding: 0,
            recentSales: sales.slice(0, 5),
            trustScore: 60,
            isKreddyConnected: business.isKreddyConnected
        };

        let confirmedCount = 0;
        let paidFullCount = 0;

        sales.forEach(sale => {
            const payments = (sale.payments || []);
            const paid = payments.reduce((sum, p) => sum + p.amount, 0);
            
            const kreddyPaid = payments
                .filter(p => ['Paystack', 'Nomba', 'Kredibly Online', 'Squad'].includes(p.method))
                .reduce((sum, p) => sum + p.amount, 0);

            stats.revenue += paid;
            stats.kreddyRevenue += kreddyPaid;
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

        sale.lastLinkSentAt = new Date();
        await sale.save();

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

        // HUDDLE/LIMIT ENFORCEMENT
        if (business.plan === 'hustler' && business.monthlyUsage && business.monthlyUsage.reminders >= 5) {
            return res.status(403).json({
                success: false,
                message: "You have reached your free limit of 5 Reminders for this month. Upgrade to Oga to unlock unlimited automated reminders."
            });
        }

        // Generate the payment link
        const frontendUrl = process.env.FRONTEND_URL || 'https://usekredibly.com';
        const paymentLink = `${frontendUrl}/i/${sale.invoiceNumber}`;
        const balance = sale.totalAmount - sale.payments.reduce((sum, p) => sum + p.amount, 0);

        // Template logic
        let message = "";
        const tone = business.assistantSettings?.reminderTemplate || "friendly";

        if (tone === "formal") {
            message = `*OFFICIAL PAYMENT NOTICE*\n\n` +
                      `This is a formal reminder regarding your outstanding balance.\n\n` +
                      `*Invoice:* #${sale.invoiceNumber}\n` +
                      `*Balance Due:* ₦${balance.toLocaleString()}\n\n` +
                      `Ignore if payment has already been made.`;
        } else {
            message = `Friendly nudge regarding your invoice (#${sale.invoiceNumber}).\n\n` +
                      `There's a remaining balance of *₦${balance.toLocaleString()}*.\n\n` +
                      `Thank you!`;
        }

        // Send to customer if phone exists
        if (sale.customerPhone) {
            const components = [
                {
                    type: "body",
                    parameters: [
                        { type: "text", text: sale.customerName || "Customer" },
                        { type: "text", text: message },
                        { type: "text", text: business.displayName }
                    ]
                },
                {
                    type: "button",
                    sub_type: "url",
                    index: "0",
                    parameters: [
                        { type: "text", text: sale.invoiceNumber }
                    ]
                }
            ];
            await sendWhatsAppTemplate(sale.customerPhone, 'kreddy_customer_invoice', components).catch(e => {
                console.error("WhatsApp Link Error:", e.message);
            });
        }

        sale.reminderSentAt = new Date();
        sale.lastLinkSentAt = new Date();
        await sale.save();
        
        if (business.monthlyUsage) {
            business.monthlyUsage.reminders = (business.monthlyUsage.reminders || 0) + 1;
            await business.save();
        }

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

        // DELETE Associated Reminders (Keep things clean)
        const Reminder = require("../../models/Reminder");
        await Reminder.deleteMany({ saleId: sale._id });

        await Sale.deleteOne({ _id: sale._id });
        
        await logActivity({
            businessId: business._id,
            action: "SALE_DELETED",
            entityType: "SALE",
            details: `Deleted invoice #${sale.invoiceNumber} for ${sale.customerName}`
        });

        res.status(200).json({ success: true, message: "Sale deleted successfully and reminders cleared." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Migrate existing invoices to the new KR-XXXX format
exports.migrateInvoices = async (req, res) => {
    try {
        const business = await BusinessProfile.findOne({ ownerId: req.user._id });
        if (!business) return res.status(404).json({ message: "Business profile not found" });

        // Find all sales for THIS business that don't match the new KR-XXXX-XXXX format
        const sales = await Sale.find({
            businessId: business._id,
            $or: [
                { invoiceNumber: { $not: /^KR-[A-Z0-9]{4}-[A-Z0-9]{4}$/ } },
                { invoiceNumber: { $exists: false } }
            ]
        });

        let updatedCount = 0;
        for (const sale of sales) {
            sale.invoiceNumber = undefined; // This will trigger the secure 8-char generator in the pre-save hook
            await sale.save();
            updatedCount++;
        }

        res.status(200).json({ success: true, message: `${updatedCount} invoices migrated to secure format.` });
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
