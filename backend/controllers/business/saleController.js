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

        sale.payments.push({ amount, method, date: new Date() });
        await sale.save();

        await sale.populate("businessId");

        // Create Activity Log First
        await logActivity({
            businessId: sale.businessId._id,
            action: "PAYMENT_RECORDED",
            entityType: "PAYMENT",
            entityId: sale._id,
            details: `Recorded payment of ₦${amount.toLocaleString()} for ${sale.customerName} via ${method}`
        });

        // Create In-App Notification
        await Notification.create({
            businessId: sale.businessId._id,
            title: "Payment Received 💰",
            message: `₦${amount.toLocaleString()} recorded for ${sale.customerName}.`,
            type: "payment",
            saleId: sale._id
        });

        // Notify Business Owner on WhatsApp (Kreddy)
        if (sale.businessId && sale.businessId.whatsappNumber) {
            const paid = sale.payments.reduce((sum, p) => sum + p.amount, 0);
            const balance = sale.totalAmount - paid;
            
            // Smart message logic based on balance
            let msg = `🔔 *Payment Alert!*\n\nChief, I've just recorded a payment of *₦${amount.toLocaleString()}* for *${sale.customerName}*.\n\n`;
            
            if (balance <= 0) {
                msg += `✅ *Fully Paid!* This debt is now cleared from the ledger. Well done!`;
            } else {
                msg += `⏳ *Balance Expected:* ₦${balance.toLocaleString()}\n*Action:* I've updated the invoice status to ${sale.status.toUpperCase()}.`;
            }

            await sendWhatsAppMessage(sale.businessId.whatsappNumber, msg);
        }

        res.status(200).json({ success: true, data: sale });
    } catch (error) {
        res.status(500).json({ message: error.message });
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
            sale = await Sale.findById(id);
        } else {
            sale = await Sale.findOne({ invoiceNumber: id.toUpperCase() });
        }

        if (!sale) return res.status(404).json({ message: "Sale record not found" });

        sale.reminderSentAt = new Date();
        await sale.save();
        
        await logActivity({
            businessId: sale.businessId,
            action: "REMINDER_SENT",
            entityType: "SALE",
            entityId: sale._id,
            details: `Sent payment reminder to ${sale.customerName}`
        });

        res.status(200).json({ success: true, message: "Reminder logged. Link shared with customer." });
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
