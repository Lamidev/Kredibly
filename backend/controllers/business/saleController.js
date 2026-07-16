const Sale = require("../../models/Sale");
const BusinessProfile = require("../../models/BusinessProfile");
const Notification = require("../../models/Notification");
const { sendWhatsAppMessage, sendWhatsAppAlert, sendWhatsAppTemplate } = require("../whatsapp/whatsappController");
const { logActivity } = require("../../utils/activityLogger");

const { isPlanActive } = require('../../utils/planGate');

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

        // 🛡️ PLAN GATE: Block new record creation on inactive/cancelled plans.
        // NOTE: read operations, addPayment, and invoice webhooks are always allowed.
        if (!isPlanActive(business)) {
            return res.status(403).json({
                success: false,
                code: 'PLAN_INACTIVE',
                message: 'Your plan has ended. Reactivate to continue creating records.',
                planStatus: business.planStatus,
                reactivateUrl: '/settings'
            });
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
            sale = await Sale.findById(safeId).populate("businessId", "displayName logoUrl phoneNumber whatsappNumber bankDetails entityType address plan prefersGatewayFeeAbsorption");
        }

        // If not found by _id, try searching by invoiceNumber
        if (!sale) {
            sale = await Sale.findOne({ 
                invoiceNumber: safeId.toUpperCase()
            }).populate("businessId", "displayName logoUrl phoneNumber whatsappNumber bankDetails entityType address plan prefersGatewayFeeAbsorption");
        }

        if (!sale) return res.status(404).json({ message: "Sale record not found" });

        // Ensure businessId has a default for prefersGatewayFeeAbsorption if missing
        if (sale.businessId && sale.businessId.prefersGatewayFeeAbsorption === undefined) {
            sale.businessId.prefersGatewayFeeAbsorption = true;
        }

        // SECURITY: If bank details were recently changed (24h lock), note it in logs
        if (sale.businessId?.bankDetails?.bankDetailsLockUntil && new Date() < sale.businessId.bankDetails.bankDetailsLockUntil) {
            console.warn(`🛡️ Payout Hold Active for ${sale.businessId.displayName}. Bank details recently changed.`);
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
            title: "Payment Received",
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
                msg += `*Fully Paid!* This debt is now cleared from the ledger. Well done!`;
            } else {
                msg += `*Balance Expected:* ₦${balance.toLocaleString()}\n*Action:* I've updated the invoice status to ${sale.status.toUpperCase()}.`;
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
                            <h2 style="color: #0F172A;">Payment Received</h2>
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
                    title: "Invoice Verified",
                    message: `${customer || 'A customer'} has just confirmed receipt of Invoice #${invoiceNum}.`,
                    type: "confirmation",
                    saleId: sale._id
                });
            }

            // Notify Business Owner on WhatsApp
            if (business && business.whatsappNumber) {

                const adminMsg = `${customer || 'A customer'} has just confirmed receipt of *Invoice #${invoiceNum}*.\n\nYour digital record is now verified.`;
                await sendWhatsAppAlert(business.whatsappNumber, "Verification Alert", adminMsg, invoiceNum);
            } else {
            }
        }

        res.status(200).json({ success: true, message: "Service/Delivery confirmed!" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// V2: trackView removed (browser invoice page view tracking is gone)

// Dashboard stats
exports.getDashboardStats = async (req, res) => {
    try {
        const business = await BusinessProfile.findOne({ ownerId: req.user._id });
        if (!business) return res.status(404).json({ message: "Business profile not found" });

        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0,0,0,0);

        // 🚀 High-Performance Aggregation Pipeline
        const statsAggregation = await Sale.aggregate([
            { $match: { businessId: business._id } },
            {
                $facet: {
                    "overall": [
                        {
                            $group: {
                                _id: null,
                                totalSales: { $sum: 1 },
                                revenue: { $sum: { $sum: "$payments.amount" } },
                                totalAmount: { $sum: "$totalAmount" },
                                kreddyRevenue: {
                                    $sum: {
                                        $reduce: {
                                            input: {
                                                $filter: {
                                                    input: "$payments",
                                                    as: "p",
                                                    cond: { $in: ["$$p.method", ['Paystack', 'Nomba', 'Kredibly Online', 'Squad']] }
                                                }
                                            },
                                            initialValue: 0,
                                            in: { $add: ["$$value", "$$this.amount"] }
                                        }
                                    }
                                },
                                confirmedCount: { $sum: { $cond: [{ $eq: ["$confirmed", true] }, 1, 0] } },
                                paidFullCount: { $sum: { $cond: [{ $eq: ["$status", "paid"] }, 1, 0] } }
                            }
                        }
                    ],
                    "monthlyCount": [
                        { $match: { createdAt: { $gte: startOfMonth } } },
                        { $count: "count" }
                    ],
                    "recentSales": [
                        { $sort: { updatedAt: -1 } },
                        { $limit: 5 }
                    ]
                }
            }
        ]);

        const results = statsAggregation[0].overall[0] || { totalSales: 0, revenue: 0, totalAmount: 0, kreddyRevenue: 0, confirmedCount: 0, paidFullCount: 0 };
        const monthlyCount = statsAggregation[0].monthlyCount[0]?.count || 0;
        const recentSales = statsAggregation[0].recentSales || [];

        // Dynamic Trust Score Logic (Bank-Grade)
        const calculatedScore = 60 + (results.confirmedCount * 8) + (results.paidFullCount * 4) + (results.totalSales * 1);
        
        const stats = {
            totalSales: results.totalSales,
            monthlySalesCount: monthlyCount,
            revenue: results.revenue,
            kreddyRevenue: results.kreddyRevenue,
            outstanding: Math.max(0, results.totalAmount - results.revenue),
            recentSales,
            trustScore: Math.min(99, calculatedScore),
            isKreddyConnected: business.isKreddyConnected
        };

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
                title: "Invoice Updated",
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

// V2: shareSaleByEmail removed (email invoicing is gone)

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
        const balance = sale.totalAmount - sale.payments.reduce((sum, p) => sum + p.amount, 0);

        // Template logic
        let message = "";
        const tone = business.assistantSettings?.reminderTemplate || "friendly";

        if (tone === "formal") {
            message = `Hi ${sale.customerName}, this is a reminder from ${business.displayName || "us"} about Invoice #${sale.invoiceNumber}.\n\nAmount outstanding: ₦${balance.toLocaleString()}\nDue: ${sale.dueDate ? new Date(sale.dueDate).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "On Receipt"}\n\nWhat would you like to do?`;
        } else {
            message = `Hi ${sale.customerName}, this is a reminder from ${business.displayName || "us"} about Invoice #${sale.invoiceNumber}.\n\nAmount outstanding: ₦${balance.toLocaleString()}\nDue: ${sale.dueDate ? new Date(sale.dueDate).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "On Receipt"}\n\nWhat would you like to do?`;
        }

        const { sendChaseToCustomer } = require("../../utils/customerInvoiceService");
        const result = await sendChaseToCustomer(sale._id, business._id, message);

        if (result.success) {
            sale.reminderSentAt = new Date();
            await sale.save();
            
            if (business.monthlyUsage) {
                business.monthlyUsage.reminders = (business.monthlyUsage.reminders || 0) + 1;
                await business.save();
            }

            res.status(200).json({ success: true, message: "Kreddy has sent a reminder directly to your customer! 🤝" });
        } else {
            res.status(500).json({ message: result.error || "Failed to send reminder to customer" });
        }
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

        // Emit socket event for real-time dashboard updates
        const io = req.app.get("socketio");
        if (io) {
            io.to(business._id.toString().toLowerCase()).emit("sale_updated", {
                action: "delete",
                saleId: sale._id,
                invoiceNumber: sale.invoiceNumber
            });
        }

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
        const startOfWeek = new Date(now);
        const day = startOfWeek.getDay(); 
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); 
        startOfWeek.setDate(diff);
        startOfWeek.setHours(0, 0, 0, 0);

        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

        // 🚀 Multi-stage Analytics Pipeline
        const analytics = await Sale.aggregate([
            { $match: { businessId: business._id } },
            {
                $facet: {
                    "weeklySales": [
                        { $match: { createdAt: { $gte: startOfWeek } } },
                        {
                            $project: {
                                totalAmount: 1,
                                paid: { $sum: "$payments.amount" },
                                createdAt: 1
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                totalBilled: { $sum: "$totalAmount" },
                                moneyOutside: { $sum: { $max: [0, { $subtract: ["$totalAmount", "$paid"] }] } },
                                dailyOutside: {
                                    $push: {
                                        day: { $subtract: [{ $dayOfWeek: "$createdAt" }, 1] }, // JS Day Fix
                                        amount: { $max: [0, { $subtract: ["$totalAmount", "$paid"] }] }
                                    }
                                }
                            }
                        }
                    ],
                    "weeklyPayments": [
                        { $unwind: "$payments" },
                        { $match: { "payments.date": { $gte: startOfWeek } } },
                        {
                            $group: {
                                _id: null,
                                moneyIn: { $sum: "$payments.amount" },
                                dailyIn: {
                                    $push: {
                                        day: { $subtract: [{ $dayOfWeek: "$payments.date" }, 1] },
                                        amount: "$payments.amount"
                                    }
                                }
                            }
                        }
                    ]
                }
            }
        ]);

        const salesResults = analytics[0].weeklySales[0] || { totalBilled: 0, moneyOutside: 0, dailyOutside: [] };
        const paymentResults = analytics[0].weeklyPayments[0] || { moneyIn: 0, dailyIn: [] };

        // 📊 Map to Mon-Sun structure
        const dailyData = days.map(day => ({ date: day, "Money In": 0, "Money Outside": 0 }));

        salesResults.dailyOutside.forEach(item => {
            let idx = item.day === 0 ? 6 : item.day - 1; // Map Sun(0) to index 6, Mon(1) to 0
            if (dailyData[idx]) dailyData[idx]["Money Outside"] += item.amount;
        });

        paymentResults.dailyIn.forEach(item => {
            let idx = item.day === 0 ? 6 : item.day - 1;
            if (dailyData[idx]) dailyData[idx]["Money In"] += item.amount;
        });

        res.status(200).json({
            success: true,
            data: {
                summary: {
                    moneyIn: paymentResults.moneyIn,
                    moneyOutside: salesResults.moneyOutside,
                    totalBilled: salesResults.totalBilled,
                    collectionRate: (paymentResults.moneyIn + salesResults.moneyOutside) > 0 
                        ? Math.round((paymentResults.moneyIn / (paymentResults.moneyIn + salesResults.moneyOutside)) * 100) 
                        : 0
                },
                daily: dailyData
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Approve customer payment extension from Web Dashboard
exports.approveExtension = async (req, res) => {
    try {
        const { id } = req.params;
        const sale = await Sale.findById(id).populate("businessId");
        if (!sale) return res.status(404).json({ message: "Sale record not found" });

        // Ensure user owns this sale
        const business = await BusinessProfile.findOne({ ownerId: req.user._id });
        if (!business || sale.businessId._id.toString() !== business._id.toString()) {
            return res.status(403).json({ message: "Not authorized" });
        }

        if (sale.lifecycleStatus !== "EXTENSION_REQUESTED") {
            return res.status(400).json({ message: "No pending extension request" });
        }

        const days = sale.requestedExtensionDays || 7;
        const newDueDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

        // We can reuse the helper from customerInvoiceService
        const { handleMerchantApproveExtension } = require("../../utils/customerInvoiceService");
        const sessionData = {
            customerPhone: sale.deliveredToPhone || sale.customerPhone,
            customerName: sale.customerName,
            invoiceNumber: sale.invoiceNumber,
            requestedDays: days,
            newDueDate: newDueDate.toISOString(),
            businessId: business._id.toString()
        };

        const result = await handleMerchantApproveExtension(sale._id, sessionData);
        if (result.success) {
            return res.status(200).json({ success: true, message: "Extension approved successfully" });
        } else {
            return res.status(500).json({ message: "Failed to approve extension" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Reject customer payment extension from Web Dashboard
exports.rejectExtension = async (req, res) => {
    try {
        const { id } = req.params;
        const sale = await Sale.findById(id).populate("businessId");
        if (!sale) return res.status(404).json({ message: "Sale record not found" });

        // Ensure user owns this sale
        const business = await BusinessProfile.findOne({ ownerId: req.user._id });
        if (!business || sale.businessId._id.toString() !== business._id.toString()) {
            return res.status(403).json({ message: "Not authorized" });
        }

        if (sale.lifecycleStatus !== "EXTENSION_REQUESTED") {
            return res.status(400).json({ message: "No pending extension request" });
        }

        const { handleMerchantRejectExtension } = require("../../utils/customerInvoiceService");
        const sessionData = {
            customerPhone: sale.deliveredToPhone || sale.customerPhone,
            customerName: sale.customerName,
            invoiceNumber: sale.invoiceNumber,
            businessId: business._id.toString()
        };

        const result = await handleMerchantRejectExtension(sale._id, sessionData);
        if (result.success) {
            return res.status(200).json({ success: true, message: "Extension rejected successfully" });
        } else {
            return res.status(500).json({ message: "Failed to reject extension" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
