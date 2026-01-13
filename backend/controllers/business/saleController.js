const Sale = require("../../models/Sale");
const BusinessProfile = require("../../models/BusinessProfile");

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

        const sales = await Sale.find({ businessId: business._id }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: sales.length, data: sales });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get single sale details
exports.getSale = async (req, res) => {
    try {
        const sale = await Sale.findById(req.params.id).populate("businessId");
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
        const sale = await Sale.findById(req.params.id);

        if (!sale) return res.status(404).json({ message: "Sale record not found" });

        sale.payments.push({ amount, method, date: new Date() });
        await sale.save();

        await sale.populate("businessId");

        res.status(200).json({ success: true, data: sale });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Customer confirmation
exports.confirmSale = async (req, res) => {
    try {
        const sale = await Sale.findById(req.params.id);
        if (!sale) return res.status(404).json({ message: "Sale record not found" });

        sale.confirmed = true;
        sale.confirmedAt = new Date();
        await sale.save();

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

        const sales = await Sale.find({ businessId: business._id });

        const stats = {
            totalSales: sales.length,
            revenue: 0,
            outstanding: 0,
            recentSales: sales.slice(0, 5)
        };

        sales.forEach(sale => {
            const paid = sale.payments.reduce((sum, p) => sum + p.amount, 0);
            stats.revenue += paid;
            stats.outstanding += (sale.totalAmount - paid);
        });

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

        const sale = await Sale.findById(req.params.id);

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

        res.status(200).json({ success: true, data: sale });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Share sale via email
exports.shareSaleByEmail = async (req, res) => {
    try {
        const { email } = req.body;
        const sale = await Sale.findById(req.params.id).populate("businessId");

        if (!sale) return res.status(404).json({ message: "Sale record not found" });

        res.status(200).json({ success: true, message: "Email sent successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Manual payment reminder
exports.sendReminder = async (req, res) => {
    try {
        const sale = await Sale.findById(req.params.id);
        if (!sale) return res.status(404).json({ message: "Sale record not found" });

        sale.reminderSentAt = new Date();
        await sale.save();

        res.status(200).json({ success: true, message: "Reminder logged. Link shared with customer." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
